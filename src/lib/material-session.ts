/**
 * The paper the learner is currently working from, kept where a reload cannot lose it.
 *
 * Before this file, the analysed material lived in a module-level `let` inside
 * pages/demo-pages.tsx. That survived navigation — the Quiz page could read what the
 * Materials page had written — but it did not survive a refresh, so pressing reload
 * on the quiz screen silently threw away a twelve-question paper and sent the learner
 * back to the upload box with no explanation.
 *
 *   Why sessionStorage and not localStorage
 *
 * The stored paper contains sentences quoted from the learner's own document. That is
 * unavoidable: a grounded question has to cite its source. But it means the store
 * holds fragments of a work file, so it lives in sessionStorage, which is scoped to
 * the one tab and is discarded when that tab closes. localStorage would leave those
 * fragments on disk after the learner walked away, which is not a choice they made.
 * Nothing here is ever sent anywhere — the server only receives topic names and counts.
 *
 * `subscribe`/`snapshot` exist so React can read this through `useSyncExternalStore`
 * rather than a provider. A paper belongs to a browser tab, not to an account, so
 * there is nothing for a context provider to scope it to.
 */

import { useSyncExternalStore } from 'react';
import { type MaterialQuestion } from './materials';

const KEY = 'statskill.material.v1';

export type StoredMaterial = {
  fileName: string;
  fileSize: number;
  /** Extension or MIME type as reported by the browser. Display only. */
  fileType: string;
  pageCount: number;
  /** Display pills on the Materials page. */
  concepts: string[];
  /** The topics the paper is scored by. */
  topics: string[];
  questions: MaterialQuestion[];
  /** When the paper was generated, ISO 8601. */
  createdAt: string;
  /** True when this came from the built-in sample rather than a file the learner chose. */
  isSample: boolean;
};

let current: StoredMaterial | null = null;
let loaded = false;

/**
 * False once a write to sessionStorage has failed. Safari in private mode and a full
 * quota both throw on setItem, and in that case the paper still works for as long as
 * the tab stays on the page — so the failure is recorded and surfaced rather than
 * swallowed, because "survives a reload" would otherwise become quietly untrue.
 */
let durable = true;

const listeners = new Set<() => void>();

function store(): Storage | null {
  try {
    // Both guards are needed: `window` is absent when server-rendering, and reading
    // `sessionStorage` itself throws in a browser with storage disabled entirely.
    if (typeof window === 'undefined') return null;
    return window.sessionStorage;
  } catch {
    return null;
  }
}

/** Reject anything that is not a paper we could actually run a quiz from. */
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
    // A truncated value — a tab killed mid-write — lands here rather than in validate.
    parsed = null;
  }
  // A paper from an older build, a half-written one, or one whose answer key is out of
  // range is dropped rather than repaired: guessing at a missing answer would mark the
  // learner's answers wrongly, and leaving it in place would fail again on every read.
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

/** The current paper, restoring it from the tab's storage on first call. */
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

/** False when the paper is memory-only, so a page can stop promising it will survive a reload. */
export function isDurable(): boolean {
  return durable;
}

export function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Stable identity for `useSyncExternalStore` — the object only changes when the paper does. */
export function snapshot(): StoredMaterial | null {
  return getMaterial();
}

/** Server rendering has no tab storage, so there is never a paper in progress. */
export function serverSnapshot(): StoredMaterial | null {
  return null;
}

/**
 * Read the current paper in a component, re-rendering when it changes.
 *
 * The third argument is what makes this safe under `renderToStaticMarkup`, which the
 * render harness uses: without it React throws instead of rendering, and with it the
 * quiz page server-renders its "no material yet" state, which is the honest answer
 * when there is no tab to have uploaded anything.
 */
export function useMaterial(): StoredMaterial | null {
  return useSyncExternalStore(subscribe, snapshot, serverSnapshot);
}
