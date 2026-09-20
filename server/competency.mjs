/**
 * Competency analytics: what the learner's own answers say about them.
 *
 * `progress.mjs` already computes the rollup the Dashboard has always drawn — per
 * topic, per competency, banded. This file does not repeat that. It sits on top and
 * answers the questions the rollup cannot:
 *
 *   how far below the target level is each competency, and by how many points
 *   which topics underneath a competency are dragging it down
 *   what should be learned next, in an order that can be recomputed by hand
 *
 * Everything here is a pure function of stored attempts. Nothing is invented, and a
 * competency the paper never asked about is reported as unmeasured rather than as 0%
 * — reporting a zero for a question that was never put would be a lie the chart would
 * then repeat.
 *
 *   The hierarchy, and a naming note
 *
 * This project has two levels, not three:
 *
 *   competency   the five framework areas in src/lib/topics.ts — the top level
 *   topic        what a question actually measured, from the uploaded document or
 *                from the assessment section — the level underneath
 *
 * A specification written against a different product may call these "topic" and
 * "subtopic". The mapping is exact: this file's `competency` is that "topic", and
 * this file's `topic` is that "subtopic". A third level is not invented here, because
 * no question in this build carries a third label and a chart drawn from a label
 * nothing produces would be decoration.
 *
 *   Where the thresholds live
 *
 * `PERFORMANCE_SCALE` below is the only place the four cut-offs are written. The
 * server computes the status string and sends it to the browser, so no page has to
 * know that 80 means strong — it maps a status to a colour and a label and nothing
 * else. Changing a threshold is a one-line edit here, with no client change at all.
 *
 * This is deliberately a *second, additive* scale. `bandFor` in progress.mjs keeps its
 * three bands and its exact thresholds, because those bands are already printed on the
 * quiz report and the activity list; changing them would silently relabel every screen
 * in the app. Both scales read the same two numbers, so they cannot contradict each
 * other about the arithmetic — only about how coarsely it is described.
 *
 *   Where the targets come from, honestly
 *
 * `DEFAULT_TARGETS` is NEXORA AI's own configurable demonstration dataset. It is not
 * an MoSPI, FRAC or iGOT Karmayogi requirement, no part of this build has ever been
 * given one, and `REQUIREMENT_SOURCE.note` says so wherever the gap chart appears.
 * Set `COMPETENCY_TARGETS` in server/.env to override it without touching code.
 */

import { COMPETENCY_IDS, percentOf } from './progress.mjs';

/**
 * Readable names for the five ids, needed because the AI explanation and the gap
 * chart both read better with words than with slugs. A second copy of what
 * `src/lib/topics.ts` owns — guarded by `server/taxonomy-check.mjs`, which reads the
 * TypeScript file as text and fails if these drift, the same way it already guards
 * the ids and the band thresholds.
 */
export const COMPETENCY_LABELS = {
  'data-quality': 'Data quality',
  inference: 'Inference',
  dissemination: 'Dissemination',
  'digital-tools': 'Digital tools',
  leadership: 'Leadership',
};

/* ------------------------------------------------------- the four-level scale */

/**
 * The classification bands, highest cut-off first. `min` is inclusive.
 *
 * Order matters: `classifyPerformance` walks this list top down and takes the first
 * band whose `min` the score reaches, so the list being sorted is the rule rather
 * than a chain of if-statements that could be reordered by accident.
 */
export const PERFORMANCE_SCALE = [
  { id: 'strong', min: 80, label: 'Strong' },
  { id: 'good', min: 60, label: 'Good' },
  { id: 'needs-improvement', min: 40, label: 'Needs improvement' },
  { id: 'weak', min: 0, label: 'Weak' },
];

/**
 * Below this many questions a score is reported but not classified.
 *
 * One question is not a measurement: 0/1 is a real 0% and the payload says so, but
 * calling it "Weak" would state a fact about the learner that one coin-flip produced.
 * Same floor as `MIN_QUESTIONS_FOR_BAND` in progress.mjs, for the same reason.
 */
export const MIN_QUESTIONS_FOR_STATUS = 2;

/** The status of a score there is not yet enough evidence to classify. */
export const UNRATED = 'unrated';

export const PERFORMANCE_IDS = PERFORMANCE_SCALE.map((level) => level.id);

/**
 * Which band a percentage falls in, or `unrated` when too little was asked.
 *
 * `questionsAttempted` is required rather than optional on purpose. Every caller in
 * this file has the count to hand, and a default would quietly classify a score whose
 * sample size nobody checked.
 */
export function classifyPerformance(percent, questionsAttempted) {
  if (!Number.isFinite(percent)) return UNRATED;
  if (!Number.isFinite(questionsAttempted) || questionsAttempted < MIN_QUESTIONS_FOR_STATUS) return UNRATED;
  for (const level of PERFORMANCE_SCALE) {
    if (percent >= level.min) return level.id;
  }
  return PERFORMANCE_SCALE[PERFORMANCE_SCALE.length - 1].id;
}

/** The scale as the browser receives it, so a page never hardcodes 80 or 60. */
export function performanceScale() {
  return {
    levels: PERFORMANCE_SCALE.map((level) => ({ ...level })),
    minQuestions: MIN_QUESTIONS_FOR_STATUS,
    unratedId: UNRATED,
    unratedLabel: 'Not enough questions',
  };
}

/* ------------------------------------------------------ the target dataset */

/**
 * Target level per competency, in percent.
 *
 * Demonstration values, chosen to be defensible rather than official: the two
 * competencies an official statistician is most often held to publicly (data quality
 * and inference) sit highest, leadership lowest because it is a role expectation
 * rather than a technical floor. They are here to make the gap chart meaningful in a
 * demo, and they are labelled as demonstration data everywhere they are shown.
 */
export const DEFAULT_TARGETS = {
  'data-quality': 80,
  inference: 75,
  dissemination: 70,
  'digital-tools': 70,
  leadership: 65,
};

export const REQUIREMENT_SOURCE = {
  id: 'nexora-default',
  label: 'Sample / Demonstration Data',
  note:
    'Target levels are NEXORA AI’s own configurable defaults for a mid-level statistical officer. They are not an official MoSPI, FRAC or iGOT Karmayogi competency requirement. Set COMPETENCY_TARGETS in server/.env to change them.',
  /** The env var an operator edits. Named in the payload so the note is actionable. */
  envVar: 'COMPETENCY_TARGETS',
};

/**
 * Read the targets, applying any override in the environment.
 *
 * Format is `id=percent`, comma separated: `COMPETENCY_TARGETS=inference=90,leadership=50`.
 * An unknown id or an out-of-range number is ignored rather than rejected — a typo in
 * a .env file should not stop the server from booting, and the payload reports which
 * targets are in force so a mistake is visible on screen rather than silent.
 *
 * Returns a fresh object every call, so a caller cannot mutate the defaults.
 */
export function competencyTargets(env = process.env) {
  const targets = { ...DEFAULT_TARGETS };
  const raw = typeof env?.COMPETENCY_TARGETS === 'string' ? env.COMPETENCY_TARGETS : '';
  if (raw.trim() === '') return targets;

  for (const pair of raw.split(',')) {
    const [name, value] = pair.split('=');
    if (name === undefined || value === undefined) continue;
    const id = name.trim();
    if (!COMPETENCY_IDS.includes(id)) continue;
    const percent = Number.parseInt(value.trim(), 10);
    if (!Number.isInteger(percent) || percent < 0 || percent > 100) continue;
    targets[id] = percent;
  }
  return targets;
}

/** True when the running configuration differs from the built-in defaults. */
export function targetsAreCustom(env = process.env) {
  const targets = competencyTargets(env);
  return COMPETENCY_IDS.some((id) => targets[id] !== DEFAULT_TARGETS[id]);
}

/* ----------------------------------------------------------------- the gap */

/**
 * How far below the target a score sits, in points. Never negative.
 *
 *   gap = max(requiredScore - currentScore, 0)
 *
 * Exceeding the target is not a negative gap, it is no gap. A chart that drew -12
 * would invite the reading "twelve points of surplus to spend elsewhere", which is
 * not a thing a competency score means.
 */
export function calculateCompetencyGap(currentScore, requiredScore) {
  const current = Number.isFinite(currentScore) ? currentScore : 0;
  const required = Number.isFinite(requiredScore) ? requiredScore : 0;
  return Math.max(required - current, 0);
}

/* ------------------------------------------------------- learning priority */

/**
 * How many questions count as a full-confidence measurement of one competency.
 *
 * Three, because the assessment asks three per section, so sitting the whole paper
 * gives every competency a confidence of 1. Anything less is measured with less
 * evidence and is scaled down accordingly rather than being hidden.
 */
export const CONFIDENCE_QUESTIONS = 3;

/**
 * What to learn next, as a number between 0 and 100.
 *
 *   gap        = max(required - current, 0)   / 100   how far below the target
 *   weakness   = (100 - current)              / 100   how much room is left
 *   confidence = min(questions / 3, 1)                how much evidence there is
 *
 *   priority   = round(gap x weakness x confidence x 100)
 *
 * Three factors rather than one, and each earns its place:
 *
 *  - `gap` alone would rank a competency that is merely below an ambitious target
 *    above one that is genuinely weak against a modest one.
 *  - `weakness` alone ignores what the role actually asks for.
 *  - `confidence` is what stops a single unlucky question from sending a learner
 *    down a six-hour pathway. It is the same honesty floor as `unrated`, expressed
 *    as a slope instead of a cliff, because a priority of zero would drop the row
 *    off the list entirely rather than ranking it low.
 *
 * Returns the three inputs alongside the score, so the screen can show the working
 * and this number is never something the learner has to take on trust.
 */
export function calculateLearningPriority({ currentScore, requiredScore, questionsAttempted }) {
  const current = Number.isFinite(currentScore) ? Math.max(0, Math.min(100, currentScore)) : 0;
  const required = Number.isFinite(requiredScore) ? Math.max(0, Math.min(100, requiredScore)) : 0;
  const asked = Number.isFinite(questionsAttempted) ? Math.max(0, questionsAttempted) : 0;

  const gap = calculateCompetencyGap(current, required) / 100;
  const weakness = (100 - current) / 100;
  const confidence = Math.min(asked / CONFIDENCE_QUESTIONS, 1);

  return {
    priority: Math.round(gap * weakness * confidence * 100),
    gap: Math.round(gap * 100),
    weakness: Math.round(weakness * 100),
    confidence: Math.round(confidence * 100) / 100,
    formula: 'priority = gap x weakness x confidence, each 0-1, reported 0-100',
  };
}

/* ------------------------------------------------------------ topic scoring */

/**
 * Per-topic performance across the attempts given, worst first.
 *
 * Topics are matched case-insensitively and keep the spelling they were first stored
 * with, which is what `computeProgress` already does — two attempts that wrote
 * "Sampling frame" and "sampling frame" describe one topic, and splitting them would
 * halve both counts and band neither.
 *
 * `questionsAttempted` rides on every row, always. A topic at 0% is very different
 * depending on whether it was asked once or ten times, and a chart that shows the
 * percentage without the count cannot tell the learner which they are looking at.
 */
export function calculateTopicPerformance(attempts) {
  const rows = new Map();

  for (const attempt of attempts ?? []) {
    for (const topic of attempt?.topics ?? []) {
      if (typeof topic?.topic !== 'string' || topic.topic === '') continue;
      const key = topic.topic.toLowerCase();
      const row = rows.get(key) ?? {
        name: topic.topic,
        competency: topic.competency ?? null,
        correct: 0,
        questionsAttempted: 0,
        attempts: 0,
        lastSeenAt: attempt.at ?? null,
      };
      row.correct += Number.isFinite(topic.correct) ? topic.correct : 0;
      row.questionsAttempted += Number.isFinite(topic.total) ? topic.total : 0;
      row.attempts += 1;
      if (attempt.at) row.lastSeenAt = attempt.at;
      // A later attempt can classify a topic an earlier one could not. It never
      // reclassifies one: the first non-null answer stands.
      if (!row.competency && topic.competency) row.competency = topic.competency;
      rows.set(key, row);
    }
  }

  return [...rows.values()]
    .map((row) => {
      const score = percentOf(row.correct, row.questionsAttempted);
      return { ...row, score, status: classifyPerformance(score, row.questionsAttempted) };
    })
    .sort(compareByNeed);
}

/** Worst first, then least certain, then alphabetical so the order is stable. */
function compareByNeed(left, right) {
  const rank = { weak: 0, 'needs-improvement': 1, good: 2, [UNRATED]: 3, strong: 4 };
  return (
    (rank[left.status] ?? 9) - (rank[right.status] ?? 9) ||
    left.score - right.score ||
    left.name.localeCompare(right.name)
  );
}

/* ------------------------------------------------------- competency scoring */

/**
 * Roll topic rows up into competencies, in framework order.
 *
 * Only competencies the attempts actually touched appear. A topic that could not be
 * placed in the framework is not quietly dropped either — it comes back in
 * `unclassified`, so the totals on screen can always be reconciled with the paper.
 *
 * Scores are computed from the summed question counts, not by averaging the topic
 * percentages: a topic asked once and a topic asked nine times are not equal halves
 * of a competency, and averaging them would let one question move a score ten points.
 */
export function calculateCompetencyPerformance(topicRows, { targets = DEFAULT_TARGETS } = {}) {
  const grouped = new Map();
  const unclassified = [];

  for (const row of topicRows ?? []) {
    if (!row.competency || !COMPETENCY_IDS.includes(row.competency)) {
      unclassified.push(row);
      continue;
    }
    const entry = grouped.get(row.competency) ?? { correct: 0, questionsAttempted: 0, topics: [], attempts: 0 };
    entry.correct += row.correct;
    entry.questionsAttempted += row.questionsAttempted;
    entry.attempts = Math.max(entry.attempts, row.attempts);
    entry.topics.push(row);
    grouped.set(row.competency, entry);
  }

  const competencies = COMPETENCY_IDS.filter((id) => grouped.has(id)).map((id) => {
    const entry = grouped.get(id);
    const currentScore = percentOf(entry.correct, entry.questionsAttempted);
    const requiredScore = Number.isFinite(targets?.[id]) ? targets[id] : 0;
    const status = classifyPerformance(currentScore, entry.questionsAttempted);
    const priority = calculateLearningPriority({
      currentScore,
      requiredScore,
      questionsAttempted: entry.questionsAttempted,
    });

    return {
      competency: id,
      name: COMPETENCY_LABELS[id] ?? id,
      currentScore,
      requiredScore,
      gap: calculateCompetencyGap(currentScore, requiredScore),
      status,
      correct: entry.correct,
      questionsAttempted: entry.questionsAttempted,
      attempts: entry.attempts,
      priority: priority.priority,
      priorityInputs: priority,
      topics: [...entry.topics].sort(compareByNeed).map((row) => ({
        name: row.name,
        score: row.score,
        status: row.status,
        correct: row.correct,
        questionsAttempted: row.questionsAttempted,
        lastSeenAt: row.lastSeenAt,
      })),
    };
  });

  return { competencies, unclassified };
}

/* ---------------------------------------------------- answer-level analysis */

/**
 * What a single graded paper says, question by question.
 *
 * Takes the `questions` array `gradeSubmission` produces and reports which ones were
 * missed and under which topic. Deliberately carries no question text, no option text
 * and no answer key: the review screen already has those from the same response, and
 * repeating them here would put the key into a second payload that a future endpoint
 * might return on its own.
 */
export function analyseAnswers(questions) {
  const rows = Array.isArray(questions) ? questions : [];
  const perTopic = new Map();
  let correct = 0;
  let attempted = 0;

  for (const question of rows) {
    const topic = typeof question?.topic === 'string' && question.topic !== '' ? question.topic : 'Unclassified';
    const entry = perTopic.get(topic) ?? {
      topic,
      competency: question?.competency ?? null,
      correct: 0,
      incorrect: 0,
      unanswered: 0,
      total: 0,
      missed: [],
    };

    entry.total += 1;
    if (question?.right === true) {
      entry.correct += 1;
      correct += 1;
    } else {
      entry.incorrect += 1;
      // The id is enough to point the review screen at the right row. It is not the
      // question and it is not the key.
      if (typeof question?.id === 'string') entry.missed.push(question.id);
    }
    if (question?.chosen === null || question?.chosen === undefined) entry.unanswered += 1;
    else attempted += 1;

    perTopic.set(topic, entry);
  }

  const topics = [...perTopic.values()]
    .map((entry) => ({ ...entry, percent: percentOf(entry.correct, entry.total) }))
    .sort((a, b) => a.percent - b.percent || b.incorrect - a.incorrect || a.topic.localeCompare(b.topic));

  // Only a topic with something actually wrong can be "most problematic". With a
  // clean paper this is null, and the screen says so rather than naming a winner.
  const worst = topics.find((entry) => entry.incorrect > 0) ?? null;

  return {
    total: rows.length,
    attempted,
    unanswered: rows.length - attempted,
    correct,
    incorrect: rows.length - correct,
    accuracy: percentOf(correct, rows.length),
    topics,
    mostProblematicTopic: worst ? { topic: worst.topic, competency: worst.competency, incorrect: worst.incorrect, total: worst.total, percent: worst.percent } : null,
  };
}

/* ------------------------------------------------------------ the trend */

/**
 * One point per stored attempt, oldest first — the historical progress line.
 *
 * Built only from attempts that exist. An account with one sitting gets one point and
 * the chart says a trend needs two; nothing is interpolated, back-filled or smoothed.
 */
export function buildTrend(attempts) {
  return (attempts ?? []).map((attempt) => ({
    id: attempt.id,
    at: attempt.at,
    label: attempt.label,
    source: attempt.source,
    percent: attempt.percent,
    correct: attempt.correct,
    questionsAttempted: attempt.total,
    status: classifyPerformance(attempt.percent, attempt.total),
  }));
}

/* ------------------------------------------------------------ the summary */

/** Scopes the endpoint accepts. `all` is the default because it is what the Dashboard shows. */
export const ANALYTICS_SCOPES = ['all', 'latest'];

/**
 * The whole analytics payload for one account.
 *
 * `attempts` is the account's stored history, oldest first — exactly what
 * `store.attemptsForUser` returns. Scope decides which of them are analysed; the
 * trend is always built from all of them, because "how did I do last time" and "how
 * am I doing over time" are different questions and the second one needs the history
 * even when the first is scoped to one paper.
 *
 * An account with no attempts gets a complete, valid payload with empty lists and
 * `measured: false`. It is not an error and it is not null: the page renders its own
 * empty state from it without a special case.
 */
export function buildAnalyticsSummary(attempts, { scope = 'all', env = process.env, now = new Date() } = {}) {
  const history = Array.isArray(attempts) ? attempts : [];
  const chosen = scope === 'latest' ? history.slice(-1) : history;
  const targets = competencyTargets(env);

  const topicRows = calculateTopicPerformance(chosen);
  const { competencies, unclassified } = calculateCompetencyPerformance(topicRows, { targets });

  let correct = 0;
  let questions = 0;
  for (const attempt of chosen) {
    correct += Number.isFinite(attempt.correct) ? attempt.correct : 0;
    questions += Number.isFinite(attempt.total) ? attempt.total : 0;
  }
  const percent = percentOf(correct, questions);

  const measuredIds = competencies.map((row) => row.competency);
  const byStatus = (id) => competencies.filter((row) => row.status === id);

  return {
    scope,
    generatedAt: now.toISOString(),
    /** False for a brand-new account. Every list below is then empty, legitimately. */
    measured: chosen.length > 0,
    attempts: chosen.length,
    attemptsStored: history.length,
    latestAttemptAt: history.length > 0 ? history[history.length - 1].at : null,

    overall: {
      correct,
      questionsAttempted: questions,
      score: percent,
      status: classifyPerformance(percent, questions),
    },

    scale: performanceScale(),
    requirement: {
      ...REQUIREMENT_SOURCE,
      custom: targetsAreCustom(env),
      targets,
    },

    /** Every measured competency, with its target, its gap and its topics. */
    competencies,
    /** Framework areas this account has answered nothing in. Not scored as zero. */
    unmeasured: COMPETENCY_IDS.filter((id) => !measuredIds.includes(id)).map((id) => ({
      competency: id,
      name: COMPETENCY_LABELS[id] ?? id,
      requiredScore: Number.isFinite(targets[id]) ? targets[id] : 0,
    })),

    strengths: byStatus('strong'),
    good: byStatus('good'),
    needsImprovement: byStatus('needs-improvement'),
    weaknesses: byStatus('weak'),
    unrated: byStatus(UNRATED),

    /** Biggest shortfall against the target first. Zero-gap rows are left out. */
    gaps: competencies
      .filter((row) => row.gap > 0)
      .map((row) => ({
        competency: row.competency,
        name: row.name,
        currentScore: row.currentScore,
        requiredScore: row.requiredScore,
        gap: row.gap,
        status: row.status,
        questionsAttempted: row.questionsAttempted,
      }))
      .sort((a, b) => b.gap - a.gap || a.name.localeCompare(b.name)),

    /**
     * What to learn next. The order is the formula's, and `reason` states it in the
     * learner's own numbers so the ranking can be checked rather than believed.
     *
     * Which course teaches which competency is not decided here. That catalogue lives
     * in src/lib/courses.ts and the existing recommendation path reads this order and
     * matches against it, so there is still exactly one course system.
     */
    priorities: competencies
      .filter((row) => row.priority > 0)
      .map((row) => ({
        competency: row.competency,
        name: row.name,
        priority: row.priority,
        inputs: row.priorityInputs,
        weakestTopic: row.topics.length > 0 ? row.topics[0].name : null,
        reason: `${row.name} scored ${row.currentScore}% across ${row.questionsAttempted} question${row.questionsAttempted === 1 ? '' : 's'} against a target of ${row.requiredScore}% — ${row.gap} point${row.gap === 1 ? '' : 's'} short.`,
      }))
      .sort((a, b) => b.priority - a.priority || a.name.localeCompare(b.name)),

    /** Topics the framework could not place. Reported rather than dropped. */
    unclassifiedTopics: unclassified.map((row) => ({
      name: row.name,
      score: row.score,
      status: row.status,
      correct: row.correct,
      questionsAttempted: row.questionsAttempted,
    })),

    trend: buildTrend(history),
  };
}
