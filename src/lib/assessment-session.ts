import { useSyncExternalStore } from 'react';
import { type AnswerAnalysis } from './analytics';
import { type AssessmentResult, type SealedPaper } from './assessment';
import { type Choice } from './scoring';

const KEY = 'NEXORA AI.assessment.v1';

export type StoredAssessment = {
  paper: SealedPaper;
  answers: Choice[];
  result: AssessmentResult;
  answerAnalysis: AnswerAnalysis | null;
  elapsed: number;
};

let current: StoredAssessment | null = null;
let loaded = false;
const listeners = new Set<() => void>();

function store(): Storage | null {
  try {
    if (typeof window === 'undefined') return null;
    return window.sessionStorage;
  } catch {
    return null;
  }
}

function validPaper(value: unknown): value is SealedPaper {
  if (!value || typeof value !== 'object') return false;
  const paper = value as Partial<SealedPaper>;
  if (!Array.isArray(paper.questions) || paper.questions.length === 0) return false;
  if (!Array.isArray(paper.sections)) return false;
  if (typeof paper.length !== 'number' || typeof paper.questionsPerSection !== 'number') return false;
  if (typeof paper.label !== 'string' || typeof paper.note !== 'string') return false;
  for (const question of paper.questions) {
    if (!question || typeof question !== 'object') return false;
    const q = question as { id?: unknown; q?: unknown; options?: unknown };
    if (typeof q.id !== 'string' || typeof q.q !== 'string') return false;
    if (!Array.isArray(q.options) || q.options.length < 2) return false;
    for (const option of q.options) {
      if (!option || typeof option !== 'object') return false;
      const o = option as { id?: unknown; text?: unknown };
      if (typeof o.id !== 'string' || typeof o.text !== 'string') return false;
    }
  }
  return true;
}

function validResult(value: unknown): value is AssessmentResult {
  if (!value || typeof value !== 'object') return false;
  const result = value as Partial<AssessmentResult>;
  if (result.source !== 'assessment') return false;
  if (typeof result.total !== 'number' || typeof result.correct !== 'number') return false;
  if (typeof result.percent !== 'number' || typeof result.band !== 'string') return false;
  if (!Array.isArray(result.questions) || !Array.isArray(result.topics)) return false;
  return true;
}

function validate(value: unknown): StoredAssessment | null {
  if (!value || typeof value !== 'object') return null;
  const candidate = value as Partial<StoredAssessment>;
  if (!validPaper(candidate.paper)) return null;
  if (!validResult(candidate.result)) return null;
  if (!Array.isArray(candidate.answers)) return null;
  for (const answer of candidate.answers) {
    if (answer !== null && typeof answer !== 'number') return null;
  }
  return {
    paper: candidate.paper,
    answers: candidate.answers as Choice[],
    result: candidate.result,
    answerAnalysis:
      candidate.answerAnalysis && typeof candidate.answerAnalysis === 'object'
        ? (candidate.answerAnalysis as AnswerAnalysis)
        : null,
    elapsed: typeof candidate.elapsed === 'number' && candidate.elapsed >= 0 ? candidate.elapsed : 0,
  };
}

function read(): StoredAssessment | null {
  const bucket = store();
  if (!bucket) return null;
  let raw: string | null = null;
  try {
    raw = bucket.getItem(KEY);
  } catch {
    return null;
  }
  if (!raw) return null;
  let parsed: StoredAssessment | null = null;
  try {
    parsed = validate(JSON.parse(raw));
  } catch {
    parsed = null;
  }
  if (!parsed) {
    try {
      bucket.removeItem(KEY);
    } catch {
      /* Readable but not writable — returning null is still the right answer. */
    }
  }
  return parsed;
}

function announce() {
  for (const listener of [...listeners]) listener();
}

export function getAssessment(): StoredAssessment | null {
  if (!loaded) {
    current = read();
    loaded = true;
  }
  return current;
}

export function loadAssessment(): StoredAssessment | null {
  return getAssessment();
}

export function saveAssessment(sitting: StoredAssessment): void {
  current = sitting;
  loaded = true;
  const bucket = store();
  if (bucket) {
    try {
      bucket.setItem(KEY, JSON.stringify(sitting));
    } catch {
      /* Private-mode or full quota: the in-memory copy still serves this tab. */
    }
  }
  announce();
}

export function clearAssessment(): void {
  current = null;
  loaded = true;
  const bucket = store();
  if (bucket) {
    try {
      bucket.removeItem(KEY);
    } catch {
      /* The in-memory copy is already gone, which is what callers rely on. */
    }
  }
  announce();
}

export function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function snapshot(): StoredAssessment | null {
  return getAssessment();
}

export function serverSnapshot(): StoredAssessment | null {
  return null;
}

export function useStoredAssessment(): StoredAssessment | null {
  return useSyncExternalStore(subscribe, snapshot, serverSnapshot);
}
