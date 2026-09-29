import { useSyncExternalStore } from 'react';
import { type MaterialQuestion } from './materials';
import { type StoredMaterial } from './material-session';
import { type Choice } from './scoring';

const KEY = 'NEXORA AI.attempt.v1';

export type StoredAttempt = {
  materialKey: string;
  answers: Choice[];
  retry: MaterialQuestion[] | null;
  done: boolean;
  startedAt: number;
};

let current: StoredAttempt | null = null;
let loaded = false;
const listeners = new Set<() => void>();

export function attemptKey(
  material: Pick<StoredMaterial, 'fileName' | 'createdAt' | 'questions'> | null,
): string {
  if (!material) return '';
  const count = Array.isArray(material.questions) ? material.questions.length : 0;
  return `${material.createdAt}::${material.fileName}::${count}`;
}

function store(): Storage | null {
  try {
    if (typeof window === 'undefined') return null;
    return window.sessionStorage;
  } catch {
    return null;
  }
}

function validQuestion(value: unknown): boolean {
  if (!value || typeof value !== 'object') return false;
  const q = value as Partial<MaterialQuestion>;
  if (typeof q.q !== 'string') return false;
  if (!Array.isArray(q.a) || q.a.length < 2) return false;
  if (typeof q.correct !== 'number' || q.correct < 0 || q.correct >= q.a.length) return false;
  if (typeof q.topic !== 'string') return false;
  return true;
}

function validate(value: unknown): StoredAttempt | null {
  if (!value || typeof value !== 'object') return null;
  const candidate = value as Partial<StoredAttempt>;
  if (typeof candidate.materialKey !== 'string' || candidate.materialKey === '') return null;
  if (!Array.isArray(candidate.answers)) return null;
  for (const answer of candidate.answers) {
    if (answer !== null && typeof answer !== 'number') return null;
  }
  let retry: MaterialQuestion[] | null = null;
  if (candidate.retry != null) {
    if (!Array.isArray(candidate.retry) || candidate.retry.length === 0) return null;
    if (!candidate.retry.every(validQuestion)) return null;
    retry = candidate.retry as MaterialQuestion[];
  }
  return {
    materialKey: candidate.materialKey,
    answers: candidate.answers as Choice[],
    retry,
    done: candidate.done === true,
    startedAt: typeof candidate.startedAt === 'number' ? candidate.startedAt : Date.now(),
  };
}

function read(): StoredAttempt | null {
  const bucket = store();
  if (!bucket) return null;
  let raw: string | null = null;
  try {
    raw = bucket.getItem(KEY);
  } catch {
    return null;
  }
  if (!raw) return null;
  let parsed: StoredAttempt | null = null;
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

export function getAttempt(): StoredAttempt | null {
  if (!loaded) {
    current = read();
    loaded = true;
  }
  return current;
}

export function loadAttempt(materialKey: string): StoredAttempt | null {
  if (!materialKey) return null;
  const stored = getAttempt();
  return stored && stored.materialKey === materialKey ? stored : null;
}

export function saveAttempt(attempt: StoredAttempt): void {
  current = attempt;
  loaded = true;
  const bucket = store();
  if (bucket) {
    try {
      bucket.setItem(KEY, JSON.stringify(attempt));
    } catch {
      /* Private-mode or full quota: the in-memory copy still serves this tab. */
    }
  }
  announce();
}

export function clearAttempt(): void {
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

export function snapshot(): StoredAttempt | null {
  return getAttempt();
}

export function serverSnapshot(): StoredAttempt | null {
  return null;
}

export function useStoredAttempt(): StoredAttempt | null {
  return useSyncExternalStore(subscribe, snapshot, serverSnapshot);
}
