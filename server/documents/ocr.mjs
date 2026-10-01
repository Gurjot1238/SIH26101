import http from 'node:http';
import { loadConfig } from './config.mjs';
import { ocrImageOfficial, officialHealth } from './ocr-official.mjs';
import { ocrImageOcrspace, ocrspaceHealth } from './ocr-ocrspace.mjs';

function approxDecodedBytes(b64) {
  const len = b64.length;
  if (len === 0) return 0;
  const padding = b64.endsWith('==') ? 2 : b64.endsWith('=') ? 1 : 0;
  return Math.floor((len * 3) / 4) - padding;
}

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

export async function ocrHealth({ cfg = loadConfig(), env = process.env } = {}) {
  if (!cfg.ocr.enabled || cfg.ocr.provider === 'disabled') {
    return { available: false, reachable: false, code: 'ocr_disabled', message: 'OCR is disabled on this server.' };
  }
  if (cfg.ocr.provider === 'official_api') {
    return officialHealth({ cfg });
  }
  if (cfg.ocr.provider === 'ocrspace') {
    return ocrspaceHealth({ cfg });
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

export async function ocrImage({ imageBase64, pageNumber = null, stubText, cfg = loadConfig(), env = process.env } = {}) {
  if (!cfg.ocr.enabled || cfg.ocr.provider === 'disabled') return { ok: false, code: 'ocr_disabled', message: 'OCR is disabled on this server.' };
  if (typeof imageBase64 !== 'string' || imageBase64 === '') {
    return { ok: false, code: 'image_required', message: 'A page image is required.' };
  }
  if (approxDecodedBytes(imageBase64) > cfg.ocr.maxImageBytes) {
    return { ok: false, code: 'image_too_large', message: 'The page image exceeds the configured size limit.' };
  }

  if (cfg.ocr.provider === 'official_api') {
    return ocrImageOfficial({ imageBase64, pageNumber, cfg, env });
  }
  if (cfg.ocr.provider === 'ocrspace') {
    return ocrImageOcrspace({ imageBase64, pageNumber, cfg, env });
  }

  const payload = { imageBase64, pageNumber, lang: cfg.ocr.lang };
  if (stubText !== undefined) payload.stubText = stubText;

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
