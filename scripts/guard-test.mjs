/**
 * guard-test.mjs — the STUDY MATERIAL ONLY upload policy (spec §15/§16/§17/§20).
 *
 * Two layers, one command:
 *
 *   PART 1 — unit checks of the pure gate `guardDocument` (server/documents/document-type-
 *   guard.mjs). It proves the ACCEPT set (textbook, lecture notes, technical docs, research
 *   paper, educational PDF with charts, scanned study material, a huge textbook) and the
 *   REJECT set (marksheet, transcript, Aadhaar/PAN/passport/DL identity, certificate, bank
 *   statement, resume, medical report, a random personal scrap, a blank file) — plus the
 *   NO-FALSE-POSITIVE guards from §16 (a physics textbook that says "marks"/"grade"; a CS PDF
 *   with id/name/date/address; a long privacy TUTORIAL that merely shows an example Aadhaar
 *   number). No AI, no network — the gate is deterministic.
 *
 *   PART 2 — HTTP checks against a REAL server (mock provider, throwaway data dir) proving the
 *   gate is enforced server-side and BEFORE any provider call, so a client that skips the
 *   frontend cannot push a rejected file to Gemini (§10/§17):
 *     - small path  POST /api/ai/generate-mcqs   marksheet → 422 document_rejected (blocked
 *                   before the provider); textbook → 200 with questions (provider ran).
 *     - classify    POST /api/ai/classify-material  Aadhaar → 422 (not even classified by AI).
 *     - guard route POST /api/documents/guard    marksheet → reject+message; textbook → accept.
 *     - large path  upload/append/finalize  marksheet pages → finalize 422 + document purged
 *                   (generate then unreachable); 899-page textbook → finalize ready + generate
 *                   returns grounded questions (the large flow is unchanged, §11/§20-F).
 *
 * Scenarios A–G (§20) are labelled inline so the mapping is auditable.
 *
 *   node scripts/guard-test.mjs
 */

import { spawn } from 'node:child_process';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { guardDocument, isRejected } from '../server/documents/document-type-guard.mjs';
import { buildDocumentIndex } from '../server/ai/validation.mjs';
import { generateBackfill } from '../server/ai/backfill.mjs';

let pass = 0; let fail = 0;
const ok = (name) => { pass += 1; console.log(`  ok    ${name}`); };
const bad = (name, detail) => { fail += 1; console.log(`  FAIL  ${name}\n        ${detail}`); };

/** Assert a text is ACCEPTED as study material. */
function expectAccept(name, text, { pageCount = 1, charsPerPage = null } = {}) {
  const r = guardDocument({ text, filename: '', pageCount, charsPerPage });
  if (r.decision === 'accept') ok(`accept: ${name}`);
  else bad(`accept: ${name}`, `got reject as '${r.documentType}' — ${r.reason}`);
}

/** Assert a text is REJECTED; when expectType is given, also assert the category. */
function expectReject(name, text, expectType, { pageCount = 1, charsPerPage = null } = {}) {
  const r = guardDocument({ text, filename: '', pageCount, charsPerPage });
  if (!isRejected(r)) { bad(`reject: ${name}`, `expected reject, got accept (${r.reason})`); return; }
  if (expectType && r.documentType !== expectType) { bad(`reject: ${name}`, `expected type '${expectType}', got '${r.documentType}'`); return; }
  if (!r.message || /^invalid file/i.test(r.message)) { bad(`reject: ${name}`, `missing/*invalid* message: ${JSON.stringify(r.message)}`); return; }
  ok(`reject: ${name} → ${r.documentType}`);
}

// __APPEND_MARKER__

// A study paragraph reused by the small path AND embedded in the 899-page book, so ONE
// grounded mock reply serves both HTTP generation checks (its sentences appear in both docs).
const TOPIC_TEXT = 'Normalization decomposes relations to remove redundancy and prevent update anomalies. First normal form requires that every attribute holds a single atomic value. Second normal form removes partial dependencies on a composite key. Third normal form removes transitive dependencies. Boyce Codd normal form is a stricter form that addresses anomalies third normal form can leave behind. Functional dependencies drive the whole decomposition process.';

// The clearly-study small-path text: a textbook section that contains TOPIC_TEXT verbatim.
const STUDY_SECTION = `Chapter 8: Database Design. This section introduces the concept of normalization with a worked example. Definition: ${TOPIC_TEXT} The following exercise reinforces the concept.`;

// ---- long-prose fixtures (protect large PDFs and defeat false positives, §11/§16) --------
const TEXTBOOK_PARA = 'This chapter introduces the theory in plain language and then develops it carefully. The section opens with a definition, states the governing equation, and proves the central theorem. A worked example follows, and the exercise at the end asks the reader to apply the concept to a new problem. The analysis emphasises why each assumption matters and how the method generalises. ';
const BIG_TEXTBOOK = TEXTBOOK_PARA.repeat(30); // ~1000+ words of continuous educational prose

// A privacy TUTORIAL that SHOWS a sample Aadhaar number — long educational prose, so §16 says
// it must be ACCEPTED (it is about IDs, it is not an ID). Rich in distinct study terms.
const PRIVACY_TUTORIAL = `Chapter 12: Data Privacy and Identifiers. This section provides an introduction to the concept of personally identifiable information and explains why it must be protected inside software systems. As an illustrative example, a national identifier issued by the Government of India, such as the twelve digit number 1234 5678 9012 printed on an Aadhaar card, must never be stored in plaintext or logged. The following definition and analysis describe how hashing and tokenization reduce risk in practice. In this chapter we work through several examples and exercises so that students understand the underlying theory and can apply the method. The summary revisits each concept and the references point to further reading. ${TEXTBOOK_PARA}`;

console.log('\n  -- PART 1: gate unit checks -----------------------------------\n');
console.log('  accepted study material (§15 accept set, §20 A/B/G):');

// A / textbook (§20-A)
expectAccept('textbook chapter (§20-A)', 'Chapter 3: Introduction to Thermodynamics. Thermodynamics is the branch of physics that studies heat, work, temperature and energy. The first law states that energy is conserved. This section defines the key concepts, presents the governing equation, and works a short example. The theorem that follows proves the relation between internal energy and enthalpy, and the exercise applies it.', { pageCount: 12 });
// lecture notes
expectAccept('lecture notes', 'Lecture 5: Data Structures. Today we cover linked lists, stacks and queues. A stack is a last-in first-out structure whose key operations are push and pop. See the example below and then complete the exercises for this module. This section summarises the running time of each operation.', { pageCount: 4 });
// technical / programming documentation
expectAccept('programming documentation', 'The function accepts a variable of integer type and returns its factorial. This algorithm runs in linear time. Example usage appears in the code block below. Refer to the API reference section for the full list of functions, their parameters and return values, and study the accompanying example.', { pageCount: 6 });
// research paper
expectAccept('research paper', 'Abstract. This paper presents a novel methodology for image segmentation. We introduce a hypothesis and validate it through a controlled experiment. Our analysis of the results demonstrates a significant improvement over the baseline. The conclusion summarises the contribution and outlines future research. References follow this section.', { pageCount: 9 });
// educational PDF with charts/tables (§12/§20-G) — visuals must NOT auto-reject
expectAccept('educational PDF with charts/tables (§12/§20-G)', 'Figure 4 shows the distribution of rainfall across regions. As the chart illustrates, the trend increased across the decade. This section analyses the data presented in Table 2 and explains the underlying concept, with a worked example and a short exercise for the reader.', { pageCount: 8 });
// scanned study material (§20-B) — OCR'd textbook text, sparse but clearly educational
expectAccept('scanned study material (§20-B)', 'Photosynthesis converts light energy into chemical energy. Chlorophyll absorbs sunlight in the leaf. This process produces glucose and oxygen. The following section explains the light-dependent reactions with a labelled example.', { pageCount: 3, charsPerPage: 180 });
// huge textbook (protect the large path, §11)
expectAccept('899-page textbook prose (§11)', BIG_TEXTBOOK, { pageCount: 899 });

console.log('\n  rejected non-study documents (§15 reject set, §20 C/E):');
// C / marksheet (§20-C)
expectReject('marksheet (§20-C)',
  'STATEMENT OF MARKS\nRoll No: 12345   Registration No: 987654\nName: Rahul Sharma   Semester: IV   Academic Year: 2023-24\nSubject        Max Marks   Marks Obtained   Grade\nMathematics    100         82               A\nPhysics        100         75               B\nChemistry      100         68               B\nSGPA: 7.8   CGPA: 8.1\nResult: PASS — First Class with Distinction',
  'marksheet');
// transcript
expectReject('academic transcript',
  'OFFICIAL TRANSCRIPT OF RECORDS\nUniversity of Delhi\nStudent: A. Kumar   Roll No: 55   Registration No: 231\nSemester I   Grade Point 8.0   CGPA 8.0\nThis academic transcript is issued by the Controller of Examinations.',
  'transcript');
// E / Aadhaar identity (§20-E)
expectReject('Aadhaar identity (§20-E)',
  'Government of India\nUnique Identification Authority of India\nAadhaar\nName: Suresh Kumar   DOB: 01/01/1990   Male\n1234 5678 9012\nYour Aadhaar, Your Identity.',
  'government_id');
// PAN identity
expectReject('PAN card identity',
  'INCOME TAX DEPARTMENT\nGOVT OF INDIA\nPermanent Account Number\nABCDE1234F\nName: RAHUL SHARMA   Father\'s Name: MOHAN SHARMA   Date of Birth: 01/01/1985',
  'government_id');
// passport
expectReject('passport',
  'REPUBLIC OF INDIA\nPassport\nType P   Country Code IND   Passport No: A1234567\nSurname: SHARMA   Given Names: RAHUL\nNationality: INDIAN   Date of Issue: 2019   Place of Issue: DELHI   Date of Expiry: 2029',
  'passport');
// driving licence
expectReject('driving licence',
  'DRIVING LICENCE\nTransport Department, Government of Maharashtra\nDL No: MH 12 20110012345\nName: R. Sharma   Date of Birth: 1990   Valid Till: 2030   Class of Vehicle: LMV',
  'government_id');
// certificate
expectReject('certificate of completion',
  'CERTIFICATE OF COMPLETION\nThis is to certify that Rahul Sharma has successfully completed the course in Data Science. Awarded on 12th May 2023.\nSignature of the Director.',
  'certificate');
// bank statement
expectReject('bank statement',
  'ACCOUNT STATEMENT — HDFC Bank\nAccount Number: 12345678901   IFSC: HDFC0001234\nStatement Period: 01/04/2023 to 30/04/2023\nDate         Description       Amount     Balance\n01/04/2023   UPI Payment       1,200.00   45,000.00\n05/04/2023   Salary Credit    50,000.00   95,000.00\nClosing Balance: 95,000.00',
  'financial_document');
// resume
expectReject('resume / CV',
  'CURRICULUM VITAE\nRahul Sharma\nEmail: rahul@example.com   Phone: +91 98765 43210\nCareer Objective: to work as a software engineer.\nWork Experience: five years at TechCorp.\nProfessional Experience: backend development.\nReferences available on request.',
  'resume');
// medical report
expectReject('medical report',
  'MEDICAL REPORT\nPatient Name: Rahul Sharma   Patient ID: 4432\nDiagnosis: Type 2 Diabetes\nPrescription: Metformin 500mg   Dosage: twice daily\nBlood Test: HbA1c 7.2\nConsultant Physician: Dr. Verma   Treatment Plan: lifestyle change.',
  'medical_document');
// random personal scrap → unknown
expectReject('random personal scrap → unknown',
  'Order #4471 Qty 3 Item A22 Ref 9910 Bin 44 Lot 2231 SKU 88213 Aisle 7 Shelf 3 Zone B Pallet 12 Tote 5 Rack 9',
  'unknown');
// blank / image-only file → unrelated_image
expectReject('blank / unsupported file → unrelated_image', '     \n   \t   \n  ', 'unrelated_image');

console.log('\n  NO false positives (§16) — these must ACCEPT:');
// physics textbook that says "marks" and "grade"
expectAccept('physics textbook mentioning "marks"/"grade" (§16)', 'In this section on examination technique we discuss how examiners award marks for each step of a derivation and how a careless slip can cost a grade. This chapter explains the marking scheme in physics and works a full example. The theorem below relates force and acceleration, and the exercise reinforces the concept of momentum.', { pageCount: 3 });
// CS PDF with id / name / date / address
expectAccept('CS PDF with id/name/date/address (§16)', 'This section explains how to design a relational database schema for a user account table. Typical columns include an id, a name, a date of birth and a postal address. The id column is the primary key and must be unique. This example demonstrates schema normalization; the following algorithm validates each field before an insert, and the exercise asks you to extend it.', { pageCount: 5 });
// long tutorial that SHOWS an example Aadhaar number
expectAccept('privacy tutorial showing an example Aadhaar number (§16)', PRIVACY_TUTORIAL, { pageCount: 40 });

// __APPEND_MARKER_2__

// ---- PART 2: HTTP enforcement against a real server -------------------------
const PORT = Number(process.env.GUARD_PORT ?? 4419);
const BASE = `http://127.0.0.1:${PORT}`;
const ORIGIN = 'http://localhost:5173';
const workdir = mkdtempSync(join(tmpdir(), 'guard-'));

/** One canned model reply, grounded in TOPIC_TEXT (so it validates in both study docs). */
function buildMockReply() {
  const idx = buildDocumentIndex(TOPIC_TEXT);
  const pool = generateBackfill(TOPIC_TEXT, idx, { need: 24, existing: [], allowedTopics: ['normalization'], preferTopics: ['normalization'] }).accepted
    .map((q) => ({ question: q.question, options: q.options, correctIndex: q.correctIndex, topic: q.topic, kind: q.kind, explanation: q.explanation, source: q.source }));
  return JSON.stringify({ questions: pool });
}

/** An 899-page book: rich study head, TOPIC_TEXT on pp.300–330, prose filler elsewhere. */
function buildBookPages() {
  const pages = [];
  const filler = 'This chapter discusses general administrative background and scheduling notes for the course. ';
  for (let p = 1; p <= 899; p += 1) {
    if (p <= 3) pages.push({ page: p, text: TEXTBOOK_PARA.repeat(3) });
    else if (p >= 300 && p <= 330) pages.push({ page: p, text: `Chapter 8 Database Design\n\n8.5 Normalization\n\n${TOPIC_TEXT}` });
    else pages.push({ page: p, text: filler.repeat(6) });
  }
  return pages;
}

const MARKSHEET_TEXT = 'STATEMENT OF MARKS\nRoll No: 12345   Registration No: 987654\nName: Rahul Sharma   Semester: IV   Academic Year: 2023-24\nSubject        Max Marks   Marks Obtained   Grade\nMathematics    100         82               A\nPhysics        100         75               B\nChemistry      100         68               B\nSGPA: 7.8   CGPA: 8.1\nResult: PASS — First Class with Distinction';
const AADHAAR_TEXT = 'Government of India\nUnique Identification Authority of India\nAadhaar\nName: Suresh Kumar   DOB: 01/01/1990   Male\n1234 5678 9012\nYour Aadhaar, Your Identity. This card is proof of identity, not of citizenship.';

let cookie = '';
async function req(method, path, { body, origin = ORIGIN } = {}) {
  const headers = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (origin) headers.Origin = origin;
  if (cookie) headers.Cookie = cookie;
  const res = await fetch(`${BASE}${path}`, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
  for (const c of res.headers.getSetCookie?.() ?? []) { const m = /^(sk_session=[^;]+)/.exec(c); if (m) cookie = m[1]; }
  let json = null; try { json = await res.json(); } catch { /* non-JSON */ }
  return { status: res.status, json };
}

async function waitForHealth() {
  for (let i = 0; i < 60; i += 1) {
    try { const r = await fetch(`${BASE}/api/health`); if (r.ok) return true; } catch { /* not up */ }
    await new Promise((r) => setTimeout(r, 250));
  }
  return false;
}

const mockFile = join(workdir, 'reply.json');
writeFileSync(mockFile, buildMockReply());
const server = spawn('node', ['server/index.mjs'], {
  cwd: new URL('..', import.meta.url).pathname,
  env: {
    ...process.env,
    AUTH_PORT: String(PORT), AUTH_DATA_DIR: workdir,
    SESSION_SECRET: 'guard_http_test_secret_0123456789abcdefghij',
    AI_PROVIDER: 'mock', AI_MOCK_FILE: mockFile, GEMINI_API_KEY: '',
    DATABASE_URL: '', // force the throwaway JSON store — never touch a real Postgres
    NEXORA_DATASET_DIR: join(new URL('..', import.meta.url).pathname, 'server/course-fixtures'),
  },
  stdio: ['ignore', 'pipe', 'pipe'],
});
let serverLog = '';
server.stdout.on('data', (d) => { serverLog += d; });
server.stderr.on('data', (d) => { serverLog += d; });

// __APPEND_MARKER_3__

async function sendBatched(documentId, pages) {
  let batch = []; let chars = 0; let calls = 0;
  const flush = async () => {
    if (batch.length === 0) return true;
    const r = await req('POST', '/api/documents/append', { body: { documentId, pages: batch } });
    calls += 1; batch = []; chars = 0;
    if (r.status !== 200) { bad('append batch', `status ${r.status}`); return false; }
    return true;
  };
  for (const p of pages) {
    batch.push(p); chars += p.text.length + 16;
    if (chars >= 120_000 || batch.length >= 300) { if (!(await flush())) return -1; }
  }
  return (await flush()) ? calls : -1;
}

async function main() {
  console.log('\n  -- PART 2: server-side enforcement (real server, mock provider) --\n');
  if (!(await waitForHealth())) { bad('server boot', `did not start:\n${serverLog.slice(-600)}`); return; }
  ok('server booted');
  const signup = await req('POST', '/api/auth/signup', { body: { name: 'Guard Tester', email: 'guard@mospi.gov.in', password: 'correct-horse-battery-staple-42' } });
  if (signup.status !== 201) { bad('signup', `status ${signup.status}`); return; }
  ok('signed in');

  // H2 — small path: a marksheet is blocked BEFORE the provider (§10/§15/§17/§20-C).
  const genBad = await req('POST', '/api/ai/generate-mcqs', { body: { text: MARKSHEET_TEXT, topics: ['marks'], concepts: [], questionCount: 10 } });
  if (genBad.status === 422 && genBad.json?.error?.code === 'document_rejected' && genBad.json?.documentType === 'marksheet' && !genBad.json?.questions)
    ok('small path: marksheet → 422 document_rejected, no questions, never reached the provider');
  else bad('small path marksheet blocked', `status ${genBad.status} json ${JSON.stringify(genBad.json)}`);

  // H3 — small path: genuine study material still flows THROUGH to the provider (§20-A).
  const genOk = await req('POST', '/api/ai/generate-mcqs', { body: { text: STUDY_SECTION, topics: ['normalization'], concepts: [], questionCount: 5 } });
  if (genOk.status === 200 && Array.isArray(genOk.json?.questions) && genOk.json.questions.length > 0)
    ok(`small path: study material accepted → provider produced ${genOk.json.questions.length} questions`);
  else bad('small path study accepted', `status ${genOk.status} json ${JSON.stringify(genOk.json?.error ?? genOk.json)}`);

  // H4 — classify route: a sensitive ID is NEVER even sent to the AI to classify (§3/§10).
  const clsBad = await req('POST', '/api/ai/classify-material', { body: { text: AADHAAR_TEXT } });
  if (clsBad.status === 422 && clsBad.json?.error?.code === 'document_rejected')
    ok('classify route: Aadhaar → 422 document_rejected (not classified by AI)');
  else bad('classify route blocks Aadhaar', `status ${clsBad.status} json ${JSON.stringify(clsBad.json)}`);

  // H5 — the explicit guard route the frontend pre-gate uses.
  const gr1 = await req('POST', '/api/documents/guard', { body: { text: MARKSHEET_TEXT, filename: 'result.pdf' } });
  if (gr1.status === 200 && gr1.json?.decision === 'reject' && gr1.json?.accepted === false && gr1.json?.message)
    ok('guard route: marksheet → { decision: reject } with a professional message');
  else bad('guard route rejects marksheet', `status ${gr1.status} json ${JSON.stringify(gr1.json)}`);
  const gr2 = await req('POST', '/api/documents/guard', { body: { text: STUDY_SECTION, filename: 'chapter8.pdf' } });
  if (gr2.status === 200 && gr2.json?.decision === 'accept' && gr2.json?.accepted === true)
    ok('guard route: study material → { decision: accept }');
  else bad('guard route accepts study material', `status ${gr2.status} json ${JSON.stringify(gr2.json)}`);

  // __APPEND_MARKER_4__

  // H6 — large path: a scanned-style marksheet (text as if OCR'd) is rejected at finalize,
  //      the staged document is PURGED, and generation is then unreachable (§20-D, §11).
  const msCreate = await req('POST', '/api/documents/upload', { body: { filename: 'result-scan.pdf', sizeBytes: 40_000 } });
  const msId = msCreate.json?.documentId;
  if (msCreate.status !== 201 || !msId) { bad('large marksheet upload', `status ${msCreate.status}`); }
  else {
    await sendBatched(msId, [1, 2, 3, 4].map((p) => ({ page: p, text: MARKSHEET_TEXT, source: 'ocr' })));
    const fin = await req('POST', '/api/documents/finalize', { body: { documentId: msId } });
    if (fin.status === 422 && fin.json?.error?.code === 'document_rejected' && fin.json?.documentType === 'marksheet')
      ok('large path: marksheet finalize → 422 document_rejected (never indexed, never sent to AI)');
    else bad('large marksheet finalize rejected', `status ${fin.status} json ${JSON.stringify(fin.json)}`);
    const genAfter = await req('POST', '/api/documents/generate', { body: { documentId: msId, query: 'marks', questionCount: 5 } });
    if (genAfter.status !== 200) ok(`large path: generate on the purged marksheet is unreachable (status ${genAfter.status})`);
    else bad('purged marksheet not generable', `generate returned 200: ${JSON.stringify(genAfter.json)}`);
    const list = await req('GET', '/api/documents');
    const stillThere = (list.json?.documents ?? []).some((d) => d.id === msId);
    if (!stillThere) ok('large path: the rejected document was purged from the store (cleanup, §13)');
    else bad('rejected document purged', 'the marksheet document is still listed');
  }

  // H7 — large path: an 899-page textbook still passes the gate and runs the WHOLE large
  //      flow unchanged — finalize (LARGE/DEEP), search, grounded generation (§11/§20-F).
  const bookCreate = await req('POST', '/api/documents/upload', { body: { filename: 'DBMS 899 pages.pdf', sizeBytes: 6_000_000 } });
  const bookId = bookCreate.json?.documentId;
  if (bookCreate.status !== 201 || !bookId) { bad('large textbook upload', `status ${bookCreate.status}`); }
  else {
    const calls = await sendBatched(bookId, buildBookPages());
    if (calls > 0) ok(`large path: 899-page textbook uploaded in ${calls} bounded batches`);
    const fin = await req('POST', '/api/documents/finalize', { body: { documentId: bookId } });
    if (fin.status === 200 && fin.json?.document?.status === 'ready' && ['LARGE', 'VERY_LARGE', 'DEEP'].includes(fin.json?.mode))
      ok(`large path: textbook accepted and indexed (mode ${fin.json.mode}, ${fin.json.document.chunkCount} chunks)`);
    else bad('large textbook finalize accepted', `status ${fin.status} json ${JSON.stringify(fin.json?.error ?? fin.json)}`);
    const gen = await req('POST', '/api/documents/generate', { body: { documentId: bookId, query: 'normalization', questionCount: 5 } });
    const grounded = Array.isArray(gen.json?.questions) && gen.json.questions.length === 5 && gen.json.questions.every((q) => q.source?.documentId === bookId);
    if (gen.status === 200 && grounded) ok('large path: generated EXACTLY 5 grounded questions from the accepted textbook');
    else bad('large textbook generation', `status ${gen.status} count ${gen.json?.questions?.length}`);
  }
}

try {
  await main();
} catch (e) {
  bad('guard HTTP suite threw', e?.stack ?? String(e));
} finally {
  server.kill('SIGKILL');
  rmSync(workdir, { recursive: true, force: true });
}

console.log(`\n  ${fail === 0 ? 'All STUDY MATERIAL ONLY guard checks passed.' : 'Something failed.'}  ${pass} passed, ${fail} failed\n`);
process.exit(fail === 0 ? 0 : 1);
