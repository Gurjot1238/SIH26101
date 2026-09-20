/**
 * The Gemini adapter: the one file that knows Google's wire format.
 *
 * Everything above it (the route, the service, the validation) speaks in plain
 * `{ text, topics, questionCount }` requests and `{ questions }` responses. This file
 * is where that turns into a `generateContent` POST and back, so swapping to another
 * provider means writing a sibling of this file and nothing else.
 *
 * The key is read from the environment at call time and never logged, never returned,
 * never put in an error message. A network failure here throws a plain Error whose
 * message is safe to surface; the route maps it to an honest user-facing string.
 *
 * Dependency-free on purpose, like the rest of the server: Node's global `fetch`
 * (Node 18+) makes the request, so there is no SDK to install and nothing native to
 * fail to compile on Apple Silicon.
 */

const DEFAULT_MODEL = 'gemini-1.5-flash';
const ENDPOINT_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';

/** How long to wait on the provider before giving up, so a hung API cannot hang a request. */
const DEFAULT_TIMEOUT_MS = 30_000;

export const providerName = 'gemini';

/** The model called when AI_MODEL is blank, so the startup banner can name it. */
export const defaultModel = DEFAULT_MODEL;

/** True when a key is present, so the route can answer "not configured" without a call. */
export function isConfigured(env = process.env) {
  return typeof env.GEMINI_API_KEY === 'string' && env.GEMINI_API_KEY.trim() !== '';
}

/**
 * A defect in configuration or in the provider, tagged so the route can turn it into the
 * right HTTP status and a message that never contains a secret.
 */
export class ProviderError extends Error {
  constructor(code, message) {
    super(message);
    this.name = 'ProviderError';
    this.code = code;
  }
}

/**
 * Google documents model names both bare ("gemini-1.5-flash") and fully qualified
 * ("models/gemini-1.5-flash"), and the second form is what appears in most of their REST
 * examples. ENDPOINT_BASE already ends in /models, so pasting the qualified form would
 * build .../models/models/gemini-1.5-flash and 404. Stripping the prefix here — rather
 * than telling the operator off in a comment — makes both spellings work, and keeps that
 * piece of Google-specific trivia in the Google-specific file.
 */
function modelFor(env) {
  const model = (env.AI_MODEL ?? '').trim().replace(/^models\//i, '');
  return model === '' ? DEFAULT_MODEL : model;
}

/**
 * Ask Gemini for one batch of raw JSON text.
 *
 * Returns the model's text output as a string; parsing and validation are somebody
 * else's job (validation.mjs), because they are provider-independent and this file
 * should stay swappable. The caller passes a fully-formed prompt.
 */
export async function generateRaw(prompt, { env = process.env, timeoutMs = DEFAULT_TIMEOUT_MS, fetchImpl } = {}) {
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

  const body = {
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: {
      // Low but not zero: enough variation that a repair attempt is not identical to the
      // one that just failed, not so much that grounding drifts.
      temperature: 0.4,
      topP: 0.9,
      maxOutputTokens: 4096,
      // Gemini honours this: it returns a bare JSON object instead of prose or a fence.
      responseMimeType: 'application/json',
    },
  };

  // Gemini answers 500/502/503/504 when the model is momentarily overloaded rather
  // than when anything is wrong with the request — it is Google's "busy, try again",
  // and it clears on its own within a second or two. Retrying a few times with a short
  // growing pause turns the commonest transient failure into a slight delay instead of
  // a visible error. Auth (401/403), rate limits (429) and bad requests (400/404) are
  // NOT transient, so they fall straight through to the handling below without a retry.
  const TRANSIENT = new Set([500, 502, 503, 504]);
  const MAX_ATTEMPTS = 3;

  let response;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      response = await doFetch(url, {
        method: 'POST',
        // The key rides in a header, never in the URL, so it cannot land in an access log.
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
    // Never echo the provider's body here: it can contain the rejected key.
    throw new ProviderError('not_configured', 'The AI provider rejected the configured credentials.');
  }
  if (response.status === 503 || response.status === 500 || response.status === 502 || response.status === 504) {
    // Still overloaded after the retries above. This is Google's capacity, not the
    // document or the key, so say so and point at the fix (wait, or a lighter model).
    throw new ProviderError('provider_error', 'The AI model is overloaded right now (HTTP 503 from Google). This is temporary — try again in a few seconds. If it keeps happening, switch AI_MODEL to a stable version like gemini-2.0-flash.');
  }
  if (!response.ok) {
    throw new ProviderError('provider_error', `The AI provider returned an error (HTTP ${response.status}).`);
  }

  let payload;
  try {
    payload = await response.json();
  } catch {
    throw new ProviderError('provider_error', 'The AI provider returned a response that was not JSON.');
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

/** Pull the concatenated text parts out of a generateContent response. */
function extractText(payload) {
  const candidates = Array.isArray(payload?.candidates) ? payload.candidates : [];
  const parts = candidates[0]?.content?.parts;
  if (!Array.isArray(parts)) return '';
  return parts.map((part) => (typeof part?.text === 'string' ? part.text : '')).join('');
}
