/**
 * The provider-agnostic middle: chunk, prompt, generate, validate, repair, select.
 *
 * The route calls exactly one function here — `generateMcqs` — and gets back either a
 * set of validated questions or a typed failure. It never sees Gemini, never sees a
 * prompt, never sees a raw model response. That separation is the whole point: the
 * route is about HTTP and auth, this file is about turning a document into a paper, and
 * `gemini.mjs` is about one vendor's JSON. Each can be tested or replaced without the
 * others.
 *
 * Provider selection is by `AI_PROVIDER`, defaulting to gemini. A provider is a module
 * exposing `{ providerName, isConfigured(env), generateRaw(prompt, opts) }`, so adding
 * one is adding a file and a case here. `gemini` calls Google, `local` calls a model
 * running on this machine (Ollama and anything else that speaks the OpenAI chat format),
 * and `mock` serves the test suite.
 */

import { ProviderError } from './gemini.mjs';
import * as gemini from './gemini.mjs';
import * as local from './local.mjs';
import * as mock from './mock.mjs';
import {
  buildDocumentIndex,
  parseProviderJson,
  selectQuestions,
  validateBatch,
} from './validation.mjs';
import { buildGenerationPrompt, buildRepairPrompt } from './prompt.mjs';

/** Bounds the route also advertises. A document past the ceiling is chunked, not refused. */
export const MIN_TEXT_CHARS = 120;
export const MAX_TEXT_CHARS = 60_000;
// The smallest set we will show as a real quiz. Lowered from 10 to 5: with the prompt
// pushed toward hard reasoning questions (which the grounding check rejects more often)
// and shorter documents, a genuine set of 5-9 was being blocked and shown as a failure.
// A short set of real questions is still a real quiz; the point of this floor is only to
// refuse a quiz so tiny it is not worth taking, never to pad with invented questions.
export const MIN_QUESTIONS = 5;
export const TARGET_QUESTIONS = 12;
export const MAX_QUESTIONS = 20;

/** One chunk is about this many characters of document. */
const CHUNK_CHARS = 6_000;
/** Never fan out to more than this many provider calls for one document. */
const MAX_CHUNKS = 6;
/** Total provider calls across generation and repair, so a bad document cannot loop. */
const MAX_PROVIDER_CALLS = 8;

function selectProvider(env = process.env) {
  const name = (env.AI_PROVIDER ?? 'gemini').trim().toLowerCase();
  if (name === 'mock') return mock;
  if (name === 'local') return local;
  if (name === 'gemini' || name === '') return gemini;
  return null;
}

/**
 * Is a real request even possible right now? The route asks first, so it can answer
 * "not configured" honestly instead of failing mid-generation.
 */
export function providerStatus(env = process.env) {
  const provider = selectProvider(env);
  if (!provider) {
    // Never reflect the configured value, not even into the startup banner: if a
    // key were pasted onto the AI_PROVIDER line it would be written to
    // server/auth-server.log in plain text. "unrecognised" is enough for the
    // operator, who can read their own .env.
    return { ok: false, code: 'not_configured', provider: 'unrecognised' };
  }
  return { ok: provider.isConfigured(env), code: provider.isConfigured(env) ? 'ok' : 'not_configured', provider: provider.providerName };
}

/**
 * Where the provider will be called, when that is a thing worth saying.
 *
 * Empty for gemini and mock: one has a fixed public endpoint and the other has none, so
 * naming it would be noise. For a local model it is the single most useful line in the
 * banner, because the commonest failure by far is "Ollama is listening somewhere other
 * than where the server is looking", and that is invisible until you print both.
 *
 * Runs through `safeOrigin`, so a URL carrying credentials is reduced to protocol, host
 * and port before it can reach the terminal or server/auth-server.log.
 */
export function describeTarget(env = process.env) {
  const provider = selectProvider(env);
  if (provider !== local) return '';
  return local.safeOrigin(localBaseUrl(env));
}

function localBaseUrl(env) {
  const raw = String(env.AI_LOCAL_URL ?? '').trim();
  return raw === '' ? 'http://127.0.0.1:11434' : raw;
}

/**
 * A model name safe to print in the startup banner.
 *
 * AI_MODEL sits three lines below GEMINI_API_KEY in .env.example, so the value
 * reaching this function is not always a model name — a mispaste puts a key here.
 * Real model names are short and start with a known family, so anything else is
 * reported as set-but-not-shown rather than echoed into server/auth-server.log.
 *
 * The `/` in the character class is what makes the fully-qualified spelling
 * ("models/gemini-1.5-flash") printable; gemini.mjs strips that prefix before building the
 * request URL, so it is a working configuration and the banner should say so. The `:` is
 * what makes Ollama's tag spelling ("gpt-oss:20b") printable. Neither widens anything that
 * matters.
 *
 * The family list grew when the local provider arrived, because a banner that redacts the
 * very model you just configured is worse than no banner. It is an explicit allow-list
 * rather than a loosened pattern for one reason: every API key prefix in circulation
 * (AIzaSy, sk-, sk-ant-, sk-proj-, hf_, gsk_) still fails to match it.
 */
export function describeModel(env = process.env) {
  const model = (env.AI_MODEL ?? '').trim();
  if (model === '') {
    // Name the model that will actually be called rather than the word "default". The
    // operator reads this line to confirm the model they pulled is the model about to be
    // asked for, and "default model" cannot answer that question. Falls back to the old
    // wording for a provider that has no notion of a default, which is mock.
    const provider = selectProvider(env);
    return provider?.defaultModel ? `${provider.defaultModel}, the default` : 'default model';
  }
  const printable = /^[a-z][a-z0-9./:_-]{0,48}$/i.test(model);
  const known = /^(gemini|models\/gemini|text-|embedding-|gpt-oss|gpt-|llama|codellama|tinyllama|qwen|mistral|mixtral|gemma|phi|deepseek|granite|smollm)/i.test(model);
  return printable && known ? model : 'custom model (set, not shown)';
}

/**
 * Split on sentence boundaries near the target size, never mid-sentence.
 *
 * A question is grounded in a source sentence, so a chunk that ends halfway through one
 * would ask the model to cite a fragment it cannot complete. Paragraphs first, then
 * sentences when a paragraph alone is over the target.
 */
export function chunkText(text, chunkChars = CHUNK_CHARS, maxChunks = MAX_CHUNKS) {
  const clean = String(text ?? '').trim();
  if (clean.length <= chunkChars) return clean === '' ? [] : [clean];

  const pieces = clean.split(/(?<=[.!?])\s+/);
  const chunks = [];
  let current = '';
  for (let i = 0; i < pieces.length; i += 1) {
    // Once only one chunk slot is left, the rest of the document goes into it whole rather
    // than being dropped. Joining the remaining pieces by index — never by slicing the
    // original string — is what keeps boundaries on sentence ends: the earlier version
    // recovered the tail with clean.slice(chunks.join(' ').length), and that offset drifts
    // by one character for every inter-sentence separator longer than a single space (a
    // paragraph break, which real PDF text is full of), landing the cut mid-sentence.
    if (chunks.length === maxChunks - 1) {
      const rest = pieces.slice(i).join(' ');
      current = current === '' ? rest : `${current} ${rest}`;
      break;
    }
    const piece = pieces[i];
    if (current === '') {
      current = piece;
    } else if (current.length + 1 + piece.length <= chunkChars) {
      current += ' ' + piece;
    } else {
      chunks.push(current);
      current = piece;
    }
  }
  if (current !== '') chunks.push(current);
  return chunks.slice(0, maxChunks).filter((chunk) => chunk.trim() !== '');
}

/** Roughly how many questions to ask of one chunk, so the batch clears the target. */
function perChunkTarget(totalTarget, chunkCount) {
  return Math.max(3, Math.ceil((totalTarget + 2) / chunkCount) + 1);
}

/**
 * Turn a document into a validated paper.
 *
 * Result shapes:
 *   { ok: true, questions, meta }
 *   { ok: false, code, message, meta }
 *
 * `code` is one of not_configured | provider_error | timeout | rate_limited |
 * network_error | insufficient_questions, so the route can pick the HTTP status and an
 * honest message. `meta` carries counts (asked, accepted, rejected, provider) for the
 * server log and for the response, never document text.
 */
export async function generateMcqs(input, { env = process.env } = {}) {
  const provider = selectProvider(env);
  if (!provider) {
    // Deliberately does not quote the configured value back. AI_PROVIDER and
    // GEMINI_API_KEY sit three lines apart in .env.example, so a key pasted onto
    // the wrong line would otherwise be echoed to every signed-in browser as part
    // of this message. The operator can read their own .env; the browser cannot.
    return { ok: false, code: 'not_configured', message: 'The server is set to an AI provider it does not recognise. Check AI_PROVIDER in server/.env.', meta: emptyMeta('unknown') };
  }
  if (!provider.isConfigured(env)) {
    return { ok: false, code: 'not_configured', message: 'AI question generation is not configured. Add the server AI provider key and try again.', meta: emptyMeta(provider.providerName) };
  }

  const text = String(input.text ?? '');
  const topics = Array.isArray(input.topics) ? input.topics.filter((t) => typeof t === 'string') : [];
  const concepts = Array.isArray(input.concepts) ? input.concepts.filter((c) => typeof c === 'string') : [];
  const target = clampTarget(input.questionCount);
  const difficulty = input.difficulty === 'easy' || input.difficulty === 'medium' || input.difficulty === 'hard'
    ? input.difficulty
    : undefined;

  const documentIndex = buildDocumentIndex(text);
  const chunks = chunkText(text);
  if (chunks.length === 0) {
    return { ok: false, code: 'insufficient_questions', message: 'The document had no usable text to generate questions from.', meta: emptyMeta(provider.providerName) };
  }

  const accepted = [];
  const meta = { provider: provider.providerName, asked: 0, accepted: 0, rejected: 0, calls: 0, chunks: chunks.length };
  let lastProviderError = null;
  const perChunk = perChunkTarget(target, chunks.length);

  for (let index = 0; index < chunks.length; index += 1) {
    if (accepted.length >= target || meta.calls >= MAX_PROVIDER_CALLS) break;

    const prompt = buildGenerationPrompt({ chunk: chunks[index], topics, concepts, count: perChunk, difficulty });
    let raw;
    try {
      meta.calls += 1;
      raw = await provider.generateRaw(prompt, { env, attempt: 1 });
    } catch (error) {
      lastProviderError = normalizeProviderError(error);
      // A single chunk failing (a transient 500, one timeout) should not doom the whole
      // document if other chunks still yield enough questions, so keep going.
      continue;
    }

    const outcome = ingest(raw, documentIndex, { existing: accepted, allowedTopics: topics });
    meta.asked += outcome.asked;
    meta.rejected += outcome.rejected.length;
    for (const question of outcome.accepted) accepted.push(question);

    // One repair pass per chunk: hand the model back the exact reasons and re-ask, but
    // only when this chunk fell short and we still have call budget.
    const stillWanted = target - accepted.length;
    if (stillWanted > 0 && outcome.rejected.length > 0 && meta.calls < MAX_PROVIDER_CALLS) {
      const repairPrompt = buildRepairPrompt({ chunk: chunks[index], topics, count: Math.max(2, stillWanted), reasons: outcome.rejected.map((r) => r.reason), difficulty });
      try {
        meta.calls += 1;
        const repaired = await provider.generateRaw(repairPrompt, { env, attempt: 2 });
        const second = ingest(repaired, documentIndex, { existing: accepted, allowedTopics: topics });
        meta.asked += second.asked;
        meta.rejected += second.rejected.length;
        for (const question of second.accepted) accepted.push(question);
      } catch (error) {
        lastProviderError = normalizeProviderError(error);
      }
    }
  }

  meta.accepted = accepted.length;

  if (accepted.length === 0 && lastProviderError) {
    return { ok: false, code: lastProviderError.code, message: lastProviderError.message, meta };
  }

  const selected = selectQuestions(accepted, target);
  meta.selected = selected.length;

  if (selected.length < MIN_QUESTIONS) {
    // Honest shortfall, not padded to ten with invented questions. Callable path: a short
    // or thin document. The route turns this into a clear message with the real count.
    return {
      ok: false,
      code: 'insufficient_questions',
      message: `Only ${selected.length} well-grounded question${selected.length === 1 ? '' : 's'} could be generated from this material. A high-quality short set is preferred over invented questions — try a longer or more detailed document.`,
      questions: selected,
      meta,
    };
  }

  return { ok: true, questions: selected, meta };
}

function ingest(raw, documentIndex, options) {
  const parsed = parseProviderJson(raw);
  if (!parsed.ok) {
    return { asked: 0, accepted: [], rejected: [{ reason: parsed.reason, question: '' }] };
  }
  const asked = parsed.questions.length;
  const { accepted, rejected } = validateBatch(parsed.questions, documentIndex, options);
  return { asked, accepted, rejected };
}

function clampTarget(value) {
  const number = Number.parseInt(value, 10);
  if (!Number.isInteger(number)) return TARGET_QUESTIONS;
  return Math.max(MIN_QUESTIONS, Math.min(MAX_QUESTIONS, number));
}

function normalizeProviderError(error) {
  if (error instanceof ProviderError) return { code: error.code, message: error.message };
  return { code: 'provider_error', message: 'The AI provider could not complete the request.' };
}

/**
 * One provider call, returning prose rather than questions.
 *
 * `generateMcqs` above is the whole grounded pipeline: chunk, generate, validate
 * against the document, repair, select. Some callers do not want any of that — the
 * competency explanation is handed a JSON object the server itself computed and asks
 * the model to put it into sentences, so there is no document to ground against and
 * nothing to validate as a question.
 *
 * Returns the same `{ ok, code, message }` failure shape as `generateMcqs`, so a route
 * can map a provider problem to a status the same way whichever of the two it called.
 * Provider selection, the not-configured check and the error normalisation are shared,
 * which is the point: adding a fourth entry point must not mean a fourth copy of
 * "which provider is configured and what do we say when it is not".
 */
export async function generateText(prompt, { env = process.env, timeoutMs, fetchImpl, attempt = 1 } = {}) {
  const provider = selectProvider(env);
  if (!provider) {
    return {
      ok: false,
      code: 'not_configured',
      message: 'The server is set to an AI provider it does not recognise. Check AI_PROVIDER in server/.env.',
      provider: 'unknown',
    };
  }
  if (!provider.isConfigured(env)) {
    return {
      ok: false,
      code: 'not_configured',
      message: 'AI question generation is not configured. Add the server AI provider key and try again.',
      provider: provider.providerName,
    };
  }

  try {
    // `format: 'text'` is the whole reason this is not just a call to generateRaw. The
    // local provider asks Ollama for a guaranteed JSON object by default, which is right
    // for questions and ruinous for paragraphs. Providers that have no such mode ignore it.
    const raw = await provider.generateRaw(prompt, { env, timeoutMs, fetchImpl, attempt, format: 'text' });
    return { ok: true, text: String(raw ?? ''), provider: provider.providerName };
  } catch (error) {
    const problem = normalizeProviderError(error);
    return { ok: false, code: problem.code, message: problem.message, provider: provider.providerName };
  }
}

function emptyMeta(provider) {
  return { provider, asked: 0, accepted: 0, rejected: 0, calls: 0, chunks: 0, selected: 0 };
}
