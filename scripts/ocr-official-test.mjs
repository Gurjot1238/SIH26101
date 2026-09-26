/**
 * Hosted PaddleOCR Official API provider — integration test (stub async-jobs server; no
 * network egress, no Python, no PaddlePaddle).
 *
 * This proves the production OCR path (OCR_PROVIDER=official_api) end to end WITHOUT calling
 * the real cloud service. It stands up a tiny Node HTTP server that speaks the SAME async-jobs
 * contract the hosted API does — POST /api/v2/ocr/jobs → { data:{ jobId } }; GET the job →
 * pending → running → done with data.resultUrl.jsonUrl; GET that URL → JSON Lines whose
 * result.layoutParsingResults[].markdown.text carries the recognised text — then drives the
 * REAL adapter (server/documents/ocr.mjs → server/documents/ocr-official.mjs) and the REAL
 * document pipeline against it.
 *
 * Covers the spec's OCR test matrix for the cloud provider:
 *   S  Success: submit → poll (pending→running→done) → fetch JSONL → normalised
 *      { ok, text, confidence, lineCount, engine:'official_api' } — the same shape the local
 *      engine returns, so nothing downstream can tell which provider read the page.
 *   Sec1 The bearer token is sent ONLY to the API host, exactly once per request, and NEVER
 *        to the (different, untrusted) result URL.
 *   Sec2 The token never appears in any ocrImage result, in ocrHealth, or in a failure message.
 *   Sec3 Missing token → ocr_not_configured with ZERO network calls (never a blind call).
 *   F  Graceful, structured, non-throwing failure for: auth rejected (401), rate limited (429),
 *      poll timeout, malformed envelope, invalid JSONL, empty result, and a failed job.
 *   E2E An OCR-only topic whose text arrives THROUGH the hosted adapter is chunked, indexed,
 *       retrieved, and used to ground exact-count MCQs stamped with the real OCR page range.
 *
 *   node scripts/ocr-official-test.mjs
 */

import { createServer } from 'node:http';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { loadConfig } from '../server/documents/config.mjs';
import { ocrHealth, ocrImage } from '../server/documents/ocr.mjs';
import { assertResultUrlAllowed } from '../server/documents/ocr-official.mjs';
import { openDocumentStore } from '../server/documents/store.mjs';
import { ingestDocument, searchDocuments, generateFromTopic } from '../server/documents/pipeline.mjs';
import { buildDocumentIndex } from '../server/ai/validation.mjs';
import { generateBackfill } from '../server/ai/backfill.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const TOKEN = 'TEST-SECRET-TOKEN-do-not-leak-1234567890';

// ---- observed security state (asserted at the end) --------------------------------
const seen = {
  apiRequests: 0,          // requests to the jobs API host
  resultRequests: 0,       // requests to the result URL
  apiAuthMissing: false,   // an API request arrived WITHOUT the bearer token (adapter bug)
  apiAuthWrong: false,     // an API request arrived with the wrong Authorization value
  resultAuthLeaked: false, // the token was sent to the result URL (must never happen)
};

const jobs = new Map(); // jobId -> { control, polls }
let jobSeq = 0;

function sendJson(res, status, obj) {
  const buf = Buffer.from(JSON.stringify(obj));
  res.writeHead(status, { 'Content-Type': 'application/json', 'Content-Length': buf.length });
  res.end(buf);
}

/**
 * The stub hosted API. Behaviour for each job is chosen by a small control object the test
 * encodes into the base64 `file` it submits, so tests never share mutable server state:
 *   { mode: 'success'|'auth_fail'|'rate_limit'|'job_failed'|'poll_malformed'
 *          |'result_malformed'|'empty'|'timeout', text?: string }
 */
const server = createServer((req, res) => {
  const url = new URL(req.url, 'http://127.0.0.1');
  const auth = req.headers['authorization'];

  // Result URL: a DIFFERENT, untrusted host in production. The adapter must send NO auth here.
  if (req.method === 'GET' && url.pathname.startsWith('/result/')) {
    seen.resultRequests += 1;
    if (auth !== undefined) seen.resultAuthLeaked = true;
    const id = url.pathname.slice('/result/'.length);
    const job = jobs.get(id);
    const mode = job?.control?.mode;
    if (mode === 'result_malformed') { res.writeHead(200, { 'Content-Type': 'application/x-ndjson' }); res.end('this is not json\n{also bad'); return; }
    if (mode === 'empty') { res.writeHead(200, { 'Content-Type': 'application/x-ndjson' }); res.end('   \n\n'); return; }
    const text = typeof job?.control?.text === 'string' ? job.control.text : 'Recognised page text.';
    const line = JSON.stringify({ result: { layoutParsingResults: [{ markdown: { text, images: {} }, outputImages: {}, prunedResult: { rec_scores: [0.97, 0.95, 0.96] } }] } });
    res.writeHead(200, { 'Content-Type': 'application/x-ndjson' });
    res.end(`${line}\n`);
    return;
  }

  // Everything else is the jobs API host: the bearer token MUST be present and correct.
  seen.apiRequests += 1;
  if (auth === undefined) seen.apiAuthMissing = true;
  else if (auth !== `bearer ${TOKEN}`) seen.apiAuthWrong = true;

  // Submit: POST /api/v2/ocr/jobs  → decode the control object from `file`, allocate a job.
  if (req.method === 'POST' && url.pathname === '/api/v2/ocr/jobs') {
    const chunks = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end', () => {
      let control = { mode: 'success' };
      try {
        const body = JSON.parse(Buffer.concat(chunks).toString('utf8'));
        control = JSON.parse(Buffer.from(String(body.file || ''), 'base64').toString('utf8'));
      } catch { /* default control */ }
      if (control.mode === 'auth_fail') { sendJson(res, 401, { code: 401, msg: 'unauthorized' }); return; }
      if (control.mode === 'rate_limit') { sendJson(res, 429, { code: 429, msg: 'too many requests' }); return; }
      jobSeq += 1;
      const jobId = `job-${jobSeq}`;
      jobs.set(jobId, { control, polls: 0 });
      sendJson(res, 200, { code: 0, msg: 'success', data: { jobId } });
    });
    return;
  }

  // Poll: GET /api/v2/ocr/jobs/{jobId}  → pending → running → done (or a failure per mode).
  if (req.method === 'GET' && url.pathname.startsWith('/api/v2/ocr/jobs/')) {
    const id = decodeURIComponent(url.pathname.slice('/api/v2/ocr/jobs/'.length));
    const job = jobs.get(id);
    if (!job) { sendJson(res, 404, { code: 404, msg: 'no such job' }); return; }
    job.polls += 1;
    const mode = job.control.mode;
    if (mode === 'job_failed') { sendJson(res, 200, { code: 0, data: { state: 'failed', errorMsg: 'engine could not read the page' } }); return; }
    if (mode === 'poll_malformed') { sendJson(res, 200, { code: 0, data: { state: 'exploded' } }); return; }
    if (mode === 'timeout') { sendJson(res, 200, { code: 0, data: { state: 'running', extractProgress: 10 } }); return; }
    if (job.polls === 1) { sendJson(res, 200, { code: 0, data: { state: 'pending' } }); return; }
    if (job.polls === 2) { sendJson(res, 200, { code: 0, data: { state: 'running', extractProgress: 60 } }); return; }
    const jsonUrl = `http://127.0.0.1:${PORT}/result/${encodeURIComponent(id)}`;
    sendJson(res, 200, { code: 0, data: { state: 'done', resultUrl: { jsonUrl } } });
    return;
  }

  sendJson(res, 404, { code: 404, msg: 'not found' });
});

// ---- harness ----------------------------------------------------------------------
const PORT = Number(process.env.OCR_OFFICIAL_TEST_PORT || 8231);
const BASE = `http://127.0.0.1:${PORT}`;
const API_URL = `${BASE}/api/v2/ocr/jobs`;

let passed = 0; let failed = 0;
async function check(name, fn) {
  let problem = null;
  try { problem = (await fn()) ?? null; } catch (e) { problem = `threw: ${e.message}`; }
  if (problem) { failed += 1; console.log(`  FAIL  ${name}\n        ${problem}`); }
  else { passed += 1; console.log(`  ok    ${name}`); }
}

/** A config for the hosted provider, pointed at our stub, with fast polling for the test. */
function officialCfg(overrides = {}) {
  return loadConfig({
    OCR_ENABLED: 'true',
    OCR_PROVIDER: 'official_api',
    PADDLEOCR_API_URL: API_URL,
    PADDLEOCR_ACCESS_TOKEN: TOKEN,
    PADDLEOCR_POLL_INTERVAL_MS: '15',
    PADDLEOCR_POLL_MAX_MS: '4000',
    PADDLEOCR_SUBMIT_TIMEOUT_MS: '4000',
    PADDLEOCR_RESULT_TIMEOUT_MS: '4000',
    ...overrides,
  });
}

/** Encode a stub-control object into the base64 `file` the adapter will submit. */
const controlImage = (control) => Buffer.from(JSON.stringify(control)).toString('base64');

function listen() {
  return new Promise((resolve) => server.listen(PORT, '127.0.0.1', resolve));
}

async function main() {
  await listen();
  console.log('\n  -- hosted PaddleOCR Official API provider (stub async-jobs server) --\n');

  console.log('  -- S  success: submit → poll → JSONL → normalised result -------\n');

  await check('health reports the provider ready from config alone (no network, no token)', async () => {
    const before = seen.apiRequests + seen.resultRequests;
    const h = await ocrHealth({ cfg: officialCfg(), env: process.env });
    if (h.provider !== 'official_api') return `provider ${h.provider}`;
    if (h.available !== true || h.reachable !== true) return 'not reported available';
    if (h.configured !== true) return 'not reported configured';
    if (JSON.stringify(h).includes(TOKEN)) return 'health leaked the token';
    if (seen.apiRequests + seen.resultRequests !== before) return 'health made a network call';
  });

  let successResult = null;
  await check('one page image → { ok, text, confidence, lineCount, engine:official_api }', async () => {
    const img = controlImage({ mode: 'success', text: 'Photosynthesis converts light energy into chemical energy stored in glucose.' });
    const r = await ocrImage({ imageBase64: img, pageNumber: 7, cfg: officialCfg(), env: process.env });
    successResult = r;
    if (!r.ok) return `failed: ${r.code} ${r.message}`;
    if (!/Photosynthesis converts light energy/.test(r.text)) return `text not recognised: ${JSON.stringify(r.text)}`;
    if (typeof r.confidence !== 'number' || r.confidence <= 0 || r.confidence > 1) return `confidence ${r.confidence}`;
    if (!Number.isInteger(r.lineCount) || r.lineCount < 1) return `lineCount ${r.lineCount}`;
    if (r.engine !== 'official_api') return `engine ${r.engine}`;
  });

  await check('confidence is averaged from rec_scores (0.97,0.95,0.96 ≈ 0.96)', async () => {
    if (!successResult?.ok) return 'no success result to inspect';
    if (Math.abs(successResult.confidence - 0.96) > 0.02) return `confidence ${successResult.confidence}, expected ≈0.96`;
  });

  console.log('\n  -- Sec  the token goes only to the API host, never anywhere else --\n');

  await check('the bearer token reached the jobs API but NEVER the result URL', async () => {
    if (seen.apiRequests === 0) return 'no API request was recorded';
    if (seen.resultRequests === 0) return 'no result-URL request was recorded';
    if (seen.apiAuthMissing) return 'an API request arrived without the bearer token';
    if (seen.apiAuthWrong) return 'an API request carried the wrong Authorization value';
    if (seen.resultAuthLeaked) return 'the token was sent to the result URL';
  });

  await check('no ocrImage result ever contains the token', async () => {
    if (successResult && JSON.stringify(successResult).includes(TOKEN)) return 'success result leaked the token';
  });

  console.log('\n  -- Sec3  missing token → ocr_not_configured with ZERO network calls --\n');

  await check('missing token never makes a blind call', async () => {
    const before = seen.apiRequests + seen.resultRequests;
    const r = await ocrImage({ imageBase64: controlImage({ mode: 'success' }), cfg: officialCfg({ PADDLEOCR_ACCESS_TOKEN: '' }), env: process.env });
    if (r.ok) return 'expected ocr_not_configured';
    if (r.code !== 'ocr_not_configured') return `code ${r.code}`;
    if (JSON.stringify(r).includes(TOKEN)) return 'error leaked the token';
    if (seen.apiRequests + seen.resultRequests !== before) return 'a network call was made without a token';
  });

  console.log('\n  -- F  graceful, structured, non-throwing failure -------------\n');

  await check('auth rejected (401) → ocr_auth_failed (no secret in message)', async () => {
    const r = await ocrImage({ imageBase64: controlImage({ mode: 'auth_fail' }), cfg: officialCfg(), env: process.env });
    if (r.ok) return 'expected failure';
    if (r.code !== 'ocr_auth_failed') return `code ${r.code}`;
    if (JSON.stringify(r).includes(TOKEN)) return 'message leaked the token';
  });

  await check('rate limited (429) → ocr_rate_limited', async () => {
    const r = await ocrImage({ imageBase64: controlImage({ mode: 'rate_limit' }), cfg: officialCfg(), env: process.env });
    if (r.ok || r.code !== 'ocr_rate_limited') return `code ${r.code}`;
  });

  await check('poll timeout → timeout (bounded, never hangs)', async () => {
    const r = await ocrImage({ imageBase64: controlImage({ mode: 'timeout' }), cfg: officialCfg({ PADDLEOCR_POLL_MAX_MS: '150', PADDLEOCR_POLL_INTERVAL_MS: '20' }), env: process.env });
    if (r.ok || r.code !== 'timeout') return `code ${r.code}`;
  });

  await check('a failed job → ocr_failed', async () => {
    const r = await ocrImage({ imageBase64: controlImage({ mode: 'job_failed' }), cfg: officialCfg(), env: process.env });
    if (r.ok || r.code !== 'ocr_failed') return `code ${r.code}`;
  });

  await check('an unexpected job state → bad_response', async () => {
    const r = await ocrImage({ imageBase64: controlImage({ mode: 'poll_malformed' }), cfg: officialCfg(), env: process.env });
    if (r.ok || r.code !== 'bad_response') return `code ${r.code}`;
  });

  await check('invalid JSONL result → bad_response', async () => {
    const r = await ocrImage({ imageBase64: controlImage({ mode: 'result_malformed' }), cfg: officialCfg(), env: process.env });
    if (r.ok || r.code !== 'bad_response') return `code ${r.code}`;
  });

  await check('empty result → empty_result', async () => {
    const r = await ocrImage({ imageBase64: controlImage({ mode: 'empty' }), cfg: officialCfg(), env: process.env });
    if (r.ok || r.code !== 'empty_result') return `code ${r.code}`;
  });

  await check('oversized image is rejected pre-wire → image_too_large (no submit)', async () => {
    const before = seen.apiRequests;
    const big = controlImage({ mode: 'success', text: 'x'.repeat(4000) });
    const r = await ocrImage({ imageBase64: big, cfg: officialCfg({ OCR_MAX_IMAGE_BYTES: '8' }), env: process.env });
    if (r.ok || r.code !== 'image_too_large') return `code ${r.code}`;
    if (seen.apiRequests !== before) return 'an oversized image still hit the wire';
  });

  await check('disabled provider → ocr_disabled (no wire call)', async () => {
    const before = seen.apiRequests;
    const r = await ocrImage({ imageBase64: controlImage({ mode: 'success' }), cfg: officialCfg({ OCR_PROVIDER: 'disabled' }), env: process.env });
    if (r.ok || r.code !== 'ocr_disabled') return `code ${r.code}`;
    if (seen.apiRequests !== before) return 'disabled provider still called the API';
  });

  console.log('\n  -- SSRF  the result URL is vetted before it is ever fetched ---\n');

  // Production mode is activated by pointing the jobs API at a PUBLIC https host. The stub
  // config uses a loopback API host (dev/self-hosted), which is the only case allowed to
  // trust a loopback result URL — so these public-host checks exercise the strict path
  // without weakening the loopback-based E2E below. None of these reach the network: literal
  // IPs are judged directly, the allow-list mismatch is rejected before DNS, and `localhost`
  // resolves from the hosts file (no egress).
  const PUBLIC_API = 'https://paddleocr.aistudio-app.com/api/v2/ocr/jobs';
  const strictCfg = (o = {}) => officialCfg({ PADDLEOCR_API_URL: PUBLIC_API, ...o });

  await check('result URL on the cloud-metadata IP (169.254.169.254) is rejected', async () => {
    const g = await assertResultUrlAllowed('https://169.254.169.254/latest/meta-data/', strictCfg());
    if (g.ok) return 'the metadata IP was allowed';
    if (JSON.stringify(g).includes(TOKEN)) return 'the rejection leaked the token';
  });

  await check('result URL on loopback (v4 and v6 literals) is rejected in production mode', async () => {
    const g4 = await assertResultUrlAllowed(`https://127.0.0.1:${PORT}/result/x`, strictCfg());
    if (g4.ok) return 'loopback IPv4 literal was allowed';
    const g6 = await assertResultUrlAllowed('https://[::1]/result/x', strictCfg());
    if (g6.ok) return 'loopback IPv6 literal was allowed';
  });

  await check('result URL on a private range (10/8, 192.168/16, 172.16/12) is rejected', async () => {
    for (const u of ['https://10.0.0.5/r', 'https://192.168.1.9/r', 'https://172.16.4.4/r']) {
      // eslint-disable-next-line no-await-in-loop
      const g = await assertResultUrlAllowed(u, strictCfg());
      if (g.ok) return `${u} was allowed`;
    }
  });

  await check('a cleartext http result URL is rejected (https required)', async () => {
    const g = await assertResultUrlAllowed('http://storage.example.com/r', strictCfg());
    if (g.ok) return 'an http result URL was allowed';
  });

  await check('a hostname that resolves to loopback is rejected (DNS is checked)', async () => {
    const g = await assertResultUrlAllowed('https://localhost/r', strictCfg());
    if (g.ok) return 'localhost was allowed';
  });

  await check('the optional PADDLEOCR_RESULT_HOST_ALLOWLIST rejects a non-listed host', async () => {
    const cfg = strictCfg({ PADDLEOCR_RESULT_HOST_ALLOWLIST: 'storage.example.com,cdn.example.org' });
    const bad = await assertResultUrlAllowed('https://evil.example.net/r', cfg);
    if (bad.ok) return 'a host outside the allow-list was allowed';
  });

  await check('a public (non-private) allow-listed result host passes the guard', async () => {
    // 203.0.113.10 is TEST-NET-3 (public, reserved for docs) — exercises the allow path with
    // no DNS lookup, so it is deterministic offline.
    const cfg = strictCfg({ PADDLEOCR_RESULT_HOST_ALLOWLIST: '203.0.113.10' });
    const good = await assertResultUrlAllowed('https://203.0.113.10/r', cfg);
    if (!good.ok) return `a public allow-listed address was wrongly rejected: ${good.code}`;
  });

  await check('a loopback-configured deployment still trusts its own loopback result URL', async () => {
    // The stub/dev config has a loopback API host; the E2E path below depends on this exception.
    const g = await assertResultUrlAllowed(`http://127.0.0.1:${PORT}/result/x`, officialCfg());
    if (!g.ok) return `the dev loopback result URL was rejected: ${g.code}`;
  });

  await check('a cleartext http API host with a token → bad_config, zero wire calls', async () => {
    const before = seen.apiRequests + seen.resultRequests;
    const cfg = strictCfg({ PADDLEOCR_API_URL: 'http://paddleocr.aistudio-app.com/api/v2/ocr/jobs' });
    const r = await ocrImage({ imageBase64: controlImage({ mode: 'success' }), cfg, env: process.env });
    if (r.ok || r.code !== 'bad_config') return `code ${r.code}`;
    if (JSON.stringify(r).includes(TOKEN)) return 'the error leaked the token';
    if (seen.apiRequests + seen.resultRequests !== before) return 'a cleartext API call was attempted';
  });

  console.log('\n  -- E2E  hosted OCR text becomes searchable + grounds MCQs ------\n');

  // A chapter whose distinctive topic exists ONLY on pages that are read by the HOSTED adapter.
  // Each page's text is round-tripped through the real official provider (submit→poll→JSONL),
  // then fed to the pipeline exactly as the browser seam feeds recognised text: source:'ocr'.
  const NN = {
    5: 'Chapter 5 Neural Networks\n\n5.1 Backpropagation\n\n'
      + 'Backpropagation trains a neural network by propagating the output error backward through every layer. '
      + 'The algorithm computes the gradient of the loss function with respect to each weight using the chain rule of calculus. '
      + 'Each weight receives an update proportional to its contribution to the total error. '
      + 'Training repeats this forward and backward pass over many epochs until the loss converges. '
      + 'Without backpropagation, deep networks could not learn useful internal representations from raw data.',
    6: '5.2 Gradient Descent\n\n'
      + 'Gradient descent updates every weight in the direction that reduces the loss function. '
      + 'The learning rate controls the size of each step taken during optimization. '
      + 'A learning rate that is too large causes the loss to diverge instead of settling. '
      + 'Stochastic gradient descent estimates the gradient from a small batch of examples rather than the whole dataset. '
      + 'Momentum accumulates past gradients to accelerate convergence across shallow ravines in the loss surface.',
    7: '5.3 Activation Functions\n\n'
      + 'Activation functions introduce non-linearity so a network can model complex relationships. '
      + 'The sigmoid function squashes its input into the range between zero and one. '
      + 'The rectified linear unit outputs zero for negative inputs and the identity for positive inputs. '
      + 'Rectified linear units reduce the vanishing gradient problem that troubled early deep networks. '
      + 'The softmax function converts a vector of scores into a probability distribution over classes.',
    8: '5.4 Regularization\n\n'
      + 'Regularization discourages a neural network from overfitting its training data. '
      + 'Weight decay adds a penalty proportional to the squared magnitude of the weights. '
      + 'Dropout randomly disables a fraction of neurons during each training step to improve generalization. '
      + 'Early stopping halts training once the validation error stops improving. '
      + 'Batch normalization stabilizes the distribution of layer inputs and speeds up training.',
  };

  const workdir = mkdtempSync(join(tmpdir(), 'ocr-official-'));
  const store = await openDocumentStore(workdir);
  const U1 = 'official-user-1';
  const U2 = 'official-user-2';
  const mockEnv = { AI_PROVIDER: 'mock' };
  const ocrQuery = 'neural network backpropagation gradient descent activation';
  let ocrDoc = null;
  let ocrContext = '';

  await check('each scanned page is read via the hosted adapter, then indexed as source:ocr', async () => {
    const pages = [];
    const filler = 'This page covers general administrative background about the course and its schedule. ';
    for (let p = 1; p <= 4; p += 1) pages.push({ page: p, text: filler.repeat(8), source: 'native_text' });
    for (const p of [5, 6, 7, 8]) {
      // Round-trip page p's image through the REAL official provider.
      // eslint-disable-next-line no-await-in-loop
      const r = await ocrImage({ imageBase64: controlImage({ mode: 'success', text: NN[p] }), pageNumber: p, cfg: officialCfg(), env: process.env });
      if (!r.ok) return `hosted OCR failed for page ${p}: ${r.code}`;
      if (r.engine !== 'official_api') return `page ${p} engine ${r.engine}`;
      pages.push({ page: p, text: r.text, source: 'ocr', confidence: r.confidence });
    }
    const ing = await ingestDocument({ store, userId: U1, filename: 'hosted-scan.pdf', pages, env: mockEnv });
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
    if (!/backpropagation/i.test(ocrContext)) return 'hosted-OCR text was not retrieved';
    const scanned = s.retrieval.usedChunks.filter((c) => c.pageStart >= 5 && c.pageEnd <= 8);
    if (scanned.length === 0) return `no scanned page retrieved: ${JSON.stringify(s.pageRanges)}`;
    if (scanned.some((c) => c.extractionMethod === 'native_text')) return 'retrieved OCR content mislabelled native_text';
    if (scanned.some((c) => typeof c.ocrConfidence !== 'number')) return 'a retrieved OCR chunk lost its confidence';
  });

  await check('another user cannot retrieve the hosted-OCR document (ownership)', async () => {
    const s = await searchDocuments({ store, userId: U2, documentIds: [ocrDoc.id], query: 'neural network', env: mockEnv });
    if (s.ok) return 'U2 searched U1 document';
    if (s.code !== 'no_documents') return `code ${s.code}`;
  });

  await check('MCQs are grounded in hosted-OCR text and stamped with the real OCR page', async () => {
    const idx = buildDocumentIndex(ocrContext);
    const pool = generateBackfill(ocrContext, idx, { need: 10, existing: [], allowedTopics: [ocrQuery], preferTopics: [ocrQuery] })
      .accepted.map((q) => ({ question: q.question, options: q.options, correctIndex: q.correctIndex, topic: q.topic, kind: q.kind, explanation: q.explanation, source: q.source }));
    if (pool.length < 5) return `only ${pool.length} groundable questions in the hosted-OCR context`;
    const mockFile = join(workdir, 'ocr-official-reply.json');
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
  console.log(`\n  ${failed === 0 ? 'All hosted-OCR integration checks passed.' : 'Something failed.'}  ${passed} passed, ${failed} failed\n`);
  process.exit(failed === 0 ? 0 : 1);
}).catch((e) => {
  server.close();
  console.error('  harness error:', e);
  process.exit(1);
});


