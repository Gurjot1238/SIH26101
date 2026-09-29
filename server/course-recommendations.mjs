import { COMPETENCY_IDS } from './progress.mjs';
import { courseLevelRank } from './recommend/quality.mjs';

export const FOUNDATIONAL_MAX_SCORE = 50;

export const COMPETENCY_TAGS = {
  'data-quality': [
    'data-science',
    'data-engineering',
    'data-analysis',
    'database-systems',
    'data-structures',
    'sql',
  ],
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
  dissemination: [],
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
  leadership: [
    'software-engineering',
  ],
};

export function normalizeTag(tag) {
  return String(tag ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function mappableCompetencies() {
  return COMPETENCY_IDS.filter((id) => (COMPETENCY_TAGS[id] ?? []).length > 0);
}

export function tagOverlap(courseCompetencies, competencyId) {
  const wanted = new Set((COMPETENCY_TAGS[competencyId] ?? []).map(normalizeTag));
  if (wanted.size === 0) return { count: 0, matched: [] };
  const matched = [];
  for (const tag of Array.isArray(courseCompetencies) ? courseCompetencies : []) {
    if (wanted.has(normalizeTag(tag))) matched.push(tag);
  }
  return { count: matched.length, matched };
}

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

  const gapOrder = rankedGaps.map((g) => g.competency);
  const bestFor = new Map();
  for (const id of gapOrder) bestFor.set(id, []);

  for (const course of allCourses) {
    let winner = null;
    for (const id of gapOrder) {
      const overlap = tagOverlap(course.competencies, id);
      if (overlap.count < minTagOverlap) continue;
      if (!winner || overlap.count > winner.overlap.count) {
        winner = { competency: id, overlap };
      }
    }
    if (winner) bestFor.get(winner.competency).push({ course, overlap: winner.overlap });
  }

  const groups = rankedGaps
    .map((gap) => {
      const foundational = Number.isFinite(gap.currentScore) && gap.currentScore < foundationalMaxScore;
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

function hoursOf(course) {
  return Number.isFinite(course?.estimatedHours) ? course.estimatedHours : Number.POSITIVE_INFINITY;
}

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
