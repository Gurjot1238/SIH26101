import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist';
import pdfWorker from 'pdfjs-dist/legacy/build/pdf.worker.min.mjs?url';

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
  source: string;
  topic: string;
  competency?: CompetencyId | null;
  kind: QuestionKind;
  explanation: string;
  sourceIndex: number;
};

export type MaterialAnalysis = {
  text: string;
  pageCount: number;
  concepts: string[];
  topics: string[];
  questions: MaterialQuestion[];
  sentences: string[];
};

export type MaterialSession = MaterialAnalysis & {
  fileName: string;
  fileSize: number;
  fileType: string;
};

export const MIN_QUESTIONS = 10;
export const TARGET_QUESTIONS = 12;
export const MAX_TOPICS = 5;

const stopWords = new Set([
  'the', 'and', 'but', 'for', 'nor', 'yet', 'its', 'his', 'her', 'our', 'their',
  'are', 'was', 'has', 'had', 'not', 'all', 'any', 'one', 'two', 'per', 'out',
  'off', 'who', 'why', 'how', 'may', 'can', 'did', 'let', 'see', 'set', 'use',
  'you', 'she', 'him', 'them', 'was', 'were', 'been', 'that', 'this',
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

const weakTopicWords = new Set([
  'analyst', 'analysts', 'example', 'examples', 'figure', 'figures', 'note', 'notes',
  'page', 'pages', 'paragraph', 'people', 'person', 'point', 'points', 'section',
  'sections', 'staff', 'table', 'tables', 'thing', 'time', 'times', 'user', 'users',
  'way', 'ways', 'week', 'year', 'years', 'case', 'cases', 'number', 'numbers',
  'percent', 'percentage', 'unit', 'units', 'total', 'totals', 'level', 'levels',
]);

function normalizeText(value: string) {
  return value
    .replace(/\r\n?/g, '\n')
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, ' ')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export function sentenceList(text: string, minLength = 45, maxLength = 360) {
  return text
    .replace(/\s+/g, ' ')
    .split(/(?<=[.!?])\s+(?=[A-Z0-9])/)
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence.length >= minLength && sentence.length <= maxLength);
}

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

function usableUnigram(word: string): boolean {
  if (word.length < 4) return false;
  if (stopWords.has(word) || weakTopicWords.has(word)) return false;
  if (word.endsWith('ly') || word.endsWith('ed')) return false;
  return true;
}

function usableInPhrase(word: string): boolean {
  return word.length >= 3 && !stopWords.has(word);
}

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

  const sizeWeight = [0, 1, 3.2, 5];
  const candidates: Candidate[] = [];
  for (const [term, { count, size }] of counts) {
    if (size === 1 && count < 2) continue;
    const score = count * sizeWeight[size] * (count === 1 ? 0.6 : 1);
    candidates.push({ term, count, size, score });
  }

  candidates.sort((a, b) => b.score - a.score || a.term.localeCompare(b.term));

  const kept: Candidate[] = [];
  for (const candidate of candidates) {
    const padded = ` ${candidate.term} `;
    const covered = kept.some((existing) => {
      const other = ` ${existing.term} `;
      return other.includes(padded) || padded.includes(other);
    });
    if (!covered) kept.push(candidate);
  }
  return kept;
}

export function extractConcepts(text: string): string[] {
  const sentences = sentenceList(text, 20, 900);
  return rankCandidates(sentences)
    .slice(0, 12)
    .map((candidate) => titleCase(candidate.term));
}

export function extractTopics(sentences: string[]): string[] {
  return rankCandidates(sentences)
    .slice(0, MAX_TOPICS)
    .map((candidate) => titleCase(candidate.term));
}

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

function capitalizeFirst(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function swapWord(sentence: string, from: string, to: string): string | null {
  const pattern = new RegExp(`\\b${from}\\b`, 'i');
  if (!pattern.test(sentence)) return null;
  return sentence.replace(pattern, (matched) =>
    matched[0] === matched[0].toUpperCase() ? capitalizeFirst(to) : to);
}

function perturbNumber(value: string, random: () => number): string {
  const numeric = Number(value.replace(/,/g, ''));
  if (!Number.isFinite(numeric) || numeric === 0) return value;
  const decimals = value.includes('.') ? (value.split('.')[1] ?? '').length : 0;

  const isYear = decimals === 0 && numeric >= 1900 && numeric <= 2100 && !value.includes(',');
  if (isYear) {
    const shifts = [-6, -5, -4, -3, -2, 2, 3, 4, 5, 6];
    return String(numeric + shifts[Math.floor(random() * shifts.length)]);
  }

  const factors = [0.55, 0.7, 1.4, 1.8, 2.5];
  const factor = factors[Math.floor(random() * factors.length)];
  let changed = numeric * factor;
  if (Math.abs(changed - numeric) < Math.max(1, Math.abs(numeric) * 0.1)) changed = numeric + 1;

  if (numeric <= 100 && changed > 99) changed = Math.max(1, numeric * 0.6);

  const rendered = changed.toFixed(decimals);
  return value.includes(',') ? Number(rendered).toLocaleString('en-IN') : rendered;
}

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

  const numbers = sentence.match(/\b\d[\d,]*(?:\.\d+)?\b/g) ?? [];
  for (const number of numbers) {
    for (let attempt = 0; attempt < 3 && out.length < wanted; attempt += 1) {
      add(sentence.replace(number, perturbNumber(number, random)));
    }
  }

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

function buildCloze(topic: string, index: number, context: BuildContext): MaterialQuestion | null {
  const sentence = context.sentences[index];
  const pattern = new RegExp(`\\b${topic.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
  const found = sentence.match(pattern);
  if (!found) return null;

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

export function buildGroundedQuestions(text: string, _concepts: string[], count = TARGET_QUESTIONS): MaterialQuestion[] {
  return generateQuestions(text, count).questions;
}

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

export const supportedExtensions = ['pdf', 'txt', 'md'] as const;

export const MAX_MATERIAL_BYTES = 25 * 1024 * 1024;

export type PageText = {
  page: number;
  text: string;
  source?: 'native_text' | 'ocr' | 'ocr_failed' | 'vision' | 'vision_failed';
  confidence?: number;
};

export type OcrPageResult = { text: string; confidence: number } | null;

export type OcrPageFn = (args: { imageBase64: string; pageNumber: number }) => Promise<OcrPageResult>;

// Vision recovers the *meaning* of a chart/diagram page as study text; OCR only recovers glyphs.
export type VisionPageResult = { text: string } | null;

export type VisionPageFn = (args: { imageBase64: string; pageNumber: number }) => Promise<VisionPageResult>;

export const LOW_TEXT_PAGE_CHARS = 24;

export function isLowTextPage(text: string): boolean {
  return normalizeText(text).length < LOW_TEXT_PAGE_CHARS;
}

export type OcrProgress = (pagesOcred: number, pagesToOcr: number) => void;
export type VisionProgress = (pagesDescribed: number, pagesToDescribe: number) => void;

async function rasterizePageToPngBase64(page: any, scale = 2): Promise<string> {
  if (typeof document === 'undefined') throw new Error('Page rasterization requires a browser environment.');
  const viewport = page.getViewport({ scale });
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.ceil(viewport.width));
  canvas.height = Math.max(1, Math.ceil(viewport.height));
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Could not get a 2D canvas context for rasterization.');
  await page.render({ canvasContext: context, viewport }).promise;
  const dataUrl = canvas.toDataURL('image/png');
  canvas.width = 0;
  canvas.height = 0;
  return dataUrl.slice(dataUrl.indexOf(',') + 1);
}

export async function extractPdfPagesWithOcr(
  file: File,
  { onPage, ocr, onOcr, vision, onVision }: {
    onPage?: PageProgress;
    ocr?: OcrPageFn;
    onOcr?: OcrProgress;
    vision?: VisionPageFn;
    onVision?: VisionProgress;
  } = {},
): Promise<{ pages: PageText[]; pageCount: number; pagesOcred: number; pagesOcrFailed: number; pagesDescribed: number }> {
  const data = new Uint8Array(await file.arrayBuffer());
  const pdf = await getDocument({ data }).promise;
  const pages: PageText[] = [];
  const scanned: number[] = [];

  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber);
    const content = await page.getTextContent();
    const pageText = normalizeText(content.items.map((item) => ('str' in item ? item.str : '')).join(' '));
    pages.push({ page: pageNumber, text: pageText, source: 'native_text' });
    if (isLowTextPage(pageText)) scanned.push(pageNumber);
    page.cleanup();
    onPage?.(pageNumber, pdf.numPages);
  }

  // A page with almost no selectable text is either scanned (OCR recovers the printed words)
  // or a chart/diagram/figure (vision describes what it shows). We rasterize each such page
  // once and try OCR first, then fall back to vision only while the page is still text-empty —
  // so vision is spent only where it adds something OCR could not.
  if ((ocr || vision) && scanned.length > 0) {
    let ocrDone = 0;
    let visionDone = 0;
    for (const pageNumber of scanned) {
      const entry = pages[pageNumber - 1];
      let imageBase64: string | null = null;
      try {
        const page = await pdf.getPage(pageNumber);
        imageBase64 = await rasterizePageToPngBase64(page);
        page.cleanup();
      } catch {
        imageBase64 = null;
      }

      if (ocr) {
        try {
          if (imageBase64 === null) throw new Error('page could not be rasterized');
          const result = await ocr({ imageBase64, pageNumber });
          const text = normalizeText(result?.text ?? '');
          if (result && text.length >= LOW_TEXT_PAGE_CHARS) {
            entry.text = text;
            entry.source = 'ocr';
            if (typeof result.confidence === 'number') entry.confidence = result.confidence;
          } else {
            entry.source = 'ocr_failed';
          }
        } catch {
          entry.source = 'ocr_failed';
        }
        ocrDone += 1;
        onOcr?.(ocrDone, scanned.length);
      }

      if (vision && imageBase64 !== null && isLowTextPage(entry.text)) {
        try {
          const described = await vision({ imageBase64, pageNumber });
          const text = normalizeText(described?.text ?? '');
          if (text.length >= LOW_TEXT_PAGE_CHARS) {
            entry.text = text;
            entry.source = 'vision';
          } else if (entry.source !== 'ocr_failed') {
            entry.source = 'vision_failed';
          }
        } catch {
          if (entry.source !== 'ocr_failed') entry.source = 'vision_failed';
        }
        visionDone += 1;
        onVision?.(visionDone, scanned.length);
      }
    }
  }

  const pagesOcred = pages.filter((page) => page.source === 'ocr').length;
  const pagesOcrFailed = pages.filter((page) => page.source === 'ocr_failed').length;
  const pagesDescribed = pages.filter((page) => page.source === 'vision').length;

  return { pages, pageCount: pdf.numPages, pagesOcred, pagesOcrFailed, pagesDescribed };
}

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

export async function readMaterialWithPages(
  file: File,
  onPage?: PageProgress,
  opts: { ocr?: OcrPageFn; onOcr?: OcrProgress; vision?: VisionPageFn; onVision?: VisionProgress } = {},
): Promise<{ text: string; pageCount: number; pages: PageText[]; pagesOcred: number; pagesOcrFailed: number; pagesDescribed: number }> {
  const extension = file.name.split('.').pop()?.toLowerCase() ?? '';
  if (extension === 'pdf') {
    const { pages, pageCount, pagesOcred, pagesOcrFailed, pagesDescribed } = await extractPdfPagesWithOcr(file, {
      onPage,
      ocr: opts.ocr,
      onOcr: opts.onOcr,
      vision: opts.vision,
      onVision: opts.onVision,
    });
    const text = normalizeText(pages.map((p) => p.text).join('\n\n'));
    if (text.length < 45) {
      throw new Error('This PDF appears to be scanned or contains too little selectable text. Try a text-based PDF or export it with OCR first.');
    }
    return { text, pageCount, pages, pagesOcred, pagesOcrFailed, pagesDescribed };
  }
  if (extension === 'txt' || extension === 'md') {
    const text = normalizeText(await file.text());
    if (text.length < 45) throw new Error('That file has too little text to build a knowledge check from.');
    onPage?.(1, 1);
    return { text, pageCount: 1, pages: [{ page: 1, text, source: 'native_text' }], pagesOcred: 0, pagesOcrFailed: 0, pagesDescribed: 0 };
  }
  throw new Error(`${extension ? `.${extension}` : 'That format'} is not supported. Upload a text-based PDF, TXT or MD file.`);
}

export const LARGE_DOCUMENT_PAGE_THRESHOLD = 50;
export const LARGE_DOCUMENT_CHAR_THRESHOLD = 200_000;

export function isLargeDocument(pageCount: number, textLength: number): boolean {
  return pageCount >= LARGE_DOCUMENT_PAGE_THRESHOLD || textLength >= LARGE_DOCUMENT_CHAR_THRESHOLD;
}

export const supportedAccept = supportedExtensions.map((extension) => `.${extension}`).join(',');

export const supportedFormatsSentence = (() => {
  const names = supportedExtensions.map((extension) => extension.toUpperCase());
  return `${names.slice(0, -1).join(', ')} or ${names[names.length - 1]}`;
})();

export const sampleMaterialText = `The consumer price index measures the change in prices paid by households for a fixed basket of goods and services. The current consumer price index uses 2012 as its base year, and every published index value is expressed against that base year. Basket weights show the relative importance of each item, and the basket weights are drawn from the most recent household consumption expenditure survey. Consumer prices rose 7.2 percent in the reference quarter compared with the same quarter a year earlier. Food and beverages made the largest contribution to the headline movement in the reference quarter. The rural basket recorded a slower pace of increase than the urban basket in the reference quarter, at 6.4 percent against 7.9 percent. Price collection covers 1181 selected markets, and field staff record quoted prices on a fixed schedule every month. A quoted price is treated as missing when the item is unavailable, and a missing quoted price is imputed from the same item in a neighbouring market. The response rate for the quarter was 96 percent, which is above the 92 percent threshold set for publication. Seasonal adjustment removes the part of a movement that repeats at the same point every year, so that the underlying trend can be read. Analysts should check the reference period, the coverage and the collection method before interpreting any quarterly change. A revision is published whenever a late return changes an index value that has already been released. The index is disseminated through a monthly press note, and the press note carries the caveats that apply to the headline figure.`;

export const sampleMaterialLabel = 'Sample / Demonstration Data';

export const sampleMaterialMeta = {
  fileName: 'Sample_Price_Index_Methodology_Note.txt',
  fileSize: sampleMaterialText.length,
  fileType: 'txt',
  pageCount: 1,
};

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
