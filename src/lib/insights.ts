/**
 * The Dashboard's arithmetic, kept out of the page.
 *
 * Every figure the overview prints used to be a literal in the JSX — a 68.4 index, a
 * 12-day streak, 7.6 hours, a 42% latest score. Each one is now derived here from the
 * account's own rollup and its stored attempts, and lives in a library rather than in
 * the component for one practical reason: a page cannot be executed in this sandbox
 * (no browser, no Vite build) but a pure function can, so these are covered by
 * `npm run engine:test` instead of by a grep for the right-looking string.
 *
 * Two honest limits, stated here because they are invisible on screen:
 *
 * - `history` is the inline window the server sends (the newest 20 attempts, newest
 *   first). A streak or a monthly total computed from it can therefore *understate*
 *   a very busy account, never overstate it.
 * - Day boundaries are the browser's. The server stores UTC instants and does not know
 *   the learner's timezone, so weekday grouping happens here, in local time.
 *
 * `now` is a parameter on everything that needs the date so a test can pin it.
 */

import type { ProgressRollup, StoredAttempt } from '@/lib/progress';
import { type Band, type CompetencyId, bandLabels, competencyById } from '@/lib/topics';

/** Days in the rhythm chart. Seven, so every weekday appears exactly once. */
export const WEEK_DAYS = 7;

const WEEKDAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** Local calendar day, as a sortable key. Not an ISO instant: it has no timezone. */
function dayKey(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

function parsed(at: string): Date | null {
  const when = new Date(at);
  return Number.isNaN(when.getTime()) ? null : when;
}

function oneDecimal(value: number): number {
  return Math.round(value * 10) / 10;
}

export type DayBucket = {
  /** Local calendar day. */
  key: string;
  /** Mon, Tue … — the axis label. */
  name: string;
  hours: number;
  minutes: number;
  active: boolean;
};

/**
 * The last seven local days, oldest first, with the minutes actually spent on each.
 *
 * A rolling window rather than Monday-to-Sunday: on a Tuesday, "this week" would
 * otherwise mean two days, and the chart would look like a collapse in effort.
 */
export function weekBuckets(history: StoredAttempt[], now = new Date()): DayBucket[] {
  const minutes = new Map<string, number>();
  for (const attempt of history) {
    const when = parsed(attempt.at);
    if (!when) continue;
    const key = dayKey(when);
    minutes.set(key, (minutes.get(key) ?? 0) + Math.max(0, attempt.durationSeconds) / 60);
  }

  const buckets: DayBucket[] = [];
  for (let back = WEEK_DAYS - 1; back >= 0; back -= 1) {
    const day = new Date(now.getFullYear(), now.getMonth(), now.getDate() - back);
    const spent = minutes.get(dayKey(day)) ?? 0;
    buckets.push({
      key: dayKey(day),
      name: WEEKDAY_NAMES[day.getDay()],
      hours: oneDecimal(spent / 60),
      minutes: Math.round(spent),
      active: spent > 0,
    });
  }
  return buckets;
}

export function activeDays(buckets: DayBucket[]): number {
  return buckets.filter((bucket) => bucket.active).length;
}

export function bucketHours(buckets: DayBucket[]): number {
  return oneDecimal(buckets.reduce((sum, bucket) => sum + bucket.minutes, 0) / 60);
}

/** Distinct local days with at least one attempt, newest first. */
function practiceDays(history: StoredAttempt[]): string[] {
  const days = new Set<string>();
  for (const attempt of history) {
    const when = parsed(attempt.at);
    if (when) days.add(dayKey(when));
  }
  return [...days].sort().reverse();
}

function dayBefore(key: string, back: number): string {
  const [year, month, day] = key.split('-').map((part) => Number(part));
  return dayKey(new Date(year, month - 1, day - back));
}

export type Streak = { current: number; best: number };

/**
 * Consecutive days of practice: the run ending today, and the longest run in the window.
 *
 * A run that ended yesterday still counts as current, because otherwise every learner's
 * streak reads zero until they have practised that morning. A run that ended earlier
 * than that has ended.
 */
export function practiceStreak(history: StoredAttempt[], now = new Date()): Streak {
  const days = practiceDays(history);
  if (days.length === 0) return { current: 0, best: 0 };

  const today = dayKey(now);
  const yesterday = dayBefore(today, 1);

  let best = 1;
  let run = 1;
  for (let index = 1; index < days.length; index += 1) {
    run = days[index] === dayBefore(days[index - 1], 1) ? run + 1 : 1;
    best = Math.max(best, run);
  }

  const newest = days[0];
  if (newest !== today && newest !== yesterday) return { current: 0, best };

  let current = 1;
  for (let index = 1; index < days.length; index += 1) {
    if (days[index] !== dayBefore(days[index - 1], 1)) break;
    current += 1;
  }
  return { current, best };
}

export type MonthEffort = { minutes: number; hours: number; sittings: number };

/** What this calendar month holds. `hours` is what the metric card prints. */
export function monthEffort(history: StoredAttempt[], now = new Date()): MonthEffort {
  let seconds = 0;
  let sittings = 0;
  for (const attempt of history) {
    const when = parsed(attempt.at);
    if (!when) continue;
    if (when.getFullYear() !== now.getFullYear() || when.getMonth() !== now.getMonth()) continue;
    seconds += Math.max(0, attempt.durationSeconds);
    sittings += 1;
  }
  return { minutes: Math.round(seconds / 60), hours: oneDecimal(seconds / 3600), sittings };
}

export type Bar = { id: CompetencyId; name: string; score: number; band: Band; total: number };

/**
 * The competency chart, strongest first. Only competencies this account has answered
 * questions in: five bars where one is a guess is worse than three that are measured.
 */
export function competencyBars(progress: ProgressRollup): Bar[] {
  return progress.competencies
    .filter((row) => row.total > 0)
    .map((row) => ({
      id: row.id,
      name: competencyById(row.id).short,
      score: row.percent,
      band: row.band,
      total: row.total,
    }))
    .sort((left, right) => right.score - left.score);
}

/** '18 Sep', the format the activity list already used. */
export function shortDate(at: string | null): string {
  const when = at ? parsed(at) : null;
  return when ? `${when.getDate()} ${MONTH_NAMES[when.getMonth()]}` : '';
}

/** '18 Sep 2026', for "last measured". */
export function longDate(at: string | null): string {
  const when = at ? parsed(at) : null;
  return when ? `${when.getDate()} ${MONTH_NAMES[when.getMonth()]} ${when.getFullYear()}` : '';
}

export function quarterLabel(now = new Date()): string {
  return `Q${Math.floor(now.getMonth() / 3) + 1} ${now.getFullYear()}`;
}

/**
 * How the newest sitting compares with the one before it.
 *
 * Points, not percent: the difference between 42% and 61% is nineteen points, and
 * calling that "19% better" would be a different and wrong claim.
 */
export function lastDelta(history: StoredAttempt[]): string {
  if (history.length === 0) return 'Nothing measured yet';
  if (history.length === 1) return 'Your first sitting';
  const change = history[0].percent - history[1].percent;
  if (change === 0) return 'Level with your last sitting';
  return `${change > 0 ? '+' : '-'}${Math.abs(change)} pts since your last sitting`;
}

export type Trend = { label: string; up: boolean; direction: 'up' | 'down' | 'flat' | 'none' };

/** Newest against oldest in the window. `up: false` is not a failure, it is a fact. */
export function trend(history: StoredAttempt[]): Trend {
  if (history.length < 2) return { label: 'Not enough sittings to show a trend', up: false, direction: 'none' };
  const change = history[0].percent - history[history.length - 1].percent;
  if (change > 0) return { label: `Up ${change} pts across ${history.length} sittings`, up: true, direction: 'up' };
  if (change < 0) return { label: `Down ${Math.abs(change)} pts across ${history.length} sittings`, up: false, direction: 'down' };
  return { label: `Holding steady across ${history.length} sittings`, up: false, direction: 'flat' };
}

export type ActivityRow = {
  id: string;
  title: string;
  detail: string;
  date: string;
  tone: 'teal' | 'amber' | 'navy';
};

/** The recent-activity list: what was sat, how it went, when. */
export function activityRows(history: StoredAttempt[], limit = 3): ActivityRow[] {
  return history.slice(0, limit).map((attempt) => ({
    id: attempt.id,
    title: attempt.label || (attempt.source === 'assessment' ? 'Assessment' : 'Knowledge check'),
    detail: `${bandLabels[attempt.band]} · ${attempt.correct} of ${attempt.total} · ${attempt.percent}%`,
    date: shortDate(attempt.at),
    tone: attempt.band === 'strong' ? 'teal' : attempt.band === 'average' ? 'amber' : 'navy',
  }));
}

export type Signal = {
  headline: string;
  detail: string;
  actionLabel: string;
  href: string;
};

/**
 * The card that used to claim "your applied exercises score 18 points higher than
 * recall checks" — a comparison nothing in this build has ever measured.
 *
 * What replaces it is the widest real gap between two measured competencies, and a
 * button to add material for the weaker one. Null when there is nothing to
 * say yet; the page then shows its own empty variant rather than a hedged sentence.
 */
export function signal(progress: ProgressRollup): Signal | null {
  const bars = competencyBars(progress);
  if (bars.length === 0) return null;

  const strongest = bars[0];
  const weakest = bars[bars.length - 1];

  if (bars.length === 1 || strongest.score === weakest.score) {
    return {
      headline: `Your practice sits at ${strongest.score}% so far.`,
      detail: `Measured on ${strongest.total} question${strongest.total === 1 ? '' : 's'} in ${bars.length === 1 ? strongest.name : `${bars.length} competencies`}. More material widens the picture rather than confirming it.`,
      actionLabel: 'Add material',
      href: '/materials',
    };
  }

  return {
    headline: `Your practice is strongest in ${strongest.name}.`,
    detail: `${strongest.name} is at ${strongest.score}% and ${weakest.name} at ${weakest.score}% — a ${strongest.score - weakest.score} point gap. Work on ${weakest.name} moves your index the most.`,
    actionLabel: `Practise ${weakest.name}`,
    href: '/materials',
  };
}

/**
 * The sentence in the strip at the top of the overview. One job: say what the numbers
 * below mean, including when there are none.
 */
export function dashboardNote(progress: ProgressRollup): string {
  if (progress.attempts === 0) {
    return 'Nothing is measured yet. Take your first assessment to generate your learning profile.';
  }
  const weakest = progress.focus[0];
  if (weakest) {
    const short = competencyById(weakest.id).short;
    return `${short} is your weakest measured competency at ${weakest.percent}% (${bandLabels[weakest.band].toLowerCase()}). Add material there to strengthen it.`;
  }
  return `Nothing sits in the weak band across ${progress.questions} answered question${progress.questions === 1 ? '' : 's'}. New material will test that rather than confirm it.`;
}
