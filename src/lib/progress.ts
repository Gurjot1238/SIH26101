/**
 * Browser-side client for the progress endpoints in ./server.
 *
 * Same two rules as `auth.ts`: `credentials: 'include'` on every call because the
 * session is an HttpOnly cookie, and nothing is written to localStorage. What is
 * new here is the shape of the answers, and one rule about them:
 *
 *   The server is the authority on every number.
 *
 * A page grades an attempt locally so the learner sees a result instantly, but the
 * copy that survives a reload is the one the server recomputed from the counts.
 * Every function below therefore returns what the server said, and the provider
 * adopts that rather than the value it hoped for. This is why `saveAttempt`
 * returns a rollup: it saves a round trip and removes the chance of the screen and
 * the store disagreeing.
 *
 * Deliberately absent: any field that could carry document text or question text.
 * The uploaded file is parsed in the tab and never uploaded, and while its extracted
 * text does go to `/api/ai/generate-mcqs` once to have questions written, none of it
 * is persisted there. Nothing on this API — the one that does write to disk — can
 * carry it. `AttemptPayload` in `scoring.ts` is the type that keeps that promise on
 * the way out.
 */

import { API_URL, AuthError } from './auth';
import { type AnswerAnalysis } from './analytics';
import { type AssessmentResult, type SealedPaper } from './assessment';
import { type AttemptPayload } from './scoring';
import { type Band, type CompetencyId } from './topics';

/** Mirrored from server/progress.mjs, for the Profile page's language select. */
export const LANGUAGES = ['English', 'Hindi', 'Kannada'] as const;
export type Language = (typeof LANGUAGES)[number];

export type CompetencyRollup = {
  id: CompetencyId;
  correct: number;
  total: number;
  percent: number;
  band: Band;
  /** How many separate papers touched this competency. */
  attempts: number;
};

export type TopicRollup = {
  topic: string;
  competency: CompetencyId | null;
  correct: number;
  total: number;
  attempts: number;
  lastSeenAt: string;
  percent: number;
  band: Band;
};

/**
 * Everything measured about one account, computed from its attempts.
 *
 * `index` is the one-decimal figure the Dashboard already printed as a competency
 * index. It is `correct / questions`, nothing else — no weighting, no curve — so
 * the number on screen can always be explained by the two counts beside it.
 *
 * Contains nothing bucketed by day. The server does not know the learner's
 * timezone, so weekday grouping and streaks are the browser's job, computed from
 * `lastSeenAt` and the timestamps on the history.
 */
export type ProgressRollup = {
  attempts: number;
  questions: number;
  correct: number;
  percent: number;
  index: number;
  band: Band;
  minutes: number;
  firstAttemptAt: string | null;
  lastAttemptAt: string | null;
  sources: Partial<Record<AttemptPayload['source'], number>>;
  competencies: CompetencyRollup[];
  topics: TopicRollup[];
  /** Competencies worth working on, weakest first. Empty is a real answer. */
  focus: CompetencyRollup[];
};

export type Preferences = {
  language: Language;
  weeklyNote: boolean;
  demoLabels: boolean;
  /** Whether the notification bell fetches and shows a feed. */
  notify: boolean;
};

/**
 * The editable free-text identity fields on the Profile page. Name and email are
 * deliberately NOT here: they are the account's credentials, owned by the auth
 * session and read-only on the profile.
 */
export type Personal = {
  phone: string;
  bio: string;
  role: string;
  department: string;
  location: string;
};

export type CourseRecord = {
  courseId: string;
  saved: boolean;
  startedAt: string | null;
  /** Legacy module-index completion, kept for the internal pathways. */
  completedModules: number[];
  /** Lesson-id completion for the dataset courses; the % divides into this. */
  completedLessons: string[];
  updatedAt: string | null;
};

/** One stored attempt as it comes back. Counts and topic names; no question text. */
export type StoredAttempt = {
  id: string;
  at: string;
  source: AttemptPayload['source'];
  label: string;
  total: number;
  correct: number;
  percent: number;
  band: Band;
  durationSeconds: number;
  topics: Array<{
    topic: string;
    competency: CompetencyId | null;
    correct: number;
    total: number;
    percent: number;
    band: Band;
  }>;
  competencyPercents: Partial<Record<CompetencyId, number>>;
};

export type ProgressBundle = {
  progress: ProgressRollup;
  preferences: Preferences;
  personal: Personal;
  courses: CourseRecord[];
  /** The most recent handful, so the Dashboard renders without a second call. */
  history: StoredAttempt[];
};

export type HistoryPage = {
  attempts: StoredAttempt[];
  /** Everything held for the account, which can exceed `attempts.length`. */
  total: number;
  limit: number;
};

/**
 * The rollup of an account with no attempts yet.
 *
 * Not a placeholder: this is exactly what the server returns for a new account, so
 * a page can render it directly and show its real empty state instead of branching
 * on null. `band: 'unrated'` is the honest answer to "how are they doing" when
 * nobody has answered a question yet.
 */
export function emptyRollup(): ProgressRollup {
  return {
    attempts: 0,
    questions: 0,
    correct: 0,
    percent: 0,
    index: 0,
    band: 'unrated',
    minutes: 0,
    firstAttemptAt: null,
    lastAttemptAt: null,
    sources: {},
    competencies: [],
    topics: [],
    focus: [],
  };
}

export function defaultPreferences(): Preferences {
  return { language: 'English', weeklyNote: true, demoLabels: true, notify: true };
}

export function defaultPersonal(): Personal {
  return { phone: '', bio: '', role: '', department: '', location: '' };
}

/* ------------------------------------------------------------------ transport */

type Failure = { ok: false; error: { code: string; message: string; fields?: Record<string, string> } };

/**
 * One request. Throws `AuthError` on anything that is not a 2xx.
 *
 * Reusing the error class from `auth.ts` rather than inventing a second one is
 * deliberate: a page that wants to react to "your session expired" should be able
 * to catch one type, whichever call produced it. `status` carries the 401 through
 * so the provider can tell an expired session from a server that is not running.
 */
async function request<T>(method: 'GET' | 'POST' | 'DELETE', path: string, body?: unknown): Promise<T> {
  let response: Response;

  try {
    response = await fetch(`${API_URL}${path}`, {
      method,
      credentials: 'include',
      headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new AuthError(
      `Cannot reach the auth server at ${API_URL}. Start it with: node server/index.mjs`,
      { code: 'network_error' },
    );
  }

  let payload: (T & { ok: true }) | Failure | null = null;
  try {
    payload = (await response.json()) as (T & { ok: true }) | Failure;
  } catch {
    payload = null;
  }

  if (!response.ok || !payload || payload.ok !== true) {
    const failure = payload && payload.ok === false ? payload.error : null;
    throw new AuthError(failure?.message ?? `Request failed (${response.status}).`, {
      code: failure?.code ?? 'server_error',
      status: response.status,
    });
  }

  return payload;
}

/* ---------------------------------------------------------------------- calls */

/** Rollup, preferences, saved courses and recent history in one round trip. */
export function fetchProgress(): Promise<ProgressBundle> {
  return request<ProgressBundle>('GET', '/api/progress');
}

/**
 * Save one graded attempt.
 *
 * `dropped` is how many of the oldest attempts fell off the per-account cap, so a
 * page can say so instead of silently losing history. `progress` is the recomputed
 * rollup — use it, do not add the local result to the old one by hand.
 */
export function saveAttempt(
  payload: AttemptPayload,
): Promise<{ attempt: StoredAttempt; dropped: number; progress: ProgressRollup }> {
  return request('POST', '/api/progress/attempts', payload);
}

/** Own history, newest first. `limit` is clamped server-side, never rejected upward. */
export function fetchHistory(limit?: number): Promise<HistoryPage> {
  const query = limit === undefined ? '' : `?limit=${encodeURIComponent(String(limit))}`;
  return request<HistoryPage>('GET', `/api/progress/attempts${query}`);
}

/** Clear own history. Destructive, so every caller must confirm first. */
export function clearHistory(): Promise<{ removed: number; progress: ProgressRollup }> {
  return request('DELETE', '/api/progress/attempts');
}

/** Patch one or more preferences. Unnamed fields keep their stored value. */
export function savePreferences(patch: Partial<Preferences>): Promise<{ preferences: Preferences }> {
  return request('POST', '/api/progress/preferences', patch);
}

/**
 * Patch the editable personal details (phone/bio/role/department/location).
 * Unnamed fields keep their stored value; an empty string clears a field. Name and
 * email are not accepted here — they are account credentials.
 */
export function saveProfileDetails(patch: Partial<Personal>): Promise<{ personal: Personal }> {
  return request('POST', '/api/progress/profile', patch);
}

/**
 * Bookmark a course, mark it started, or record which modules are done.
 *
 * `started: true` is idempotent — the server keeps the original `startedAt`, so
 * resuming a course does not reset "started three days ago".
 */
export function saveCourse(update: {
  courseId: string;
  saved?: boolean;
  started?: boolean;
  completedModules?: number[];
  completedLessons?: string[];
}): Promise<{ course: CourseRecord; courses: CourseRecord[] }> {
  return request('POST', '/api/progress/courses', update);
}

/* ------------------------------------------------------- the sealed assessment */

/**
 * Deal a fresh assessment paper.
 *
 * Two things are true of what comes back and of nothing else in this file: it contains
 * question text, and it contains no answer key. The key stays on the server until the
 * paper is submitted, which is the whole reason the assessment is not built in the tab
 * any more.
 */
export async function fetchAssessmentPaper(): Promise<SealedPaper> {
  const body = await request<{ paper: SealedPaper }>('GET', '/api/assessment/paper');
  return body.paper;
}

/**
 * Submit a sitting and get back the server's marking.
 *
 * The submission carries answers and nothing else — no score, no percent, no band. The
 * server would ignore them anyway (`server/smoke-test.sh` submits a body claiming 100%
 * and asserts 27% is what gets stored), and not sending them keeps that obvious here.
 *
 * The attempt is stored as part of the same request, so `attempt` and `progress` come
 * back with the result and there is no second call to save what was just graded.
 */
export function submitAssessment(submission: {
  choices: Array<{ question: string; option: string | null }>;
  durationSeconds: number;
}): Promise<{
  result: AssessmentResult;
  attempt: StoredAttempt;
  dropped: number;
  progress: ProgressRollup;
  /**
   * Which questions were missed and under which topic. Computed by the server from the
   * same grading as `result`, so the two cannot disagree; it carries no question text
   * and no answer key of its own.
   */
  answers: AnswerAnalysis;
}> {
  return request('POST', '/api/assessment/submit', submission);
}
