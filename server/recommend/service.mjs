/**
 * RecommendationService — the one door every recommendation request now goes through.
 *
 * The spec asked for three engines behind a single abstraction, chosen by how much real
 * learning data exists, and it insisted the currently working system must keep working:
 *
 *   RuleBasedRecommendationEngine   Wraps the existing, proven `recommendCoursesForGaps`.
 *                                   Deterministic, invents nothing, always returns a valid
 *                                   shape. This is the floor: it is what runs today and it
 *                                   is what everything falls back to.
 *
 *   MLRecommendationEngine          Re-ranks the rule-based candidates with a trained model
 *                                   (server/recommend/model.mjs + features.mjs). It is only
 *                                   usable when a real model.json is present AND there is
 *                                   enough interaction data to trust it. Otherwise it reports
 *                                   `usable:false` and produces nothing — it never fakes.
 *
 *   HybridRecommendationEngine      The default. Generates candidates with the rule-based
 *                                   engine (so the list is never empty), then lets the ML
 *                                   engine re-order them when it is usable. If ML is not
 *                                   ready, the hybrid result IS the rule-based result. This
 *                                   is candidate-generation → ranking, with a guaranteed
 *                                   deterministic fallback at every step.
 *
 * A critical invariant, stated by the spec: "Never show empty recommendations simply because
 * the ML model is not trained yet." So candidates always come from the rule-based engine;
 * ML only ever changes the *order* of courses that were already honest matches. It cannot
 * introduce a course the rules did not vouch for, and it cannot empty the list.
 *
 * The public output shape is exactly what `recommendCoursesForGaps` already returns (the UI
 * and the existing endpoint depend on it), plus one additive `strategy` block that records
 * which engine actually ran, the model version if any, and why — for traceability and so the
 * UI can show an honest "personalised by …" line without us changing the existing fields.
 */

import { recommendCoursesForGaps } from '../course-recommendations.mjs';
import { loadModel, scoreVector } from './model.mjs';
import { extractFeatures, learnerLevelRank } from './features.mjs';
import { validateCandidate } from './quality.mjs';
import { explainRecommendation, countForGap, MAX_TOTAL_RECOMMENDATIONS } from './explain.mjs';

/**
 * How many observed learning interactions we want before we trust the ML engine to re-rank
 * for a general audience. Below this the rule-based order is at least as trustworthy and far
 * more explainable, so hybrid stays deterministic. The trained model may raise this via its
 * own `minInteractionsToActivate`; we take the stricter of the two.
 */
const DEFAULT_MIN_INTERACTIONS = 200;

/* ----------------------------------------------------------- rule-based (floor) */

/**
 * The deterministic engine. A thin, honest wrapper so the rest of the system speaks to an
 * engine interface rather than a bare function, and so the strategy tag is attached in one
 * place. Its behaviour is byte-for-byte the current system's behaviour.
 */
export class RuleBasedRecommendationEngine {
  constructor({ recommend = recommendCoursesForGaps } = {}) {
    this.recommend = recommend;
    this.name = 'rule-based';
  }

  /** Always usable — it has no dependency on data volume or a trained model. */
  usable() {
    return { usable: true };
  }

  /** Produce the current system's recommendations, unchanged. */
  generate(analytics, cat, options = {}) {
    const result = this.recommend(analytics, cat, options);
    return withStrategy(result, {
      engine: 'rule-based',
      modelVersion: null,
      reason: 'Matched to your measured competency gaps by the deterministic engine.',
    });
  }
}

/* --------------------------------------------------------------- ML (re-ranker) */

/**
 * The ML engine. It never generates candidates from scratch — that would risk an empty or
 * irrelevant list. It takes the rule-based candidates and re-scores each with the trained
 * model, then reorders. If no trained model is present, or there is too little interaction
 * data, `usable()` says so and `rerank()` returns its input untouched.
 */
export class MLRecommendationEngine {
  constructor({ load = loadModel, score = scoreVector, minInteractions = DEFAULT_MIN_INTERACTIONS } = {}) {
    this.load = load;
    this.score = score;
    this.minInteractions = minInteractions;
    this.name = 'ml';
  }

  /**
   * Is the ML engine allowed to run right now? Two independent conditions, both required:
   *   1. a complete, parseable model.json exists (model.mjs decides this, not us), and
   *   2. observed interactions >= the activation threshold (stricter of ours and the model's).
   * Anything short of both returns `{ usable:false, reason }` so the caller can fall back and
   * explain why. This is the guard that stops us pretending to do ML on empty data.
   */
  usable({ interactionCount = 0 } = {}) {
    const loaded = this.load();
    if (!loaded.ready) {
      return { usable: false, reason: loaded.reason, modelVersion: null };
    }
    const threshold = Math.max(
      this.minInteractions,
      Number.isFinite(loaded.model.minInteractionsToActivate) ? loaded.model.minInteractionsToActivate : 0,
    );
    if (interactionCount < threshold) {
      return {
        usable: false,
        reason: `Only ${interactionCount} learning interactions recorded; the model activates at ${threshold}.`,
        modelVersion: loaded.model.modelVersion,
      };
    }
    return { usable: true, modelVersion: loaded.model.modelVersion, model: loaded.model };
  }

  /**
   * Re-rank a rule-based result's courses with the model. `context` carries the learner-level
   * and per-course history the feature extractor needs. Returns a NEW result object with the
   * same fields; only the order of `courses` (and each group's `courses`) changes, plus a
   * per-course `mlScore` for traceability. The ML score is never presented as ground truth —
   * the human-readable `reason` stays the rule-based evidence (see the spec's honesty rule).
   */
  rerank(ruleResult, { model, analytics, context = {} } = {}) {
    if (!model || !Array.isArray(ruleResult.courses) || ruleResult.courses.length === 0) {
      return ruleResult;
    }
    const learnerLevel = Number.isFinite(context.learnerLevel)
      ? context.learnerLevel
      : learnerLevelRank(analytics?.attempts?.overallScore ?? analytics?.overallScore ?? 0);

    // Build a gap lookup so we can feed the extractor the gap row for each course.
    const gapByCompetency = new Map(
      (Array.isArray(analytics?.gaps) ? analytics.gaps : []).map((g) => [g.competency, g]),
    );

    const scoreOne = (course) => {
      const gap = gapByCompetency.get(course.forCompetency) ?? {
        competency: course.forCompetency,
        name: course.forCompetencyName,
        gap: 0,
        priority: 0,
      };
      const overlap = { count: Array.isArray(course.matchedTags) ? course.matchedTags.length : 0, matched: course.matchedTags ?? [] };
      const vector = extractFeatures(gap, course, overlap, { learnerLevel, history: context.history });
      return this.score(model, vector);
    };

    const rescore = (courses) =>
      courses
        .map((course) => ({ ...course, mlScore: Number(scoreOne(course).toFixed(4)) }))
        // Stable: higher model score first; ties keep the rule-based order via original index.
        .map((course, index) => ({ course, index }))
        .sort((a, b) => b.course.mlScore - a.course.mlScore || a.index - b.index)
        .map(({ course }) => course);

    return {
      ...ruleResult,
      courses: rescore(ruleResult.courses),
      groups: Array.isArray(ruleResult.groups)
        ? ruleResult.groups.map((group) => ({ ...group, courses: rescore(group.courses) }))
        : ruleResult.groups,
    };
  }
}

/* ------------------------------------------------------- pipeline: filter, count, explain */

/**
 * The quality/business layer that sits between candidate generation and the final list. It
 * takes the rule-based result (candidates grouped by gap) and:
 *
 *   1. FILTERS each candidate through the quality gate (§6): drops completed, unavailable,
 *      url-less, prerequisite-failing, and near-duplicate courses. Rejections are recorded.
 *   2. CAPS each gap's list by the gap's severity (§10): critical gaps get more options,
 *      small gaps fewer, so the learner is not overwhelmed.
 *   3. EXPLAINS each survivor from real evidence (§9): competency score, weak topics, matched
 *      tags, difficulty fit, prerequisite role — attached as a `why` array + `summary`.
 *   4. PREREQUISITE-ORDERS the flat list (§4C): if a course and one of its prerequisites are
 *      both recommended, the prerequisite comes first.
 *
 * `ctx` carries the learner facts the gates need:
 *   { completedCourseIds:Set, competencyScores:Map, learnerLevel:number,
 *     weakTopicsByCompetency:Map(compId -> [{topic,percent}]) }
 *
 * Pure and deterministic. Returns a new result object with the same fields plus per-course
 * `why`/`summary`/`rejected` diagnostics; never mutates its input.
 */
export function refineRecommendations(base, ctx = {}) {
  if (!base || !Array.isArray(base.groups) || base.groups.length === 0) return base;

  const completedCourseIds = ctx.completedCourseIds instanceof Set ? ctx.completedCourseIds : new Set();
  const competencyScores = ctx.competencyScores instanceof Map ? ctx.competencyScores : new Map();
  const learnerLevel = Number.isFinite(ctx.learnerLevel) ? ctx.learnerLevel : 0;
  const weakByComp = ctx.weakTopicsByCompetency instanceof Map ? ctx.weakTopicsByCompetency : new Map();

  const kept = []; // accepted candidates so far, for cross-group duplicate detection
  const rejected = []; // { courseId, reasons } — kept for traceability, not shown to learners

  const groups = base.groups.map((group) => {
    const gap = { name: group.name, currentScore: group.currentScore, gap: group.gap, competency: group.competency };
    const perGapCap = countForGap(group);
    const survivors = [];

    for (const course of group.courses) {
      if (survivors.length >= perGapCap) break;
      const verdict = validateCandidate(course, { completedCourseIds, competencyScores, learnerLevel, kept });
      if (!verdict.ok) {
        rejected.push({ courseId: course.courseId, reasons: verdict.reasons });
        continue;
      }
      const evidence = {
        weakTopics: weakByComp.get(group.competency) ?? [],
        difficulty: verdict.difficulty,
        prereqRole: prereqRoleFor(course),
      };
      const { summary, why } = explainRecommendation(course, gap, evidence);
      const enriched = { ...course, summary, why };
      survivors.push(enriched);
      kept.push(enriched);
    }

    return { ...group, courses: survivors };
  }).filter((group) => group.courses.length > 0);

  // Flat list: interleave groups (worst gap leads), then apply the overall cap and a
  // prerequisite-aware reorder so a prerequisite never trails the course that needs it.
  const flat = interleave(groups, MAX_TOTAL_RECOMMENDATIONS);
  const ordered = prerequisiteOrder(flat);

  return {
    ...base,
    hasGaps: groups.length > 0,
    groups,
    courses: ordered,
    rejected,
    note: groups.length === 0
      ? 'Every matched course was filtered out (already completed, unavailable, or missing prerequisites).'
      : base.note,
  };
}

/** If a course declares a course-id prerequisite, phrase its role for the explanation. */
function prereqRoleFor(course) {
  const prereqs = Array.isArray(course?.prerequisites) ? course.prerequisites : [];
  const courseIdPrereq = prereqs.find((p) => typeof p === 'string');
  return courseIdPrereq ? `a step that builds toward more advanced courses in this path` : null;
}

/** Interleave grouped courses so the flat list leads with the worst gap's top course. */
function interleave(groups, limit) {
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
  return flat;
}

/**
 * Reorder so that if course B lists course A (also in the list) as a prerequisite, A comes
 * before B (§4C). A stable topological pass over just the courses present; courses with no
 * prerequisite relationship keep their interleaved order. With today's dataset (no declared
 * prerequisites) this is a no-op, but it is correct the moment prerequisites are added.
 */
function prerequisiteOrder(courses) {
  const present = new Set(courses.map((c) => c.courseId));
  const prereqIds = (c) => (Array.isArray(c.prerequisites) ? c.prerequisites.filter((p) => typeof p === 'string' && present.has(p)) : []);
  const result = [];
  const placed = new Set();
  const place = (course, stack) => {
    if (placed.has(course.courseId) || stack.has(course.courseId)) return; // cycle guard
    stack.add(course.courseId);
    for (const pid of prereqIds(course)) {
      const prereq = courses.find((c) => c.courseId === pid);
      if (prereq) place(prereq, stack);
    }
    stack.delete(course.courseId);
    if (!placed.has(course.courseId)) {
      placed.add(course.courseId);
      result.push(course);
    }
  };
  for (const course of courses) place(course, new Set());
  return result;
}

/* ------------------------------------------------------------------- hybrid (default) */

/**
 * The default engine. Candidate generation is always rule-based (guaranteeing a non-empty,
 * honest list), then the ML engine re-ranks when it is usable. The result's `strategy` block
 * records which path actually ran, so a reviewer can always tell whether a given set of
 * recommendations was deterministic or model-ranked, and on which model version.
 */
export class HybridRecommendationEngine {
  constructor({ ruleEngine = new RuleBasedRecommendationEngine(), mlEngine = new MLRecommendationEngine() } = {}) {
    this.ruleEngine = ruleEngine;
    this.mlEngine = mlEngine;
    this.name = 'hybrid';
  }

  usable() {
    return { usable: true }; // always — it degrades to rule-based
  }

  generate(analytics, cat, options = {}) {
    const { interactionCount = 0, context = {} } = options;

    // 1. CANDIDATE GENERATION — the proven engine. This is the honest floor.
    const base = this.ruleEngine.generate(analytics, cat, options);

    // 2. FILTERING + business rules — the quality gate, per-gap count, and explanations.
    //    Runs BEFORE ranking so the model only ever orders courses that already passed
    //    every rejection rule (§5: candidate → filter → rank). Deterministic.
    const filtered = refineRecommendations(base, context);

    // 3. RANKING — can ML re-rank the survivors? If not, hand back the filtered list.
    const ml = this.mlEngine.usable({ interactionCount });
    if (!ml.usable) {
      return withStrategy(filtered, {
        engine: 'hybrid:rule-based',
        modelVersion: ml.modelVersion ?? null,
        reason: filtered.hasGaps
          ? `Ranked by your competency gaps. ML ranking is on standby: ${ml.reason}`
          : filtered.note,
      });
    }

    // ML re-ranks only the filtered survivors. Never adds a course the gate rejected.
    const reranked = this.mlEngine.rerank(filtered, { model: ml.model, analytics, context });
    return withStrategy(reranked, {
      engine: 'hybrid:ml-ranked',
      modelVersion: ml.modelVersion,
      reason: `Personalised order from model ${ml.modelVersion}, over your gap-matched, quality-filtered courses.`,
    });
  }
}

/* --------------------------------------------------------------------- facade */

/**
 * The service the endpoint holds. `recommend()` is the single call site; it picks the engine
 * (hybrid by default) and returns the augmented result. Engines are injectable so tests can
 * force a trained model or a specific interaction count without touching disk.
 */
export class RecommendationService {
  constructor({ engine = new HybridRecommendationEngine() } = {}) {
    this.engine = engine;
  }

  /**
   *   analytics         buildAnalyticsSummary payload for the learner
   *   cat               courses.mjs catalogue()
   *   options.interactionCount  how many interactions the log holds (drives ML activation)
   *   options.context   { learnerLevel, history } for the feature extractor
   *   options.perGap / options.limit  passed through to the rule-based generator
   */
  recommend(analytics, cat, options = {}) {
    return this.engine.generate(analytics, cat, options);
  }
}

/** Attach/overwrite the additive `strategy` block without disturbing existing fields. */
function withStrategy(result, strategy) {
  return { ...result, strategy: { generatedAt: new Date().toISOString(), ...strategy } };
}

export { DEFAULT_MIN_INTERACTIONS };
