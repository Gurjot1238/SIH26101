/**
 * Smart Document Intelligence — end-to-end backend pipeline test (no key, no network).
 *
 * Exercises the real orchestrator against a temporary store and the mock AI provider:
 *   - ingest a 900-page synthetic book → classified, chunked, job runs to completion;
 *   - search a topic → bounded relevant context with real page ranges;
 *   - generate MCQs from ONLY that context → exact count, each question stamped with its
 *     real document id + page range (never an invented page);
 *   - one-page material generation is grounded in the retrieved context;
 *   - ownership isolation: another user cannot see or search the document;
 *   - job retry/resume: a failing chunk fails the job, resume reprocesses ONLY that chunk.
 *
 *   node scripts/docpipeline-test.mjs
 */

import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { openDocumentStore } from '../server/documents/store.mjs';
import { ingestDocument, searchDocuments, generateFromTopic } from '../server/documents/pipeline.mjs';
import { runJob, resumeJob } from '../server/documents/jobs.mjs';
import { buildDocumentIndex } from '../server/ai/validation.mjs';
import { generateBackfill } from '../server/ai/backfill.mjs';

let passed = 0; let failed = 0;
async function check(name, fn) {
  let problem = null;
  try { problem = (await fn()) ?? null; } catch (e) { problem = `threw: ${e.message}`; }
  if (problem) { failed += 1; console.log(`  FAIL  ${name}\n        ${problem}`); }
  else { passed += 1; console.log(`  ok    ${name}`); }
}

function syntheticBook() {
  const pages = [];
  const filler = 'This section covers general administrative background about the course and its schedule. ';
  for (let p = 1; p <= 900; p += 1) {
    if (p >= 311 && p <= 320) {
      pages.push({ page: p, text: 'Chapter 8 Database Design\n\n8.5 Normalization\n\nNormalization decomposes relations to remove redundancy and prevent update anomalies. First normal form requires atomic attribute values. Second normal form removes partial dependencies. Third normal form removes transitive dependencies using functional dependencies.' });
    } else if (p >= 500 && p <= 508) {
      pages.push({ page: p, text: 'Chapter 14 Transport Layer\n\n14.3 TCP Congestion Control\n\nTCP congestion control uses slow start and congestion avoidance to adapt the sending rate. Fast retransmit and fast recovery respond to duplicate acknowledgements.' });
    } else {
      pages.push({ page: p, text: filler.repeat(6) });
    }
  }
  return pages;
}

const workdir = mkdtempSync(join(tmpdir(), 'docpipe-'));
const store = await openDocumentStore(workdir);
const U1 = 'user-one';
const U2 = 'user-two';

console.log('\n  -- ingest a 900-page book -------------------------------------\n');

let doc;
await check('ingest classifies, chunks and completes the job', async () => {
  const r = await ingestDocument({ store, userId: U1, filename: 'Operating Systems.pdf', pages: syntheticBook(), sizeBytes: 5_000_000, env: { AI_PROVIDER: 'mock' } });
  if (!r.ok) return `ingest failed: ${r.code} ${r.message}`;
  doc = r.document;
  if (doc.status !== 'ready') return `document status ${doc.status}`;
  if (doc.chunkCount < 20) return `only ${doc.chunkCount} chunks`;
  if (r.mode !== 'DEEP') return `mode ${r.mode}, expected DEEP for 900 pages`;
  if (r.job.status !== 'completed') return `job ${r.job.status}`;
  if (r.job.progress !== 1) return `progress ${r.job.progress}`;
});

console.log('\n  -- topic search returns bounded, relevant, page-tagged context -\n');

let normContext = '';
await check('"normalization" retrieves pages ~311-320, not TCP pages', async () => {
  const s = await searchDocuments({ store, userId: U1, documentIds: [doc.id], query: 'I want to learn normalization', env: { AI_PROVIDER: 'mock' } });
  if (!s.ok) return `search failed: ${s.code}`;
  normContext = s.retrieval.contextText;
  const hits = s.pageRanges.some((r) => r.start <= 320 && r.end >= 311);
  if (!hits) return `page ranges ${JSON.stringify(s.pageRanges)} missed 311-320`;
  const leaksTcp = s.retrieval.usedChunks.some((c) => c.pageStart >= 495 && c.pageEnd <= 515);
  if (leaksTcp) return 'leaked unrelated TCP pages';
});

await check('retrieved context is far smaller than the whole book', async () => {
  const fullChars = syntheticBook().reduce((s, p) => s + p.text.length, 0);
  if (normContext.length === 0) return 'no context retrieved';
  if (normContext.length > fullChars * 0.1) return 'context was not bounded well below the whole book';
});

console.log('\n  -- generate MCQs from ONLY the retrieved context --------------\n');

await check('MCQs are generated with exact count and real page-range sources', async () => {
  // Build a valid model reply grounded in the SAME retrieved context the generator will use.
  const idx = buildDocumentIndex(normContext);
  const pool = generateBackfill(normContext, idx, { need: 15, existing: [], allowedTopics: ['normalization'], preferTopics: ['normalization'] }).accepted
    .map((q) => ({ question: q.question, options: q.options, correctIndex: q.correctIndex, topic: q.topic, kind: q.kind, explanation: q.explanation, source: q.source }));
  if (pool.length < 5) return `only ${pool.length} groundable questions in the retrieved context`;
  const mockFile = join(workdir, 'reply.json');
  writeFileSync(mockFile, JSON.stringify({ questions: pool }));

  const r = await generateFromTopic({
    store, userId: U1, documentIds: [doc.id], query: 'normalization',
    questionCount: 10, wantMaterial: true, materialStyle: 'revision',
    env: { AI_PROVIDER: 'mock', AI_MOCK_FILE: mockFile },
  });
  if (!r.ok) return `generation failed: ${r.code} ${r.message}`;
  if (r.questions.length !== 10) return `got ${r.questions.length} questions, expected 10`;
  for (const q of r.questions) {
    if (!q.source || q.source.documentId !== doc.id) return 'a question is missing its document id';
    if (!Number.isFinite(q.source.pageStart) || !Number.isFinite(q.source.pageEnd)) return 'a question has no real page range';
    if (q.source.pageStart < 1 || q.source.pageEnd > 900) return `page range out of book bounds: ${q.source.pageStart}-${q.source.pageEnd}`;
  }
  if (!r.material || !r.material.ok) return `material generation failed: ${r.material?.code}`;
  if (!r.preview || !Array.isArray(r.preview.pageRanges)) return 'no preview returned';
});

console.log('\n  -- ownership isolation ----------------------------------------\n');

await check('another user cannot read the document', async () => {
  if (store.getDocument(U2, doc.id) !== null) return 'U2 read U1\'s document';
});
await check('another user cannot search the document', async () => {
  const s = await searchDocuments({ store, userId: U2, documentIds: [doc.id], query: 'normalization', env: { AI_PROVIDER: 'mock' } });
  if (s.ok) return 'U2 searched U1\'s document';
  if (s.code !== 'no_documents') return `code ${s.code}`;
});

console.log('\n  -- job retry / resume -----------------------------------------\n');

await check('a failing chunk fails the job; resume reprocesses only that chunk', async () => {
  const job = await store.createJob({ userId: U1, documentId: doc.id, totalChunks: 5, stages: ['reading', 'indexing'] });
  let calls = 0;
  const failIndex2 = async (i) => { calls += 1; if (i === 2) throw new Error('boom'); };
  await runJob(job, { processChunk: failIndex2, maxChunkRetries: 2, persist: async () => {} });
  if (job.status !== 'failed') return `expected failed, got ${job.status}`;
  if (job.chunkStatus[2] !== 'failed') return 'chunk 2 not marked failed';
  if (job.chunkStatus[0] !== 'completed' || job.chunkStatus[4] !== 'completed') return 'other chunks not completed';

  // Resume: completed chunks stay completed; only the previously failed chunk 2 is retried.
  resumeJob(job);
  if (job.chunkStatus[0] !== 'completed' || job.chunkStatus[4] !== 'completed') return 'resume wrongly reset already-completed chunks';
  if (job.chunkStatus[2] !== 'pending') return 'resume did not re-queue the failed chunk';
  let retried = 0;
  await runJob(job, { processChunk: async () => { retried += 1; }, maxChunkRetries: 2, persist: async () => {} });
  if (job.status !== 'completed') return `resume did not complete: ${job.status}`;
  if (retried !== 1) return `resume reprocessed ${retried} chunks, expected only the 1 previously failed`;
});

rmSync(workdir, { recursive: true, force: true });

console.log(`\n  ${failed === 0 ? 'All doc-pipeline checks passed.' : 'Something failed.'}  ${passed} passed, ${failed} failed\n`);
process.exit(failed === 0 ? 0 : 1);
