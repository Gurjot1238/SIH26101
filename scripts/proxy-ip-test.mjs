#!/usr/bin/env node
/**
 * clientKey() proxy-parsing tests (audit finding A5).
 *
 * A client fully controls its own `X-Forwarded-For` header; each trusted proxy in the chain
 * APPENDS the address it actually saw to the right. So the only trustworthy client address is
 * the entry `hops` from the RIGHT. Reading the leftmost value (the old behaviour) let a client
 * forge a fresh rate-limit bucket per fake IP and defeat every per-IP limit (login, signup, AI,
 * OCR). These checks pin the corrected behaviour and never touch the network.
 */
import { clientKey } from '../server/http.mjs';

let passed = 0; let failed = 0;
function check(name, fn) {
  let problem = null;
  try { problem = fn() ?? null; } catch (e) { problem = `threw: ${e.message}`; }
  if (problem) { failed += 1; console.log(`  FAIL  ${name}\n        ${problem}`); }
  else { passed += 1; console.log(`  ok    ${name}`); }
}

const PEER = '198.51.100.9';          // the socket peer (a proxy, or a direct client)
const CLIENT = '203.0.113.44';        // the honest client address a proxy would record
const FORGED = '9.9.9.9';             // whatever the client tried to inject on the left

/** A minimal req double: XFF header (optional) + a fixed socket peer. */
const req = (xff) => ({
  headers: xff === undefined ? {} : { 'x-forwarded-for': xff },
  socket: { remoteAddress: PEER },
});

console.log('\n  -- clientKey  proxy-aware, spoof-resistant client IP ----------\n');

check('proxy OFF: a forged X-Forwarded-For is ignored, socket peer is used', () => {
  const ip = clientKey(req(`${FORGED}, ${CLIENT}`), 0);
  if (ip !== PEER) return `got ${ip}, expected the socket peer ${PEER}`;
});

check('proxy OFF: no header still returns the socket peer', () => {
  const ip = clientKey(req(undefined), 0);
  if (ip !== PEER) return `got ${ip}`;
});

check('1 hop: a single honest entry is taken as the client', () => {
  const ip = clientKey(req(CLIENT), 1);
  if (ip !== CLIENT) return `got ${ip}`;
});

check('1 hop: a prepended forged entry is ignored (rightmost wins)', () => {
  const ip = clientKey(req(`${FORGED}, ${CLIENT}`), 1);
  if (ip !== CLIENT) return `got ${ip} — the forged left entry leaked through`;
});

check('1 hop: many forged entries still resolve to the appended real client', () => {
  const ip = clientKey(req(`${FORGED}, 8.8.8.8, ${CLIENT}`), 1);
  if (ip !== CLIENT) return `got ${ip}`;
});

check('2 hops: the client is read two entries from the right', () => {
  // chain = [forged, client, proxy1]; with two trusted hops the client sits at length-2.
  const ip = clientKey(req(`${FORGED}, ${CLIENT}, 192.168.10.2`), 2);
  if (ip !== CLIENT) return `got ${ip}`;
});

check('boolean true is treated as a single hop', () => {
  const ip = clientKey(req(`${FORGED}, ${CLIENT}`), true);
  if (ip !== CLIENT) return `got ${ip}`;
});

check('header shorter than the hop count falls back to the socket peer (never a spoof)', () => {
  const ip = clientKey(req(FORGED), 2); // only one entry, but we trust two hops → cannot trust it
  if (ip !== PEER) return `got ${ip}, expected the socket peer ${PEER}`;
});

check('1 hop with no header falls back to the socket peer', () => {
  const ip = clientKey(req(undefined), 1);
  if (ip !== PEER) return `got ${ip}`;
});

console.log(`\n  ${failed === 0 ? 'All proxy-IP checks passed.' : 'SOME CHECKS FAILED.'}  ${passed} passed, ${failed} failed\n`);
process.exit(failed === 0 ? 0 : 1);
