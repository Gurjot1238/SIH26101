import { type MaterialQuestion } from './materials';
import { type AttemptResult, type TopicScore } from './scoring';
import { bandLabels, competencyById } from './topics';

export type RevisionPassage = {
  questionIndex: number;
  sourceIndex: number;
  text: string;
};

export type TopicPlan = {
  score: TopicScore;
  bandLabel: string;
  competencyName: string | null;
  passages: RevisionPassage[];
  retry: number[];
};

export type StudyPlan = {
  headline: string;
  topics: TopicPlan[];
  retry: number[];
  passages: RevisionPassage[];
};

const MAX_PASSAGES_PER_TOPIC = 4;

export function buildStudyPlan(questions: MaterialQuestion[], result: AttemptResult): StudyPlan {
  const topics: TopicPlan[] = result.focus.map((score) => {
    const passages = passagesFor(questions, score.missed).slice(0, MAX_PASSAGES_PER_TOPIC);
    return {
      score,
      bandLabel: bandLabels[score.band],
      competencyName: score.competency ? competencyById(score.competency).name : null,
      passages,
      retry: [...score.missed].sort((a, b) => a - b),
    };
  });

  const retry: number[] = [];
  for (const topic of topics) {
    for (const index of topic.retry) if (!retry.includes(index)) retry.push(index);
  }
  const rest: number[] = [];
  for (const score of result.topics) {
    for (const index of score.missed) {
      if (!retry.includes(index) && !rest.includes(index)) rest.push(index);
    }
  }
  rest.sort((a, b) => a - b);
  retry.push(...rest);

  const passages: RevisionPassage[] = [];
  for (const topic of topics) {
    for (const passage of topic.passages) {
      if (!passages.some((existing) => existing.text === passage.text)) passages.push(passage);
    }
  }
  passages.sort((a, b) => a.sourceIndex - b.sourceIndex);

  return {
    headline: headlineFor(result, retry.length, passages.length),
    topics,
    retry,
    passages,
  };
}

function passagesFor(questions: MaterialQuestion[], missed: number[]): RevisionPassage[] {
  const out: RevisionPassage[] = [];
  for (const questionIndex of missed) {
    const question = questions[questionIndex];
    if (!question) continue;
    if (question.source.trim().length === 0) continue;
    if (out.some((existing) => existing.text === question.source)) continue;
    out.push({ questionIndex, sourceIndex: question.sourceIndex, text: question.source });
  }
  return out.sort((a, b) => a.sourceIndex - b.sourceIndex);
}

function headlineFor(result: AttemptResult, retryCount: number, passageCount: number): string {
  if (result.total === 0) return 'Nothing to plan yet — no questions were generated.';
  if (result.focus.length === 0) {
    if (retryCount === 0) {
      return result.strong.length > 0
        ? 'Nothing needs revision. Every topic came out strong.'
        : 'Too few questions per topic to recommend anything specific.';
    }
    const questions = retryCount === 1 ? '1 question' : `${retryCount} questions`;
    return result.strong.length > 0
      ? `No topic needs a full pass. Retry the ${questions} you missed to close it out.`
      : `Too few questions per topic to rate them, but you can retry the ${questions} you missed.`;
  }

  const count = result.focus.length;
  const subject = count === 1 ? '1 topic needs' : `${count} topics need`;
  const passages = retryCount === 1 ? '1 question' : `${retryCount} questions`;
  if (passageCount === 0) {
    return `${subject} another pass. Retry the ${passages} you missed, and read the explanations below.`;
  }
  return `${subject} another pass. Re-read the passages below, then retry the ${passages} you missed.`;
}

export function buildRetryPaper(
  questions: MaterialQuestion[],
  plan: StudyPlan,
): { questions: MaterialQuestion[]; sourceIndexes: number[] } {
  const picked: MaterialQuestion[] = [];
  const sourceIndexes: number[] = [];
  for (const index of plan.retry) {
    const question = questions[index];
    if (!question) continue;
    picked.push(question);
    sourceIndexes.push(index);
  }
  return { questions: picked, sourceIndexes };
}

export function summarizePlan(plan: StudyPlan): string[] {
  return plan.topics.map((topic) => {
    const score = `${topic.score.correct} of ${topic.score.total}`;
    if (topic.passages.length > 0) {
      return `${topic.score.topic}: ${score}. Re-read the ${topic.passages.length === 1 ? 'passage' : 'passages'} from your material.`;
    }
    return `${topic.score.topic}: ${score}. Read the explanations for the questions you missed.`;
  });
}
