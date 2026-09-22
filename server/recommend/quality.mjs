/**
 * The course quality / relevance gate (§6, §8) — the rules a candidate must pass before a
 * learner is ever shown it. Candidate generation is generous on purpose (it offers anything
 * that touches a gap); this module is where we say no.
 *
 * Every check here is a pure function of data we actually hold — the learner's competency
 * scores, the courses they have completed, and the course's own metadata. Nothing calls out,
 * nothing guesses. A course is rejected only for a concrete, explainable reason, and the
 * reason travels with the rejection so the pipeline (and a reviewer) can see why.
 *
 * The rejections the spec names:
 *   - already completed        (don't re-recommend a finished course)
 *   - unavailable              (metadata says it's not offered)
 *   - invalid/missing URL      (§8: never recommend a course we can't link to)
 *   - missing prerequisites    (§4C: don't send a beginner into an advanced course)
 *   - relevance too low        (no honest competency overlap)
 *   - duplicate/near-duplicate (don't show two courses that are effectively the same)
 *
 * What this module deliberately does NOT do: invent a "quality score" out of nothing. Course
 * quality here means verifiable things (has a real URL, is available, isn't a dupe), not a
 * fabricated 1-5 rating we have no data for.
 */

import { normalizeTag } from '../course-recommendations.mjs';

/** A minimally valid official URL: http(s) and a host. §8 — no URL, no recommendation. */
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

/** Availability is a plain flag off the course metadata (courses.mjs normalises it). */
export function isAvailable(course) {
  return (course?.availability ?? 'available') === 'available';
}

/** Coarse 0..3 difficulty rank shared with the feature extractor's scale. Unknown → null. */
const LEVEL_RANK = { foundational: 0, beginner: 0, introductory: 0, intermediate: 1, advanced: 2, expert: 3 };
export function courseLevelRank(level) {
  const key = String(level ?? '').toLowerCase().trim();
  return key in LEVEL_RANK ? LEVEL_RANK[key] : null;
}

/**
 * Is this course at a sensible difficulty for the learner? A course at or one step above the
 * learner's level is ideal; more than one step above is a difficulty *mismatch* and is only
 * allowed through when prerequisites are satisfied (checked separately). Unknown course level
 * is treated as acceptable — we don't reject for missing metadata, only for a known bad fit.
 *
 * Returns { ok, distance } where distance is courseLevel - learnerLevel (null if unknown).
 */
export function difficultyMatch(course, learnerLevel) {
  const courseLevel = courseLevelRank(course?.level);
  if (courseLevel === null) return { ok: true, distance: null };
  const distance = courseLevel - (Number.isFinite(learnerLevel) ? learnerLevel : 0);
  return { ok: distance <= 1, distance };
}

/**
 * Are this course's prerequisites satisfied by the learner (§4C)?
 *
 * Two prerequisite shapes are accepted, because the dataset may express either:
 *   - a course id string ("python-basics")     → satisfied if that course is completed
 *   - a competency requirement object          → satisfied if the learner's score meets it
 *       { competency: 'digital-tools', minScore: 50 }
 *
 * `completedCourseIds` is a Set of course ids the learner has finished; `competencyScores`
 * is a Map competencyId -> current score (0-100). A course with no declared prerequisites is
 * trivially satisfied — most of the dataset is in that state today, and that must not block.
 *
 * Returns { satisfied, missing:[...] } so the caller can both filter and explain.
 */
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

/**
 * How similar are two courses, 0-1, for near-duplicate detection. A blend of title-word
 * overlap (Jaccard) and competency-tag overlap — enough to catch "Intro to Python" vs
 * "Introduction to Python Programming" without a heavy string-distance library. Two courses
 * over the threshold are considered the same offering and only the better-ranked one is kept.
 */
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
  // Same provider nudges similarity up a touch; different providers are more likely distinct.
  const sameProvider = a?.provider && a.provider === b?.provider ? 0.1 : 0;
  return Math.min(1, 0.6 * titleSim + 0.3 * tagSim + sameProvider);
}

export const DEFAULTS = Object.freeze({
  /** Below this overlap ratio a course is "not really about" the gap and is rejected. */
  minRelevance: 0.0001, // any honest tag overlap counts; candidate-gen already required >0
  /** At/above this similarity two courses are treated as the same offering. */
  duplicateThreshold: 0.8,
});

/**
 * Run every gate on one candidate. Returns { ok, reasons } — `reasons` lists why it was
 * rejected (empty when accepted). The caller filters on `ok` and can log/show `reasons`.
 *
 *   candidate  a recommendation row (has courseId, title, matchedTags, provider, etc.)
 *   ctx        { completedCourseIds, competencyScores, learnerLevel, kept }
 *              `kept` is the list of already-accepted candidates, for duplicate checks.
 */
export function validateCandidate(candidate, ctx = {}) {
  const reasons = [];
  const { completedCourseIds = new Set(), competencyScores = new Map(), learnerLevel = 0, kept = [] } = ctx;

  if (completedCourseIds.has(candidate.courseId)) reasons.push('already_completed');
  if (!isAvailable(candidate)) reasons.push('unavailable');
  if (!hasValidUrl(candidate)) reasons.push('invalid_url');

  const prereq = prerequisitesSatisfied(candidate, { completedCourseIds, competencyScores });
  if (!prereq.satisfied) reasons.push('missing_prerequisites');

  const difficulty = difficultyMatch(candidate, learnerLevel);
  // Too-hard is only fatal when prerequisites are ALSO unmet; a stretch course with its
  // prerequisites satisfied is allowed (the learner has earned the right to attempt it).
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
