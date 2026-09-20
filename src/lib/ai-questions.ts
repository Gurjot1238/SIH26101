/**
 * The browser half of AI question generation.
 *
 * This file sends extracted document text to `POST /api/ai/generate-mcqs` and turns
 * what comes back into the `MaterialQuestion[]` the quiz has always run on. It holds
 * no prompt, no model name, no provider logic and — most importantly — no API key.
 * The key lives in the server process and in nothing else: not in `import.meta.env`,
 * not in a build artefact, not in this module, not in sessionStorage. Anything the
 * browser can read, a user can read, so the browser is never told.
 *
 *   Why this cannot fall back to the local generator
 *
 * `materials.ts` can still assemble questions offline, and wiring that in as a
 * fallback would make every failure invisible: the page would say "AI generated" and
 * show sentence-manipulation questions, and nobody — not the learner, not the
 * reviewer, not us — could tell the difference from the outside. So a failure here
 * stays a failure and says which one it is. An honest error is worth more than a
 * quiz that lies about where it came from.
 *
 *   What it trusts
 *
 * Nothing. The server already validates structure, grounding and duplication, but
 * this is a network response, so `toQuestions` re-checks the shape it is about to
 * hand to the grader rather than assuming it. Two independent checks on the same
 * data is cheap; a malformed answer key reaching a learner is not.
 */

import { API_URL } from './auth';
import { type MaterialQuestion, type QuestionKind, sentenceList } from './materials';

/* ---------------------------------------------------------- classification */

/**
 * What kind of document the learner uploaded.
 *
 * Returned by `POST /api/ai/classify-material`. The page uses `suitable` to
 * decide whether to proceed with MCQ generation, and prints `label` and `advice`
 * so the learner knows what happened before a long generation call.
 */
export type MaterialClassification = {
  /** Machine-readable type: study_material, marksheet, report, etc. */
  type: string;
  /** Human-readable label for the page. */
  label: string;
  /** Whether MCQ generation is worth attempting on this document. */
  suitable: boolean;
  /** high | medium | low — how confident the model was. */
  confidence: string;
  /** One sentence explaining the classification. */
  reason: string;
  /** 1-5 key subjects the model identified. */
  topics: string[];
  /** 1-2 sentence summary of what the document is about. */
  summary: string;
  /** What to tell the learner when this type is detected. */
  advice: string;
};

export type ClassifyResult = {
  ok: boolean;
  classification?: MaterialClassification;
  error?: { code: string; message: string };
};

/**
 * Ask the server to classify the uploaded document.
 *
 * A fast call (a few seconds) that sends a text sample to the model and gets
 * back a type, a suitability flag, and a reason. Called before the longer MCQ
 * generation call so the page can warn the learner early.
 */
export async function classifyDocument(text: string, signal?: AbortSignal): Promise<MaterialClassification> {
  let response: Response;
  try {
    response = await fetch(`${API_URL}/api/ai/classify-material`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
      signal,
    });
  } catch (failure) {
    if (failure instanceof DOMException && failure.name === 'AbortError') throw failure;
    // Classification failure is not fatal — the page can still try generation.
    return {
      type: 'other',
      label: 'Other',
      suitable: true,
      confidence: 'low',
      reason: 'Classification was unavailable.',
      topics: [],
      summary: '',
      advice: 'Proceeding with question generation.',
    };
  }

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  const body = (payload ?? {}) as { ok?: boolean; classification?: MaterialClassification; error?: { code?: string; message?: string } };

  if (!response.ok || body.ok !== true || !body.classification) {
    // Non-fatal: fall back to a permissive classification so generation can still proceed.
    return {
      type: 'other',
      label: 'Other',
      suitable: true,
      confidence: 'low',
      reason: 'Classification was unavailable.',
      topics: [],
      summary: '',
      advice: 'Proceeding with question generation.',
    };
  }

  return body.classification;
}

/* --------------------------------------------------------------- wire types */

/** Mirrors the JSON `server/ai/provider.mjs` produces. Field names are the wire contract. */
type WireQuestion = {
  question: string;
  options: string[];
  correctIndex: number;
  topic: string;
  kind: string;
  explanation: string;
  source: string;
};

/** Counts only. There is deliberately no field here that could carry text back. */
export type AiMeta = {
  /**
   * Which provider answered: "local" for a model on this machine, "gemini" for Google's
   * API, or "mock" during tests. Shown so a mock run is obvious. A name only — never an
   * address, a model or anything read from the environment.
   */
  provider: string;
  asked: number;
  accepted: number;
  rejected: number;
  calls: number;
  chunks: number;
  selected: number;
};

export type AiGeneration = {
  questions: MaterialQuestion[];
  /** The topics the accepted questions actually cover, in the order the document ranked them. */
  topics: string[];
  meta: AiMeta | null;
};

const KINDS: readonly string[] = ['statement', 'cloze', 'numeric', 'identify', 'scenario'];

/**
 * A generation attempt that did not produce a usable paper.
 *
 * `code` is what the page branches on, `produced` is how many good questions did come
 * back when the answer is "some, but not enough" — that number is the difference
 * between "try a longer document" and "something is broken", and the learner deserves
 * to be told which.
 */
export class AiGenerationError extends Error {
  code: string;
  status: number;
  produced: number;

  constructor(message: string, { code = 'ai_error', status = 0, produced = 0 } = {}) {
    super(message);
    this.name = 'AiGenerationError';
    this.code = code;
    this.status = status;
    this.produced = produced;
  }
}

/**
 * The message for a failure code, when the server did not supply one.
 *
 * The server sends prose for every failure it knows about and this is the fallback
 * for a response that arrives without it — a proxy returning its own 502, say. The
 * not-configured wording is fixed rather than invented, because that is the one state
 * an operator has to be able to act on: it names the missing setting.
 */
const FALLBACK_MESSAGES: Record<string, string> = {
  not_configured: 'AI question generation is not configured. Add the server AI provider key and try again.',
  unauthorized: 'Your session has expired. Sign in again to generate questions.',
  rate_limited: 'The AI provider is rate limiting requests right now. Wait a moment and try again.',
  timeout: 'The AI provider did not respond in time. Try again, or use a shorter document.',
  network_error: 'The server could not reach the AI provider. Check its network access and try again.',
  provider_error: 'The AI provider returned an error. Try again in a moment.',
  body_too_large: 'That document is too large to send for question generation. Try a shorter section of it.',
};

function messageFor(code: string, supplied?: string): string {
  if (supplied && supplied.trim() !== '') return supplied;
  return FALLBACK_MESSAGES[code] ?? 'Question generation failed. Please try again.';
}

/* -------------------------------------------------------------- source index */

function tokens(value: string): string[] {
  return value.toLowerCase().match(/[a-z0-9]+/g) ?? [];
}

/**
 * Where in the document a quoted source sits.
 *
 * `sourceIndex` orders the revision passages on the results screen, so it has to be a
 * real position rather than the array index of the question — questions come back in
 * whatever order the model wrote them, and sorting revision passages by that order
 * would print the document's conclusion before its definitions.
 *
 * Exact string matching is not enough. The server returns the document's own sentence as
 * the source, but with its whitespace collapsed to single spaces, so it will not be `===`
 * to a sentence carrying the browser's original line wrapping. So the best-overlapping
 * sentence wins, and a source spanning two sentences lands on the first one it overlaps
 * most.
 */
function locateSource(source: string, sentences: string[]): number {
  const needle = new Set(tokens(source));
  if (needle.size === 0) return 0;

  let bestIndex = 0;
  let bestScore = 0;
  for (let index = 0; index < sentences.length; index += 1) {
    const candidate = tokens(sentences[index]);
    if (candidate.length === 0) continue;
    let shared = 0;
    for (const token of candidate) {
      if (needle.has(token)) shared += 1;
    }
    const score = shared / candidate.length;
    if (score > bestScore) {
      bestScore = score;
      bestIndex = index;
    }
  }
  // Below this the "match" is a handful of common words, and claiming a position would
  // be worse than admitting we do not know one. 0 keeps it at the top of the passages.
  return bestScore >= 0.4 ? bestIndex : 0;
}

/* ------------------------------------------------------------------ mapping */

function isWireQuestion(value: unknown): value is WireQuestion {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<WireQuestion>;
  if (typeof candidate.question !== 'string' || candidate.question.trim() === '') return false;
  if (!Array.isArray(candidate.options) || candidate.options.length !== 4) return false;
  if (candidate.options.some((option) => typeof option !== 'string' || option.trim() === '')) return false;
  if (typeof candidate.correctIndex !== 'number') return false;
  if (!Number.isInteger(candidate.correctIndex) || candidate.correctIndex < 0 || candidate.correctIndex > 3) return false;
  if (typeof candidate.topic !== 'string' || candidate.topic.trim() === '') return false;
  if (typeof candidate.explanation !== 'string' || candidate.explanation.trim() === '') return false;
  if (typeof candidate.source !== 'string' || candidate.source.trim() === '') return false;
  return true;
}

/**
 * Wire format to the shape the grader, the study plan and the review screen expect.
 *
 * `competency` is left off on purpose. A generated question's topic came out of the
 * document, so the only way to file it under a framework competency is
 * `classifyTopic`'s keyword match — and `scoring.ts` already runs exactly that, over
 * the topic *plus* every source sentence the topic collected, which is strictly more
 * evidence than one question can offer on its own. Setting it here would override that
 * with a weaker guess. When neither is confident the answer stays null, which is the
 * correct answer rather than a gap to fill.
 */
export function toQuestions(raw: unknown, documentText: string): MaterialQuestion[] {
  if (!Array.isArray(raw)) return [];
  const sentences = sentenceList(documentText);
  const out: MaterialQuestion[] = [];

  for (const item of raw) {
    if (!isWireQuestion(item)) continue;
    const kind: QuestionKind = (KINDS.includes(item.kind) ? item.kind : 'statement') as QuestionKind;
    out.push({
      q: item.question.trim(),
      a: item.options.map((option) => option.trim()),
      correct: item.correctIndex,
      source: item.source.trim(),
      topic: item.topic.trim(),
      kind,
      explanation: item.explanation.trim(),
      sourceIndex: locateSource(item.source, sentences),
    });
  }
  return out;
}

/* ------------------------------------------------------------------ request */

/** The difficulty the learner asked for. The server biases the prompt to match. */
export type Difficulty = 'easy' | 'medium' | 'hard';

export type GenerateInput = {
  text: string;
  topics: string[];
  concepts: string[];
  questionCount: number;
  /** easy | medium | hard. Omitted means the server's balanced default. */
  difficulty?: Difficulty;
  /** Lets the page abandon a request when the learner navigates away mid-generation. */
  signal?: AbortSignal;
};

/**
 * Ask the server for a paper.
 *
 * Resolves only when there are enough validated questions to run a quiz. Every other
 * outcome — unconfigured, rate limited, timed out, too few good questions — throws an
 * `AiGenerationError` carrying the code, so the page can say what happened instead of
 * showing a generic failure or, worse, quietly generating something else.
 */
export async function generateAiQuestions(input: GenerateInput): Promise<AiGeneration> {
  let response: Response;
  try {
    response = await fetch(`${API_URL}/api/ai/generate-mcqs`, {
      method: 'POST',
      // The session cookie is HttpOnly and lives on the API origin; without this the
      // request arrives signed out and the endpoint correctly refuses it.
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: input.text,
        topics: input.topics,
        concepts: input.concepts,
        questionCount: input.questionCount,
        ...(input.difficulty ? { difficulty: input.difficulty } : {}),
      }),
      signal: input.signal,
    });
  } catch (failure) {
    if (failure instanceof DOMException && failure.name === 'AbortError') throw failure;
    throw new AiGenerationError(
      `Cannot reach the NEXORA AI server at ${API_URL}. Start it with: node server/index.mjs`,
      { code: 'network_error' },
    );
  }

  let payload: unknown = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  const body = (payload ?? {}) as {
    ok?: boolean;
    questions?: unknown;
    meta?: AiMeta;
    error?: { code?: string; message?: string };
  };

  if (!response.ok || body.ok !== true) {
    const code = body.error?.code ?? (response.status === 401 ? 'unauthorized' : 'ai_error');
    // A shortfall still ships the questions it managed, so the message can be specific
    // about how short it fell rather than just saying no.
    const produced = Array.isArray(body.questions) ? body.questions.length : 0;
    throw new AiGenerationError(messageFor(code, body.error?.message), {
      code,
      status: response.status,
      produced,
    });
  }

  const questions = toQuestions(body.questions, input.text);
  if (questions.length === 0) {
    throw new AiGenerationError(
      'The AI returned no questions this document could be checked against. Try a longer or more detailed material.',
      { code: 'no_questions', status: response.status },
    );
  }

  // The topics the paper can honestly be scored by are the ones its questions cover,
  // ordered as the document ranked them so the list on screen reads the same way.
  const covered = Array.from(new Set(questions.map((question) => question.topic)));
  const ranked = covered.sort((left, right) => {
    const leftRank = input.topics.indexOf(left);
    const rightRank = input.topics.indexOf(right);
    return (leftRank === -1 ? input.topics.length : leftRank) - (rightRank === -1 ? input.topics.length : rightRank);
  });

  return { questions, topics: ranked, meta: body.meta ?? null };
}
