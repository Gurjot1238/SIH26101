/**
 * The browser's half of the quarterly competency check.
 *
 * The paper used to live here — fifteen scenarios with `correct` and `explanation`
 * beside each one — which meant the answer key was in the JavaScript bundle. Anybody
 * could read it, and a sitting was graded by the same tab that was being examined.
 * The key now lives only in `server/assessment.mjs`, and this file holds no questions
 * at all: types, and four pure functions for turning what the server sends into the
 * shapes the report screens already speak.
 *
 *   What crosses the wire
 *
 *   GET  /api/assessment/paper    the questions, options shuffled, no key
 *   POST /api/assessment/submit   { question, option } per answer -> the graded result
 *
 * Options travel with the id they had in the server's bank (`a`-`d`) and are dealt in
 * a shuffled order, so a submission names an option by id and the server never has to
 * remember which order it dealt. Nothing here needs to know that; it only has to keep
 * the two spaces straight, which is what `toChoices` and `rebuildPaper` are for:
 *
 *   display index   0, 1, 2, 3 down the screen, which is what the buttons produce
 *   option id       'a'-'d' in the bank, which is what the server grades
 *
 *   Why the paper is rebuilt at all
 *
 * The report, the study plan and the retry paper are all driven by `MaterialQuestion[]`
 * plus `AttemptResult`, shared with the quiz built from an uploaded document. Rebuilding
 * the sealed paper into that shape once the key arrives keeps one grader, one set of
 * bands and one set of tests, instead of a second reporting path for the assessment.
 */

import { type MaterialQuestion } from './materials';
import { type AttemptResult, type Choice, type TopicScore, compareTopics, rollUpCompetencies } from './scoring';
import { type Band, type CompetencyId } from './topics';

/** One section of the paper: a framework competency, scored as a topic of its own. */
export type AssessmentSection = {
  competency: CompetencyId;
  /** The label that appears in the per-topic report. */
  topic: string;
  /** Shown beside the scenario counter while answering. */
  focus: string;
};

/** An option as dealt: the id it has in the bank, and the text to show. */
export type SealedOption = { id: string; text: string };

/**
 * One question as dealt. Deliberately missing `correct` and `explanation` — if either
 * ever appears in this type, the key is being shipped to the browser again.
 */
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
  /** Said out loud on the page: these are StatSkill's own items, graded server-side. */
  note: string;
  length: number;
  questionsPerSection: number;
  sections: AssessmentSection[];
  questions: SealedQuestion[];
};

/** How the server marked one question, returned only with the result. */
export type GradedQuestion = {
  id: string;
  /** Position in the bank, not on screen. */
  position: number;
  section: number;
  topic: string;
  competency: CompetencyId;
  chosen: string | null;
  correctOption: string;
  right: boolean;
  explanation: string;
};

/** What `POST /api/assessment/submit` answers. Every number here is the server's. */
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

/** Which section a step belongs to, for the stepper and the section header. */
export function sectionOf(paper: SealedPaper, step: number): number {
  return paper.questions[step]?.section ?? 0;
}

/**
 * Turn the buttons the learner pressed into what the server grades.
 *
 * `answers` is index-aligned with `paper.questions` and holds display indexes, so this
 * is the one place the two spaces meet. An unanswered question is sent as `null` rather
 * than dropped: the server counts it as unanswered either way, and sending it keeps the
 * submission a faithful record of the sitting.
 */
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

/**
 * The sealed paper plus the key that came back, in the shape the report screens read.
 *
 * `correct` is the *display* index of the right option, because the review list and the
 * retry paper both show `question.a[question.correct]` — the position on screen, not the
 * id in the bank. A question the result does not mention keeps `correct: -1`, which no
 * choice can equal, so a truncated response cannot silently mark answers right.
 */
export function rebuildPaper(paper: SealedPaper, result: AssessmentResult): MaterialQuestion[] {
  const marked = new Map(result.questions.map((entry) => [entry.id, entry]));

  return paper.questions.map((question, index) => {
    const entry = marked.get(question.id) ?? null;
    const correct = entry ? question.options.findIndex((option) => option.id === entry.correctOption) : -1;
    return {
      q: question.q,
      a: question.options.map((option) => option.text),
      correct,
      // No document behind these scenarios, so there is nothing to quote back.
      source: '',
      topic: question.topic,
      competency: question.competency,
      kind: question.kind,
      explanation: entry?.explanation ?? '',
      sourceIndex: index,
    };
  });
}

/**
 * Adopt the server's numbers over the locally recomputed ones.
 *
 * Grading the rebuilt paper locally is what produces the groupings the screens need —
 * strong/average/weak, the missed indexes, the competency rollup — but the figure on
 * screen has to be the figure that was stored, and the two are only equal while both
 * sides band identically. `server/taxonomy-check.mjs` is what keeps them equal; this
 * function is what makes a drift visible rather than silent, by putting the stored
 * number on screen and leaving the local one unused.
 */
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
    // Rolled up from the adopted numbers, not the local ones they replaced.
    competencies: rollUpCompetencies(topics),
    strong: grouped('strong'),
    average: grouped('average'),
    weak: grouped('needs-work'),
    focus: [...grouped('needs-work'), ...grouped('average')],
  };
}
