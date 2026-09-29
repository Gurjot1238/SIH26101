import { COMPETENCY_IDS, percentOf } from './progress.mjs';

export const COMPETENCY_LABELS = {
  'data-quality': 'Data quality',
  inference: 'Inference',
  dissemination: 'Dissemination',
  'digital-tools': 'Digital tools',
  leadership: 'Leadership',
};

export const PERFORMANCE_SCALE = [
  { id: 'strong', min: 80, label: 'Strong' },
  { id: 'good', min: 60, label: 'Good' },
  { id: 'needs-improvement', min: 40, label: 'Needs improvement' },
  { id: 'weak', min: 0, label: 'Weak' },
];

export const MIN_QUESTIONS_FOR_STATUS = 2;

export const UNRATED = 'unrated';

export const PERFORMANCE_IDS = PERFORMANCE_SCALE.map((level) => level.id);

export function classifyPerformance(percent, questionsAttempted) {
  if (!Number.isFinite(percent)) return UNRATED;
  if (!Number.isFinite(questionsAttempted) || questionsAttempted < MIN_QUESTIONS_FOR_STATUS) return UNRATED;
  for (const level of PERFORMANCE_SCALE) {
    if (percent >= level.min) return level.id;
  }
  return PERFORMANCE_SCALE[PERFORMANCE_SCALE.length - 1].id;
}

export function performanceScale() {
  return {
    levels: PERFORMANCE_SCALE.map((level) => ({ ...level })),
    minQuestions: MIN_QUESTIONS_FOR_STATUS,
    unratedId: UNRATED,
    unratedLabel: 'Not enough questions',
  };
}

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
  envVar: 'COMPETENCY_TARGETS',
};

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

export function targetsAreCustom(env = process.env) {
  const targets = competencyTargets(env);
  return COMPETENCY_IDS.some((id) => targets[id] !== DEFAULT_TARGETS[id]);
}

export function calculateCompetencyGap(currentScore, requiredScore) {
  const current = Number.isFinite(currentScore) ? currentScore : 0;
  const required = Number.isFinite(requiredScore) ? requiredScore : 0;
  return Math.max(required - current, 0);
}

export const CONFIDENCE_QUESTIONS = 3;

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

function compareByNeed(left, right) {
  const rank = { weak: 0, 'needs-improvement': 1, good: 2, [UNRATED]: 3, strong: 4 };
  return (
    (rank[left.status] ?? 9) - (rank[right.status] ?? 9) ||
    left.score - right.score ||
    left.name.localeCompare(right.name)
  );
}

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
      if (typeof question?.id === 'string') entry.missed.push(question.id);
    }
    if (question?.chosen === null || question?.chosen === undefined) entry.unanswered += 1;
    else attempted += 1;

    perTopic.set(topic, entry);
  }

  const topics = [...perTopic.values()]
    .map((entry) => ({ ...entry, percent: percentOf(entry.correct, entry.total) }))
    .sort((a, b) => a.percent - b.percent || b.incorrect - a.incorrect || a.topic.localeCompare(b.topic));

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

export const ANALYTICS_SCOPES = ['all', 'latest'];

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

    competencies,
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
