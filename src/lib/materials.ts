/**
 * The document analyser: PDF or text in, sentences, concepts and topics out.
 *
 * Reading still happens entirely in the browser. The file itself is decoded with
 * pdf.js in the tab and is never uploaded — no multipart POST, no copy on the
 * server, no temporary file. Everything from `normalizeText` down to
 * `extractTopics` is local, offline and key-free.
 *
 *   What is no longer true, and where it went
 *
 * Writing the questions is not local any more. It moved to the server, which calls
 * a real language model — see `ai-questions.ts` for the browser half and
 * `server/ai/` for the rest. So the *extracted text* does leave the tab on its way
 * to that endpoint, while the file does not. Any surface that says otherwise is a
 * bug: the earlier version of this comment claimed "no network call", and the
 * Materials page carried a "No external AI required" badge to match, both of which
 * would now be lies told by the product about itself.
 *
 *   Why the generator below still exists
 *
 * `generateQuestions` and `analyzeMaterial` are no longer the product's path to a
 * quiz — the browser does not call them, because a locally assembled question
 * presented under an "AI generated" label is exactly the deception this feature was
 * built to remove. They are kept because the test suites need a deterministic way to
 * manufacture a valid `MaterialQuestion[]` for scoring, study plans, retry papers
 * and band thresholds, and because the sentence, concept and topic passes they sit on
 * are still live product code. Deleting them would take real coverage with them.
 *
 * How they work, since they are still read: candidate noun phrases are scored to find
 * a handful of topics, then four kinds of question are built against them with wrong
 * options made from the document's own prose — a real figure moved, a real claim
 * negated, a real term swapped for another term on the same page. That is good
 * enough to exercise a grader. It is not comprehension, which is why a model does the
 * job now.
 */

import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist';
import pdfWorker from 'pdfjs-dist/legacy/build/pdf.worker.min.mjs?url';

/**
 * Polyfill: Uint8Array.prototype.toHex — added in ES2024, not in all browsers yet.
 *
 * pdfjs-dist v6 calls toHex() when computing file fingerprints. The call happens
 * inside the Web Worker, which is a separate JS context that cannot see this
 * polyfill — so we also load the LEGACY worker (which bundles its own polyfill
 * inside the worker context). This main-thread polyfill covers any toHex calls
 * that happen outside the worker.
 */
if (typeof (Uint8Array.prototype as any).toHex !== 'function') {
  Object.defineProperty(Uint8Array.prototype, 'toHex', {
    value: function toHex() {
      let out = '';
      for (let i = 0; i < this.length; i++) {
        out += this[i].toString(16).padStart(2, '0');
      }
      return out;
    },
    configurable: true,
    writable: true,
  });
}

/**
 * Polyfill: async iteration over a ReadableStream (`for await (const x of stream)`).
 *
 * pdfjs-dist v6 iterates streams this way while parsing a PDF, but WebKit — the engine
 * this app runs on — does not implement `ReadableStream.prototype[Symbol.asyncIterator]`,
 * so the call lands on `undefined` and throws "undefined is not a function (near
 * '...value of readableStream...')" the moment a real PDF is opened. (The sample material
 * is plain text and never touches pdfjs, which is why it appeared only on a real upload.)
 * Same story as toHex above: a newer JS API pdfjs assumes, added here so Safari/WebKit
 * behaves like Chrome. Defined only when missing, so a compliant engine is untouched.
 */
if (typeof ReadableStream !== 'undefined' && typeof (ReadableStream.prototype as any)[Symbol.asyncIterator] !== 'function') {
  const asyncIterator = function (this: ReadableStream, options?: { preventCancel?: boolean }) {
    const reader = this.getReader();
    const preventCancel = Boolean(options && options.preventCancel);
    return {
      next() {
        return reader.read().then((result: ReadableStreamReadResult<unknown>) => {
          if (result.done) reader.releaseLock();
          return result;
        });
      },
      return(value?: unknown) {
        if (!preventCancel) {
          const cancelled = reader.cancel(value);
          reader.releaseLock();
          return cancelled.then(() => ({ value, done: true }));
        }
        reader.releaseLock();
        return Promise.resolve({ value, done: true });
      },
      [Symbol.asyncIterator]() {
        return this;
      },
    };
  };
  Object.defineProperty(ReadableStream.prototype, Symbol.asyncIterator, {
    value: asyncIterator,
    configurable: true,
    writable: true,
  });
  if (typeof (ReadableStream.prototype as any).values !== 'function') {
    Object.defineProperty(ReadableStream.prototype, 'values', {
      value: asyncIterator,
      configurable: true,
      writable: true,
    });
  }
}
import { type CompetencyId } from './topics';

GlobalWorkerOptions.workerSrc = pdfWorker;

/**
 * How the question was built. Shown on the review screen so a wrong answer is explainable.
 *
 * `scenario` is not produced by the generator below — no sentence in a PDF can be turned
 * into a judgement call about what to do next. It belongs to the curated paper in
 * `assessment.ts`, and it lives in this union so that a curated question and a generated
 * one are the same type and go through the same grader.
 */
export type QuestionKind = 'statement' | 'cloze' | 'numeric' | 'identify' | 'scenario';

export const questionKindLabels: Record<QuestionKind, string> = {
  statement: 'Recall',
  cloze: 'Complete the passage',
  numeric: 'Read the figure',
  identify: 'Identify the supported claim',
  scenario: 'Applied scenario',
};

export type MaterialQuestion = {
  q: string;
  a: string[];
  correct: number;
  /** The sentence the question was built from. Belongs on the review screen, never beside the options. */
  source: string;
  /** Which topic this question measures. Drives the per-topic score. */
  topic: string;
  /**
   * The framework competency this question measures, when it is known rather than guessed.
   *
   * Generated questions leave this out: their topic came from the document, so the only
   * way to place it in the framework is `classifyTopic`'s keyword match, which is a guess
   * and returns null when it is unsure. A curated question already knows — it was written
   * for a competency — so it states it here and the grader trusts it over the keyword pass.
   */
  competency?: CompetencyId | null;
  kind: QuestionKind;
  /** Why the right answer is right, for the review screen. */
  explanation: string;
  /** Position of the source sentence in the document, so revision passages read in order. */
  sourceIndex: number;
};

export type MaterialAnalysis = {
  text: string;
  pageCount: number;
  /** Terms shown as pills on the Materials page. Wider and noisier than `topics` on purpose. */
  concepts: string[];
  /** The few topics questions are actually generated against and scored by. */
  topics: string[];
  questions: MaterialQuestion[];
  /** Every sentence the questions were drawn from, in document order, for revision passages. */
  sentences: string[];
};

export type MaterialSession = MaterialAnalysis & {
  fileName: string;
  fileSize: number;
  fileType: string;
};

/**
 * A quiz is only a measurement if each topic carries at least two questions, so
 * ten questions over five topics is the floor rather than ten over ten topics.
 * `MAX_TOPICS` exists for exactly that reason: more topics would look thorough
 * and measure nothing.
 */
export const MIN_QUESTIONS = 10;
export const TARGET_QUESTIONS = 12;
export const MAX_TOPICS = 5;

/**
 * Words that carry no topic information. The previous list had forty entries and
 * two duplicates, and still let "Before", "Calculated" and "Analysts" through as
 * concepts, which is how three consecutive questions ended up asking "What does
 * the material state about Basket?".
 */
const stopWords = new Set([
  // Function words. Without these, "and the" scores as a two-word phrase and ends
  // up as a topic, which is how the first run produced the question "What does the
  // material state about and the?".
  'the', 'and', 'but', 'for', 'nor', 'yet', 'its', 'his', 'her', 'our', 'their',
  'are', 'was', 'has', 'had', 'not', 'all', 'any', 'one', 'two', 'per', 'out',
  'off', 'who', 'why', 'how', 'may', 'can', 'did', 'let', 'see', 'set', 'use',
  'you', 'she', 'him', 'them', 'was', 'were', 'been', 'that', 'this',
  // Ordinary stop words.
  'about', 'above', 'across', 'after', 'again', 'against', 'along', 'also', 'although',
  'among', 'amount', 'another', 'because', 'before', 'being', 'below',
  'besides', 'better', 'between', 'both', 'cannot', 'come', 'could', 'described',
  'despite', 'does', 'done', 'down', 'during', 'each', 'either', 'else', 'enough',
  'even', 'ever', 'every', 'except', 'first', 'following', 'from', 'further', 'give',
  'given', 'gives', 'good', 'have', 'having', 'hence', 'here', 'high', 'higher',
  'however', 'into', 'itself', 'just', 'keep', 'kind', 'known', 'large', 'larger',
  'last', 'later', 'least', 'less', 'like', 'likely', 'long', 'made', 'main', 'make',
  'makes', 'many', 'more', 'most', 'much', 'must', 'near', 'need', 'needs', 'neither',
  'never', 'next', 'none', 'often', 'once', 'only', 'onto', 'order', 'other', 'others',
  'over', 'part', 'past', 'perhaps', 'possible', 'rather', 'said', 'same', 'says',
  'seen', 'several', 'shall', 'should', 'similar', 'since', 'small', 'smaller', 'some',
  'still', 'such', 'sure', 'take', 'taken', 'takes', 'than', 'then', 'there',
  'therefore', 'these', 'they', 'thing', 'things', 'those',
  'though', 'through', 'thus', 'together', 'toward', 'under', 'unless', 'until',
  'upon', 'used', 'uses', 'using', 'usually', 'very', 'want', 'well', 'what',
  'when', 'where', 'whether', 'which', 'while', 'whole', 'whose', 'will', 'with',
  'within', 'without', 'would', 'your',
]);

/**
 * Low-information nouns: real words, useless as the subject of a question. Units of
 * measure are in here too — the first run blanked out "percent" from "prices rose
 * 7.2 ______", which tests nothing, and then reported "Percent" as a competency.
 */
const weakTopicWords = new Set([
  'analyst', 'analysts', 'example', 'examples', 'figure', 'figures', 'note', 'notes',
  'page', 'pages', 'paragraph', 'people', 'person', 'point', 'points', 'section',
  'sections', 'staff', 'table', 'tables', 'thing', 'time', 'times', 'user', 'users',
  'way', 'ways', 'week', 'year', 'years', 'case', 'cases', 'number', 'numbers',
  'percent', 'percentage', 'unit', 'units', 'total', 'totals', 'level', 'levels',
]);

/**
 * Flatten what a PDF actually hands over.
 *
 * The control-character pass is written as an escape on purpose. Extracted PDF text
 * routinely carries NUL and other C0 bytes, and the first version of this line held a
 * literal NUL inside the regex: it worked, but it made this file read as binary to
 * `grep` and would not survive an editor that strips unprintable characters.
 */
function normalizeText(value: string) {
  return value
    .replace(/\r\n?/g, '\n')
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, ' ')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/**
 * Sentence splitting good enough for official prose. The lookbehind keeps the
 * terminator with the sentence and the lookahead requires the next sentence to
 * start with a capital or a digit, which stops "7.2 percent" and "No. 4" from
 * being treated as boundaries.
 *
 * Exported because the AI path needs the same list the deterministic path uses: a
 * question's `sourceIndex` is a position in *this* list, and revision passages are
 * ordered by it. Two different splitters would order them differently.
 */
export function sentenceList(text: string, minLength = 45, maxLength = 360) {
  return text
    .replace(/\s+/g, ' ')
    .split(/(?<=[.!?])\s+(?=[A-Z0-9])/)
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence.length >= minLength && sentence.length <= maxLength);
}

/**
 * "margin of error" -> "Margin of Error". Connectors stay lowercase unless they
 * lead, because "Margin Of Error" reads like a heading, not like a topic.
 */
function titleCase(value: string) {
  return value
    .split(' ')
    .map((word, index) =>
      index > 0 && connectors.has(word.toLowerCase())
        ? word.toLowerCase()
        : word.replace(/^[a-z]/, (letter) => letter.toUpperCase()))
    .join(' ');
}

function words(sentence: string): string[] {
  return (sentence.toLowerCase().match(/\b[a-z][a-z-]{1,}\b/g) ?? []);
}

/** Participles and adverbs make poor standalone topics: "Calculated", "Quarterly". */
function usableUnigram(word: string): boolean {
  if (word.length < 4) return false;
  if (stopWords.has(word) || weakTopicWords.has(word)) return false;
  if (word.endsWith('ly') || word.endsWith('ed')) return false;
  return true;
}

/**
 * A phrase is only a topic if it both starts and ends with a content word.
 * "base year and" and "and the" are not topics; "base year" is.
 */
function usableInPhrase(word: string): boolean {
  return word.length >= 3 && !stopWords.has(word);
}

/**
 * Short words allowed *inside* a phrase but never at either end. Statistical
 * vocabulary is full of these — "margin of error", "coefficient of variation",
 * "quality of the frame" — and without them the phrase breaks up and the engine
 * ends up asking about "Error" on its own.
 */
const connectors = new Set(['of', 'per']);

function phraseUsable(gram: string[]): boolean {
  const last = gram.length - 1;
  if (!usableInPhrase(gram[0]) || !usableInPhrase(gram[last])) return false;
  if (weakTopicWords.has(gram[last])) return false;
  for (let index = 1; index < last; index += 1) {
    if (!usableInPhrase(gram[index]) && !connectors.has(gram[index])) return false;
  }
  return true;
}

type Candidate = { term: string; count: number; size: number; score: number };

/**
 * Score candidate terms of one to three words.
 *
 * Longer phrases win over their own parts: once "consumer price index" is a
 * candidate, "index" on its own is dropped, because a question about "Index" is
 * vague and a question about "Consumer price index" is answerable. That single
 * rule is most of the difference in question quality.
 */
function rankCandidates(sentences: string[]): Candidate[] {
  const counts = new Map<string, { count: number; size: number }>();

  for (const sentence of sentences) {
    const tokens = words(sentence);
    for (let index = 0; index < tokens.length; index += 1) {
      for (let size = 1; size <= 3; size += 1) {
        if (index + size > tokens.length) break;
        const gram = tokens.slice(index, index + size);
        if (size === 1) {
          if (!usableUnigram(gram[0])) continue;
        } else if (!phraseUsable(gram)) {
          continue;
        }
        const term = gram.join(' ');
        const entry = counts.get(term);
        if (entry) entry.count += 1;
        else counts.set(term, { count: 1, size });
      }
    }
  }

  // A repeated phrase has to outrank the single word inside it: "basket weights"
  // used twice is a better topic than "basket" used five times, so the per-word
  // weight rises steeply with length.
  const sizeWeight = [0, 1, 3.2, 5];
  const candidates: Candidate[] = [];
  for (const [term, { count, size }] of counts) {
    // A word used once is vocabulary, not a topic. A long phrase used once usually
    // is a topic, because prose does not repeat long phrases by accident — but it
    // is discounted, so a phrase the document actually returns to still wins.
    if (size === 1 && count < 2) continue;
    const score = count * sizeWeight[size] * (count === 1 ? 0.6 : 1);
    candidates.push({ term, count, size, score });
  }

  candidates.sort((a, b) => b.score - a.score || a.term.localeCompare(b.term));

  const kept: Candidate[] = [];
  for (const candidate of candidates) {
    // Space-padded so containment is by whole words: "rate" must not count as
    // already covered by "corporate".
    const padded = ` ${candidate.term} `;
    const covered = kept.some((existing) => {
      const other = ` ${existing.term} `;
      return other.includes(padded) || padded.includes(other);
    });
    if (!covered) kept.push(candidate);
  }
  return kept;
}

/** Terms for the pills on the Materials page. Broader than `topics`, and only display. */
export function extractConcepts(text: string): string[] {
  const sentences = sentenceList(text, 20, 900);
  return rankCandidates(sentences)
    .slice(0, 12)
    .map((candidate) => titleCase(candidate.term));
}

/** The handful of topics questions are generated against and scored by. */
export function extractTopics(sentences: string[]): string[] {
  return rankCandidates(sentences)
    .slice(0, MAX_TOPICS)
    .map((candidate) => titleCase(candidate.term));
}

/**
 * Deterministic randomness. The same document always produces the same quiz,
 * which is what makes the generator testable, but the correct answer moves around
 * instead of sitting at `index % 4` the way it used to.
 */
function hashSeed(value: string): number {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function makeRandom(seed: number): () => number {
  let state = seed || 1;
  return () => {
    state |= 0;
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Fisher-Yates. Returns the options plus where the answer ended up. */
function placeOptions(answer: string, distractors: string[], random: () => number) {
  const options = [answer, ...distractors];
  for (let index = options.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(random() * (index + 1));
    const held = options[index];
    options[index] = options[swap];
    options[swap] = held;
  }
  return { a: options, correct: options.indexOf(answer) };
}

function shorten(value: string, maxLength = 220) {
  if (value.length <= maxLength) return value;
  return `${value.slice(0, maxLength).replace(/\s+\S*$/, '')}…`;
}

/**
 * Pairs used to turn a true sentence into a false one that still reads like the
 * source. Applied in both directions.
 */
const opposites: Array<[string, string]> = [
  ['rose', 'fell'], ['increased', 'decreased'], ['increase', 'decrease'],
  ['growth', 'decline'], ['higher', 'lower'], ['highest', 'lowest'],
  ['largest', 'smallest'], ['greater', 'smaller'], ['above', 'below'],
  ['more', 'less'], ['most', 'least'], ['upward', 'downward'],
  ['faster', 'slower'], ['rural', 'urban'], ['before', 'after'],
  ['included', 'excluded'], ['include', 'exclude'], ['majority', 'minority'],
  ['positive', 'negative'], ['same', 'different'], ['fixed', 'variable'],
  ['annual', 'monthly'], ['quarterly', 'annual'], ['first', 'final'],
  ['maximum', 'minimum'], ['strengthened', 'weakened'], ['added', 'removed'],
];

const negatable = /\b(should|must|can|may|will|does|do|is|are|was|were|has|have)\b/;

/** "reference quarter" -> "Reference quarter". Sentence case, not title case. */
function capitalizeFirst(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function swapWord(sentence: string, from: string, to: string): string | null {
  const pattern = new RegExp(`\\b${from}\\b`, 'i');
  if (!pattern.test(sentence)) return null;
  // Sentence case when the replaced text started a sentence. Title-casing it here
  // made swapped-in terms stand out typographically — "Reference Quarter show the
  // relative importance" is spottable as the wrong option without reading it.
  return sentence.replace(pattern, (matched) =>
    matched[0] === matched[0].toUpperCase() ? capitalizeFirst(to) : to);
}

/**
 * Nudge a figure far enough to be wrong, keeping its shape (decimals, commas) and
 * its plausibility. A distractor that reads "the base year is 3622" or "prices rose
 * 240 percent" is not a distractor; it is a free mark, because the reader can rule
 * it out without knowing anything about the document.
 */
function perturbNumber(value: string, random: () => number): string {
  const numeric = Number(value.replace(/,/g, ''));
  if (!Number.isFinite(numeric) || numeric === 0) return value;
  const decimals = value.includes('.') ? (value.split('.')[1] ?? '').length : 0;

  // A four-digit integer between 1900 and 2100 is a year, not a quantity. Scaling
  // it is absurd; moving it a few years is exactly the mistake worth testing.
  const isYear = decimals === 0 && numeric >= 1900 && numeric <= 2100 && !value.includes(',');
  if (isYear) {
    const shifts = [-6, -5, -4, -3, -2, 2, 3, 4, 5, 6];
    return String(numeric + shifts[Math.floor(random() * shifts.length)]);
  }

  const factors = [0.55, 0.7, 1.4, 1.8, 2.5];
  const factor = factors[Math.floor(random() * factors.length)];
  let changed = numeric * factor;
  if (Math.abs(changed - numeric) < Math.max(1, Math.abs(numeric) * 0.1)) changed = numeric + 1;

  // Figures at or below 100 are usually shares, rates or index points; keeping the
  // distractor inside the same range is what makes it worth reading.
  if (numeric <= 100 && changed > 99) changed = Math.max(1, numeric * 0.6);

  const rendered = changed.toFixed(decimals);
  return value.includes(',') ? Number(rendered).toLocaleString('en-IN') : rendered;
}

/** Up to `wanted` distinct false rewrites of one true sentence. */
function alterations(sentence: string, random: () => number, wanted: number, terms: string[] = []): string[] {
  const out: string[] = [];
  const add = (candidate: string | null) => {
    if (!candidate || candidate === sentence || out.includes(candidate)) return;
    if (out.length < wanted) out.push(candidate);
  };

  for (const [left, right] of opposites) {
    if (out.length >= wanted) break;
    add(swapWord(sentence, left, right));
    add(swapWord(sentence, right, left));
  }

  // Each figure is tried a few times, because one factor may round back to itself.
  const numbers = sentence.match(/\b\d[\d,]*(?:\.\d+)?\b/g) ?? [];
  for (const number of numbers) {
    for (let attempt = 0; attempt < 3 && out.length < wanted; attempt += 1) {
      add(sentence.replace(number, perturbNumber(number, random)));
    }
  }

  /**
   * Swap one of the document's own terms for another of its terms. This is the
   * most reliable technique available — it needs no antonym and no figure, only
   * two topics — and it produces a sentence that is grammatical, on-subject and
   * false, which is exactly what a distractor has to be.
   */
  const lower = sentence.toLowerCase();
  const present = terms.filter((term) => lower.includes(term.toLowerCase()));
  const absent = terms.filter((term) => !lower.includes(term.toLowerCase()));
  for (const from of present) {
    for (const to of absent) {
      if (out.length >= wanted) break;
      add(swapWord(sentence, from.toLowerCase(), to.toLowerCase()));
    }
  }

  if (out.length < wanted && negatable.test(sentence)) {
    add(sentence.replace(negatable, (matched) => `${matched} not`));
  }
  return out;
}

type BuildContext = {
  sentences: string[];
  topics: string[];
  terms: string[];
  random: () => number;
};

function findTopicIn(sentence: string, topics: string[], fallback: string): string {
  const lower = sentence.toLowerCase();
  return topics.find((topic) => lower.includes(topic.toLowerCase())) ?? fallback;
}

function quoted(sentence: string): string {
  return `The material says: “${sentence}”`;
}

/** "What does the material state about X?" with wrong options rewritten from the same sentence. */
function buildStatement(topic: string, index: number, context: BuildContext): MaterialQuestion | null {
  const sentence = context.sentences[index];
  const wrong = alterations(sentence, context.random, 3, context.terms).map((item) => shorten(item));
  if (wrong.length < 3) return null;

  const { a, correct } = placeOptions(shorten(sentence), wrong, context.random);
  return {
    q: `What does the material state about ${topic.toLowerCase()}?`,
    a,
    correct,
    source: sentence,
    topic,
    kind: 'statement',
    explanation: quoted(sentence),
    sourceIndex: index,
  };
}

/** The topic term is removed from its own sentence and has to be put back. */
function buildCloze(topic: string, index: number, context: BuildContext): MaterialQuestion | null {
  const sentence = context.sentences[index];
  // Global: a sentence often uses the term twice ("Basket weights show ... and the
  // basket weights are drawn from ..."). Blanking only the first occurrence left the
  // answer printed in the stem, which the engine test now refuses to allow.
  const pattern = new RegExp(`\\b${topic.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
  const found = sentence.match(pattern);
  if (!found) return null;

  // All four options are title-cased. Taking the answer verbatim out of the
  // sentence meant it arrived lowercase while the distractors came from the
  // title-cased term list, and the odd one out was the answer — findable without
  // reading the passage at all.
  const answer = titleCase(found[0].toLowerCase());
  const blanked = shorten(sentence.replace(pattern, '______'), 260);
  const lower = sentence.toLowerCase();
  const wrong = context.terms
    .filter((term) => term.toLowerCase() !== answer.toLowerCase() && !lower.includes(term.toLowerCase()))
    .slice(0, 3)
    .map((term) => titleCase(term.toLowerCase()));
  if (wrong.length < 3) return null;

  const { a, correct } = placeOptions(answer, wrong, context.random);
  return {
    q: `Which term completes this line from the material? “${blanked}”`,
    a,
    correct,
    source: sentence,
    topic,
    kind: 'cloze',
    explanation: quoted(sentence),
    sourceIndex: index,
  };
}

/** A figure is removed from its sentence; the wrong options are the same figure, moved. */
function buildNumeric(index: number, context: BuildContext): MaterialQuestion | null {
  const sentence = context.sentences[index];
  const numbers: string[] = sentence.match(/\b\d[\d,]*(?:\.\d+)?\b/g) ?? [];
  const answer = numbers[0];
  if (!answer) return null;

  const wrong: string[] = [];
  let guard = 0;
  while (wrong.length < 3 && guard < 24) {
    const candidate = perturbNumber(answer, context.random);
    if (candidate !== answer && !wrong.includes(candidate)) wrong.push(candidate);
    guard += 1;
  }
  if (wrong.length < 3) return null;

  const blanked = shorten(sentence.replace(answer, '______'), 260);
  const { a, correct } = placeOptions(answer, wrong, context.random);
  return {
    q: `Which figure does the material give here? “${blanked}”`,
    a,
    correct,
    source: sentence,
    topic: findTopicIn(sentence, context.topics, context.topics[0] ?? 'This material'),
    kind: 'numeric',
    explanation: quoted(sentence),
    sourceIndex: index,
  };
}

/**
 * One real claim against three rewritten claims taken from elsewhere in the same
 * document. Only successfully altered sentences are used as wrong options — an
 * unaltered sentence from the document would also be true, which would make the
 * question unanswerable.
 */
function buildIdentify(index: number, context: BuildContext): MaterialQuestion | null {
  const sentence = context.sentences[index];
  const wrong: string[] = [];
  for (let offset = 1; offset < context.sentences.length && wrong.length < 3; offset += 1) {
    const other = context.sentences[(index + offset) % context.sentences.length];
    if (other === sentence) continue;
    const altered = alterations(other, context.random, 1, context.terms)[0];
    if (altered) wrong.push(shorten(altered));
  }
  if (wrong.length < 3) return null;

  const { a, correct } = placeOptions(shorten(sentence), wrong, context.random);
  return {
    q: 'Which statement is directly supported by the uploaded material?',
    a,
    correct,
    source: sentence,
    topic: findTopicIn(sentence, context.topics, context.topics[0] ?? 'This material'),
    kind: 'identify',
    explanation: quoted(sentence),
    sourceIndex: index,
  };
}

/**
 * Assemble the paper.
 *
 * Questions are collected into one bucket per topic and then taken round-robin, so
 * every topic reaches two questions before any topic reaches three. Two is the
 * floor for reporting a band, and a per-topic score built on one question would be
 * a coin toss dressed up as a measurement.
 *
 * The round-robin also spreads topics through the running order, so the quiz does
 * not ask three questions about the same term back to back the way the old
 * generator did.
 */
function assemble(sentences: string[], target: number): MaterialQuestion[] {
  const topics = extractTopics(sentences);
  const terms = rankCandidates(sentences).slice(0, 14).map((item) => titleCase(item.term));
  const context: BuildContext = { sentences, topics, terms, random: makeRandom(hashSeed(sentences.join(' '))) };

  const seen = new Set<string>();
  const keep = (question: MaterialQuestion | null, bucket: MaterialQuestion[]) => {
    if (!question) return;
    const key = `${question.kind}|${question.a[question.correct].toLowerCase()}`;
    if (seen.has(key) || seen.has(question.q)) return;
    seen.add(key);
    seen.add(question.q);
    bucket.push(question);
  };

  const buckets: MaterialQuestion[][] = topics.map(() => []);
  topics.forEach((topic, topicIndex) => {
    const bucket = buckets[topicIndex];
    const mentions = sentences
      .map((sentence, index) => ({ sentence, index }))
      .filter((entry) => entry.sentence.toLowerCase().includes(topic.toLowerCase()));
    // Alternate which kind each topic leads with. The round-robin below takes the
    // first entry of every bucket before the second, so building every bucket in
    // the same order produced five cloze questions followed by five statements.
    const clozeFirst = topicIndex % 2 === 0;
    for (const mention of mentions) {
      if (clozeFirst) {
        keep(buildCloze(topic, mention.index, context), bucket);
        keep(buildStatement(topic, mention.index, context), bucket);
      } else {
        keep(buildStatement(topic, mention.index, context), bucket);
        keep(buildCloze(topic, mention.index, context), bucket);
      }
    }
  });

  // Interleaved, not concatenated: the top-up pool used to be every numeric
  // question followed by every identify question, and since only the last two or
  // three slots are ever filled from it, identify questions never appeared at all.
  const numeric: MaterialQuestion[] = [];
  const identify: MaterialQuestion[] = [];
  sentences.forEach((_sentence, index) => keep(buildNumeric(index, context), numeric));
  sentences.forEach((_sentence, index) => keep(buildIdentify(index, context), identify));

  const chosen: MaterialQuestion[] = [];
  const taken = topics.map(() => 0);
  for (let round = 0; round < 6 && chosen.length < target; round += 1) {
    for (let topicIndex = 0; topicIndex < buckets.length && chosen.length < target; topicIndex += 1) {
      const bucket = buckets[topicIndex];
      if (taken[topicIndex] < bucket.length) {
        chosen.push(bucket[taken[topicIndex]]);
        taken[topicIndex] += 1;
      }
    }
    const exhausted = buckets.every((bucket, topicIndex) => taken[topicIndex] >= bucket.length);
    if (exhausted) break;
  }
  /**
   * Top up with the other two kinds, taking one of each in turn so both appear.
   *
   * Freshness is a preference inside each kind, not a filter across the pool: a
   * question about a passage the paper has already quoted is weaker, but a paper
   * with no identify question at all is weaker still. Making it a hard filter is
   * what silently removed the identify questions on the first attempt — every
   * unused sentence happened to be one a numeric question could use.
   */
  const usedSentences = new Set(chosen.map((question) => question.sourceIndex));
  const freshFirst = (pool: MaterialQuestion[]) => [
    ...pool.filter((question) => !usedSentences.has(question.sourceIndex)),
    ...pool.filter((question) => usedSentences.has(question.sourceIndex)),
  ];
  const identifyQueue = freshFirst(identify);
  const numericQueue = freshFirst(numeric);

  for (let index = 0; chosen.length < target && index < Math.max(identifyQueue.length, numericQueue.length); index += 1) {
    if (index < identifyQueue.length && chosen.length < target) chosen.push(identifyQueue[index]);
    if (index < numericQueue.length && chosen.length < target) chosen.push(numericQueue[index]);
  }
  return chosen;
}

/**
 * Public entry point for generation. Tries the normal sentence window first and
 * widens it once if the document is too terse to reach the floor — a two-page
 * table of figures has few well-formed sentences, and a slightly looser window
 * beats padding the paper with junk.
 */
export function generateQuestions(text: string, target = TARGET_QUESTIONS) {
  let sentences = sentenceList(text);
  let questions = assemble(sentences, target);

  if (questions.length < MIN_QUESTIONS) {
    const wider = sentenceList(text, 30, 520);
    if (wider.length > sentences.length) {
      const retry = assemble(wider, target);
      if (retry.length > questions.length) {
        sentences = wider;
        questions = retry;
      }
    }
  }
  return { questions, sentences, topics: extractTopics(sentences) };
}

/**
 * Kept for compatibility with the original signature. `concepts` is ignored —
 * topics are now derived inside the generator, because the old caller passed in
 * frequency-ranked single words and those made poor question subjects.
 */
export function buildGroundedQuestions(text: string, _concepts: string[], count = TARGET_QUESTIONS): MaterialQuestion[] {
  return generateQuestions(text, count).questions;
}

/**
 * Called after each page is read, so a caller can show progress that reflects work
 * actually done rather than a timer. A 40-page PDF takes long enough that an invented
 * percentage would be visibly wrong — it would sit at 28% and then jump to done.
 */
export type PageProgress = (pagesRead: number, pageCount: number) => void;

export async function extractPdfText(file: File, onPage?: PageProgress) {
  const data = new Uint8Array(await file.arrayBuffer());
  const pdf = await getDocument({ data }).promise;
  const pages: string[] = [];

  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber);
    const content = await page.getTextContent();
    const pageText = content.items
      .map((item) => ('str' in item ? item.str : ''))
      .join(' ');
    pages.push(pageText);
    page.cleanup();
    onPage?.(pageNumber, pdf.numPages);
  }

  const text = normalizeText(pages.join('\n\n'));
  if (text.length < 45) {
    throw new Error('This PDF appears to be scanned or contains too little selectable text. Try a text-based PDF or export it with OCR first.');
  }

  return { text, pageCount: pdf.numPages };
}

/**
 * Like {@link extractPdfText}, but keeps each page's text separate.
 *
 * The large-document workflow needs per-page text so it can upload the book in bounded
 * page batches (never one giant request) and so every chunk keeps a real page number. This
 * shares the same pdfjs pass; it simply does not join the pages into one string.
 */
export async function extractPdfPages(file: File, onPage?: PageProgress): Promise<{ pages: { page: number; text: string }[]; pageCount: number }> {
  const data = new Uint8Array(await file.arrayBuffer());
  const pdf = await getDocument({ data }).promise;
  const pages: { page: number; text: string }[] = [];
  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber);
    const content = await page.getTextContent();
    const pageText = normalizeText(content.items.map((item) => ('str' in item ? item.str : '')).join(' '));
    pages.push({ page: pageNumber, text: pageText });
    page.cleanup();
    onPage?.(pageNumber, pdf.numPages);
  }
  return { pages, pageCount: pdf.numPages };
}

/**
 * The formats that actually work. The Materials page reads this list instead of
 * keeping its own copy, because the two had drifted: the page advertised DOCX and
 * PPTX in its accept attribute and its help text, validated them happily, and then
 * `readMaterial` threw. Selecting a file the interface offered and being told it is
 * unsupported is worse than not being offered it.
 */
export const supportedExtensions = ['pdf', 'txt', 'md'] as const;

/**
 * Upload ceiling. Nothing is uploaded anywhere — the limit exists because the whole
 * file is decoded in the tab, and a 200 MB PDF freezes it. Declared here so the input
 * that enforces it and the help text that states it cannot disagree.
 */
export const MAX_MATERIAL_BYTES = 25 * 1024 * 1024;

export async function readMaterial(file: File, onPage?: PageProgress) {
  const extension = file.name.split('.').pop()?.toLowerCase() ?? '';
  if (extension === 'pdf') return extractPdfText(file, onPage);
  if (extension === 'txt' || extension === 'md') {
    const text = normalizeText(await file.text());
    if (text.length < 45) throw new Error('That file has too little text to build a knowledge check from.');
    onPage?.(1, 1);
    return { text, pageCount: 1 };
  }
  throw new Error(`${extension ? `.${extension}` : 'That format'} is not supported. Upload a text-based PDF, TXT or MD file.`);
}

/**
 * Read a file to page-tagged text (for the large-document workflow) plus the joined text
 * and page count (so the caller can decide small-vs-large from the same single read).
 */
export async function readMaterialWithPages(file: File, onPage?: PageProgress): Promise<{ text: string; pageCount: number; pages: { page: number; text: string }[] }> {
  const extension = file.name.split('.').pop()?.toLowerCase() ?? '';
  if (extension === 'pdf') {
    const { pages, pageCount } = await extractPdfPages(file, onPage);
    const text = normalizeText(pages.map((p) => p.text).join('\n\n'));
    if (text.length < 45) throw new Error('This PDF appears to be scanned or contains too little selectable text. Try a text-based PDF or export it with OCR first.');
    return { text, pageCount, pages };
  }
  if (extension === 'txt' || extension === 'md') {
    const text = normalizeText(await file.text());
    if (text.length < 45) throw new Error('That file has too little text to build a knowledge check from.');
    onPage?.(1, 1);
    return { text, pageCount: 1, pages: [{ page: 1, text }] };
  }
  throw new Error(`${extension ? `.${extension}` : 'That format'} is not supported. Upload a text-based PDF, TXT or MD file.`);
}

/** A PDF at or above this page count uses the large-document (search-then-generate) flow. */
export const LARGE_DOCUMENT_PAGE_THRESHOLD = 50;
/** …or a document whose extracted text exceeds this many characters (a dense short book). */
export const LARGE_DOCUMENT_CHAR_THRESHOLD = 200_000;

/** True when a read document should take the large-document workflow. */
export function isLargeDocument(pageCount: number, textLength: number): boolean {
  return pageCount >= LARGE_DOCUMENT_PAGE_THRESHOLD || textLength >= LARGE_DOCUMENT_CHAR_THRESHOLD;
}

/** ".pdf,.txt,.md" — for the file input, built from the one supported-format list. */
export const supportedAccept = supportedExtensions.map((extension) => `.${extension}`).join(',');

/** "PDF, TXT or MD" — for prose and error messages, from the same list. */
export const supportedFormatsSentence = (() => {
  const names = supportedExtensions.map((extension) => extension.toUpperCase());
  return `${names.slice(0, -1).join(', ')} or ${names[names.length - 1]}`;
})();

/**
 * Illustrative methodology prose, used by the "Try a sample" button so the
 * pipeline can be demonstrated without a file to hand. The figures are invented
 * for the example and are not published statistics — every surface that shows this
 * material labels it with `sampleMaterialLabel`.
 */
export const sampleMaterialText = `The consumer price index measures the change in prices paid by households for a fixed basket of goods and services. The current consumer price index uses 2012 as its base year, and every published index value is expressed against that base year. Basket weights show the relative importance of each item, and the basket weights are drawn from the most recent household consumption expenditure survey. Consumer prices rose 7.2 percent in the reference quarter compared with the same quarter a year earlier. Food and beverages made the largest contribution to the headline movement in the reference quarter. The rural basket recorded a slower pace of increase than the urban basket in the reference quarter, at 6.4 percent against 7.9 percent. Price collection covers 1181 selected markets, and field staff record quoted prices on a fixed schedule every month. A quoted price is treated as missing when the item is unavailable, and a missing quoted price is imputed from the same item in a neighbouring market. The response rate for the quarter was 96 percent, which is above the 92 percent threshold set for publication. Seasonal adjustment removes the part of a movement that repeats at the same point every year, so that the underlying trend can be read. Analysts should check the reference period, the coverage and the collection method before interpreting any quarterly change. A revision is published whenever a late return changes an index value that has already been released. The index is disseminated through a monthly press note, and the press note carries the caveats that apply to the headline figure.`;

export const sampleMaterialLabel = 'Sample / Demonstration Data';

export const sampleMaterialMeta = {
  fileName: 'Sample_Price_Index_Methodology_Note.txt',
  fileSize: sampleMaterialText.length,
  fileType: 'txt',
  pageCount: 1,
};

/**
 * Analyse a document with the local generator, end to end.
 *
 * Not the product's path any more — the Materials page calls the server AI instead.
 * This stays as the deterministic fixture builder the engine and client suites use to
 * produce a real `MaterialQuestion[]` without a network or an API key.
 */
export function analyzeMaterial(text: string, pageCount: number): MaterialAnalysis {
  const { questions, sentences, topics } = generateQuestions(text);
  return {
    text,
    pageCount,
    concepts: extractConcepts(text),
    topics,
    questions,
    sentences,
  };
}
