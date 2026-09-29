import { loadConfig } from './config.mjs';
import { describeImages, visionStatus } from '../ai/provider.mjs';

// Vision extraction stage.
//
// OCR recovers *printed text* from scanned pages. It cannot read a chart, a graph,
// a flow diagram, or a map — the semantics live in the picture, not in glyphs.
// This stage sends a rasterised page image to a multimodal AI provider and asks for a
// faithful, study-oriented description of what is actually visible. That description
// becomes a normal page of text (source: 'vision') and flows into the same chunk →
// index → MCQ pipeline as native text and OCR text. Nothing here is faked: with no
// configured multimodal provider the stage reports `not_configured` and the document
// pipeline simply proceeds with whatever text it already has.

const ALLOWED_MIME = new Set(['image/png', 'image/jpeg', 'image/jpg', 'image/webp']);

export const VISION_PROMPT = [
  'You are helping build study material for India\'s official statistical system (MoSPI).',
  'The image is a single page of an uploaded study document that has little or no',
  'machine-readable text — typically a chart, graph, diagram, table, map, infographic,',
  'or figure. Transcribe and describe ONLY what is visibly present on the page so it can',
  'later be turned into study questions.',
  '',
  'Include, when present: the title or caption; every axis label, legend entry, and unit;',
  'the concrete data points, values, percentages, and categories shown; table rows and',
  'columns with their values; and any other printed text. If the page depicts a process,',
  'hierarchy, or relationship, state exactly what it shows and how the parts connect.',
  '',
  'Rules: describe only what is actually visible. Do not infer or invent figures, trends,',
  'or conclusions that are not shown. If the page is blank, decorative, or unreadable, say',
  'so plainly in one short sentence. Write clear plain prose and simple lists of the values.',
  'Do not add a preamble, and do not wrap the answer in markdown code fences.',
].join(' ');

function approxDecodedBytes(base64) {
  const clean = String(base64 ?? '').trim();
  if (clean === '') return 0;
  const padding = clean.endsWith('==') ? 2 : clean.endsWith('=') ? 1 : 0;
  return Math.max(0, Math.floor((clean.length * 3) / 4) - padding);
}

function normalizeMime(mimeType) {
  const value = typeof mimeType === 'string' ? mimeType.trim().toLowerCase() : '';
  return ALLOWED_MIME.has(value) ? value : 'image/png';
}

// Is the vision stage usable right now? (config toggle + a configured multimodal provider)
export function visionAvailable({ cfg = loadConfig(), env = process.env } = {}) {
  if (!cfg.vision.enabled) {
    return { available: false, enabled: false, code: 'vision_disabled', provider: null };
  }
  const status = visionStatus(env);
  return {
    available: status.ok,
    enabled: true,
    code: status.ok ? 'ok' : status.code,
    provider: status.provider,
  };
}

// Describe one page image. Returns { ok:true, text, provider } or { ok:false, code, message }.
// Error messages are fixed, safe strings — they never carry provider internals or secrets.
export async function describePageImage({
  imageBase64,
  mimeType = 'image/png',
  pageNumber = null,
  cfg = loadConfig(),
  env = process.env,
  fetchImpl,
} = {}) {
  if (!cfg.vision.enabled) {
    return { ok: false, code: 'vision_disabled', message: 'Image understanding is turned off on this server.' };
  }

  const data = typeof imageBase64 === 'string' ? imageBase64.trim() : '';
  if (data === '') {
    return { ok: false, code: 'image_required', message: 'A page image is required to describe.' };
  }

  const decodedBytes = approxDecodedBytes(data);
  if (decodedBytes > cfg.vision.maxImageBytes) {
    return { ok: false, code: 'image_too_large', message: 'This page image is too large to analyse.' };
  }

  const result = await describeImages(
    VISION_PROMPT,
    [{ mimeType: normalizeMime(mimeType), data }],
    { env, timeoutMs: cfg.vision.timeoutMs, fetchImpl },
  );

  if (!result.ok) {
    return { ok: false, code: result.code, message: safeMessage(result.code) };
  }

  const text = String(result.text ?? '').trim();
  if (text === '') {
    return { ok: false, code: 'vision_empty', message: 'The AI could not read anything from this page image.' };
  }

  return {
    ok: true,
    text,
    provider: result.provider,
    pageNumber: Number.isInteger(pageNumber) && pageNumber > 0 ? pageNumber : null,
  };
}

function safeMessage(code) {
  switch (code) {
    case 'not_configured':
      return 'AI image understanding is not configured on this server.';
    case 'vision_unsupported':
      return 'The configured AI provider cannot read images. Use a multimodal provider.';
    case 'rate_limited':
      return 'The AI provider is busy right now. Try again shortly.';
    case 'timeout':
      return 'Reading this page image took too long. Try again.';
    case 'image_required':
      return 'A page image is required to describe.';
    default:
      return 'This page image could not be analysed right now.';
  }
}
