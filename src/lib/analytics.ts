import { API_URL } from './auth';

export type PerformanceStatus = 'strong' | 'good' | 'needs-improvement' | 'weak' | 'unrated';

export type PerformanceScale = {
  levels: { id: PerformanceStatus; min: number; label: string }[];
  minQuestions: number;
  unratedId: string;
  unratedLabel: string;
};

export type TopicScore = {
  name: string;
  score: number;
  status: PerformanceStatus;
  correct: number;
  questionsAttempted: number;
  lastSeenAt: string | null;
};

export type PriorityInputs = {
  priority: number;
  gap: number;
  weakness: number;
  confidence: number;
  formula: string;
};

export type CompetencyRow = {
  competency: string;
  name: string;
  currentScore: number;
  requiredScore: number;
  gap: number;
  status: PerformanceStatus;
  correct: number;
  questionsAttempted: number;
  attempts: number;
  priority: number;
  priorityInputs: PriorityInputs;
  topics: TopicScore[];
};

export type GapRow = {
  competency: string;
  name: string;
  currentScore: number;
  requiredScore: number;
  gap: number;
  status: PerformanceStatus;
  questionsAttempted: number;
};

export type PriorityRow = {
  competency: string;
  name: string;
  priority: number;
  inputs: PriorityInputs;
  weakestTopic: string | null;
  reason: string;
};

export type TrendPoint = {
  id: string;
  at: string;
  label: string;
  source: string;
  percent: number;
  correct: number;
  questionsAttempted: number;
  status: PerformanceStatus;
};

export type RequirementSource = {
  id: string;
  label: string;
  note: string;
  envVar: string;
  custom: boolean;
  targets: Record<string, number>;
};

export type CompetencyAnalytics = {
  scope: 'all' | 'latest';
  generatedAt: string;
  measured: boolean;
  attempts: number;
  attemptsStored: number;
  latestAttemptAt: string | null;
  overall: { correct: number; questionsAttempted: number; score: number; status: PerformanceStatus };
  scale: PerformanceScale;
  requirement: RequirementSource;
  competencies: CompetencyRow[];
  unmeasured: { competency: string; name: string; requiredScore: number }[];
  strengths: CompetencyRow[];
  good: CompetencyRow[];
  needsImprovement: CompetencyRow[];
  weaknesses: CompetencyRow[];
  unrated: CompetencyRow[];
  gaps: GapRow[];
  priorities: PriorityRow[];
  unclassifiedTopics: { name: string; score: number; status: PerformanceStatus; correct: number; questionsAttempted: number }[];
  trend: TrendPoint[];
};

export type AnswerAnalysis = {
  total: number;
  attempted: number;
  unanswered: number;
  correct: number;
  incorrect: number;
  accuracy: number;
  topics: {
    topic: string;
    competency: string | null;
    correct: number;
    incorrect: number;
    unanswered: number;
    total: number;
    missed: string[];
    percent: number;
  }[];
  mostProblematicTopic: {
    topic: string;
    competency: string | null;
    correct: number;
    incorrect: number;
    unanswered: number;
    total: number;
    missed: string[];
    percent: number;
  } | null;
};

export type Explanation = {
  paragraphs: string[];
  text: string;
  provider: string;
  attempts: number;
};

export class AnalyticsError extends Error {
  code: string;
  status: number;
  analytics: CompetencyAnalytics | null;

  constructor(
    message: string,
    options: { code?: string; status?: number; analytics?: CompetencyAnalytics | null } = {},
  ) {
    super(message);
    this.name = 'AnalyticsError';
    this.code = options.code ?? 'analytics_error';
    this.status = options.status ?? 0;
    this.analytics = options.analytics ?? null;
  }
}

type ErrorBody = {
  ok?: boolean;
  error?: { code?: string; message?: string };
  analytics?: CompetencyAnalytics;
};

async function request<T>(path: string, init: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, { credentials: 'include', ...init });
  } catch {
    throw new AnalyticsError(
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

  if (!response.ok || (payload as ErrorBody)?.ok !== true) {
    const body = (payload ?? {}) as ErrorBody;
    const code = body.error?.code ?? (response.status === 401 ? 'unauthorized' : 'analytics_error');
    const message = body.error?.message
      ?? (response.status === 401 ? 'Sign in to see your competency analysis.' : 'That did not work. Please try again.');
    throw new AnalyticsError(message, { code, status: response.status, analytics: body.analytics ?? null });
  }

  return payload as T;
}

export async function fetchCompetencyAnalytics(
  scope: 'all' | 'latest' = 'all',
): Promise<CompetencyAnalytics> {
  const query = scope === 'all' ? '' : `?scope=${encodeURIComponent(scope)}`;
  const body = await request<{ analytics: CompetencyAnalytics }>(`/api/analytics/competencies${query}`, {
    method: 'GET',
  });
  return body.analytics;
}

export async function explainAnalytics(scope: 'all' | 'latest' = 'all'): Promise<Explanation> {
  const query = scope === 'all' ? '' : `?scope=${encodeURIComponent(scope)}`;
  const body = await request<{ explanation: Explanation }>(`/api/analytics/explain${query}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });
  return body.explanation;
}

export type RecommendedCourse = {
  courseId: string;
  title: string;
  provider: string;
  category: string;
  level: string;
  estimatedHours: number | null;
  lessons: number;
  modules: number;
  matchedTags: string[];
  forCompetency: string;
  forCompetencyName: string;
  reason: string;
};

export type RecommendationGroup = {
  competency: string;
  name: string;
  gap: number;
  currentScore: number;
  requiredScore: number;
  priority: number;
  courses: RecommendedCourse[];
};

export type CourseRecommendations = {
  available: boolean;
  measured: boolean;
  hasGaps: boolean;
  groups: RecommendationGroup[];
  courses: RecommendedCourse[];
  note: string | null;
};

export async function fetchRecommendedCourses(
  scope: 'all' | 'latest' = 'all',
): Promise<CourseRecommendations> {
  const query = scope === 'all' ? '' : `?scope=${encodeURIComponent(scope)}`;
  const body = await request<{ recommendations: CourseRecommendations }>(
    `/api/analytics/recommended-courses${query}`,
    { method: 'GET' },
  );
  return body.recommendations;
}

const FALLBACK_LABELS: Record<PerformanceStatus, string> = {
  strong: 'Strong',
  good: 'Good',
  'needs-improvement': 'Needs improvement',
  weak: 'Weak',
  unrated: 'Not enough questions',
};

export function statusLabel(status: PerformanceStatus, scale?: PerformanceScale): string {
  if (status === 'unrated') return scale?.unratedLabel ?? FALLBACK_LABELS.unrated;
  const level = scale?.levels.find((entry) => entry.id === status);
  return level?.label ?? FALLBACK_LABELS[status] ?? status;
}

export const statusTones: Record<PerformanceStatus, 'teal' | 'amber' | 'coral' | 'neutral'> = {
  strong: 'teal',
  good: 'teal',
  'needs-improvement': 'amber',
  weak: 'coral',
  unrated: 'neutral',
};

export const statusColors: Record<PerformanceStatus, string> = {
  strong: '#2f7d75',
  good: '#5b9c80',
  'needs-improvement': '#c49743',
  weak: '#b5584c',
  unrated: '#9aa7b1',
};

export function questionCountLabel(count: number): string {
  return `${count} question${count === 1 ? '' : 's'}`;
}
