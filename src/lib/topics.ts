/**
 * One canonical competency list for the whole app.
 *
 * Before this file existed the same five competencies were written out as
 * divergent literals on three different pages — the dashboard chart said
 * "Inference 68", the organisation view said "Statistical inference 54", and the
 * roadmap said "Applied inference". Same competency, three names, three numbers,
 * no shared source. Every page now reads its label and its score from here.
 *
 * `name` is the long form the organisation view uses and `short` is the compact
 * form the dashboard chart uses, so both keep the exact label they showed before
 * while pointing at one record underneath.
 *
 * `keywords` drive `classifyTopic`, which is how a topic pulled out of an
 * uploaded document gets attached to a competency. That mapping is a keyword
 * heuristic, not a trained classifier, and it returns null rather than guessing
 * when nothing matches. Callers are expected to show unclassified topics as
 * themselves instead of filing them under the wrong competency.
 */

export type CompetencyId =
  | 'data-quality'
  | 'inference'
  | 'dissemination'
  | 'digital-tools'
  | 'leadership';

export type Competency = {
  id: CompetencyId;
  /** Long form, as the organisation view labels it. */
  name: string;
  /** Compact form, as the dashboard chart labels it. */
  short: string;
  /** One line explaining what the competency covers, for tooltips and empty states. */
  blurb: string;
  keywords: string[];
};

export const competencies: Competency[] = [
  {
    id: 'data-quality',
    name: 'Data stewardship',
    short: 'Data quality',
    blurb: 'Coverage, sampling, revisions, metadata and the limits of a dataset.',
    keywords: [
      'quality', 'coverage', 'sample', 'sampling', 'sampled', 'frame', 'response rate',
      'nonresponse', 'non-response', 'missing', 'imputation', 'imputed', 'revision',
      'revised', 'metadata', 'validation', 'validated', 'cleaning', 'edit', 'outlier',
      'duplicate', 'census', 'survey design', 'questionnaire', 'collection', 'collected',
      'enumerator', 'weight', 'weights', 'weighting', 'basket', 'base year', 'benchmark',
      'reference period', 'series break', 'consistency', 'accuracy', 'error', 'bias',
    ],
  },
  {
    id: 'inference',
    name: 'Statistical inference',
    short: 'Inference',
    blurb: 'Reading a signal from a sample, and saying how sure you can be.',
    keywords: [
      'inference', 'infer', 'estimate', 'estimated', 'estimation', 'estimator',
      'confidence', 'interval', 'significance', 'significant', 'hypothesis', 'p-value',
      'standard error', 'margin of error', 'uncertainty', 'variance', 'deviation',
      'distribution', 'correlation', 'causal', 'causation', 'regression', 'model',
      'trend', 'seasonal', 'seasonality', 'adjustment', 'adjusted', 'index', 'indices',
      'growth', 'percent', 'percentage', 'rate', 'ratio', 'average', 'mean', 'median',
      'aggregate', 'aggregation', 'projection', 'forecast', 'elasticity',
    ],
  },
  {
    id: 'dissemination',
    name: 'Dissemination',
    short: 'Dissemination',
    blurb: 'Turning a result into something a non-statistician can act on.',
    keywords: [
      'dissemination', 'disseminate', 'publication', 'publish', 'published', 'release',
      'report', 'reporting', 'brief', 'briefing', 'press', 'note', 'summary', 'narrative',
      'chart', 'table', 'visualisation', 'visualization', 'graph', 'plot', 'dashboard',
      'communicate', 'communication', 'audience', 'user', 'stakeholder', 'accessible',
      'plain language', 'headline', 'interpret', 'interpreting', 'interpretation',
      'caveat', 'footnote', 'annotation', 'transparency', 'explain',
    ],
  },
  {
    id: 'digital-tools',
    name: 'Digital fluency',
    short: 'Digital tools',
    blurb: 'The tooling that makes statistical work reproducible.',
    keywords: [
      'software', 'tool', 'tools', 'script', 'code', 'coding', 'programming', 'python',
      'automation', 'automated', 'pipeline', 'database', 'query', 'sql', 'api', 'csv',
      'spreadsheet', 'excel', 'reproducible', 'reproducibility', 'version control',
      'repository', 'workflow', 'platform', 'system', 'digital', 'dataset', 'file',
      'format', 'machine', 'algorithm', 'computation', 'computed', 'calculated',
    ],
  },
  {
    id: 'leadership',
    name: 'Team leadership',
    short: 'Leadership',
    blurb: 'Review, sign-off, and building capability in the people around you.',
    keywords: [
      'leadership', 'lead', 'manage', 'management', 'manager', 'supervise', 'supervision',
      'review', 'sign-off', 'signoff', 'approval', 'approve', 'accountability',
      'governance', 'policy', 'decision', 'decide', 'priority', 'prioritise', 'plan',
      'planning', 'coordinate', 'coordination', 'delegate', 'mentor', 'training',
      'capability', 'capacity', 'team', 'staff', 'stakeholder management', 'compliance',
      'standard', 'protocol', 'procedure', 'guideline', 'framework', 'mandate',
    ],
  },
];

const byId = new Map<CompetencyId, Competency>(competencies.map((item) => [item.id, item]));

/** Always returns a competency; unknown ids fall back to the first, which keeps callers total. */
export function competencyById(id: CompetencyId): Competency {
  return byId.get(id) ?? competencies[0];
}

export function competencyName(id: CompetencyId): string {
  return competencyById(id).name;
}

/**
 * Attach an extracted topic to a competency, or return null when nothing matches
 * well enough. `context` is the sentence the topic came from — a bare topic like
 * "Basket" is ambiguous, but the sentence around it usually is not.
 *
 * Matching is on word boundaries so that "rate" does not match "corporate" and
 * "lead" does not match "leading". A hit in the topic itself is worth more than a
 * hit in the surrounding sentence, because the topic is what the question is
 * actually about.
 */
export function classifyTopic(topic: string, context = ''): CompetencyId | null {
  const topicText = ` ${topic.toLowerCase()} `;
  const contextText = ` ${context.toLowerCase()} `;

  let best: CompetencyId | null = null;
  let bestScore = 0;

  for (const competency of competencies) {
    let score = 0;
    for (const keyword of competency.keywords) {
      if (containsWord(topicText, keyword)) score += 3;
      else if (containsWord(contextText, keyword)) score += 1;
    }
    if (score > bestScore) {
      bestScore = score;
      best = competency.id;
    }
  }

  // A single glancing keyword in a long sentence is not evidence. Two is.
  return bestScore >= 2 ? best : null;
}

/** Word-boundary containment without building a RegExp per call site. */
function containsWord(haystack: string, needle: string): boolean {
  let from = 0;
  for (;;) {
    const at = haystack.indexOf(needle, from);
    if (at === -1) return false;
    const before = haystack.charAt(at - 1);
    const after = haystack.charAt(at + needle.length);
    if (!isWordChar(before) && !isWordChar(after)) return true;
    from = at + 1;
  }
}

function isWordChar(character: string): boolean {
  return character !== '' && /[a-z0-9]/.test(character);
}

/**
 * The three qualitative bands the result screens report. The learner asked for
 * "this one good, this one average", so the vocabulary is deliberately plain.
 */
export type Band = 'strong' | 'average' | 'needs-work' | 'unrated';

export const bandLabels: Record<Band, string> = {
  strong: 'Good',
  average: 'Average',
  'needs-work': 'Needs work',
  unrated: 'Not enough questions',
};

export const bandTones: Record<Band, 'teal' | 'amber' | 'coral' | 'neutral'> = {
  strong: 'teal',
  average: 'amber',
  'needs-work': 'coral',
  unrated: 'neutral',
};

/** Bar colours, kept as the same hex values the pages already use. */
export const bandColors: Record<Band, string> = {
  strong: '#2f7d75',
  average: '#c49743',
  'needs-work': '#b5584c',
  unrated: '#9aa7b1',
};

export const BAND_STRONG_MIN = 80;
export const BAND_AVERAGE_MIN = 50;

/**
 * One question is not a measurement. Below this many questions on a topic the
 * band is reported as `unrated` and the UI says so, rather than calling somebody
 * weak on the strength of a single wrong answer.
 */
export const MIN_QUESTIONS_FOR_BAND = 2;

export function bandFor(percent: number, questionCount: number): Band {
  if (questionCount < MIN_QUESTIONS_FOR_BAND) return 'unrated';
  if (percent >= BAND_STRONG_MIN) return 'strong';
  if (percent >= BAND_AVERAGE_MIN) return 'average';
  return 'needs-work';
}
