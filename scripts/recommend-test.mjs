/**
 * Tests the gap-driven course recommender by running it.
 *
 * Usage:  node scripts/recommend-test.mjs        (or:  npm run recommend:test)
 *
 * `server/course-recommendations.mjs` is the bridge between two vocabularies that were
 * never designed to meet: the five MoSPI framework competencies the assessment measures,
 * and the ~30 subject tags the downloaded course dataset uses. Every "recommended for your
 * gaps" card on the dashboard comes out of this module, so these are the assertions that
 * stand between a sensible suggestion and one that sends a learner to a course that does
 * not build the skill they are short on.
 *
 * The module is a pure function of the analytics summary and the catalogue, so the checks
 * build both as plain fixtures and import the real module — no server, no dataset on disk,
 * no key. The analytics fixtures are built by the real `buildAnalyticsSummary`, so the gap
 * ranking under test is the same one the dashboard draws, not a hand-made stand-in.
 *
 * The cases are the ones that matter for correctness:
 *   - the bridge only ever offers a course whose subject tags genuinely fall in the gap
 *   - a course is assigned to the single gap it matches best, never listed twice
 *   - the worst gap leads the flat list, and groups are priority-ordered
 *   - the honest empty states: no dataset, no measurement, no matchable gap
 *   - a gap the bridge cannot reach a course for (leadership, in practice) is dropped
 *     rather than padded with an unrelated course
 *
 * A check returns nothing when it passes and a string when it fails, so a failure prints
 * the value it actually saw rather than just "expected true".
 */

import { buildAnalyticsSummary } from '../server/competency.mjs';
import {
  COMPETENCY_TAGS,
  mappableCompetencies,
  normalizeTag,
  rankedGapCompetencies,
  recommendCoursesForGaps,
  tagOverlap,
} from '../server/course-recommendations.mjs';

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

/** One stored attempt, shaped like `store.attemptsForUser` returns (same helper the competency test uses). */
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

/** A catalogue entry shaped exactly like courses.mjs `catalogue()` returns per course. */
function course(courseId, competencies, { title = courseId, category = 'Technology', estimatedHours = 10, lessons = 12, modules = 3, level = 'introductory' } = {}) {
  return {
    courseId,
    title,
    provider: 'Test Provider',
    category,
    subcategory: '',
    level,
    description: '',
    estimatedHours,
    competencies,
    topics: [],
    license: 'CC-BY',
    officialUrl: '',
    modules,
    lessons,
  };
}

const DEFAULT_ENV = {};

/* A learner weak across the board: data-quality 25%, inference 20%, digital-tools 30%,
   dissemination strong (90%, no gap), leadership 40%. Built by the real analytics engine
   so the gap ranking under test is the genuine one. */
const weakLearner = buildAnalyticsSummary(
  [
    attempt('paper-1', [
      { topic: 'Editing rules', competency: 'data-quality', correct: 5, total: 20 }, // 25%
      { topic: 'Confidence intervals', competency: 'inference', correct: 2, total: 10 }, // 20%
      { topic: 'Chart choice', competency: 'dissemination', correct: 9, total: 10 }, // 90%
      { topic: 'Spreadsheets', competency: 'digital-tools', correct: 3, total: 10 }, // 30%
      { topic: 'Delegation', competency: 'leadership', correct: 4, total: 10 }, // 40%
    ]),
  ],
  { env: DEFAULT_ENV },
);

/* A dataset with at least one honest match for each mappable framework competency,
   plus a course that matches nothing and one that matches two competencies. */
// Tags are written in the real dataset's spelling (Title Case, spaces) on purpose, so a
// green suite means the recommender works against the data it actually receives.
const dataset = {
  available: true,
  courses: [
    course('c-stats', ['Probability', 'Statistics'], { title: 'Intro to Statistics', estimatedHours: 8 }),
    course('c-ml-long', ['Machine Learning'], { title: 'Deep Learning', estimatedHours: 40 }),
    course('c-data', ['Data Science', 'Database Systems'], { title: 'Data Wrangling', estimatedHours: 12 }),
    course('c-python', ['Python Programming', 'Algorithms'], { title: 'Python Programming', estimatedHours: 15 }),
    course('c-signal', ['DSP'], { title: 'Signal Processing', category: 'Technology', estimatedHours: 20 }),
    course('c-unrelated', ['Philosophy', 'Music Theory'], { title: 'History of Music', estimatedHours: 6 }),
    // Matches both inference (Machine Learning) and data-quality (Data Science) — used to
    // prove single-assignment picks the better overlap, not both.
    course('c-datasci-heavy', ['Data Science', 'Machine Learning', 'Statistics'], { title: 'Applied Data Science', estimatedHours: 10 }),
  ],
};

/* -------------------------------------------------------- the tag bridge */

section('the competency -> subject-tag bridge');

check('every mappable competency has at least one tag, and leadership is the thin one', () => {
  const mappable = mappableCompetencies();
  if (!mappable.includes('inference')) return 'inference is not mappable';
  if (!mappable.includes('data-quality')) return 'data-quality is not mappable';
  if (!mappable.includes('digital-tools')) return 'digital-tools is not mappable';
  // leadership is the thinnest bridge: only nursing-leadership and software-engineering,
  // the dataset's sole team/process courses. Every other competency reaches far more.
  const lead = (COMPETENCY_TAGS.leadership ?? []).length;
  if (lead === 0) return 'leadership maps to nothing';
  if (lead >= (COMPETENCY_TAGS['digital-tools'] ?? []).length) return `leadership (${lead} tags) is not thinner than digital-tools`;
});

check('tagOverlap counts only tags that genuinely fall in the competency set', () => {
  const hit = tagOverlap(['probability', 'music-theory'], 'inference');
  if (hit.count !== 1) return `overlap count is ${hit.count}, expected 1`;
  if (!hit.matched.includes('probability')) return `matched is ${JSON.stringify(hit.matched)}`;
  const miss = tagOverlap(['music-theory', 'philosophy'], 'inference');
  if (miss.count !== 0) return `an unrelated course matched inference: ${JSON.stringify(miss.matched)}`;
});

check('tag matching survives the real dataset spelling: Title Case with spaces', () => {
  // The live dataset writes "Machine Learning", "Data Science", "DSP" — Title Case with
  // spaces — while the map is lowercase-hyphenated. This is the exact mismatch that once
  // made every gap report "no matching course": if normalisation regresses, this fails.
  if (normalizeTag('Machine Learning') !== 'machine-learning') return `normalizeTag gave "${normalizeTag('Machine Learning')}"`;
  const infer = tagOverlap(['Machine Learning', 'Statistics'], 'inference');
  if (infer.count !== 2) return `real inference tags matched ${infer.count}/2: ${JSON.stringify(infer.matched)}`;
  const dq = tagOverlap(['Data Science', 'SQL'], 'data-quality');
  if (dq.count !== 2) return `real data-quality tags matched ${dq.count}/2: ${JSON.stringify(dq.matched)}`;
  const tools = tagOverlap(['Python Programming', 'Algorithms'], 'digital-tools');
  if (tools.count !== 2) return `real digital-tools tags matched ${tools.count}/2: ${JSON.stringify(tools.matched)}`;
  // The course's own spelling is preserved in matched (it is what the reason text shows).
  if (!infer.matched.includes('Machine Learning')) return `matched lost the original spelling: ${JSON.stringify(infer.matched)}`;
});

/* -------------------------------------------------------- the gap ranking */

section('the gap ranking this module recommends against');

check('gaps come back worst-priority first and drop competencies with no reachable tag', () => {
  const ranked = rankedGapCompetencies(weakLearner);
  if (ranked.length === 0) return 'no gaps ranked for a learner weak across the board';
  // dissemination scored 90% → no gap → must not appear.
  if (ranked.some((g) => g.competency === 'dissemination')) return 'dissemination has no gap but was ranked';
  // Priority order is non-increasing.
  const pri = ranked.map((g) => g.priority);
  if (JSON.stringify(pri) !== JSON.stringify([...pri].sort((a, b) => b - a))) return `not priority-ordered: ${pri}`;
});

/* -------------------------------------------------------- the recommendations */

section('the recommendations');

check('only ever recommends a course whose tags fall in the gap it is offered for', () => {
  const rec = recommendCoursesForGaps(weakLearner, dataset);
  for (const c of rec.courses) {
    const overlap = tagOverlap(dataset.courses.find((d) => d.courseId === c.courseId).competencies, c.forCompetency);
    if (overlap.count === 0) return `${c.courseId} was offered for ${c.forCompetency} with no matching tag`;
    if (c.matchedTags.length === 0) return `${c.courseId} carries no matchedTags`;
  }
  // The unrelated course must never be recommended.
  if (rec.courses.some((c) => c.courseId === 'c-unrelated')) return 'an unrelated course was recommended';
});

check('a course is assigned to a single gap, never listed under two', () => {
  const rec = recommendCoursesForGaps(weakLearner, dataset, { perGap: 5, limit: 20 });
  const seen = new Map();
  for (const group of rec.groups) {
    for (const c of group.courses) {
      if (seen.has(c.courseId)) return `${c.courseId} appears under both ${seen.get(c.courseId)} and ${group.competency}`;
      seen.set(c.courseId, group.competency);
    }
  }
});

check('the flat list leads with the worst gap and is capped at the limit', () => {
  const ranked = rankedGapCompetencies(weakLearner);
  const worst = ranked[0].competency;
  const rec = recommendCoursesForGaps(weakLearner, dataset, { perGap: 3, limit: 4 });
  if (rec.courses.length > 4) return `flat list has ${rec.courses.length}, over the cap of 4`;
  if (rec.courses.length === 0) return 'flat list is empty for a learner with matchable gaps';
  if (rec.courses[0].forCompetency !== worst) return `first course serves ${rec.courses[0].forCompetency}, not the worst gap ${worst}`;
});

check('within a gap, a quicker win is offered before a much longer course of equal overlap', () => {
  // c-ml-long (40h) and c-stats (8h) both match inference via machine-learning; the
  // shorter one should rank ahead when overlap ties are broken by hours.
  const rec = recommendCoursesForGaps(weakLearner, dataset, { perGap: 5, limit: 20 });
  const inference = rec.groups.find((g) => g.competency === 'inference');
  if (!inference) return 'inference produced no group';
  const ids = inference.courses.map((c) => c.courseId);
  const stats = ids.indexOf('c-stats');
  const long = ids.indexOf('c-ml-long');
  if (stats === -1 || long === -1) return `expected both inference courses, got ${JSON.stringify(ids)}`;
  if (!(stats < long)) return `the 40h course ranked ahead of the 8h one: ${JSON.stringify(ids)}`;
});

check('each recommendation states the gap it addresses in words', () => {
  const rec = recommendCoursesForGaps(weakLearner, dataset);
  const first = rec.courses[0];
  if (!first.reason || !first.forCompetencyName) return 'a recommendation carries no reason or competency name';
  if (!first.reason.toLowerCase().includes(first.forCompetencyName.toLowerCase())) {
    return `the reason does not name the competency: "${first.reason}"`;
  }
});

/* -------------------------------------------------------- honest empty states */

section('honest empty states');

check('no course dataset: available false, a note, and nothing invented', () => {
  const rec = recommendCoursesForGaps(weakLearner, { available: false, courses: [] });
  if (rec.available !== false) return `available is ${rec.available}`;
  if (rec.courses.length !== 0) return 'courses were invented with no dataset';
  if (!rec.note || !/dataset/i.test(rec.note)) return `note does not explain the missing dataset: "${rec.note}"`;
});

check('no assessment yet: measured false, a note pointing at the assessment', () => {
  const noHistory = buildAnalyticsSummary([], { env: DEFAULT_ENV });
  const rec = recommendCoursesForGaps(noHistory, dataset);
  if (rec.measured !== false) return `measured is ${rec.measured}`;
  if (rec.hasGaps !== false) return 'hasGaps was true before any assessment';
  if (rec.courses.length !== 0) return 'courses were recommended before any assessment';
  if (!rec.note || !/assessment/i.test(rec.note)) return `note does not point at the assessment: "${rec.note}"`;
});

check('a strong learner with no gaps: measured true, hasGaps false, no unrelated padding', () => {
  const strong = buildAnalyticsSummary(
    [
      attempt('strong-1', [
        { topic: 'Editing rules', competency: 'data-quality', correct: 19, total: 20 },
        { topic: 'Confidence intervals', competency: 'inference', correct: 10, total: 10 },
        { topic: 'Chart choice', competency: 'dissemination', correct: 10, total: 10 },
        { topic: 'Spreadsheets', competency: 'digital-tools', correct: 10, total: 10 },
        { topic: 'Delegation', competency: 'leadership', correct: 10, total: 10 },
      ]),
    ],
    { env: DEFAULT_ENV },
  );
  const rec = recommendCoursesForGaps(strong, dataset);
  if (rec.measured !== true) return 'a sat paper reported as not measured';
  if (rec.hasGaps !== false) return 'a learner above every target still had gaps';
  if (rec.courses.length !== 0) return `${rec.courses.length} courses recommended to a learner with no gaps`;
  if (!rec.note) return 'no note explaining why there is nothing to recommend';
});

check('a gap the bridge cannot reach is dropped, not padded with an unrelated course', () => {
  // A learner weak ONLY in leadership, against a dataset with no software-engineering
  // course. leadership maps only to software-engineering, so there is no honest match,
  // and the module must return no courses rather than offer an unrelated one.
  const leadershipOnly = buildAnalyticsSummary(
    [attempt('lead-1', [{ topic: 'Delegation', competency: 'leadership', correct: 2, total: 10 }])],
    { env: DEFAULT_ENV },
  );
  const noSE = { available: true, courses: [course('c-stats', ['probability-statistics'], { title: 'Stats' })] };
  const rec = recommendCoursesForGaps(leadershipOnly, noSE);
  if (rec.courses.length !== 0) return `${rec.courses.length} courses offered for an unreachable gap`;
  if (rec.hasGaps !== false) return 'hasGaps true when the only gap has no matching course';
  if (!rec.note) return 'no note for an unmatchable gap';
});

/* ------------------------------------------- level suitability + relevance floor */

section('level suitability and the minimum-relevance floor');

check('a foundational gap prefers a beginner course over an advanced one at equal overlap', () => {
  // Learner very weak in inference (10%) — still building foundations. Two equally-relevant
  // courses (both match one inference tag); the beginner one must rank first.
  const learner = buildAnalyticsSummary(
    [attempt('p', [{ topic: 'CIs', competency: 'inference', correct: 1, total: 10 }])], // 10%
    { env: DEFAULT_ENV },
  );
  const cat = {
    available: true,
    courses: [
      course('adv', ['Machine Learning'], { title: 'Advanced ML', level: 'advanced', estimatedHours: 10 }),
      course('beg', ['Machine Learning'], { title: 'ML Basics', level: 'beginner', estimatedHours: 10 }),
    ],
  };
  const rec = recommendCoursesForGaps(learner, cat);
  if (rec.courses.length < 1) return 'no courses recommended';
  if (rec.courses[0].courseId !== 'beg') return `advanced course led instead of beginner (${rec.courses[0].courseId})`;
});

check('the minimum-relevance floor can exclude a single-tag match when raised', () => {
  const learner = buildAnalyticsSummary(
    [attempt('p', [{ topic: 'CIs', competency: 'inference', correct: 1, total: 10 }])],
    { env: DEFAULT_ENV },
  );
  // One course matches inference on a single tag. Default floor (1) keeps it; a floor of 2
  // excludes it rather than recommending on one incidental match.
  const cat = { available: true, courses: [course('one', ['Machine Learning'], { title: 'One-tag ML' })] };
  const kept = recommendCoursesForGaps(learner, cat, { minTagOverlap: 1 });
  if (kept.courses.length !== 1) return `default floor should keep the single-tag match, got ${kept.courses.length}`;
  const dropped = recommendCoursesForGaps(learner, cat, { minTagOverlap: 2 });
  if (dropped.courses.length !== 0) return `raising the floor to 2 should drop the single-tag match, got ${dropped.courses.length}`;
});

/* --------------------------------------------------------------- report */

console.log(`\n  ${passed} passed, ${failed} failed.`);
if (failed > 0) {
  console.log('  Failures:');
  for (const failure of failures) console.log(`    - ${failure}`);
  console.log('');
}
process.exit(failed > 0 ? 1 : 0);
