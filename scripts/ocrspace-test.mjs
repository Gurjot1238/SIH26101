import { createServer } from 'node:http';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { loadConfig } from '../server/documents/config.mjs';
import { ocrHealth, ocrImage } from '../server/documents/ocr.mjs';
import { openDocumentStore } from '../server/documents/store.mjs';
import { ingestDocument, searchDocuments, generateFromTopic } from '../server/documents/pipeline.mjs';
import { buildDocumentIndex } from '../server/ai/validation.mjs';
import { generateBackfill } from '../server/ai/backfill.mjs';

const KEY = 'OCRSPACE-TEST-KEY-do-not-leak-987654321';

const seen = {
  requests: 0,
  authMissing: false, // a request arrived without the apikey header (adapter bug)
  authWrong: false,   // a request arrived with the wrong apikey value
  keyInUrl: false,    // the key leaked into the request URL
  keyInBody: false,   // the key leaked into the request body
};

function sendJson(res, status, obj) {
  const buf = Buffer.from(JSON.stringify(obj));
  res.writeHead(status, { 'Content-Type': 'application/json', 'Content-Length': buf.length });
  res.end(buf);
}

// The "image" we send is base64(JSON control), wrapped in a data URL by the adapter.
// The stub decodes it to decide how to respond — mirroring the OCR.space contract.
function decodeControl(base64Image) {
  const s = String(base64Image ?? '');
  const b64 = s.includes('base64,') ? s.slice(s.indexOf('base64,') + 'base64,'.length) : s;
  try { return JSON.parse(Buffer.from(b64, 'base64').toString('utf8')); } catch { return { mode: 'success' }; }
}

const server = createServer((req, res) => {
  seen.requests += 1;
  const url = new URL(req.url, 'http://127.0.0.1');
  if (url.search.includes(KEY)) seen.keyInUrl = true;
  const apikey = req.headers['apikey'];
  if (apikey === undefined) seen.authMissing = true;
  else if (apikey !== KEY) seen.authWrong = true;

  const chunks = [];
  req.on('data', (c) => chunks.push(c));
  req.on('end', () => {
    const raw = Buffer.concat(chunks).toString('utf8');
    if (raw.includes(KEY)) seen.keyInBody = true;
    const form = new URLSearchParams(raw);
    const control = decodeControl(form.get('base64Image'));

    if (control.mode === 'auth_fail') { sendJson(res, 403, { error: 'forbidden' }); return; }
    if (control.mode === 'rate_limit') { sendJson(res, 429, { error: 'too many requests' }); return; }
    if (control.mode === 'malformed') { res.writeHead(200, { 'Content-Type': 'application/json' }); res.end('not json {['); return; }
    if (control.mode === 'errored') {
      sendJson(res, 200, { IsErroredOnProcessing: true, ErrorMessage: ['Unable to recognize the file type'], OCRExitCode: 3, ParsedResults: [] });
      return;
    }
    if (control.mode === 'ratelimit_body') {
      sendJson(res, 200, { IsErroredOnProcessing: true, ErrorMessage: ['You have used your maximum number of requests for the day'], OCRExitCode: 4, ParsedResults: [] });
      return;
    }
    if (control.mode === 'empty') {
      sendJson(res, 200, { IsErroredOnProcessing: false, OCRExitCode: 1, ParsedResults: [{ ParsedText: '   ' }] });
      return;
    }
    const text = typeof control.text === 'string' ? control.text : 'Recognised page text.';
    sendJson(res, 200, { IsErroredOnProcessing: false, OCRExitCode: 1, ParsedResults: [{ ParsedText: text, FileParseExitCode: 1, ErrorMessage: '' }] });
  });
});

const PORT = Number(process.env.OCRSPACE_TEST_PORT || 8241);
const BASE = `http://127.0.0.1:${PORT}`;
const API_URL = `${BASE}/parse/image`;

let passed = 0; let failed = 0;
async function check(name, fn) {
  let problem = null;
  try { problem = (await fn()) ?? null; } catch (e) { problem = `threw: ${e.message}`; }
  if (problem) { failed += 1; console.log(`  FAIL  ${name}\n        ${problem}`); }
  else { passed += 1; console.log(`  ok    ${name}`); }
}

function spaceCfg(overrides = {}) {
  return loadConfig({
    OCR_ENABLED: 'true',
    OCR_PROVIDER: 'ocrspace',
    OCRSPACE_API_URL: API_URL,
    OCRSPACE_API_KEY: KEY,
    OCRSPACE_TIMEOUT_MS: '4000',
    ...overrides,
  });
}

const controlImage = (control) => Buffer.from(JSON.stringify(control)).toString('base64');

function listen() {
  return new Promise((resolve) => server.listen(PORT, '127.0.0.1', resolve));
}

async function main() {
  await listen();
  console.log('\n  -- OCR.space free hosted OCR provider (stub sync API server) --\n');

  console.log('  -- A  availability + success ----------------------------------\n');

  await check('health reports the provider ready from config alone (no network, no key leak)', async () => {
    const before = seen.requests;
    const h = await ocrHealth({ cfg: spaceCfg(), env: process.env });
    if (h.provider !== 'ocrspace') return `provider ${h.provider}`;
    if (h.available !== true || h.reachable !== true) return 'not reported available';
    if (h.configured !== true) return 'not reported configured';
    if (JSON.stringify(h).includes(KEY)) return 'health leaked the key';
    if (seen.requests !== before) return 'health made a network call';
  });

  let successResult = null;
  await check('one page image → { ok, text, confidence, lineCount, engine:ocrspace }', async () => {
    const img = controlImage({ mode: 'success', text: 'Photosynthesis converts light energy into chemical energy stored in glucose.' });
    const r = await ocrImage({ imageBase64: img, pageNumber: 7, cfg: spaceCfg(), env: process.env });
    successResult = r;
    if (!r.ok) return `failed: ${r.code} ${r.message}`;
    if (!/Photosynthesis converts light energy/.test(r.text)) return `text not recognised: ${JSON.stringify(r.text)}`;
    if (typeof r.confidence !== 'number' || r.confidence <= 0 || r.confidence > 1) return `confidence ${r.confidence}`;
    if (!Number.isInteger(r.lineCount) || r.lineCount < 1) return `lineCount ${r.lineCount}`;
    if (r.engine !== 'ocrspace') return `engine ${r.engine}`;
  });

  console.log('\n  -- Sec  the key travels only in the apikey header, never elsewhere --\n');

  await check('the apikey header reached the API and matched; never in URL or body', async () => {
    if (seen.requests === 0) return 'no request was recorded';
    if (seen.authMissing) return 'a request arrived without the apikey header';
    if (seen.authWrong) return 'a request carried the wrong apikey value';
    if (seen.keyInUrl) return 'the key leaked into the request URL';
    if (seen.keyInBody) return 'the key leaked into the request body';
  });

  await check('no ocrImage result ever contains the key', async () => {
    if (successResult && JSON.stringify(successResult).includes(KEY)) return 'success result leaked the key';
  });

  await check('missing key → ocr_not_configured with ZERO network calls', async () => {
    const before = seen.requests;
    const r = await ocrImage({ imageBase64: controlImage({ mode: 'success' }), cfg: spaceCfg({ OCRSPACE_API_KEY: '' }), env: process.env });
    if (r.ok || r.code !== 'ocr_not_configured') return `code ${r.code}`;
    if (JSON.stringify(r).includes(KEY)) return 'error leaked the key';
    if (seen.requests !== before) return 'a network call was made without a key';
  });

  console.log('\n  -- F  graceful, structured, non-throwing failure --------------\n');

  await check('auth rejected (403) → ocr_auth_failed (no key in message)', async () => {
    const r = await ocrImage({ imageBase64: controlImage({ mode: 'auth_fail' }), cfg: spaceCfg(), env: process.env });
    if (r.ok || r.code !== 'ocr_auth_failed') return `code ${r.code}`;
    if (JSON.stringify(r).includes(KEY)) return 'message leaked the key';
  });

  await check('rate limited (429) → ocr_rate_limited', async () => {
    const r = await ocrImage({ imageBase64: controlImage({ mode: 'rate_limit' }), cfg: spaceCfg(), env: process.env });
    if (r.ok || r.code !== 'ocr_rate_limited') return `code ${r.code}`;
  });

  await check('rate-limit signalled inside a 200 body → ocr_rate_limited', async () => {
    const r = await ocrImage({ imageBase64: controlImage({ mode: 'ratelimit_body' }), cfg: spaceCfg(), env: process.env });
    if (r.ok || r.code !== 'ocr_rate_limited') return `code ${r.code}`;
  });

  await check('processing error (IsErroredOnProcessing) → ocr_failed', async () => {
    const r = await ocrImage({ imageBase64: controlImage({ mode: 'errored' }), cfg: spaceCfg(), env: process.env });
    if (r.ok || r.code !== 'ocr_failed') return `code ${r.code}`;
  });

  await check('empty parsed text → empty_result', async () => {
    const r = await ocrImage({ imageBase64: controlImage({ mode: 'empty' }), cfg: spaceCfg(), env: process.env });
    if (r.ok || r.code !== 'empty_result') return `code ${r.code}`;
  });

  await check('non-JSON response → bad_response', async () => {
    const r = await ocrImage({ imageBase64: controlImage({ mode: 'malformed' }), cfg: spaceCfg(), env: process.env });
    if (r.ok || r.code !== 'bad_response') return `code ${r.code}`;
  });

  await check('oversized image is rejected pre-wire → image_too_large (no request)', async () => {
    const before = seen.requests;
    const big = controlImage({ mode: 'success', text: 'x'.repeat(4000) });
    const r = await ocrImage({ imageBase64: big, cfg: spaceCfg({ OCR_MAX_IMAGE_BYTES: '8' }), env: process.env });
    if (r.ok || r.code !== 'image_too_large') return `code ${r.code}`;
    if (seen.requests !== before) return 'an oversized image still hit the wire';
  });

  await check('disabled provider → ocr_disabled (no wire call)', async () => {
    const before = seen.requests;
    const r = await ocrImage({ imageBase64: controlImage({ mode: 'success' }), cfg: spaceCfg({ OCR_PROVIDER: 'disabled' }), env: process.env });
    if (r.ok || r.code !== 'ocr_disabled') return `code ${r.code}`;
    if (seen.requests !== before) return 'disabled provider still called the API';
  });

  await check('a cleartext http public API host → bad_config, zero wire calls', async () => {
    const before = seen.requests;
    const r = await ocrImage({ imageBase64: controlImage({ mode: 'success' }), cfg: spaceCfg({ OCRSPACE_API_URL: 'http://api.ocr.space/parse/image' }), env: process.env });
    if (r.ok || r.code !== 'bad_config') return `code ${r.code}`;
    if (JSON.stringify(r).includes(KEY)) return 'the error leaked the key';
    if (seen.requests !== before) return 'a cleartext call was attempted';
  });

  console.log('\n  -- E2E  OCR.space text becomes searchable + grounds MCQs ------\n');

  const NN = {
    5: 'Chapter 5 Sampling\n\n5.1 Stratification\n\n'
      + 'Stratified sampling divides the population into homogeneous strata before selection. '
      + 'Each stratum is sampled independently so that every subgroup is represented. '
      + 'Stratification reduces the sampling variance when strata differ from one another. '
      + 'The overall estimate is a weighted combination of the individual stratum estimates. '
      + 'Allocation decides how the total sample size is split across the strata.',
    6: '5.2 Weighting\n\n'
      + 'Sampling weights make a sample representative of the whole population. '
      + 'A design weight is the reciprocal of a unit’s probability of selection. '
      + 'Nonresponse adjustment inflates the weights of responders to cover nonresponders. '
      + 'Calibration aligns the weighted totals with known population benchmarks. '
      + 'Extreme weights are sometimes trimmed to keep the variance under control.',
    7: '5.3 Estimation\n\n'
      + 'An estimator maps the observed sample to a value for the population parameter. '
      + 'The sample mean is an unbiased estimator of the population mean under simple random sampling. '
      + 'The standard error measures how much an estimate would vary across repeated samples. '
      + 'A confidence interval expresses the uncertainty around a point estimate. '
      + 'A larger sample size narrows the confidence interval for the same design.',
    8: '5.4 Nonresponse\n\n'
      + 'Nonresponse occurs when selected units do not provide the requested information. '
      + 'Unit nonresponse is a missing questionnaire while item nonresponse is a missing answer. '
      + 'Nonresponse bias arises when responders differ systematically from nonresponders. '
      + 'Follow-up of a subsample of nonresponders can measure the size of the bias. '
      + 'Imputation fills missing items using models built from the observed data.',
  };

  const workdir = mkdtempSync(join(tmpdir(), 'ocrspace-'));
  const store = await openDocumentStore(workdir);
  const U1 = 'ocrspace-user-1';
  const U2 = 'ocrspace-user-2';
  const mockEnv = { AI_PROVIDER: 'mock' };
  const ocrQuery = 'stratified sampling weighting estimation nonresponse bias';
  let ocrDoc = null;
  let ocrContext = '';

  await check('each scanned page is read via the OCR.space adapter, then indexed as source:ocr', async () => {
    const pages = [];
    const filler = 'This page covers general administrative background about the survey and its schedule. ';
    for (let p = 1; p <= 4; p += 1) pages.push({ page: p, text: filler.repeat(8), source: 'native_text' });
    for (const p of [5, 6, 7, 8]) {
      // eslint-disable-next-line no-await-in-loop
      const r = await ocrImage({ imageBase64: controlImage({ mode: 'success', text: NN[p] }), pageNumber: p, cfg: spaceCfg(), env: process.env });
      if (!r.ok) return `OCR.space failed for page ${p}: ${r.code}`;
      if (r.engine !== 'ocrspace') return `page ${p} engine ${r.engine}`;
      pages.push({ page: p, text: r.text, source: 'ocr', confidence: r.confidence });
    }
    const ing = await ingestDocument({ store, userId: U1, filename: 'ocrspace-scan.pdf', pages, env: mockEnv });
    if (!ing.ok) return `ingest failed: ${ing.code} ${ing.message}`;
    ocrDoc = ing.document;
    const doc = store.getDocument(U1, ocrDoc.id);
    if (doc.extractionMethod !== 'mixed') return `doc.extractionMethod ${doc.extractionMethod}, expected mixed`;
    if (doc.pagesOcred !== 4) return `pagesOcred ${doc.pagesOcred}, expected 4`;
    if (doc.ocrStatus !== 'completed') return `ocrStatus ${doc.ocrStatus}, expected completed`;
  });

  await check('the OCR-only topic is retrievable and tagged extractionMethod:ocr', async () => {
    const s = await searchDocuments({ store, userId: U1, documentIds: [ocrDoc.id], query: ocrQuery, env: mockEnv });
    if (!s.ok) return `search failed: ${s.code}`;
    ocrContext = s.retrieval.contextText;
    if (!/stratified|nonresponse/i.test(ocrContext)) return 'OCR.space text was not retrieved';
    const scanned = s.retrieval.usedChunks.filter((c) => c.pageStart >= 5 && c.pageEnd <= 8);
    if (scanned.length === 0) return `no scanned page retrieved: ${JSON.stringify(s.pageRanges)}`;
    if (scanned.some((c) => c.extractionMethod === 'native_text')) return 'retrieved OCR content mislabelled native_text';
  });

  await check('another user cannot retrieve the OCR.space document (ownership)', async () => {
    const s = await searchDocuments({ store, userId: U2, documentIds: [ocrDoc.id], query: 'stratified sampling', env: mockEnv });
    if (s.ok) return 'U2 searched U1 document';
    if (s.code !== 'no_documents') return `code ${s.code}`;
  });

  await check('MCQs are grounded in OCR.space text and stamped with the real OCR page', async () => {
    const idx = buildDocumentIndex(ocrContext);
    const pool = generateBackfill(ocrContext, idx, { need: 10, existing: [], allowedTopics: [ocrQuery], preferTopics: [ocrQuery] })
      .accepted.map((q) => ({ question: q.question, options: q.options, correctIndex: q.correctIndex, topic: q.topic, kind: q.kind, explanation: q.explanation, source: q.source }));
    if (pool.length < 5) return `only ${pool.length} groundable questions in the OCR.space context`;
    const mockFile = join(workdir, 'ocrspace-reply.json');
    writeFileSync(mockFile, JSON.stringify({ questions: pool }));
    const r = await generateFromTopic({
      store, userId: U1, documentIds: [ocrDoc.id], query: ocrQuery,
      questionCount: 6, env: { AI_PROVIDER: 'mock', AI_MOCK_FILE: mockFile },
    });
    if (!r.ok) return `generation failed: ${r.code} ${r.message}`;
    if (r.questions.length !== 6) return `got ${r.questions.length} questions, expected 6`;
    const fromOcr = r.questions.filter((q) => q.source && [5, 6, 7, 8].includes(q.source.pageStart) && ['ocr', 'mixed'].includes(q.source.extractionMethod));
    if (fromOcr.length === 0) {
      const stamps = r.questions.map((q) => `${q.source?.pageStart}:${q.source?.extractionMethod}`).join(', ');
      return `no question stamped to an OCR page 5-8; stamps were ${stamps}`;
    }
  });

  rmSync(workdir, { recursive: true, force: true });
}

main().then(() => {
  server.close();
  console.log(`\n  ${failed === 0 ? 'All OCR.space provider checks passed.' : 'Something failed.'}  ${passed} passed, ${failed} failed\n`);
  process.exit(failed === 0 ? 0 : 1);
}).catch((e) => {
  server.close();
  console.error('  harness error:', e);
  process.exit(1);
});
