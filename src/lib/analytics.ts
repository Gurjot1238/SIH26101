/**
 * The browser client for competency analytics.
 *
 * Nothing in this file calculates a score, a band, a gap or a priority. Every number it
 * describes was computed by `server/competency.mjs` from stored attempts and arrived over
 * the wire. What lives here is the shape of that payload, two fetches, and the mapping
 * from a status the server chose to a colour this design already uses.
 *
 * That split is deliberate and it is the reason the endpoint exists. A percentage worked
 * out in a component is a second implementation of the scoring rule, and it is the one
 * nobody tests — so the day the two disagree, the wrong number is the one on screen.
 *
 * The four-level scale here (`strong | good | needs-improvement | weak`) is additive. The
 * three `Band` values in `./topics` are untouched and every screen already using them
 * still reads the same words it did before.
 */

import { API_URL } from './auth';

/* --------------------------------------------------------------- the payload */

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
  /** Always present, always shown. "0%" off one question is not the same claim as "0%" off ten. */
  questionsAttempted: number;
  lastSeenAt: string | null;
};

export type PriorityInputs = {
  priority: number;
  gap: number;
  weakness: number;
  confidence: number;
  /** The formula in words, carried with the number so the ranking can be checked. */
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

/**
 * Where the target levels come from.
 *
 * `custom: false` means these are NEXORA AI's own defaults, shipped so the gap chart has
 * something to draw. The page prints `label` next to the chart for exactly that reason:
 * an unlabelled "required level" reads as an official standard, and it is not one until
 * an operator sets COMPETENCY_TARGETS.
 */
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

/** The per-question rollup that rides along with a submission. */
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
  /** Null on a clean paper. The screen says so rather than naming a winner. */
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

/* ----------------------------------------------------------------- transport */

export class AnalyticsError extends Error {
  code: string;
  status: number;
  /** Present on a failed explain: the charts are still drawable, so the page keeps them. */
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

/**
 * The competency analysis for the signed-in account.
 *
 * `scope: 'latest'` analyses the newest sitting alone; the trend still covers the whole
 * history either way. A brand-new account gets a valid payload with `measured: false`
 * rather than an error, so the empty state is drawn from the same shape as everything else.
 */
export async function fetchCompetencyAnalytics(
  scope: 'all' | 'latest' = 'all',
): Promise<CompetencyAnalytics> {
  const query = scope === 'all' ? '' : `?scope=${encodeURIComponent(scope)}`;
  const body = await request<{ analytics: CompetencyAnalytics }>(`/api/analytics/competencies${query}`, {
    method: 'GET',
  });
  return body.analytics;
}

/**
 * Ask the server's AI provider to explain those numbers in prose.
 *
 * Sends no body. The server rebuilds the analysis from stored attempts and shows the
 * model that — anything posted from here could only weaken the guarantee that the
 * figures in the paragraph are the figures in the charts.
 *
 * Throws `AnalyticsError` with `code: 'not_configured'` when no provider key is set, and
 * `code: 'unverified'` when the model wrote a figure the server did not calculate. In
 * both cases `error.analytics` still carries the analysis, because the charts never
 * needed the model.
 */
export async function explainAnalytics(scope: 'all' | 'latest' = 'all'): Promise<Explanation> {
  const query = scope === 'all' ? '' : `?scope=${encodeURIComponent(scope)}`;
  const body = await request<{ explanation: Explanation }>(`/api/analytics/explain${query}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });
  return body.explanation;
}

/* ----------------------------------------------- gap-driven recommendations */

/** One recommended course, with the gap it addresses and why it was chosen. */
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

/** Recommendations grouped under one gap competency, worst-gap first. */
export type RecommendationGroup = {
  competency: string;
  name: string;
  gap: number;
  currentScore: number;
  requiredScore: number;
  priority: number;
  courses: RecommendedCourse[];
};

/**
 * Real dataset courses to open next, chosen from the account's measured gaps.
 *
 * Always a complete shape, never an error for the empty cases: `available` is false
 * when no course dataset is loaded, `measured` is false before the first assessment,
 * and `hasGaps` is false when no open gap can be matched to a course. The `note`
 * explains which of those it is, so the page draws its empty state from the payload.
 */
export type CourseRecommendations = {
  available: boolean;
  measured: boolean;
  hasGaps: boolean;
  groups: RecommendationGroup[];
  courses: RecommendedCourse[];
  note: string | null;
};

/**
 * Fetch the account's gap-driven course recommendations.
 *
 * `scope: 'latest'` derives the gaps (and therefore the courses) from the newest sitting
 * alone, so the Knowledge check page can recommend only for the assessment just taken;
 * `'all'` (the default, used on the Dashboard) ranks gaps across the whole history.
 *
 * Session-guarded server-side (it reads the learner's private results). A signed-out
 * or brand-new account does not throw here for the "nothing yet" cases — those come
 * back as a valid payload with `measured: false`; only a real transport or auth
 * failure raises `AnalyticsError`.
 */
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

/* --------------------------------------------------------------- presentation */

/**
 * The words for a status.
 *
 * Read from the scale the server sent, so the thresholds and their names stay in one
 * place. The fallback map exists only for a payload that predates the scale field; it is
 * not a second source of truth and nothing should be added to it that the server does
 * not also know.
 */
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

/**
 * The colour for a status, reusing the four tones the rest of the app already uses. Four
 * statuses share three tones: `good` and `needs-improvement` are both amber-ish in the
 * existing palette, so `good` takes teal's lighter partner rather than a fifth colour
 * being invented for this one screen.
 */
export const statusTones: Record<PerformanceStatus, 'teal' | 'amber' | 'coral' | 'neutral'> = {
  strong: 'teal',
  good: 'teal',
  'needs-improvement': 'amber',
  weak: 'coral',
  unrated: 'neutral',
};

/** Bar and dot colours, the same hex values `bandColors` uses in ./topics. */
export const statusColors: Record<PerformanceStatus, string> = {
  strong: '#2f7d75',
  good: '#5b9c80',
  'needs-improvement': '#c49743',
  weak: '#b5584c',
  unrated: '#9aa7b1',
};

/**
 * "12 questions" / "1 question". Small, but it is the sentence §18 is about: a topic
 * score is meaningless without the count it was measured over, so the count travels with
 * the score everywhere it is printed.
 */
export function questionCountLabel(count: number): string {
  return `${count} question${count === 1 ? '' : 's'}`;
}
