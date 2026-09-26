/**
 * Node -> OCR adapter (provider-dispatching front door).
 *
 * The browser rasterises only the scanned pages of a PDF and posts each page image to
 * POST /api/documents/ocr-page; that route calls the functions here. After shared contract
 * validation this module dispatches on cfg.ocr.provider:
 *   * 'local'        → forwards the image to the loopback PaddleOCR HTTP service (127.0.0.1),
 *                      the dev default (needs .venv-ocr). Implemented in this file.
 *   * 'official_api' → forwards to the hosted PaddleOCR Official API adapter
 *                      (server/documents/ocr-official.mjs); no local Python required.
 *   * 'disabled'     → OCR is skipped entirely (identical to the master switch being off).
 * Every provider returns the SAME normalised { ok, text, confidence, lineCount, engine } shape,
 * so the whole append → finalize → chunk → index → retrieve → generate path is identical no
 * matter which engine read the page. There is deliberately no second pipeline.
 *
 * Design rules this module keeps:
 *   * It NEVER throws for an OCR problem. A timeout, a refused connection, a malformed
 *     reply or an unavailable engine all resolve to { ok:false, code, message } so a
 *     scanned page can be marked "OCR failed" without taking the request — or the
 *     server — down with it. The only inputs it rejects up front are its own contract
 *     violations (missing image), and even those resolve, never throw.
 *   * The local path talks to loopback only, on the host/port from config. There is no path
 *     field in the contract: the service receives image BYTES, never a filesystem path, so
 *     there is no arbitrary-file-read surface to defend. The hosted path likewise carries only
 *     image bytes, and its token is read inside the official adapter — never here, never logged.
 *   * It bounds everything: a per-request timeout (config), and it refuses an image whose
 *     base64 decodes to more than the configured ceiling before it ever hits the wire.
 */

import http from 'node:http';
import { loadConfig } from './config.mjs';
import { ocrImageOfficial, officialHealth } from './ocr-official.mjs';

/** Approximate decoded byte length of a base64 string without allocating a Buffer. */
function approxDecodedBytes(b64) {
  const len = b64.length;
  if (len === 0) return 0;
  const padding = b64.endsWith('==') ? 2 : b64.endsWith('=') ? 1 : 0;
  return Math.floor((len * 3) / 4) - padding;
}

/** One JSON request to the OCR service. Always resolves; classifies transport errors. */
function requestJson({ host, port, path, method, payload, timeoutMs }) {
  return new Promise((resolve) => {
    let bodyBuf = null;
    if (payload !== undefined) {
      try {
        bodyBuf = Buffer.from(JSON.stringify(payload));
      } catch {
        resolve({ ok: false, code: 'bad_request', message: 'Could not serialise the OCR request.' });
        return;
      }
    }

    const headers = { Accept: 'application/json' };
    if (bodyBuf) {
      headers['Content-Type'] = 'application/json';
      headers['Content-Length'] = bodyBuf.length;
    }

    const req = http.request({ host, port, path, method, headers }, (res) => {
      const chunks = [];
      let size = 0;
      let aborted = false;
      const MAX_RESPONSE_BYTES = 8 * 1024 * 1024;
      res.on('data', (c) => {
        if (aborted) return;
        size += c.length;
        // Past the cap, stop reading AND tear the socket down. Merely dropping the
        // bytes (the old behaviour) still let a broken or hostile OCR endpoint stream
        // unbounded data at us and pin CPU/socket for the full timeout window (audit A13).
        if (size > MAX_RESPONSE_BYTES) {
          aborted = true;
          req.destroy(new Error('__too_large__'));
          return;
        }
        chunks.push(c);
      });
      res.on('end', () => {
        if (aborted) return;
        clearTimeout(timer);
        const raw = Buffer.concat(chunks).toString('utf8');
        let parsed;
        try {
          parsed = JSON.parse(raw);
        } catch {
          resolve({ ok: false, code: 'bad_response', message: 'The OCR service returned a non-JSON response.' });
          return;
        }
        if (parsed && typeof parsed === 'object') {
          resolve({ ...parsed, httpStatus: res.statusCode });
        } else {
          resolve({ ok: false, code: 'bad_response', message: 'The OCR service returned an unexpected response.' });
        }
      });
    });

    const timer = setTimeout(() => { req.destroy(new Error('__timeout__')); }, timeoutMs);

    req.on('error', (err) => {
      clearTimeout(timer);
      let code = 'connection_error';
      let message = 'Could not reach the local OCR service.';
      if (err && err.message === '__timeout__') { code = 'timeout'; message = 'The OCR service did not respond in time.'; }
      else if (err && err.message === '__too_large__') { code = 'bad_response'; message = 'The OCR service returned too much data.'; }
      else if (err && err.code === 'ECONNREFUSED') { code = 'service_unavailable'; message = 'The local OCR service is not running.'; }
      else if (err && err.code === 'ECONNRESET') { code = 'connection_reset'; message = 'The OCR connection was reset.'; }
      resolve({ ok: false, code, message });
    });

    if (bodyBuf) req.write(bodyBuf);
    req.end();
  });
}

/** Is the OCR service up, and does it actually have an engine available? Never throws. */
export async function ocrHealth({ cfg = loadConfig(), env = process.env } = {}) {
  // Provider dispatch. 'official_api' reports readiness from config alone (a non-empty token
  // present in the server env) — NO network call and the token itself is never revealed.
  // 'disabled' (or the master switch off) reports unavailable without touching any engine.
  if (!cfg.ocr.enabled || cfg.ocr.provider === 'disabled') {
    return { available: false, reachable: false, code: 'ocr_disabled', message: 'OCR is disabled on this server.' };
  }
  if (cfg.ocr.provider === 'official_api') {
    return officialHealth({ cfg });
  }
  const { host, port } = cfg.ocr;
  const reply = await requestJson({
    host, port, path: '/health', method: 'GET',
    timeoutMs: Math.min(cfg.ocr.timeoutMs, 4000),
  });
  if (reply.ok === false && reply.code) {
    return { available: false, reachable: false, code: reply.code, message: reply.message };
  }
  return {
    available: reply.status === 'ok' && reply.available === true,
    reachable: true,
    engine: reply.engine ?? null,
    lang: reply.lang ?? null,
    paddleocrVersion: reply.paddleocrVersion ?? null,
  };
}

/**
 * OCR a single page image (base64). Resolves to a normalised result or a structured error.
 *   { ok:true, text, confidence, lineCount, engine }
 *   { ok:false, code, message }
 *
 * Shared contract validation (enabled, image present, size ceiling) runs FIRST and is identical
 * for every provider. Only then does it dispatch: provider 'official_api' → the hosted async API
 * (server/documents/ocr-official.mjs), anything else → the loopback local PaddleOCR service. Both
 * return the SAME normalised shape, so append → finalize → chunk → index → retrieve → generate is
 * byte-for-byte identical no matter which engine read the page — there is deliberately no second
 * pipeline. The local provider is preserved intact as the dev/fallback path.
 */
export async function ocrImage({ imageBase64, pageNumber = null, stubText, cfg = loadConfig(), env = process.env } = {}) {
  if (!cfg.ocr.enabled || cfg.ocr.provider === 'disabled') return { ok: false, code: 'ocr_disabled', message: 'OCR is disabled on this server.' };
  if (typeof imageBase64 !== 'string' || imageBase64 === '') {
    return { ok: false, code: 'image_required', message: 'A page image is required.' };
  }
  if (approxDecodedBytes(imageBase64) > cfg.ocr.maxImageBytes) {
    return { ok: false, code: 'image_too_large', message: 'The page image exceeds the configured size limit.' };
  }

  // Provider dispatch. The hosted API needs no local Python / .venv-ocr; the token lives only in
  // the server environment and is read inside the adapter, never here and never on the wire back.
  if (cfg.ocr.provider === 'official_api') {
    return ocrImageOfficial({ imageBase64, pageNumber, cfg, env });
  }

  const payload = { imageBase64, pageNumber, lang: cfg.ocr.lang };
  if (stubText !== undefined) payload.stubText = stubText; // honoured only by the stub engine

  const reply = await requestJson({
    host: cfg.ocr.host, port: cfg.ocr.port, path: '/ocr/image', method: 'POST',
    payload, timeoutMs: cfg.ocr.timeoutMs,
  });

  if (reply.ok === true) {
    return {
      ok: true,
      text: typeof reply.text === 'string' ? reply.text : '',
      confidence: typeof reply.confidence === 'number' ? reply.confidence : 0,
      lineCount: Number.isInteger(reply.lineCount) ? reply.lineCount : 0,
      engine: reply.engine ?? null,
      durationMs: reply.durationMs ?? null,
    };
  }
  return { ok: false, code: reply.code ?? 'ocr_failed', message: reply.message ?? 'OCR failed for this page.' };
}
