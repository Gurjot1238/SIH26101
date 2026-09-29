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

export type SaveOutcome<T> = { saved: true; value: T } | { saved: false; reason: string };

export type ProgressStore = {
  status: ProgressStatus;
  problem: string;
  live: boolean;
  progress: ProgressRollup;
  preferences: Preferences;
  personal: Personal;
  courses: CourseRecord[];
  history: StoredAttempt[];
  refresh: () => Promise<void>;
  record: (payload: AttemptPayload) => Promise<SaveOutcome<{ attempt: StoredAttempt; dropped: number }>>;
  openAssessment: () => Promise<SaveOutcome<SealedPaper>>;
  sitAssessment: (submission: {
    choices: Array<{ question: string; option: string | null }>;
    durationSeconds: number;
  }) => Promise<SaveOutcome<{
    result: AssessmentResult;
    attempt: StoredAttempt;
    dropped: number;
    answers: AnswerAnalysis;
  }>>;
  clear: () => Promise<SaveOutcome<number>>;
  setPreferences: (patch: Partial<Preferences>) => Promise<SaveOutcome<Preferences>>;
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

const SIGN_IN_TO_SIT = 'Sign in to sit the assessment. The paper and its answer key stay on the server.';

const INLINE_HISTORY = 20;

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
      const expired = error instanceof AuthError && error.status === 401;
      reset();
      setProblem(expired ? '' : error instanceof AuthError ? error.message : 'The progress API did not answer.');
      setStatus(expired ? 'idle' : 'unavailable');
    }
  }, [accountId, reset]);

  useEffect(() => {
    void load();
  }, [load]);

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
        setProgress(rollup);
        setHistory((current) => [attempt, ...current].slice(0, INLINE_HISTORY));
        setStatus('ready');
        return { attempt, dropped };
      }),
    [write],
  );

  const openAssessment = useCallback<ProgressStore['openAssessment']>(
    () => write(() => fetchAssessmentPaper()),
    [write],
  );

  const sitAssessment = useCallback<ProgressStore['sitAssessment']>(
    (submission) =>
      write(async () => {
        const { result, attempt, dropped, answers, progress: rollup } = await submitAssessment(submission);
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
