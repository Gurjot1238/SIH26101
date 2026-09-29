const DEFAULT_BASE_URL = 'http://127.0.0.1:11434/v1';
const DEFAULT_MODEL = 'gpt-oss:20b';

const DEFAULT_TIMEOUT_MS = 180_000;

const MAX_OUTPUT_TOKENS = 8_192;

export const providerName = 'local';

// The default local text models (Ollama gpt-oss, llama, etc.) are text-only.
// Vision routing must fall back to a multimodal provider rather than pretend.
export const supportsVision = false;

export const defaultModel = DEFAULT_MODEL;

import { ProviderError } from './gemini.mjs';
export { ProviderError };

function resolveBase(env) {
  const raw = String(env.AI_LOCAL_URL ?? '').trim();
  const base = raw === '' ? DEFAULT_BASE_URL : raw;
  const trimmed = base.replace(/\/+$/, '');
  return /\/v\d+$/.test(trimmed) ? trimmed : `${trimmed}/v1`;
}

export function safeOrigin(url) {
  try {
    const parsed = new URL(String(url));
    return `${parsed.protocol}//${parsed.host}`;
  } catch {
    return 'the configured address';
  }
}

function modelFor(env) {
  const model = String(env.AI_MODEL ?? '').trim();
  return model === '' ? DEFAULT_MODEL : model;
}

export function isConfigured(env = process.env) {
  try {
    const parsed = new URL(resolveBase(env));
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

export async function generateRaw(prompt, { env = process.env, timeoutMs, fetchImpl, format = 'json' } = {}) {
  const doFetch = fetchImpl ?? globalThis.fetch;
  if (typeof doFetch !== 'function') {
    throw new ProviderError('provider_error', 'No fetch implementation is available on this runtime.');
  }

  const base = resolveBase(env);
  const url = `${base}/chat/completions`;
  const model = modelFor(env);
  const budget = Number.parseInt(env.AI_LOCAL_TIMEOUT_MS ?? '', 10);
  const limit = Number.isInteger(budget) && budget > 0 ? budget : (timeoutMs ?? DEFAULT_TIMEOUT_MS);

  const wantsJson = format !== 'text';
  let response = await send(doFetch, url, body(model, prompt, wantsJson), limit);

  if (response.status === 400 && wantsJson) {
    response = await send(doFetch, url, body(model, prompt, false), limit);
  }

  if (response.status === 404) {
    throw new ProviderError(
      'provider_error',
      'The local AI model was not found. Pull it first, for example: ollama pull gpt-oss:20b',
    );
  }
  if (response.status === 429) {
    throw new ProviderError('rate_limited', 'The local AI model is busy with another request. Try again shortly.');
  }
  if (response.status === 401 || response.status === 403) {
    throw new ProviderError('not_configured', 'The local AI server rejected the request.');
  }
  if (!response.ok) {
    throw new ProviderError('provider_error', `The local AI model returned an error (HTTP ${response.status}).`);
  }

  let payload;
  try {
    payload = await response.json();
  } catch {
    throw new ProviderError('provider_error', 'The local AI model returned a response that was not JSON.');
  }

  const message = payload?.choices?.[0]?.message ?? {};
  const text = typeof message.content === 'string' ? message.content : '';

  if (text.trim() === '') {
    const reasoning = message.reasoning ?? message.reasoning_content;
    if (typeof reasoning === 'string' && reasoning.trim() !== '') {
      throw new ProviderError(
        'provider_error',
        'The local AI model spent its whole output on reasoning and returned no answer. Try a shorter document.',
      );
    }
    throw new ProviderError('provider_error', 'The local AI model returned an empty response.');
  }
  return text;
}

function body(model, prompt, jsonMode) {
  const payload = {
    model,
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.4,
    top_p: 0.9,
    max_tokens: MAX_OUTPUT_TOKENS,
    stream: false,
  };
  if (jsonMode) payload.response_format = { type: 'json_object' };
  return payload;
}

async function send(doFetch, url, payload, timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await doFetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
  } catch (error) {
    if (error && error.name === 'AbortError') {
      throw new ProviderError(
        'timeout',
        'The local AI model took too long to respond. A large model loading for the first time can exceed the limit — try again once it is warm.',
      );
    }
    throw new ProviderError(
      'network_error',
      `Could not reach the local AI model at ${safeOrigin(url)}. Check that Ollama is running.`,
    );
  } finally {
    clearTimeout(timer);
  }
}
