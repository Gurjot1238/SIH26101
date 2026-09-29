import { ProviderError } from './gemini.mjs';
import * as gemini from './gemini.mjs';
import * as local from './local.mjs';
import * as mock from './mock.mjs';
import {
  buildDocumentIndex,
  matchKey,
  parseProviderJson,
  selectQuestions,
  validateBatch,
} from './validation.mjs';
import { buildGenerationPrompt, buildRepairPrompt } from './prompt.mjs';
import { generateBackfill } from './backfill.mjs';

export const MIN_TEXT_CHARS = 120;
export const MAX_TEXT_CHARS = 60_000;
export const MIN_QUESTIONS = 5;
export const TARGET_QUESTIONS = 12;
export const MAX_QUESTIONS = 20;

const CHUNK_CHARS = 6_000;
const MAX_CHUNKS = 6;
const MAX_PROVIDER_CALLS = 8;

function selectProvider(env = process.env) {
  const name = (env.AI_PROVIDER ?? 'gemini').trim().toLowerCase();
  if (name === 'mock') return mock;
  if (name === 'local') return local;
  if (name === 'gemini' || name === '') return gemini;
  return null;
}

export function providerStatus(env = process.env) {
  const provider = selectProvider(env);
  if (!provider) {
    return { ok: false, code: 'not_configured', provider: 'unrecognised' };
  }
  return { ok: provider.isConfigured(env), code: provider.isConfigured(env) ? 'ok' : 'not_configured', provider: provider.providerName };
}

export function describeTarget(env = process.env) {
  const provider = selectProvider(env);
  if (provider !== local) return '';
  return local.safeOrigin(localBaseUrl(env));
}

function localBaseUrl(env) {
  const raw = String(env.AI_LOCAL_URL ?? '').trim();
  return raw === '' ? 'http://127.0.0.1:11434' : raw;
}

export function describeModel(env = process.env) {
  const model = (env.AI_MODEL ?? '').trim();
  if (model === '') {
    const provider = selectProvider(env);
    return provider?.defaultModel ? `${provider.defaultModel}, the default` : 'default model';
  }
  const printable = /^[a-z][a-z0-9./:_-]{0,48}$/i.test(model);
  const known = /^(gemini|models\/gemini|text-|embedding-|gpt-oss|gpt-|llama|codellama|tinyllama|qwen|mistral|mixtral|gemma|phi|deepseek|granite|smollm)/i.test(model);
  return printable && known ? model : 'custom model (set, not shown)';
}

export function chunkText(text, chunkChars = CHUNK_CHARS, maxChunks = MAX_CHUNKS) {
  const clean = String(text ?? '').trim();
  if (clean.length <= chunkChars) return clean === '' ? [] : [clean];

  const pieces = clean.split(/(?<=[.!?])\s+/);
  const chunks = [];
  let current = '';
  for (let i = 0; i < pieces.length; i += 1) {
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

function perChunkTarget(totalTarget, chunkCount) {
  return Math.max(3, Math.ceil((totalTarget + 2) / chunkCount) + 1);
}

function scoringTerms(value) {
  return (String(value ?? '').toLowerCase().match(/[a-z0-9]{4,}/g)) ?? [];
}

export function selectRelevantChunks(text, { topics = [], concepts = [], maxChunks = MAX_CHUNKS } = {}) {
  const all = chunkText(text, CHUNK_CHARS, Number.MAX_SAFE_INTEGER);
  if (all.length <= maxChunks) return all;

  const wanted = new Set([...topics, ...concepts].flatMap((t) => scoringTerms(t)));
  if (wanted.size === 0) return all.slice(0, maxChunks);

  const scored = all.map((chunk, order) => {
    const terms = scoringTerms(chunk);
    let hits = 0;
    const seen = new Set();
    for (const term of terms) {
      if (wanted.has(term)) {
        hits += 1;
        seen.add(term);
      }
    }
    return { chunk, order, score: hits + seen.size };
  });

  const topByScore = [...scored]
    .sort((a, b) => b.score - a.score || a.order - b.order)
    .slice(0, maxChunks);
  return topByScore.sort((a, b) => a.order - b.order).map((entry) => entry.chunk);
}

export async function generateMcqs(input, { env = process.env } = {}) {
  const provider = selectProvider(env);
  if (!provider) {
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
  const chunks = selectRelevantChunks(text, { topics, concepts });
  if (chunks.length === 0) {
    return { ok: false, code: 'insufficient_questions', message: 'The document had no usable text to generate questions from.', meta: emptyMeta(provider.providerName) };
  }

  const accepted = [];
  const meta = { provider: provider.providerName, asked: 0, accepted: 0, rejected: 0, calls: 0, chunks: chunks.length, selected: 0 };
  const debug = {
    requestedCount: target,
    rawResponseChars: 0,
    parsedQuestionCount: 0,
    validQuestionCount: 0,
    duplicateQuestionCount: 0,
    rejectedQuestionCount: 0,
    backfillQuestionCount: 0,
    finalQuestionCount: 0,
  };
  let lastProviderError = null;
  const perChunk = perChunkTarget(target, chunks.length);

  const absorb = (outcome) => {
    meta.asked += outcome.asked;
    meta.rejected += outcome.rejected.length;
    debug.rawResponseChars += outcome.rawChars;
    debug.parsedQuestionCount += outcome.parsed;
    debug.validQuestionCount += outcome.accepted.length;
    debug.duplicateQuestionCount += outcome.duplicates;
    debug.rejectedQuestionCount += outcome.qualityRejects;
    for (const question of outcome.accepted) accepted.push(question);
  };

  for (let index = 0; index < chunks.length; index += 1) {
    if (accepted.length >= target || meta.calls >= MAX_PROVIDER_CALLS) break;

    const prompt = buildGenerationPrompt({ chunk: chunks[index], topics, concepts, count: perChunk, difficulty });
    let raw;
    try {
      meta.calls += 1;
      raw = await provider.generateRaw(prompt, { env, attempt: 1 });
    } catch (error) {
      lastProviderError = normalizeProviderError(error);
      continue;
    }

    const outcome = ingest(raw, documentIndex, { existing: accepted, allowedTopics: topics, requestedDifficulty: difficulty });
    absorb(outcome);

    const stillWanted = target - accepted.length;
    if (stillWanted > 0 && outcome.rejected.length > 0 && meta.calls < MAX_PROVIDER_CALLS) {
      const repairPrompt = buildRepairPrompt({ chunk: chunks[index], topics, count: Math.max(2, stillWanted), reasons: outcome.rejected.map((r) => r.reason), difficulty });
      try {
        meta.calls += 1;
        const repaired = await provider.generateRaw(repairPrompt, { env, attempt: 2 });
        absorb(ingest(repaired, documentIndex, { existing: accepted, allowedTopics: topics, requestedDifficulty: difficulty }));
      } catch (error) {
        lastProviderError = normalizeProviderError(error);
      }
    }
  }

  meta.accepted = accepted.length;

  if (accepted.length < MIN_QUESTIONS) {
    debug.finalQuestionCount = accepted.length;
    if (accepted.length === 0 && lastProviderError) {
      return { ok: false, code: lastProviderError.code, message: lastProviderError.message, meta, debug };
    }
    meta.selected = accepted.length;
    return {
      ok: false,
      code: 'insufficient_questions',
      message: `Only ${accepted.length} well-grounded question${accepted.length === 1 ? '' : 's'} could be generated from this material. A high-quality short set is preferred over invented questions — try a longer or more detailed document.`,
      questions: selectQuestions(accepted, target),
      meta,
      debug,
    };
  }

  if (accepted.length < target) {
    const backfill = generateBackfill(text, documentIndex, {
      need: target - accepted.length,
      existing: accepted,
      allowedTopics: topics,
      preferTopics: underrepresentedTopics(accepted, topics),
      requestedDifficulty: difficulty,
    });
    for (const question of backfill.accepted) accepted.push(question);
    debug.backfillQuestionCount = backfill.accepted.length;
    meta.accepted = accepted.length;
  }

  const selected = selectQuestions(accepted, target);
  meta.selected = selected.length;
  debug.finalQuestionCount = selected.length;

  if (selected.length < target) {
    return {
      ok: false,
      code: 'insufficient_questions',
      message: `You asked for ${target} questions, but this material only yielded ${selected.length} that could be grounded in it. Try a longer or more detailed document, or request fewer questions.`,
      questions: selected,
      meta,
      debug,
    };
  }

  return { ok: true, questions: selected, meta, debug };
}

function underrepresentedTopics(accepted, topics) {
  if (!Array.isArray(topics) || topics.length === 0) return [];
  const counts = new Map(topics.map((topic) => [topic, 0]));
  for (const question of accepted) {
    const key = matchKey(question.topic ?? '');
    for (const topic of topics) {
      if (matchKey(topic) === key) { counts.set(topic, counts.get(topic) + 1); break; }
    }
  }
  return [...counts.entries()]
    .sort((a, b) => a[1] - b[1])
    .filter(([, count], _i, all) => count <= all[0][1] + 1)
    .map(([topic]) => topic);
}

function ingest(raw, documentIndex, options) {
  const rawChars = typeof raw === 'string' ? raw.length : 0;
  const parsedResult = parseProviderJson(raw);
  if (!parsedResult.ok) {
    return {
      asked: 0,
      rawChars,
      parsed: 0,
      accepted: [],
      rejected: [{ reason: parsedResult.reason, question: '' }],
      duplicates: 0,
      qualityRejects: 1,
    };
  }
  const asked = parsedResult.questions.length;
  const { accepted, rejected } = validateBatch(parsedResult.questions, documentIndex, options);
  const duplicates = rejected.filter((r) => isDuplicateReason(r.reason)).length;
  return {
    asked,
    rawChars,
    parsed: asked,
    accepted,
    rejected,
    duplicates,
    qualityRejects: rejected.length - duplicates,
  };
}

function isDuplicateReason(reason) {
  return reason === 'duplicate of another question in this paper'
    || reason === 'asks the same fact as another question in this paper';
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

// ---- Vision (multimodal image understanding) -------------------------------
// Reuses the same provider selection so there is one AI abstraction, not two.
// Only providers that declare supportsVision === true receive image bytes;
// everything else fails honestly rather than pretending to read the page.

export function visionStatus(env = process.env) {
  const provider = selectProvider(env);
  if (!provider) {
    return { ok: false, code: 'not_configured', provider: 'unrecognised', supportsVision: false };
  }
  const configured = provider.isConfigured(env);
  const supportsVision = provider.supportsVision === true;
  let code = 'ok';
  if (!configured) code = 'not_configured';
  else if (!supportsVision) code = 'vision_unsupported';
  return { ok: configured && supportsVision, code, provider: provider.providerName, supportsVision };
}

export async function describeImages(prompt, images, { env = process.env, timeoutMs, fetchImpl } = {}) {
  const provider = selectProvider(env);
  if (!provider) {
    return { ok: false, code: 'not_configured', message: 'The server is set to an AI provider it does not recognise. Check AI_PROVIDER in server/.env.', provider: 'unknown' };
  }
  if (!provider.isConfigured(env)) {
    return { ok: false, code: 'not_configured', message: 'AI image understanding is not configured. Add the server AI provider key and try again.', provider: provider.providerName };
  }
  if (provider.supportsVision !== true) {
    return { ok: false, code: 'vision_unsupported', message: `The configured AI provider (${provider.providerName}) cannot read images. Set AI_PROVIDER to a multimodal provider such as gemini.`, provider: provider.providerName };
  }

  const safeImages = Array.isArray(images)
    ? images.filter((image) => image && typeof image.data === 'string' && image.data.trim() !== '')
    : [];
  if (safeImages.length === 0) {
    return { ok: false, code: 'image_required', message: 'No page image was supplied to describe.', provider: provider.providerName };
  }

  try {
    const raw = await provider.generateRaw(prompt, { env, timeoutMs, fetchImpl, images: safeImages, format: 'text' });
    return { ok: true, text: String(raw ?? ''), provider: provider.providerName };
  } catch (error) {
    const problem = normalizeProviderError(error);
    return { ok: false, code: problem.code, message: problem.message, provider: provider.providerName };
  }
}
