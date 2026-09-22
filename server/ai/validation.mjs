/**
 * What has to be true about a question before a learner is allowed to see it.
 *
 * A language model will happily return four options where one is blank, an answer
 * index of 4, an explanation that quietly introduces a statistic the document never
 * mentioned, or a "source" sentence it composed itself. None of those are visible as
 * defects on screen — they look exactly like a good question until a learner is marked
 * wrong for an answer that was never in the document. So everything the model returns
 * is treated as untrusted input and has to earn its way through this file.
 *
 * Pure functions only: no network, no environment, no provider. That is what makes the
 * whole accept/reject surface testable without an API key.
 *
 * The grounding check is the one that matters most, and it works by *replacement*
 * rather than by approval. The model's quoted "source" is never what gets stored: it
 * is used only to find which sentence of the uploaded document it was trying to quote,
 * and then the real sentence from the document is put in its place. Everything after
 * that — the answer check, the duplicate check, the passage a learner reads on the
 * results screen — runs against text that provably came out of their file.
 *
 * That matters because approval alone is too weak to trust. Matching is done on word
 * shingles so a model that re-spaces or re-punctuates a sentence still passes, but the
 * flip side is that a model which copies a sentence and changes one word inside it also
 * passes: swapping "twelve months" for "three months" costs two shingles out of
 * eighteen. Measured on the fixture document, reversing the document's central claim
 * still scores 0.833 and a swapped figure scores 0.867 — both far above any threshold
 * that would not also throw away good questions. Snapping back to the real sentence is
 * what makes that survivable: the lie cannot reach the learner's screen, and the
 * answer check downstream is comparing against the document rather than against the
 * model's own account of the document.
 */

/** Exactly four, because the quiz UI lays out four and the grader assumes four. */
export const OPTION_COUNT = 4;

/** Shorter than this is not a question, it is a fragment. */
export const MIN_QUESTION_CHARS = 20;
export const MIN_EXPLANATION_CHARS = 15;
export const MIN_SOURCE_CHARS = 25;

/** Longer than this is a model that has started writing an essay into a field. */
export const MAX_QUESTION_CHARS = 320;
export const MAX_OPTION_CHARS = 220;
export const MAX_EXPLANATION_CHARS = 600;
export const MAX_SOURCE_CHARS = 900;

/**
 * Fraction of the quoted source's word-shingles that must appear in one passage of the
 * document for that passage to count as the thing the model was quoting.
 *
 * 0.8 rather than 1.0 because a model that re-punctuates a sentence or drops a word or
 * two while copying it still keeps most of its ordered pairs, and those questions are
 * good. Dropping one interior word from a fifteen-word quote costs two pairs and scores
 * about 0.92; dropping three costs six and scores about 0.79, which is the point at which
 * it stops being a quote.
 *
 * The number is not a guess. Measured over all 29 hand-written fixture sources plus the
 * probe corpus, every legitimate quote scores exactly 1.000, because normalisation already
 * absorbs punctuation and case. The looser 0.6 this replaced bought no tolerance that was
 * ever used, and it did let a quote welded together from two distant sentences — "the base
 * year is 2012 in 1181 villages and 1114 urban markets every month" — score 0.615 against
 * the villages sentence alone.
 *
 * Read this as "which passage was it looking at", not as "is this passage true". It cannot
 * be the latter: one substituted word inside an otherwise verbatim quote still clears any
 * threshold a real quote could also clear. That is exactly why a match causes the real
 * passage to be substituted in, and why the answer checks below run against the
 * substituted text rather than against the model's copy of it.
 */
export const GROUNDING_THRESHOLD = 0.8;

/**
 * Scored per passage, not against the whole document at once.
 *
 * Against a set union of every shingle in a 60 000-character text, a "quote" could be
 * assembled from a phrase on page 1 and a phrase on page 40 and still score 1.0. Windows
 * of one and two consecutive sentences mean the words have to have been near each other.
 */
const SNAP_WINDOW_SENTENCES = 2;

/** How much of the correct answer has to be found in the passage that was quoted. */
export const ANSWER_SUPPORT_THRESHOLD = 0.5;

/** Word-pairs, so word order counts. Single words alone would let an invented sentence pass. */
const SHINGLE_SIZE = 2;

/**
 * Two questions this similar are the same question wearing different words, and a paper
 * that asks the same thing twice measures one thing while claiming to measure two.
 *
 * This catches near-verbatim repeats only, and that is all it can safely catch. Measured
 * on the fixture document, a reworded duplicate ("…base year *for* the … *this* note")
 * scores 0.556, while two genuinely different questions that share a sentence — 1181
 * villages against 1114 urban markets — score 0.545. Eleven thousandths apart. Lowering
 * this threshold to catch the first would delete the second, and silently dropping a
 * valid question is worse than printing a repetitive one. So wording similarity is left
 * where it is and the semantic case is handled by `factKey` below instead.
 */
export const DUPLICATE_THRESHOLD = 0.75;

export const QUESTION_KINDS = ['statement', 'cloze', 'numeric', 'identify', 'scenario'];

/**
 * Fold text down to the form two passages can be compared in: lowercase, no
 * punctuation, single spaces. Keeps digits, because a numeric question's whole point is
 * a figure and "7.2" must not become "72".
 *
 * The thousands separator is dropped before the general punctuation strip, not by it.
 * Statistical prose writes "1,181 villages" and a model quoting it will as often write
 * "1181"; leaving the comma to be replaced by a space would split one figure into the
 * two separate tokens "1" and "181", so the same number would fail to match itself.
 */
export function normalizeForMatch(value) {
  return String(value ?? '')
    .toLowerCase()
    .replace(/[‘’‚‛]/g, "'")
    .replace(/[“”„‟]/g, '"')
    .replace(/(\d),(?=\d\d\d(?!\d))/g, '$1')
    .replace(/[^a-z0-9.'"%\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Split into comparable word tokens.
 *
 * Punctuation is stripped from each end of a token but kept inside it, so the full stop
 * ending a sentence does not weld itself to the last word ("2012." would otherwise never
 * equal the answer "2012") while a decimal point survives ("7.2" stays "7.2").
 */
function words(value) {
  const normalized = normalizeForMatch(value);
  if (normalized === '') return [];
  return normalized
    .split(' ')
    .map((token) => token.replace(/^[.'"%-]+/, '').replace(/[.'"%-]+$/, ''))
    .filter((token) => token !== '');
}

/**
 * The form two short labels are compared in.
 *
 * `normalizeForMatch` keeps full stops so a decimal survives ("7.2" must not become
 * "72"), but that also means "Base year" and "Base year." compare as different strings —
 * and a model that emits both has handed the learner two identical-looking options, one
 * of which is scored wrong. Comparing token-by-token drops the punctuation at each end
 * of a word and keeps what is inside it, which settles both cases correctly.
 */
export function matchKey(value) {
  return words(value).join(' ');
}

/** Ordered word-pairs. Order is the point: it is what invented text cannot fake. */
export function shingles(value, size = SHINGLE_SIZE) {
  const list = words(value);
  if (list.length < size) return list.length === 0 ? new Set() : new Set([list.join(' ')]);
  const out = new Set();
  for (let index = 0; index + size <= list.length; index += 1) {
    out.add(list.slice(index, index + size).join(' '));
  }
  return out;
}

/** How much of `part` appears in `whole`, 0 to 1. Asymmetric on purpose. */
export function containmentRatio(part, whole) {
  const partShingles = part instanceof Set ? part : shingles(part);
  const wholeShingles = whole instanceof Set ? whole : shingles(whole);
  if (partShingles.size === 0) return 0;
  let hits = 0;
  for (const shingle of partShingles) {
    if (wholeShingles.has(shingle)) hits += 1;
  }
  return hits / partShingles.size;
}

/**
 * Does this short span actually occur in that text?
 *
 * Separate from `containmentRatio` because a bare answer like "2012" or "Laspeyres" is a
 * single word, and a single word can never appear in a set of word-*pairs*: the ratio
 * would be 0 for an answer that is plainly present, and every numeric question would be
 * silently thrown away. Short spans are therefore matched as an exact run of words, and
 * only longer ones fall back to the shingle ratio, where light rewording should still
 * pass.
 */
export function spanSupport(span, text) {
  const needle = words(span);
  const hay = words(text);
  if (needle.length === 0 || hay.length === 0) return 0;

  if (needle.length <= 3) {
    for (let start = 0; start + needle.length <= hay.length; start += 1) {
      let matched = true;
      for (let offset = 0; offset < needle.length; offset += 1) {
        if (hay[start + offset] !== needle[offset]) {
          matched = false;
          break;
        }
      }
      if (matched) return 1;
    }
    return 0;
  }

  return containmentRatio(span, text);
}

/** Symmetric overlap, for "are these two questions the same question". */
export function similarity(left, right) {
  const a = shingles(left);
  const b = shingles(right);
  if (a.size === 0 || b.size === 0) return 0;
  let shared = 0;
  for (const shingle of a) {
    if (b.has(shingle)) shared += 1;
  }
  return shared / (a.size + b.size - shared);
}

/**
 * The document as an ordered list of sentence-sized passages.
 *
 * Blank lines separate paragraphs; the single newlines *inside* a paragraph are hard
 * wrapping and are folded back into spaces before splitting. That ordering matters: PDF
 * extraction wraps a sentence across several lines, so splitting on newlines first would
 * cut "A change larger than 25 per cent triggers a validation query to the field / office
 * before the quotation is accepted." into two fragments, and the second one — which is
 * what a learner would then be shown as the passage their question came from — would
 * begin mid-clause.
 *
 * A heading sits in its own paragraph and so becomes its own short passage. That is
 * harmless rather than a hole: grounding is scored as a fraction of the *quotation's*
 * shingles, so a three-word heading can only score highly for a quotation that is itself
 * three words long, and a source that short is already refused by MIN_SOURCE_CHARS.
 */
export function documentSentences(documentText) {
  const raw = String(documentText ?? '').replace(/\r\n?/g, '\n');
  const sentences = [];
  for (const block of raw.split(/\n[ \t]*\n+/)) {
    const paragraph = block.replace(/\s+/g, ' ').trim();
    if (paragraph === '') continue;
    for (const piece of paragraph.split(/(?<=[.!?])\s+/)) {
      const sentence = piece.trim();
      if (sentence !== '') sentences.push(sentence);
    }
  }
  return sentences;
}

/**
 * The bare numeric figures in a string: "2012", "0.1", "25", "7.2".
 *
 * Deliberately digits only, not number-words. Including "one" and "four" would reject an
 * explanation that says "one of the four options", which is not a claim about the data at
 * all. The number-word swaps this leaves uncaught ("twelve months" → "three months") are
 * caught instead by the verbatim short-answer rule, where the whole answer has to occur in
 * the passage word for word.
 *
 * `normalizeForMatch` has already turned "1,181" into "1181", so a thousands-separated
 * figure and its bare form produce the same token here.
 */
export function digitsIn(value) {
  const out = new Set();
  const matches = normalizeForMatch(value).match(/\d+(?:\.\d+)?/g);
  if (matches) for (const match of matches) out.add(match);
  return out;
}

/**
 * Capitalisation that is not sentence punctuation is a name, and names can be checked.
 *
 * The digit rules above cover a fabricated *figure*. They do nothing about a fabricated
 * *institution*, and that turned out to be the larger hole: an explanation reading "The
 * World Bank mandated this after the Geneva Accord on statistical harmonisation" contains
 * no digits at all, so every check in this file used to wave it through and print it under
 * the question. An invented accord is worse than an invented percentage, because a learner
 * has no way to smell it.
 *
 * Grounding explanation *prose* wholesale is not possible — a legitimate explanation is a
 * paraphrase and scores about 0.11 against its own source sentence, so any containment rule
 * would reject nearly everything. Named entities are the part of a paraphrase that cannot
 * legitimately be new: an explanation may reword the document's argument freely, but it
 * cannot introduce an organisation, statute, place or scheme the document never named
 * without having made it up.
 *
 * Mid-sentence capitalisation is the signal, because in English prose it means a proper
 * noun almost without exception. A token that opens a sentence is skipped — "Because" is
 * capitalised only by position, and rejecting a question over it would be absurd — which
 * costs very little, since a fabricated multi-word name puts at least one of its words
 * somewhere other than first. Acronyms are the exception to the exception: two or more
 * capitals in one token ("MoSPI", "CPI", "NSSO") is a name wherever it sits.
 *
 * Roman numerals and single letters are exempt because "Statement II" and "Option B" are
 * question furniture, not claims about the world.
 */
const ENTITY_EXEMPT = new Set([
  'i', 'ii', 'iii', 'iv', 'v', 'vi', 'vii', 'viii', 'ix', 'x', 'xi', 'xii',
]);

function isSentenceStart(text, index) {
  for (let cursor = index - 1; cursor >= 0; cursor -= 1) {
    const character = text[cursor];
    // Whitespace and anything that can open a quotation are transparent: the word after
    // `("` is still whatever the character before the bracket made it.
    if (/[\s"'([{“‘]/.test(character)) continue;
    return /[.!?:;]/.test(character);
  }
  return true;
}

export function properNounsIn(value) {
  const text = String(value ?? '');
  const out = new Set();
  const pattern = /[A-Za-z][A-Za-z.'’-]*/g;
  let match;
  while ((match = pattern.exec(text)) !== null) {
    const token = match[0].replace(/[.'’-]+$/, '');
    if (token.length < 2) continue;
    if (!/^[A-Z]/.test(token)) continue;

    const capitals = (token.match(/[A-Z]/g) ?? []).length;
    const acronym = capitals >= 2;
    if (!acronym && isSentenceStart(text, match.index)) continue;

    const key = token.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (key.length < 2 || ENTITY_EXEMPT.has(key)) continue;
    out.add(key);
  }
  return out;
}

/**
 * Is this word in the document at all?
 *
 * Singular and possessive forms are folded together on purpose. The document writes "the
 * Accord" and an explanation may legitimately write "the Accord's terms" or "the Accords";
 * refusing over an inflection would be a false rejection, and inflection is not how a
 * fabrication hides. The comparison is case-insensitive against the document's own word
 * tokens, so it asks only "did this name occur", never "was it capitalised the same way".
 */
export function documentHasWord(word, documentIndex) {
  const set = documentIndex.wordSet;
  if (!set || word === '') return false;
  const bare = word.replace(/[^a-z0-9]/g, '');
  const forms = [word, bare, `${bare}s`, bare.replace(/s$/, ''), bare.replace(/'s$/, '')];
  return forms.some((form) => form !== '' && set.has(form));
}

/**
 * Precompute the document once.
 *
 * Every question is checked against the whole document, so building the shingle set per
 * question would re-tokenize a 100 000-character text a dozen times.
 *
 * `normalized`, `shingles` and `length` are kept for callers that predate snapping (the
 * test suite reads `shingles`); the newer fields — the sentence list, an inverted
 * shingle→sentence map used to keep snapping fast on a long document, the set of every
 * figure in the text, and the set of every word in it — are what `snapToDocument`, the
 * digit checks and the named-entity check run against.
 */
export function buildDocumentIndex(documentText) {
  const normalized = normalizeForMatch(documentText);
  const sentences = documentSentences(documentText);
  const sentenceShingles = sentences.map((sentence) => shingles(sentence));

  const shingleIndex = new Map();
  sentenceShingles.forEach((set, index) => {
    for (const shingle of set) {
      let bucket = shingleIndex.get(shingle);
      if (!bucket) {
        bucket = new Set();
        shingleIndex.set(shingle, bucket);
      }
      bucket.add(index);
    }
  });

  return {
    normalized,
    shingles: shingles(normalized),
    length: normalized.length,
    sentences,
    sentenceShingles,
    shingleIndex,
    digits: digitsIn(documentText),
    wordSet: new Set(words(documentText)),
  };
}

/**
 * Find which passage of the document the model was quoting, and return that real passage.
 *
 * This is the heart of the grounding rework. The model's quoted `source` is scored, by
 * word-shingle containment, against every window of one or two consecutive document
 * sentences — never against the document as a whole, because a "quote" stitched together
 * from page 1 and page 40 would score 1.0 against the union of every shingle in the text.
 * The best-scoring window at or above `GROUNDING_THRESHOLD` wins, and the function returns
 * that window's *real* text, which the caller stores in place of the model's string.
 *
 * Returns null when nothing clears the threshold — that is a source the document does not
 * contain, and the caller rejects the question.
 *
 * The point of returning real text rather than a yes/no is that a one-word lie inside an
 * otherwise verbatim quote ("twelve months" → "three months") clears the threshold, so a
 * yes/no would wave it through. Replacing the source means the lie never reaches the
 * learner and, more importantly, the answer check downstream runs against the document's
 * words rather than against the model's account of them.
 */
export function snapToDocument(source, documentIndex) {
  const sentences = documentIndex.sentences ?? [];
  if (sentences.length === 0) return null;

  const sourceShingles = shingles(source);
  if (sourceShingles.size === 0) return null;

  // Only sentences that share at least one shingle with the source are worth scoring, and
  // a two-sentence window can begin one sentence earlier than any single hit.
  const starts = new Set();
  for (const shingle of sourceShingles) {
    const bucket = documentIndex.shingleIndex?.get(shingle);
    if (!bucket) continue;
    for (const index of bucket) {
      starts.add(index);
      if (index > 0) starts.add(index - 1);
    }
  }

  let best = null;
  for (const start of starts) {
    for (let span = 1; span <= SNAP_WINDOW_SENTENCES; span += 1) {
      const end = start + span;
      if (end > sentences.length) break;
      const windowText = sentences.slice(start, end).join(' ');
      const ratio = containmentRatio(sourceShingles, windowText);
      if (
        best === null ||
        ratio > best.ratio ||
        (ratio === best.ratio && windowText.length < best.text.length)
      ) {
        best = { ratio, text: windowText };
      }
    }
  }

  if (!best || best.ratio < GROUNDING_THRESHOLD) return null;
  return best.text;
}

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim() !== '';
}

/**
 * The JSON a provider returned, or a reason it is unusable.
 *
 * Models are asked for pure JSON and still wrap it in a ```json fence, prepend "Here
 * are your questions:", or emit a trailing comma. The fence and the preamble are cheap
 * to survive and are stripped here; anything still unparseable is a failed attempt.
 */
export function parseProviderJson(raw) {
  if (!isNonEmptyString(raw)) return { ok: false, reason: 'The AI provider returned an empty response.' };

  let text = raw.trim();

  // ```json ... ``` or ``` ... ```
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (fenced && fenced[1]) text = fenced[1].trim();

  // Any prose before or after the object: take the outermost braces.
  if (!text.startsWith('{')) {
    const first = text.indexOf('{');
    const last = text.lastIndexOf('}');
    if (first === -1 || last <= first) {
      return { ok: false, reason: 'The AI provider did not return JSON.' };
    }
    text = text.slice(first, last + 1);
  }

  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    return { ok: false, reason: 'The AI provider returned malformed JSON.' };
  }

  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    return { ok: false, reason: 'The AI provider returned JSON that is not an object.' };
  }
  if (!Array.isArray(parsed.questions)) {
    return { ok: false, reason: 'The AI response has no "questions" array.' };
  }
  return { ok: true, questions: parsed.questions };
}

/**
 * One question against one document.
 *
 * Returns the cleaned question or the single reason it was refused. The reason is for
 * the server log and for the repair prompt — it is never shown to a learner, who only
 * ever needs to know how many usable questions came back.
 */
export function validateQuestion(raw, documentIndex, options = {}) {
  const { allowedTopics = null } = options;

  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return { ok: false, reason: 'not an object' };
  }

  const question = typeof raw.question === 'string' ? raw.question.trim() : '';
  const explanation = typeof raw.explanation === 'string' ? raw.explanation.trim() : '';
  const source = typeof raw.source === 'string' ? raw.source.trim() : '';
  const topic = typeof raw.topic === 'string' ? raw.topic.trim() : '';

  if (question.length < MIN_QUESTION_CHARS) return { ok: false, reason: 'question is missing or too short' };
  if (question.length > MAX_QUESTION_CHARS) return { ok: false, reason: 'question is too long' };

  if (!Array.isArray(raw.options)) return { ok: false, reason: 'options is not an array' };
  if (raw.options.length !== OPTION_COUNT) {
    return { ok: false, reason: `expected ${OPTION_COUNT} options, got ${raw.options.length}` };
  }

  const optionList = [];
  for (const option of raw.options) {
    if (typeof option !== 'string') return { ok: false, reason: 'an option is not a string' };
    const trimmed = option.trim();
    if (trimmed === '') return { ok: false, reason: 'an option is empty' };
    if (trimmed.length > MAX_OPTION_CHARS) return { ok: false, reason: 'an option is too long' };
    optionList.push(trimmed);
  }

  // Case- and punctuation-insensitive, because "Base year" and "base year." are the
  // same option to a reader and a free right answer to anyone who notices.
  const seen = new Set();
  for (const option of optionList) {
    const key = matchKey(option);
    if (key === '') return { ok: false, reason: 'an option is empty once normalized' };
    if (seen.has(key)) return { ok: false, reason: 'two options are the same' };
    seen.add(key);
  }

  const correct = raw.correctIndex;
  if (!Number.isInteger(correct) || correct < 0 || correct >= OPTION_COUNT) {
    return { ok: false, reason: `correctIndex must be an integer 0-${OPTION_COUNT - 1}` };
  }

  if (explanation.length < MIN_EXPLANATION_CHARS) return { ok: false, reason: 'explanation is missing or too short' };
  if (explanation.length > MAX_EXPLANATION_CHARS) return { ok: false, reason: 'explanation is too long' };

  if (source.length < MIN_SOURCE_CHARS) return { ok: false, reason: 'source passage is missing or too short' };
  if (source.length > MAX_SOURCE_CHARS) return { ok: false, reason: 'source passage is too long' };

  if (topic === '') return { ok: false, reason: 'topic is missing' };
  if (topic.length > 80) return { ok: false, reason: 'topic is too long' };
  if (allowedTopics && allowedTopics.length > 0) {
    const known = allowedTopics.some((candidate) => matchKey(candidate) === matchKey(topic));
    if (!known) return { ok: false, reason: `topic "${topic}" is not one of the topics extracted from the document` };
  } else {
    // `topics` is optional on the wire and the route defaults a missing one to [], so this
    // branch is reachable from any client — including one that simply omits the field. It
    // used to skip the check entirely, which meant an invented topic was accepted whenever
    // the allow-list happened to be empty, and the topic is not cosmetic: it is what the
    // per-topic bands and the study plan are built from. With no list to check against, the
    // document itself is the fallback authority — every substantial word of the topic has to
    // be a word the document uses.
    const topicWords = words(topic);
    const substantial = topicWords.filter((word) => word.length >= 3);
    const checked = substantial.length > 0 ? substantial : topicWords;
    if (checked.length === 0 || checked.some((word) => !documentHasWord(word, documentIndex))) {
      return { ok: false, reason: `topic "${topic}" uses words the document does not` };
    }
  }

  // `kind` is untrusted, and it used to *select which checks ran* — an unrecognised value
  // was quietly coerced to 'statement', the least-checked kind, so a numeric question with
  // a swapped figure could skip the answer check simply by mislabelling itself. Now a
  // present-but-unknown kind is refused outright, and the kind only ever narrows the
  // answer check, never disables it: the digit and short-answer rules below run whatever
  // the label says.
  let kind;
  if (raw.kind === undefined || raw.kind === null || raw.kind === '') {
    kind = 'statement';
  } else if (QUESTION_KINDS.includes(raw.kind)) {
    kind = raw.kind;
  } else {
    return { ok: false, reason: `unknown question kind "${String(raw.kind).slice(0, 40)}"` };
  }

  // The claim the whole feature rests on: this came out of the learner's document. Snapping
  // returns the *real* passage the model was quoting, which then replaces the model's
  // string for every check below and for what the learner eventually reads.
  const grounded = snapToDocument(source, documentIndex);
  if (grounded === null) {
    return { ok: false, reason: 'the quoted source passage is not in the uploaded document' };
  }
  const groundedSource = grounded.trim();
  if (groundedSource.length > MAX_SOURCE_CHARS) {
    return { ok: false, reason: 'the matched source passage is too long' };
  }

  const answer = optionList[correct];

  // A short answer — a year, a name, a "three months" — has to occur in the real passage
  // word for word, whatever the kind claims to be. This is the rule that survives the
  // number-word swaps a digit check cannot see ("twelve months" → "three months"), and it
  // is the primary answer-grounding check; the figure check below is a backstop for the
  // longer answers this one does not cover.
  const answerWords = words(answer);
  if (answerWords.length > 0 && answerWords.length <= 3) {
    if (spanSupport(answer, groundedSource) < 1) {
      return { ok: false, reason: 'the correct answer does not appear in the quoted source' };
    }
  } else if (kind === 'numeric' || kind === 'cloze' || kind === 'identify') {
    // A longer answer for a kind whose answer is meant to be a span of the document, rather
    // than a paraphrase, still has to be substantially present in the real passage.
    if (spanSupport(answer, groundedSource) < ANSWER_SUPPORT_THRESHOLD) {
      return { ok: false, reason: 'the correct answer does not appear in the quoted source' };
    }
  }

  // A figure in the answer has to be a figure in the passage it was drawn from. The span
  // checks above miss a swapped number inside a longer paraphrase ("larger than 41 per
  // cent" keeps enough shingles to clear containment); this catches it, because 41 is
  // nowhere in the real sentence.
  const groundedDigits = digitsIn(groundedSource);
  for (const digit of digitsIn(answer)) {
    if (!groundedDigits.has(digit)) {
      return { ok: false, reason: 'the correct answer states a figure the source does not' };
    }
  }

  // The explanation and the stem may not introduce a figure the document never stated —
  // a fabricated "41.7 per cent" in the explanation is exactly the quiet hallucination the
  // length checks above cannot see. Checked against the whole document, not just this one
  // passage, because an explanation may legitimately reference a figure from a neighbour.
  for (const digit of digitsIn(explanation)) {
    if (!documentIndex.digits?.has(digit)) {
      return { ok: false, reason: 'the explanation states a figure the document does not' };
    }
  }
  for (const digit of digitsIn(question)) {
    if (!documentIndex.digits?.has(digit)) {
      return { ok: false, reason: 'the question states a figure the document does not' };
    }
  }

  // A figure is not the only thing an explanation can invent. A named entity — an
  // organisation, statute, place or scheme — that the document never mentions is a
  // fabrication the digit checks cannot see ("The World Bank mandated this after the
  // Geneva Accord" carries no digits at all). Every proper noun and acronym in the
  // explanation and the stem must occur somewhere in the document. Checked against the
  // whole document, not this one passage, because an explanation may legitimately name a
  // body introduced a paragraph earlier.
  for (const name of properNounsIn(explanation)) {
    if (!documentHasWord(name, documentIndex)) {
      return { ok: false, reason: 'the explanation names something the document does not' };
    }
  }
  for (const name of properNounsIn(question)) {
    if (!documentHasWord(name, documentIndex)) {
      return { ok: false, reason: 'the question names something the document does not' };
    }
  }

  // The stem must not contain its own answer.
  if (kind !== 'cloze' && normalizeForMatch(question).includes(normalizeForMatch(answer))) {
    return { ok: false, reason: 'the question text gives away its own answer' };
  }

  // Difficulty gate: when the learner asked for a specific level, a question that is clearly
  // easier than requested is rejected so it can be regenerated. This is what makes the
  // easy/medium/hard control real rather than a label — a recall/fill-in-the-blank question
  // cannot be served under a "hard" request. Only rejects when the estimate is two full bands
  // below the request (hard→easy), which keeps the exact-count contract achievable while
  // still stopping the egregious "asked hard, got trivial" case.
  const requested = options.requestedDifficulty;
  if (requested === 'easy' || requested === 'medium' || requested === 'hard') {
    const estBand = estimateDifficulty({ question, options: optionList, kind });
    if (DIFFICULTY_RANK[requested] - DIFFICULTY_RANK[estBand] >= 2) {
      return { ok: false, reason: `question is too easy for the requested "${requested}" level` };
    }
  }

  return {
    ok: true,
    question: { question, options: optionList, correctIndex: correct, topic, kind, explanation, source: groundedSource, difficulty: estimateDifficulty({ question, options: optionList, kind }) },
  };
}

/** easy < medium < hard, as a comparable rank. */
export const DIFFICULTY_RANK = Object.freeze({ easy: 0, medium: 1, hard: 2 });

/**
 * Estimate a question's real cognitive difficulty from its wording — independent of any
 * label the model attached, which cannot be trusted. This is a deterministic heuristic, not
 * a model: it reads the signals that separate recall from reasoning.
 *
 *   easy   — a fill-in-the-blank, a definition, or a short "what is X" recall question.
 *   hard   — asks the reader to reason: apply, compare, predict a consequence, diagnose,
 *            judge the best option, or work through a scenario ("if…", "suppose…", "how would").
 *   medium — everything in between.
 *
 * It is intentionally conservative (a question is only "hard" when it clearly demands
 * reasoning), so it under-claims rather than over-claims difficulty.
 */
export function estimateDifficulty(question) {
  const stem = String(question?.question ?? '');
  const lower = stem.toLowerCase();
  const words = (lower.match(/[a-z0-9]+/g) ?? []).length;

  // Fill-in-the-blank and bare recall are recall-level by construction.
  if (question?.kind === 'cloze' || stem.includes('_____')) return 'easy';

  const reasoningCues = [
    'why', 'how would', 'how does', 'if ', 'suppose', 'predict', 'consequence', 'would happen',
    'compare', 'difference between', 'most appropriate', 'best describes', 'which would', 'best explains',
    'implication', 'scenario', 'given that', 'as a result', 'what happens when', 'reason for', 'in order to',
    'leads to', 'affect', 'effect of', 'diagnose', 'evaluate', 'justify',
  ];
  const recallCues = [
    'what is', 'what are', 'define', 'which of the following is', 'according to', 'is called',
    'refers to', 'the term for', 'which term', 'name the', 'identify the',
  ];

  const reasoning = reasoningCues.filter((c) => lower.includes(c)).length;
  const recall = recallCues.some((c) => lower.includes(c));

  // Two or more reasoning cues, or one plus a substantial scenario stem, reads as hard.
  if (reasoning >= 2 || (reasoning >= 1 && words >= 22)) return 'hard';
  if (reasoning >= 1) return 'medium';
  if (recall || words < 12) return 'easy';
  return 'medium';
}

/**
 * What a question is *about*, independent of how it is worded.
 *
 * The wording of a question is a poor identity for it. A model asked twice about the same
 * chunk — which the repair pass does by design — will re-ask the same fact in different
 * words, and `similarity` cannot tell that apart from two different questions drawn from
 * one sentence (see DUPLICATE_THRESHOLD). What does tell them apart is the pair of things
 * a question is pinned to: the passage it quotes and the answer it expects.
 *
 * Same passage and same answer is the same fact, however the stem is phrased. A different
 * answer is a different fact even when the passage and almost every word is shared, which
 * is what keeps "1181 villages" and "1114 urban markets" as two questions rather than one.
 */
export function factKey(question) {
  const source = matchKey(question.source ?? '');
  const answer = matchKey((question.options ?? [])[question.correctIndex] ?? '');
  if (source === '' || answer === '') return '';
  return `${source} ${answer}`;
}

/**
 * Validate a batch and drop repeats.
 *
 * Deduplication happens here rather than per question because it is the only check that
 * needs to see the others. `existing` carries questions already accepted from earlier
 * chunks, so chunk three cannot re-ask what chunk one already asked.
 */
export function validateBatch(rawQuestions, documentIndex, options = {}) {
  const { existing = [], allowedTopics = null, requestedDifficulty = null } = options;
  const accepted = [];
  const rejected = [];
  const kept = [...existing];
  const facts = new Set();
  for (const question of kept) {
    const key = factKey(question);
    if (key !== '') facts.add(key);
  }

  for (const raw of Array.isArray(rawQuestions) ? rawQuestions : []) {
    const outcome = validateQuestion(raw, documentIndex, { allowedTopics, requestedDifficulty });
    if (!outcome.ok) {
      rejected.push({ reason: outcome.reason, question: typeof raw?.question === 'string' ? raw.question.slice(0, 120) : '' });
      continue;
    }

    const candidate = outcome.question;
    const clash = kept.find((other) => similarity(other.question, candidate.question) >= DUPLICATE_THRESHOLD);
    if (clash) {
      rejected.push({ reason: 'duplicate of another question in this paper', question: candidate.question.slice(0, 120) });
      continue;
    }

    const key = factKey(candidate);
    if (key !== '' && facts.has(key)) {
      rejected.push({ reason: 'asks the same fact as another question in this paper', question: candidate.question.slice(0, 120) });
      continue;
    }

    if (key !== '') facts.add(key);
    kept.push(candidate);
    accepted.push(candidate);
  }

  return { accepted, rejected };
}

/**
 * Choose the final paper: spread across topics before topping up.
 *
 * Taking the first N would let one verbose section of a document own the whole quiz,
 * which then reports a confident per-topic score for a topic the learner answered once.
 * One question per topic goes in first, then a second per topic, and so on.
 */
export function selectQuestions(questions, target) {
  if (questions.length <= target) return [...questions];

  const byTopic = new Map();
  for (const question of questions) {
    const key = matchKey(question.topic);
    if (!byTopic.has(key)) byTopic.set(key, []);
    byTopic.get(key).push(question);
  }

  const picked = [];
  const queues = [...byTopic.values()];
  let progress = true;
  while (picked.length < target && progress) {
    progress = false;
    for (const queue of queues) {
      if (picked.length >= target) break;
      const next = queue.shift();
      if (next) {
        picked.push(next);
        progress = true;
      }
    }
  }
  return picked;
}
