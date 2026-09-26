/**
 * Node -> hosted PaddleOCR Official API adapter (provider === 'official_api').
 *
 * This is the PRODUCTION OCR path. Unlike the local provider (server/documents/ocr.mjs +
 * the loopback Python service) it needs no .venv-ocr and no Python on the deploy host: a
 * single scanned-page image is sent to the hosted asynchronous jobs API, the job is polled
 * until it finishes, and its JSONL result is parsed into the SAME normalised shape the local
 * engine returns — { ok, text, confidence, lineCount, engine } — so everything downstream
 * (append → finalize → chunk → BM25 index → retrieve → grounded MCQ generation, and the
 * whole 800–1000-page workflow) is byte-for-byte identical regardless of which provider read
 * the page. There is deliberately no second pipeline.
 *
 * The async contract (Baidu AI Studio, model PaddleOCR-VL-1.6):
 *   1. POST   <apiUrl>            { file:<base64>, fileType:1, model, [useChartRecognition] }
 *                                 → { code, msg, data:{ jobId } }
 *   2. GET    <apiUrl>/<jobId>    → { code, msg, data:{ state, [extractProgress],
 *                                     [errorMsg], [resultUrl:{ jsonUrl }] } }
 *      state ∈ pending | running | done | failed
 *   3. GET    <jsonUrl>           → JSON Lines; each line { result:{ layoutParsingResults:[
 *                                     { markdown:{ text, images }, outputImages, ... } ] } }
 *
 * Design rules (mirrors ocr.mjs, plus cloud-specific ones):
 *   * NEVER throws. Every failure — missing token, auth rejection, rate limit, timeout,
 *     unreachable API, malformed envelope, bad JSONL, empty result — resolves to a stable
 *     { ok:false, code, message } so a single page can be marked "OCR failed" without taking
 *     the request or the server down.
 *   * The token is read from cfg.ocr.official.token (env PADDLEOCR_ACCESS_TOKEN) and used
 *     ONLY in the Authorization header to the API host. It is never logged, never returned in
 *     a result, and never sent to the object-storage result URL (a different, untrusted host).
 *   * Everything is bounded: submit timeout, per-poll timeout, a total poll-wait ceiling, a
 *     result-download timeout, and a hard cap on the downloaded result size.
 */

import http from 'node:http';
import https from 'node:https';
import dns from 'node:dns';
import net from 'node:net';
import { URL } from 'node:url';
import { setTimeout as sleep } from 'node:timers/promises';
import { loadConfig } from './config.mjs';

/* eslint-disable no-await-in-loop */

// ---- low-level HTTP: always resolves a structured outcome, never throws ----------

/** One HTTP(S) request, body + response both bounded. Resolves; never rejects. */
function httpRequest({ urlStr, method = 'GET', headers = {}, bodyBuf = null, timeoutMs = 30_000, maxBytes = 8 * 1024 * 1024 }) {
  return new Promise((resolve) => {
    let settled = false;
    const done = (v) => { if (!settled) { settled = true; resolve(v); } };

    let url;
    try { url = new URL(urlStr); } catch { done({ ok: false, code: 'bad_config', message: 'The OCR endpoint URL is not valid.' }); return; }
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      done({ ok: false, code: 'bad_config', message: 'The OCR endpoint must be an http(s) URL.' });
      return;
    }
    const transport = url.protocol === 'http:' ? http : https;
    const reqHeaders = { Accept: 'application/json', ...headers };
    if (bodyBuf) reqHeaders['Content-Length'] = bodyBuf.length;

    const req = transport.request(
      { hostname: url.hostname, port: url.port ? Number(url.port) : undefined, path: url.pathname + url.search, method, headers: reqHeaders },
      (res) => {
        const chunks = [];
        let size = 0;
        res.on('data', (c) => {
          size += c.length;
          if (size <= maxBytes) chunks.push(c);
          else req.destroy(new Error('__toobig__'));
        });
        res.on('end', () => {
          clearTimeout(timer);
          done({ ok: true, status: res.statusCode, bodyText: Buffer.concat(chunks).toString('utf8') });
        });
      },
    );
    const timer = setTimeout(() => { req.destroy(new Error('__timeout__')); }, timeoutMs);
    req.on('error', (err) => {
      clearTimeout(timer);
      let code = 'connection_error';
      let message = 'Could not reach the cloud OCR service.';
      if (err && err.message === '__timeout__') { code = 'timeout'; message = 'The cloud OCR service did not respond in time.'; }
      else if (err && err.message === '__toobig__') { code = 'result_too_large'; message = 'The OCR result exceeded the size limit.'; }
      else if (err && err.code === 'ECONNREFUSED') { code = 'service_unavailable'; message = 'The cloud OCR service is unavailable.'; }
      else if (err && err.code === 'ECONNRESET') { code = 'connection_reset'; message = 'The cloud OCR connection was reset.'; }
      else if (err && (err.code === 'ENOTFOUND' || err.code === 'EAI_AGAIN')) { code = 'service_unavailable'; message = 'The cloud OCR service could not be resolved.'; }
      done({ ok: false, code, message });
    });
    if (bodyBuf) req.write(bodyBuf);
    req.end();
  });
}

// ---- SSRF guard for the result-download URL --------------------------------------
//
// The jobs API hands back a result URL on a different, pre-signed object-storage host that we
// then GET server-side. That URL is attacker-influenceable if the API is ever compromised or
// reached over cleartext, so before fetching it we (1) require https, (2) block loopback,
// private, link-local and reserved IP destinations — including the 169.254.169.254 cloud
// metadata address — resolving DNS names first, and (3) optionally restrict to an operator
// allow-list. The one intentional exception is a fully loopback-configured deployment (the API
// host itself is loopback, i.e. a local stub or self-hosted dev service): there a loopback
// result URL is expected and trusted. A production https API host can never reach that branch,
// so it can never be tricked into fetching an internal address.

/** True for an IPv4 literal in a loopback/private/link-local/CGNAT/multicast/reserved range. */
function ipv4Blocked(ip) {
  const parts = ip.split('.').map((n) => Number(n));
  if (parts.length !== 4 || parts.some((n) => !Number.isInteger(n) || n < 0 || n > 255)) return true;
  const [a, b] = parts;
  if (a === 0) return true;                          // 0.0.0.0/8 "this network"
  if (a === 10) return true;                         // 10/8 private
  if (a === 127) return true;                        // 127/8 loopback
  if (a === 169 && b === 254) return true;           // 169.254/16 link-local (incl. cloud metadata)
  if (a === 172 && b >= 16 && b <= 31) return true;  // 172.16/12 private
  if (a === 192 && b === 168) return true;           // 192.168/16 private
  if (a === 100 && b >= 64 && b <= 127) return true; // 100.64/10 CGNAT
  if (a >= 224) return true;                         // 224/4 multicast + 240/4 reserved + broadcast
  return false;
}

/** True for an IPv6 literal in a loopback/ULA/link-local/multicast range (and mapped v4). */
function ipv6Blocked(ip) {
  const s = ip.toLowerCase();
  // Any embedded/mapped IPv4 (::ffff:1.2.3.4, ::1.2.3.4, 64:ff9b::1.2.3.4) → judge the v4 part.
  const tailV4 = s.match(/(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})$/);
  if (tailV4) return ipv4Blocked(tailV4[1]);
  if (s === '::1' || s === '::') return true;        // loopback / unspecified
  if (s.startsWith('fe8') || s.startsWith('fe9') || s.startsWith('fea') || s.startsWith('feb')) return true; // fe80::/10 link-local
  if (s.startsWith('fc') || s.startsWith('fd')) return true; // fc00::/7 unique-local
  if (s.startsWith('ff')) return true;               // ff00::/8 multicast
  if (s.startsWith('64:ff9b')) return true;          // NAT64 well-known prefix
  return false;
}

/** True if the address literal must not be fetched (SSRF target). Non-IP input is blocked. */
function ipIsBlocked(ip) {
  const fam = net.isIP(ip);
  if (fam === 4) return ipv4Blocked(ip);
  if (fam === 6) return ipv6Blocked(ip);
  return true;
}

/** True for hostnames that denote the local machine (localhost / loopback IP literals). */
function isLoopbackHost(host) {
  const h = String(host).replace(/^\[|\]$/g, '').toLowerCase();
  if (h === 'localhost') return true;
  const fam = net.isIP(h);
  if (fam === 4) return h === '127.0.0.1' || h.startsWith('127.');
  if (fam === 6) return h === '::1';
  return false;
}

/** Is the configured jobs-API host a loopback address (self-hosted stub / local dev)? */
function apiHostIsLoopback(cfg) {
  try { return isLoopbackHost(new URL(cfg.ocr.official.apiUrl).hostname); }
  catch { return false; }
}

/**
 * Validate the pre-signed result URL before we fetch it. Resolves { ok:true } or a safe,
 * secret-free { ok:false, code, message }. Exported for direct testing of the guard.
 */
export async function assertResultUrlAllowed(jsonUrl, cfg = loadConfig()) {
  const reject = { ok: false, code: 'bad_response', message: 'Cloud OCR returned a result location that was rejected.' };
  let url;
  try { url = new URL(jsonUrl); } catch { return reject; }
  const host = url.hostname.replace(/^\[|\]$/g, '').toLowerCase();

  // Loopback-configured deployment (local stub / self-hosted dev): a loopback result URL is
  // expected and trusted. Reachable only when the API host itself is loopback, so a production
  // https API can never fall into this branch.
  if (apiHostIsLoopback(cfg) && isLoopbackHost(host)) return { ok: true };

  if (url.protocol !== 'https:') return reject;

  const allow = cfg.ocr.official.resultHostAllowlist;
  if (Array.isArray(allow) && allow.length > 0) {
    const ok = allow.some((h) => host === h || host.endsWith(`.${h}`));
    if (!ok) return reject;
  }

  if (net.isIP(host)) return ipIsBlocked(host) ? reject : { ok: true };

  let addrs;
  try { addrs = await dns.promises.lookup(host, { all: true }); }
  catch { return { ok: false, code: 'service_unavailable', message: 'Cloud OCR result location could not be resolved.' }; }
  if (!addrs.length || addrs.some((rec) => ipIsBlocked(rec.address))) return reject;
  return { ok: true };
}

// ---- envelope + auth helpers -----------------------------------------------------

/** Map an HTTP status from the API to a stable, secret-free { code, message }. */
function classifyStatus(status) {
  if (status === 401 || status === 403) return { code: 'ocr_auth_failed', message: 'Cloud OCR authentication failed.' };
  if (status === 429) return { code: 'ocr_rate_limited', message: 'Cloud OCR is busy right now. Please try again shortly.' };
  if (status === 400 || status === 422) return { code: 'bad_request', message: 'Cloud OCR rejected the request.' };
  if (status >= 500) return { code: 'service_unavailable', message: 'The cloud OCR service is temporarily unavailable.' };
  return { code: 'bad_response', message: 'Cloud OCR returned an unexpected response.' };
}

/**
 * Parse the { code, msg, data } envelope. Resolves { ok:true, data } or a secret-free
 * { ok:false, code, message }. The server's raw `msg` is never surfaced to the user (it
 * could echo request details); only a fixed, safe summary is returned.
 */
function unwrapEnvelope(bodyText, status) {
  let parsed;
  try { parsed = JSON.parse(bodyText); } catch { return { ok: false, code: 'bad_response', message: 'Cloud OCR returned a non-JSON response.' }; }
  if (!parsed || typeof parsed !== 'object') return { ok: false, code: 'bad_response', message: 'Cloud OCR returned an unexpected response.' };
  // HTTP-level failure takes precedence (auth / rate limit / bad request / server error).
  if (typeof status === 'number' && status >= 400) return { ok: false, ...classifyStatus(status) };
  // Envelope-level failure: a present, non-zero `code` means the service refused the request.
  if (parsed.code !== undefined && parsed.code !== null && parsed.code !== 0) {
    return { ok: false, code: 'bad_request', message: 'Cloud OCR could not process the request.' };
  }
  if (!parsed.data || typeof parsed.data !== 'object') return { ok: false, code: 'bad_response', message: 'Cloud OCR response was missing data.' };
  return { ok: true, data: parsed.data };
}

/** The Authorization header value. The token lives ONLY here — never logged or returned. */
function authHeaderValue(cfg) {
  const scheme = (cfg.ocr.official.authScheme || 'bearer').trim();
  return `${scheme} ${cfg.ocr.official.token}`;
}

// ---- the three async steps: submit → poll → fetch result ------------------------

/** Step 1: submit the page image as an OCR job. Resolves { ok:true, jobId } or an error. */
async function submitJob({ imageBase64, cfg }) {
  const o = cfg.ocr.official;
  // file = raw base64 of the PNG page image; fileType 1 = image (the browser always sends a
  // single rasterised page, never a PDF, on this seam). model + chart flag are sent per config.
  const body = { file: imageBase64, fileType: 1 };
  if (o.model) body.model = o.model;
  if (o.useChartRecognition) body.useChartRecognition = true;

  let bodyBuf;
  try { bodyBuf = Buffer.from(JSON.stringify(body)); }
  catch { return { ok: false, code: 'bad_request', message: 'Could not serialise the OCR request.' }; }

  const res = await httpRequest({
    urlStr: o.apiUrl, method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: authHeaderValue(cfg) },
    bodyBuf, timeoutMs: o.submitTimeoutMs, maxBytes: 1 * 1024 * 1024,
  });
  if (!res.ok) return res;
  const env = unwrapEnvelope(res.bodyText, res.status);
  if (!env.ok) return env;
  const d = env.data;
  const jobId = typeof d.jobId === 'string' ? d.jobId
    : typeof d.id === 'string' ? d.id
      : typeof d.job_id === 'string' ? d.job_id : '';
  if (jobId === '') return { ok: false, code: 'bad_response', message: 'Cloud OCR did not return a job id.' };
  return { ok: true, jobId };
}

/** Step 2: poll until done/failed or the total wait ceiling. Resolves { ok:true, jsonUrl }. */
async function pollJob({ jobId, cfg }) {
  const o = cfg.ocr.official;
  const jobUrl = `${o.apiUrl.replace(/\/+$/, '')}/${encodeURIComponent(jobId)}`;
  const deadline = Date.now() + o.pollMaxMs;
  let interval = o.pollIntervalMs;

  while (Date.now() < deadline) {
    const res = await httpRequest({
      urlStr: jobUrl, method: 'GET',
      headers: { Authorization: authHeaderValue(cfg) },
      timeoutMs: o.pollTimeoutMs, maxBytes: 4 * 1024 * 1024,
    });
    if (res.ok) {
      const env = unwrapEnvelope(res.bodyText, res.status);
      // Auth / rate-limit are terminal; other malformed envelopes are terminal bad_response.
      if (!env.ok) {
        if (env.code === 'service_unavailable' || env.code === 'timeout') { /* transient: retry */ }
        else return env;
      } else {
        const state = typeof env.data.state === 'string' ? env.data.state.toLowerCase() : '';
        if (state === 'done') {
          const jsonUrl = env.data.resultUrl && typeof env.data.resultUrl.jsonUrl === 'string' ? env.data.resultUrl.jsonUrl : '';
          if (jsonUrl === '') return { ok: false, code: 'bad_response', message: 'Cloud OCR finished but returned no result location.' };
          return { ok: true, jsonUrl };
        }
        if (state === 'failed') return { ok: false, code: 'ocr_failed', message: 'Cloud OCR could not process this page.' };
        if (state !== 'pending' && state !== 'running') return { ok: false, code: 'bad_response', message: 'Cloud OCR returned an unexpected job state.' };
      }
    } else if (res.code === 'ocr_auth_failed' || res.code === 'ocr_rate_limited') {
      return res; // terminal transport-level failures
    }
    // Not finished (pending/running, or a transient poll error) → back off and retry, never
    // sleeping past the deadline. Backoff grows 1.5× up to 4s.
    const remaining = deadline - Date.now();
    if (remaining <= 0) break;
    await sleep(Math.min(interval, remaining));
    interval = Math.min(Math.floor(interval * 1.5), 4_000);
  }
  return { ok: false, code: 'timeout', message: 'Cloud OCR took too long to process this page.' };
}

/** Step 3a: download the JSONL result. The pre-signed URL is a DIFFERENT, untrusted host,
 *  so NO Authorization header is sent — the token never leaves the API host. The URL is first
 *  vetted by the SSRF guard (https + no private/loopback/metadata target), then size-capped. */
async function fetchResult({ jsonUrl, cfg }) {
  const o = cfg.ocr.official;
  const guard = await assertResultUrlAllowed(jsonUrl, cfg);
  if (!guard.ok) return guard;
  const res = await httpRequest({ urlStr: jsonUrl, method: 'GET', headers: {}, timeoutMs: o.resultTimeoutMs, maxBytes: o.maxResultBytes });
  if (!res.ok) return res;
  if (typeof res.status === 'number' && res.status >= 400) return { ok: false, ...classifyStatus(res.status) };
  return { ok: true, bodyText: res.bodyText };
}

/**
 * Step 3b: parse the JSON Lines result. Each non-empty line is a JSON object; we read
 * result.layoutParsingResults[].markdown.text and concatenate it in order (one page image
 * usually yields one line with one entry, but we tolerate several). Any per-page rec_scores
 * are averaged into a confidence; VL parsing often omits them, in which case the caller falls
 * back to the configured default. Resolves { ok:true, text, scores } or a structured error.
 */
function collectText(jsonlText) {
  const lines = jsonlText.split(/\r?\n/).map((l) => l.trim()).filter((l) => l !== '');
  if (lines.length === 0) return { ok: false, code: 'empty_result', message: 'Cloud OCR returned an empty result.' };

  const texts = [];
  const scores = [];
  let sawEntry = false;
  let sawTextField = false;
  for (const line of lines) {
    let item;
    try { item = JSON.parse(line); } catch { return { ok: false, code: 'bad_response', message: 'Cloud OCR result was not valid JSONL.' }; }
    const result = item && typeof item === 'object' ? (item.result ?? item) : null;
    const lpr = result && Array.isArray(result.layoutParsingResults) ? result.layoutParsingResults : null;
    if (!lpr) continue;
    for (const page of lpr) {
      sawEntry = true;
      const md = page && typeof page === 'object' ? page.markdown : null;
      const text = md && typeof md.text === 'string' ? md.text
        : (page && typeof page.text === 'string' ? page.text : null);
      if (typeof text === 'string') { sawTextField = true; if (text.trim() !== '') texts.push(text); }
      const pr = page && typeof page === 'object' ? page.prunedResult : null;
      const recScores = pr && Array.isArray(pr.rec_scores) ? pr.rec_scores : null;
      if (recScores) for (const s of recScores) if (typeof s === 'number' && s >= 0 && s <= 1) scores.push(s);
    }
  }
  if (!sawEntry) return { ok: false, code: 'bad_response', message: 'Cloud OCR result contained no pages.' };
  if (!sawTextField) return { ok: false, code: 'bad_response', message: 'Cloud OCR result page was missing text.' };
  return { ok: true, text: texts.join('\n\n').trim(), scores };
}

// ---- the two exports: one page image → normalised result; health without a network call --

/**
 * OCR one rasterised page image via the hosted async API. Resolves the SAME normalised shape
 * the local engine returns — { ok:true, text, confidence, lineCount, engine, durationMs } — or
 * a stable { ok:false, code, message }. NEVER throws, so a single failed page is marked and the
 * request/server survive. The token presence is checked FIRST (empty → ocr_not_configured, a
 * clear config error, never a blind call). imageBase64 is the raw base64 of the PNG page image
 * the browser already produced on the existing per-page seam — no PDF bytes, no second pipeline.
 */
export async function ocrImageOfficial({ imageBase64, pageNumber = null, cfg = loadConfig(), env = process.env } = {}) { // eslint-disable-line no-unused-vars
  const o = cfg.ocr.official;
  if (!o.token || o.token.trim() === '') {
    return { ok: false, code: 'ocr_not_configured', message: 'Cloud OCR is not configured on this server.' };
  }
  // Never send the bearer token over cleartext: require https for the jobs API host (a loopback
  // dev/stub endpoint may use http). This closes the MITM path that would otherwise expose both
  // the token and the result URL that drives the SSRF guard.
  let apiHost;
  try { apiHost = new URL(o.apiUrl); }
  catch { return { ok: false, code: 'bad_config', message: 'Cloud OCR endpoint is not configured correctly.' }; }
  if (apiHost.protocol !== 'https:' && !isLoopbackHost(apiHost.hostname)) {
    return { ok: false, code: 'bad_config', message: 'Cloud OCR endpoint is not configured correctly.' };
  }
  const started = Date.now();

  const sub = await submitJob({ imageBase64, cfg });
  if (!sub.ok) return sub;

  const poll = await pollJob({ jobId: sub.jobId, cfg });
  if (!poll.ok) return poll;

  const fetched = await fetchResult({ jsonUrl: poll.jsonUrl, cfg });
  if (!fetched.ok) return fetched;

  const parsed = collectText(fetched.bodyText);
  if (!parsed.ok) return parsed;

  const text = parsed.text;
  const lineCount = text === '' ? 0 : text.split(/\r?\n/).filter((l) => l.trim() !== '').length;
  // VL parsing frequently omits per-line scores; fall back to the configured default so the
  // downstream ocrConfidence plumbing always has a number in [0,1].
  const confidence = parsed.scores.length
    ? Math.max(0, Math.min(1, parsed.scores.reduce((a, b) => a + b, 0) / parsed.scores.length))
    : o.defaultConfidence;

  return { ok: true, text, confidence, lineCount, engine: 'official_api', durationMs: Date.now() - started };
}

/**
 * Report whether the hosted provider is configured, WITHOUT a network call and WITHOUT ever
 * revealing the token. `configured` is true iff a non-empty token is present in the server
 * environment; the value itself is never included. The browser's ocr-health check uses this to
 * decide whether to bother rasterising a page, exactly as it does for the local engine's health.
 */
export function officialHealth({ cfg = loadConfig() } = {}) {
  const o = cfg.ocr.official;
  const configured = !!(o.token && o.token.trim() !== '');
  return {
    reachable: configured,
    available: configured,
    engine: 'official_api',
    provider: 'official_api',
    model: o.model,
    configured,
    ...(configured ? {} : { code: 'ocr_not_configured', message: 'Cloud OCR is not configured on this server.' }),
  };
}
