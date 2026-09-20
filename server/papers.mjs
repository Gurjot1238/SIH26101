/**
 * Saved MCQ sets: validation and the stored shape.
 *
 * A learner can save a generated paper — its questions, options, the answer key and
 * the explanations — to their own account, and open it again later. This module is the
 * only thing that decides what a saved paper is allowed to contain.
 *
 * Same discipline as progress.mjs: the stored record is built field by field, so
 * whatever else the request body carried never reaches the disk. Unlike an attempt, a
 * paper legitimately holds the full question text and answer key — it is the learner's
 * own material, saved by choice, readable only from their own account.
 */

import { randomUUID } from 'node:crypto';

import { HttpError } from './http.mjs';

export const PAPER_LIMITS = {
  /** Per account, oldest dropped past this — keeps the whole-file store fast. */
  maxPerUser: 60,
  maxTitle: 140,
  /** A generated paper tops out at 20; this leaves headroom without being unbounded. */
  maxQuestions: 60,
  maxStem: 2000,
  maxOption: 600,
  maxExplanation: 2000,
  maxSource: 2000,
  maxTopic: 140,
};

const KINDS = ['statement', 'cloze', 'numeric', 'identify', 'scenario'];
const DIFFICULTIES = ['easy', 'medium', 'hard'];

function fieldError(field, message) {
  return new HttpError(400, 'invalid_input', message, { [field]: message });
}

/** Collapse whitespace and cap length. Anything not a string becomes ''. */
function cleanText(value, max) {
  if (typeof value !== 'string') return '';
  return value.replace(/\s+/g, ' ').trim().slice(0, max);
}

/** Same, but keeps internal newlines — used where a paragraph is expected. */
function cleanBlock(value, max) {
  if (typeof value !== 'string') return '';
  return value.replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim().slice(0, max);
}

export function newPaperId() {
  return `pap_${randomUUID().replaceAll('-', '')}`;
}

/**
 * Validate one posted paper and return the record to store, built key by key.
 *
 * Throws an HttpError (400) with a field hint on the first structural problem, matching
 * every other write on this server, so the route can stay a thin wrapper.
 */
export function validateSavedPaper(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw fieldError('body', 'Send a JSON object describing the paper to save.');
  }

  const title = cleanText(body.title, PAPER_LIMITS.maxTitle) || 'Untitled set';

  let difficulty = '';
  if (typeof body.difficulty === 'string') {
    const wanted = body.difficulty.trim().toLowerCase();
    if (DIFFICULTIES.includes(wanted)) difficulty = wanted;
  }

  if (!Array.isArray(body.questions) || body.questions.length === 0) {
    throw fieldError('questions', 'A paper needs at least one question.');
  }
  if (body.questions.length > PAPER_LIMITS.maxQuestions) {
    throw fieldError('questions', `A paper can hold at most ${PAPER_LIMITS.maxQuestions} questions.`);
  }

  const questions = body.questions.map((raw, index) => validateQuestion(raw, index));
  const topics = [...new Set(questions.map((question) => question.topic).filter((topic) => topic !== ''))];

  return {
    title,
    difficulty,
    count: questions.length,
    topics,
    questions,
  };
}

function validateQuestion(raw, index) {
  const where = `Question ${index + 1}`;
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    throw fieldError('questions', `${where} is not an object.`);
  }

  const q = cleanText(raw.q ?? raw.question, PAPER_LIMITS.maxStem);
  if (q === '') throw fieldError('questions', `${where} has no text.`);

  const rawOptions = Array.isArray(raw.a) ? raw.a : Array.isArray(raw.options) ? raw.options : null;
  if (!rawOptions || rawOptions.length !== 4) {
    throw fieldError('questions', `${where} must have exactly 4 options.`);
  }
  const options = rawOptions.map((option) => cleanText(option, PAPER_LIMITS.maxOption));
  if (options.some((option) => option === '')) {
    throw fieldError('questions', `${where} has an empty option.`);
  }

  const correctRaw = raw.correct ?? raw.correctIndex;
  if (!Number.isInteger(correctRaw) || correctRaw < 0 || correctRaw > 3) {
    throw fieldError('questions', `${where} has an answer index outside 0–3.`);
  }

  const topic = cleanText(raw.topic, PAPER_LIMITS.maxTopic);
  const kindRaw = typeof raw.kind === 'string' ? raw.kind.trim().toLowerCase() : '';
  const kind = KINDS.includes(kindRaw) ? kindRaw : 'statement';
  const explanation = cleanBlock(raw.explanation, PAPER_LIMITS.maxExplanation);
  const source = cleanBlock(raw.source, PAPER_LIMITS.maxSource);
  const sourceIndex = Number.isInteger(raw.sourceIndex) && raw.sourceIndex >= 0 ? raw.sourceIndex : 0;

  return { q, a: options, correct: correctRaw, topic, kind, explanation, source, sourceIndex };
}

/**
 * The shape sent back to the browser. It is the learner's own paper, so it carries
 * everything — the difference from the sealed assessment is deliberate and safe,
 * because a paper only ever leaves the server to the account that saved it.
 */
export function publicPaper(record) {
  return {
    id: record.id,
    title: record.title,
    difficulty: record.difficulty,
    count: record.count,
    topics: record.topics,
    createdAt: record.createdAt,
    questions: record.questions,
  };
}

/** The lighter shape for a list: no questions, just enough to show a card. */
export function paperSummary(record) {
  return {
    id: record.id,
    title: record.title,
    difficulty: record.difficulty,
    count: record.count,
    topics: record.topics,
    createdAt: record.createdAt,
  };
}
