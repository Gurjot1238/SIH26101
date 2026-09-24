/**
 * Startup contract (spec test K) — one command brings up BOTH the web dev server and the
 * local OCR service, and Ctrl-C stops both cleanly.
 *
 * This drives the real launcher (scripts/dev-with-ocr.mjs) exactly as `npm run dev` does,
 * but with the paddle-free STUB OCR engine and a system python3 so it runs anywhere (the VM
 * has no PaddlePaddle). The web dev server is substituted (via the launcher's DEV_WEB_CMD
 * seam) with a tiny stdlib HTTP server, because Vite's platform-native binaries cannot run
 * in this Linux CI VM (the node_modules were installed for macOS) — the launcher's job is to
 * orchestrate two processes from one command, and that is exactly what this proves. On the
 * operator's Mac the same command runs the real Vite. It asserts:
 *   K1  the OCR service answers GET /health (engine=stub) — the launcher started it, and
 *   K1  the web server answers on its port — the launcher started it too,
 *       both from the single command; then
 *   K2  after SIGINT, both ports stop accepting connections — clean shutdown, no orphans.
 *
 *   node scripts/startup-test.mjs
 */

import { spawn } from 'node:child_process';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { get as httpGet } from 'node:http';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { setTimeout as sleep } from 'node:timers/promises';

const REPO = join(dirname(fileURLToPath(import.meta.url)), '..');
const OCR_PORT = Number(process.env.STARTUP_TEST_OCR_PORT || 8207);
const WEB_PORT = Number(process.env.STARTUP_TEST_WEB_PORT || 5219);

// A minimal stdlib web server standing in for Vite — listens on the PORT the launcher
// passes through, so probing WEB_PORT proves the launcher brought a web server up.
const workdir = mkdtempSync(join(tmpdir(), 'startup-'));
const fakeWeb = join(workdir, 'fake-web.mjs');
writeFileSync(fakeWeb, [
  "import { createServer } from 'node:http';",
  "const port = Number(process.env.PORT || 5173);",
  "createServer((_req, res) => { res.writeHead(200, { 'Content-Type': 'text/html' }); res.end('<!doctype html><title>dev</title>'); }).listen(port, '127.0.0.1', () => console.log('fake web listening on ' + port));",
  "process.on('SIGTERM', () => process.exit(0));",
  "process.on('SIGINT', () => process.exit(0));",
  '',
].join('\n'));

let passed = 0; let failed = 0;
function ok(name) { passed += 1; console.log(`  ok    ${name}`); }
function bad(name, why) { failed += 1; console.log(`  FAIL  ${name}\n        ${why}`); }

/** GET a port; resolve { status, body } on any HTTP reply, or null if the port is down. */
function probe(port, path = '/') {
  return new Promise((resolve) => {
    const req = httpGet({ host: '127.0.0.1', port, path, timeout: 2000 }, (res) => {
      let body = '';
      res.on('data', (c) => { body += c; });
      res.on('end', () => resolve({ status: res.statusCode, body }));
    });
    req.on('error', () => resolve(null));
    req.on('timeout', () => { req.destroy(); resolve(null); });
  });
}

async function waitUp(port, path, timeoutMs) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const r = await probe(port, path);
    if (r) return r;
    await sleep(300);
  }
  return null;
}

async function waitDown(port, timeoutMs) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const r = await probe(port, '/');
    if (!r) return true;
    await sleep(300);
  }
  return false;
}

// __STARTUP_MAIN__

const launcher = spawn(process.execPath, ['scripts/dev-with-ocr.mjs'], {
  cwd: REPO,
  env: {
    ...process.env,
    OCR_ENABLED: 'true',
    OCR_ENGINE: 'stub',       // paddle-free — runs anywhere
    OCR_PYTHON: 'python3',    // system python; the stub needs only the standard library
    OCR_HOST: '127.0.0.1',
    OCR_PORT: String(OCR_PORT),
    PORT: String(WEB_PORT),   // passed through to the web command
    BROWSER: 'none',          // headless
    DATABASE_URL: '',         // keep off the PG path
    DEV_WEB_CMD: process.execPath,  // stand in for Vite (see header) — the launcher still
    DEV_WEB_ARGS: fakeWeb,          // starts BOTH children from the one command
  },
  stdio: ['ignore', 'pipe', 'pipe'],
});
let out = '';
launcher.stdout.on('data', (d) => { out += d.toString(); });
launcher.stderr.on('data', (d) => { out += d.toString(); });

function tail() { return out.trim().split('\n').slice(-8).map((l) => `        ${l}`).join('\n'); }

async function main() {
  console.log('\n  -- single command: `npm run dev` (stub OCR + Vite) --------------\n');

  // K1 — the OCR service the launcher started answers /health as the stub engine.
  const health = await waitUp(OCR_PORT, '/health', 20_000);
  if (!health) bad('launcher started the OCR service (GET /health)', `no /health on ${OCR_PORT} in time\n${tail()}`);
  else {
    let body = null;
    try { body = JSON.parse(health.body); } catch { /* leave null */ }
    if (health.status !== 200 || body?.engine !== 'stub') bad('launcher started the OCR service (GET /health)', `status ${health.status}, engine ${body?.engine}`);
    else ok('launcher started the OCR service (GET /health, engine=stub)');
  }

  // K1 — the web server the SAME launcher started answers on its port.
  const web = await waitUp(WEB_PORT, '/', 20_000);
  if (!web) bad('launcher started the web dev server', `no web server on ${WEB_PORT} in time\n${tail()}`);
  else if (web.status >= 500) bad('launcher started the web dev server', `web status ${web.status}`);
  else ok(`launcher started the web dev server (HTTP ${web.status})`);

  const bothUp = failed === 0;

  // K2 — one Ctrl-C stops both. Send SIGINT to the launcher and watch the ports close.
  console.log('\n  -- clean shutdown on Ctrl-C -----------------------------------\n');
  launcher.kill('SIGINT');
  const ocrDown = await waitDown(OCR_PORT, 12_000);
  const webDown = bothUp ? await waitDown(WEB_PORT, 12_000) : true;
  if (ocrDown && webDown) ok('SIGINT stopped both the OCR service and the web server');
  else bad('SIGINT stopped both the OCR service and the web server', `ocrDown=${ocrDown} webDown=${webDown}`);
}

function cleanup() {
  try { launcher.kill('SIGINT'); } catch { /* gone */ }
  // Last resort so the test never leaves an orphaned dev stack behind.
  setTimeout(() => { try { launcher.kill('SIGKILL'); } catch { /* gone */ } }, 1500);
  try { rmSync(workdir, { recursive: true, force: true }); } catch { /* best effort */ }
}

main()
  .catch((e) => { failed += 1; console.log(`  FAIL  launcher test threw\n        ${e.message}`); })
  .finally(async () => {
    cleanup();
    await sleep(2000);
    console.log(`\n  ${failed === 0 ? 'Startup check passed.' : 'Startup check failed.'}  ${passed} passed, ${failed} failed\n`);
    process.exit(failed === 0 ? 0 : 1);
  });

