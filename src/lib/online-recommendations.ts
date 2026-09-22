/**
 * A second recommendation source: genuine external online courses matched to the learner's
 * measured competency gaps.
 *
 * The internal catalogue recommender (server/course-recommendations.mjs) already answers
 * "which of OUR courses close your gaps". This adds the browse-library courses in
 * `course-library.ts` — real, named-provider courses with canonical URLs — as a second
 * source, matched to the SAME gaps the server returned. It invents nothing: every course
 * here is a row that already ships in `courseLibrary`, and a gap with no genuinely relevant
 * external course simply gets none rather than a padded, off-topic link.
 *
 * The match is deterministic and keyword-based (no model, no network): each MoSPI framework
 * competency maps to a set of subject keywords, and a course is a candidate only when it
 * clears a minimum-relevance floor against the gap — so an online course is recommended
 * because it addresses the gap, never merely because it has a URL.
 */

import { type RecommendationGroup } from './analytics';
import { type ExternalCourse, courseLibrary } from './course-library';

/**
 * Framework competency → keywords found in an external course's subject/category/title.
 * Deliberately conservative: a keyword is here only when a course carrying it genuinely
 * builds that competency. Editable in one place, like the server-side tag bridge.
 */
const COMPETENCY_KEYWORDS: Record<string, string[]> = {
  'data-quality': ['data quality', 'data cleaning', 'database', 'sql', 'data engineering', 'data science', 'data wrangling', 'etl'],
  inference: ['statistic', 'probability', 'inference', 'regression', 'machine learning', 'econometric', 'bayesian', 'hypothesis', 'data science'],
  dissemination: ['visualization', 'visualisation', 'communication', 'dashboard', 'reporting', 'storytelling', 'tableau', 'presentation'],
  'digital-tools': ['python', 'programming', 'excel', 'spreadsheet', 'sql', 'software', 'computing', 'r for', 'data analysis', 'automation'],
  leadership: ['management', 'leadership', 'project management', 'team', 'business', 'strategy', 'operations'],
};

/** Approx level suitability from the learner's current score on the competency. */
function preferredLevels(currentScore: number): Set<ExternalCourse['level']> {
  if (currentScore < 50) return new Set(['Beginner', 'All levels']);
  if (currentScore < 70) return new Set(['Beginner', 'Intermediate', 'All levels']);
  return new Set(['Intermediate', 'Advanced', 'All levels']);
}

function haystack(course: ExternalCourse): string {
  return `${course.title} ${course.subject} ${course.category} ${course.partner} ${course.blurb}`.toLowerCase();
}

function isValidUrl(url: string): boolean {
  return typeof url === 'string' && /^https?:\/\/[^\s]+\.[^\s]+/.test(url.trim());
}

/** Count distinct competency keywords a course hits, and return which matched. */
function relevance(course: ExternalCourse, competencyId: string): { score: number; matched: string[] } {
  const keys = COMPETENCY_KEYWORDS[competencyId] ?? [];
  const hay = haystack(course);
  const matched: string[] = [];
  for (const k of keys) if (hay.includes(k)) matched.push(k);
  return { score: matched.length, matched };
}

export type OnlineRecommendation = {
  course: ExternalCourse;
  forCompetency: string;
  forCompetencyName: string;
  reason: string;
};

/**
 * Recommend external courses for the learner's gaps.
 *
 *   groups          the server's ranked gap groups (worst first)
 *   minRelevance    minimum distinct keyword hits to count as relevant (default 1)
 *   perGap/limit    caps so the learner is not flooded
 *
 * A course is assigned to the single gap it matches best, never listed twice; only courses
 * with a valid stored URL are eligible; results are stable (deterministic tie-breaks).
 */
export function recommendOnlineCourses(
  groups: RecommendationGroup[],
  { minRelevance = 1, perGap = 3, limit = 6 }: { minRelevance?: number; perGap?: number; limit?: number } = {},
): OnlineRecommendation[] {
  if (!Array.isArray(groups) || groups.length === 0) return [];
  const gapOrder = groups.filter((g) => COMPETENCY_KEYWORDS[g.competency]);
  if (gapOrder.length === 0) return [];

  // Assign each valid course to its single best-matching gap.
  const bestFor = new Map<string, { course: ExternalCourse; rel: { score: number; matched: string[] } }[]>();
  for (const g of gapOrder) bestFor.set(g.competency, []);

  for (const course of courseLibrary) {
    if (!isValidUrl(course.url)) continue;
    let winner: { competency: string; rel: { score: number; matched: string[] } } | null = null;
    for (const g of gapOrder) {
      const rel = relevance(course, g.competency);
      if (rel.score < minRelevance) continue;
      if (!winner || rel.score > winner.rel.score) winner = { competency: g.competency, rel };
    }
    if (winner) bestFor.get(winner.competency)!.push({ course, rel: winner.rel });
  }

  const out: OnlineRecommendation[] = [];
  const seen = new Set<string>();
  // Worst gap first; within a gap, most-relevant then level-suitable then fewest hours.
  for (const g of gapOrder) {
    if (out.length >= limit) break;
    const levels = preferredLevels(g.currentScore);
    const ranked = (bestFor.get(g.competency) ?? [])
      .sort((a, b) =>
        b.rel.score - a.rel.score ||
        (Number(levels.has(b.course.level)) - Number(levels.has(a.course.level))) ||
        a.course.hours - b.course.hours ||
        a.course.title.localeCompare(b.course.title));
    let taken = 0;
    for (const { course, rel } of ranked) {
      if (out.length >= limit || taken >= perGap) break;
      if (seen.has(course.id)) continue;
      seen.add(course.id);
      taken += 1;
      out.push({
        course,
        forCompetency: g.competency,
        forCompetencyName: g.name,
        reason: `Builds ${g.name.toLowerCase()} (you are ${g.gap} point${g.gap === 1 ? '' : 's'} short) — this ${course.provider} course covers ${course.subject.toLowerCase()}.`,
      });
    }
  }
  return out;
}
