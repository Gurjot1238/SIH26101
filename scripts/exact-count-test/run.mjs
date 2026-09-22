/**
 * Exact-count contract test for the AI MCQ pipeline (Issue 1).
 *
 * Proves, without a network or a key, that `generateMcqs` returns EXACTLY the requested
 * number of questions — or a controlled error — no matter what the model does. It drives
 * the real pipeline through the `mock` provider, feeding it canned replies that reproduce
 * every failure the bug report and the spec name: the model returning fewer than asked,
 * exactly as many, more than asked, malformed JSON, all duplicates, and options that fail
 * validation. In each case the assertion is the same: questions.length === requested.
 *
 *   node scripts/exact-count-test/run.mjs
 *
 * The "valid AI question" fixtures are built by the document-grounded backfill generator,
 * because those questions are known to pass the exact same validator the AI's must pass —
 * so feeding them as the model's reply is a faithful stand-in for a model that got it
 * right, and it keeps the test from depending on hand-written JSON drifting out of sync
 * with the validator's rules. Where the questions came from is irrelevant to the code
 * under test, which is the counting-and-topping-up plumbing, not question authoring.
 */

import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { readFileSync } from 'node:fs';

import { buildDocumentIndex } from '../../server/ai/validation.mjs';
import { generateBackfill } from '../../server/ai/backfill.mjs';
import { generateMcqs } from '../../server/ai/provider.mjs';

const DOC = readFileSync(new URL('./document.txt', import.meta.url), 'utf8');
const TOPICS = [
  'consumer price index', 'base year', 'basket weights', 'reference quarter',
  'response rate', 'sampling error', 'labour force survey', 'data dissemination',
  'gross domestic product', 'annual survey of industries', 'seasonal adjustment',
];
const CONCEPTS = ['inflation', 'index', 'survey', 'estimate', 'sample'];

const index = buildDocumentIndex(DOC);

/** A pool of validator-passing questions, in the wire shape a model would return. */
function validPool(n) {
  const { accepted } = generateBackfill(DOC, index, { need: n, existing: [], allowedTopics: TOPICS, preferTopics: TOPICS });
  return accepted.map((q) => ({
    question: q.question,
    options: q.options,
    correctIndex: q.correctIndex,
    topic: q.topic,
    kind: q.kind,
    explanation: q.explanation,
    source: q.source,
  }));
}

function wire(questions) {
  return JSON.stringify({ questions });
}

/** Write a canned reply to a temp file and point AI_MOCK_FILE at it. */
function mockEnv(contents) {
  const dir = mkdtempSync(join(tmpdir(), 'exact-count-'));
  const file = join(dir, 'reply.txt');
  writeFileSync(file, contents, 'utf8');
  return { env: { AI_PROVIDER: 'mock', AI_MOCK_FILE: file }, dir };
}

async function run(label, requested, cannedReply, expect) {
  const { env, dir } = mockEnv(cannedReply);
  let result;
  try {
    result = await generateMcqs(
      { text: DOC, topics: TOPICS, concepts: CONCEPTS, questionCount: requested },
      { env },
    );
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }

  const d = result.debug ?? {};
  const finalCount = result.ok ? result.questions.length : (result.questions?.length ?? 0);
  const checks = [];

  if (expect.ok === true) {
    checks.push(['ok', result.ok === true]);
    checks.push([`final === ${requested}`, result.ok && result.questions.length === requested]);
    // Every returned question must independently satisfy the wire contract the frontend
    // re-checks in toQuestions: a stem, exactly 4 non-empty options, a valid correctIndex,
    // an explanation, a verbatim source, and a topic.
    const shapeOk = result.ok && result.questions.every((q) =>
      typeof q.question === 'string' && q.question.trim().length > 0 &&
      Array.isArray(q.options) && q.options.length === 4 &&
      q.options.every((o) => typeof o === 'string' && o.trim().length > 0) &&
      Number.isInteger(q.correctIndex) && q.correctIndex >= 0 && q.correctIndex < 4 &&
      typeof q.explanation === 'string' && q.explanation.trim().length > 0 &&
      typeof q.source === 'string' && q.source.trim().length > 0 &&
      typeof q.topic === 'string' && q.topic.trim().length > 0);
    checks.push(['every question well-formed', shapeOk]);
    // No two questions identical (the paper the learner sees has no repeats).
    if (result.ok) {
      const stems = new Set(result.questions.map((q) => q.question));
      checks.push(['no duplicate stems', stems.size === result.questions.length]);
    }
  } else {
    checks.push([`error code === ${expect.code}`, result.ok === false && result.code === expect.code]);
    if (expect.maxFinal !== undefined) {
      checks.push([`final <= ${expect.maxFinal}`, finalCount <= expect.maxFinal]);
    }
  }

  const passed = checks.every(([, ok]) => ok);
  const status = passed ? 'PASS' : 'FAIL';
  const dbg = `req=${d.requestedCount} parsed=${d.parsedQuestionCount} valid=${d.validQuestionCount} dup=${d.duplicateQuestionCount} rej=${d.rejectedQuestionCount} backfill=${d.backfillQuestionCount} final=${d.finalQuestionCount}`;
  console.log(`${status}  ${label}`);
  console.log(`      ${dbg}  (provider=${result.meta?.provider}, calls=${result.meta?.calls})`);
  if (!passed) {
    for (const [name, ok] of checks) if (!ok) console.log(`      ✗ ${name}`);
    if (!result.ok) console.log(`      msg: ${result.message}`);
  }
  return passed;
}

const results = [];

console.log('=== Exact-count contract: every requested count, AI returns EXACTLY that many ===');
for (const n of [5, 8, 10, 12, 15, 20]) {
  results.push(await run(`AI returns exactly ${n}, requested ${n}`, n, wire(validPool(n)), { ok: true }));
}

console.log('\n=== Partial AI (≥ a real base): model returns FEWER than requested (the original bug) ===');
results.push(await run('requested 20, AI returns 16 → backfill to exactly 20', 20, wire(validPool(16)), { ok: true }));
results.push(await run('requested 20, AI returns 11 → backfill to exactly 20', 20, wire(validPool(11)), { ok: true }));
results.push(await run('requested 15, AI returns 8 → backfill to exactly 15', 15, wire(validPool(8)), { ok: true }));
results.push(await run('requested 12, AI returns 6 → backfill to exactly 12', 12, wire(validPool(6)), { ok: true }));

console.log('\n=== Over-generation: model returns MORE than requested → trim to exact ===');
results.push(await run('requested 20, AI returns 25 → trim to 20', 20, wire(validPool(25)), { ok: true }));
results.push(await run('requested 8, AI returns 18 → trim to 8', 8, wire(validPool(18)), { ok: true }));

console.log('\n=== Genuine AI failure (base below the quiz floor) → controlled error, NOT masked ===');
// Backfill supplements a real model paper; it never papers over a model that failed to
// produce even a minimum base, because that would hide a broken provider behind a
// deterministic quiz.
results.push(await run('requested 12, malformed JSON → honest error, no masking', 12, 'this is not JSON at all {{{', { ok: false, code: 'insufficient_questions', maxFinal: 4 }));
results.push(await run('requested 20, JSON but no questions array → honest error', 20, '{"foo":"bar"}', { ok: false, code: 'insufficient_questions', maxFinal: 4 }));
results.push(await run('requested 10, AI returns only 3 valid → honest error (below floor)', 10, wire(validPool(3)), { ok: false, code: 'insufficient_questions', maxFinal: 4 }));
{
  const one = validPool(1)[0];
  results.push(await run('requested 20, 20 identical → 1 kept, honest error (below floor)', 20, wire(Array.from({ length: 20 }, () => one)), { ok: false, code: 'insufficient_questions', maxFinal: 4 }));
}
{
  const bad = validPool(20).map((q) => ({ ...q, options: q.options.slice(0, 3) }));
  results.push(await run('requested 20, all 3-option → all rejected, honest error', 20, wire(bad), { ok: false, code: 'insufficient_questions', maxFinal: 4 }));
}

console.log('\n=== Provider genuinely down → controlled error, NOT a backfilled quiz ===');
results.push(await run('requested 20, network error every call → error, no masking', 20, '__NETWORK_ERROR__', { ok: false, code: 'network_error', maxFinal: 0 }));

console.log('\n=== Document too thin to reach the count even with backfill → controlled error ===');
{
  // A tiny document cannot yield 20 grounded questions; the contract says error, not a
  // short paper silently shown as if complete.
  const thinEnv = mockEnv('{"questions":[]}');
  const thin = 'The index uses 2012 as its base year. Prices are collected monthly.';
  let r;
  try {
    r = await generateMcqs({ text: thin, topics: ['base year'], concepts: [], questionCount: 20 }, { env: thinEnv.env });
  } finally {
    rmSync(thinEnv.dir, { recursive: true, force: true });
  }
  const ok = r.ok === false && r.code === 'insufficient_questions' && (r.questions?.length ?? 0) < 20;
  console.log(`${ok ? 'PASS' : 'FAIL'}  requested 20 from a 2-sentence doc → insufficient_questions (final ${r.questions?.length ?? 0})`);
  if (!ok) console.log(`      got ok=${r.ok} code=${r.code} final=${r.questions?.length ?? 0}`);
  results.push(ok);
}

const passed = results.filter(Boolean).length;
const total = results.length;
console.log(`\n${passed === total ? 'ALL PASS' : 'SOME FAILED'}: ${passed}/${total}`);
process.exit(passed === total ? 0 : 1);
