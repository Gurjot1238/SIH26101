import { type MaterialQuestion } from './materials';
import { type AttemptResult, type Choice, type TopicScore, compareTopics, rollUpCompetencies } from './scoring';
import { type Band, type CompetencyId } from './topics';

export type AssessmentSection = {
  competency: CompetencyId;
  topic: string;
  focus: string;
};

export type SealedOption = { id: string; text: string };

export type SealedQuestion = {
  id: string;
  section: number;
  topic: string;
  focus: string;
  competency: CompetencyId;
  kind: MaterialQuestion['kind'];
  q: string;
  options: SealedOption[];
};

export type SealedPaper = {
  label: string;
  note: string;
  length: number;
  questionsPerSection: number;
  sections: AssessmentSection[];
  questions: SealedQuestion[];
};

export type GradedQuestion = {
  id: string;
  position: number;
  section: number;
  topic: string;
  competency: CompetencyId;
  chosen: string | null;
  correctOption: string;
  right: boolean;
  explanation: string;
};

export type AssessmentResult = {
  source: 'assessment';
  label: string;
  total: number;
  correct: number;
  answered: number;
  percent: number;
  band: Band;
  topics: Array<{
    topic: string;
    competency: CompetencyId;
    correct: number;
    total: number;
    percent: number;
    band: Band;
  }>;
  questions: GradedQuestion[];
};

export function sectionOf(paper: SealedPaper, step: number): number {
  return paper.questions[step]?.section ?? 0;
}

export function toChoices(
  paper: SealedPaper,
  answers: Choice[],
): Array<{ question: string; option: string | null }> {
  return paper.questions.map((question, index) => {
    const pick = answers[index] ?? null;
    const option = pick === null ? null : (question.options[pick]?.id ?? null);
    return { question: question.id, option };
  });
}

export function rebuildPaper(paper: SealedPaper, result: AssessmentResult): MaterialQuestion[] {
  const marked = new Map(result.questions.map((entry) => [entry.id, entry]));

  return paper.questions.map((question, index) => {
    const entry = marked.get(question.id) ?? null;
    const correct = entry ? question.options.findIndex((option) => option.id === entry.correctOption) : -1;
    return {
      q: question.q,
      a: question.options.map((option) => option.text),
      correct,
      source: '',
      topic: question.topic,
      competency: question.competency,
      kind: question.kind,
      explanation: entry?.explanation ?? '',
      sourceIndex: index,
    };
  });
}

export function adoptServerScore(local: AttemptResult, result: AssessmentResult): AttemptResult {
  const bands = new Map(result.topics.map((row) => [row.topic, row]));
  const topics: TopicScore[] = local.topics
    .map((topic) => {
      const row = bands.get(topic.topic);
      return row ? { ...topic, correct: row.correct, total: row.total, percent: row.percent, band: row.band } : topic;
    })
    // Adopting a band can change which topic is worst, and the report reads worst first.
    .sort(compareTopics);

  const grouped = (band: Band) => topics.filter((topic) => topic.band === band);

  return {
    ...local,
    total: result.total,
    correct: result.correct,
    answered: result.answered,
    skipped: result.total - result.answered,
    percent: result.percent,
    band: result.band,
    topics,
    competencies: rollUpCompetencies(topics),
    strong: grouped('strong'),
    average: grouped('average'),
    weak: grouped('needs-work'),
    focus: [...grouped('needs-work'), ...grouped('average')],
  };
}
