/**
 * The finished sitting, kept where navigating to another page cannot lose it.
 *
 * The uploaded material already survives a reload — `material-session.ts` keeps it in
 * the tab's storage. The *sitting* did not. Answers, the score, the per-topic report and
 * the review all lived in React state inside the Quiz page, so the instant the learner
 * clicked to another page that component unmounted and every one of them was gone. Coming
 * back re-mounted the page at "Begin knowledge check", and the only way to see the report
 * again was to retake the whole paper. This module is the sitting's half of the same
 * promise the material already keeps: complete a paper once, and the result stays put
 * until a new assignment replaces it.
 *
 *   What is stored, and what is not
 *
 * Only the grading *inputs* are kept: which assignment this was (`materialKey`), the
 * answers given, and — when it was a "practise what you missed" retry — the exact paper
 * sat. The score, bands, passages and charts are all re-derived from those by the same
 * `gradeAttempt` the live screen uses, so there is one grader and the restored report can
 * never drift from the one that was on screen when the learner walked away.
 *
 *   Why sessionStorage, keyed to the assignment
 *
 * The answers point at a paper whose questions quote the learner's own document, so this
 * lives in sessionStorage for the same reason the paper does: tab-scoped, discarded when
 * the tab closes, never left on disk. `materialKey` ties the sitting to one generated
 * paper (its file name, creation time and length), so a result is only ever shown against
 * the assignment it came from — a freshly generated paper carries a new key and the old
 * sitting is ignored rather than shown against the wrong questions.
 */

import { useSyncExternalStore } from 'react';
import { type MaterialQuestion } from './materials';
import { type StoredMaterial } from './material-session';
import { type Choice } from './scoring';

const KEY = 'NEXORA AI.attempt.v1';

export type StoredAttempt = {
  /** attemptKey(material) — which generated paper this sitting belongs to. */
  materialKey: string;
  /** The answers given, index-aligned with the paper that was sat. A hole is a skip. */
  answers: Choice[];
  /**
   * The paper actually sat, only when it was a "practise what you missed" retry — those
   * questions differ from the material's. Null for the full paper, which is the material's
   * own `questions`, so the retry paper is never stored twice.
   */
  retry: MaterialQuestion[] | null;
  /** True once the paper was completed and the report shown — the state worth restoring. */
  done: boolean;
  /** ms epoch the sitting began, kept only so a restored report is internally consistent. */
  startedAt: number;
};

let current: StoredAttempt | null = null;
let loaded = false;
const listeners = new Set<() => void>();

/** A stable identity for one generated paper, so a result is shown only against its own paper. */
export function attemptKey(
  material: Pick<StoredMaterial, 'fileName' | 'createdAt' | 'questions'> | null,
): string {
  if (!material) return '';
  const count = Array.isArray(material.questions) ? material.questions.length : 0;
  return `${material.createdAt}::${material.fileName}::${count}`;
}

function store(): Storage | null {
  try {
    // `window` is absent under server rendering; reading `sessionStorage` itself throws
    // in a browser with storage disabled entirely, so both need guarding.
    if (typeof window === 'undefined') return null;
    return window.sessionStorage;
  } catch {
    return null;
  }
}

/** A single question is only usable if a quiz could actually be graded from it. */
function validQuestion(value: unknown): boolean {
  if (!value || typeof value !== 'object') return false;
  const q = value as Partial<MaterialQuestion>;
  if (typeof q.q !== 'string') return false;
  if (!Array.isArray(q.a) || q.a.length < 2) return false;
  if (typeof q.correct !== 'number' || q.correct < 0 || q.correct >= q.a.length) return false;
  if (typeof q.topic !== 'string') return false;
  return true;
}

/** Reject anything that is not a sitting we could faithfully put back on screen. */
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
    // A value truncated by a tab killed mid-write lands here rather than in validate.
    parsed = null;
  }
  // A sitting from an older build or a half-written one is dropped rather than repaired:
  // a wrong answer key would misreport the learner's result, and leaving it in place would
  // only fail again on the next read.
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

/** The stored sitting, restoring it from tab storage on first call. */
export function getAttempt(): StoredAttempt | null {
  if (!loaded) {
    current = read();
    loaded = true;
  }
  return current;
}

/**
 * The stored sitting, but only when it belongs to the paper identified by `materialKey`.
 * A mismatch (a newer assignment, or none) yields null, so a result is never shown against
 * questions it was not answered on.
 */
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

/** Stable identity for `useSyncExternalStore` — changes only when the sitting does. */
export function snapshot(): StoredAttempt | null {
  return getAttempt();
}

/** Server rendering has no tab storage, so there is never a stored sitting. */
export function serverSnapshot(): StoredAttempt | null {
  return null;
}

/** Read the stored sitting in a component, re-rendering when it changes. */
export function useStoredAttempt(): StoredAttempt | null {
  return useSyncExternalStore(subscribe, snapshot, serverSnapshot);
}
