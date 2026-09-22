/**
 * HTTP-level acceptance test for the large-PDF (899-page) scenario.
 *
 * Boots a real server (mock AI provider, throwaway data dir) and drives the exact flow the
 * bug report is about, over real HTTP, asserting:
 *
 *   1. the OLD single-shot path (POST /api/ai/generate-mcqs) with a whole-book-sized body
 *      returns 413 body_too_large — reproducing the reported failure and showing WHY the
 *      staged path is needed;
 *   2. the staged path uploads ~899 pages in bounded batches, and NOT ONE append request
 *      approaches the 256 KB cap (no 413 anywhere in the large-document flow);
 *   3. finalize indexes the book (LARGE/DEEP mode), a topic search returns relevant pages,
 *      and generation returns EXACTLY the requested count, grounded, with page sources.
 *
 *   node scripts/large-pdf-http-test.mjs
 *
 * No key and no network: the mock provider returns questions built (by backfill, below)
 * from the same topic text the retriever will surface, so they ground exactly as a real
 * model's would. Where the fixture questions come from is irrelevant to what is under test
 * here — the HTTP body-size behaviour and the staged wiring.
 */

import { spawn } from 'node:child_process';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { buildDocumentIndex } from '../server/ai/validation.mjs';
import { generateBackfill } from '../server/ai/backfill.mjs';

const PORT = Number(process.env.LARGE_PDF_PORT ?? 4409);
const BASE = `http://127.0.0.1:${PORT}`;
const ORIGIN = 'http://localhost:5173';
const workdir = mkdtempSync(join(tmpdir(), 'largepdf-'));

let pass = 0; let fail = 0;
const ok = (name) => { pass += 1; console.log(`  ok    ${name}`); };
const bad = (name, detail) => { fail += 1; console.log(`  FAIL  ${name}\n        ${detail}`); };

// The topic paragraph the questions will be grounded in.
const TOPIC_TEXT = 'Normalization decomposes relations to remove redundancy and prevent update anomalies. First normal form requires that every attribute holds a single atomic value. Second normal form removes partial dependencies on a composite key. Third normal form removes transitive dependencies. Boyce Codd normal form is a stricter form that addresses anomalies third normal form can leave behind. Functional dependencies drive the whole decomposition process.';

function buildPages() {
  const pages = [];
  const filler = 'This chapter discusses general administrative background and scheduling notes for the course. ';
  for (let p = 1; p <= 899; p += 1) {
    if (p >= 300 && p <= 330) pages.push({ page: p, text: `Chapter 8 Database Design\n\n8.5 Normalization\n\n${TOPIC_TEXT}` });
    else pages.push({ page: p, text: filler.repeat(6) });
  }
  return pages;
}

/** A mock model reply: valid questions grounded in the topic text. */
function buildMockReply() {
  const idx = buildDocumentIndex(TOPIC_TEXT);
  const pool = generateBackfill(TOPIC_TEXT, idx, { need: 24, existing: [], allowedTopics: ['normalization'], preferTopics: ['normalization'] }).accepted
    .map((q) => ({ question: q.question, options: q.options, correctIndex: q.correctIndex, topic: q.topic, kind: q.kind, explanation: q.explanation, source: q.source }));
  return JSON.stringify({ questions: pool });
}

let cookie = '';
async function req(method, path, { body, origin = ORIGIN } = {}) {
  const headers = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (origin) headers.Origin = origin;
  if (cookie) headers.Cookie = cookie;
  const res = await fetch(`${BASE}${path}`, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
  const setCookie = res.headers.getSetCookie?.() ?? [];
  for (const c of setCookie) { const m = /^(sk_session=[^;]+)/.exec(c); if (m) cookie = m[1]; }
  let json = null; try { json = await res.json(); } catch { /* non-JSON */ }
  return { status: res.status, json };
}

async function waitForHealth() {
  for (let i = 0; i < 60; i += 1) {
    try { const r = await fetch(`${BASE}/api/health`); if (r.ok) return true; } catch { /* not up yet */ }
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
    AUTH_PORT: String(PORT),
    AUTH_DATA_DIR: workdir,
    SESSION_SECRET: 'large_pdf_http_test_secret_0123456789abcdef',
    AI_PROVIDER: 'mock',
    AI_MOCK_FILE: mockFile,
    GEMINI_API_KEY: '',
    NEXORA_DATASET_DIR: join(new URL('..', import.meta.url).pathname, 'server/course-fixtures'),
  },
  stdio: ['ignore', 'pipe', 'pipe'],
});
let serverLog = '';
server.stdout.on('data', (d) => { serverLog += d; });
server.stderr.on('data', (d) => { serverLog += d; });

async function main() {
  if (!(await waitForHealth())) { bad('server boot', `did not start:\n${serverLog}`); return; }
  ok('server booted');

  // Sign in.
  const signup = await req('POST', '/api/auth/signup', { body: { name: 'Large PDF Tester', email: 'large.pdf@mospi.gov.in', password: 'correct-horse-battery-staple-42' } });
  if (signup.status !== 201) { bad('signup', `status ${signup.status}`); return; }
  ok('signed in');

  const pages = buildPages();

  // 1. The OLD path with a whole-book-sized body → 413 (the reported bug).
  const wholeBookText = pages.map((p) => p.text).join('\n');
  const old = await req('POST', '/api/ai/generate-mcqs', { body: { text: wholeBookText, topics: ['normalization'], concepts: [], questionCount: 20 } });
  if (old.status === 413) ok(`old single-shot path rejects the whole book (413), size ≈ ${(wholeBookText.length / 1024 / 1024).toFixed(1)} MB`);
  else bad('old path 413', `expected 413, got ${old.status}`);

  // 2. Staged upload — create, then append in bounded batches.
  const create = await req('POST', '/api/documents/upload', { body: { filename: 'DBMS 899 pages.pdf', sizeBytes: 6_000_000 } });
  if (create.status !== 201 || !create.json?.documentId) { bad('upload create', `status ${create.status}`); return; }
  const documentId = create.json.documentId;
  ok('document record created');

  let maxBatchBytes = 0;
  let appendCalls = 0;
  let batch = []; let batchChars = 0;
  const CAP = 256 * 1024;
  const sendBatch = async () => {
    if (batch.length === 0) return true;
    const payload = { documentId, pages: batch };
    const bytes = Buffer.byteLength(JSON.stringify(payload));
    maxBatchBytes = Math.max(maxBatchBytes, bytes);
    const r = await req('POST', '/api/documents/append', { body: payload });
    appendCalls += 1;
    if (r.status !== 200) { bad('append batch', `status ${r.status} (batch bytes ${bytes})`); return false; }
    batch = []; batchChars = 0;
    return true;
  };
  for (const p of pages) {
    batch.push(p); batchChars += p.text.length + 16;
    if (batchChars >= 120_000 || batch.length >= 300) { if (!(await sendBatch())) return; }
  }
  if (!(await sendBatch())) return;
  ok(`uploaded 899 pages in ${appendCalls} bounded batches`);
  if (maxBatchBytes < CAP) ok(`largest append body was ${(maxBatchBytes / 1024).toFixed(0)} KB — under the 256 KB cap (no 413)`);
  else bad('batch under cap', `a batch was ${maxBatchBytes} bytes, over the ${CAP} cap`);

  // 3. Finalize (index once).
  const finalize = await req('POST', '/api/documents/finalize', { body: { documentId } });
  if (finalize.status !== 200 || finalize.json?.document?.status !== 'ready') { bad('finalize', `status ${finalize.status} ${JSON.stringify(finalize.json?.error ?? '')}`); return; }
  if (['LARGE', 'VERY_LARGE', 'DEEP'].includes(finalize.json.mode)) ok(`finalized and indexed once (mode ${finalize.json.mode}, ${finalize.json.document.chunkCount} chunks)`);
  else bad('large mode', `mode was ${finalize.json.mode}`);

  // 4. Topic search.
  const search = await req('POST', '/api/documents/search', { body: { documentId, query: 'normalization' } });
  if (search.status !== 200 || !search.json?.topicFound) { bad('search', `status ${search.status} topicFound=${search.json?.topicFound}`); return; }
  const pagesHit = (search.json.pageRanges ?? []).some((r) => r.start <= 330 && r.end >= 300);
  if (pagesHit) ok(`topic search found relevant pages ${JSON.stringify(search.json.pageRanges)}`);
  else bad('search pages', `page ranges ${JSON.stringify(search.json.pageRanges)} missed 300-330`);

  // 5. Generate exactly 20 from the retrieved context.
  const gen = await req('POST', '/api/documents/generate', { body: { documentId, query: 'normalization', questionCount: 20, difficulty: 'medium' } });
  if (gen.status !== 200) { bad('generate', `status ${gen.status}: ${JSON.stringify(gen.json?.error ?? '')}`); return; }
  if (Array.isArray(gen.json.questions) && gen.json.questions.length === 20) ok('generate returned EXACTLY 20 questions');
  else bad('exact 20', `got ${gen.json.questions?.length}`);
  const allGrounded = (gen.json.questions ?? []).every((q) => q.source && q.source.documentId === documentId && Number.isFinite(q.source.pageStart));
  if (allGrounded) ok('every question carries a real document id and page range');
  else bad('grounded sources', 'a question was missing its document/page source');

  // Also confirm a smaller count is exact.
  const gen5 = await req('POST', '/api/documents/generate', { body: { documentId, query: 'normalization', questionCount: 5 } });
  if (gen5.status === 200 && gen5.json.questions?.length === 5) ok('generate returned EXACTLY 5 when 5 requested');
  else bad('exact 5', `got ${gen5.json?.questions?.length} (status ${gen5.status})`);
}

try {
  await main();
} finally {
  server.kill('SIGKILL');
  rmSync(workdir, { recursive: true, force: true });
}

console.log(`\n  ${fail === 0 ? 'All large-PDF HTTP checks passed.' : 'Something failed.'}  ${pass} passed, ${fail} failed\n`);
process.exit(fail === 0 ? 0 : 1);
