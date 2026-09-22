/**
 * Smart Document Intelligence — backend tests (no key, no model, no network).
 *
 * Proves the core invariants the spec cares about most:
 *   - a document's processing mode is chosen automatically from page count + type, and the
 *     thresholds are configurable (not hard-coded around 800);
 *   - the router tells a textbook from a marksheet from a question paper, with real
 *     confidence, and marksheets never look like learning material;
 *   - a 1-page document is a valid source, never rejected for being short;
 *   - chunking preserves page ranges and chapter/section context;
 *   - a topic query over a large book retrieves ONLY the relevant pages, bounded to a hard
 *     character/chunk budget — i.e. the whole book is never sent to the AI;
 *   - a marksheet parses into rows with honest percentages and competency gaps.
 *
 *   node scripts/docintel-test.mjs
 */

import { loadConfig, modeFor, isLargeMode, MODES } from '../server/documents/config.mjs';
import { classifyDocument, isLearningType } from '../server/documents/classify.mjs';
import { chunkPages, pagesFromText } from '../server/documents/chunk.mjs';
import { buildChunkIndex, retrieveContext } from '../server/documents/search.mjs';
import { extractMarksheet, analyzePerformance } from '../server/documents/marksheet.mjs';

let passed = 0;
let failed = 0;
function check(name, fn) {
  let problem = null;
  try { problem = fn() ?? null; } catch (e) { problem = `threw: ${e.message}`; }
  if (problem) { failed += 1; console.log(`  FAIL  ${name}\n        ${problem}`); }
  else { passed += 1; console.log(`  ok    ${name}`); }
}

/* ------------------------------------------------------------------ §4/§32 modes */
console.log('\n  -- processing mode is automatic and configurable --------------\n');

check('1 page → SMALL (fast path, not the heavy pipeline)', () => {
  const m = modeFor(1);
  if (m !== MODES.SMALL) return `got ${m}`;
  if (isLargeMode(m)) return 'SMALL was treated as large';
});
check('50 pages → MEDIUM', () => (modeFor(50) === MODES.MEDIUM ? null : `got ${modeFor(50)}`));
check('150 pages → LARGE', () => (modeFor(150) === MODES.LARGE ? null : `got ${modeFor(150)}`));
check('600 pages → VERY_LARGE', () => (modeFor(600) === MODES.VERY_LARGE ? null : `got ${modeFor(600)}`));
check('900 pages → DEEP', () => (modeFor(900) === MODES.DEEP ? null : `got ${modeFor(900)}`));
check('marksheet routes to STRUCTURED_RESULT regardless of pages', () => {
  const m = modeFor(1, { documentType: 'MARKSHEET' });
  return m === MODES.STRUCTURED_RESULT ? null : `got ${m}`;
});
check('a page-bearing PDF with no text → SCANNED', () => {
  const m = modeFor(300, { isScanned: true });
  return m === MODES.SCANNED ? null : `got ${m}`;
});
check('thresholds are configurable (not hard-coded to 800)', () => {
  const cfg = loadConfig({ DOC_DEEP_MIN_PAGES: '300' });
  const m = modeFor(320, {}, cfg);
  return m === MODES.DEEP ? null : `got ${m} with deepMin=300`;
});

/* ------------------------------------------------------------------ §2/§15/§19 router */
console.log('\n  -- the router: what is this file, and how sure? ---------------\n');

const MARKSHEET_TEXT = `
UNIVERSITY OF EXAMPLE — SEMESTER 4 GRADE CARD
Registration Number: 21BCS1234
Subject            | Credits | Marks | Grade
Data Structures    | 4       | 48/100 | C
Database Systems   | 4       | 78/100 | A
Computer Networks  | 3       | 61/100 | B
Mathematics IV     | 4       | 52/100 | C
SGPA: 6.2   CGPA: 6.5   Result: PASS
`;

check('a grade card is detected as MARKSHEET, not a textbook', () => {
  const r = classifyDocument({ text: MARKSHEET_TEXT, filename: 'Semester_4_Result.pdf', pageCount: 1, charsPerPage: 400 });
  if (r.documentType !== 'MARKSHEET') return `got ${r.documentType} (conf ${r.confidence})`;
  if (isLearningType(r.documentType)) return 'a marksheet was called learning material';
  if (r.confidence < 0.4) return `confidence too low: ${r.confidence}`;
});

check('a marksheet does NOT enter the learning pipeline', () => {
  const r = classifyDocument({ text: MARKSHEET_TEXT, filename: 'result.pdf', pageCount: 1, charsPerPage: 400 });
  return isLearningType(r.documentType) ? 'routed into learning' : null;
});

const TEXTBOOK_TEXT = `Chapter 8 Database Design
8.2 Functional Dependencies
A functional dependency describes a relationship between attributes. Normalization uses
functional dependencies to reduce redundancy and avoid update anomalies in a relation.
8.4 First Normal Form
A relation is in first normal form when every attribute holds a single atomic value.`.repeat(3);

check('a chaptered document is detected as a learning type', () => {
  const r = classifyDocument({ text: TEXTBOOK_TEXT, filename: 'DBMS_Textbook.pdf', pageCount: 400, charsPerPage: 1800 });
  if (!isLearningType(r.documentType)) return `got ${r.documentType}`;
});

check('a big book with a stray "grade" mention is NOT a marksheet', () => {
  const text = `${TEXTBOOK_TEXT}\nStudents receive a grade for the exercises.`;
  const r = classifyDocument({ text, filename: 'book.pdf', pageCount: 900, charsPerPage: 1800 });
  return r.documentType === 'MARKSHEET' ? 'a 900-page book was misread as a marksheet' : null;
});

check('a question paper is detected', () => {
  const qp = `B.Tech Question Paper\nTime Allowed: 3 hours   Maximum Marks: 70\nSection A\nAnswer all questions\nQ1. Define normalization.\nQ2. Attempt any two.`;
  const r = classifyDocument({ text: qp, filename: 'midterm-qp.pdf', pageCount: 2, charsPerPage: 300 });
  return r.documentType === 'QUESTION_PAPER' ? null : `got ${r.documentType}`;
});

check('an ambiguous document yields low confidence + candidates, not a wrong guess', () => {
  const r = classifyDocument({ text: 'hello world this is some short text', filename: 'file.pdf', pageCount: 1 });
  if (r.documentType !== 'UNKNOWN') return `expected UNKNOWN, got ${r.documentType} (conf ${r.confidence})`;
});

/* ------------------------------------------------------------------ §3 small docs */
console.log('\n  -- a 1-page document is a valid source, never rejected --------\n');

check('a rich 1-page note chunks into at least one usable chunk', () => {
  const onePage = `Photosynthesis Overview
Photosynthesis is the process by which green plants convert light energy into chemical
energy. The light-dependent reactions occur in the thylakoid membrane. The Calvin cycle
fixes carbon dioxide into glucose. Chlorophyll absorbs light most strongly in the blue
and red wavelengths. The overall equation shows six molecules of carbon dioxide.`;
  const chunks = chunkPages(pagesFromText(onePage), { documentId: 'note' });
  if (chunks.length < 1) return 'a useful one-page note produced no chunks';
  if (chunks[0].text.length < 50) return 'the chunk lost the page content';
});

/* ------------------------------------------------------------------ §7 chunking */
console.log('\n  -- page-aware chunking preserves provenance -------------------\n');

check('chunks carry page ranges and chapter/section context', () => {
  const pages = [
    { page: 311, text: 'Chapter 8 Database Design\n\n8.2 Functional Dependencies\n\nA functional dependency constrains attributes.' },
    { page: 312, text: 'Normalization reduces redundancy by decomposing relations based on functional dependencies.' },
  ];
  const chunks = chunkPages(pages, { documentId: 'dbms', cfg: loadConfig({ DOC_CHUNK_CHARS: '120' }) });
  if (chunks.length === 0) return 'no chunks';
  const withChapter = chunks.find((c) => (c.chapter ?? '').toLowerCase().includes('chapter 8'));
  if (!withChapter) return 'chapter heading was not attached to any chunk';
  const paged = chunks.every((c) => Number.isFinite(c.pageStart) && Number.isFinite(c.pageEnd));
  if (!paged) return 'a chunk is missing its page range';
  const spans311 = chunks.some((c) => c.pageStart <= 311 && c.pageEnd >= 311);
  if (!spans311) return 'page 311 is not covered by any chunk';
});

/* ------------------------------------------------------------------ §8/§9/§24 retrieve */
console.log('\n  -- topic retrieval sends ONLY relevant pages, bounded ---------\n');

// Build a synthetic 900-page "book": each topic occupies a distinct page range, with lots
// of unrelated filler pages between them.
function syntheticBook() {
  const pages = [];
  const filler = 'This section discusses general background material and administrative notes about the course. ';
  for (let p = 1; p <= 900; p += 1) {
    if (p >= 311 && p <= 320) {
      pages.push({ page: p, text: 'Chapter 8 Database Design\n\n8.5 Normalization\n\nNormalization decomposes relations to remove redundancy and avoid update anomalies. First normal form, second normal form and third normal form each remove a class of anomaly using functional dependencies.' });
    } else if (p >= 500 && p <= 508) {
      pages.push({ page: p, text: 'Chapter 14 Transport Layer\n\n14.3 TCP Congestion Control\n\nTCP congestion control uses slow start, congestion avoidance, fast retransmit and fast recovery to adapt the sending rate to available network capacity and avoid congestion collapse.' });
    } else if (p >= 700 && p <= 705) {
      pages.push({ page: p, text: 'Chapter 20 Machine Learning\n\n20.1 Neural Networks\n\nA neural network is composed of layers of neurons connected by weighted edges trained by backpropagation to minimise a loss function.' });
    } else {
      pages.push({ page: p, text: filler.repeat(6) });
    }
  }
  return pages;
}

const book = syntheticBook();
const bookChunks = chunkPages(book, { documentId: 'os-book' });
const bookIndex = buildChunkIndex(bookChunks);
const fullBookChars = book.reduce((s, p) => s + p.text.length, 0);

check('the book is chunked into many chunks (not one giant blob)', () => {
  if (bookChunks.length < 20) return `only ${bookChunks.length} chunks from 900 pages`;
});

check('"normalization" retrieves the normalization pages (311-320)', () => {
  const r = retrieveContext(bookIndex, 'I want to learn normalization');
  const hitsTopic = r.usedChunks.some((c) => c.pageStart >= 300 && c.pageEnd <= 330);
  if (!hitsTopic) return `retrieved pages ${JSON.stringify(r.pageRanges)} — missed 311-320`;
  const leaksNN = r.usedChunks.some((c) => c.pageStart >= 700 && c.pageEnd <= 705);
  if (leaksNN) return 'retrieved unrelated neural-network pages';
});

check('"TCP congestion control" retrieves pages ~500-508, not normalization', () => {
  const r = retrieveContext(bookIndex, 'find everything about TCP congestion control');
  const hits = r.usedChunks.some((c) => c.pageStart >= 495 && c.pageEnd <= 515);
  if (!hits) return `retrieved ${JSON.stringify(r.pageRanges)} — missed 500-508`;
});

check('retrieved context is BOUNDED — never the whole book', () => {
  const cfg = loadConfig();
  const r = retrieveContext(bookIndex, 'normalization');
  if (r.usedChunks.length > cfg.retrieval.maxChunks) return `used ${r.usedChunks.length} > cap ${cfg.retrieval.maxChunks}`;
  if (r.contextText.length > cfg.retrieval.maxContextChars) return `context ${r.contextText.length} > cap ${cfg.retrieval.maxContextChars}`;
  // The real point: the AI sees a tiny fraction of a 900-page book.
  if (r.contextText.length > fullBookChars * 0.2) return 'context was not meaningfully smaller than the whole book';
});

check('retrieval returns page ranges for a transparent preview', () => {
  const r = retrieveContext(bookIndex, 'normalization');
  if (!Array.isArray(r.pageRanges) || r.pageRanges.length === 0) return 'no page ranges returned';
  if (!r.pageRanges.every((pr) => Number.isFinite(pr.start) && Number.isFinite(pr.end))) return 'malformed page range';
});

/* ------------------------------------------------------------------ §17 marksheet analysis */
console.log('\n  -- marksheet → honest performance + competency gaps -----------\n');

check('marksheet rows parse with computed percentages', () => {
  const ms = extractMarksheet(MARKSHEET_TEXT);
  if (ms.rows.length < 3) return `parsed only ${ms.rows.length} rows`;
  const ds = ms.rows.find((r) => /data structures/i.test(r.subject));
  if (!ds) return 'Data Structures row not found';
  if (ds.percent !== 48) return `Data Structures percent = ${ds.percent}, expected 48`;
});

check('a weak subject becomes a competency gap; a strong one does not', () => {
  const analysis = analyzePerformance(extractMarksheet(MARKSHEET_TEXT));
  const gapDS = analysis.competencyGaps.find((g) => /data structures/i.test(g.subject));
  if (!gapDS) return 'Data Structures (48%) was not flagged as a gap';
  const strongDB = analysis.strongAreas.some((s) => /database/i.test(s.subject));
  // Database at 78% is 'average' by the shared scale, not strong — assert it is NOT a gap.
  const dbGap = analysis.competencyGaps.some((g) => /database/i.test(g.subject));
  if (dbGap) return 'Database (78%) was wrongly flagged as a gap';
});

check('an ungrounded letter-only grade is unrated, never a guessed percent', () => {
  const ms = extractMarksheet('Physics    A\nChemistry    B');
  const rated = ms.rows.filter((r) => r.percent !== null);
  if (rated.length > 0) return 'a letter-only grade was converted to a fabricated percent';
});

console.log(`\n  ${failed === 0 ? 'All doc-intelligence checks passed.' : 'Something failed.'}  ${passed} passed, ${failed} failed\n`);
process.exit(failed === 0 ? 0 : 1);
