import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { generateRaw as geminiGenerateRaw } from '../server/ai/gemini.mjs';
import { visionStatus, describeImages } from '../server/ai/provider.mjs';
import { loadConfig } from '../server/documents/config.mjs';
import { describePageImage, visionAvailable, VISION_PROMPT } from '../server/documents/vision.mjs';
import { openDocumentStore } from '../server/documents/store.mjs';
import { ingestDocument, searchDocuments, generateFromTopic } from '../server/documents/pipeline.mjs';
import { buildDocumentIndex } from '../server/ai/validation.mjs';
import { generateBackfill } from '../server/ai/backfill.mjs';

const KEY = 'x'.repeat(20);
// A distinctive, valid base64 payload standing in for a rasterised page image.
const IMAGE_B64 = Buffer.from('VISION-PIXELS-chart-page-0123456789').toString('base64');

let passed = 0; let failed = 0;
async function check(name, fn) {
  let problem = null;
  try { problem = (await fn()) ?? null; } catch (e) { problem = `threw: ${e.message}`; }
  if (problem) { failed += 1; console.log(`  FAIL  ${name}\n        ${problem}`); }
  else { passed += 1; console.log(`  ok    ${name}`); }
}

// A stub fetch that records the outgoing Gemini request and returns a canned answer.
// This lets the tests prove the REAL image bytes are transmitted, with no network.
function geminiStub(replyText, record) {
  return async (url, init) => {
    if (record) {
      record.calls = (record.calls || 0) + 1;
      record.url = String(url);
      record.headers = init?.headers ?? {};
      try { record.body = JSON.parse(init?.body ?? '{}'); } catch { record.body = null; }
    }
    return { ok: true, status: 200, json: async () => ({ candidates: [{ content: { parts: [{ text: replyText }] } }] }) };
  };
}

function inlineParts(body) {
  const parts = body?.contents?.[0]?.parts;
  return Array.isArray(parts) ? parts.filter((p) => p && p.inlineData) : [];
}

async function main() {
  console.log('\n  -- multimodal vision extraction (image → real AI description) --\n');
  console.log('  -- A  honest availability: no key / wrong provider never fakes ok --\n');

  await check('an unrecognised provider is not vision-capable (never faked)', async () => {
    const s = visionStatus({ AI_PROVIDER: 'banana' });
    if (s.ok) return 'reported ok for an unknown provider';
    if (s.code !== 'not_configured') return `code ${s.code}`;
    if (s.supportsVision !== false) return 'claimed vision support';
  });

  await check('gemini without a key reports not_configured, not a fake ready state', async () => {
    const s = visionStatus({ AI_PROVIDER: 'gemini' });
    if (s.ok) return 'reported ok with no GEMINI_API_KEY';
    if (s.code !== 'not_configured') return `code ${s.code}`;
    if (s.provider !== 'gemini') return `provider ${s.provider}`;
  });

  await check('a text-only local model is refused honestly (vision_unsupported)', async () => {
    const s = visionStatus({ AI_PROVIDER: 'local' });
    if (s.ok) return 'a text-only provider claimed vision support';
    if (s.code !== 'vision_unsupported') return `code ${s.code}`;
  });

  await check('gemini with a key is reported vision-ready', async () => {
    const s = visionStatus({ AI_PROVIDER: 'gemini', GEMINI_API_KEY: KEY });
    if (!s.ok || s.code !== 'ok') return `code ${s.code}`;
    if (s.supportsVision !== true) return 'did not report vision support';
  });

  await check('the config toggle can disable vision independently of the provider', async () => {
    const cfg = loadConfig({ VISION_ENABLED: 'false' });
    const a = visionAvailable({ cfg, env: { AI_PROVIDER: 'gemini', GEMINI_API_KEY: KEY } });
    if (a.available) return 'vision stayed available while disabled';
    if (a.enabled !== false || a.code !== 'vision_disabled') return `code ${a.code}`;
  });

  await check('with the toggle on and a real key, vision is available', async () => {
    const cfg = loadConfig({ VISION_ENABLED: 'true' });
    const a = visionAvailable({ cfg, env: { AI_PROVIDER: 'gemini', GEMINI_API_KEY: KEY } });
    if (!a.available || a.enabled !== true) return `available=${a.available} enabled=${a.enabled} code=${a.code}`;
  });

  console.log('\n  -- B  the real page image is transmitted to the model (not faked) --\n');

  await check('gemini sends the exact image bytes as an inlineData part', async () => {
    const record = {};
    const text = await geminiGenerateRaw('describe this page', {
      env: { GEMINI_API_KEY: KEY },
      fetchImpl: geminiStub('A bar chart of CPI by sector.', record),
      images: [{ mimeType: 'image/png', data: IMAGE_B64 }],
    });
    if (text !== 'A bar chart of CPI by sector.') return `unexpected reply: ${JSON.stringify(text)}`;
    if (record.calls !== 1) return `expected 1 request, saw ${record.calls}`;
    const imgs = inlineParts(record.body);
    if (imgs.length !== 1) return `expected 1 inlineData part, saw ${imgs.length}`;
    if (imgs[0].inlineData.data !== IMAGE_B64) return 'the transmitted image bytes did not match the input';
    if (imgs[0].inlineData.mimeType !== 'image/png') return `mime ${imgs[0].inlineData.mimeType}`;
    if (record.body.contents[0].parts[0].text !== 'describe this page') return 'the prompt text was not sent';
  });

  await check('the API key travels in the header, never in the URL or the body', async () => {
    const record = {};
    await geminiGenerateRaw('p', {
      env: { GEMINI_API_KEY: KEY },
      fetchImpl: geminiStub('ok', record),
      images: [{ mimeType: 'image/png', data: IMAGE_B64 }],
    });
    if (record.headers['x-goog-api-key'] !== KEY) return 'the key was not sent in x-goog-api-key';
    if (record.url.includes(KEY)) return 'the key leaked into the request URL';
    if (JSON.stringify(record.body).includes(KEY)) return 'the key leaked into the request body';
  });

  await check('image requests ask the model for prose, not JSON (no responseMimeType)', async () => {
    const record = {};
    await geminiGenerateRaw('p', {
      env: { GEMINI_API_KEY: KEY },
      fetchImpl: geminiStub('prose', record),
      images: [{ mimeType: 'image/png', data: IMAGE_B64 }],
    });
    if (record.body.generationConfig.responseMimeType) return 'a vision request forced JSON output';
  });

  await check('describeImages routes the bytes through the provider layer end-to-end', async () => {
    const record = {};
    const r = await describeImages(VISION_PROMPT, [{ mimeType: 'image/png', data: IMAGE_B64 }], {
      env: { AI_PROVIDER: 'gemini', GEMINI_API_KEY: KEY },
      fetchImpl: geminiStub('A flow diagram of the NSSO survey cycle.', record),
    });
    if (!r.ok) return `failed: ${r.code}`;
    if (r.provider !== 'gemini') return `provider ${r.provider}`;
    const imgs = inlineParts(record.body);
    if (imgs.length !== 1 || imgs[0].inlineData.data !== IMAGE_B64) return 'the image bytes did not reach the wire';
  });

  await check('a provider that cannot see images never receives the bytes', async () => {
    let called = false;
    const r = await describeImages('p', [{ mimeType: 'image/png', data: IMAGE_B64 }], {
      env: { AI_PROVIDER: 'local' },
      fetchImpl: async () => { called = true; return { ok: true, status: 200, json: async () => ({}) }; },
    });
    if (r.ok) return 'a text-only provider claimed to read the image';
    if (r.code !== 'vision_unsupported') return `code ${r.code}`;
    if (called) return 'image bytes were sent to a non-vision provider';
  });

  console.log('\n  -- C  describePageImage: config-bounded, safe, non-throwing --\n');

  const okCfg = loadConfig({ VISION_ENABLED: 'true' });
  const geminiEnv = { AI_PROVIDER: 'gemini', GEMINI_API_KEY: KEY };

  await check('a described page returns ok text tagged with its page number', async () => {
    const record = {};
    const r = await describePageImage({
      imageBase64: IMAGE_B64, mimeType: 'image/png', pageNumber: 12,
      cfg: okCfg, env: geminiEnv, fetchImpl: geminiStub('A pie chart: 62% urban, 38% rural respondents.', record),
    });
    if (!r.ok) return `failed: ${r.code} ${r.message}`;
    if (!/pie chart/i.test(r.text)) return `text not returned: ${JSON.stringify(r.text)}`;
    if (r.provider !== 'gemini') return `provider ${r.provider}`;
    if (r.pageNumber !== 12) return `pageNumber ${r.pageNumber}`;
    if (inlineParts(record.body)[0]?.inlineData.data !== IMAGE_B64) return 'the page image bytes were not transmitted';
  });

  await check('disabled vision returns vision_disabled and makes no network call', async () => {
    let called = false;
    const r = await describePageImage({
      imageBase64: IMAGE_B64, cfg: loadConfig({ VISION_ENABLED: 'false' }), env: geminiEnv,
      fetchImpl: async () => { called = true; return { ok: true, status: 200, json: async () => ({}) }; },
    });
    if (r.ok || r.code !== 'vision_disabled') return `code ${r.code}`;
    if (called) return 'a disabled stage still called the provider';
  });

  await check('a missing image is refused before any call (image_required)', async () => {
    const r = await describePageImage({ imageBase64: '   ', cfg: okCfg, env: geminiEnv });
    if (r.ok || r.code !== 'image_required') return `code ${r.code}`;
  });

  await check('an oversized image is rejected pre-wire (image_too_large)', async () => {
    let called = false;
    const r = await describePageImage({
      imageBase64: IMAGE_B64, cfg: loadConfig({ VISION_ENABLED: 'true', VISION_MAX_IMAGE_BYTES: '4' }), env: geminiEnv,
      fetchImpl: async () => { called = true; return { ok: true, status: 200, json: async () => ({}) }; },
    });
    if (r.ok || r.code !== 'image_too_large') return `code ${r.code}`;
    if (called) return 'an oversized image still hit the wire';
  });

  console.log('\n  -- D  a multimodal MOCK provider (no key) + honest failures ----\n');

  const workdir = mkdtempSync(join(tmpdir(), 'vision-'));
  const visionFile = join(workdir, 'vision-reply.txt');
  writeFileSync(visionFile, 'A line graph showing GDP growth rising from 6.1% to 7.4% across four quarters.');
  const emptyFile = join(workdir, 'vision-empty.txt');
  writeFileSync(emptyFile, '   \n  ');
  const timeoutFile = join(workdir, 'timeout.txt');
  writeFileSync(timeoutFile, '__TIMEOUT__');
  const rateFile = join(workdir, 'rate.txt');
  writeFileSync(rateFile, '__RATE_LIMITED__');

  await check('the mock provider describes an image from a canned reply (no key needed)', async () => {
    const r = await describePageImage({
      imageBase64: IMAGE_B64, cfg: okCfg, pageNumber: 3,
      env: { AI_PROVIDER: 'mock', AI_VISION_MOCK_FILE: visionFile },
    });
    if (!r.ok) return `failed: ${r.code} ${r.message}`;
    if (!/GDP growth/.test(r.text)) return `text not returned: ${JSON.stringify(r.text)}`;
    if (r.provider !== 'mock') return `provider ${r.provider}`;
  });

  await check('a blank description is reported as vision_empty, not a fake answer', async () => {
    const r = await describePageImage({
      imageBase64: IMAGE_B64, cfg: okCfg, env: { AI_PROVIDER: 'mock', AI_VISION_MOCK_FILE: emptyFile },
    });
    if (r.ok || r.code !== 'vision_empty') return `code ${r.code}`;
  });

  await check('a provider timeout maps to a safe timeout result', async () => {
    const r = await describePageImage({
      imageBase64: IMAGE_B64, cfg: okCfg, env: { AI_PROVIDER: 'mock', AI_MOCK_FILE: timeoutFile },
    });
    if (r.ok || r.code !== 'timeout') return `code ${r.code}`;
    if (/token|key|secret/i.test(r.message)) return 'the message leaked a sensitive term';
  });

  await check('a rate-limit maps to a safe rate_limited result', async () => {
    const r = await describePageImage({
      imageBase64: IMAGE_B64, cfg: okCfg, env: { AI_PROVIDER: 'mock', AI_MOCK_FILE: rateFile },
    });
    if (r.ok || r.code !== 'rate_limited') return `code ${r.code}`;
  });

  console.log('\n  -- E  vision text is first-class: indexed, retrieved, grounds MCQs --\n');

  const VIS = {
    5: 'Figure 5.1 Consumer Price Index by sector.\n\n'
      + 'The bar chart compares the Consumer Price Index across rural and urban sectors for the survey year. '
      + 'The urban index reads one hundred seventy-two while the rural index reads one hundred sixty-five. '
      + 'Food and beverages form the largest weight in the rural basket at fifty-four percent. '
      + 'Housing contributes the largest urban weight at twenty-two percent of the index. '
      + 'The chart shows the combined all-India index standing at one hundred sixty-nine points.',
    6: 'Figure 5.2 Quarterly Gross Domestic Product growth.\n\n'
      + 'The line graph plots Gross Domestic Product growth across four consecutive quarters. '
      + 'Growth begins at six point one percent in the first quarter and rises steadily. '
      + 'The second quarter records six point eight percent as manufacturing recovers. '
      + 'The third quarter reaches seven point two percent on strong services output. '
      + 'The fourth quarter peaks at seven point four percent, the highest in the series.',
    7: 'Figure 5.3 Sampling design of the National Sample Survey.\n\n'
      + 'The flow diagram shows the two-stage sampling design used by the National Sample Survey. '
      + 'The first stage selects census villages and urban blocks as first-stage units. '
      + 'The second stage selects households within each selected first-stage unit. '
      + 'Stratification groups units by geography before selection to improve precision. '
      + 'Sampling weights are applied so estimates represent the whole population.',
    8: 'Figure 5.4 Labour force participation by age band.\n\n'
      + 'The grouped bar chart shows labour force participation across five age bands. '
      + 'Participation is lowest in the fifteen to nineteen band at twenty-nine percent. '
      + 'It peaks in the thirty to thirty-nine band at eighty-one percent. '
      + 'Participation among women trails men in every age band shown. '
      + 'The oldest band, sixty and above, falls to thirty-three percent participation.',
  };

  const storeDir = join(workdir, 'store');
  const store = await openDocumentStore(storeDir);
  const U1 = 'vision-user-1';
  const U2 = 'vision-user-2';
  const mockEnv = { AI_PROVIDER: 'mock' };
  const visQuery = 'consumer price index gdp growth sampling labour participation chart';
  let visDoc = null;
  let visContext = '';

  await check('vision-described pages ingest as source:vision and mark the doc mixed', async () => {
    const pages = [];
    const filler = 'This page holds general administrative notes about the survey schedule and staffing. ';
    for (let p = 1; p <= 4; p += 1) pages.push({ page: p, text: filler.repeat(8), source: 'native_text' });
    for (const p of [5, 6, 7, 8]) pages.push({ page: p, text: VIS[p], source: 'vision' });
    const ing = await ingestDocument({ store, userId: U1, filename: 'charts.pdf', pages, env: mockEnv });
    if (!ing.ok) return `ingest failed: ${ing.code} ${ing.message}`;
    visDoc = ing.document;
    const doc = store.getDocument(U1, visDoc.id);
    if (doc.extractionMethod !== 'mixed') return `extractionMethod ${doc.extractionMethod}, expected mixed`;
    if (doc.pagesDescribed !== 4) return `pagesDescribed ${doc.pagesDescribed}, expected 4`;
    if (doc.visionStatus !== 'completed') return `visionStatus ${doc.visionStatus}, expected completed`;
  });

  await check('the vision-only topic is retrievable and tagged extractionMethod:vision', async () => {
    const s = await searchDocuments({ store, userId: U1, documentIds: [visDoc.id], query: visQuery, env: mockEnv });
    if (!s.ok) return `search failed: ${s.code}`;
    visContext = s.retrieval.contextText;
    if (!/gross domestic product|consumer price index/i.test(visContext)) return 'vision text was not retrieved';
    const scanned = s.retrieval.usedChunks.filter((c) => c.pageStart >= 5 && c.pageEnd <= 8);
    if (scanned.length === 0) return `no vision page retrieved: ${JSON.stringify(s.pageRanges)}`;
    if (scanned.some((c) => c.extractionMethod === 'native_text')) return 'retrieved vision content mislabelled native_text';
    if (!scanned.some((c) => ['vision', 'mixed'].includes(c.extractionMethod))) return 'no chunk carried a vision label';
  });

  await check('another user cannot retrieve the vision document (ownership)', async () => {
    const s = await searchDocuments({ store, userId: U2, documentIds: [visDoc.id], query: 'gross domestic product', env: mockEnv });
    if (s.ok) return 'U2 searched U1 document';
    if (s.code !== 'no_documents') return `code ${s.code}`;
  });

  await check('MCQs are grounded in vision text and stamped to the real vision page', async () => {
    const idx = buildDocumentIndex(visContext);
    const pool = generateBackfill(visContext, idx, { need: 10, existing: [], allowedTopics: [visQuery], preferTopics: [visQuery] })
      .accepted.map((q) => ({ question: q.question, options: q.options, correctIndex: q.correctIndex, topic: q.topic, kind: q.kind, explanation: q.explanation, source: q.source }));
    if (pool.length < 5) return `only ${pool.length} groundable questions in the vision context`;
    const mockFile = join(workdir, 'vision-mcq.json');
    writeFileSync(mockFile, JSON.stringify({ questions: pool }));
    const r = await generateFromTopic({
      store, userId: U1, documentIds: [visDoc.id], query: visQuery,
      questionCount: 6, env: { AI_PROVIDER: 'mock', AI_MOCK_FILE: mockFile },
    });
    if (!r.ok) return `generation failed: ${r.code} ${r.message}`;
    if (r.questions.length !== 6) return `got ${r.questions.length} questions, expected 6`;
    const fromVision = r.questions.filter((q) => q.source && [5, 6, 7, 8].includes(q.source.pageStart) && ['vision', 'mixed'].includes(q.source.extractionMethod));
    if (fromVision.length === 0) {
      const stamps = r.questions.map((q) => `${q.source?.pageStart}:${q.source?.extractionMethod}`).join(', ');
      return `no question stamped to a vision page 5-8; stamps were ${stamps}`;
    }
  });

  rmSync(workdir, { recursive: true, force: true });
}

main().then(() => {
  console.log(`\n  ${failed === 0 ? 'All vision checks passed.' : 'Something failed.'}  ${passed} passed, ${failed} failed\n`);
  process.exit(failed === 0 ? 0 : 1);
}).catch((e) => { console.error('  harness error:', e); process.exit(1); });
