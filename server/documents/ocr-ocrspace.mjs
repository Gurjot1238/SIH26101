import http from 'node:http';
import https from 'node:https';
import { URL } from 'node:url';

import { loadConfig } from './config.mjs';

// ---------------------------------------------------------------------------
// OCR.space provider (free hosted OCR API — https://ocr.space/ocrapi)
// ---------------------------------------------------------------------------
// A synchronous alternative to the PaddleOCR providers: one POST returns the
// recognised text directly (no submit/poll/fetch job cycle). The API key is
// read server-side only and travels in the `apikey` request header — never in
// the URL, the response, or any user-facing error string.

function isLoopbackHost(host) {
  const h = String(host).replace(/^\[|\]$/g, '').toLowerCase();
  if (h === 'localhost') return true;
  if (h === '127.0.0.1' || h.startsWith('127.')) return true;
  if (h === '::1') return true;
  return false;
}

function httpRequest({ urlStr, method = 'POST', headers = {}, bodyBuf = null, timeoutMs = 30_000, maxBytes = 8 * 1024 * 1024 }) {
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
      let message = 'Could not reach the OCR service.';
      if (err && err.message === '__timeout__') { code = 'timeout'; message = 'The OCR service did not respond in time.'; }
      else if (err && err.message === '__toobig__') { code = 'result_too_large'; message = 'The OCR result exceeded the size limit.'; }
      else if (err && err.code === 'ECONNREFUSED') { code = 'service_unavailable'; message = 'The OCR service is unavailable.'; }
      else if (err && err.code === 'ECONNRESET') { code = 'connection_reset'; message = 'The OCR connection was reset.'; }
      else if (err && (err.code === 'ENOTFOUND' || err.code === 'EAI_AGAIN')) { code = 'service_unavailable'; message = 'The OCR service could not be resolved.'; }
      done({ ok: false, code, message });
    });
    if (bodyBuf) req.write(bodyBuf);
    req.end();
  });
}

function classifyStatus(status) {
  if (status === 401 || status === 403) return { code: 'ocr_auth_failed', message: 'OCR authentication failed. Check the OCR.space API key.' };
  if (status === 429) return { code: 'ocr_rate_limited', message: 'OCR is busy right now. Please try again shortly.' };
  if (status === 400 || status === 422) return { code: 'bad_request', message: 'The OCR service rejected the request.' };
  if (status >= 500) return { code: 'service_unavailable', message: 'The OCR service is temporarily unavailable.' };
  return { code: 'bad_response', message: 'The OCR service returned an unexpected response.' };
}

// OCR.space signals a rate-limited free key inside a 200 body rather than a 429.
function looksRateLimited(message) {
  return /rate limit|too many requests|maximum number of requests/i.test(String(message ?? ''));
}

function parseOcrspaceBody(bodyText) {
  let parsed;
  try { parsed = JSON.parse(bodyText); } catch { return { ok: false, code: 'bad_response', message: 'The OCR service returned a non-JSON response.' }; }
  if (!parsed || typeof parsed !== 'object') return { ok: false, code: 'bad_response', message: 'The OCR service returned an unexpected response.' };

  const errMsg = Array.isArray(parsed.ErrorMessage) ? parsed.ErrorMessage.join(' ') : parsed.ErrorMessage;
  if (parsed.IsErroredOnProcessing === true) {
    if (looksRateLimited(errMsg)) return { ok: false, code: 'ocr_rate_limited', message: 'OCR is busy right now. Please try again shortly.' };
    return { ok: false, code: 'ocr_failed', message: 'The OCR service could not read this page.' };
  }
  // OCRExitCode: 1 = parsed, 2 = partial success (some text). 3/4 = failure.
  const exit = Number(parsed.OCRExitCode);
  if (exit === 3 || exit === 4) {
    if (looksRateLimited(errMsg)) return { ok: false, code: 'ocr_rate_limited', message: 'OCR is busy right now. Please try again shortly.' };
    return { ok: false, code: 'ocr_failed', message: 'The OCR service could not read this page.' };
  }

  const results = Array.isArray(parsed.ParsedResults) ? parsed.ParsedResults : [];
  const texts = results
    .map((r) => (r && typeof r.ParsedText === 'string' ? r.ParsedText : ''))
    .filter((t) => t.trim() !== '');
  const text = texts.join('\n\n').trim();
  if (text === '') return { ok: false, code: 'empty_result', message: 'OCR returned no text for this page.' };
  return { ok: true, text };
}

export async function ocrImageOcrspace({ imageBase64, mimeType = 'image/png', pageNumber = null, cfg = loadConfig(), env = process.env } = {}) { // eslint-disable-line no-unused-vars
  const o = cfg.ocr.ocrspace;
  if (!o.apiKey || o.apiKey.trim() === '') {
    return { ok: false, code: 'ocr_not_configured', message: 'OCR is not configured on this server.' };
  }

  let apiHost;
  try { apiHost = new URL(o.apiUrl); }
  catch { return { ok: false, code: 'bad_config', message: 'OCR endpoint is not configured correctly.' }; }
  if (apiHost.protocol !== 'https:' && !isLoopbackHost(apiHost.hostname)) {
    return { ok: false, code: 'bad_config', message: 'OCR endpoint is not configured correctly.' };
  }

  const safeMime = /^image\/(png|jpe?g|gif|bmp|tiff|webp)$/i.test(mimeType) ? mimeType : 'image/png';
  const form = new URLSearchParams({
    base64Image: `data:${safeMime};base64,${imageBase64}`,
    language: o.language,
    OCREngine: String(o.engine),
    isOverlayRequired: 'false',
    scale: 'true',
    detectOrientation: 'true',
  });
  let bodyBuf;
  try { bodyBuf = Buffer.from(form.toString()); }
  catch { return { ok: false, code: 'bad_request', message: 'Could not serialise the OCR request.' }; }

  const started = Date.now();
  const res = await httpRequest({
    urlStr: o.apiUrl,
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', apikey: o.apiKey },
    bodyBuf,
    timeoutMs: o.timeoutMs,
    maxBytes: o.maxResultBytes,
  });
  if (!res.ok) return { ok: false, code: res.code, message: res.message };
  if (typeof res.status === 'number' && res.status >= 400) return { ok: false, ...classifyStatus(res.status) };

  const parsed = parseOcrspaceBody(res.bodyText);
  if (!parsed.ok) return parsed;

  const text = parsed.text;
  const lineCount = text === '' ? 0 : text.split(/\r?\n/).filter((l) => l.trim() !== '').length;
  return { ok: true, text, confidence: o.defaultConfidence, lineCount, engine: 'ocrspace', durationMs: Date.now() - started };
}

export function ocrspaceHealth({ cfg = loadConfig() } = {}) {
  const o = cfg.ocr.ocrspace;
  const configured = !!(o.apiKey && o.apiKey.trim() !== '');
  return {
    reachable: configured,
    available: configured,
    engine: 'ocrspace',
    provider: 'ocrspace',
    configured,
    ...(configured ? {} : { code: 'ocr_not_configured', message: 'OCR is not configured on this server.' }),
  };
}
