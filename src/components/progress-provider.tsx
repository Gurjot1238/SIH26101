/**
 * One place that knows what this account has actually measured.
 *
 * The companion to `session-provider.tsx`, and it exists for the same reason: the
 * Dashboard, the Materials page, the Quiz and the Profile page all
 * want the same rollup, and without a provider each would fetch its own copy and
 * they would drift apart within one navigation.
 *
 * Four states, and the interesting ones are the last two:
 *
 *   idle         nobody is signed in — nothing measured, and that is not an error
 *   loading      the first request is in flight
 *   ready        the server answered; `progress` is this account's real numbers
 *   unavailable  signed in, but the progress API did not answer
 *
 * `live` is the flag the pages actually branch on. When it is false the screens
 * keep their sample content and their "Sample / Demonstration Data" markers, which
 * is what makes demo mode (`VITE_REQUIRE_AUTH=false`, no server running) still
 * work. When it is true, every number on screen came from this learner's attempts.
 * Nothing in between: a page must never mix a measured figure with a decorative one.
 */

import { createContext, type ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useSession } from '@/components/session-provider';
import { type AssessmentResult, type SealedPaper } from '@/lib/assessment';
import { type AnswerAnalysis } from '@/lib/analytics';
import { AuthError } from '@/lib/auth';
import {
  type CourseRecord,
  type Personal,
  type Preferences,
  type ProgressRollup,
  type StoredAttempt,
  clearHistory,
  defaultPersonal,
  defaultPreferences,
  emptyRollup,
  fetchAssessmentPaper,
  fetchProgress,
  saveAttempt,
  saveCourse,
  savePreferences,
  saveProfileDetails,
  submitAssessment,
} from '@/lib/progress';
import { type AttemptPayload } from '@/lib/scoring';

export type ProgressStatus = 'idle' | 'loading' | 'ready' | 'unavailable';

/**
 * What a mutator answers. `saved: false` is the expected reply in demo mode, not a
 * failure, so it is a return value rather than an exception — a page can say "sign
 * in to keep this" without wrapping every call in a try block.
 */
export type SaveOutcome<T> = { saved: true; value: T } | { saved: false; reason: string };

export type ProgressStore = {
  status: ProgressStatus;
  /** Why the last load failed. Only set when status is 'unavailable'. */
  problem: string;
  /** True only when every number below is this account's own, measured. */
  live: boolean;
  /** Always a usable rollup — `emptyRollup()` while idle, so pages need no null check. */
  progress: ProgressRollup;
  preferences: Preferences;
  /** The editable identity fields (phone/bio/role/department/location). */
  personal: Personal;
  courses: CourseRecord[];
  /** The most recent attempts, newest first. */
  history: StoredAttempt[];
  refresh: () => Promise<void>;
  /** Save one graded attempt. `dropped` is how many fell off the per-account cap. */
  record: (payload: AttemptPayload) => Promise<SaveOutcome<{ attempt: StoredAttempt; dropped: number }>>;
  /**
   * Deal a fresh assessment paper. Needs a session, because the paper comes from the
   * server — in demo mode this declines and the page says so rather than sitting an
   * exam it has no key for.
   */
  openAssessment: () => Promise<SaveOutcome<SealedPaper>>;
  /**
   * Submit a sitting. The server grades it, stores it and returns its own numbers, so
   * this is `record` for assessments — a page must not call both.
   */
  sitAssessment: (submission: {
    choices: Array<{ question: string; option: string | null }>;
    durationSeconds: number;
  }) => Promise<SaveOutcome<{
    result: AssessmentResult;
    attempt: StoredAttempt;
    dropped: number;
    /** The per-question rollup the server computed from the same grading. */
    answers: AnswerAnalysis;
  }>>;
  /** Delete this account's history. Destructive — confirm before calling. */
  clear: () => Promise<SaveOutcome<number>>;
  setPreferences: (patch: Partial<Preferences>) => Promise<SaveOutcome<Preferences>>;
  /** Save the editable identity fields. An empty string clears a field. */
  setProfileDetails: (patch: Partial<Personal>) => Promise<SaveOutcome<Personal>>;
  markCourse: (update: {
    courseId: string;
    saved?: boolean;
    started?: boolean;
    completedModules?: number[];
    completedLessons?: string[];
  }) => Promise<SaveOutcome<CourseRecord>>;
  courseFor: (courseId: string) => CourseRecord | null;
};

const NOT_SIGNED_IN = 'Sign in to save this to your account.';

/**
 * Why the assessment needs more than a warning. The paper and its key live on the
 * server, so with nobody signed in there is nothing to sit — unlike a saved bookmark,
 * this cannot half-work locally and be kept later.
 */
const SIGN_IN_TO_SIT = 'Sign in to sit the assessment. The paper and its answer key stay on the server.';

/** How many attempts to keep in memory. Matches the server's inline history. */
const INLINE_HISTORY = 20;

/**
 * What useProgress returns with no provider above it: an idle store whose mutators
 * decline politely. An existing component that reads it still renders and simply
 * shows its sample content, which is what keeps demo mode working.
 */
const NO_PROVIDER: ProgressStore = {
  status: 'idle',
  problem: '',
  live: false,
  progress: emptyRollup(),
  preferences: defaultPreferences(),
  personal: defaultPersonal(),
  courses: [],
  history: [],
  refresh: async () => {},
  record: async () => ({ saved: false, reason: NOT_SIGNED_IN }),
  openAssessment: async () => ({ saved: false, reason: SIGN_IN_TO_SIT }),
  sitAssessment: async () => ({ saved: false, reason: SIGN_IN_TO_SIT }),
  clear: async () => ({ saved: false, reason: NOT_SIGNED_IN }),
  setPreferences: async () => ({ saved: false, reason: NOT_SIGNED_IN }),
  setProfileDetails: async () => ({ saved: false, reason: NOT_SIGNED_IN }),
  markCourse: async () => ({ saved: false, reason: NOT_SIGNED_IN }),
  courseFor: () => null,
};

export const ProgressContext = createContext<ProgressStore | null>(null);

export function ProgressProvider({ children }: { children: ReactNode }) {
  const session = useSession();
  const accountId = session.status === 'signed-in' ? (session.user?.id ?? null) : null;

  const [status, setStatus] = useState<ProgressStatus>('idle');
  const [problem, setProblem] = useState('');
  const [progress, setProgress] = useState<ProgressRollup>(emptyRollup);
  const [preferences, setPrefs] = useState<Preferences>(defaultPreferences);
  const [personal, setPersonal] = useState<Personal>(defaultPersonal);
  const [courses, setCourses] = useState<CourseRecord[]>([]);
  const [history, setHistory] = useState<StoredAttempt[]>([]);

  /**
   * Which load is allowed to write to state.
   *
   * Signing out and back in as somebody else fires a second load while the first
   * may still be in flight. Without this counter the slower response wins and one
   * learner sees another learner's numbers. Every setState below is gated on it.
   */
  const generation = useRef(0);

  const reset = useCallback(() => {
    setProgress(emptyRollup());
    setPrefs(defaultPreferences());
    setPersonal(defaultPersonal());
    setCourses([]);
    setHistory([]);
  }, []);

  const load = useCallback(async () => {
    if (!accountId) {
      generation.current += 1;
      reset();
      setProblem('');
      setStatus('idle');
      return;
    }

    generation.current += 1;
    const mine = generation.current;
    setStatus('loading');

    try {
      const bundle = await fetchProgress();
      if (generation.current !== mine) return;
      setProgress(bundle.progress);
      setPrefs(bundle.preferences);
      setPersonal(bundle.personal);
      setCourses(bundle.courses);
      setHistory(bundle.history);
      setProblem('');
      setStatus('ready');
    } catch (error) {
      if (generation.current !== mine) return;
      // A 401 here means the cookie expired between the session check and this
      // call. That is "nothing to show", not "the server is broken" — the session
      // provider will notice on its next check and send the learner to /login.
      const expired = error instanceof AuthError && error.status === 401;
      reset();
      setProblem(expired ? '' : error instanceof AuthError ? error.message : 'The progress API did not answer.');
      setStatus(expired ? 'idle' : 'unavailable');
    }
  }, [accountId, reset]);

  useEffect(() => {
    void load();
  }, [load]);

  /**
   * Wrap one write. Declines up front when nobody is signed in, and turns a thrown
   * transport error into the same `saved: false` shape, so no caller has to know
   * which of the two happened to show a sensible message.
   */
  const write = useCallback(
    async <T,>(run: () => Promise<T>): Promise<SaveOutcome<T>> => {
      if (!accountId) return { saved: false, reason: NOT_SIGNED_IN };
      try {
        return { saved: true, value: await run() };
      } catch (error) {
        if (error instanceof AuthError && error.status === 401) {
          return { saved: false, reason: 'Your session expired. Sign in again to save this.' };
        }
        return {
          saved: false,
          reason: error instanceof AuthError ? error.message : 'Could not save that. Try again.',
        };
      }
    },
    [accountId],
  );

  const record = useCallback<ProgressStore['record']>(
    (payload) =>
      write(async () => {
        const { attempt, dropped, progress: rollup } = await saveAttempt(payload);
        // The server's recomputed rollup, not the local one added to the old total.
        setProgress(rollup);
        setHistory((current) => [attempt, ...current].slice(0, INLINE_HISTORY));
        setStatus('ready');
        return { attempt, dropped };
      }),
    [write],
  );

  /**
   * Deal a paper. A read, not a write, but it goes through `write` for the same reason
   * the mutators do: "nobody is signed in" and "the server did not answer" then reach
   * the page as one `saved: false` with a sentence it can show.
   */
  const openAssessment = useCallback<ProgressStore['openAssessment']>(
    () => write(() => fetchAssessmentPaper()),
    [write],
  );

  const sitAssessment = useCallback<ProgressStore['sitAssessment']>(
    (submission) =>
      write(async () => {
        const { result, attempt, dropped, answers, progress: rollup } = await submitAssessment(submission);
        // Same discipline as `record`: adopt the rollup the server recomputed rather
        // than adding this sitting to the old total by hand.
        setProgress(rollup);
        setHistory((current) => [attempt, ...current].slice(0, INLINE_HISTORY));
        setStatus('ready');
        return { result, attempt, dropped, answers };
      }),
    [write],
  );

  const clear = useCallback<ProgressStore['clear']>(
    () =>
      write(async () => {
        const { removed, progress: rollup } = await clearHistory();
        setProgress(rollup);
        setHistory([]);
        return removed;
      }),
    [write],
  );

  const setPreferences = useCallback<ProgressStore['setPreferences']>(
    (patch) =>
      write(async () => {
        const { preferences: next } = await savePreferences(patch);
        setPrefs(next);
        return next;
      }),
    [write],
  );

  const setProfileDetails = useCallback<ProgressStore['setProfileDetails']>(
    (patch) =>
      write(async () => {
        const { personal: next } = await saveProfileDetails(patch);
        setPersonal(next);
        return next;
      }),
    [write],
  );

  const markCourse = useCallback<ProgressStore['markCourse']>(
    (update) =>
      write(async () => {
        const { course, courses: next } = await saveCourse(update);
        setCourses(next);
        return course;
      }),
    [write],
  );

  const courseFor = useCallback(
    (courseId: string) => courses.find((course) => course.courseId === courseId) ?? null,
    [courses],
  );

  const value = useMemo<ProgressStore>(
    () => ({
      status,
      problem,
      live: status === 'ready',
      progress,
      preferences,
      personal,
      courses,
      history,
      refresh: load,
      record,
      openAssessment,
      sitAssessment,
      clear,
      setPreferences,
      setProfileDetails,
      markCourse,
      courseFor,
    }),
    [
      status,
      problem,
      progress,
      preferences,
      personal,
      courses,
      history,
      load,
      record,
      openAssessment,
      sitAssessment,
      clear,
      setPreferences,
      setProfileDetails,
      markCourse,
      courseFor,
    ],
  );

  return <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>;
}

export function useProgress(): ProgressStore {
  return useContext(ProgressContext) ?? NO_PROVIDER;
}
