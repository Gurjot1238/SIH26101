/**
 * Turning a set of answers into a per-topic report.
 *
 * The request this file answers is "based on result of that 10 mcq tell user their
 * score based on topics like this one good this one average". So the interesting
 * output is not the total — it is the breakdown, and the breakdown has to be honest
 * about how thin the evidence is. Two rules do most of that work:
 *
 *   1. A topic with fewer than `MIN_QUESTIONS_FOR_BAND` questions is reported as
 *      `unrated`, not as weak. One wrong answer is not a diagnosis.
 *   2. A skipped question counts as wrong for the score but is counted separately,
 *      so the report can say "you left three unanswered" instead of "you scored 40%".
 *
 * Nothing here knows about React, the server, or the document text. It takes
 * questions and answers and returns numbers, which is what makes it testable from
 * plain Node.
 */

import { type MaterialQuestion } from './materials';
import {
  type Band,
  type CompetencyId,
  bandFor,
  classifyTopic,
  competencyById,
  competencies,
} from './topics';

/** What the learner picked, per question. `null` means they moved on without answering. */
export type Choice = number | null;

export type TopicScore = {
  topic: string;
  /** Which competency this topic was filed under, or null when the keywords did not match. */
  competency: CompetencyId | null;
  correct: number;
  total: number;
  /** 0-100, rounded. Zero questions reports 0 and a band of `unrated`. */
  percent: number;
  band: Band;
  /** Indexes into the question list, for revision passages and a targeted re-quiz. */
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
  /** Every topic the paper covered, worst first. */
  topics: TopicScore[];
  /** Only the competencies this paper actually tested. */
  competencies: CompetencyScore[];
  /** Convenience slices of `topics`, same objects. */
  strong: TopicScore[];
  average: TopicScore[];
  weak: TopicScore[];
  /** What to revise: weak first, then average. Empty when everything is strong. */
  focus: TopicScore[];
};

/** Worst first, and "not enough questions" sits after the real bands rather than leading. */
const bandRank: Record<Band, number> = {
  'needs-work': 0,
  average: 1,
  unrated: 2,
  strong: 3,
};

/**
 * The order topics are reported in: worst band first, then worst percent, then by name
 * so two identical scores do not swap places between renders. Exported because the
 * assessment adopts the server's per-topic numbers after grading and has to re-sort
 * with the same rule rather than a second one that looks similar.
 */
export function compareTopics(a: TopicScore, b: TopicScore): number {
  return bandRank[a.band] - bandRank[b.band] || a.percent - b.percent || a.topic.localeCompare(b.topic);
}

function percentOf(correct: number, total: number) {
  if (total <= 0) return 0;
  return Math.round((correct / total) * 100);
}

/**
 * Grade one attempt.
 *
 * `chosen` is index-aligned with `questions`; a shorter array is treated as the
 * remaining questions being unanswered, so a half-finished quiz still grades.
 */
export function gradeAttempt(questions: MaterialQuestion[], chosen: Choice[]): AttemptResult {
  const total = questions.length;
  let correct = 0;
  let answered = 0;

  type Bucket = {
    correct: number;
    total: number;
    missed: number[];
    context: string[];
    /** Competencies the questions themselves declared. See `competencyFor` below. */
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
    // The source sentence is the evidence `classifyTopic` needs: "Basket" alone is
    // ambiguous, the sentence it came from usually is not.
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

/**
 * Which competency a topic belongs to: what the questions declared, or failing that, the
 * keyword guess.
 *
 * A generated question's topic came out of a PDF, so the only way to place it in the
 * framework is `classifyTopic`, which matches keywords and answers null when it is not
 * confident. A curated question was written *for* a competency, so it says which one, and
 * a guess should not be allowed to overrule a fact — "Review and sign-off" contains no
 * leadership keyword and would otherwise fall out of the report entirely.
 *
 * The set is used rather than the first value so that a disagreement is visible instead of
 * silently resolved by ordering. Two questions filed under one topic but declaring
 * different competencies means the paper is wrong about one of them, so neither claim is
 * trusted and the keyword pass decides.
 */
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

/**
 * Add the topic scores up into the five framework competencies.
 *
 * Only competencies the paper actually touched are returned. A document about price
 * indices says nothing about team leadership, and reporting leadership as 0% because
 * it was never asked about would be a lie the Dashboard would then repeat.
 */
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

/**
 * One plain sentence for the top of the result screen, in the learner's own words
 * rather than assessment jargon. Deliberately does not congratulate or scold.
 */
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

/**
 * The shape sent to the server and stored per account.
 *
 * Topic names and counts only — never the document text, never the questions. The
 * PDF is read in the browser tab and stays there, and this is the file that has to
 * keep that true. `competencyPercents` is precomputed so the Dashboard can render a
 * history without regrading anything.
 */
export type AttemptPayload = {
  source: 'material' | 'assessment';
  /** What the learner uploaded, for their own history. No path, no contents. */
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

/** Long form of a competency id, for callers that only kept the id. */
export function competencyLabel(id: CompetencyId): string {
  return competencyById(id).name;
}
