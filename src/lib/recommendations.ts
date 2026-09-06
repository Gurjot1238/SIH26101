/**
 * What to do about a weak topic.
 *
 * The request was: "for average topic give him material like to make that topics
 * strong". The honest answer to that, for an app with no content library, is the
 * learner's own document. So the primary recommendation is the exact passages the
 * missed questions came from, in document order, plus a retry built only from the
 * questions they got wrong. Both are grounded in something that actually exists.
 *
 * The three learning pathways in the app are offered second, and only when a weak
 * topic maps to a competency one of them builds. There is no invented catalogue and
 * no external link: a recommendation that leads nowhere is worse than none.
 */

import { type MaterialQuestion } from './materials';
import { type AttemptResult, type TopicScore } from './scoring';
import { type CourseFacts, coursesForCompetency } from './courses';
import { bandLabels, competencyById } from './topics';

export type RevisionPassage = {
  /** Index into the question list the passage was quoted for. */
  questionIndex: number;
  /** Position of the sentence in the document, so passages read in order. */
  sourceIndex: number;
  text: string;
};

export type TopicPlan = {
  score: TopicScore;
  /** Plain-language band label: Good / Average / Needs work. */
  bandLabel: string;
  /** The competency this topic sits under, long form, or null when unclassified. */
  competencyName: string | null;
  /** Sentences from the learner's own document covering what they missed. */
  passages: RevisionPassage[];
  /** Question indexes to re-ask for this topic. */
  retry: number[];
  /** Pathways that build the matching competency. Often empty, and that is correct. */
  courses: CourseFacts[];
};

export type StudyPlan = {
  /** One line describing the whole plan, safe to render on its own. */
  headline: string;
  /** Weak topics first, then average. Empty when nothing needs work. */
  topics: TopicPlan[];
  /** Every question worth re-asking, weak topics first, in a stable order. */
  retry: number[];
  /** Distinct pathways across all weak topics, best match first. */
  courses: CourseFacts[];
  /** Passages across all weak topics, deduplicated, in document order. */
  passages: RevisionPassage[];
};

const MAX_PASSAGES_PER_TOPIC = 4;

/**
 * Build the plan. `questions` must be the same array that was graded — the plan
 * addresses missed questions by index, so a different array would quote the wrong
 * passages.
 */
export function buildStudyPlan(questions: MaterialQuestion[], result: AttemptResult): StudyPlan {
  const topics: TopicPlan[] = result.focus.map((score) => {
    const passages = passagesFor(questions, score.missed).slice(0, MAX_PASSAGES_PER_TOPIC);
    return {
      score,
      bandLabel: bandLabels[score.band],
      competencyName: score.competency ? competencyById(score.competency).name : null,
      passages,
      retry: [...score.missed].sort((a, b) => a - b),
      courses: score.competency ? coursesForCompetency(score.competency) : [],
    };
  });

  /*
   * Which questions to re-ask is a different question from which topics need advice.
   *
   * This list used to be built from `topics` alone, so it inherited the band rule: a
   * topic carrying only one question is `unrated`, never reaches `focus`, and its
   * missed question was therefore never offered back. The band rule is right for
   * advice — one wrong answer is not a diagnosis — and wrong for this. It also
   * dead-ended the retry loop, which is how the fault surfaced: a retry paper is
   * short, so it often carries one question per topic, and missing one produced an
   * empty retry list. The Quiz page reads `retry.length` to decide whether to offer
   * another go, so the button vanished at exactly the moment it was needed.
   *
   * Weak topics still come first, because that is what decides which topic a retry
   * opens on. Everything else that was missed follows in document order.
   */
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

  // Pathways for the whole plan, primary matches only. Every course lists secondary
  // competencies too, and taking those as well meant all three pathways came back
  // for almost any weak result — which is the same as recommending nothing.
  const courses: CourseFacts[] = [];
  const collect = (primaryOnly: boolean) => {
    for (const topic of topics) {
      for (const course of topic.courses) {
        if (primaryOnly && course.competency !== topic.score.competency) continue;
        if (!courses.some((existing) => existing.id === course.id)) courses.push(course);
      }
    }
  };
  collect(true);
  if (courses.length === 0) collect(false);

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
    courses,
    passages,
  };
}

/** Missed questions as their source sentences, deduplicated, in document order. */
function passagesFor(questions: MaterialQuestion[], missed: number[]): RevisionPassage[] {
  const out: RevisionPassage[] = [];
  for (const questionIndex of missed) {
    const question = questions[questionIndex];
    if (!question) continue;
    // A curated question has no document behind it, so there is nothing to quote. Passing
    // the empty string through would render a blank card headed "From your material" and
    // make the plan claim a source it does not have.
    if (question.source.trim().length === 0) continue;
    if (out.some((existing) => existing.text === question.source)) continue;
    out.push({ questionIndex, sourceIndex: question.sourceIndex, text: question.source });
  }
  return out.sort((a, b) => a.sourceIndex - b.sourceIndex);
}

function headlineFor(result: AttemptResult, retryCount: number, passageCount: number): string {
  if (result.total === 0) return 'Nothing to plan yet — no questions were generated.';
  if (result.focus.length === 0) {
    // No topic earned a band low enough to advise on. That is not the same as having
    // nothing to say: a missed question is still a missed question, and since the
    // retry list no longer follows the band rule, the sentence must not imply it does.
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
  // The passage half of this sentence is only true when there are passages. The curated
  // assessment has none — its questions come from no document — so the headline has to
  // drop the instruction rather than point at an empty section.
  if (passageCount === 0) {
    return `${subject} another pass. Retry the ${passages} you missed, and read the explanations below.`;
  }
  return `${subject} another pass. Re-read the passages below, then retry the ${passages} you missed.`;
}

/**
 * Rebuild a shorter paper from the questions a learner missed, keeping the original
 * question objects so the options and the answer key are unchanged. Order follows
 * the plan, not the original paper, so a retry opens on the weakest topic.
 */
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

/**
 * One sentence per weak topic, for the compact summary on the Dashboard. Kept
 * separate from the full plan so a page can show the advice without the passages.
 */
export function summarizePlan(plan: StudyPlan): string[] {
  return plan.topics.map((topic) => {
    const score = `${topic.score.correct} of ${topic.score.total}`;
    const course = topic.courses[0];
    if (course) return `${topic.score.topic}: ${score}. ${course.helpsWith}`;
    if (topic.passages.length > 0) {
      return `${topic.score.topic}: ${score}. Re-read the ${topic.passages.length === 1 ? 'passage' : 'passages'} from your material.`;
    }
    // No pathway and nothing to quote: the curated assessment, where the explanation on
    // the review screen is the only material there is. Say that instead of pointing at a
    // passage list that is empty.
    return `${topic.score.topic}: ${score}. Read the explanations for the questions you missed.`;
  });
}
