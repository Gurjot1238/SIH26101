/**
 * The exact-count backstop: document-grounded questions built without a model.
 *
 * This is NOT machine learning and does not pretend to be. It is a deterministic,
 * zero-dependency generator that builds cloze ("fill the blank") multiple-choice
 * questions out of sentences that are literally in the uploaded document. Its only job is
 * to make the exact-count contract honest: when the AI provider returns fewer good
 * questions than the learner asked for (16 of 20, say), and a targeted re-ask to the model
 * still falls short, this fills the remainder from the same material rather than showing a
 * short quiz or a silent failure.
 *
 *   Why this is safe to mix in with AI questions
 *
 * Every question it produces is put through the SAME `validateBatch` gate the AI questions
 * pass — same grounding check, same four-distinct-options rule, same duplicate defence,
 * same topic allow-list. A backfill question that cannot clear that gate is discarded
 * exactly like a model's would be. So the floor on quality is identical; the only
 * difference is where the raw candidate came from.
 *
 *   How a cloze question is grounded by construction
 *
 * The source is a real document sentence, copied verbatim, so the grounding check snaps it
 * back to itself and scores 1.0. The correct answer is a word blanked *out of that
 * sentence*, so the "short answer must appear in the source" rule is satisfied by
 * construction. The distractors are real terms drawn from elsewhere in the document (other
 * numbers for a numeric blank, other salient words for a word blank), so they are plausible
 * and of the right type, never nonsense — and they are checked to be distinct from the
 * answer and from each other. The explanation is built only from the answer and connective
 * words, so it can introduce no figure or name the document does not already contain.
 *
 * The generator is exhaustive and deterministic: it walks the document's sentences in
 * order, and within each sentence tries each blankable term in a fixed priority (numbers,
 * then proper nouns, then long content words). That means the same document always yields
 * the same backfill questions, which is what makes the test suite able to assert an exact
 * final count.
 */

import {
  MAX_QUESTION_CHARS,
  documentSentences,
  matchKey,
  validateBatch,
} from './validation.mjs';

/** Words too common or too structural to make a fair blank or a useful distractor. */
const STOPWORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'but', 'of', 'to', 'in', 'on', 'at', 'by', 'for', 'with',
  'from', 'as', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'that', 'this', 'these',
  'those', 'it', 'its', 'their', 'they', 'them', 'which', 'who', 'whom', 'whose', 'what',
  'when', 'where', 'why', 'how', 'not', 'no', 'so', 'than', 'then', 'each', 'every', 'any',
  'all', 'some', 'more', 'most', 'such', 'has', 'have', 'had', 'can', 'may', 'must', 'will',
  'would', 'should', 'could', 'into', 'over', 'under', 'between', 'within', 'against', 'per',
  'about', 'before', 'after', 'during', 'while', 'because', 'if', 'whether', 'both', 'either',
]);

const BLANK = '_____';
/** Cloze stem template — kept short so a long source sentence still fits MAX_QUESTION_CHARS. */
const STEM_PREFIX = 'Fill in the blank from the material: ';

/** Is this token a number (integer, decimal, or percent-ish figure)? */
function isNumeric(core) {
  return /^\d[\d.,]*%?$/.test(core);
}

/** Tokens of a sentence with their character offsets, so a blank replaces the word in place. */
function tokenize(sentence) {
  const out = [];
  const pattern = /[A-Za-z0-9][A-Za-z0-9.,'%-]*/g;
  let match;
  while ((match = pattern.exec(sentence)) !== null) {
    // Trim trailing punctuation off the core (so "2012." blanks as "2012" and the answer
    // is "2012"), keeping interior marks like the decimal point and the thousands comma.
    const raw = match[0];
    const core = raw.replace(/^[.,'%-]+/, '').replace(/[.,'-]+$/, '');
    if (core === '') continue;
    const startInRaw = raw.indexOf(core);
    const start = match.index + startInRaw;
    out.push({ core, start, end: start + core.length });
  }
  return out;
}

/** Replace exactly the term's core span with the blank marker, leaving punctuation intact. */
function blankOut(sentence, term) {
  return `${sentence.slice(0, term.start)}${BLANK}${sentence.slice(term.end)}`;
}

/** A word worth blanking: a number, a proper noun, or a substantial content word. */
function isBlankable(core) {
  if (isNumeric(core)) return true;
  const key = core.toLowerCase();
  if (STOPWORDS.has(key)) return false;
  if (/^[A-Z][a-z]+/.test(core)) return true; // proper-noun-ish
  return core.length >= 5; // a long content word
}

/** Priority so the most testable blanks come first: numbers, then names, then long words. */
function blankPriority(core) {
  if (isNumeric(core)) return 0;
  if (/^[A-Z]/.test(core)) return 1;
  return 2;
}

/**
 * Build the two distractor pools from the whole document, de-duplicated, keeping the first
 * spelling seen. Numeric pool for numeric blanks, word pool for word blanks — so a
 * distractor is always the same *type* as the answer and never gives itself away.
 */
function buildPools(sentences) {
  const numbers = new Map(); // matchKey -> display
  const wordsPool = new Map();
  for (const sentence of sentences) {
    for (const { core } of tokenize(sentence)) {
      if (isNumeric(core)) {
        const key = matchKey(core);
        if (key !== '' && !numbers.has(key)) numbers.set(key, core);
      } else {
        const key = matchKey(core);
        if (key === '' || STOPWORDS.has(core.toLowerCase()) || core.length < 4) continue;
        if (!wordsPool.has(key)) wordsPool.set(key, core);
      }
    }
  }
  return { numbers: [...numbers.values()], words: [...wordsPool.values()] };
}

/**
 * Three distractors of the right type, distinct from the answer and each other, and drawn
 * from ELSEWHERE in the document — never from the answer's own sentence, because a word
 * lifted from the same sentence often makes the blank grammatically obvious ("_____ price
 * index" with distractors "price"/"index"). Candidates closest in length to the answer come
 * first, so the four options look alike, and the answer cannot be picked out by its shape.
 */
function pickDistractors(answer, pool, excludeKeys) {
  const answerKey = matchKey(answer);
  const seen = new Set([answerKey]);
  const ranked = pool
    .filter((candidate) => {
      const key = matchKey(candidate);
      return key !== '' && key !== answerKey && !excludeKeys.has(key) && candidate.length <= 200;
    })
    .sort((a, b) => Math.abs(a.length - answer.length) - Math.abs(b.length - answer.length));

  const chosen = [];
  for (const candidate of ranked) {
    const key = matchKey(candidate);
    if (seen.has(key)) continue;
    seen.add(key);
    chosen.push(candidate);
    if (chosen.length === 3) break;
  }
  return chosen;
}

/**
 * Which supplied topic a sentence is most about, or a document-grounded word when no topic
 * list was supplied. Mirrors what the validator will accept: with an allow-list the topic
 * must be one of the list; without one, every substantial topic word must be a document
 * word (a word taken straight from the sentence trivially satisfies that).
 */
function topicForSentence(sentence, allowedTopics, preferOrder) {
  const sentenceKeys = new Set(matchKey(sentence).split(' ').filter(Boolean));
  if (Array.isArray(allowedTopics) && allowedTopics.length > 0) {
    let best = allowedTopics[0];
    let bestScore = -1;
    let bestRank = Infinity;
    for (const topic of allowedTopics) {
      const topicWords = matchKey(topic).split(' ').filter(Boolean);
      let overlap = 0;
      for (const word of topicWords) if (sentenceKeys.has(word)) overlap += 1;
      const rank = preferOrder.get(topic) ?? Infinity;
      // Prefer higher overlap; break ties toward an underrepresented topic (lower rank).
      if (overlap > bestScore || (overlap === bestScore && rank < bestRank)) {
        best = topic;
        bestScore = overlap;
        bestRank = rank;
      }
    }
    return best;
  }
  // No allow-list: use the longest substantial word in the sentence as the topic. It is a
  // document word by definition, so the validator's fallback topic check passes.
  let topicWord = '';
  for (const { core } of tokenize(sentence)) {
    if (isNumeric(core)) continue;
    if (STOPWORDS.has(core.toLowerCase())) continue;
    if (core.length > topicWord.length) topicWord = core;
  }
  return topicWord;
}

/**
 * Generate raw cloze candidates from the document, ordered so that questions on
 * underrepresented topics come first. The caller validates them through `validateBatch`.
 *
 *   text            the uploaded document text
 *   allowedTopics   the topic allow-list (may be empty)
 *   preferTopics    topics currently underrepresented, tried first for spread
 */
export function buildBackfillCandidates(text, { allowedTopics = [], preferTopics = [] } = {}) {
  const sentences = documentSentences(text).filter((s) => s.trim().length >= 30);
  const pools = buildPools(sentences);
  const preferOrder = new Map(preferTopics.map((topic, index) => [topic, index]));

  const candidates = [];
  for (const sentence of sentences) {
    // The stem is the sentence with one word blanked, plus a short prefix; skip sentences
    // that would overflow the question-length cap once the prefix is added.
    if (STEM_PREFIX.length + sentence.length + 2 > MAX_QUESTION_CHARS) continue;

    const topic = topicForSentence(sentence, allowedTopics, preferOrder);
    if (!topic || topic.trim() === '') continue;

    // Every word in this sentence is barred as a distractor, so a distractor can never be
    // another word from the same sentence (which would often reveal the answer).
    const sentenceKeys = new Set(tokenize(sentence).map((t) => matchKey(t.core)).filter(Boolean));

    const terms = tokenize(sentence)
      .filter((t) => isBlankable(t.core))
      .sort((a, b) => blankPriority(a.core) - blankPriority(b.core) || a.start - b.start);

    for (const term of terms) {
      const answer = term.core;
      const pool = isNumeric(answer) ? pools.numbers : pools.words;
      const distractors = pickDistractors(answer, pool, sentenceKeys);
      if (distractors.length < 3) continue;

      const stem = `${STEM_PREFIX}${blankOut(sentence, term)}`;
      if (stem.length < 20 || stem.length > MAX_QUESTION_CHARS) continue;

      // Options: answer + 3 distractors. Order is deterministic but varies the correct
      // index by the answer's length so it is not always in slot 0.
      const options = [answer, ...distractors];
      const correctIndex = answer.length % 4;
      if (correctIndex !== 0) {
        [options[0], options[correctIndex]] = [options[correctIndex], options[0]];
      }

      // Explanation uses only the answer and connective words — it can name nothing and
      // state no figure the document does not already contain (the answer is from the doc).
      const explanation = `The blanked word in this sentence from the material is "${answer}".`;

      candidates.push({
        question: stem,
        options,
        correctIndex,
        topic,
        kind: 'cloze',
        explanation,
        source: sentence,
        _prefRank: preferOrder.get(topic) ?? Infinity,
      });
    }
  }

  // Underrepresented topics first, then document order (stable) — so the questions that
  // fill the gap improve topic spread rather than piling onto an already-covered topic.
  candidates.sort((a, b) => a._prefRank - b._prefRank);
  return candidates.map(({ _prefRank, ...rest }) => rest);
}

/**
 * Produce up to `need` validated, non-duplicate cloze questions grounded in the document.
 *
 *   documentIndex   the prebuilt index (same one the AI questions were validated against)
 *   existing        questions already accepted, so backfill never repeats one
 *   allowedTopics   topic allow-list passed straight to the validator
 *   preferTopics    underrepresented topics, tried first
 *
 * Returns { accepted, asked, rejected } mirroring the AI ingest shape, so the provider can
 * fold the counts into the same meta.
 */
export function generateBackfill(text, documentIndex, { need, existing = [], allowedTopics = [], preferTopics = [], requestedDifficulty = null }) {
  if (!Number.isInteger(need) || need <= 0) return { accepted: [], asked: 0, rejected: 0 };

  const candidates = buildBackfillCandidates(text, { allowedTopics, preferTopics });
  // Validate as one batch against everything already accepted; validateBatch drops repeats
  // (both near-duplicate wording and same-fact) and enforces every quality rule — including
  // the difficulty gate, so cloze backfill is excluded from a "hard" paper.
  const { accepted } = validateBatch(candidates, documentIndex, { existing, allowedTopics, requestedDifficulty });
  return {
    accepted: accepted.slice(0, need),
    asked: candidates.length,
    rejected: candidates.length - accepted.length,
  };
}
