import { normalizeTag, tagOverlap } from '../course-recommendations.mjs';

export const FEATURE_NAMES = [
  'competency_gap',          // 0-100: how far below target the course's competency is
  'competency_priority',     // analytics' gap x weakness x confidence score
  'tag_overlap',             // count of course tags that match the gap competency
  'tag_overlap_ratio',       // overlap / course tag count — density of relevance
  'level_match',             // 1 if course level fits the learner's level, else 0..1
  'is_prerequisite_gap',     // 1 if a prerequisite competency is also weak (recommend earlier)
  'course_hours_norm',       // estimated hours scaled to 0-1 (shorter = quicker win)
  'already_started',         // 1 if the learner has opened this course before
  'prior_completion_pct',    // 0-1 completion the learner already reached here
  'times_recommended_before',// how often this course was shown before (fatigue signal)
];

const LEVEL_RANK = { foundational: 0, beginner: 0, intermediate: 1, advanced: 2, expert: 3 };

function levelRank(level) {
  const key = String(level ?? '').toLowerCase().trim();
  return key in LEVEL_RANK ? LEVEL_RANK[key] : null;
}

export function learnerLevelRank(overallScore) {
  const s = Number.isFinite(overallScore) ? overallScore : 0;
  if (s < 50) return 0;
  if (s < 70) return 1;
  if (s < 85) return 2;
  return 3;
}

export function extractFeatures(gap, course, overlap, context = {}) {
  const history = context.history instanceof Map ? context.history : new Map();
  const hist = history.get(course.courseId) ?? {};

  const courseLevel = levelRank(course.level);
  const learnerLevel = Number.isFinite(context.learnerLevel) ? context.learnerLevel : 0;
  let levelMatch = 0.5;
  if (courseLevel !== null) {
    const distance = courseLevel - learnerLevel;
    levelMatch = distance >= 0 && distance <= 1 ? 1 : Math.max(0, 1 - Math.abs(distance) / 3);
  }

  const courseTagCount = Array.isArray(course.competencies) ? course.competencies.length : 0;
  const hours = Number.isFinite(course.estimatedHours) ? course.estimatedHours : null;

  return {
    competency_gap: Number.isFinite(gap.gap) ? gap.gap : 0,
    competency_priority: Number.isFinite(gap.priority) ? gap.priority : 0,
    tag_overlap: overlap?.count ?? 0,
    tag_overlap_ratio: courseTagCount > 0 ? (overlap?.count ?? 0) / courseTagCount : 0,
    level_match: levelMatch,
    is_prerequisite_gap: 0,
    course_hours_norm: hours === null ? 0.5 : Math.max(0, Math.min(1, hours / 40)),
    already_started: hist.started ? 1 : 0,
    prior_completion_pct: Number.isFinite(hist.completionPct) ? hist.completionPct / 100 : 0,
    times_recommended_before: Number.isFinite(hist.timesRecommended) ? hist.timesRecommended : 0,
  };
}

export function outcomeLabel({ wasRelevant, completionPct, competencyGain }) {
  const relevance = wasRelevant ? 1 : 0;
  const completion = Math.max(0, Math.min(1, (Number(completionPct) || 0) / 100));
  const improvement = Math.max(0, Math.min(1, (Number(competencyGain) || 0) / 30));
  return Number((0.2 * relevance + 0.3 * completion + 0.5 * improvement).toFixed(4));
}

export { tagOverlap, normalizeTag };
