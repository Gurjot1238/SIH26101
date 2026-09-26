#!/usr/bin/env node
/**
 * M1 hardening regression (audit findings A11 + A19).
 *
 * A11 — a staged page upload must be refused BEFORE anything is written once it would push a
 *       document past its page cap, so an over-limit (or looping) client cannot bloat storage.
 * A19 — two concurrent profile writes from the SAME account must not lose an update: the store
 *       serializes read-modify-write per user, so the second write sees the first's result.
 *
 * Pure, offline, temp-dir only — no server, no network. (A13's oversize-stream teardown needs a
 * live HTTP body and is exercised by the OCR integration path; A14's metered-provider clamp is a
 * boot-time decision proven by importing the server with a metered provider + limit 0.)
 */
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { openJsonDocumentStore, DocumentPageLimitError } from '../server/documents/json-store.mjs';
import { openJsonStore } from '../server/json-store.mjs';

let passed = 0; let failed = 0;
async function check(name, fn) {
  let problem = null;
  try { problem = (await fn()) ?? null; } catch (e) { problem = `threw: ${e.message}`; }
  if (problem) { failed += 1; console.log(`  FAIL  ${name}\n        ${problem}`); }
  else { passed += 1; console.log(`  ok    ${name}`); }
}

const pages = (n, base = 0) => Array.from({ length: n }, (_, i) => ({ page: base + i + 1, text: 'x' }));

const root = await mkdtemp(join(tmpdir(), 'nexora-hardening-'));
try {
  /* ---------------------------------------------------- A11: appendPages page cap */
  console.log('\n  -- A11  staged upload is capped inside appendPages ------------\n');
  const docs = await openJsonDocumentStore(join(root, 'documents'));
  const doc = await docs.createDocument({ userId: 'u1', filename: 'big.pdf', sizeBytes: 10 });

  await check('a batch under the cap is appended', async () => {
    const total = await docs.appendPages('u1', doc.id, pages(3), { maxPages: 5 });
    if (total !== 3) return `expected 3, got ${total}`;
  });

  await check('a batch that would exceed the cap throws DocumentPageLimitError', async () => {
    let err = null;
    try { await docs.appendPages('u1', doc.id, pages(3, 3), { maxPages: 5 }); }
    catch (e) { err = e; }
    if (!(err instanceof DocumentPageLimitError)) return `expected DocumentPageLimitError, got ${err}`;
    if (err.code !== 'too_many_pages') return `expected code too_many_pages, got ${err.code}`;
  });

  await check('the rejected batch was NOT persisted (page count unchanged)', () => {
    const rec = docs.getDocument('u1', doc.id);
    if (!rec || rec.pageCount !== 3) return `expected pageCount 3, got ${rec?.pageCount}`;
  });

  await check('a batch that fills the cap exactly is allowed', async () => {
    const total = await docs.appendPages('u1', doc.id, pages(2, 3), { maxPages: 5 });
    if (total !== 5) return `expected 5, got ${total}`;
  });

  await check('with no maxPages option the append is unbounded (backward compatible)', async () => {
    const total = await docs.appendPages('u1', doc.id, pages(100, 5));
    if (total !== 105) return `expected 105, got ${total}`;
  });

  await check('a foreign account cannot append to the document', async () => {
    const total = await docs.appendPages('intruder', doc.id, pages(1), { maxPages: 5 });
    if (total !== null) return `expected null (ownership), got ${total}`;
  });

  /* ---------------------------------------------------- A19: profile lost-update */
  console.log('\n  -- A19  concurrent profile writes do not lose an update -------\n');
  const store = await openJsonStore(root);
  await store.updateProfile('u9', () => ({ preferences: { a: 1 }, courses: {}, updatedAt: 't0' }));

  await check('two concurrent updates to different fields both survive', async () => {
    await Promise.all([
      store.updateProfile('u9', (p) => ({ ...p, preferences: { a: 2, theme: 'dark' }, updatedAt: 't1' })),
      store.updateProfile('u9', (p) => ({ ...p, courses: { c1: { pct: 50 } }, updatedAt: 't2' })),
    ]);
    const f = store.profileForUser('u9');
    if (f?.preferences?.theme !== 'dark') return 'the preferences update was clobbered (lost update)';
    if (f?.courses?.c1?.pct !== 50) return 'the course update was clobbered (lost update)';
  });

  await check('a mutator that throws rejects and persists nothing', async () => {
    const before = JSON.stringify(store.profileForUser('u9'));
    let err = null;
    try { await store.updateProfile('u9', () => { throw new Error('nope'); }); }
    catch (e) { err = e; }
    if (!err || err.message !== 'nope') return `expected the mutator error to propagate, got ${err}`;
    if (JSON.stringify(store.profileForUser('u9')) !== before) return 'a throwing update changed the profile';
  });

  await check('the per-user lock is not left stuck after a failed update', async () => {
    const after = await store.updateProfile('u9', (p) => ({ ...p, updatedAt: 't3' }));
    if (after?.updatedAt !== 't3') return 'a later update did not run — the lock is stuck';
  });

  await check('a mutator returning undefined leaves the profile unchanged', async () => {
    const before = JSON.stringify(store.profileForUser('u9'));
    const result = await store.updateProfile('u9', () => undefined);
    if (JSON.stringify(result) !== before) return 'undefined return should mean "no change"';
  });
} finally {
  await rm(root, { recursive: true, force: true });
}

console.log(`\n  ${failed === 0 ? 'All hardening checks passed.' : 'SOME CHECKS FAILED.'}  ${passed} passed, ${failed} failed\n`);
process.exit(failed === 0 ? 0 : 1);
