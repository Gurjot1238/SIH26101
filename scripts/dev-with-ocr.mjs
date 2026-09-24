#!/usr/bin/env node
/**
 * Nexora AI — one-command local dev launcher (Vite web + local OCR service).
 *
 * The spec asks for a SINGLE dev command that brings up the browser dev server and the
 * local PaddleOCR HTTP service together, waits until OCR reports healthy, and shuts both
 * down cleanly on Ctrl-C — without pulling in `concurrently` or any other dependency. This
 * is that launcher, written with Node built-ins only.
 *
 * What it does
 *   * Loads server/.env (same "never override an already-set var" rule as the API server)
 *     so an operator's OCR_PORT / OCR_PYTHON / OCR_ENABLED overrides are honoured here too.
 *   * Starts Vite (the web dev server) and the Python OCR service as child processes, each
 *     with its stdout/stderr prefixed ([web] / [ocr]) so one terminal stays readable.
 *   * Auto-selects the OCR interpreter: the configured venv python when it exists (the
 *     .venv-ocr the operator created), else falls back to `python3` so the command still
 *     runs in a degraded mode instead of failing outright.
 *   * Polls GET /health and prints whether OCR is genuinely available. OCR is OPTIONAL: if
 *     it never comes up, the web server keeps running and text PDFs are unaffected.
 *   * On SIGINT/SIGTERM (or if Vite exits) terminates both children and exits cleanly.
 *
 * Usage
 *   node scripts/dev-with-ocr.mjs            # web + OCR (this is `npm run dev`)
 *   node scripts/dev-with-ocr.mjs --ocr-only # just the OCR service (`npm run dev:ocr`)
 *
 * The API/auth server (node server/index.mjs, `npm run auth`) is deliberately NOT started
 * here — it is a separate long-lived process the operator already runs; folding it in would
 * clash with an existing `npm run auth` on the same port.
 */

import { spawn } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { get as httpGet } from 'node:http';
import { dirname, isAbsolute, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { loadConfig } from '../server/documents/config.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = join(HERE, '..');
const OCR_ONLY = process.argv.includes('--ocr-only');

// __WRAPPER_BODY__

/** One structured launcher line, kept distinct from the children's own [web]/[ocr] output. */
function log(msg) { process.stdout.write(`[dev] ${msg}\n`); }

/**
 * Minimal .env reader — mirrors server/index.mjs so both the API server and this launcher
 * resolve OCR_* the same way. Never overrides a variable already present in the environment.
 */
function loadEnvFile(path) {
  if (!existsSync(path)) return false;
  for (const rawLine of readFileSync(path, 'utf8').split(/\r?\n/)) {
    const line = rawLine.trim();
    if (line === '' || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq <= 0) continue;
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (process.env[key] === undefined) process.env[key] = value;
  }
  return true;
}

loadEnvFile(join(REPO, 'server', '.env'));
const ocr = loadConfig(process.env).ocr;

// Children we own. Both are stopped with SIGTERM on shutdown: the OS closes each listening
// socket promptly, so the dev ports free up immediately on Ctrl-C. (SIGINT to the Python
// http.server also unwinds via KeyboardInterrupt, but its thread teardown can leave the port
// held for a couple of seconds — SIGTERM is the reliable, instant choice for a dev launcher.)
const children = [];
let shuttingDown = false;

/** Line-buffer a child stream and re-emit each line under a fixed tag, so logs stay clean. */
function pipeTagged(stream, tag, dest) {
  let buffered = '';
  stream.setEncoding('utf8');
  stream.on('data', (chunk) => {
    buffered += chunk;
    const lines = buffered.split('\n');
    buffered = lines.pop() ?? '';
    for (const line of lines) dest.write(`${tag} ${line}\n`);
  });
  stream.on('end', () => { if (buffered) dest.write(`${tag} ${buffered}\n`); });
}

function startChild(tag, command, args, extraEnv = {}) {
  const child = spawn(command, args, {
    cwd: REPO,
    env: { ...process.env, ...extraEnv },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  pipeTagged(child.stdout, tag, process.stdout);
  pipeTagged(child.stderr, tag, process.stderr);
  return child;
}

// __WRAPPER_BODY_2__

/**
 * Choose the Python interpreter for the OCR service. The configured/overridden path wins
 * when it exists (the operator's .venv-ocr); a bare command name is left for PATH lookup;
 * a missing configured path falls back to python3 so the launcher still runs (the service
 * then honestly reports OCR unavailable rather than the command failing).
 */
function resolvePython() {
  const configured = (process.env.OCR_PYTHON ?? '').trim() || ocr.python;
  if (!configured.includes('/')) return configured;               // e.g. "python3" → PATH
  const abs = isAbsolute(configured) ? configured : join(REPO, configured);
  if (existsSync(abs)) return abs;
  log(`configured OCR python "${configured}" not found — falling back to python3 (OCR may be unavailable).`);
  return 'python3';
}

/** One /health probe. Resolves to the parsed body, or null on any failure/timeout. */
function ocrHealthOnce() {
  return new Promise((resolve) => {
    const req = httpGet({ host: ocr.host, port: ocr.port, path: '/health', timeout: 2000 }, (res) => {
      let body = '';
      res.on('data', (c) => { body += c; });
      res.on('end', () => {
        try { resolve(res.statusCode === 200 ? JSON.parse(body) : null); } catch { resolve(null); }
      });
    });
    req.on('error', () => resolve(null));
    req.on('timeout', () => { req.destroy(); resolve(null); });
  });
}

async function waitForOcr(timeoutMs = 20_000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const health = await ocrHealthOnce();
    if (health) return health;
    await new Promise((r) => setTimeout(r, 300));
  }
  return null;
}

function shutdown(code = 0) {
  if (shuttingDown) return;
  shuttingDown = true;
  for (const { child, signal } of children) {
    try { child.kill(signal); } catch { /* already gone */ }
  }
  // Give the children a moment to unwind, then leave regardless.
  setTimeout(() => process.exit(code), 600);
}

process.on('SIGINT', () => { log('stopping (SIGINT)…'); shutdown(0); });
process.on('SIGTERM', () => { log('stopping (SIGTERM)…'); shutdown(0); });

function startOcr() {
  if (!ocr.enabled) {
    log('OCR is disabled (OCR_ENABLED=false) — not starting the OCR service.');
    return null;
  }
  const python = resolvePython();
  log(`starting OCR service — ${python} server/ocr/ocr_service.py on ${ocr.host}:${ocr.port}`);
  const child = startChild('[ocr]', python, ['server/ocr/ocr_service.py'], {
    OCR_HOST: ocr.host,
    OCR_PORT: String(ocr.port),
    OCR_LANG: ocr.lang,
    // OCR_ENGINE (paddle by default, "stub" in tests) is inherited from the environment.
  });
  children.push({ child, signal: 'SIGTERM' });
  child.on('error', (err) => {
    log(`OCR service could not start (${err.code || err.message}). Text PDFs are unaffected; scanned PDFs will be unavailable.`);
    if (OCR_ONLY) shutdown(1);
  });
  child.on('exit', (code, signal) => {
    if (shuttingDown) return;
    if (OCR_ONLY) { log(`OCR service exited (code=${code}, signal=${signal}).`); shutdown(code ?? 0); return; }
    log(`OCR service exited (code=${code}, signal=${signal}). Continuing without OCR — text PDFs still work.`);
  });
  return child;
}

function startWeb() {
  // Default is Vite. DEV_WEB_CMD/DEV_WEB_ARGS let an operator (or the startup test, which
  // cannot run Vite's platform-native binaries in CI) substitute the web command without
  // touching this file. When unset, behaviour is exactly `vite`.
  const override = (process.env.DEV_WEB_CMD ?? '').trim();
  let command;
  let args;
  if (override) {
    command = override;
    const rawArgs = (process.env.DEV_WEB_ARGS ?? '').trim();
    args = rawArgs === '' ? [] : rawArgs.split(/\s+/);
  } else {
    const viteBin = join(REPO, 'node_modules', '.bin', 'vite');
    command = existsSync(viteBin) ? viteBin : 'vite';
    args = [];
  }
  log(`starting web dev server${override ? ` (${command})` : ' (vite)'}…`);
  const child = startChild('[web]', command, args);
  children.push({ child, signal: 'SIGTERM' });
  child.on('error', (err) => { log(`web dev server failed to start: ${err.message}`); shutdown(1); });
  child.on('exit', (code, signal) => {
    if (shuttingDown) return;
    log(`web dev server exited (code=${code}, signal=${signal}). Shutting everything down.`);
    shutdown(code ?? 0);
  });
  return child;
}

async function main() {
  if (OCR_ONLY) {
    const child = startOcr();
    if (!child) { process.exit(0); return; }
    const health = await waitForOcr();
    if (health) log(`OCR ready — engine=${health.engine}, available=${health.available}${health.paddleocrVersion ? `, paddleocr=${health.paddleocrVersion}` : ''}`);
    else log('OCR service did not report healthy within the timeout (it may still be starting).');
    return; // the child keeps the process alive until Ctrl-C
  }

  startWeb();
  const ocrChild = startOcr();
  if (ocrChild) {
    const health = await waitForOcr();
    if (health && health.available) log(`OCR ready — engine=${health.engine}. Scanned PDFs will be read locally.`);
    else if (health && !health.available) log('OCR service is up but PaddleOCR is not installed here — scanned PDFs get an honest "unavailable" message; text PDFs are unaffected.');
    else log('OCR service not reachable yet — text PDFs work now; scanned PDFs will work once it is up.');
  }
  log('dev environment ready. Press Ctrl-C to stop.');
}

main().catch((err) => { log(`launcher error: ${err.message}`); shutdown(1); });


