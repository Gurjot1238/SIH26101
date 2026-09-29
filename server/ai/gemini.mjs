const DEFAULT_MODEL = 'gemini-1.5-flash';
const ENDPOINT_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';

const DEFAULT_TIMEOUT_MS = 30_000;

const MAX_RESPONSE_BYTES = 8 * 1024 * 1024;

// Gemini is multimodal: a request may carry inline images alongside the prompt.
// These caps guard the request envelope itself; callers (e.g. documents/vision.mjs)
// enforce the real per-page limits from configuration before reaching this layer.
const MAX_IMAGE_PARTS = 8;
const MAX_IMAGE_BASE64_BYTES = 16 * 1024 * 1024;
const ALLOWED_IMAGE_MIME = new Set(['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif']);

export const providerName = 'gemini';

// This provider can accept images, so the vision stage may route through it.
export const supportsVision = true;

export const defaultModel = DEFAULT_MODEL;

function normalizeImages(images) {
  if (!Array.isArray(images) || images.length === 0) return [];
  const parts = [];
  let totalBytes = 0;
  for (const image of images) {
    if (parts.length >= MAX_IMAGE_PARTS) break;
    if (!image || typeof image !== 'object') continue;
    const data = typeof image.data === 'string' ? image.data.trim() : '';
    if (data === '') continue;
    const declared = typeof image.mimeType === 'string' ? image.mimeType.toLowerCase() : '';
    const mimeType = ALLOWED_IMAGE_MIME.has(declared) ? declared : 'image/png';
    totalBytes += Math.floor((data.length * 3) / 4);
    if (totalBytes > MAX_IMAGE_BASE64_BYTES) break;
    parts.push({ inlineData: { mimeType, data } });
  }
  return parts;
}

export function isConfigured(env = process.env) {
  return typeof env.GEMINI_API_KEY === 'string' && env.GEMINI_API_KEY.trim() !== '';
}

export class ProviderError extends Error {
  constructor(code, message) {
    super(message);
    this.name = 'ProviderError';
    this.code = code;
  }
}

function modelFor(env) {
  const model = (env.AI_MODEL ?? '').trim().replace(/^models\//i, '');
  return model === '' ? DEFAULT_MODEL : model;
}

async function readCappedText(response, maxBytes) {
  const reader = response.body && typeof response.body.getReader === 'function' ? response.body.getReader() : null;
  if (!reader) return null;
  const decoder = new TextDecoder();
  let out = '';
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > maxBytes) {
      try { await reader.cancel(); } catch { /* already closing */ }
      throw new ProviderError('provider_error', 'The AI provider returned a response that was too large.');
    }
    out += decoder.decode(value, { stream: true });
  }
  out += decoder.decode();
  return out;
}

export async function generateRaw(prompt, { env = process.env, timeoutMs = DEFAULT_TIMEOUT_MS, fetchImpl, images, format } = {}) {
  const key = (env.GEMINI_API_KEY ?? '').trim();
  if (key === '') {
    throw new ProviderError('not_configured', 'The AI provider is not configured.');
  }

  const doFetch = fetchImpl ?? globalThis.fetch;
  if (typeof doFetch !== 'function') {
    throw new ProviderError('provider_error', 'No fetch implementation is available on this runtime.');
  }

  const model = modelFor(env);
  const url = `${ENDPOINT_BASE}/${encodeURIComponent(model)}:generateContent`;

  const parts = [{ text: String(prompt ?? '') }];
  const imageParts = normalizeImages(images);
  for (const part of imageParts) parts.push(part);

  // A JSON response envelope is always returned by the REST API; responseMimeType only
  // constrains the model's own output. Ask for JSON MCQs by default, but drop that
  // constraint for image understanding or any explicit text request (prose descriptions).
  const wantJson = imageParts.length === 0 && format !== 'text';

  const body = {
    contents: [{ role: 'user', parts }],
    generationConfig: {
      temperature: 0.4,
      topP: 0.9,
      maxOutputTokens: 4096,
      ...(wantJson ? { responseMimeType: 'application/json' } : {}),
    },
  };

  const TRANSIENT = new Set([500, 502, 503, 504]);
  const MAX_ATTEMPTS = 3;

  let response;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      response = await doFetch(url, {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-goog-api-key': key },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
    } catch (error) {
      if (error && error.name === 'AbortError') {
        throw new ProviderError('timeout', 'The AI provider took too long to respond.');
      }
      throw new ProviderError('network_error', 'Could not reach the AI provider.');
    } finally {
      clearTimeout(timer);
    }

    if (TRANSIENT.has(response.status) && attempt < MAX_ATTEMPTS) {
      await new Promise((resolve) => setTimeout(resolve, 600 * attempt));
      continue;
    }
    break;
  }

  if (response.status === 429) {
    throw new ProviderError('rate_limited', 'The AI provider is rate limiting requests. Try again shortly.');
  }
  if (response.status === 401 || response.status === 403) {
    throw new ProviderError('not_configured', 'The AI provider rejected the configured credentials.');
  }
  if (response.status === 503 || response.status === 500 || response.status === 502 || response.status === 504) {
    throw new ProviderError('provider_error', 'The AI model is overloaded right now (HTTP 503 from Google). This is temporary — try again in a few seconds. If it keeps happening, switch AI_MODEL to a stable version like gemini-2.0-flash.');
  }
  if (!response.ok) {
    throw new ProviderError('provider_error', `The AI provider returned an error (HTTP ${response.status}).`);
  }

  const declaredLength = Number(response.headers?.get?.('content-length') ?? Number.NaN);
  if (Number.isFinite(declaredLength) && declaredLength > MAX_RESPONSE_BYTES) {
    throw new ProviderError('provider_error', 'The AI provider returned a response that was too large.');
  }

  let payload;
  const rawText = await readCappedText(response, MAX_RESPONSE_BYTES);
  if (rawText !== null) {
    try {
      payload = JSON.parse(rawText);
    } catch {
      throw new ProviderError('provider_error', 'The AI provider returned a response that was not JSON.');
    }
  } else {
    try {
      payload = await response.json();
    } catch {
      throw new ProviderError('provider_error', 'The AI provider returned a response that was not JSON.');
    }
  }

  const blocked = payload?.promptFeedback?.blockReason;
  if (blocked) {
    throw new ProviderError('provider_error', 'The AI provider declined to answer for this material.');
  }

  const text = extractText(payload);
  if (typeof text !== 'string' || text.trim() === '') {
    throw new ProviderError('provider_error', 'The AI provider returned an empty response.');
  }
  return text;
}

function extractText(payload) {
  const candidates = Array.isArray(payload?.candidates) ? payload.candidates : [];
  const parts = candidates[0]?.content?.parts;
  if (!Array.isArray(parts)) return '';
  return parts.map((part) => (typeof part?.text === 'string' ? part.text : '')).join('');
}
