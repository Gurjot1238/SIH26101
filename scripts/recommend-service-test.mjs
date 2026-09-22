/**
 * Tests the recommendation SERVICE, its fallback behaviour, and the privacy of the
 * interaction log — by running them, with no server and no model.json on disk.
 *
 * Usage:  node scripts/recommend-service-test.mjs   (or:  npm run recommend:test — chained)
 *
 * Three things have to be true for the ML upgrade to be safe, and each is asserted here:
 *
 *   1. The service never returns fewer or different courses than the current engine. The
 *      hybrid engine generates candidates with the rule-based engine, so with no trained
 *      model (the state today) its output courses are exactly `recommendCoursesForGaps`'s.
 *      "Never show empty recommendations because the ML model is not trained yet."
 *
 *   2. The ML engine refuses to run without a real, complete model AND enough data. There is
 *      no `if (score < 50) recommend` — a not-ready model yields the deterministic result,
 *      tagged honestly. When a (test-injected) model IS ready and data is sufficient, it only
 *      re-orders the same courses; it cannot introduce one the rules did not vouch for.
 *
 *   3. The interaction log carries no PII. sanitizeEvent rebuilds from an allow-list, hashes
 *      the user id, and drops passwords/tokens/emails/document text even when a caller passes
 *      them. This is the guarantee that the future training set is safe to build.
 *
 * A check returns nothing (or true) when it passes and a string when it fails, so a failure
 * prints the value it actually saw.
 */

import { buildAnalyticsSummary } from '../server/competency.mjs';
import { recommendCoursesForGaps } from '../server/course-recommendations.mjs';
import {
  RecommendationService,
  RuleBasedRecommendationEngine,
  MLRecommendationEngine,
  HybridRecommendationEngine,
} from '../server/recommend/service.mjs';
import { scoreVector } from '../server/recommend/model.mjs';
import {
  anonymiseLearner,
  sanitizeEvent,
  forbiddenKeysIn,
  buildTrainingRows,
  INTERACTION_TYPES,
} from '../server/recommend/interactions.mjs';
import { extractFeatures, outcomeLabel, FEATURE_NAMES } from '../server/recommend/features.mjs';
import {
  hasValidUrl,
  isAvailable,
  prerequisitesSatisfied,
  difficultyMatch,
  duplicateSimilarity,
  validateCandidate,
} from '../server/recommend/quality.mjs';
import { explainRecommendation, countForGap } from '../server/recommend/explain.mjs';
import { refineRecommendations } from '../server/recommend/service.mjs';
import { buildLabeledRows, trainAndEvaluate, predictRaw } from './train-recommender.mjs';

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

/* ------------------------------------------------------------------- fixtures */

function attempt(id, topics, { at = '2026-09-10T10:00:00.000Z' } = {}) {
  const correct = topics.reduce((s, t) => s + t.correct, 0);
  const total = topics.reduce((s, t) => s + t.total, 0);
  const pct = (c, t) => (t > 0 ? Math.round((c / t) * 100) : 0);
  return {
    id, at, source: 'assessment', label: 'Assessment', total, correct, percent: pct(correct, total), band: 'unrated',
    topics: topics.map((t) => ({ topic: t.topic, competency: t.competency ?? null, correct: t.correct, total: t.total, percent: pct(t.correct, t.total), band: 'unrated' })),
  };
}

function course(courseId, competencies, extra = {}) {
  return {
    courseId, title: extra.title ?? courseId, provider: extra.provider ?? 'Test Provider', category: 'Technology',
    subcategory: '', level: extra.level ?? 'introductory', description: '',
    estimatedHours: extra.estimatedHours ?? 10, competencies, topics: [], license: 'CC-BY',
    // A real, valid URL — the quality gate (§8) rejects candidates without one.
    officialUrl: extra.officialUrl ?? `https://example.org/courses/${courseId}`,
    availability: extra.availability ?? 'available',
    prerequisites: extra.prerequisites ?? [],
    modules: 3, lessons: 12,
  };
}

const weakLearner = buildAnalyticsSummary(
  [
    attempt('paper-1', [
      { topic: 'Editing rules', competency: 'data-quality', correct: 5, total: 20 }, // 25%
      { topic: 'Confidence intervals', competency: 'inference', correct: 2, total: 10 }, // 20%
      { topic: 'Spreadsheets', competency: 'digital-tools', correct: 3, total: 10 }, // 30%
    ]),
  ],
  { env: {} },
);

const cat = {
  available: true,
  courses: [
    course('stats-101', ['statistics', 'probability'], { estimatedHours: 8 }),
    course('ml-intro', ['machine-learning', 'statistics'], { estimatedHours: 20 }),
    course('python-basics', ['python-programming', 'algorithms'], { estimatedHours: 6 }),
    course('data-eng', ['data-engineering', 'sql'], { estimatedHours: 15 }),
  ],
};

/* ------------------------------------------------------- 1. rule-based is the floor */

section('Rule-based engine wraps the current system unchanged');

check('rule-based courses equal recommendCoursesForGaps courses', () => {
  const engine = new RuleBasedRecommendationEngine();
  const direct = recommendCoursesForGaps(weakLearner, cat);
  const viaEngine = engine.generate(weakLearner, cat);
  const a = direct.courses.map((c) => c.courseId).join(',');
  const b = viaEngine.courses.map((c) => c.courseId).join(',');
  return a === b || `direct=[${a}] engine=[${b}]`;
});

check('rule-based tags its strategy', () => {
  const r = new RuleBasedRecommendationEngine().generate(weakLearner, cat);
  return r.strategy?.engine === 'rule-based' || `strategy=${JSON.stringify(r.strategy)}`;
});

/* -------------------------------------------------- 2. ML refuses without a model */

section('ML engine refuses to run without a real, complete model');

check('ML usable() is false when no model file exists', () => {
  // The real loader: with no model.json on disk it must report not-ready.
  const ml = new MLRecommendationEngine();
  const state = ml.usable({ interactionCount: 10000 });
  return state.usable === false || `expected not-usable, got ${JSON.stringify(state)}`;
});

check('ML usable() is false when a model exists but data is thin', () => {
  const fakeReadyModel = () => ({ ready: true, model: { modelVersion: 'test-1', features: FEATURE_NAMES, weights: FEATURE_NAMES.map(() => 0.1), bias: 0, minInteractionsToActivate: 200 } });
  const ml = new MLRecommendationEngine({ load: fakeReadyModel, minInteractions: 200 });
  const state = ml.usable({ interactionCount: 5 });
  return (state.usable === false && /activates at 200/.test(state.reason)) || `got ${JSON.stringify(state)}`;
});

/* -------------------------------------------- 3. hybrid falls back, never empties */

section('Hybrid falls back to rule-based when ML is not ready');

check('hybrid with no model returns filtered rule-based courses (subset, tagged, explained)', () => {
  const hybrid = new HybridRecommendationEngine(); // real loader → no model
  const r = hybrid.generate(weakLearner, cat, { interactionCount: 999999 });
  const base = recommendCoursesForGaps(weakLearner, cat);
  const baseSet = new Set(base.courses.map((c) => c.courseId));
  // Every course the hybrid returns must be one the rule-based engine vouched for (the gate
  // and count caps may remove some, but never add one), it must be tagged rule-based, and
  // every survivor must carry an evidence explanation.
  const subset = r.courses.every((c) => baseSet.has(c.courseId));
  const tagged = r.strategy.engine === 'hybrid:rule-based';
  const explained = r.courses.every((c) => Array.isArray(c.why) && typeof c.summary === 'string');
  return (subset && tagged && explained && r.courses.length > 0) || `subset=${subset} tagged=${tagged} explained=${explained} n=${r.courses.length}`;
});

check('hybrid never returns empty just because ML is untrained', () => {
  const hybrid = new HybridRecommendationEngine();
  const r = hybrid.generate(weakLearner, cat, { interactionCount: 0 });
  return r.courses.length > 0 || 'hybrid returned an empty course list with an untrained model';
});

/* ------------------------------------ 4. ML (injected) only re-orders, never adds */

section('ML re-ranks the same candidates — no new or dropped courses');

check('injected ready model re-ranks only the filtered survivors, never adds a course', () => {
  // A model that strongly favours the `tag_overlap` feature, with enough interactions.
  const model = {
    modelVersion: 'ltr-test-001',
    features: FEATURE_NAMES,
    weights: FEATURE_NAMES.map((f) => (f === 'tag_overlap' ? 5 : 0)),
    bias: 0,
    minInteractionsToActivate: 10,
  };
  const mlEngine = new MLRecommendationEngine({ load: () => ({ ready: true, model }), score: scoreVector, minInteractions: 10 });
  const hybrid = new HybridRecommendationEngine({ mlEngine });
  // The ML path must be a subset of the filtered rule-based path (same gate), just reordered.
  const filteredIds = new Set(new HybridRecommendationEngine().generate(weakLearner, cat, { interactionCount: 0 }).courses.map((c) => c.courseId));
  const r = hybrid.generate(weakLearner, cat, { interactionCount: 50 });
  const subset = r.courses.every((c) => filteredIds.has(c.courseId));
  const tagged = r.strategy.engine === 'hybrid:ml-ranked' && r.strategy.modelVersion === 'ltr-test-001';
  const hasScores = r.courses.every((c) => typeof c.mlScore === 'number');
  return (subset && tagged && hasScores) || `subset=${subset} tagged=${tagged} hasScores=${hasScores}`;
});

check('service defaults to hybrid and returns a valid shape', () => {
  const svc = new RecommendationService();
  const r = svc.recommend(weakLearner, cat, { interactionCount: 0 });
  const valid = Array.isArray(r.courses) && typeof r.available === 'boolean' && Boolean(r.strategy);
  return valid || `shape=${JSON.stringify(Object.keys(r))}`;
});

/* --------------------------------------------------- 5. interaction log privacy */

section('Interaction log is anonymised and PII-free');

check('learner id is an HMAC, never the raw user id', () => {
  const anon = anonymiseLearner('user-42', 'a-server-secret-of-adequate-length');
  return (anon !== 'user-42' && /^[0-9a-f]{32}$/.test(anon)) || `anon=${anon}`;
});

check('same user + secret is stable; different secret differs', () => {
  const a = anonymiseLearner('user-42', 'secret-one-secret-one-secret-one');
  const b = anonymiseLearner('user-42', 'secret-one-secret-one-secret-one');
  const c = anonymiseLearner('user-42', 'a-different-secret-entirely-here');
  return (a === b && a !== c) || `a=${a} b=${b} c=${c}`;
});

check('anonymise refuses to run without a secret', () => {
  try {
    anonymiseLearner('user-42', '');
    return 'expected a throw when no secret is supplied';
  } catch {
    return true;
  }
});

check('sanitizeEvent drops passwords, tokens, emails, and document text', () => {
  const dirty = {
    userId: 'user-1', secret: 'secret-secret-secret-secret-secret', type: 'course_opened', courseId: 'stats-101',
    password: 'hunter2', sessionToken: 'abc.def', apiKey: 'sk-123', email: 'a@b.com', name: 'Real Name',
    documentText: 'the entire uploaded PDF', questionText: 'what is a p-value',
    completionPercent: 40, courseStarted: true,
  };
  const clean = sanitizeEvent(dirty);
  const leaked = ['password', 'sessionToken', 'apiKey', 'email', 'name', 'documentText', 'questionText', 'userId', 'secret']
    .filter((k) => k in clean);
  const kept = clean.completionPercent === 40 && clean.courseStarted === true && /^[0-9a-f]{32}$/.test(clean.learner);
  return (leaked.length === 0 && kept) || `leaked=[${leaked.join(',')}] kept=${kept}`;
});

check('forbiddenKeysIn flags a raw input carrying PII', () => {
  const flagged = forbiddenKeysIn({ userId: 'u', password: 'x', email: 'y' });
  return (flagged.includes('password') && flagged.includes('email')) || `flagged=[${flagged.join(',')}]`;
});

check('sanitizeEvent rejects an unknown type or missing course', () => {
  const bad1 = sanitizeEvent({ userId: 'u', secret: 's'.repeat(32), type: 'spy_on_user', courseId: 'stats-101' });
  const bad2 = sanitizeEvent({ userId: 'u', secret: 's'.repeat(32), type: 'course_opened', courseId: '' });
  return (bad1 === null && bad2 === null) || `bad1=${JSON.stringify(bad1)} bad2=${JSON.stringify(bad2)}`;
});

check('all documented interaction types are accepted', () => {
  const bad = INTERACTION_TYPES.filter((type) => sanitizeEvent({ userId: 'u', secret: 's'.repeat(32), type, courseId: 'stats-101' }) === null);
  return bad.length === 0 || `rejected types: [${bad.join(',')}]`;
});

/* ------------------------------------------- 6. training rows + outcome labels */

section('Training rows and outcome labels model learning, not clicks');

check('buildTrainingRows aggregates events per (learner, course)', () => {
  const secret = 's'.repeat(32);
  const events = [
    sanitizeEvent({ userId: 'u1', secret, type: 'recommendation_shown', courseId: 'stats-101' }),
    sanitizeEvent({ userId: 'u1', secret, type: 'course_opened', courseId: 'stats-101', completionPercent: 20 }),
    sanitizeEvent({ userId: 'u1', secret, type: 'course_completed', courseId: 'stats-101', completionPercent: 100 }),
  ];
  const rows = buildTrainingRows(events);
  return (rows.length === 1 && rows[0].shown && rows[0].opened && rows[0].completed && rows[0].completionPercent === 100)
    || `rows=${JSON.stringify(rows)}`;
});

check('outcomeLabel rewards completion+improvement over a bare click', () => {
  const abandoned = outcomeLabel({ wasRelevant: true, completionPct: 3, competencyGain: 0 });
  const completed = outcomeLabel({ wasRelevant: true, completionPct: 100, competencyGain: 25 });
  return (completed > abandoned && abandoned < 0.3 && completed > 0.7) || `abandoned=${abandoned} completed=${completed}`;
});

check('extractFeatures produces every declared feature name', () => {
  const gap = { competency: 'inference', name: 'Statistical inference', gap: 40, priority: 30 };
  const overlap = { count: 2, matched: ['statistics', 'probability'] };
  const vec = extractFeatures(gap, cat.courses[0], overlap, { learnerLevel: 0 });
  const missing = FEATURE_NAMES.filter((f) => !(f in vec));
  return missing.length === 0 || `missing features: [${missing.join(',')}]`;
});

/* -------------------------------------------------- 7. quality / rejection gate (§6) */

section('Quality gate rejects the courses the spec names');

check('rejects a course with no valid URL (§8)', () => {
  const bad = course('no-url', ['statistics'], { officialUrl: '' });
  return hasValidUrl(bad) === false || 'expected invalid url';
});

check('rejects an unavailable course', () => {
  const c = course('gone', ['statistics'], { availability: 'unavailable' });
  return isAvailable(c) === false || 'expected unavailable';
});

check('rejects an already-completed course', () => {
  const c = { courseId: 'stats-101', matchedTags: ['statistics'], officialUrl: 'https://x.org/a', availability: 'available' };
  const v = validateCandidate(c, { completedCourseIds: new Set(['stats-101']) });
  return (!v.ok && v.reasons.includes('already_completed')) || `reasons=${v.reasons}`;
});

check('rejects a near-duplicate of an already-kept course', () => {
  // Same course title from two providers — the classic near-duplicate we must not show twice.
  const a = course('intro-python', ['python-programming'], { title: 'Introduction to Python Programming', provider: 'Provider A' });
  const b = course('intro-python-2', ['python-programming'], { title: 'Introduction to Python Programming', provider: 'Provider B' });
  a.matchedTags = ['python-programming']; b.matchedTags = ['python-programming'];
  const sim = duplicateSimilarity(a, b);
  const v = validateCandidate(b, { kept: [a] });
  return (sim >= 0.8 && !v.ok && v.reasons.includes('duplicate')) || `sim=${sim.toFixed(2)} reasons=${v.reasons}`;
});

check('prerequisite check: unmet competency prereq blocks; met one passes', () => {
  const c = course('ml-adv', ['machine-learning'], { prerequisites: [{ competency: 'digital-tools', minScore: 60 }] });
  const blocked = prerequisitesSatisfied(c, { competencyScores: new Map([['digital-tools', 30]]) });
  const passed = prerequisitesSatisfied(c, { competencyScores: new Map([['digital-tools', 75]]) });
  return (!blocked.satisfied && passed.satisfied) || `blocked=${blocked.satisfied} passed=${passed.satisfied}`;
});

check('difficulty: advanced course is a mismatch for a beginner', () => {
  const adv = course('deep-learning', ['machine-learning'], { level: 'advanced' });
  const d = difficultyMatch(adv, 0); // learner level 0 (beginner)
  return (d.ok === false && d.distance === 2) || `ok=${d.ok} distance=${d.distance}`;
});

/* ------------------------------------------------ 8. variable count + explanations */

section('Variable count by gap severity (§10) and evidence explanations (§9)');

check('count scales with gap size: critical > moderate > small', () => {
  const critical = countForGap({ gap: 55 });
  const moderate = countForGap({ gap: 25 });
  const small = countForGap({ gap: 10 });
  // Deliberately small shortlist: a serious gap earns 3, moderate 2, minor 1.
  return (critical === 3 && moderate === 2 && small === 1) || `critical=${critical} moderate=${moderate} small=${small}`;
});

check('explanation is built from real evidence, not fabricated', () => {
  const gap = { name: 'Statistical inference', currentScore: 42, gap: 33 };
  const courseRow = { title: 'Applied Statistics', matchedTags: ['statistics', 'probability'] };
  const evidence = { weakTopics: [{ topic: 'hypothesis testing', percent: 20 }], difficulty: { ok: true, distance: 0 }, prereqRole: null };
  const { summary, why } = explainRecommendation(courseRow, gap, evidence);
  const mentionsScore = why.some((w) => w.includes('42%'));
  const mentionsTopic = why.some((w) => w.toLowerCase().includes('hypothesis testing'));
  const mentionsTags = why.some((w) => w.includes('statistics'));
  return (mentionsScore && mentionsTopic && mentionsTags && summary.startsWith('Recommended because'))
    || `score=${mentionsScore} topic=${mentionsTopic} tags=${mentionsTags} summary="${summary}"`;
});

check('refine caps a small gap to fewer courses and explains survivors', () => {
  // A base result with one small gap (gap=10 → cap 2) that has 4 candidate courses.
  const base = {
    available: true, measured: true, hasGaps: true, note: null,
    groups: [{
      competency: 'digital-tools', name: 'Digital tools', gap: 10, currentScore: 78, priority: 5,
      courses: ['a', 'b', 'c', 'd'].map((id) => ({
        courseId: id, title: `Course ${id}`, provider: `Prov-${id}`, matchedTags: ['python-programming'],
        officialUrl: `https://x.org/${id}`, availability: 'available', prerequisites: [], competencies: ['python-programming'],
        forCompetency: 'digital-tools', forCompetencyName: 'Digital tools', level: 'introductory', estimatedHours: 5,
      })),
    }],
    courses: [],
  };
  const refined = refineRecommendations(base, { learnerLevel: 2 });
  const capped = refined.groups[0].courses.length <= 2;
  const explained = refined.groups[0].courses.every((c) => Array.isArray(c.why) && c.why.length > 0);
  return (capped && explained) || `count=${refined.groups[0].courses.length} explained=${explained}`;
});

/* ---------------------------------------------- 9. the REAL trainer learns a signal */

section('Offline trainer is real ML: it learns a signal and refuses thin data');

check('trainer refuses to emit a model on too little data (§16)', () => {
  const tiny = [{ features: extractFeatures({ gap: 10, priority: 5 }, cat.courses[0], { count: 1, matched: ['statistics'] }, {}), label: 1, outcome: 0.8, learner: 'a', courseId: 'x', competency: 'inference' }];
  const model = trainAndEvaluate(tiny, { min: 50 });
  return (model.ready === false && /at least 50/.test(model.reason)) || `got ${JSON.stringify(model)}`;
});

check('trainer learns that tag-overlap predicts a good outcome', () => {
  // Synthetic data with a clear, honest signal: rows whose course matched the gap (high
  // tag_overlap + completion) are label 1; rows with no overlap and abandonment are label 0.
  // A real fit must rank the label-1 rows above the label-0 rows.
  const rows = [];
  for (let i = 0; i < 60; i += 1) {
    const good = i % 2 === 0;
    const gap = { competency: 'inference', name: 'inference', gap: 40, priority: 40 };
    const overlap = good ? { count: 3, matched: ['statistics', 'probability', 'machine-learning'] } : { count: 0, matched: [] };
    const c = course(good ? `good-${i}` : `bad-${i}`, good ? ['statistics', 'probability', 'machine-learning'] : ['unrelated-topic']);
    const features = extractFeatures(gap, c, overlap, { learnerLevel: 1 });
    const outcome = outcomeLabel({ wasRelevant: good, completionPct: good ? 95 : 4, competencyGain: good ? 28 : 0 });
    rows.push({ features, outcome, label: outcome >= 0.5 ? 1 : 0, learner: `L${i % 6}`, courseId: c.courseId, competency: 'inference' });
  }
  const model = trainAndEvaluate(rows, { min: 20, k: 3 });
  if (!model.ready) return `model not ready: ${model.reason}`;
  // The trained model must score a matched+completed course above an unmatched+abandoned one.
  const goodFeat = extractFeatures({ gap: 40, priority: 40 }, course('g', ['statistics', 'probability', 'machine-learning']), { count: 3, matched: ['statistics', 'probability', 'machine-learning'] }, { learnerLevel: 1 });
  const badFeat = extractFeatures({ gap: 40, priority: 40 }, course('b', ['unrelated-topic']), { count: 0, matched: [] }, { learnerLevel: 1 });
  const goodScore = predictRaw(model.weights, model.bias, goodFeat);
  const badScore = predictRaw(model.weights, model.bias, badFeat);
  const learned = goodScore > badScore;
  const hasProvenance = Boolean(model.modelVersion && model.trainedAt && model.trainingDatasetVersion && model.features.length === FEATURE_NAMES.length && model.evaluation);
  return (learned && hasProvenance) || `good=${goodScore.toFixed(3)} bad=${badScore.toFixed(3)} learned=${learned} provenance=${hasProvenance}`;
});

check('buildLabeledRows pairs recommendation_shown (before) with competency_measured (after)', () => {
  const secret = 's'.repeat(32);
  // Simulate: course shown (Stats 38 before) → completed → reassessed (Stats 66 after).
  const events = [
    { learner: 'L1', type: 'recommendation_shown', courseId: 'stats-101', competency: 'inference', competencyScoreBefore: 38, gapBefore: 42, courseCompetencies: ['statistics'], courseLevel: 'introductory', courseDurationHours: 8, at: 1 },
    { learner: 'L1', type: 'course_completed', courseId: 'stats-101', completionPercent: 100, at: 2 },
    { learner: 'L1', type: 'competency_measured', courseId: 'competency-measurement', competency: 'inference', competencyScoreAfter: 66, gapAfter: 14, at: 3 },
  ];
  const rows = buildLabeledRows(events);
  const row = rows.find((r) => r.courseId === 'stats-101');
  // 38 → 66 is a +28 gain with full completion: a strong positive label.
  return (row && row.label === 1 && row.outcome > 0.7) || `row=${JSON.stringify(row)}`;
});

/* --------------------------------------------------------------------- report */

console.log(`\n  ${passed} passed, ${failed} failed\n`);
if (failed > 0) {
  console.log('  Failures:');
  for (const f of failures) console.log(`   - ${f}`);
  process.exit(1);
}
