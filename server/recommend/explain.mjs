/**
 * Human-readable recommendation explanations, built ONLY from the evidence the recommender
 * actually used (§9). Every line here is a restatement of a real number or a real match —
 * the learner's competency score, the topics they missed, the tags this course covers, the
 * difficulty fit, the prerequisite role. Nothing is invented, and the model's internal score
 * is never shown as if it were an objective fact.
 *
 * The output is a small list of short bullet strings plus a one-line summary, so the UI can
 * render either. The existing single-sentence `reason` field is kept on each recommendation
 * for backward compatibility; this adds a richer `why` array beside it.
 */

/**
 * Build the explanation for one recommended course.
 *
 *   course   the recommendation row (title, matchedTags, forCompetencyName, level, ...)
 *   gap      the ranked-gap row it addresses ({ name, currentScore, gap, ... })
 *   evidence {
 *     weakTopics: [{ topic, percent }]   topics under this competency the learner missed
 *     difficulty: { ok, distance }       from quality.difficultyMatch
 *     prereqRole: string|null            e.g. "a prerequisite for your Machine Learning path"
 *   }
 *
 * Returns { summary, why:[...] }. Each `why` entry is a complete, checkable statement.
 */
export function explainRecommendation(course, gap, evidence = {}) {
  const why = [];

  // 1. The measured competency and how far it is below target — the core reason.
  if (Number.isFinite(gap?.currentScore)) {
    why.push(`Your ${gap.name} competency is currently ${gap.currentScore}%${Number.isFinite(gap.gap) ? `, ${gap.gap} point${gap.gap === 1 ? '' : 's'} below target` : ''}.`);
  }

  // 2. The specific weak topics from the assessment, if we have them (real, not generic).
  const weak = Array.isArray(evidence.weakTopics) ? evidence.weakTopics.filter((t) => t && t.topic) : [];
  if (weak.length > 0) {
    const named = weak.slice(0, 3).map((t) => t.topic).join(', ');
    why.push(`Your assessment showed difficulty with ${named}.`);
  }

  // 3. What the course actually covers that matches — the matched tags, in the course's words.
  const tags = Array.isArray(course?.matchedTags) ? course.matchedTags : [];
  if (tags.length > 0) {
    why.push(`This course covers ${tags.join(', ')}, which builds ${String(gap?.name ?? 'this competency').toLowerCase()}.`);
  }

  // 4. Difficulty fit — only stated when we know the course level.
  if (evidence.difficulty && evidence.difficulty.distance !== null && evidence.difficulty.distance !== undefined) {
    const d = evidence.difficulty.distance;
    if (d <= 0) why.push('It sits at or below your current level, so you can start it now.');
    else if (d === 1) why.push('It is one step up from your current level — a suitable stretch.');
    // d>1 courses only survive the gate when prerequisites are met; say so plainly.
    else why.push('It is an advanced course, and your completed prerequisites qualify you for it.');
  }

  // 5. Prerequisite role in a longer path, when known.
  if (evidence.prereqRole) {
    why.push(`It is ${evidence.prereqRole}.`);
  }

  const summary = why.length > 0
    ? `Recommended because ${lowerFirst(why[0])}`
    : `Recommended to help build your ${String(gap?.name ?? 'target competency').toLowerCase()}.`;

  return { summary, why };
}

function lowerFirst(s) {
  return typeof s === 'string' && s.length > 0 ? s[0].toLowerCase() + s.slice(1) : s;
}

/**
 * How many recommendations to show for a gap of a given size (§10). Bigger gaps warrant more
 * focused options; small gaps get one or two so the learner is not overwhelmed. Returns a
 * per-gap cap; the service still applies an overall cap on top.
 *
 *   critical (gap >= 40): 3-5   → 4
 *   moderate (gap 20-39): 2-4   → 3
 *   small    (gap 1-19):  1-2   → 2
 */
export function countForGap(gap) {
  const g = Number.isFinite(gap?.gap) ? gap.gap : 0;
  if (g >= 40) return 4;
  if (g >= 20) return 3;
  return 2;
}

/** Overall cap so a learner with many gaps still sees a focused list, not a wall (§10). */
export const MAX_TOTAL_RECOMMENDATIONS = 8;
