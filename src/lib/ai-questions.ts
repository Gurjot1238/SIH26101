import { API_URL } from './auth';
import { type MaterialQuestion, type QuestionKind, sentenceList } from './materials';

export type MaterialClassification = {
  type: string;
  label: string;
  suitable: boolean;
  confidence: string;
  reason: string;
  topics: string[];
  summary: string;
  advice: string;
};

export type ClassifyResult = {
  ok: boolean;
  classification?: MaterialClassification;
  error?: { code: string; message: string };
};

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

type WireQuestion = {
  question: string;
  options: string[];
  correctIndex: number;
  topic: string;
  kind: string;
  explanation: string;
  source: string;
};

export type AiMeta = {
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
  topics: string[];
  meta: AiMeta | null;
};

const KINDS: readonly string[] = ['statement', 'cloze', 'numeric', 'identify', 'scenario'];

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

function tokens(value: string): string[] {
  return value.toLowerCase().match(/[a-z0-9]+/g) ?? [];
}

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
  return bestScore >= 0.4 ? bestIndex : 0;
}

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

export type Difficulty = 'easy' | 'medium' | 'hard';

export type GenerateInput = {
  text: string;
  topics: string[];
  concepts: string[];
  questionCount: number;
  difficulty?: Difficulty;
  signal?: AbortSignal;
};

export async function generateAiQuestions(input: GenerateInput): Promise<AiGeneration> {
  let response: Response;
  try {
    response = await fetch(`${API_URL}/api/ai/generate-mcqs`, {
      method: 'POST',
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

  const covered = Array.from(new Set(questions.map((question) => question.topic)));
  const ranked = covered.sort((left, right) => {
    const leftRank = input.topics.indexOf(left);
    const rightRank = input.topics.indexOf(right);
    return (leftRank === -1 ? input.topics.length : leftRank) - (rightRank === -1 ? input.topics.length : rightRank);
  });

  return { questions, topics: ranked, meta: body.meta ?? null };
}
