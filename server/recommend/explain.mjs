export function explainRecommendation(course, gap, evidence = {}) {
  const why = [];

  if (Number.isFinite(gap?.currentScore)) {
    why.push(`Your ${gap.name} competency is currently ${gap.currentScore}%${Number.isFinite(gap.gap) ? `, ${gap.gap} point${gap.gap === 1 ? '' : 's'} below target` : ''}.`);
  }

  const weak = Array.isArray(evidence.weakTopics) ? evidence.weakTopics.filter((t) => t && t.topic) : [];
  if (weak.length > 0) {
    const named = weak.slice(0, 3).map((t) => t.topic).join(', ');
    why.push(`Your assessment showed difficulty with ${named}.`);
  }

  const tags = Array.isArray(course?.matchedTags) ? course.matchedTags : [];
  if (tags.length > 0) {
    why.push(`This course covers ${tags.join(', ')}, which builds ${String(gap?.name ?? 'this competency').toLowerCase()}.`);
  }

  if (evidence.difficulty && evidence.difficulty.distance !== null && evidence.difficulty.distance !== undefined) {
    const d = evidence.difficulty.distance;
    if (d <= 0) why.push('It sits at or below your current level, so you can start it now.');
    else if (d === 1) why.push('It is one step up from your current level — a suitable stretch.');
    // d>1 courses only survive the gate when prerequisites are met; say so plainly.
    else why.push('It is an advanced course, and your completed prerequisites qualify you for it.');
  }

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

export function countForGap(gap) {
  const g = Number.isFinite(gap?.gap) ? gap.gap : 0;
  if (g >= 40) return 3;
  if (g >= 20) return 2;
  return 1;
}

export const MAX_TOTAL_RECOMMENDATIONS = 4;
