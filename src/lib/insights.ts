import type { ProgressRollup, StoredAttempt } from '@/lib/progress';
import { type Band, type CompetencyId, bandLabels, competencyById } from '@/lib/topics';

export const WEEK_DAYS = 7;

const WEEKDAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

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
  key: string;
  name: string;
  hours: number;
  minutes: number;
  active: boolean;
};

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

export function shortDate(at: string | null): string {
  const when = at ? parsed(at) : null;
  return when ? `${when.getDate()} ${MONTH_NAMES[when.getMonth()]}` : '';
}

export function longDate(at: string | null): string {
  const when = at ? parsed(at) : null;
  return when ? `${when.getDate()} ${MONTH_NAMES[when.getMonth()]} ${when.getFullYear()}` : '';
}

export function quarterLabel(now = new Date()): string {
  return `Q${Math.floor(now.getMonth() / 3) + 1} ${now.getFullYear()}`;
}

export function lastDelta(history: StoredAttempt[]): string {
  if (history.length === 0) return 'Nothing measured yet';
  if (history.length === 1) return 'Your first sitting';
  const change = history[0].percent - history[1].percent;
  if (change === 0) return 'Level with your last sitting';
  return `${change > 0 ? '+' : '-'}${Math.abs(change)} pts since your last sitting`;
}

export type Trend = { label: string; up: boolean; direction: 'up' | 'down' | 'flat' | 'none' };

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
