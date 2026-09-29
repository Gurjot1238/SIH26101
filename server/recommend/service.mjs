import { recommendCoursesForGaps } from '../course-recommendations.mjs';
import { loadModel, scoreVector } from './model.mjs';
import { extractFeatures, learnerLevelRank } from './features.mjs';
import { validateCandidate } from './quality.mjs';
import { explainRecommendation, countForGap, MAX_TOTAL_RECOMMENDATIONS } from './explain.mjs';

const DEFAULT_MIN_INTERACTIONS = 200;

export class RuleBasedRecommendationEngine {
  constructor({ recommend = recommendCoursesForGaps } = {}) {
    this.recommend = recommend;
    this.name = 'rule-based';
  }

  usable() {
    return { usable: true };
  }

  generate(analytics, cat, options = {}) {
    const result = this.recommend(analytics, cat, options);
    return withStrategy(result, {
      engine: 'rule-based',
      modelVersion: null,
      reason: 'Matched to your measured competency gaps by the deterministic engine.',
    });
  }
}

export class MLRecommendationEngine {
  constructor({ load = loadModel, score = scoreVector, minInteractions = DEFAULT_MIN_INTERACTIONS } = {}) {
    this.load = load;
    this.score = score;
    this.minInteractions = minInteractions;
    this.name = 'ml';
  }

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

  rerank(ruleResult, { model, analytics, context = {} } = {}) {
    if (!model || !Array.isArray(ruleResult.courses) || ruleResult.courses.length === 0) {
      return ruleResult;
    }
    const learnerLevel = Number.isFinite(context.learnerLevel)
      ? context.learnerLevel
      : learnerLevelRank(analytics?.attempts?.overallScore ?? analytics?.overallScore ?? 0);

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

export function refineRecommendations(base, ctx = {}) {
  if (!base || !Array.isArray(base.groups) || base.groups.length === 0) return base;

  const completedCourseIds = ctx.completedCourseIds instanceof Set ? ctx.completedCourseIds : new Set();
  const competencyScores = ctx.competencyScores instanceof Map ? ctx.competencyScores : new Map();
  const learnerLevel = Number.isFinite(ctx.learnerLevel) ? ctx.learnerLevel : 0;
  const weakByComp = ctx.weakTopicsByCompetency instanceof Map ? ctx.weakTopicsByCompetency : new Map();

  const kept = [];
  const rejected = [];

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

function prereqRoleFor(course) {
  const prereqs = Array.isArray(course?.prerequisites) ? course.prerequisites : [];
  const courseIdPrereq = prereqs.find((p) => typeof p === 'string');
  return courseIdPrereq ? `a step that builds toward more advanced courses in this path` : null;
}

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

function prerequisiteOrder(courses) {
  const present = new Set(courses.map((c) => c.courseId));
  const prereqIds = (c) => (Array.isArray(c.prerequisites) ? c.prerequisites.filter((p) => typeof p === 'string' && present.has(p)) : []);
  const result = [];
  const placed = new Set();
  const place = (course, stack) => {
    if (placed.has(course.courseId) || stack.has(course.courseId)) return;
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

export class HybridRecommendationEngine {
  constructor({ ruleEngine = new RuleBasedRecommendationEngine(), mlEngine = new MLRecommendationEngine() } = {}) {
    this.ruleEngine = ruleEngine;
    this.mlEngine = mlEngine;
    this.name = 'hybrid';
  }

  usable() {
    return { usable: true };
  }

  generate(analytics, cat, options = {}) {
    const { interactionCount = 0, context = {} } = options;

    const base = this.ruleEngine.generate(analytics, cat, options);

    const filtered = refineRecommendations(base, context);

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

    const reranked = this.mlEngine.rerank(filtered, { model: ml.model, analytics, context });
    return withStrategy(reranked, {
      engine: 'hybrid:ml-ranked',
      modelVersion: ml.modelVersion,
      reason: `Personalised order from model ${ml.modelVersion}, over your gap-matched, quality-filtered courses.`,
    });
  }
}

export class RecommendationService {
  constructor({ engine = new HybridRecommendationEngine() } = {}) {
    this.engine = engine;
  }

  recommend(analytics, cat, options = {}) {
    return this.engine.generate(analytics, cat, options);
  }
}

function withStrategy(result, strategy) {
  return { ...result, strategy: { generatedAt: new Date().toISOString(), ...strategy } };
}

export { DEFAULT_MIN_INTERACTIONS };
