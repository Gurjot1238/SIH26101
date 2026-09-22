/**
 * The single feature definition shared by training and inference.
 *
 * A recommender is only honest if the features it *trains* on are the exact features it
 * *scores* with. So this file is the one place that turns "a learner + a candidate course +
 * their history" into a numeric feature vector, and both sides use it:
 *
 *   - Offline training reads the interaction log (server/recommend/interactions.mjs),
 *     replays each historical (learner, course) pair through `extractFeatures`, pairs the
 *     vector with the observed outcome label, and fits weights.
 *   - Online inference calls the same `extractFeatures` for each candidate course and feeds
 *     the vector to the trained model (server/recommend/model.mjs).
 *
 * Every feature here is derived only from LEARNING data — competency scores, gaps, course
 * metadata, anonymised interaction counts. Nothing here reads a password, a session token,
 * an email, or document text; those never enter a feature vector (see PRIVACY note below).
 *
 * The label the trainer predicts is NOT "did they click". It is a learning-outcome score
 * (see `outcomeLabel`): relevance + completion + measured competency improvement. A course
 * clicked and abandoned at 3% is a weak label; a course completed that moved a competency
 * from 38% to 67% is a strong one.
 */

import { normalizeTag, tagOverlap } from '../course-recommendations.mjs';

/**
 * The ordered feature names. The trained model.json must list the same names (in its own
 * order — `scoreVector` aligns by name, not position), and the training script must build
 * its matrix from `extractFeatures` so the columns cannot drift from what inference sends.
 */
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

/** Map a textual level to a 0..3 rank so distance is meaningful. Unknown → null. */
const LEVEL_RANK = { foundational: 0, beginner: 0, intermediate: 1, advanced: 2, expert: 3 };

function levelRank(level) {
  const key = String(level ?? '').toLowerCase().trim();
  return key in LEVEL_RANK ? LEVEL_RANK[key] : null;
}

/**
 * The learner's level inferred from their overall score, on the same 0..3 scale:
 * <50 foundational, <70 intermediate, <85 advanced, else expert. Deliberately coarse — it
 * only has to place the learner near the right course difficulty.
 */
export function learnerLevelRank(overallScore) {
  const s = Number.isFinite(overallScore) ? overallScore : 0;
  if (s < 50) return 0;
  if (s < 70) return 1;
  if (s < 85) return 2;
  return 3;
}

/**
 * Build the feature vector for one candidate course against one learner.
 *
 *   gap        a ranked-gap row { competency, name, gap, priority, currentScore, ... }
 *   course     a catalogue course summary (courses.mjs summarize())
 *   overlap    the tagOverlap result for (course, gap.competency) — passed in to avoid recompute
 *   context    { learnerLevel, history } where history is this learner's per-course facts:
 *              Map(courseId -> { started, completionPct, timesRecommended })
 *
 * Returns a plain object keyed by FEATURE_NAMES. Pure: same inputs → same vector, no clock,
 * no I/O, so it is trivially testable and identical in training and inference.
 */
export function extractFeatures(gap, course, overlap, context = {}) {
  const history = context.history instanceof Map ? context.history : new Map();
  const hist = history.get(course.courseId) ?? {};

  const courseLevel = levelRank(course.level);
  const learnerLevel = Number.isFinite(context.learnerLevel) ? context.learnerLevel : 0;
  // 1 when the course sits at or just above the learner (the productive zone); decays as the
  // course gets further above or below them. Unknown course level is a neutral 0.5.
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
    // A prerequisite gap is one the course's own prerequisites (if declared) are also weak in;
    // without a prerequisite graph yet this is 0, and the field is here so the schema is stable
    // when prerequisites land (course-ingestion task). Never guessed.
    is_prerequisite_gap: 0,
    course_hours_norm: hours === null ? 0.5 : Math.max(0, Math.min(1, hours / 40)),
    already_started: hist.started ? 1 : 0,
    prior_completion_pct: Number.isFinite(hist.completionPct) ? hist.completionPct / 100 : 0,
    times_recommended_before: Number.isFinite(hist.timesRecommended) ? hist.timesRecommended : 0,
  };
}

/**
 * The training label for one *observed* (learner, course) interaction: a learning-outcome
 * score in 0-1, NOT a click. Combines three signals the way the spec asks:
 *
 *   relevance   did the course match a real gap at recommend time (0/1)
 *   completion  how far through the learner actually got (0-1)
 *   improvement measured competency gain after the course, scaled (0-1)
 *
 * A course completed with a big competency jump scores near 1; one clicked and abandoned at
 * 3% scores near 0 even though it was "clicked". This is the target the offline trainer fits,
 * so the model learns which courses *help*, not which get opened.
 */
export function outcomeLabel({ wasRelevant, completionPct, competencyGain }) {
  const relevance = wasRelevant ? 1 : 0;
  const completion = Math.max(0, Math.min(1, (Number(completionPct) || 0) / 100));
  // A 30-point competency gain is treated as a full improvement signal; more is capped.
  const improvement = Math.max(0, Math.min(1, (Number(competencyGain) || 0) / 30));
  // Weighted so completion and improvement (real learning) dominate relevance (necessary but
  // not sufficient). These weights are the *starting* label definition; the trainer fits the
  // feature weights, not these — this is the ground truth, documented and fixed.
  return Number((0.2 * relevance + 0.3 * completion + 0.5 * improvement).toFixed(4));
}

/** Re-export so training and inference share one overlap implementation. */
export { tagOverlap, normalizeTag };
