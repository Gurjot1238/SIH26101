#!/usr/bin/env node
/**
 * The one duplication in this backend, guarded — plus a coverage check on the paper.
 *
 * `server/progress.mjs` re-declares the competency ids, the band names and the
 * two band thresholds that `src/lib/topics.ts` owns. It has to: the server is
 * plain .mjs with no build step, so it cannot import a TypeScript module.
 *
 * Duplication is only acceptable if it cannot drift silently. This script imports
 * the real runtime values from the server and reads the TypeScript file as text,
 * then compares them. It is not a regex over both sides — one side is executed.
 *
 *   node server/taxonomy-check.mjs
 *
 * Exits 1 on any mismatch, which is what makes ./server/smoke-test.sh fail when
 * somebody adds a sixth competency to the app and forgets the server — or adds it to
 * both and forgets to write questions for it in `server/assessment.mjs`.
 */

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  ASSESSMENT_LENGTH,
  OPTION_IDS,
  QUESTIONS_PER_SECTION,
  SECTIONS,
  answerKey,
} from './assessment.mjs';
import { BAND_AVERAGE_MIN, BAND_STRONG_MIN, BANDS, COMPETENCY_IDS, MIN_QUESTIONS_FOR_BAND, bandFor } from './progress.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const TOPICS = join(HERE, '..', 'src', 'lib', 'topics.ts');

const source = readFileSync(TOPICS, 'utf8');

let failures = 0;

function report(label, ok, detail) {
  if (ok) {
    console.log(`  ok    ${label}`);
    return;
  }
  failures += 1;
  console.log(`  FAIL  ${label} — ${detail}`);
}

/** Every quoted string inside a `export type X = 'a' | 'b';` union, in order. */
function unionMembers(typeName) {
  const match = source.match(new RegExp(`export type ${typeName} =([\\s\\S]*?);`));
  if (!match) throw new Error(`Cannot find "export type ${typeName}" in ${TOPICS}`);
  return [...match[1].matchAll(/'([^']+)'/g)].map((hit) => hit[1]);
}

function numericConstant(name) {
  const match = source.match(new RegExp(`export const ${name} = (-?\\d+);`));
  if (!match) throw new Error(`Cannot find "export const ${name}" in ${TOPICS}`);
  return Number(match[1]);
}

function sameList(a, b) {
  return a.length === b.length && a.every((value, index) => value === b[index]);
}

console.log('\n  Taxonomy drift check\n  ====================\n');
console.log(`  server/progress.mjs  vs  src/lib/topics.ts\n`);

/* ------------------------------------------------- competency ids and bands */

const tsCompetencies = unionMembers('CompetencyId');
report(
  'competency ids match, in the same order',
  sameList(tsCompetencies, COMPETENCY_IDS),
  `app has [${tsCompetencies}], server has [${COMPETENCY_IDS}]`,
);

// A cheap extra: the union and the array inside topics.ts can also disagree with
// each other, and every page reads its labels from the array.
const arrayIds = [...source.matchAll(/^\s{4}id: '([^']+)',$/gm)].map((hit) => hit[1]);
report(
  'topics.ts union matches its own competencies array',
  sameList(tsCompetencies, arrayIds),
  `union has [${tsCompetencies}], array has [${arrayIds}]`,
);

const tsBands = unionMembers('Band');
report('band names match', sameList(tsBands, BANDS), `app has [${tsBands}], server has [${BANDS}]`);

/* ------------------------------------------------------------- band thresholds */

for (const [name, serverValue] of [
  ['BAND_STRONG_MIN', BAND_STRONG_MIN],
  ['BAND_AVERAGE_MIN', BAND_AVERAGE_MIN],
  ['MIN_QUESTIONS_FOR_BAND', MIN_QUESTIONS_FOR_BAND],
]) {
  const appValue = numericConstant(name);
  report(`${name} matches`, appValue === serverValue, `app has ${appValue}, server has ${serverValue}`);
}

/**
 * Matching constants are not the same as matching behaviour, so band the whole
 * input space and compare against the rule spelled out from the parsed values.
 * This is what catches a reordered comparison or a > that should be a >=.
 */
const strongMin = numericConstant('BAND_STRONG_MIN');
const averageMin = numericConstant('BAND_AVERAGE_MIN');
const minQuestions = numericConstant('MIN_QUESTIONS_FOR_BAND');

let mismatch = null;
let checked = 0;
for (let count = 0; count <= 6 && mismatch === null; count += 1) {
  for (let percent = 0; percent <= 100; percent += 1) {
    let want = 'needs-work';
    if (count < minQuestions) want = 'unrated';
    else if (percent >= strongMin) want = 'strong';
    else if (percent >= averageMin) want = 'average';

    checked += 1;
    const got = bandFor(percent, count);
    if (got !== want) {
      mismatch = `bandFor(${percent}, ${count}) returned "${got}", expected "${want}"`;
      break;
    }
  }
}
report(`bandFor agrees on all ${checked} percent/count pairs`, mismatch === null, mismatch ?? '');

/* ---------------------------------------------------- the assessment item bank */

/**
 * The paper in `server/assessment.mjs` is the one place a competency id has to be
 * written by hand rather than imported from a list, so it is the place a sixth
 * competency would be forgotten. These checks are about coverage, not text: they say
 * the five sections measure the five framework competencies, once each, and that the
 * bank divides evenly into them.
 */
const bankSections = SECTIONS.map((section) => section.competency);
report(
  'the assessment measures every competency, once each, in framework order',
  sameList(bankSections, COMPETENCY_IDS),
  `paper measures [${bankSections}], framework has [${COMPETENCY_IDS}]`,
);

report(
  `the paper divides evenly into its sections (${ASSESSMENT_LENGTH} questions, ${SECTIONS.length} sections)`,
  Number.isInteger(QUESTIONS_PER_SECTION) && QUESTIONS_PER_SECTION >= MIN_QUESTIONS_FOR_BAND,
  `${QUESTIONS_PER_SECTION} questions per section, and a band needs at least ${MIN_QUESTIONS_FOR_BAND}`,
);

// Every section must actually hold that many, which the division above cannot show:
// sixteen items across five sections is not an integer, but twelve plus three ones is.
const perSection = SECTIONS.map(
  (_, index) => answerKey().filter((entry) => entry.section === index).length,
);
report(
  'each section holds the same number of questions',
  perSection.every((count) => count === QUESTIONS_PER_SECTION),
  `sections hold [${perSection}], expected ${QUESTIONS_PER_SECTION} each`,
);

// The reason the key is spread at all: three questions whose answer is always B can
// be scored full marks without reading them.
const spread = new Set(answerKey().map((entry) => entry.option));
report(
  'the answer key uses every option position',
  spread.size === OPTION_IDS.length,
  `key uses [${[...spread].sort()}], options are [${OPTION_IDS}]`,
);

console.log(`\n  ${failures === 0 ? 'No drift.' : `${failures} mismatch(es).`}\n`);
process.exit(failures === 0 ? 0 : 1);
