/**
 * The document router: what IS this file, and how sure are we?
 *
 * This is a deterministic, zero-dependency classifier. It does not call a model — it reads
 * the signals the spec lists (filename, keywords, page count, table-shaped layout, title
 * lines) and scores each candidate type. It complements the existing AI classifier in
 * server/ai/classify.mjs: this one is instant, free, and always available, so it can run on
 * every upload to decide routing before any expensive call; the AI classifier can still be
 * consulted for a second opinion on genuinely ambiguous documents.
 *
 * The single most important job here is keeping a marksheet OUT of the learning pipeline.
 * A grade card fed to MCQ generation produces nonsense questions about roll numbers, so
 * MARKSHEET detection is deliberately sensitive: the table shape (Subject | Credits | Marks
 * | Grade) plus the vocabulary of results (SGPA, CGPA, semester, grade point) is a strong,
 * hard-to-fake fingerprint.
 *
 * Confidence is real, not decorative: a low score returns UNKNOWN with the ranked
 * candidates, so the caller can ask the user "what is this?" rather than guess wrong.
 */

export const DOC_TYPES = Object.freeze([
  'TEXTBOOK',
  'LEARNING_MATERIAL',
  'LECTURE_NOTES',
  'STUDY_NOTES',
  'QUESTION_PAPER',
  'MARKSHEET',
  'SYLLABUS',
  'CERTIFICATE',
  'UNKNOWN',
]);

/** Keyword fingerprints per type. Weight reflects how strongly a term implies the type. */
const KEYWORDS = {
  MARKSHEET: [
    ['sgpa', 3], ['cgpa', 3], ['grade point', 3], ['grade card', 4], ['marksheet', 5],
    ['mark sheet', 5], ['statement of marks', 4], ['transcript', 3], ['semester result', 4],
    ['academic transcript', 4], ['credits earned', 2], ['registration number', 2],
    ['roll number', 2], ['roll no', 2], ['seat number', 2], ['result', 1], ['grade', 1],
    ['credits', 1], ['obtained marks', 2], ['max marks', 2], ['pass', 1], ['fail', 1],
  ],
  CERTIFICATE: [
    ['certificate', 4], ['this is to certify', 5], ['has successfully completed', 4],
    ['certificate of completion', 5], ['awarded to', 3], ['certifies that', 4],
  ],
  QUESTION_PAPER: [
    ['question paper', 5], ['max marks', 2], ['maximum marks', 2], ['time allowed', 3],
    ['answer all questions', 4], ['attempt any', 3], ['section a', 2], ['section b', 2],
    ['marks:', 1], ['q1.', 2], ['q.1', 2], ['choose the correct', 2], ['objective type', 2],
  ],
  SYLLABUS: [
    ['syllabus', 5], ['course outcomes', 3], ['course objectives', 3], ['unit i', 2],
    ['unit-i', 2], ['credit hours', 2], ['prerequisite', 2], ['scheme of examination', 3],
    ['course content', 3], ['reference books', 2], ['l t p', 2],
  ],
  TEXTBOOK: [
    ['chapter', 2], ['exercises', 1], ['isbn', 3], ['edition', 2], ['table of contents', 3],
    ['preface', 2], ['bibliography', 2], ['index', 1], ['copyright', 1],
  ],
  LECTURE_NOTES: [
    ['lecture', 3], ['lecture notes', 4], ['slide', 1], ['agenda', 1], ['outline', 1],
  ],
  STUDY_NOTES: [
    ['notes', 2], ['summary', 1], ['important points', 2], ['definition', 1], ['formula', 1],
  ],
  LEARNING_MATERIAL: [
    ['introduction', 1], ['example', 1], ['concept', 1], ['definition', 1], ['theorem', 1],
  ],
};

/** Filename hints — cheaper and often decisive, but never used alone (spec §2). */
const FILENAME_HINTS = [
  [/marksheet|mark[-_ ]?sheet|grade[-_ ]?card|result|transcript|sgpa|cgpa|semester[-_ ]?\d/i, 'MARKSHEET', 3],
  [/certificate|certif/i, 'CERTIFICATE', 3],
  [/question[-_ ]?paper|qp[-_ ]|exam|midterm|endsem|sample[-_ ]?paper/i, 'QUESTION_PAPER', 3],
  [/syllabus|curriculum|scheme/i, 'SYLLABUS', 3],
  [/notes|lecture|unit[-_ ]?\d|chapter[-_ ]?\d/i, 'LECTURE_NOTES', 2],
  [/textbook|book|fundamentals|introduction[-_ ]?to/i, 'TEXTBOOK', 2],
];

function countOccurrences(haystack, needle) {
  if (needle === '') return 0;
  let count = 0;
  let from = 0;
  for (;;) {
    const at = haystack.indexOf(needle, from);
    if (at === -1) break;
    count += 1;
    from = at + needle.length;
  }
  return count;
}

/**
 * Detect table-shaped result rows: lines carrying several column separators AND a marks/
 * grade vocabulary. Real grade cards line subjects up in columns, which plain prose never
 * does, so this is the layout signal that separates a marksheet from an essay ABOUT grades.
 */
function tableSignal(text) {
  const lines = text.split(/\r?\n/);
  let gridRows = 0;
  let headerHit = false;
  const headerRe = /(subject|course)\b.*(credit|marks|grade|score)/i;
  for (const line of lines) {
    const seps = (line.match(/[|\t]/g) ?? []).length + (line.match(/\s{3,}/g) ?? []).length;
    if (headerRe.test(line)) headerHit = true;
    // A row with 2+ column gaps and at least one number looks tabular.
    if (seps >= 2 && /\d/.test(line)) gridRows += 1;
  }
  return { gridRows, headerHit };
}

/**
 * Classify a document from its extracted text and metadata.
 *
 *   text        extracted text (may be a sample for very large docs — the head is enough)
 *   filename    original filename (a hint, never the sole basis)
 *   pageCount   best page estimate
 *   charsPerPage  extractable chars / page, to flag scanned docs
 *
 * Returns { documentType, confidence (0-1), isScanned, scores, candidates, signals }.
 */
export function classifyDocument({ text = '', filename = '', pageCount = 1, charsPerPage = null } = {}) {
  const lower = String(text).toLowerCase();
  const name = String(filename).toLowerCase();
  const table = tableSignal(text);

  const scores = Object.fromEntries(DOC_TYPES.filter((t) => t !== 'UNKNOWN').map((t) => [t, 0]));

  // Keyword evidence.
  for (const [type, terms] of Object.entries(KEYWORDS)) {
    for (const [term, weight] of terms) {
      const hits = countOccurrences(lower, term);
      if (hits > 0) scores[type] += weight * Math.min(hits, 4);
    }
  }

  // Filename evidence.
  for (const [re, type, weight] of FILENAME_HINTS) {
    if (re.test(name)) scores[type] += weight;
  }

  // Layout evidence — the marksheet's strongest tell.
  if (table.headerHit) scores.MARKSHEET += 5;
  if (table.gridRows >= 3) scores.MARKSHEET += Math.min(table.gridRows, 8);
  if (table.gridRows >= 3 && table.headerHit) scores.QUESTION_PAPER = Math.max(0, scores.QUESTION_PAPER - 2);

  // Length evidence: a long, multi-chapter document is almost certainly a textbook, not a
  // one-page result. This keeps a passing mention of "grade" in a 900-page book from
  // tipping it into MARKSHEET.
  if (pageCount >= 40) {
    scores.TEXTBOOK += Math.min(Math.floor(pageCount / 40), 8);
    scores.MARKSHEET = Math.max(0, scores.MARKSHEET - 4);
    scores.CERTIFICATE = Math.max(0, scores.CERTIFICATE - 3);
  }
  if (pageCount <= 3) {
    // Short docs are much more likely to be results/certificates/question papers.
    scores.MARKSHEET += 1;
    scores.CERTIFICATE += 1;
  }

  // Scanned detection: a page-bearing PDF that yielded almost no text.
  const isScanned = charsPerPage !== null && pageCount >= 1 && charsPerPage < 60 && text.trim().length < 200;

  // Rank.
  const ranked = Object.entries(scores)
    .map(([type, score]) => ({ type, score }))
    .sort((a, b) => b.score - a.score);

  const top = ranked[0];
  const second = ranked[1] ?? { score: 0 };
  const totalSignal = ranked.reduce((sum, r) => sum + r.score, 0) || 1;

  // Confidence blends the winner's share of all signal with its margin over the runner-up,
  // so "lots of evidence, clearly ahead" scores high and "barely edged it out" scores low.
  const share = top.score / totalSignal;
  const margin = (top.score - second.score) / (top.score || 1);
  let confidence = Math.max(0, Math.min(1, 0.5 * share + 0.5 * margin));
  if (top.score === 0) confidence = 0;

  const LOW = 0.35;
  const documentType = top.score === 0 || confidence < LOW ? 'UNKNOWN' : top.type;

  return {
    documentType,
    confidence: Number(confidence.toFixed(2)),
    isScanned,
    scores,
    // Ranked non-zero candidates, so a low-confidence caller can offer a choice.
    candidates: ranked.filter((r) => r.score > 0).slice(0, 4).map((r) => r.type),
    signals: { tableRows: table.gridRows, tableHeader: table.headerHit, pageCount },
  };
}

/** A learning document is one we should build questions/material from. */
export function isLearningType(documentType) {
  return documentType === 'TEXTBOOK'
    || documentType === 'LEARNING_MATERIAL'
    || documentType === 'LECTURE_NOTES'
    || documentType === 'STUDY_NOTES';
}
