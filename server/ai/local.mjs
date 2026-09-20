/**
 * The local-model adapter: a model running on this machine, over the OpenAI chat format.
 *
 * Written for Ollama (`ollama run gpt-oss:20b`), which serves an OpenAI-compatible API on
 * port 11434. Because it speaks that format rather than Ollama's native one, the same file
 * also drives LM Studio, llama.cpp's server and vLLM — point AI_LOCAL_URL at them and
 * nothing else changes. That is why the provider is called "local" and not "ollama".
 *
 * Why this exists next to gemini.mjs rather than replacing it: the two are interchangeable
 * to everything above them. `provider.mjs` chunks, prompts, validates and repairs without
 * knowing which one answered, so choosing a local model changes where the text comes from
 * and nothing about how honest the questions have to be. A hallucinated question from a
 * 20B model on a laptop is rejected by exactly the same grounding checks that reject one
 * from Gemini.
 *
 *   On secrets
 *
 * There are none. A local model needs no API key, which removes the entire class of
 * problem the Gemini path has to defend against — nothing to leak to the browser, nothing
 * to mispaste into the wrong .env line, nothing to keep out of the log. The one thing that
 * still needs care is the configured URL: it is echoed in a couple of error messages
 * because "could not reach it" is useless without saying where, so `safeOrigin` strips any
 * embedded credentials before that happens.
 *
 * Dependency-free, like the rest of the server: Node's global fetch and nothing else.
 */

/** Ollama's default. 127.0.0.1 rather than localhost on purpose — see resolveBase. */
const DEFAULT_BASE_URL = 'http://127.0.0.1:11434/v1';
const DEFAULT_MODEL = 'gpt-oss:20b';

/**
 * Three minutes, against Gemini's thirty seconds.
 *
 * A 20B model on a laptop is not slow in the same way a cloud API is slow. The first
 * request after a cold start has to read roughly 13 GB of weights off disk into memory
 * before it emits a single token, which on an ordinary Mac is comfortably past thirty
 * seconds; every request after that is fast. A tight timeout here would mean the feature
 * appears broken exactly once, on first use, which is the worst possible moment.
 */
const DEFAULT_TIMEOUT_MS = 180_000;

/** Local generation is not metered, so the ceiling only needs to fit the answer. */
const MAX_OUTPUT_TOKENS = 8_192;

export const providerName = 'local';

/**
 * The model called when AI_MODEL is blank. Exported so the startup banner can name it:
 * "default model" is useless to someone checking whether the thing they pulled is the
 * thing that will be asked, and a wrong name here surfaces as a 404 at generation time.
 */
export const defaultModel = DEFAULT_MODEL;

/**
 * Both error shapes this file throws.
 *
 * Imported from the Gemini adapter rather than redefined so that `normalizeProviderError`
 * in provider.mjs — which does an `instanceof` check — keeps working for both providers.
 * Two structurally identical classes would fail that check and every local failure would
 * be flattened to a generic "could not complete the request".
 */
import { ProviderError } from './gemini.mjs';
export { ProviderError };

/**
 * Where to send the request, normalised.
 *
 * Two spellings are accepted, because both are what people actually have in front of them:
 * the base ("http://127.0.0.1:11434/v1", which is what Ollama's own docs print) and the
 * bare origin ("http://127.0.0.1:11434", which is what the browser shows you). A trailing
 * slash is tolerated. If /v1 is missing it is added, so either copy-paste works.
 *
 * The default deliberately says 127.0.0.1 and not localhost. On macOS, "localhost" resolves
 * to both ::1 and 127.0.0.1, and Node 18+ will try the IPv6 address first; Ollama binds
 * IPv4 only by default, so the request is refused before it is ever attempted. That failure
 * looks exactly like "Ollama is not running" and costs an hour to diagnose.
 */
function resolveBase(env) {
  const raw = String(env.AI_LOCAL_URL ?? '').trim();
  const base = raw === '' ? DEFAULT_BASE_URL : raw;
  const trimmed = base.replace(/\/+$/, '');
  return /\/v\d+$/.test(trimmed) ? trimmed : `${trimmed}/v1`;
}

/**
 * Protocol, host and port only.
 *
 * AI_LOCAL_URL is the one piece of local configuration that reaches a browser, inside the
 * "could not reach it" message. A plain localhost address is not a secret and naming it is
 * the single most useful debugging fact there is — but the URL syntax permits
 * http://user:password@host, and a proxied setup could legitimately have one. Rebuilding
 * the origin from parsed parts drops userinfo, path, query and fragment by construction,
 * rather than by a regex that has to be right.
 */
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

/**
 * Can a request be attempted at all?
 *
 * For Gemini this asks "is there a key". There is no key here, so the only way to be
 * unconfigured is to have been pointed somewhere that is not an address. Whether the model
 * is actually up is a different question with a different answer: that is a network_error
 * at call time, and conflating the two would tell someone to "add the server AI provider
 * key" when what they need to do is start Ollama.
 */
export function isConfigured(env = process.env) {
  try {
    const parsed = new URL(resolveBase(env));
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Ask the local model for one batch of raw JSON text.
 *
 * Returns the model's text output as a string. Parsing, grounding and validation belong to
 * validation.mjs and are provider-independent, so nothing here inspects the content.
 */
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

  // First attempt asks for guaranteed JSON. Ollama supports response_format and it is worth
  // having: gpt-oss is a reasoning model and will otherwise sometimes narrate before the
  // object. parseProviderJson can recover from that, but not having to is better.
  //
  // `format: 'text'` turns that off, and the caller asking for prose must turn it off —
  // json_object does not merely permit JSON, it obliges the model to emit an object, so a
  // request for four paragraphs would come back as {"answer": "..."} or worse, as a single
  // opening brace the model never closes.
  const wantsJson = format !== 'text';
  let response = await send(doFetch, url, body(model, prompt, wantsJson), limit);

  // A server that does not know the parameter rejects the whole request with a 400. Rather
  // than making that a configuration flag the operator has to discover, drop the parameter
  // and try once more — the prompt already ends with "Return a single JSON object and
  // nothing else", so plain mode is a working fallback, not a degraded one.
  if (response.status === 400 && wantsJson) {
    response = await send(doFetch, url, body(model, prompt, false), limit);
  }

  if (response.status === 404) {
    // Ollama answers 404 when the model has never been pulled. The configured name is
    // deliberately NOT quoted back: AI_MODEL is one line away from GEMINI_API_KEY in
    // .env.example, and a key mispasted there would otherwise be echoed to the browser.
    // The literal in this hint comes from this file, not from configuration.
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
    // Specific to reasoning models, and worth its own message. gpt-oss splits its output
    // into a reasoning channel and an answer channel; when the token budget is spent before
    // it stops thinking, content arrives empty while reasoning is full. "Empty response" is
    // true but sends you looking in the wrong place.
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
    // Matches the Gemini path: enough variation that a repair attempt differs from the
    // attempt that just failed, not so much that the model drifts off the passage.
    temperature: 0.4,
    top_p: 0.9,
    max_tokens: MAX_OUTPUT_TOKENS,
    // The pipeline consumes a whole response at once and has no use for tokens as they
    // arrive; streaming would only add a parser that can fail.
    stream: false,
  };
  if (jsonMode) payload.response_format = { type: 'json_object' };
  return payload;
}

/** One request, with the timeout attached and transport failures classified. */
async function send(doFetch, url, payload, timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await doFetch(url, {
      method: 'POST',
      // No Authorization header. There is no key, and sending an empty bearer token would
      // make some servers reject the request outright.
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
