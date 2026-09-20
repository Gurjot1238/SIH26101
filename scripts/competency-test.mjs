/**
 * Tests the competency analytics engine and the explanation guard by running them.
 *
 * Usage:  node scripts/competency-test.mjs        (or:  npm run competency:test)
 *
 * `server/competency.mjs` turns stored attempts into topic scores, competency scores,
 * gaps against a target, a study order and a trend. Every number the dashboard draws is
 * one of these, so these are the assertions that stand between a wrong formula and a
 * wrong chart. They import the real server module — it is plain ESM over Node built-ins,
 * the same reason the engine test can import `server/assessment.mjs` directly — and feed
 * it attempt records shaped exactly as `store.attemptsForUser` returns them.
 *
 * The cases are the ones the specification names: topic scoring, competency aggregation
 * by summed counts (not averaged percentages), the gap both ways, the four classification
 * cut-offs, and the missing-data inputs that must not throw. The last group also covers
 * `unsupportedFigures` from server/ai/explain.mjs — the check that stops the AI from
 * quoting a percentage the server never calculated.
 *
 * A check returns nothing when it passes and a string when it fails, so a failure prints
 * the value it actually saw rather than just "expected true".
 */

import {
  ANALYTICS_SCOPES,
  MIN_QUESTIONS_FOR_STATUS,
  analyseAnswers,
  buildAnalyticsSummary,
  buildTrend,
  calculateCompetencyGap,
  calculateCompetencyPerformance,
  calculateLearningPriority,
  calculateTopicPerformance,
  classifyPerformance,
  competencyTargets,
  performanceScale,
  targetsAreCustom,
} from '../server/competency.mjs';
import { unsupportedFigures } from '../server/ai/explain.mjs';

let passed = 0;
let failed = 0;
const failures = [];

function check(name, run) {
  let problem = null;
  try {
    const result = run();
    if (result !== true && result !== undefined) problem = String(result);
  } catch (error) {
    problem = error && error.message ? error.message : String(error);
  }
  if (problem) {
    failed += 1;
    failures.push(`${name}: ${problem}`);
    console.log(`  FAIL  ${name}`);
    console.log(`        ${problem}`);
  } else {
    passed += 1;
    console.log(`  ok    ${name}`);
  }
}

function section(title) {
  console.log(`\n  -- ${title} ${'-'.repeat(Math.max(0, 58 - title.length))}`);
}

/**
 * One stored attempt, shaped like `store.attemptsForUser` returns. `topics` is a list of
 * `{ topic, competency, correct, total }`; the attempt totals and every percent are
 * derived so a fixture can never quietly disagree with itself.
 */
function attempt(id, topics, { at = '2026-09-10T10:00:00.000Z', source = 'assessment', label = 'Assessment' } = {}) {
  const correct = topics.reduce((sum, topic) => sum + topic.correct, 0);
  const total = topics.reduce((sum, topic) => sum + topic.total, 0);
  const pct = (c, t) => (t > 0 ? Math.round((c / t) * 100) : 0);
  return {
    id,
    at,
    source,
    label,
    total,
    correct,
    percent: pct(correct, total),
    band: 'unrated',
    topics: topics.map((topic) => ({
      topic: topic.topic,
      competency: topic.competency ?? null,
      correct: topic.correct,
      total: topic.total,
      percent: pct(topic.correct, topic.total),
      band: 'unrated',
    })),
  };
}

/** Force the built-in targets regardless of what COMPETENCY_TARGETS is set to in this shell. */
const DEFAULT_ENV = {};

/* ------------------------------------------------------------------- the gap */

section('the gap, both directions');

check('below target: required 80, current 55 → gap 25', () => {
  const gap = calculateCompetencyGap(55, 80);
  if (gap !== 25) return `gap is ${gap}`;
});

check('above target: required 80, current 85 → gap 0, never negative', () => {
  const gap = calculateCompetencyGap(85, 80);
  if (gap !== 0) return `gap is ${gap}, expected 0 (a surplus is not a negative gap)`;
});

check('exactly on target: required 80, current 80 → gap 0', () => {
  const gap = calculateCompetencyGap(80, 80);
  if (gap !== 0) return `gap is ${gap}`;
});

check('a non-finite score is treated as zero, not NaN', () => {
  if (calculateCompetencyGap(undefined, 80) !== 80) return 'undefined current did not read as 0';
  if (calculateCompetencyGap(55, undefined) !== 0) return 'undefined target did not read as 0';
});

/* -------------------------------------------------------- the four cut-offs */

section('classification at the four cut-offs');

check('80 is strong, 60 is good, 40 is needs-improvement, 39 is weak', () => {
  const enough = MIN_QUESTIONS_FOR_STATUS + 8;
  const at = (percent) => classifyPerformance(percent, enough);
  if (at(80) !== 'strong') return `80 → ${at(80)}`;
  if (at(60) !== 'good') return `60 → ${at(60)}`;
  if (at(40) !== 'needs-improvement') return `40 → ${at(40)}`;
  if (at(39) !== 'weak') return `39 → ${at(39)}`;
  // The boundaries are inclusive on the lower edge, so one point under drops a band.
  if (at(79) !== 'good') return `79 → ${at(79)}`;
  if (at(59) !== 'needs-improvement') return `59 → ${at(59)}`;
  if (at(100) !== 'strong') return `100 → ${at(100)}`;
  if (at(0) !== 'weak') return `0 → ${at(0)}`;
});

check('too few questions is unrated, not weak', () => {
  if (classifyPerformance(0, 1) !== 'unrated') return '0% off one question was classified';
  if (classifyPerformance(100, MIN_QUESTIONS_FOR_STATUS - 1) !== 'unrated') return 'a high score under the floor was classified';
  if (classifyPerformance(100, MIN_QUESTIONS_FOR_STATUS) !== 'strong') return 'the floor itself did not classify';
  if (classifyPerformance(50, Number.NaN) !== 'unrated') return 'a NaN count classified';
});

check('the scale the browser receives carries the thresholds and the floor', () => {
  const scale = performanceScale();
  const strong = scale.levels.find((level) => level.id === 'strong');
  if (!strong || strong.min !== 80) return 'the strong cut-off is not 80 in the published scale';
  if (scale.minQuestions !== MIN_QUESTIONS_FOR_STATUS) return `published floor is ${scale.minQuestions}`;
  if (scale.unratedId !== 'unrated') return `unrated id is ${scale.unratedId}`;
});

/* ------------------------------------------------------------ topic scoring */

section('topic scoring');

check('a topic scores by its summed counts, and carries the count it was measured over', () => {
  const rows = calculateTopicPerformance([
    attempt('a1', [{ topic: 'Normalization', competency: 'data-quality', correct: 8, total: 10 }]),
  ]);
  const norm = rows.find((row) => row.name === 'Normalization');
  if (!norm) return 'the topic did not come back';
  if (norm.score !== 80) return `score is ${norm.score}`;
  if (norm.questionsAttempted !== 10) return `questionsAttempted is ${norm.questionsAttempted}`;
  if (norm.status !== 'strong') return `status is ${norm.status}`;
});

check('the same topic across two attempts is one row, counts added', () => {
  const rows = calculateTopicPerformance([
    attempt('a1', [{ topic: 'Sampling frame', competency: 'inference', correct: 2, total: 4 }], { at: '2026-09-01T00:00:00.000Z' }),
    attempt('a2', [{ topic: 'sampling frame', competency: 'inference', correct: 4, total: 6 }], { at: '2026-09-08T00:00:00.000Z' }),
  ]);
  const matches = rows.filter((row) => row.name.toLowerCase() === 'sampling frame');
  if (matches.length !== 1) return `${matches.length} rows for one topic (case should not split it)`;
  if (matches[0].questionsAttempted !== 10) return `questionsAttempted is ${matches[0].questionsAttempted}`;
  if (matches[0].correct !== 6) return `correct is ${matches[0].correct}`;
  if (matches[0].score !== 60) return `score is ${matches[0].score}`;
  if (matches[0].lastSeenAt !== '2026-09-08T00:00:00.000Z') return `lastSeenAt is ${matches[0].lastSeenAt}, not the later attempt`;
});

check('0 of 1 is a real 0% reported as unrated, with the count beside it', () => {
  const rows = calculateTopicPerformance([
    attempt('a1', [{ topic: 'Indexing', competency: 'data-quality', correct: 0, total: 1 }]),
  ]);
  const indexing = rows.find((row) => row.name === 'Indexing');
  if (!indexing) return 'the topic did not come back';
  if (indexing.score !== 0) return `score is ${indexing.score}`;
  if (indexing.questionsAttempted !== 1) return `questionsAttempted is ${indexing.questionsAttempted}`;
  if (indexing.status !== 'unrated') return `status is ${indexing.status}, but one question is not a measurement`;
});

/* ------------------------------------------------- competency aggregation */

section('competency aggregation');

check('a competency scores by summed counts, not by averaging its topics', () => {
  // One topic 1/1 (100%) and one topic 0/9 (0%). Averaging the percentages says 50%;
  // the truth is 1 correct out of 10 = 10%. This is the whole reason the code sums counts.
  const rows = calculateTopicPerformance([
    attempt('a1', [
      { topic: 'Point estimates', competency: 'inference', correct: 1, total: 1 },
      { topic: 'Confidence intervals', competency: 'inference', correct: 0, total: 9 },
    ]),
  ]);
  const { competencies } = calculateCompetencyPerformance(rows, { targets: competencyTargets(DEFAULT_ENV) });
  const inference = competencies.find((row) => row.competency === 'inference');
  if (!inference) return 'inference did not come back';
  if (inference.currentScore !== 10) return `score is ${inference.currentScore}%, averaging would have said 50%`;
  if (inference.questionsAttempted !== 10) return `questionsAttempted is ${inference.questionsAttempted}`;
  if (inference.topics.length !== 2) return `${inference.topics.length} topics under the competency`;
});

check('gap and status ride on the aggregated competency, against the target', () => {
  const rows = calculateTopicPerformance([
    attempt('a1', [{ topic: 'Editing rules', competency: 'data-quality', correct: 11, total: 20 }]),
  ]);
  const { competencies } = calculateCompetencyPerformance(rows, { targets: { 'data-quality': 80 } });
  const dq = competencies.find((row) => row.competency === 'data-quality');
  if (!dq) return 'data-quality did not come back';
  if (dq.currentScore !== 55) return `score is ${dq.currentScore}`;
  if (dq.requiredScore !== 80) return `target is ${dq.requiredScore}`;
  if (dq.gap !== 25) return `gap is ${dq.gap}`;
  if (dq.status !== 'needs-improvement') return `status is ${dq.status}`;
});

/* ----------------------------------------------------- learning priority */

section('learning priority');

check('priority is gap x weakness x confidence, and shows its working', () => {
  // current 40, target 80, plenty of questions → gap .4, weakness .6, confidence 1 → 24.
  const priority = calculateLearningPriority({ currentScore: 40, requiredScore: 80, questionsAttempted: 6 });
  if (priority.priority !== 24) return `priority is ${priority.priority}, expected 24`;
  if (priority.gap !== 40) return `gap input is ${priority.gap}`;
  if (priority.weakness !== 60) return `weakness input is ${priority.weakness}`;
  if (priority.confidence !== 1) return `confidence is ${priority.confidence}`;
  if (!priority.formula || !priority.formula.includes('gap')) return `formula missing: "${priority.formula}"`;
});

check('one lucky question cannot send a learner down a long pathway', () => {
  // 0 of 1, target 80. Confidence is 1/3, so the priority is a third of what a full
  // measurement of the same score would give — ranked, not hidden, not maxed out.
  const thin = calculateLearningPriority({ currentScore: 0, requiredScore: 80, questionsAttempted: 1 });
  const full = calculateLearningPriority({ currentScore: 0, requiredScore: 80, questionsAttempted: 3 });
  if (!(thin.priority < full.priority)) return `thin ${thin.priority} not below full ${full.priority}`;
  if (thin.confidence !== Math.round((1 / 3) * 100) / 100) return `confidence is ${thin.confidence}`;
});

/* --------------------------------------------------------- the whole summary */

section('the whole summary');

/** A realistic sitting: five competencies, a spread of scores, one topic under each. */
const fullPaper = attempt('full-1', [
  { topic: 'Editing rules', competency: 'data-quality', correct: 11, total: 20 }, // 55%
  { topic: 'Confidence intervals', competency: 'inference', correct: 3, total: 10 }, // 30%
  { topic: 'Chart choice', competency: 'dissemination', correct: 9, total: 10 }, // 90%
  { topic: 'Spreadsheets', competency: 'digital-tools', correct: 6, total: 10 }, // 60%
  { topic: 'Delegation', competency: 'leadership', correct: 5, total: 10 }, // 50%
]);

check('a summary reports overall, gaps sorted, priorities and a trend from real attempts', () => {
  const summary = buildAnalyticsSummary([fullPaper], { env: DEFAULT_ENV });
  if (summary.measured !== true) return 'a sat paper was reported as not measured';
  if (summary.overall.correct !== 34 || summary.overall.questionsAttempted !== 60) {
    return `overall counts are ${summary.overall.correct}/${summary.overall.questionsAttempted}`;
  }
  if (summary.overall.score !== 57) return `overall score is ${summary.overall.score}`;
  if (summary.competencies.length !== 5) return `${summary.competencies.length} competencies measured`;
  // Gaps are biggest-first and drop any competency already at or above target.
  const gapOrder = summary.gaps.map((row) => row.gap);
  const sorted = [...gapOrder].sort((a, b) => b - a);
  if (JSON.stringify(gapOrder) !== JSON.stringify(sorted)) return `gaps not biggest-first: ${gapOrder}`;
  if (summary.gaps.some((row) => row.gap <= 0)) return 'a zero gap was listed';
  // Dissemination scored 90% against a 70% target → no gap, so it must not be in the list.
  if (summary.gaps.some((row) => row.competency === 'dissemination')) return 'dissemination has no gap but was listed';
  // Priorities are their own order, highest first, and each states its own numbers.
  const priOrder = summary.priorities.map((row) => row.priority);
  if (JSON.stringify(priOrder) !== JSON.stringify([...priOrder].sort((a, b) => b - a))) {
    return `priorities not highest-first: ${priOrder}`;
  }
  if (summary.priorities[0] && !summary.priorities[0].reason.includes('%')) {
    return `the top priority states no number: "${summary.priorities[0].reason}"`;
  }
  if (summary.trend.length !== 1) return `trend has ${summary.trend.length} points for one attempt`;
});

check('a competency the paper never asked about is unmeasured, not zero', () => {
  // Only inference is answered. The other four must appear in `unmeasured`, never scored 0%.
  const onlyInference = attempt('one', [{ topic: 'Point estimates', competency: 'inference', correct: 2, total: 4 }]);
  const summary = buildAnalyticsSummary([onlyInference], { env: DEFAULT_ENV });
  if (summary.competencies.length !== 1) return `${summary.competencies.length} competencies, expected 1`;
  if (summary.unmeasured.length !== 4) return `${summary.unmeasured.length} unmeasured, expected 4`;
  if (summary.competencies.some((row) => row.competency !== 'inference')) return 'a competency was scored that had no questions';
  if (summary.unmeasured.some((row) => typeof row.requiredScore !== 'number')) return 'an unmeasured competency lost its target';
});

check('scope=latest analyses the last sitting but the trend still spans all of them', () => {
  const older = attempt('old', [{ topic: 'Editing rules', competency: 'data-quality', correct: 2, total: 10 }], { at: '2026-09-01T00:00:00.000Z' });
  const newer = attempt('new', [{ topic: 'Editing rules', competency: 'data-quality', correct: 9, total: 10 }], { at: '2026-09-15T00:00:00.000Z' });
  const summary = buildAnalyticsSummary([older, newer], { scope: 'latest', env: DEFAULT_ENV });
  if (summary.attempts !== 1) return `analysed ${summary.attempts} attempts, expected 1`;
  if (summary.attemptsStored !== 2) return `attemptsStored is ${summary.attemptsStored}`;
  if (summary.overall.score !== 90) return `latest-only score is ${summary.overall.score}, expected 90`;
  if (summary.trend.length !== 2) return `trend has ${summary.trend.length} points, expected the full 2`;
  if (!ANALYTICS_SCOPES.includes('latest')) return 'latest is not an advertised scope';
});

check('the target dataset is labelled as the platform default, not an official standard', () => {
  const summary = buildAnalyticsSummary([fullPaper], { env: DEFAULT_ENV });
  if (summary.requirement.custom !== false) return 'default targets were reported as custom';
  if (!/not an official/i.test(summary.requirement.note)) return `the note does not disclaim officialness: "${summary.requirement.note}"`;
  // And an override is picked up and flips the flag.
  const overridden = buildAnalyticsSummary([fullPaper], { env: { COMPETENCY_TARGETS: 'inference=90' } });
  if (overridden.requirement.custom !== true) return 'an override did not flip custom to true';
  if (!targetsAreCustom({ COMPETENCY_TARGETS: 'inference=90' })) return 'targetsAreCustom disagreed with the summary';
  const target = overridden.competencies.find((row) => row.competency === 'inference');
  if (target && target.requiredScore !== 90) return `the override target did not apply: ${target.requiredScore}`;
});

/* ------------------------------------------------------- missing data */

section('missing data must not crash');

check('no attempts at all: a valid, empty, measured:false payload', () => {
  for (const input of [[], undefined, null]) {
    const summary = buildAnalyticsSummary(input, { env: DEFAULT_ENV });
    if (summary.measured !== false) return `measured is ${summary.measured} for input ${JSON.stringify(input)}`;
    if (summary.competencies.length !== 0) return 'competencies were invented for an empty history';
    if (summary.overall.score !== 0) return `overall score is ${summary.overall.score} for no attempts`;
    if (summary.trend.length !== 0) return 'a trend was drawn for no attempts';
    if (summary.unmeasured.length !== 5) return `${summary.unmeasured.length} unmeasured, expected all 5`;
  }
});

check('a missing topic name is skipped, not counted as a blank topic', () => {
  const messy = {
    ...attempt('m', [{ topic: 'Editing rules', competency: 'data-quality', correct: 3, total: 5 }]),
  };
  messy.topics.push({ topic: '', competency: 'inference', correct: 1, total: 2, percent: 50, band: 'unrated' });
  messy.topics.push({ competency: 'inference', correct: 1, total: 2, percent: 50, band: 'unrated' });
  const rows = calculateTopicPerformance([messy]);
  if (rows.some((row) => row.name === '')) return 'a blank topic name became a row';
  if (rows.length !== 1) return `${rows.length} topic rows, expected only the named one`;
});

check('a missing or unknown competency lands in unclassified, not dropped or crashed', () => {
  const rows = calculateTopicPerformance([
    attempt('u', [
      { topic: 'Loose end', competency: null, correct: 1, total: 4 },
      { topic: 'Bad label', competency: 'not-a-real-competency', correct: 2, total: 4 },
    ]),
  ]);
  const { competencies, unclassified } = calculateCompetencyPerformance(rows, { targets: competencyTargets(DEFAULT_ENV) });
  if (competencies.length !== 0) return `${competencies.length} competencies from unplaceable topics`;
  if (unclassified.length !== 2) return `${unclassified.length} unclassified, expected 2`;
  const summary = buildAnalyticsSummary([
    attempt('u', [{ topic: 'Loose end', competency: null, correct: 1, total: 4 }]),
  ], { env: DEFAULT_ENV });
  if (summary.unclassifiedTopics.length !== 1) return `${summary.unclassifiedTopics.length} unclassified topics in the summary`;
});

check('zero-question inputs do not divide by zero anywhere', () => {
  const empty = attempt('z', [{ topic: 'Nothing asked', competency: 'inference', correct: 0, total: 0 }]);
  const summary = buildAnalyticsSummary([empty], { env: DEFAULT_ENV });
  if (!Number.isFinite(summary.overall.score)) return `overall score is ${summary.overall.score}`;
  const rows = calculateTopicPerformance([empty]);
  if (rows.length > 0 && !Number.isFinite(rows[0].score)) return 'a zero-total topic produced a non-finite score';
  if (buildTrend(undefined).length !== 0) return 'buildTrend(undefined) did not return an empty list';
  if (analyseAnswers(undefined).total !== 0) return 'analyseAnswers(undefined) did not return an empty rollup';
});

/* -------------------------------------------------- the explanation guard */

section('the AI explanation guard (unsupportedFigures)');

check('a figure that is in the data passes', () => {
  const allowed = new Set([90, 41, 49]);
  const found = unsupportedFigures('You scored 90% on data quality, 49 points above the 41% floor.', allowed);
  if (found.length !== 0) return `flagged ${JSON.stringify(found)} that were all present`;
});

check('a figure that is not in the data is flagged', () => {
  const allowed = new Set([90, 41]);
  const found = unsupportedFigures('Overall you are averaging 73%.', allowed);
  if (!found.includes(73)) return `did not flag the invented 73%: ${JSON.stringify(found)}`;
});

check('a claim one point off an exact figure is tolerated, two points is not', () => {
  // Server percentages are integers (percentOf rounds), so the tolerance is ±1 around
  // an exact figure: a model writing "about 66%" or "68%" of a real 67% is reporting it,
  // not inventing. Two points away is no longer rounding and must be caught.
  const allowed = new Set([67]);
  if (unsupportedFigures('You reached 66%.', allowed).length !== 0) return '66% was flagged against 67';
  if (unsupportedFigures('You reached 68%.', allowed).length !== 0) return '68% was flagged against 67';
  if (unsupportedFigures('You reached 67%.', allowed).length !== 0) return '67% was flagged against itself';
  if (unsupportedFigures('You reached 69%.', allowed).length === 0) return '69% was not flagged against 67';
  if (unsupportedFigures('You reached 65%.', allowed).length === 0) return '65% was not flagged against 67';
});

check('a "N points" claim is checked the same way as a percentage', () => {
  const allowed = new Set([25]);
  if (unsupportedFigures('You are 25 points short.', allowed).length !== 0) return '25 points was flagged despite being present';
  const bad = unsupportedFigures('You are 40 points short.', allowed);
  if (!bad.includes(40)) return `did not flag the invented 40 points: ${JSON.stringify(bad)}`;
});

check('prose with no figures at all passes', () => {
  if (unsupportedFigures('Focus your study on inference next, then dissemination.', new Set([90])).length !== 0) {
    return 'plain prose was flagged';
  }
});

/* --------------------------------------------------------------- report */

console.log(`\n  ${passed} passed, ${failed} failed.`);
if (failed > 0) {
  console.log('  Failures:');
  for (const failure of failures) console.log(`    - ${failure}`);
  console.log('');
}
process.exit(failed > 0 ? 1 : 0);
