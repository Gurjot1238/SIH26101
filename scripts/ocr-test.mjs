/**
 * Local OCR — integration test (stub engine; no PaddlePaddle, no network egress).
 *
 * This proves the whole Node <-> Python <-> pipeline OCR contract WITHOUT the heavy,
 * platform-specific PaddlePaddle wheel. It launches the real server/ocr/ocr_service.py in
 * its stub mode (OCR_ENGINE=stub, standard-library only), then drives it through the real
 * Node adapter (server/documents/ocr.mjs) and the real document pipeline. The one thing it
 * cannot cover — actual glyph recognition — is deferred to scripts/ocr-real-test.mjs, which
 * runs the same service with the real engine on a machine that has .venv-ocr.
 *
 * Covers the spec's OCR test matrix that is exercisable off-Mac:
 *   A  /health reports the engine and that OCR is available here.
 *   -  /ocr/image contract: normalised { text, confidence, lineCount, engine } — never a
 *      raw PaddleOCR object; a caller-supplied stubText is honoured so a test can drive
 *      retrieval with known tokens.
 *   F  OCR failure is handled gracefully: service down -> service_unavailable; disabled ->
 *      ocr_disabled; oversized image -> image_too_large. None of these throw.
 *   J  Security: the contract takes image BYTES, never a path. A body carrying only a
 *      `path` field is rejected (image_required) and no file is ever read.
 *   -  Pipeline metadata threading: per-page source -> chunk.extractionMethod
 *      (native_text|ocr|mixed) + ocrConfidence, and doc.ocrStatus / pagesOcred /
 *      pagesOcrFailed / extractionMethod.
 *   G  Retrieval of an OCR-only topic: text present ONLY on a source:'ocr' page is indexed
 *      and returned by searchDocuments, with its retrieved chunk tagged extractionMethod:'ocr'.
 *   H  AI generation reaches retrieved OCR content: generateFromTopic grounds questions in
 *      that OCR-only context and stamps each with the real OCR page range + extractionMethod.
 *
 *   node scripts/ocr-test.mjs
 */

import { spawn } from 'node:child_process';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { setTimeout as sleep } from 'node:timers/promises';

import { loadConfig } from '../server/documents/config.mjs';
import { ocrHealth, ocrImage } from '../server/documents/ocr.mjs';
import { chunkPages } from '../server/documents/chunk.mjs';
import { openDocumentStore } from '../server/documents/store.mjs';
import { ingestDocument, searchDocuments, generateFromTopic } from '../server/documents/pipeline.mjs';
import { buildDocumentIndex } from '../server/ai/validation.mjs';
import { generateBackfill } from '../server/ai/backfill.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO = join(__dirname, '..');
const SERVICE = join(REPO, 'server', 'ocr', 'ocr_service.py');
const PYTHON = process.env.OCR_TEST_PYTHON || 'python3';
const PORT = Number(process.env.OCR_TEST_PORT || 8199);
const DEAD_PORT = PORT + 32; // nothing listens here -> exercises connection failure

let passed = 0; let failed = 0;
async function check(name, fn) {
  let problem = null;
  try { problem = (await fn()) ?? null; } catch (e) { problem = `threw: ${e.message}`; }
  if (problem) { failed += 1; console.log(`  FAIL  ${name}\n        ${problem}`); }
  else { passed += 1; console.log(`  ok    ${name}`); }
}

// A config whose ocr.* points at our stub service. Everything else is defaults.
const cfg = loadConfig({ OCR_ENABLED: 'true', OCR_HOST: '127.0.0.1', OCR_PORT: String(PORT) });
const b64 = (s) => Buffer.from(s).toString('base64');

// --- launch the stub OCR service --------------------------------------------
const child = spawn(PYTHON, [SERVICE], {
  cwd: REPO,
  env: { ...process.env, OCR_ENGINE: 'stub', OCR_HOST: '127.0.0.1', OCR_PORT: String(PORT), OCR_ENABLED: 'true' },
  stdio: ['ignore', 'ignore', 'pipe'],
});
let serviceLog = '';
child.stderr.on('data', (d) => { serviceLog += d.toString(); });
child.on('error', (e) => { serviceLog += `spawn error: ${e.message}\n`; });

function shutdown() {
  try { child.kill('SIGTERM'); } catch { /* already gone */ }
}
process.on('exit', shutdown);

async function waitForHealth(timeoutMs = 12_000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    // eslint-disable-next-line no-await-in-loop
    const h = await ocrHealth({ cfg, env: process.env });
    if (h.reachable && h.available) return h;
    // eslint-disable-next-line no-await-in-loop
    await sleep(200);
  }
  return null;
}

async function main() {
  console.log('\n  -- start local OCR service (stub engine) ----------------------\n');

  const health = await waitForHealth();
  await check('A  /health reports engine + availability', async () => {
    if (!health) return `service never became healthy.\n        ${serviceLog.trim().split('\n').slice(-4).join('\n        ')}`;
    if (health.engine !== 'stub') return `engine ${health.engine}, expected stub`;
    if (health.available !== true) return 'engine not reported available';
    if (health.lang == null) return 'no lang echoed';
  });
  if (!health) { console.log(`\n  ${passed} passed, ${failed} failed\n`); shutdown(); process.exit(1); }

  console.log('\n  -- /ocr/image contract ----------------------------------------\n');

  await check('normalised result, not a raw PaddleOCR object', async () => {
    const r = await ocrImage({ imageBase64: b64('fake-png-bytes'), pageNumber: 3, cfg, env: process.env });
    if (!r.ok) return `ocrImage failed: ${r.code} ${r.message}`;
    if (typeof r.text !== 'string' || r.text.trim() === '') return 'no text';
    if (typeof r.confidence !== 'number') return 'no numeric confidence';
    if (!Number.isInteger(r.lineCount) || r.lineCount < 1) return `lineCount ${r.lineCount}`;
    if (r.engine !== 'stub') return `engine ${r.engine}`;
  });

  await check('a caller-supplied stubText is echoed back (drives retrieval)', async () => {
    const known = 'Quantum Error Correction Surface Codes';
    const r = await ocrImage({ imageBase64: b64('x'), stubText: known, cfg, env: process.env });
    if (!r.ok) return `failed: ${r.code}`;
    if (!r.text.includes('Quantum Error Correction')) return `stubText not honoured: ${JSON.stringify(r.text)}`;
  });

  console.log('\n  -- F  graceful failure (never throws, always structured) ------\n');

  await check('service down -> service_unavailable', async () => {
    const deadCfg = loadConfig({ OCR_ENABLED: 'true', OCR_HOST: '127.0.0.1', OCR_PORT: String(DEAD_PORT) });
    const r = await ocrImage({ imageBase64: b64('x'), cfg: deadCfg, env: process.env });
    if (r.ok) return 'expected failure against a closed port';
    if (r.code !== 'service_unavailable') return `code ${r.code}`;
  });

  await check('OCR disabled -> ocr_disabled (no wire call)', async () => {
    const offCfg = loadConfig({ OCR_ENABLED: 'false', OCR_HOST: '127.0.0.1', OCR_PORT: String(PORT) });
    const r = await ocrImage({ imageBase64: b64('x'), cfg: offCfg, env: process.env });
    if (r.ok) return 'expected ocr_disabled';
    if (r.code !== 'ocr_disabled') return `code ${r.code}`;
  });

  await check('oversized image -> image_too_large (rejected pre-wire)', async () => {
    const tinyCap = loadConfig({ OCR_ENABLED: 'true', OCR_HOST: '127.0.0.1', OCR_PORT: String(PORT), OCR_MAX_IMAGE_BYTES: '8' });
    const r = await ocrImage({ imageBase64: b64('this base64 decodes to far more than eight bytes'), cfg: tinyCap, env: process.env });
    if (r.ok) return 'expected image_too_large';
    if (r.code !== 'image_too_large') return `code ${r.code}`;
  });

  await check('empty image -> image_required', async () => {
    const r = await ocrImage({ imageBase64: '', cfg, env: process.env });
    if (r.ok || r.code !== 'image_required') return `code ${r.code}`;
  });

  console.log('\n  -- J  security: bytes-only contract, no path read -------------\n');

  await check('a body carrying only a path is rejected, no file is read', async () => {
    // The adapter takes imageBase64; there is no path parameter anywhere in the contract.
    // Passing a filesystem path where the image should be must fail as image_required,
    // proving there is no arbitrary-file-read surface (spec test J, by construction).
    const r = await ocrImage({ imageBase64: undefined, path: '/etc/passwd', cfg, env: process.env });
    if (r.ok) return 'a path was somehow accepted';
    if (r.code !== 'image_required') return `code ${r.code}`;
  });

  console.log('\n  -- pipeline metadata threading (source -> chunk -> document) ---\n');

  const workdir = mkdtempSync(join(tmpdir(), 'ocrtest-'));
  const store = await openDocumentStore(workdir);
  const U1 = 'ocr-user-1';
  const U2 = 'ocr-user-2';
  const mockEnv = { AI_PROVIDER: 'mock' };

  await check('mixed sources -> chunk.extractionMethod + doc.ocrStatus/pagesOcred', async () => {
    const pages = [
      { page: 1, text: 'Chapter 1 Foundations\n\n' + 'Relational databases keep data in tables called relations and enforce keys. '.repeat(30), source: 'native_text' },
      { page: 2, text: 'Scanned Notes\n\n' + 'Congestion avoidance grows the window linearly after slow start ends. '.repeat(30), source: 'ocr', confidence: 0.9 },
      { page: 3, text: '', source: 'ocr_failed' }, // a page OCR could not read
    ];
    const r = await ingestDocument({ store, userId: U1, filename: 'mixed-notes.pdf', pages, env: mockEnv });
    if (!r.ok) return `ingest failed: ${r.code} ${r.message}`;
    const doc = store.getDocument(U1, r.document.id);
    if (doc.ocrStatus !== 'partial') return `ocrStatus ${doc.ocrStatus}, expected partial (1 ocr + 1 failed)`;
    if (doc.pagesOcred !== 1) return `pagesOcred ${doc.pagesOcred}`;
    if (doc.pagesOcrFailed !== 1) return `pagesOcrFailed ${doc.pagesOcrFailed}`;
    if (doc.extractionMethod !== 'mixed') return `doc.extractionMethod ${doc.extractionMethod}`;
    const chunks = await store.getChunks(U1, r.document.id);
    const methods = new Set(chunks.map((c) => c.extractionMethod));
    for (const m of methods) if (!['native_text', 'ocr', 'mixed'].includes(m)) return `unexpected chunk method ${m}`;
    if (!methods.has('ocr') && !methods.has('mixed')) return `no ocr/mixed chunk; got ${[...methods].join(',')}`;
    const ocrChunk = chunks.find((c) => c.extractionMethod !== 'native_text');
    if (ocrChunk && typeof ocrChunk.ocrConfidence !== 'number') return 'ocr chunk missing ocrConfidence';
  });

  console.log('\n  -- G  an OCR-only topic is retrievable ------------------------\n');

  // A document whose distinctive topic (neural networks) exists ONLY on scanned (OCR)
  // pages. If retrieval can surface it and generation can ground in it, OCR text has
  // genuinely merged into the same index/AI flow as ordinary typed text. The chapter is a
  // few real, distinct pages so the retriever has substantive OCR content to rank and the
  // grounded backfill has enough sentences to build a full paper from.
  const NN_CHAPTER = {
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
  function ocrDocPages() {
    const pages = [];
    const filler = 'This page covers general administrative background about the course and its schedule. ';
    // Pages 1-4: ordinary typed pages on an unrelated topic (never matched by an NN query).
    for (let p = 1; p <= 4; p += 1) pages.push({ page: p, text: filler.repeat(8), source: 'native_text' });
    // Pages 5-8: the scanned chapter, arriving as OCR text with a confidence score.
    for (const p of [5, 6, 7, 8]) pages.push({ page: p, text: NN_CHAPTER[p], source: 'ocr', confidence: 0.9 });
    return pages;
  }

  let ocrDoc;
  let ocrContext = '';
  const ocrQuery = 'neural network backpropagation gradient descent activation';
  await check('search for the OCR-only topic retrieves the scanned pages (tagged ocr)', async () => {
    const r = await ingestDocument({ store, userId: U1, filename: 'lecture-scan.pdf', pages: ocrDocPages(), env: mockEnv });
    if (!r.ok) return `ingest failed: ${r.code}`;
    ocrDoc = r.document;
    const s = await searchDocuments({ store, userId: U1, documentIds: [ocrDoc.id], query: ocrQuery, env: mockEnv });
    if (!s.ok) return `search failed: ${s.code}`;
    ocrContext = s.retrieval.contextText;
    if (!/backpropagation/i.test(ocrContext)) return 'OCR-only text was not retrieved';
    // Every retrieved chunk falls in the scanned range (pages 5-8), and none is mislabelled
    // as typed text — the unrelated native pages 1-4 must not be pulled in.
    const scanned = s.retrieval.usedChunks.filter((c) => c.pageStart >= 5 && c.pageEnd <= 8);
    if (scanned.length === 0) return `no scanned page retrieved: ${JSON.stringify(s.pageRanges)}`;
    if (scanned.some((c) => c.extractionMethod === 'native_text')) return 'retrieved OCR content was mislabelled native_text';
    if (scanned.some((c) => typeof c.ocrConfidence !== 'number')) return 'a retrieved OCR chunk lost its confidence';
  });

  await check('ownership: another user cannot retrieve the OCR document', async () => {
    const s = await searchDocuments({ store, userId: U2, documentIds: [ocrDoc.id], query: 'neural network', env: mockEnv });
    if (s.ok) return 'U2 searched U1 document';
    if (s.code !== 'no_documents') return `code ${s.code}`;
  });

  console.log('\n  -- H  AI generation reaches the retrieved OCR content ---------\n');

  await check('MCQs are grounded in OCR text and stamped with the real OCR page', async () => {
    const idx = buildDocumentIndex(ocrContext);
    // The server grounds generation with allowedTopics = [query], so the backfill pool must
    // carry topic === ocrQuery or every question is rejected for topic mismatch. Build the
    // pool against the SAME query the server will validate against.
    const pool = generateBackfill(ocrContext, idx, { need: 10, existing: [], allowedTopics: [ocrQuery], preferTopics: [ocrQuery] })
      .accepted.map((q) => ({ question: q.question, options: q.options, correctIndex: q.correctIndex, topic: q.topic, kind: q.kind, explanation: q.explanation, source: q.source }));
    if (pool.length < 5) return `only ${pool.length} groundable questions in the OCR context (need a base of 5)`;
    const mockFile = join(workdir, 'ocr-reply.json');
    writeFileSync(mockFile, JSON.stringify({ questions: pool }));

    // Same query as the pool was built from, so the server grounds against the identical
    // retrieved context. questionCount 6 exercises the exact-count contract above MIN_QUESTIONS.
    const r = await generateFromTopic({
      store, userId: U1, documentIds: [ocrDoc.id], query: ocrQuery,
      questionCount: 6, env: { AI_PROVIDER: 'mock', AI_MOCK_FILE: mockFile },
    });
    if (!r.ok) return `generation failed: ${r.code} ${r.message}`;
    if (r.questions.length !== 6) return `got ${r.questions.length} questions, expected 6`;
    // At least one question must be stamped with a real OCR page (5-8) and an OCR-inclusive
    // extraction method — proof the OCR text reached generation and was cited honestly.
    const fromOcrPage = r.questions.filter((q) => q.source && [5, 6, 7, 8].includes(q.source.pageStart) && ['ocr', 'mixed'].includes(q.source.extractionMethod));
    if (fromOcrPage.length === 0) {
      const stamps = r.questions.map((q) => `${q.source?.pageStart}:${q.source?.extractionMethod}`).join(', ');
      return `no question stamped to an OCR page 5-8 (ocr/mixed); stamps were ${stamps}`;
    }
  });

  rmSync(workdir, { recursive: true, force: true });
}

main().then(() => {
  shutdown();
  console.log(`\n  ${failed === 0 ? 'All OCR integration checks passed.' : 'Something failed.'}  ${passed} passed, ${failed} failed\n`);
  process.exit(failed === 0 ? 0 : 1);
});
