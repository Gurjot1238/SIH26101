/**
 * Gap-driven course recommendations: which real dataset courses to open next,
 * chosen from the learner's own competency gaps.
 *
 * Two vocabularies have to meet here, and they were never designed to.
 *
 *   - The assessment measures five MoSPI framework competencies (server/progress.mjs
 *     COMPETENCY_IDS): data-quality, inference, dissemination, digital-tools,
 *     leadership. `buildAnalyticsSummary` in competency.mjs ranks a learner's gaps and
 *     priorities against these five.
 *   - The downloaded course dataset (server/courses.mjs) tags each course with subject
 *     competencies drawn from a different, ~30-term controlled vocabulary built for
 *     open CS / engineering / medical courseware: algorithms, machine-learning,
 *     probability-statistics, signal-processing, and so on.
 *
 * There is no shared term between the two, so a bridge is unavoidable. COMPETENCY_TAGS
 * below is that bridge, and it is deliberately honest: it maps each framework
 * competency to the subject tags whose material genuinely builds it, and no further.
 * The dataset is CS/engineering/medical courseware, not statistical-office training, so
 * some competencies (inference, digital-tools) map to a lot of real courses and others
 * (dissemination, leadership) map to few or none. When a gap has no honestly matching
 * course, this module returns nothing for it rather than padding the list with a course
 * that does not build the skill — a wrong recommendation is worse than an empty one.
 *
 * Everything here is a pure function of the analytics summary and the catalogue. It
 * invents no scores and no courses; the ranking is the analytics' own gap/priority
 * order, and the courses are whatever the dataset actually contains.
 */

import { COMPETENCY_IDS } from './progress.mjs';
import { courseLevelRank } from './recommend/quality.mjs';

/**
 * A learner scoring below this on a competency is still building its foundations, so for
 * that gap a beginner course is ranked ahead of an advanced one at equal topic overlap
 * (spec: "prefer foundational learning first; do not push Advanced to a 35% learner").
 * Configurable via the `foundationalMaxScore` option; kept as a plain threshold, not
 * scattered through the file.
 */
export const FOUNDATIONAL_MAX_SCORE = 50;

/**
 * Framework competency -> the dataset subject tags that build it.
 *
 * Each list is the set of `course.json` `competencies` tags whose courses teach
 * material a MoSPI officer would recognise as that framework area. The rationale is
 * kept next to each so a reviewer can argue with a specific line rather than the whole
 * table.
 */
export const COMPETENCY_TAGS = {
  // Handling, cleaning, structuring and managing data before it is analysed. These are
  // the dataset's data-engineering / data-management / health-data tags.
  // Only genuine data-handling subjects. The health-informatics / bioinformatics tags were
  // removed: a nursing or bio course is not what a learner short on data quality needs, and
  // surfacing one read as a random, off-topic recommendation.
  'data-quality': [
    'data-science',
    'data-engineering',
    'data-analysis',
    'database-systems',
    'data-structures',
    'sql',
  ],
  // Drawing conclusions from data under uncertainty — the statistical core.
  inference: [
    'probability',
    'statistics',
    'statistical-learning',
    'machine-learning',
    'artificial-intelligence',
    'data-science',
    'natural-language-processing',
    'computer-vision',
  ],
  // Turning results into something an audience can read. The dataset has NO genuine
  // communication/reporting/visualisation courses — signal- and image-processing are about
  // processing data, not disseminating it, and recommending "Signals and Systems" for a
  // communication gap read as noise. So this maps to nothing, and a dissemination gap is
  // reported honestly as "no matching course" rather than filled with an unrelated one.
  dissemination: [],
  // Practical computing fluency: writing code, using tools, understanding the systems
  // underneath. This is where the CS-heavy dataset is richest.
  'digital-tools': [
    'python-programming',
    'programming-fundamentals',
    'computational-thinking',
    'algorithms',
    'search-algorithms',
    'software-engineering',
    'operating-systems',
    'computer-networks',
    'computer-architecture',
    'digital-logic',
    'distributed-systems',
    'database-systems',
    'cybersecurity',
    'software-security',
    'system-design',
    'java',
    'sql',
    'computer-science',
    'theory-of-computation',
    'complexity',
    'linear-algebra',
    'discrete-mathematics',
    'mathematics',
  ],
  // Team leadership is a role expectation, not a technical subject. The dataset carries
  // one nursing-leadership course, and software-engineering (which covers process and
  // working in teams) is the only other thin bridge; often this still yields nothing,
  // and that is reported honestly rather than filled with an unrelated course.
  // Only software-engineering (process, working in teams) — the nursing-leadership tag was
  // removed so a learner never gets a nursing course recommended for a leadership gap.
  // Often this maps to nothing, which is reported honestly rather than filled with a
  // course that does not build the skill.
  leadership: [
    'software-engineering',
  ],
};

/**
 * Normalise a subject tag to a stable comparison key.
 *
 * The two vocabularies do not agree on spelling as well as on words: the dataset writes
 * "Machine Learning" and "DSP" in Title Case with spaces, while the map above is written
 * in lowercase hyphenated slugs. Comparing them raw silently matches nothing, so both
 * sides are normalised here first — lowercased, and every run of non-alphanumerics folded
 * to a single hyphen — so "Machine Learning", "machine-learning" and "machine_learning"
 * all meet at "machine-learning".
 */
export function normalizeTag(tag) {
  return String(tag ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** The framework competencies this bridge can currently reach at least one tag for. */
export function mappableCompetencies() {
  return COMPETENCY_IDS.filter((id) => (COMPETENCY_TAGS[id] ?? []).length > 0);
}

/**
 * How well one course matches one framework competency: the number of the course's
 * subject tags that fall in that competency's tag set. Zero means no honest match.
 */
export function tagOverlap(courseCompetencies, competencyId) {
  const wanted = new Set((COMPETENCY_TAGS[competencyId] ?? []).map(normalizeTag));
  if (wanted.size === 0) return { count: 0, matched: [] };
  const matched = [];
  for (const tag of Array.isArray(courseCompetencies) ? courseCompetencies : []) {
    // Keep the course's own spelling in `matched` (it is what the reason text shows),
    // but compare on the normalised key so casing and spacing never hide a real match.
    if (wanted.has(normalizeTag(tag))) matched.push(tag);
  }
  return { count: matched.length, matched };
}

/**
 * The learner's gap competencies, worst first, as {competency, name, gap, priority}.
 *
 * Priority is the analytics' own gap x weakness x confidence score; where two gaps tie
 * on priority the larger raw gap wins, then the name, so the order is stable. A gap the
 * bridge cannot reach any course for is dropped here, because recommending against it is
 * impossible and listing it would only raise a question this module cannot answer.
 */
export function rankedGapCompetencies(analytics) {
  const gaps = Array.isArray(analytics?.gaps) ? analytics.gaps : [];
  const priorities = Array.isArray(analytics?.priorities) ? analytics.priorities : [];
  const priorityFor = new Map(priorities.map((row) => [row.competency, row.priority]));

  return gaps
    .filter((row) => (COMPETENCY_TAGS[row.competency] ?? []).length > 0)
    .map((row) => ({
      competency: row.competency,
      name: row.name,
      gap: row.gap,
      currentScore: row.currentScore,
      requiredScore: row.requiredScore,
      priority: priorityFor.get(row.competency) ?? 0,
    }))
    .sort((a, b) => b.priority - a.priority || b.gap - a.gap || a.name.localeCompare(b.name));
}

/**
 * Recommend dataset courses for a learner's competency gaps.
 *
 *   analytics    the payload from buildAnalyticsSummary (the learner's own results)
 *   cat          the payload from courses.mjs catalogue() ({ available, courses, ... })
 *   perGap       how many courses to suggest per gap competency (default 3)
 *   limit        overall cap on the flat `courses` list (default 6)
 *
 * A course is assigned to the single gap competency it matches best (most overlapping
 * tags), so the same course never appears under two gaps. Within a gap, courses are
 * ordered by overlap count, then by shorter estimated hours (a quicker win first), then
 * by title. The flat `courses` list interleaves the gaps in priority order so the very
 * first suggestion addresses the worst gap.
 *
 * Returns a complete, valid shape even when there is nothing to recommend, so the client
 * renders its own empty state from the flags rather than from a thrown error:
 *   available     is a course dataset present at all
 *   measured      has the learner sat enough to have measured gaps
 *   hasGaps       are there gap competencies the bridge can reach
 *   groups        [{ competency, name, gap, priority, courses: [...] }]
 *   courses       flat, de-duplicated, priority-interleaved, capped at `limit`
 */
export function recommendCoursesForGaps(analytics, cat, { perGap = 3, limit = 6, minTagOverlap = 1, foundationalMaxScore = FOUNDATIONAL_MAX_SCORE } = {}) {
  const available = Boolean(cat?.available);
  const measured = Boolean(analytics?.measured);
  const allCourses = Array.isArray(cat?.courses) ? cat.courses : [];

  const empty = {
    available,
    measured,
    hasGaps: false,
    groups: [],
    courses: [],
    note: null,
  };

  if (!available || !measured) {
    return {
      ...empty,
      note: !available
        ? 'No course dataset is loaded, so there is nothing to recommend yet.'
        : 'Take an assessment first — recommendations are built from your measured gaps.',
    };
  }

  const rankedGaps = rankedGapCompetencies(analytics);
  if (rankedGaps.length === 0) {
    return {
      ...empty,
      note: 'No open competency gap can be matched to a course in the current dataset.',
    };
  }

  // Assign each course to its single best-matching gap competency.
  const gapOrder = rankedGaps.map((g) => g.competency);
  const bestFor = new Map(); // competency -> [{ course, overlap }]
  for (const id of gapOrder) bestFor.set(id, []);

  for (const course of allCourses) {
    let winner = null;
    for (const id of gapOrder) {
      const overlap = tagOverlap(course.competencies, id);
      // A configurable minimum relevance: a course sharing fewer than this many competency
      // tags with the gap is not relevant enough to recommend (spec §29 — never surface a
      // course on one incidental keyword). Default 1 keeps the dataset's curated single-tag
      // matches, which are genuine competency coverage, not stray keywords.
      if (overlap.count < minTagOverlap) continue;
      // Prefer the higher overlap; tie broken by the gap's own priority order (earlier
      // in gapOrder wins), which is why we iterate gapOrder in order and use `>` only.
      if (!winner || overlap.count > winner.overlap.count) {
        winner = { competency: id, overlap };
      }
    }
    if (winner) bestFor.get(winner.competency).push({ course, overlap: winner.overlap });
  }

  const groups = rankedGaps
    .map((gap) => {
      // For a gap where the learner is still building foundations, a beginner course is
      // preferred over an advanced one at equal topic overlap. Level only breaks ties after
      // relevance, so it never promotes a less-relevant course — it just picks the more
      // suitable of two equally-relevant ones (spec §10/§15).
      const foundational = Number.isFinite(gap.currentScore) && gap.currentScore < foundationalMaxScore;
      // Unknown level sorts last (never ahead of a known beginner course), and never NaN.
      const levelValue = (course) => { const r = courseLevelRank(course.level); return r === null ? 99 : r; };
      const ranked = (bestFor.get(gap.competency) ?? [])
        .sort(
          (a, b) =>
            b.overlap.count - a.overlap.count ||
            (foundational ? levelValue(a.course) - levelValue(b.course) : 0) ||
            hoursOf(a.course) - hoursOf(b.course) ||
            String(a.course.title).localeCompare(String(b.course.title)),
        )
        .slice(0, perGap)
        .map(({ course, overlap }) => summariseRecommendation(course, gap, overlap));
      return {
        competency: gap.competency,
        name: gap.name,
        gap: gap.gap,
        currentScore: gap.currentScore,
        requiredScore: gap.requiredScore,
        priority: gap.priority,
        courses: ranked,
      };
    })
    .filter((group) => group.courses.length > 0);

  // Interleave the groups so the flat list leads with the worst gap's top course.
  const flat = [];
  const cursors = groups.map(() => 0);
  let added = true;
  while (added && flat.length < limit) {
    added = false;
    for (let g = 0; g < groups.length && flat.length < limit; g += 1) {
      const i = cursors[g];
      if (i < groups[g].courses.length) {
        flat.push(groups[g].courses[i]);
        cursors[g] += 1;
        added = true;
      }
    }
  }

  return {
    available: true,
    measured: true,
    hasGaps: groups.length > 0,
    groups,
    courses: flat,
    note: groups.length === 0 ? 'No open competency gap can be matched to a course in the current dataset.' : null,
  };
}

/** Estimated hours as a sortable number; a course with no estimate sorts last. */
function hoursOf(course) {
  return Number.isFinite(course?.estimatedHours) ? course.estimatedHours : Number.POSITIVE_INFINITY;
}

/**
 * One recommendation row: enough for a card that links to /catalog/:id, plus the
 * reason it was chosen so the suggestion can be checked rather than trusted.
 */
function summariseRecommendation(course, gap, overlap) {
  return {
    courseId: course.courseId,
    title: course.title,
    provider: course.provider,
    category: course.category,
    level: course.level,
    estimatedHours: course.estimatedHours,
    lessons: course.lessons,
    modules: course.modules,
    // Carried through so the recommendation card can link out and so the quality gate
    // (server/recommend/quality.mjs) can check the real URL, availability and prerequisites.
    // Defaulted for older catalogue rows that predate these fields — never invented.
    officialUrl: course.officialUrl ?? '',
    availability: course.availability ?? 'available',
    prerequisites: Array.isArray(course.prerequisites) ? course.prerequisites : [],
    competencies: Array.isArray(course.competencies) ? course.competencies : [],
    matchedTags: overlap.matched,
    forCompetency: gap.competency,
    forCompetencyName: gap.name,
    reason: `Builds ${gap.name.toLowerCase()} (you are ${gap.gap} point${gap.gap === 1 ? '' : 's'} short) — this course covers ${overlap.matched.join(', ')}.`,
  };
}
