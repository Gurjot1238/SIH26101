/**
 * The three learning pathways the app has always listed, plus the facts about them
 * that the pages need but never had.
 *
 * The titles, levels, durations and colours stay where they were, inline in
 * `pages/demo-pages.tsx`, exactly as written. This file is additive: it says which
 * competency each pathway builds, so a weak topic can be matched to a pathway
 * instead of the app recommending the same "Priority pathway" to everybody, and it
 * gives each pathway a module outline so the course page has something real to show.
 *
 * Honesty note, and it matters: an outline is not a lesson. No video, PDF or
 * exercise ships with this build, and `catalogueNote` is rendered wherever these
 * modules appear so nobody is told otherwise.
 */

import { type CompetencyId } from './topics';

export type CourseId = 'time-series' | 'data-ethics' | 'r-programming';

export type CourseModule = {
  title: string;
  minutes: number;
  summary: string;
};

export type CourseFacts = {
  id: CourseId;
  /** The competency this pathway mainly builds. */
  competency: CompetencyId;
  /** Competencies it also touches, used as a weaker match. */
  alsoBuilds: CompetencyId[];
  /** One line for the recommendation card: what it fixes. */
  helpsWith: string;
  modules: CourseModule[];
};

export const catalogueNote =
  'Sample / Demonstration Data — these outlines describe what each pathway would cover. No lesson content ships with this build.';

export const courseFacts: CourseFacts[] = [
  {
    id: 'time-series',
    competency: 'inference',
    alsoBuilds: ['data-quality', 'dissemination'],
    helpsWith: 'Reading a trend out of a noisy series, and saying how sure you can be about it.',
    modules: [
      {
        title: 'Reading a series before you model it',
        minutes: 45,
        summary: 'Level, spread, breaks and gaps. What the chart tells you before any method is applied.',
      },
      {
        title: 'Seasonality, and why the adjusted number differs',
        minutes: 60,
        summary: 'Why an adjusted figure and a raw figure can point opposite ways in the same month, and which one answers which question.',
      },
      {
        title: 'Trend and cycle are not the same thing',
        minutes: 55,
        summary: 'Separating a direction that persists from a movement that repeats, and the cost of confusing them in a release.',
      },
      {
        title: 'Revisions: what changes, and what you must republish',
        minutes: 45,
        summary: 'How a first estimate becomes a final one, and how to publish a revision without destroying trust in the first print.',
      },
      {
        title: 'Writing up a series without overclaiming',
        minutes: 55,
        summary: 'Turning an estimate and its uncertainty into a sentence a non-statistician can act on and a statistician cannot fault.',
      },
    ],
  },
  {
    id: 'data-ethics',
    competency: 'data-quality',
    alsoBuilds: ['dissemination', 'leadership'],
    helpsWith: 'Knowing what a dataset can carry: coverage, consent, metadata and the limits you must state.',
    modules: [
      {
        title: 'What the respondent actually agreed to',
        minutes: 30,
        summary: 'Purpose limitation in practice, and the questions to ask before a dataset is reused for something new.',
      },
      {
        title: 'Disclosure control on small cells',
        minutes: 40,
        summary: 'When a table of counts identifies a household, and the standard responses: suppression, rounding, aggregation.',
      },
      {
        title: 'Metadata as an obligation, not paperwork',
        minutes: 30,
        summary: 'Reference period, coverage, method and revision status — the five lines without which a number cannot be reused.',
      },
      {
        title: 'Saying what the data cannot support',
        minutes: 30,
        summary: 'Writing the limitations paragraph, and holding it when a stakeholder asks for a cleaner headline.',
      },
    ],
  },
  {
    id: 'r-programming',
    competency: 'digital-tools',
    alsoBuilds: ['data-quality'],
    helpsWith: 'Doing the processing in code, so the same input gives the same output next quarter.',
    modules: [
      {
        title: 'Reading survey files without corrupting them',
        minutes: 60,
        summary: 'Encodings, types, missing-value codes and the silent coercions that turn a valid response into a zero.',
      },
      {
        title: 'Weights in practice',
        minutes: 70,
        summary: 'Applying design weights and post-stratification, and checking a weighted estimate against a known total.',
      },
      {
        title: 'Cleaning rules you can re-run',
        minutes: 80,
        summary: 'Edit rules as code rather than as manual corrections, so the same fix applies to next round automatically.',
      },
      {
        title: 'Tables and charts that survive a rerun',
        minutes: 70,
        summary: 'Generating output from the data rather than pasting it, so a late correction does not mean rebuilding every exhibit.',
      },
      {
        title: 'Version control for statistical work',
        minutes: 60,
        summary: 'Tracking which code produced which published figure, and being able to answer that question a year later.',
      },
      {
        title: 'From a one-off script to a pipeline',
        minutes: 60,
        summary: 'Turning the quarter you just processed into a process the next person can run without you.',
      },
    ],
  },
];

const factsById = new Map<CourseId, CourseFacts>(courseFacts.map((item) => [item.id, item]));

export function courseFactsFor(id: string): CourseFacts | null {
  return factsById.get(id as CourseId) ?? null;
}

/** Total minutes from the outline, so the page never states a duration the modules contradict. */
export function courseMinutes(id: string): number {
  const facts = factsById.get(id as CourseId);
  if (!facts) return 0;
  return facts.modules.reduce((sum, module) => sum + module.minutes, 0);
}

export function formatMinutes(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (hours === 0) return `${rest}m`;
  if (rest === 0) return `${hours}h`;
  return `${hours}h ${rest}m`;
}

/**
 * Pathways that build a given competency, best match first. Returns an empty list
 * rather than a default suggestion — three courses cannot cover five competencies,
 * and recommending an unrelated one would make every recommendation worthless.
 */
export function coursesForCompetency(competency: CompetencyId): CourseFacts[] {
  const primary = courseFacts.filter((item) => item.competency === competency);
  const secondary = courseFacts.filter(
    (item) => item.competency !== competency && item.alsoBuilds.includes(competency),
  );
  return [...primary, ...secondary];
}
