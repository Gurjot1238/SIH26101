import { API_URL, AuthError } from './auth';
import { type AnswerAnalysis } from './analytics';
import { type AssessmentResult, type SealedPaper } from './assessment';
import { type AttemptPayload } from './scoring';
import { type Band, type CompetencyId } from './topics';

export const LANGUAGES = ['English', 'Hindi', 'Kannada'] as const;
export type Language = (typeof LANGUAGES)[number];

export type CompetencyRollup = {
  id: CompetencyId;
  correct: number;
  total: number;
  percent: number;
  band: Band;
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
  focus: CompetencyRollup[];
};

export type Preferences = {
  language: Language;
  weeklyNote: boolean;
  demoLabels: boolean;
  notify: boolean;
};

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
  completedModules: number[];
  completedLessons: string[];
  updatedAt: string | null;
};

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
  history: StoredAttempt[];
};

export type HistoryPage = {
  attempts: StoredAttempt[];
  total: number;
  limit: number;
};

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

type Failure = { ok: false; error: { code: string; message: string; fields?: Record<string, string> } };

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

export function fetchProgress(): Promise<ProgressBundle> {
  return request<ProgressBundle>('GET', '/api/progress');
}

export function saveAttempt(
  payload: AttemptPayload,
): Promise<{ attempt: StoredAttempt; dropped: number; progress: ProgressRollup }> {
  return request('POST', '/api/progress/attempts', payload);
}

export function fetchHistory(limit?: number): Promise<HistoryPage> {
  const query = limit === undefined ? '' : `?limit=${encodeURIComponent(String(limit))}`;
  return request<HistoryPage>('GET', `/api/progress/attempts${query}`);
}

export function clearHistory(): Promise<{ removed: number; progress: ProgressRollup }> {
  return request('DELETE', '/api/progress/attempts');
}

export function savePreferences(patch: Partial<Preferences>): Promise<{ preferences: Preferences }> {
  return request('POST', '/api/progress/preferences', patch);
}

export function saveProfileDetails(patch: Partial<Personal>): Promise<{ personal: Personal }> {
  return request('POST', '/api/progress/profile', patch);
}

export function saveCourse(update: {
  courseId: string;
  saved?: boolean;
  started?: boolean;
  completedModules?: number[];
  completedLessons?: string[];
}): Promise<{ course: CourseRecord; courses: CourseRecord[] }> {
  return request('POST', '/api/progress/courses', update);
}

export async function fetchAssessmentPaper(): Promise<SealedPaper> {
  const body = await request<{ paper: SealedPaper }>('GET', '/api/assessment/paper');
  return body.paper;
}

export function submitAssessment(submission: {
  choices: Array<{ question: string; option: string | null }>;
  durationSeconds: number;
}): Promise<{
  result: AssessmentResult;
  attempt: StoredAttempt;
  dropped: number;
  progress: ProgressRollup;
  answers: AnswerAnalysis;
}> {
  return request('POST', '/api/assessment/submit', submission);
}
