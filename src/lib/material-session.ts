import { useSyncExternalStore } from 'react';
import { type MaterialQuestion } from './materials';

const KEY = 'NEXORA AI.material.v1';

export type StoredMaterial = {
  fileName: string;
  fileSize: number;
  fileType: string;
  pageCount: number;
  concepts: string[];
  topics: string[];
  questions: MaterialQuestion[];
  createdAt: string;
  isSample: boolean;
  savedPaperId?: string;
};

let current: StoredMaterial | null = null;
let loaded = false;

let durable = true;

const listeners = new Set<() => void>();

function store(): Storage | null {
  try {
    if (typeof window === 'undefined') return null;
    return window.sessionStorage;
  } catch {
    return null;
  }
}

function validate(value: unknown): StoredMaterial | null {
  if (!value || typeof value !== 'object') return null;
  const candidate = value as Partial<StoredMaterial>;
  if (!Array.isArray(candidate.questions) || candidate.questions.length === 0) return null;
  for (const question of candidate.questions) {
    if (!question || typeof question.q !== 'string') return null;
    if (!Array.isArray(question.a) || question.a.length < 2) return null;
    if (typeof question.correct !== 'number' || question.correct < 0 || question.correct >= question.a.length) return null;
    if (typeof question.topic !== 'string') return null;
  }
  return {
    fileName: typeof candidate.fileName === 'string' ? candidate.fileName : 'Material',
    fileSize: typeof candidate.fileSize === 'number' ? candidate.fileSize : 0,
    fileType: typeof candidate.fileType === 'string' ? candidate.fileType : '',
    pageCount: typeof candidate.pageCount === 'number' ? candidate.pageCount : 1,
    concepts: Array.isArray(candidate.concepts) ? candidate.concepts.filter((item) => typeof item === 'string') : [],
    topics: Array.isArray(candidate.topics) ? candidate.topics.filter((item) => typeof item === 'string') : [],
    questions: candidate.questions,
    createdAt: typeof candidate.createdAt === 'string' ? candidate.createdAt : new Date().toISOString(),
    isSample: candidate.isSample === true,
    ...(typeof candidate.savedPaperId === 'string' && candidate.savedPaperId !== ''
      ? { savedPaperId: candidate.savedPaperId }
      : {}),
  };
}

function read(): StoredMaterial | null {
  const bucket = store();
  if (!bucket) return null;
  let raw: string | null = null;
  try {
    raw = bucket.getItem(KEY);
  } catch {
    return null;
  }
  if (!raw) return null;
  let parsed: StoredMaterial | null = null;
  try {
    parsed = validate(JSON.parse(raw));
  } catch {
    parsed = null;
  }
  if (!parsed) {
    try {
      bucket.removeItem(KEY);
    } catch {
      /* Storage is readable but not writable. Returning null is still the right answer. */
    }
  }
  return parsed;
}

function announce() {
  for (const listener of [...listeners]) listener();
}

export function getMaterial(): StoredMaterial | null {
  if (!loaded) {
    current = read();
    loaded = true;
  }
  return current;
}

export function setMaterial(material: StoredMaterial): void {
  current = material;
  loaded = true;
  const bucket = store();
  if (bucket) {
    try {
      bucket.setItem(KEY, JSON.stringify(material));
      durable = true;
    } catch {
      durable = false;
    }
  } else {
    durable = false;
  }
  announce();
}

export function clearMaterial(): void {
  current = null;
  loaded = true;
  const bucket = store();
  if (bucket) {
    try {
      bucket.removeItem(KEY);
    } catch {
      /* Nothing to do: the in-memory copy is already gone, which is what callers rely on. */
    }
  }
  announce();
}

export function isDurable(): boolean {
  return durable;
}

export function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function snapshot(): StoredMaterial | null {
  return getMaterial();
}

export function serverSnapshot(): StoredMaterial | null {
  return null;
}

export function useMaterial(): StoredMaterial | null {
  return useSyncExternalStore(subscribe, snapshot, serverSnapshot);
}
