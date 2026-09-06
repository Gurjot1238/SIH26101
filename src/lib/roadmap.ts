/**
 * The career roadmap, and the one honest thing it can say about a role.
 *
 * The page used to print `score: 68` against "Statistical Officer" and `78` against
 * "Senior Statistical Officer" — two numbers nothing had measured, sitting under the
 * word "readiness". StatSkill does not know the learner's grade, their appraisal, or
 * what their directorate expects; it knows how they answered questions in five
 * competencies. So a stage's readiness here is exactly that and nothing more: the
 * account's own percentage across the competencies the stage leans on, and `null`
 * when none of them has been measured.
 *
 * The stage titles and horizons are unchanged. They describe the progression in
 * India's statistical system, which is a fact about the system rather than a claim
 * about the learner, and they are the same for everybody who opens the page.
 */

import { type Band, type CompetencyId, bandFor, bandLabels, competencyById } from './topics';
import type { CompetencyRollup, ProgressRollup } from './progress';

export type RoadmapStage = {
  title: string;
  sub: string;
  status: string;
  /** The competencies this role leans on. Three, because the card lays out three. */
  competencies: CompetencyId[];
  /** Stated once, so nobody reads the horizon as a promotion forecast. */
  note: string;
};

export const roadmapStages: RoadmapStage[] = [
  {
    title: 'Statistical Officer',
    sub: 'Current role · production and release',
    status: 'Current',
    competencies: ['data-quality', 'digital-tools', 'dissemination'],
    note: 'The competencies a producing role is held to.',
  },
  {
    title: 'Senior Statistical Officer',
    sub: 'Next horizon · interpretation and advice',
    status: 'Next horizon',
    competencies: ['inference', 'dissemination', 'leadership'],
    note: 'Where the work shifts from producing a number to defending it.',
  },
  {
    title: 'Deputy Director, Statistics',
    sub: 'Longer horizon · system and people',
    status: 'Aspirational',
    competencies: ['leadership', 'inference', 'data-quality'],
    note: 'Not scored here. StatSkill measures competency evidence, not seniority.',
  },
];

export type SkillState = {
  id: CompetencyId;
  /** The compact competency name, as the rest of the app labels it. */
  name: string;
  percent: number | null;
  band: Band;
  total: number;
  /** 'Demonstrated', 'Focus next', 'Not measured yet' — what the chip prints. */
  state: string;
};

export type StageState = {
  stage: RoadmapStage;
  /** Percentage across the stage's measured competencies, or null when none are. */
  readiness: number | null;
  band: Band;
  /** Questions behind `readiness`, so the page can say how thin the evidence is. */
  answered: number;
  skills: SkillState[];
};

function label(row: CompetencyRollup | undefined, weak: boolean): string {
  if (!row || row.total === 0) return 'Not measured yet';
  if (weak) return 'Focus next';
  if (row.band === 'strong') return 'Demonstrated';
  if (row.band === 'average') return 'Building';
  if (row.band === 'needs-work') return 'Focus next';
  return 'Not enough questions';
}

/**
 * Each stage against what the account has answered.
 *
 * Readiness is pooled correct-over-total rather than a mean of percentages, because a
 * competency measured on two questions should not weigh the same as one measured on
 * twenty — averaging the percentages would let a lucky pair of answers lift a stage.
 */
export function stageStates(progress: ProgressRollup): StageState[] {
  const measured = new Map(progress.competencies.map((row) => [row.id, row]));
  const focus = new Set(progress.focus.map((row) => row.id));

  return roadmapStages.map((stage) => {
    let correct = 0;
    let total = 0;
    for (const id of stage.competencies) {
      const row = measured.get(id);
      if (!row) continue;
      correct += row.correct;
      total += row.total;
    }
    const percent = total === 0 ? null : Math.round((correct / total) * 100);
    return {
      stage,
      readiness: percent,
      band: percent === null ? ('unrated' as Band) : bandFor(percent, total),
      answered: total,
      skills: stage.competencies.map((id) => {
        const row = measured.get(id);
        return {
          id,
          name: competencyById(id).short,
          percent: row && row.total > 0 ? row.percent : null,
          band: row && row.total > 0 ? row.band : ('unrated' as Band),
          total: row?.total ?? 0,
          state: label(row, focus.has(id)),
        };
      }),
    };
  });
}

/**
 * The line under "Next evidence to collect". Names a competency and what would move
 * it, or says plainly that there is nothing to go on yet.
 */
export function nextEvidence(progress: ProgressRollup): string {
  if (progress.attempts === 0) {
    return 'Sit the assessment or upload a document you work with. Nothing here is inferred from your grade or your posting.';
  }
  const weakest = progress.focus[0];
  if (weakest) {
    const short = competencyById(weakest.id).short;
    return `${short} sits at ${weakest.percent}% on ${weakest.total} question${weakest.total === 1 ? '' : 's'} — ${bandLabels[weakest.band].toLowerCase()}. More questions there change this page the most.`;
  }
  const thinnest = [...progress.competencies].filter((row) => row.total > 0).sort((left, right) => left.total - right.total)[0];
  if (thinnest) {
    const short = competencyById(thinnest.id).short;
    return `Nothing is in the weak band. ${short} is your thinnest evidence at ${thinnest.total} question${thinnest.total === 1 ? '' : 's'}, so it is the one worth testing next.`;
  }
  return 'Nothing is measured yet.';
}
