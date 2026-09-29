import { normalizeTag } from '../course-recommendations.mjs';

export function hasValidUrl(course) {
  const url = course?.officialUrl;
  if (typeof url !== 'string' || url === '') return false;
  try {
    const parsed = new URL(url);
    return (parsed.protocol === 'https:' || parsed.protocol === 'http:') && parsed.hostname.includes('.');
  } catch {
    return false;
  }
}

export function isAvailable(course) {
  return (course?.availability ?? 'available') === 'available';
}

const LEVEL_RANK = { foundational: 0, beginner: 0, introductory: 0, intermediate: 1, advanced: 2, expert: 3 };
export function courseLevelRank(level) {
  const key = String(level ?? '').toLowerCase().trim();
  return key in LEVEL_RANK ? LEVEL_RANK[key] : null;
}

export function difficultyMatch(course, learnerLevel) {
  const courseLevel = courseLevelRank(course?.level);
  if (courseLevel === null) return { ok: true, distance: null };
  const distance = courseLevel - (Number.isFinite(learnerLevel) ? learnerLevel : 0);
  return { ok: distance <= 1, distance };
}

export function prerequisitesSatisfied(course, { completedCourseIds = new Set(), competencyScores = new Map() } = {}) {
  const prereqs = Array.isArray(course?.prerequisites) ? course.prerequisites : [];
  if (prereqs.length === 0) return { satisfied: true, missing: [] };

  const missing = [];
  for (const prereq of prereqs) {
    if (typeof prereq === 'string') {
      if (!completedCourseIds.has(prereq)) missing.push({ type: 'course', courseId: prereq });
    } else if (prereq && typeof prereq === 'object' && typeof prereq.competency === 'string') {
      const need = Number.isFinite(prereq.minScore) ? prereq.minScore : 50;
      const have = competencyScores.get(prereq.competency);
      if (!Number.isFinite(have) || have < need) {
        missing.push({ type: 'competency', competency: prereq.competency, need, have: Number.isFinite(have) ? have : 0 });
      }
    }
    // An unrecognised prerequisite shape is ignored rather than treated as unmet — a
    // malformed field must not silently hide every course that carries it.
  }
  return { satisfied: missing.length === 0, missing };
}

export function duplicateSimilarity(a, b) {
  const titleWords = (c) =>
    new Set(
      String(c?.title ?? '')
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, ' ')
        .split(/\s+/)
        .filter((w) => w.length > 2), // drop "to", "of", "the", "a"
    );
  const jaccard = (x, y) => {
    if (x.size === 0 && y.size === 0) return 0;
    let inter = 0;
    for (const v of x) if (y.has(v)) inter += 1;
    return inter / (x.size + y.size - inter);
  };
  const titleSim = jaccard(titleWords(a), titleWords(b));
  const tagSim = jaccard(
    new Set((a?.competencies ?? []).map(normalizeTag)),
    new Set((b?.competencies ?? []).map(normalizeTag)),
  );
  const sameProvider = a?.provider && a.provider === b?.provider ? 0.1 : 0;
  return Math.min(1, 0.6 * titleSim + 0.3 * tagSim + sameProvider);
}

export const DEFAULTS = Object.freeze({
  minRelevance: 0.0001, // any honest tag overlap counts; candidate-gen already required >0
  duplicateThreshold: 0.8,
});

export function validateCandidate(candidate, ctx = {}) {
  const reasons = [];
  const { completedCourseIds = new Set(), competencyScores = new Map(), learnerLevel = 0, kept = [] } = ctx;

  if (completedCourseIds.has(candidate.courseId)) reasons.push('already_completed');
  if (!isAvailable(candidate)) reasons.push('unavailable');
  if (!hasValidUrl(candidate)) reasons.push('invalid_url');

  const prereq = prerequisitesSatisfied(candidate, { completedCourseIds, competencyScores });
  if (!prereq.satisfied) reasons.push('missing_prerequisites');

  const difficulty = difficultyMatch(candidate, learnerLevel);
  if (!difficulty.ok && !prereq.satisfied) reasons.push('too_advanced');

  const overlapCount = Array.isArray(candidate.matchedTags) ? candidate.matchedTags.length : 0;
  if (overlapCount <= 0) reasons.push('low_relevance');

  for (const other of kept) {
    if (duplicateSimilarity(candidate, other) >= DEFAULTS.duplicateThreshold) {
      reasons.push('duplicate');
      break;
    }
  }

  return { ok: reasons.length === 0, reasons, prereq, difficulty };
}
