export type CompetencyId =
  | 'data-quality'
  | 'inference'
  | 'dissemination'
  | 'digital-tools'
  | 'leadership';

export type Competency = {
  id: CompetencyId;
  name: string;
  short: string;
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

export function competencyById(id: CompetencyId): Competency {
  return byId.get(id) ?? competencies[0];
}

export function competencyName(id: CompetencyId): string {
  return competencyById(id).name;
}

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

  return bestScore >= 2 ? best : null;
}

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

export const bandColors: Record<Band, string> = {
  strong: '#2f7d75',
  average: '#c49743',
  'needs-work': '#b5584c',
  unrated: '#9aa7b1',
};

export const BAND_STRONG_MIN = 80;
export const BAND_AVERAGE_MIN = 50;

export const MIN_QUESTIONS_FOR_BAND = 2;

export function bandFor(percent: number, questionCount: number): Band {
  if (questionCount < MIN_QUESTIONS_FOR_BAND) return 'unrated';
  if (percent >= BAND_STRONG_MIN) return 'strong';
  if (percent >= BAND_AVERAGE_MIN) return 'average';
  return 'needs-work';
}
