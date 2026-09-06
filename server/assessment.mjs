/**
 * The quarterly competency check, and the only copy of its answer key.
 *
 * The paper used to live in `src/lib/assessment.ts`, which meant two things. The key
 * shipped inside the browser bundle, readable by anyone who opened the sources tab.
 * And the score was computed in the tab, then posted to be stored — so a hand-written
 * request could file 15/15 without answering a question. Moving the items here fixes
 * both. The browser is dealt the questions with `correct` and `explanation` stripped,
 * it sends back which option it picked, and the server decides the score.
 *
 *   What each side knows
 *
 *   browser   question text, option text in a per-sitting order, option ids
 *   server    all of that, plus the key, the explanations, and the grading
 *
 * The key does reach the browser once, in the reply to a submission, because the
 * review screen has to show what the right answer was and why. By then the attempt is
 * already stored, so knowing it changes nothing.
 *
 *   Grading by option id, not by position
 *
 * Every option carries the id it had in the canonical bank (a, b, c, d) and the list
 * is shuffled before it goes out. The tab answers `{ question: 'q4', option: 'c' }`,
 * so the server never has to remember which order it dealt: there is no per-sitting
 * state to store, expire, or forge, and shuffling costs nothing.
 *
 *   What is deliberately not shuffled
 *
 * Questions move within a section, never across sections. The five sections are the
 * five framework competencies and the page walks them in order, so interleaving them
 * would make the progress stepper jump between subjects for no measurement gain.
 *
 * `server/taxonomy-check.mjs` fails if the sections here stop covering the five
 * competency ids in `src/lib/topics.ts` exactly once each.
 */

import { HttpError } from './http.mjs';
import { COMPETENCY_IDS, bandFor, percentOf } from './progress.mjs';

/** Canonical option ids. Position in the bank, not position on screen. */
export const OPTION_IDS = ['a', 'b', 'c', 'd'];

export const ASSESSMENT_SOURCE = 'assessment';
export const ASSESSMENT_LABEL = 'Quarterly competency check';

/**
 * Said out loud on the page. These are StatSkill's own items, and the result is a
 * self-check against the framework rather than an official competency rating.
 */
export const ASSESSMENT_NOTE =
  'These fifteen scenarios are written into StatSkill and graded on the server against a fixed answer key. They are a self-check against the competency framework, not an official MoSPI or iGOT Karmayogi certification.';

/* ------------------------------------------------------------------- the bank */

/**
 * One section per framework competency. `topic` is what the per-topic report calls
 * it; `focus` is the line shown beside the scenario counter while answering.
 */
export const SECTIONS = [
  { competency: 'data-quality', topic: 'Data quality and coverage', focus: 'Coverage & comparability' },
  { competency: 'inference', topic: 'Evidence and inference', focus: 'Evidence & interpretation' },
  { competency: 'dissemination', topic: 'Communicating results', focus: 'Release & communication' },
  { competency: 'digital-tools', topic: 'Reproducible practice', focus: 'Tooling & reproducibility' },
  { competency: 'leadership', topic: 'Review and sign-off', focus: 'Review & capability' },
];

/**
 * Fifteen scenarios, five sections of three.
 *
 * Three per section is the smallest paper that still gives a section a band worth
 * reading: at two, one wrong answer swings a topic from Good to Needs work.
 *
 * Each item states a situation an official statistician actually meets, has exactly
 * one option that professional practice supports, and carries the reason in
 * `explanation`. Nothing here claims to be an MoSPI or iGOT item bank.
 *
 * The key is spread across all four positions on purpose. Three questions that all
 * answered B would let a learner score full marks without reading, which makes the
 * measurement worthless; `assessment: the answer key is spread across all four
 * positions` in `scripts/engine-test.mjs` fails if that regresses.
 */
const ITEMS = [
  {
    section: 0,
    q: 'A state agency reports a 12.4% rise in registrations. Which context is essential before interpreting this as growth?',
    a: [
      'Compare the figure with the previous month only',
      'Check the population, reference period, and any changes in coverage',
      'Publish the increase with a positive headline',
      'Replace the estimate with an administrative count',
    ],
    correct: 1,
    explanation:
      'A percentage change is only interpretable once you know what it is a change in. If the population covered, the reference period, or the collection method moved, the rise may be an artefact of the count rather than growth in the thing being counted.',
  },
  {
    section: 0,
    q: 'A monthly series is affected by a change in the classification used to code its records. Which practice best protects comparability?',
    a: [
      'Remove the historical values recorded before the change',
      'Raise the sample weights until the new totals match the old ones',
      'Publish a bridge covering both classifications and a break-in-series note',
      'Change the chart colour at the break so readers notice it',
    ],
    correct: 2,
    explanation:
      'A classification change breaks the series, and the standard remedy is to measure an overlap period under both classifications and annotate the break. Deleting history destroys the series, and reweighting to match the old totals forces continuity that no longer exists.',
  },
  {
    section: 0,
    q: "A quarterly survey's response rate in one district falls from 82% to 61%. What should the release say about that district's estimate?",
    a: [
      'Nothing; the estimate is still inside the published margin of error',
      'That the figure has been withdrawn to protect quality',
      "That the previous quarter's value has been carried forward",
      'That the estimate carries a higher risk of nonresponse bias, with the response rate published beside it',
    ],
    correct: 3,
    explanation:
      'A 21-point fall in response is a quality signal in its own right, and the margin of error does not capture it — nonresponse bias is not sampling error. Publishing the estimate with the response rate lets users judge it; carrying a value forward invents data, and withdrawing it removes information users need.',
  },
  {
    section: 1,
    q: 'An estimate of unemployment moves from 7.1% to 7.4%. Each figure has a 95% confidence interval of about ±0.5 points. What can be reported?',
    a: [
      'Unemployment rose by 0.3 points',
      'Unemployment rose, though by less than expected',
      'The change cannot be distinguished from sampling variation at this sample size',
      'The earlier figure should be revised, since the later one is higher',
    ],
    correct: 2,
    explanation:
      'The two intervals overlap almost entirely, so the difference is within the range the sample alone could produce. Reporting 0.3 points as a fact treats an interval as a point, and a later estimate does not make an earlier one wrong.',
  },
  {
    section: 1,
    q: 'Districts with more statistical officers publish more releases. A draft note concludes that adding officers causes more releases. What is the strongest objection?',
    a: [
      'Correlation cannot be calculated across districts',
      'Larger districts have both more officers and more to publish, so the two move together without one causing the other',
      'The comparison needs a larger number of districts',
      'Counts of releases are not a valid statistic',
    ],
    correct: 1,
    explanation:
      'District size is a plausible common cause, so the association is exactly what you would expect even if staffing changed nothing. This is a confounding problem, not a sample-size or measurement problem.',
  },
  {
    section: 1,
    q: "Retail turnover falls about 9% from December to January every year. A brief describes this January's fall as a sharp contraction. What is the correct treatment?",
    a: [
      'Compare with the same month a year earlier, or use the seasonally adjusted series',
      'Report the month-on-month fall as recorded, since the arithmetic is right',
      'Average December and January so the spike disappears',
      'Delay publication until two further months are available',
    ],
    correct: 0,
    explanation:
      'A fall that recurs every January is a seasonal pattern, not a contraction. Year-on-year comparison or seasonal adjustment removes the recurring component; averaging adjacent months destroys the series, and waiting does not answer the question asked.',
  },
  {
    section: 2,
    q: 'A survey estimate has a wide confidence interval. What is the clearest communication to a policy audience?',
    a: [
      'Present the point estimate without qualification',
      'Report the interval and explain the uncertainty in plain language',
      'Exclude the result from the release',
      'Round the result to a whole number',
    ],
    correct: 1,
    explanation:
      'A policy audience can act on "between X and Y, most likely around Z" — what they cannot do is act safely on a single number whose uncertainty was hidden. Withholding the result and rounding it both remove information instead of explaining it.',
  },
  {
    section: 2,
    q: 'A published figure is revised down after new administrative returns arrive. What should the release do?',
    a: [
      'Replace the old figure quietly so the series stays clean',
      'Publish both figures without comment and let users choose',
      'Publish the revision with its size, reason and date, and keep the original in the revision history',
      'Suspend future releases until revisions stop occurring',
    ],
    correct: 2,
    explanation:
      'Revisions are a normal consequence of later, better data; concealing them is what damages trust. A revisions policy states what changed, why and when, and keeps the earlier vintage so past analysis can still be reproduced.',
  },
  {
    section: 2,
    q: "A colleague's bar chart of district literacy starts the vertical axis at 60% so the differences look larger. What is the right advice?",
    a: [
      'Keep it, since the axis is labelled with its range',
      'Remove the axis so nobody misreads the scale',
      'Sort the bars from largest to smallest instead',
      'Start the axis at zero, because bar length is read as magnitude, or use a form where truncation is not misread',
    ],
    correct: 3,
    explanation:
      'Readers compare bars by length, so a truncated axis exaggerates differences even when the range is printed. Either start at zero, or move to a dot plot where position rather than length carries the value.',
  },
  {
    section: 3,
    q: 'A monthly indicator is produced by twelve manual spreadsheet steps, and last month two of them were done out of order. What is the most effective fix?',
    a: [
      'Script the steps so the calculation runs in a fixed order from the raw input, and keep the script under version control',
      'Put a printed checklist beside the analyst who runs it',
      'Have a second analyst repeat the steps by hand and compare the results',
      'Lock the workbook so only one person can open it at a time',
    ],
    correct: 0,
    explanation:
      'Out-of-order execution is a property of manual processes, so automating the sequence removes the whole class of error rather than this instance of it. Checklists and second pairs of eyes lower the rate but leave the process manual.',
  },
  {
    section: 3,
    q: 'Which practice most improves the reproducibility of a published estimate?',
    a: [
      'Keeping the final workbook on a shared drive',
      'Emailing the workbook to the reviewer before release',
      'Naming every file with the release date',
      'Publishing the code together with the exact version of the input data used',
    ],
    correct: 3,
    explanation:
      'Reproducible means somebody else can rerun the calculation and get the same number, which takes the code and the versioned input. Shared storage, email and file naming are housekeeping — none of them lets anyone reproduce the figure.',
  },
  {
    section: 3,
    q: 'An API is documented as holding 50,000 records, but every download stops at exactly 1,000. What is the first thing to check?',
    a: [
      'Whether the network connection is dropping mid-transfer',
      'Whether the endpoint returns pages and the code only requests the first one',
      'Whether some records contain characters the parser rejects',
      'Whether the server is rate-limiting by IP address',
    ],
    correct: 1,
    explanation:
      'Stopping at a round number every single time is the signature of a default page size, not a fault. A dropped connection or a rate limit would cut off at varying points rather than at the same record on every run.',
  },
  {
    section: 4,
    q: "You are reviewing a junior analyst's release, due in two hours, and find an unexplained 4% jump in one series. What do you do?",
    a: [
      'Hold the release, tell users it is delayed and why, and publish once the movement is explained',
      'Publish on time with a note saying the figure is under investigation',
      'Publish the previous period’s value in its place until the jump is explained',
      'Drop the series from this release without comment',
    ],
    correct: 0,
    explanation:
      'Pre-announced timing matters, which is exactly why the delay is announced rather than silent. But a figure you already suspect becomes every user’s problem the moment it is published, and substituting an old value or silently dropping a series misleads them about what was measured.',
  },
  {
    section: 4,
    q: 'Two teams publish different totals for the same indicator because they use different reference periods. As their manager, what is the durable fix?',
    a: [
      'Ask both teams to recheck their arithmetic before the next release',
      'Have the team with the larger total defer to the other',
      'Agree and document one definition and reference period, and make it the standard both teams work to',
      'Publish both totals permanently with a note that the methods differ',
    ],
    correct: 2,
    explanation:
      'The disagreement is definitional, not arithmetic, so only an agreed and documented standard removes it. Deferring by size is arbitrary, and publishing both forever pushes a resolvable inconsistency onto users.',
  },
  {
    section: 4,
    q: "Assessment results across your team show a shared weakness in communicating uncertainty. What is the most useful managerial response?",
    a: [
      'Build it into how the work runs: a short internal session on uncertainty, plus a review step where every draft is read for how it states it',
      'Circulate a reading list on statistical inference',
      'Record the weakness in each analyst’s annual appraisal',
      'Route the team’s releases to whoever communicates best',
    ],
    correct: 0,
    explanation:
      'A weakness the whole team shares is a capability gap, so the response has to change the process — training plus a review step that catches it every time. A reading list is optional reading, appraisals are individual and retrospective, and routing the work to one person hides the gap and creates a bottleneck.',
  },
];

export const ASSESSMENT_LENGTH = ITEMS.length;
export const QUESTIONS_PER_SECTION = ITEMS.length / SECTIONS.length;

/* -------------------------------------------------------------------- dealing */

function questionId(index) {
  return 'q' + (index + 1);
}

/** Fisher-Yates. `random` is a parameter so a test can pin the order it is dealt. */
function shuffled(list, random) {
  const out = [...list];
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    const held = out[i];
    out[i] = out[j];
    out[j] = held;
  }
  return out;
}

/**
 * The paper as a browser is allowed to see it: every question, every option, in a
 * fresh order, with no key and no explanation anywhere in the payload.
 *
 * Pass `shuffle: false` to get the bank in its written order, which is what the
 * tests use so they can assert on a fixed paper.
 */
export function sealedPaper({ shuffle = true, random = Math.random } = {}) {
  const rows = ITEMS.map((item, index) => ({ item, index }));
  const dealt = [];
  for (let section = 0; section < SECTIONS.length; section += 1) {
    const inSection = rows.filter((row) => row.item.section === section);
    dealt.push(...(shuffle ? shuffled(inSection, random) : inSection));
  }

  const questions = dealt.map((row) => {
    const section = SECTIONS[row.item.section];
    const options = row.item.a.map((text, position) => ({ id: OPTION_IDS[position], text }));
    return {
      id: questionId(row.index),
      section: row.item.section,
      topic: section.topic,
      focus: section.focus,
      competency: section.competency,
      kind: 'scenario',
      q: row.item.q,
      options: shuffle ? shuffled(options, random) : options,
    };
  });

  return {
    label: ASSESSMENT_LABEL,
    note: ASSESSMENT_NOTE,
    length: questions.length,
    questionsPerSection: QUESTIONS_PER_SECTION,
    sections: SECTIONS.map((section) => ({ ...section })),
    questions,
  };
}

/* -------------------------------------------------------------------- grading */

const ITEM_BY_ID = new Map(ITEMS.map((item, index) => [questionId(index), { item, index }]));

function invalid(message) {
  return new HttpError(400, 'invalid_input', message, { choices: message });
}

/**
 * Grade one submission.
 *
 * Takes which option was picked for which question, and nothing else that counts.
 * There is no score in the input and no place to put one: `total` is the size of the
 * bank, `correct` is counted here from the key, and every figure downstream — the
 * percentage, the band, the per-topic rows — is derived from those two. A body that
 * also carries `correct: 15` is not rejected, it is simply not read.
 *
 * Grading walks the canonical bank rather than the submitted list, so leaving
 * questions out of `choices` cannot shorten the paper. An unanswered question is
 * recorded as unanswered and counted as wrong.
 */
export function gradeSubmission(body) {
  if (body === null || typeof body !== 'object' || Array.isArray(body)) throw invalid('A submission is required.');
  if (!Array.isArray(body.choices)) throw invalid('Answers must be a list.');
  if (body.choices.length > ASSESSMENT_LENGTH) {
    throw invalid('This paper has ' + ASSESSMENT_LENGTH + ' questions.');
  }

  const picked = new Map();
  for (const choice of body.choices) {
    if (choice === null || typeof choice !== 'object' || Array.isArray(choice)) {
      throw invalid('Each answer must name a question and an option.');
    }
    if (!ITEM_BY_ID.has(choice.question)) throw invalid('An answer names a question that is not on this paper.');
    if (picked.has(choice.question)) throw invalid('A question was answered twice.');

    const option = choice.option === undefined ? null : choice.option;
    if (option !== null && !OPTION_IDS.includes(option)) {
      throw invalid('An answer names an option that is not on this question.');
    }
    picked.set(choice.question, option);
  }

  const questions = [];
  const perTopic = new Map();
  let correct = 0;
  let answered = 0;

  for (const [index, item] of ITEMS.entries()) {
    const id = questionId(index);
    const section = SECTIONS[item.section];
    const chosen = picked.get(id) ?? null;
    const correctOption = OPTION_IDS[item.correct];
    const right = chosen !== null && chosen === correctOption;

    if (chosen !== null) answered += 1;
    if (right) correct += 1;

    questions.push({
      id,
      position: index,
      section: item.section,
      topic: section.topic,
      competency: section.competency,
      chosen,
      correctOption,
      right,
      explanation: item.explanation,
    });

    const row = perTopic.get(section.topic) ?? {
      topic: section.topic,
      competency: section.competency,
      correct: 0,
      total: 0,
    };
    row.total += 1;
    if (right) row.correct += 1;
    perTopic.set(section.topic, row);
  }

  const total = ITEMS.length;
  const percent = percentOf(correct, total);

  return {
    source: ASSESSMENT_SOURCE,
    label: ASSESSMENT_LABEL,
    total,
    correct,
    answered,
    percent,
    band: bandFor(percent, total),
    topics: [...perTopic.values()].map((row) => ({
      ...row,
      percent: percentOf(row.correct, row.total),
      band: bandFor(percentOf(row.correct, row.total), row.total),
    })),
    questions,
  };
}

/**
 * The body `validateAttempt` would have received, built from the real grading.
 *
 * Routing the server's own numbers back through the same validator as a posted
 * material quiz keeps one storage path and one set of invariants — including the
 * check that topic counts cannot add up to more than the paper.
 */
export function attemptPayload(graded, { durationSeconds } = {}) {
  return {
    source: graded.source,
    label: graded.label,
    total: graded.total,
    correct: graded.correct,
    durationSeconds,
    topics: graded.topics.map(({ topic, competency, correct, total }) => ({ topic, competency, correct, total })),
  };
}

/**
 * The key on its own, for the tests and the drift check. Never sent to a browser:
 * what a submission gets back is the key for the paper it just finished, assembled
 * by `gradeSubmission` after the attempt is graded.
 */
export function answerKey() {
  return ITEMS.map((item, index) => ({
    id: questionId(index),
    section: item.section,
    option: OPTION_IDS[item.correct],
  }));
}

/** Every competency the paper measures, in framework order. Used by the drift check. */
export function measuredCompetencies() {
  return COMPETENCY_IDS.filter((id) => SECTIONS.some((section) => section.competency === id));
}
