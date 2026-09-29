import { type MaterialQuestion } from './materials';
import {
  type Band,
  type CompetencyId,
  bandFor,
  classifyTopic,
  competencyById,
  competencies,
} from './topics';

export type Choice = number | null;

export type TopicScore = {
  topic: string;
  competency: CompetencyId | null;
  correct: number;
  total: number;
  percent: number;
  band: Band;
  missed: number[];
};

export type CompetencyScore = {
  id: CompetencyId;
  name: string;
  short: string;
  correct: number;
  total: number;
  percent: number;
  band: Band;
};

export type AttemptResult = {
  total: number;
  answered: number;
  skipped: number;
  correct: number;
  percent: number;
  band: Band;
  topics: TopicScore[];
  competencies: CompetencyScore[];
  strong: TopicScore[];
  average: TopicScore[];
  weak: TopicScore[];
  focus: TopicScore[];
};

const bandRank: Record<Band, number> = {
  'needs-work': 0,
  average: 1,
  unrated: 2,
  strong: 3,
};

export function compareTopics(a: TopicScore, b: TopicScore): number {
  return bandRank[a.band] - bandRank[b.band] || a.percent - b.percent || a.topic.localeCompare(b.topic);
}

function percentOf(correct: number, total: number) {
  if (total <= 0) return 0;
  return Math.round((correct / total) * 100);
}

export function gradeAttempt(questions: MaterialQuestion[], chosen: Choice[]): AttemptResult {
  const total = questions.length;
  let correct = 0;
  let answered = 0;

  type Bucket = {
    correct: number;
    total: number;
    missed: number[];
    context: string[];
    declared: Set<CompetencyId>;
  };
  const byTopic = new Map<string, Bucket>();

  questions.forEach((question, index) => {
    const pick = chosen[index] ?? null;
    const isCorrect = pick !== null && pick === question.correct;
    if (pick !== null) answered += 1;
    if (isCorrect) correct += 1;

    const bucket =
      byTopic.get(question.topic) ??
      { correct: 0, total: 0, missed: [], context: [], declared: new Set<CompetencyId>() };
    bucket.total += 1;
    if (isCorrect) bucket.correct += 1;
    else bucket.missed.push(index);
    bucket.context.push(question.source);
    if (question.competency) bucket.declared.add(question.competency);
    byTopic.set(question.topic, bucket);
  });

  const topics: TopicScore[] = [...byTopic.entries()]
    .map(([topic, bucket]) => ({
      topic,
      competency: competencyFor(topic, bucket.declared, bucket.context),
      correct: bucket.correct,
      total: bucket.total,
      percent: percentOf(bucket.correct, bucket.total),
      band: bandFor(percentOf(bucket.correct, bucket.total), bucket.total),
      missed: bucket.missed,
    }))
    .sort(compareTopics);

  return {
    total,
    answered,
    skipped: total - answered,
    correct,
    percent: percentOf(correct, total),
    band: bandFor(percentOf(correct, total), total),
    topics,
    competencies: rollUpCompetencies(topics),
    strong: topics.filter((item) => item.band === 'strong'),
    average: topics.filter((item) => item.band === 'average'),
    weak: topics.filter((item) => item.band === 'needs-work'),
    focus: topics.filter((item) => item.band === 'needs-work' || item.band === 'average'),
  };
}

function competencyFor(
  topic: string,
  declared: Set<CompetencyId>,
  context: string[],
): CompetencyId | null {
  if (declared.size === 1) {
    const [only] = declared;
    return only;
  }
  return classifyTopic(topic, context.join(' '));
}

export function rollUpCompetencies(topics: TopicScore[]): CompetencyScore[] {
  const totals = new Map<CompetencyId, { correct: number; total: number }>();
  for (const topic of topics) {
    if (!topic.competency) continue;
    const entry = totals.get(topic.competency) ?? { correct: 0, total: 0 };
    entry.correct += topic.correct;
    entry.total += topic.total;
    totals.set(topic.competency, entry);
  }

  return competencies
    .filter((competency) => totals.has(competency.id))
    .map((competency) => {
      const entry = totals.get(competency.id) ?? { correct: 0, total: 0 };
      const percent = percentOf(entry.correct, entry.total);
      return {
        id: competency.id,
        name: competency.name,
        short: competency.short,
        correct: entry.correct,
        total: entry.total,
        percent,
        band: bandFor(percent, entry.total),
      };
    })
    .sort((a, b) => a.percent - b.percent || a.name.localeCompare(b.name));
}

export function describeAttempt(result: AttemptResult): string {
  if (result.total === 0) return 'No questions were generated from this material.';

  const parts = [`You answered ${result.correct} of ${result.total} correctly.`];
  if (result.skipped > 0) {
    parts.push(`${result.skipped} ${result.skipped === 1 ? 'question was' : 'questions were'} left unanswered.`);
  }

  if (result.weak.length > 0) {
    parts.push(`Weakest: ${listTopics(result.weak)}.`);
  } else if (result.average.length > 0) {
    parts.push(`Worth another look: ${listTopics(result.average)}.`);
  } else if (result.strong.length > 0) {
    parts.push('Every topic in this material came out strong.');
  }
  return parts.join(' ');
}

function listTopics(scores: TopicScore[]): string {
  const names = scores.slice(0, 3).map((item) => item.topic);
  if (names.length <= 1) return names.join('');
  if (names.length === 2) return `${names[0]} and ${names[1]}`;
  return `${names[0]}, ${names[1]} and ${names[2]}`;
}

export type AttemptPayload = {
  source: 'material' | 'assessment';
  label: string;
  total: number;
  correct: number;
  percent: number;
  band: Band;
  durationSeconds: number;
  topics: Array<{ topic: string; competency: CompetencyId | null; correct: number; total: number; band: Band }>;
  competencyPercents: Partial<Record<CompetencyId, number>>;
};

export function toAttemptPayload(
  result: AttemptResult,
  meta: { source: AttemptPayload['source']; label: string; durationSeconds: number },
): AttemptPayload {
  const competencyPercents: Partial<Record<CompetencyId, number>> = {};
  for (const entry of result.competencies) competencyPercents[entry.id] = entry.percent;

  return {
    source: meta.source,
    label: meta.label.slice(0, 120),
    total: result.total,
    correct: result.correct,
    percent: result.percent,
    band: result.band,
    durationSeconds: Math.max(0, Math.round(meta.durationSeconds)),
    topics: result.topics.map((item) => ({
      topic: item.topic.slice(0, 80),
      competency: item.competency,
      correct: item.correct,
      total: item.total,
      band: item.band,
    })),
    competencyPercents,
  };
}

export function competencyLabel(id: CompetencyId): string {
  return competencyById(id).name;
}
