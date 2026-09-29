import http from 'node:http';
import https from 'node:https';
import dns from 'node:dns';
import net from 'node:net';
import { URL } from 'node:url';
import { setTimeout as sleep } from 'node:timers/promises';
import { loadConfig } from './config.mjs';

/* eslint-disable no-await-in-loop */

function httpRequest({ urlStr, method = 'GET', headers = {}, bodyBuf = null, timeoutMs = 30_000, maxBytes = 8 * 1024 * 1024, lookup = null }) {
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

    const reqOptions = { hostname: url.hostname, port: url.port ? Number(url.port) : undefined, path: url.pathname + url.search, method, headers: reqHeaders };
    if (lookup) reqOptions.lookup = lookup;

    const req = transport.request(
      reqOptions,
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

function ipv4Blocked(ip) {
  const parts = ip.split('.').map((n) => Number(n));
  if (parts.length !== 4 || parts.some((n) => !Number.isInteger(n) || n < 0 || n > 255)) return true;
  const [a, b] = parts;
  if (a === 0) return true;
  if (a === 10) return true;
  if (a === 127) return true;
  if (a === 169 && b === 254) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  if (a === 100 && b >= 64 && b <= 127) return true;
  if (a >= 224) return true;
  return false;
}

function ipv6Blocked(ip) {
  const s = ip.toLowerCase();
  const tailV4 = s.match(/(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})$/);
  if (tailV4) return ipv4Blocked(tailV4[1]);
  if (s === '::1' || s === '::') return true;
  if (s.startsWith('fe8') || s.startsWith('fe9') || s.startsWith('fea') || s.startsWith('feb')) return true;
  if (s.startsWith('fc') || s.startsWith('fd')) return true;
  if (s.startsWith('ff')) return true;
  if (s.startsWith('64:ff9b')) return true;
  return false;
}

function ipIsBlocked(ip) {
  const fam = net.isIP(ip);
  if (fam === 4) return ipv4Blocked(ip);
  if (fam === 6) return ipv6Blocked(ip);
  return true;
}

function isLoopbackHost(host) {
  const h = String(host).replace(/^\[|\]$/g, '').toLowerCase();
  if (h === 'localhost') return true;
  const fam = net.isIP(h);
  if (fam === 4) return h === '127.0.0.1' || h.startsWith('127.');
  if (fam === 6) return h === '::1';
  return false;
}

function apiHostIsLoopback(cfg) {
  try { return isLoopbackHost(new URL(cfg.ocr.official.apiUrl).hostname); }
  catch { return false; }
}

function pinnedLookup(addresses) {
  const list = addresses.map((a) => ({ address: a.address, family: a.family }));
  return (hostname, options, callback) => {
    const cb = typeof options === 'function' ? options : callback;
    const opts = typeof options === 'function' ? {} : (options || {});
    if (opts.all) cb(null, list);
    else cb(null, list[0].address, list[0].family);
  };
}

export async function assertResultUrlAllowed(jsonUrl, cfg = loadConfig()) {
  const reject = { ok: false, code: 'bad_response', message: 'Cloud OCR returned a result location that was rejected.' };
  let url;
  try { url = new URL(jsonUrl); } catch { return reject; }
  const host = url.hostname.replace(/^\[|\]$/g, '').toLowerCase();

  if (apiHostIsLoopback(cfg) && isLoopbackHost(host)) return { ok: true };

  if (url.protocol !== 'https:') return reject;

  const allow = cfg.ocr.official.resultHostAllowlist;
  if (Array.isArray(allow) && allow.length > 0) {
    const ok = allow.some((h) => host === h || host.endsWith(`.${h}`));
    if (!ok) return reject;
  }

  if (net.isIP(host)) return ipIsBlocked(host) ? reject : { ok: true, addresses: [{ address: host, family: net.isIP(host) }] };

  let addrs;
  try { addrs = await dns.promises.lookup(host, { all: true }); }
  catch { return { ok: false, code: 'service_unavailable', message: 'Cloud OCR result location could not be resolved.' }; }
  if (!addrs.length || addrs.some((rec) => ipIsBlocked(rec.address))) return reject;
  return { ok: true, addresses: addrs.map((r) => ({ address: r.address, family: r.family })) };
}

function classifyStatus(status) {
  if (status === 401 || status === 403) return { code: 'ocr_auth_failed', message: 'Cloud OCR authentication failed.' };
  if (status === 429) return { code: 'ocr_rate_limited', message: 'Cloud OCR is busy right now. Please try again shortly.' };
  if (status === 400 || status === 422) return { code: 'bad_request', message: 'Cloud OCR rejected the request.' };
  if (status >= 500) return { code: 'service_unavailable', message: 'The cloud OCR service is temporarily unavailable.' };
  return { code: 'bad_response', message: 'Cloud OCR returned an unexpected response.' };
}

function unwrapEnvelope(bodyText, status) {
  let parsed;
  try { parsed = JSON.parse(bodyText); } catch { return { ok: false, code: 'bad_response', message: 'Cloud OCR returned a non-JSON response.' }; }
  if (!parsed || typeof parsed !== 'object') return { ok: false, code: 'bad_response', message: 'Cloud OCR returned an unexpected response.' };
  if (typeof status === 'number' && status >= 400) return { ok: false, ...classifyStatus(status) };
  if (parsed.code !== undefined && parsed.code !== null && parsed.code !== 0) {
    return { ok: false, code: 'bad_request', message: 'Cloud OCR could not process the request.' };
  }
  if (!parsed.data || typeof parsed.data !== 'object') return { ok: false, code: 'bad_response', message: 'Cloud OCR response was missing data.' };
  return { ok: true, data: parsed.data };
}

function authHeaderValue(cfg) {
  const scheme = (cfg.ocr.official.authScheme || 'bearer').trim();
  return `${scheme} ${cfg.ocr.official.token}`;
}

async function submitJob({ imageBase64, cfg }) {
  const o = cfg.ocr.official;
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
      return res;
    }
    const remaining = deadline - Date.now();
    if (remaining <= 0) break;
    await sleep(Math.min(interval, remaining));
    interval = Math.min(Math.floor(interval * 1.5), 4_000);
  }
  return { ok: false, code: 'timeout', message: 'Cloud OCR took too long to process this page.' };
}

async function fetchResult({ jsonUrl, cfg }) {
  const o = cfg.ocr.official;
  const guard = await assertResultUrlAllowed(jsonUrl, cfg);
  if (!guard.ok) return guard;
  const lookup = Array.isArray(guard.addresses) && guard.addresses.length ? pinnedLookup(guard.addresses) : null;
  const res = await httpRequest({ urlStr: jsonUrl, method: 'GET', headers: {}, timeoutMs: o.resultTimeoutMs, maxBytes: o.maxResultBytes, lookup });
  if (!res.ok) return res;
  if (typeof res.status === 'number' && res.status >= 400) return { ok: false, ...classifyStatus(res.status) };
  return { ok: true, bodyText: res.bodyText };
}

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

export async function ocrImageOfficial({ imageBase64, pageNumber = null, cfg = loadConfig(), env = process.env } = {}) { // eslint-disable-line no-unused-vars
  const o = cfg.ocr.official;
  if (!o.token || o.token.trim() === '') {
    return { ok: false, code: 'ocr_not_configured', message: 'Cloud OCR is not configured on this server.' };
  }
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
  const confidence = parsed.scores.length
    ? Math.max(0, Math.min(1, parsed.scores.reduce((a, b) => a + b, 0) / parsed.scores.length))
    : o.defaultConfidence;

  return { ok: true, text, confidence, lineCount, engine: 'official_api', durationMs: Date.now() - started };
}

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
