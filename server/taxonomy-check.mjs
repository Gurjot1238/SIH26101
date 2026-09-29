#!/usr/bin/env node
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
import {
  COMPETENCY_LABELS,
  DEFAULT_TARGETS,
  MIN_QUESTIONS_FOR_STATUS,
  PERFORMANCE_SCALE,
  classifyPerformance,
} from './competency.mjs';

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
console.log(`  server/progress.mjs + server/competency.mjs  vs  src/lib/topics.ts\n`);

const tsCompetencies = unionMembers('CompetencyId');
report(
  'competency ids match, in the same order',
  sameList(tsCompetencies, COMPETENCY_IDS),
  `app has [${tsCompetencies}], server has [${COMPETENCY_IDS}]`,
);

const arrayIds = [...source.matchAll(/^\s{4}id: '([^']+)',$/gm)].map((hit) => hit[1]);
report(
  'topics.ts union matches its own competencies array',
  sameList(tsCompetencies, arrayIds),
  `union has [${tsCompetencies}], array has [${arrayIds}]`,
);

const tsBands = unionMembers('Band');
report('band names match', sameList(tsBands, BANDS), `app has [${tsBands}], server has [${BANDS}]`);

for (const [name, serverValue] of [
  ['BAND_STRONG_MIN', BAND_STRONG_MIN],
  ['BAND_AVERAGE_MIN', BAND_AVERAGE_MIN],
  ['MIN_QUESTIONS_FOR_BAND', MIN_QUESTIONS_FOR_BAND],
]) {
  const appValue = numericConstant(name);
  report(`${name} matches`, appValue === serverValue, `app has ${appValue}, server has ${serverValue}`);
}

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

const tsShortNames = [...source.matchAll(/^\s{4}short: '([^']+)',$/gm)].map((hit) => hit[1]);
const serverLabels = COMPETENCY_IDS.map((id) => COMPETENCY_LABELS[id]);
report(
  'competency short names match, in the same order',
  sameList(tsShortNames, serverLabels),
  `app has [${tsShortNames}], server has [${serverLabels}]`,
);

const descending = PERFORMANCE_SCALE.every(
  (level, index) => index === 0 || PERFORMANCE_SCALE[index - 1].min > level.min,
);
report(
  'the performance scale is sorted highest cut-off first',
  descending,
  `scale reads [${PERFORMANCE_SCALE.map((level) => `${level.id}:${level.min}`)}]`,
);

report(
  'the lowest band starts at 0, so no score is unclassifiable',
  PERFORMANCE_SCALE[PERFORMANCE_SCALE.length - 1].min === 0,
  `lowest band starts at ${PERFORMANCE_SCALE[PERFORMANCE_SCALE.length - 1].min}`,
);

let scaleMismatch = null;
let scaleChecked = 0;
for (let count = 0; count <= 6 && scaleMismatch === null; count += 1) {
  for (let percent = 0; percent <= 100; percent += 1) {
    let want = 'unrated';
    if (count >= MIN_QUESTIONS_FOR_STATUS) {
      want = PERFORMANCE_SCALE.find((level) => percent >= level.min)?.id ?? 'unrated';
    }
    scaleChecked += 1;
    const got = classifyPerformance(percent, count);
    if (got !== want) {
      scaleMismatch = `classifyPerformance(${percent}, ${count}) returned "${got}", expected "${want}"`;
      break;
    }
  }
}
report(
  `classifyPerformance agrees on all ${scaleChecked} percent/count pairs`,
  scaleMismatch === null,
  scaleMismatch ?? '',
);

const missingTargets = COMPETENCY_IDS.filter(
  (id) => !Number.isInteger(DEFAULT_TARGETS[id]) || DEFAULT_TARGETS[id] < 0 || DEFAULT_TARGETS[id] > 100,
);
report(
  'every competency has a target between 0 and 100',
  missingTargets.length === 0,
  `no usable target for [${missingTargets}]`,
);

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

const perSection = SECTIONS.map(
  (_, index) => answerKey().filter((entry) => entry.section === index).length,
);
report(
  'each section holds the same number of questions',
  perSection.every((count) => count === QUESTIONS_PER_SECTION),
  `sections hold [${perSection}], expected ${QUESTIONS_PER_SECTION} each`,
);

const spread = new Set(answerKey().map((entry) => entry.option));
report(
  'the answer key uses every option position',
  spread.size === OPTION_IDS.length,
  `key uses [${[...spread].sort()}], options are [${OPTION_IDS}]`,
);

console.log(`\n  ${failures === 0 ? 'No drift.' : `${failures} mismatch(es).`}\n`);
process.exit(failures === 0 ? 0 : 1);
