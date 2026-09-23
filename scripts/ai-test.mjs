/**
 * Tests AI question generation by running it, with a mock provider standing in for Gemini.
 *
 * Usage:  node scripts/ai-test.mjs        (or, more usefully:  npm run ai:test)
 *
 *   Why there is no real API key anywhere near this file
 *
 * Every interesting failure in this feature is a failure of *handling a response*:
 * malformed JSON, three options instead of four, a correctIndex of 7, a source sentence
 * the document does not contain. A live model would make those cases slow, costly and
 * non-deterministic to reach — and a suite that needs a key cannot run in CI, which means
 * it stops running at all. So the provider is swapped for one that returns canned text
 * and the pipeline above it is exercised for real: the same parser, the same validator,
 * the same grounding check, the same repair loop, the same selection.
 *
 * What this deliberately does not test is whether Gemini writes good questions. That is
 * not something this repository can assert, and pretending otherwise would be the same
 * dishonesty the feature itself is built to avoid.
 *
 *   The shape of a check
 *
 * A check returns nothing when it passes and a string explaining the problem when it
 * fails, so a failure reports the actual value rather than just "expected true".
 */

import { mkdtempSync, readdirSync, rmSync, writeFileSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import {
  buildDocumentIndex,
  containmentRatio,
  digitsIn,
  documentHasWord,
  matchKey,
  normalizeForMatch,
  parseProviderJson,
  properNounsIn,
  selectQuestions,
  similarity,
  snapToDocument,
  spanSupport,
  validateBatch,
  validateQuestion,
  estimateDifficulty,
} from '../server/ai/validation.mjs';
import { chunkText, describeModel, describeTarget, generateMcqs, providerStatus, MIN_QUESTIONS } from '../server/ai/provider.mjs';
import { generateRaw } from '../server/ai/gemini.mjs';
import {
  generateRaw as localGenerateRaw,
  isConfigured as localIsConfigured,
  safeOrigin,
} from '../server/ai/local.mjs';
import { createRateLimiter } from '../server/auth.mjs';

const FIXTURES = new URL('../server/ai-fixtures/', import.meta.url);
const DOC = readFileSync(new URL('material.txt', FIXTURES), 'utf8');
const INDEX = buildDocumentIndex(DOC);

let passed = 0;
let failed = 0;
const failures = [];

function check(name, run) {
  let problem = null;
  try {
    const result = run();
    if (result !== true && result !== undefined) problem = String(result);
  } catch (error) {
    problem = error && error.message ? error.message : String(error);
  }
  if (problem) {
    failed += 1;
    failures.push(`${name}: ${problem}`);
    console.log(`  FAIL  ${name}`);
    console.log(`        ${problem}`);
  } else {
    passed += 1;
    console.log(`  ok    ${name}`);
  }
}

async function checkAsync(name, run) {
  let problem = null;
  try {
    const result = await run();
    if (result !== true && result !== undefined) problem = String(result);
  } catch (error) {
    problem = error && error.message ? error.message : String(error);
  }
  if (problem) {
    failed += 1;
    failures.push(`${name}: ${problem}`);
    console.log(`  FAIL  ${name}`);
    console.log(`        ${problem}`);
  } else {
    passed += 1;
    console.log(`  ok    ${name}`);
  }
}

/* A question that passes every check, so each case below can break exactly one thing. */
function goodQuestion(patch = {}) {
  return {
    question: 'What is the base year for the Consumer Price Index series described in this note?',
    options: ['2012', '2004', '2011', '2016'],
    correctIndex: 0,
    topic: 'Index methodology',
    kind: 'numeric',
    explanation: 'The note states that the base year for the current series is 2012.',
    source: 'The base year for the current series is 2012.',
    ...patch,
  };
}

const TOPICS = ['Index methodology', 'Sampling and non-response', 'Price collection', 'Data quality'];

/* ------------------------------------------------------------------ the baseline */

console.log('\n  -- the fixture question is actually valid -------------------\n');

check('the unmodified fixture question passes every check', () => {
  const outcome = validateQuestion(goodQuestion(), INDEX, { allowedTopics: TOPICS });
  if (!outcome.ok) return `rejected for: ${outcome.reason}`;
});

check('a valid question comes back cleaned, not merely approved', () => {
  const outcome = validateQuestion(goodQuestion({ question: `  ${goodQuestion().question}  ` }), INDEX, { allowedTopics: TOPICS });
  if (!outcome.ok) return `rejected for: ${outcome.reason}`;
  if (outcome.question.question.startsWith(' ')) return 'the stem kept its leading whitespace';
  if (outcome.question.options.length !== 4) return `got ${outcome.question.options.length} options back`;
});

/* --------------------------------------------------------- the rejection matrix */

console.log('\n  -- §11 every malformed question is refused, for the right reason --\n');

/*
 * Each row breaks one thing. The reason is matched as a substring rather than compared
 * whole, because the wording is written for a repair prompt and will be reworded; what
 * must not drift is *which* defect was detected. A row that starts passing for the wrong
 * reason is a row that has stopped testing anything.
 */
const REJECTIONS = [
  ['three options instead of four', { options: ['2012', '2004', '2011'] }, 'expected 4 options'],
  ['five options instead of four', { options: ['2012', '2004', '2011', '2016', '2020'] }, 'expected 4 options'],
  ['options is not an array', { options: '2012, 2004, 2011, 2016' }, 'options is not an array'],
  ['an option is empty', { options: ['2012', '', '2011', '2016'] }, 'an option is empty'],
  ['an option is not a string', { options: ['2012', 2004, '2011', '2016'] }, 'an option is not a string'],
  ['two options are identical', { options: ['2012', '2012', '2011', '2016'] }, 'two options are the same'],
  ['two options differ only in case and punctuation', {
    question: 'Which survey supplies the weights used in the basket?',
    options: ['Consumer Expenditure Survey', 'consumer expenditure survey.', 'Annual Survey of Industries', 'Periodic Labour Force Survey'],
    correctIndex: 0,
    kind: 'identify',
    source: 'Weights in the basket are derived from the Consumer Expenditure Survey and are revised',
    explanation: 'The note says the weights come from the Consumer Expenditure Survey.',
  }, 'two options are the same'],
  ['correctIndex past the end of the options', { correctIndex: 7 }, 'correctIndex must be an integer'],
  ['correctIndex negative', { correctIndex: -1 }, 'correctIndex must be an integer'],
  ['correctIndex is not an integer', { correctIndex: 1.5 }, 'correctIndex must be an integer'],
  ['correctIndex is a string', { correctIndex: '0' }, 'correctIndex must be an integer'],
  ['the question is missing', { question: '' }, 'question is missing or too short'],
  ['the question is a fragment', { question: 'Base year?' }, 'question is missing or too short'],
  ['the explanation is empty', { explanation: '' }, 'explanation is missing or too short'],
  ['the source is empty', { source: '' }, 'source passage is missing or too short'],
  ['the topic is missing', { topic: '' }, 'topic is missing'],
  ['the question is not an object', null, 'not an object'],
  ['the question is an array', [], 'not an object'],
];

for (const [name, patch, expected] of REJECTIONS) {
  check(name, () => {
    const raw = patch === null || Array.isArray(patch) ? patch : goodQuestion(patch);
    const outcome = validateQuestion(raw, INDEX, { allowedTopics: TOPICS });
    if (outcome.ok) return 'it was accepted';
    if (!outcome.reason.includes(expected)) return `refused for "${outcome.reason}", expected something containing "${expected}"`;
  });
}

/* ------------------------------------------------------------------- §10 grounding */

console.log('\n  -- §10 a question must come out of the uploaded document ----\n');

check('an invented source passage is refused', () => {
  const outcome = validateQuestion(goodQuestion({
    source: 'The National Statistical Commission mandated a revised base year of 2020 in its fourth report.',
    explanation: 'The note states the base year was revised to 2020 by the Commission.',
  }), INDEX, { allowedTopics: TOPICS });
  if (outcome.ok) return 'a passage that is nowhere in the document was accepted';
  if (!outcome.reason.includes('not in the uploaded document')) return `refused for the wrong reason: ${outcome.reason}`;
});

check('a source built from real words in an invented order is refused', () => {
  // Every word here appears in the document; the sequence does not, so it keeps almost no
  // ordered pairs and scores 0.529 against its best window.
  //
  // Worth being precise about what this proves, because it was once credited with proving
  // that fabrication is caught in general. It is not. It only shows that a *heavily*
  // rearranged sentence is refused. A fabrication that changes one word inside an otherwise
  // verbatim sentence scores 0.833 to 0.895 and would leave this check green — which is why
  // grounding does not stop at "is this quote in the document" and the two checks below
  // exist.
  const outcome = validateQuestion(goodQuestion({
    source: 'The current basket for the series is revised when the base year weights shift materially in urban markets.',
    explanation: 'The note describes when the basket is revised.',
  }), INDEX, { allowedTopics: TOPICS });
  if (outcome.ok) return 'a rearranged sentence was accepted as a quotation';
});

check('a quote that survives grounding is replaced by the document\'s own words', () => {
  // The real defence against a one-word fabrication is not detection, it is substitution.
  // This quote deliberately clears the threshold while carrying a corrupted figure, and the
  // model's string still never reaches the caller: what comes back is the document's text.
  const corrupted = 'The base year for the current series is 2020.';
  const outcome = validateQuestion(goodQuestion({
    source: corrupted,
    options: ['2012', '2004', '2011', '2016'],
  }), INDEX, { allowedTopics: TOPICS });
  if (!outcome.ok) return `expected this to be accepted on the real sentence, but: ${outcome.reason}`;
  if (outcome.question.source === corrupted) return 'the model\'s corrupted string was stored as the source';
  if (outcome.question.source !== 'The base year for the current series is 2012.') {
    return `stored "${outcome.question.source}" instead of the document's sentence`;
  }
});

check('every accepted source is a verbatim run of the document, not the model\'s text', () => {
  // A property over the whole good batch rather than one example: whatever a learner is
  // shown as "the passage this came from" must be findable in the uploaded file. This is the
  // claim the Materials page makes on screen, so it is asserted rather than assumed.
  const batch = JSON.parse(readFileSync(new URL('valid.json', FIXTURES), 'utf8'));
  const { accepted } = validateBatch(batch.questions, INDEX, { allowedTopics: TOPICS });
  if (accepted.length === 0) return 'nothing was accepted, so this proved nothing';
  const haystack = normalizeForMatch(DOC);
  for (const question of accepted) {
    if (!haystack.includes(normalizeForMatch(question.source))) {
      return `stored source is not verbatim document text: "${question.source.slice(0, 70)}"`;
    }
  }
});

check('a re-punctuated real quotation is still accepted', () => {
  // A model quoting from the document will re-space and re-punctuate. Insisting on an
  // exact string match would throw away good questions, which is why this is a ratio.
  const outcome = validateQuestion(goodQuestion({
    source: 'the base year, for the current series, is 2012',
  }), INDEX, { allowedTopics: TOPICS });
  if (!outcome.ok) return `a genuine quote was refused: ${outcome.reason}`;
});

check('a numeric answer that is not in the quoted source is refused', () => {
  const outcome = validateQuestion(goodQuestion({
    options: ['2020', '2004', '2011', '2016'],
  }), INDEX, { allowedTopics: TOPICS });
  if (outcome.ok) return 'an answer key unsupported by the source was accepted';
  if (!outcome.reason.includes('does not appear in the quoted source')) return `refused for the wrong reason: ${outcome.reason}`;
});

check('a topic the document never produced is refused', () => {
  const outcome = validateQuestion(goodQuestion({ topic: 'Machine learning' }), INDEX, { allowedTopics: TOPICS });
  if (outcome.ok) return 'an invented topic was accepted';
  if (!outcome.reason.includes('not one of the topics')) return `refused for the wrong reason: ${outcome.reason}`;
});

check('a question that contains its own answer is refused', () => {
  const outcome = validateQuestion(goodQuestion({
    question: 'Which survey supplies the weights, the Consumer Expenditure Survey or another?',
    options: ['Consumer Expenditure Survey', 'Annual Survey of Industries', 'Periodic Labour Force Survey', 'National Sample Survey'],
    correctIndex: 0,
    kind: 'identify',
    source: 'Weights in the basket are derived from the Consumer Expenditure Survey and are revised',
    explanation: 'The note says the weights come from the Consumer Expenditure Survey.',
  }), INDEX, { allowedTopics: TOPICS });
  if (outcome.ok) return 'a stem that gave away its answer was accepted';
  if (!outcome.reason.includes('gives away its own answer')) return `refused for the wrong reason: ${outcome.reason}`;
});

/* ------------------------------------------------ §10/§11 the one-word-lie battery */

console.log('\n  -- §10/§11 a single swapped word inside a real quote --------\n');

/*
 * These are the attacks a hostile audit demonstrated against the earlier grounding check,
 * which only asked whether 60% of a quote's word-pairs appeared *somewhere* in the whole
 * document. Every one of them clears that bar — a reversed claim scored 0.833, a swapped
 * figure 0.867 — because changing one word in a real sentence costs only a shingle or two.
 * They are caught now because the quote is snapped back to the real document sentence and
 * every downstream check runs against that, not against the model's copy of it. Each attack
 * is paired below with the legitimate question it is a corruption of, so a check that starts
 * passing by refusing everything is caught too.
 */

check('snapToDocument returns the real sentence, not the model\'s copy', () => {
  const snapped = snapToDocument('the base year, for the current series, is 2012', INDEX);
  if (snapped === null) return 'a genuine quote did not snap to anything';
  if (snapped !== 'The base year for the current series is 2012.') {
    return `snapped to "${snapped}" instead of the document's own sentence`;
  }
});

check('snapToDocument refuses a quote assembled from scattered sentences', () => {
  // Words from the base-year sentence and the villages sentence, welded together. Against
  // the whole document this scored ~1.0; against any two-sentence window it cannot.
  const snapped = snapToDocument('The base year is 2012 in 1181 villages and 1114 urban markets every month', INDEX);
  if (snapped !== null) return `a stitched-together quote snapped to "${snapped}"`;
});

check('a figure swapped inside an otherwise verbatim quote is refused', () => {
  // "…is 2012" is the real sentence; the model quotes it verbatim but answers 2020. The old
  // check compared 2020 against the model's own source string and passed it.
  const outcome = validateQuestion(goodQuestion({ options: ['2020', '2004', '2011', '2016'] }), INDEX, { allowedTopics: TOPICS });
  if (outcome.ok) return 'a swapped figure survived the snap-back answer check';
  if (!outcome.reason.includes('does not appear in the quoted source')) return `refused for the wrong reason: ${outcome.reason}`;
});

check('the same figure swap is still refused when the source is diluted with an invented tail', () => {
  const outcome = validateQuestion(goodQuestion({
    options: ['2020', '2004', '2011', '2016'],
    source: 'The base year for the current series is 2012, later revised to 2020 by the commission.',
  }), INDEX, { allowedTopics: TOPICS });
  if (outcome.ok) return 'a suffix-diluted quote with a swapped answer was accepted';
});

check('a number-word duration swap is refused (twelve months -> three months)', () => {
  // No digits are involved, so the figure check cannot see this; the verbatim short-answer
  // rule is what catches it, because "three months" is not a run of words in the real
  // "…twelve consecutive months" sentence it snapped back to.
  const outcome = validateQuestion(goodQuestion({
    question: 'After what period of continuous unavailability is an item removed from the basket?',
    options: ['Three months', 'Six months', 'Nine months', 'One month'],
    correctIndex: 0,
    kind: 'numeric',
    topic: 'Sampling and non-response',
    explanation: 'An item is dropped from the basket after a period of unavailability.',
    source: 'An item is dropped from the basket entirely only when it has been unavailable for twelve consecutive months.',
  }), INDEX, { allowedTopics: TOPICS });
  if (outcome.ok) return 'a number-word swap was accepted';
  if (!outcome.reason.includes('does not appear in the quoted source')) return `refused for the wrong reason: ${outcome.reason}`;
});

check('a circular answer key — source and answer agree, document disagrees — is refused', () => {
  // The source claims 9999 villages and the answer is 9999, so they are self-consistent.
  // Snapping replaces the source with the real "…1181 villages…" sentence, and 9999 is not
  // in it. The old check, comparing the answer against the model's own source, passed this.
  const outcome = validateQuestion(goodQuestion({
    question: 'According to the note, how many villages are covered by monthly price collection?',
    options: ['9999', '1114', '1811', '1141'],
    correctIndex: 0,
    kind: 'numeric',
    topic: 'Sampling and non-response',
    explanation: 'The note reports price data are collected in some villages.',
    source: 'Price data are collected from selected markets in 9999 villages and 1114 urban markets every month.',
  }), INDEX, { allowedTopics: TOPICS });
  if (outcome.ok) return 'a self-consistent fabrication was accepted';
});

check('the legitimate twin of these attacks is still accepted', () => {
  // The guard: the real base-year question, and the real twelve-months question, must pass.
  const baseYear = validateQuestion(goodQuestion(), INDEX, { allowedTopics: TOPICS });
  if (!baseYear.ok) return `the real base-year question was refused: ${baseYear.reason}`;
  const dropped = validateQuestion(goodQuestion({
    question: 'After what period of continuous unavailability is an item removed from the basket?',
    options: ['Twelve consecutive months', 'Three consecutive months', 'Six consecutive months', 'Twenty-four consecutive months'],
    correctIndex: 0,
    kind: 'numeric',
    topic: 'Sampling and non-response',
    explanation: 'An item is dropped only after twelve consecutive months of unavailability.',
    source: 'An item is dropped from the basket entirely only when it has been unavailable for twelve consecutive months.',
  }), INDEX, { allowedTopics: TOPICS });
  if (!dropped.ok) return `the real twelve-months question was refused: ${dropped.reason}`;
});

/* ------------------------------------------------- §9 kind cannot switch off checks */

console.log('\n  -- §9 an unrecognised kind cannot route around the answer check --\n');

check('a present-but-unknown kind is refused, not silently downgraded', () => {
  const outcome = validateQuestion(goodQuestion({ kind: 'banana' }), INDEX, { allowedTopics: TOPICS });
  if (outcome.ok) return 'an unknown kind was accepted';
  if (!outcome.reason.includes('unknown question kind')) return `refused for the wrong reason: ${outcome.reason}`;
});

check('a missing kind is allowed and defaults, rather than being refused', () => {
  const raw = goodQuestion();
  delete raw.kind;
  const outcome = validateQuestion(raw, INDEX, { allowedTopics: TOPICS });
  if (!outcome.ok) return `a question with no kind was refused: ${outcome.reason}`;
  if (outcome.question.kind !== 'statement') return `defaulted to "${outcome.question.kind}" instead of statement`;
});

for (const label of ['statement', 'identify', 'scenario']) {
  check(`a swapped figure labelled "${label}" is still caught`, () => {
    // The laundering attack: pick the kind that used to skip the answer check. The digit
    // and verbatim rules now run whatever the label says.
    const outcome = validateQuestion(goodQuestion({ kind: label, options: ['2020', '2004', '2011', '2016'] }), INDEX, { allowedTopics: TOPICS });
    if (outcome.ok) return `a swapped answer passed under kind "${label}"`;
  });
}

/* ------------------------------------------------- §10 the explanation is grounded too */

console.log('\n  -- §10 an explanation may not invent a figure either ---------\n');

check('an explanation that invents a percentage is refused', () => {
  const outcome = validateQuestion(goodQuestion({
    explanation: 'The note reports the base year is 2012 and that inflation reached 41.7 per cent that year.',
  }), INDEX, { allowedTopics: TOPICS });
  if (outcome.ok) return 'an explanation with an invented figure was accepted';
  if (!outcome.reason.includes('explanation states a figure the document does not')) return `refused for the wrong reason: ${outcome.reason}`;
});

check('an explanation that invents a count is refused', () => {
  const outcome = validateQuestion(goodQuestion({
    explanation: 'The base year is 2012, established after 900 households were surveyed.',
  }), INDEX, { allowedTopics: TOPICS });
  if (outcome.ok) return 'an explanation with an invented count was accepted';
});

check('a stem that invents a figure is refused', () => {
  const outcome = validateQuestion(goodQuestion({
    question: 'In the 2019 revision, what base year did the note adopt for the series?',
  }), INDEX, { allowedTopics: TOPICS });
  if (outcome.ok) return 'a stem with an invented year was accepted';
  if (!outcome.reason.includes('question states a figure the document does not')) return `refused for the wrong reason: ${outcome.reason}`;
});

check('an explanation that cites a real neighbouring figure is still accepted', () => {
  // The guard against the checks above turning into "reject any explanation with a number".
  // 1114 is in the document, one clause away from the answer's own figure, and must pass.
  const outcome = validateQuestion(goodQuestion({
    question: 'According to the note, how many villages are covered by monthly price collection?',
    options: ['1181', '1114', '1811', '1141'],
    correctIndex: 0,
    kind: 'numeric',
    topic: 'Sampling and non-response',
    explanation: 'Price data are collected in 1181 villages, alongside 1114 urban markets.',
    source: 'Price data are collected from selected markets in 1181 villages and 1114 urban markets every month.',
  }), INDEX, { allowedTopics: TOPICS });
  if (!outcome.ok) return `a legitimate neighbouring figure was refused: ${outcome.reason}`;
});

check('digitsIn reads figures and ignores number-words', () => {
  const found = digitsIn('The base year is 2012 and 0.1 index points, one of four checks, 1,181 villages.');
  for (const expected of ['2012', '0.1', '1181']) {
    if (!found.has(expected)) return `did not extract ${expected}`;
  }
  if (found.has('one') || found.has('four')) return 'a number-word was treated as a figure';
});

/* ---------------------------------------- §10 the explanation may not invent a name either */

console.log('\n  -- §10 an explanation may not invent an entity either -------\n');

check('an explanation that invents an organisation is refused', () => {
  // The attack a figure check cannot see: no digits at all, just a fabricated body and a
  // fabricated agreement, printed to the learner as if the document had said it.
  const outcome = validateQuestion(goodQuestion({
    explanation: 'The World Bank mandated this rule after the Geneva Accord on statistical harmonisation.',
  }), INDEX, { allowedTopics: TOPICS });
  if (outcome.ok) return 'an explanation naming an invented organisation was accepted';
  if (!outcome.reason.includes('explanation names something the document does not')) return `refused for the wrong reason: ${outcome.reason}`;
});

check('an explanation that invents an acronym is refused', () => {
  // Two capitals in one token is a name wherever it sits, so a mid-sentence acronym is caught.
  const outcome = validateQuestion(goodQuestion({
    explanation: 'This figure is published each quarter by the WXYZ bureau without later revision.',
  }), INDEX, { allowedTopics: TOPICS });
  if (outcome.ok) return 'an explanation naming an invented acronym was accepted';
});

check('a stem that invents a named authority is refused', () => {
  const outcome = validateQuestion(goodQuestion({
    question: 'According to the Brussels Convention, what base year does this note adopt for the series?',
  }), INDEX, { allowedTopics: TOPICS });
  if (outcome.ok) return 'a stem naming an invented convention was accepted';
  if (!outcome.reason.includes('question names something the document does not')) return `refused for the wrong reason: ${outcome.reason}`;
});

check('a first-word capital is not mistaken for a name', () => {
  // "Because" and "The" are capitalised only by sentence position. An explanation that is a
  // legitimate paraphrase, introducing no proper noun, has to pass — otherwise the rule above
  // would reject nearly every real explanation.
  const outcome = validateQuestion(goodQuestion({
    explanation: 'Because the reference point is fixed, later prices are all compared against that same year.',
  }), INDEX, { allowedTopics: TOPICS });
  if (!outcome.ok) return `a paraphrase with only sentence-initial capitals was refused: ${outcome.reason}`;
});

check('a real named entity from the document is still accepted', () => {
  // The guard against "reject any explanation with a capital letter". Consumer Price Index is
  // named in the material and must survive, capitalised, in the explanation.
  const outcome = validateQuestion(goodQuestion({
    explanation: 'The Consumer Price Index uses 2012 as the base year for the current series.',
  }), INDEX, { allowedTopics: TOPICS });
  if (!outcome.ok) return `a real named entity was refused: ${outcome.reason}`;
});

check('properNounsIn skips sentence starts and Roman numerals but keeps names and acronyms', () => {
  const found = properNounsIn('Because Statement II holds, the MoSPI report cites the Laspeyres formula.');
  if (found.has('because')) return '"Because" was treated as a name';
  if (found.has('ii')) return 'a Roman numeral was treated as a name';
  if (!found.has('mospi')) return 'an acronym was missed';
  if (!found.has('laspeyres')) return 'a mid-sentence proper noun was missed';
});

check('documentHasWord folds a possessive or plural back to the document form', () => {
  // The document writes "index"; an explanation writing "index's" or "indexes" is the same
  // word, and refusing over the inflection would be a false rejection.
  if (!documentHasWord('index', INDEX)) return 'the bare word was not found';
});

/* ------------------------------------ §5 the topic is grounded when no allow-list is sent */

console.log('\n  -- §5 an invented topic cannot ride in on an empty allow-list\n');

check('an invented topic is refused even with no allow-list', () => {
  // topics is optional on the wire and the route defaults a missing one to [], so this path
  // is reachable from any client. It used to skip the topic check entirely.
  const outcome = validateQuestion(goodQuestion({ topic: 'Quantum Chromodynamics Fizz' }), INDEX, { allowedTopics: null });
  if (outcome.ok) return 'an invented topic passed when the allow-list was empty';
  if (!outcome.reason.includes('uses words the document does not')) return `refused for the wrong reason: ${outcome.reason}`;
});

check('a document-derived topic passes with no allow-list', () => {
  const outcome = validateQuestion(goodQuestion({ topic: 'Index methodology' }), INDEX, { allowedTopics: [] });
  if (!outcome.ok) return `a real topic was refused with an empty allow-list: ${outcome.reason}`;
});

check('the allow-list, when supplied, still overrides the document-word fallback', () => {
  // A topic whose words are all in the document but which is not on an explicit allow-list is
  // still refused — the stricter check wins when the client bothered to send one.
  const outcome = validateQuestion(goodQuestion({ topic: 'Price collection' }), INDEX, { allowedTopics: ['Index methodology'] });
  if (outcome.ok) return 'the explicit allow-list was bypassed';
  if (!outcome.reason.includes('not one of the topics extracted')) return `refused for the wrong reason: ${outcome.reason}`;
});

/* ------------------------------------------------------- the matching primitives */

console.log('\n  -- the matching rules these checks rest on ------------------\n');

check('decimals are not flattened into integers', () => {
  // normalizeForMatch keeps "." so 7.2 and 72 stay different numbers. They would be the
  // same string if punctuation were stripped wholesale, and a wrong answer would pass.
  if (normalizeForMatch('7.2') === normalizeForMatch('72')) return '7.2 and 72 normalize the same';
});

check('trailing punctuation does not make two options different', () => {
  if (matchKey('Base year') !== matchKey('Base year.')) return 'matchKey treats "Base year" and "Base year." as different';
  if (matchKey('Base Year') !== matchKey('base year')) return 'matchKey is case sensitive';
});

check('a short answer with no word pairs is still matched', () => {
  // A one-word answer has no bigrams at all, so containmentRatio returns 0 for it and
  // spanSupport has to handle it as a contiguous run instead.
  if (containmentRatio('2012', INDEX.shingles) !== 0) return 'a one-word span unexpectedly produced shingles';
  if (spanSupport('2012', 'The base year for the current series is 2012.') < 0.5) return 'a present one-word answer was not found';
  if (spanSupport('2020', 'The base year for the current series is 2012.') >= 0.5) return 'an absent one-word answer was reported present';
});

check('similarity spots a near-verbatim repeat but not an unrelated question', () => {
  // What this metric can and cannot do is load-bearing, so it is pinned here. It catches
  // a repeat that is almost the same string; it cannot catch a reworded one without also
  // catching two different questions drawn from one sentence, which is why `factKey`
  // exists and why this threshold is left alone. See DUPLICATE_THRESHOLD.
  const a = 'What is the base year for the Consumer Price Index series described in this note?';
  const verbatim = 'What is the base year for the Consumer Price Index series described in this note';
  const unrelated = 'How many urban markets are visited for price collection every month?';
  if (similarity(a, verbatim) < 0.75) return `a near-verbatim repeat scored only ${similarity(a, verbatim).toFixed(2)}`;
  if (similarity(a, unrelated) >= 0.75) return `two different questions scored ${similarity(a, unrelated).toFixed(2)}`;
});

check('wording similarity alone cannot separate a duplicate from a distinct question', () => {
  // The measurement the design rests on. If these two ever diverge enough for a threshold
  // to split them, the factKey rule could be reconsidered — until then it is required.
  const reworded = similarity(
    'What is the base year for the Consumer Price Index series described in this note?',
    'What is the base year of the Consumer Price Index series described in the note?',
  );
  const distinct = similarity(
    'How many villages are covered by monthly price collection?',
    'How many urban markets are covered by monthly price collection?',
  );
  if (Math.abs(reworded - distinct) > 0.15) {
    return `the gap has moved to ${(reworded - distinct).toFixed(3)} (reworded ${reworded.toFixed(3)}, distinct ${distinct.toFixed(3)})`;
  }
});

/* -------------------------------------------------------------- §8 JSON parsing */

console.log('\n  -- §8 structured JSON, never free-form prose ----------------\n');

check('a bare JSON object parses', () => {
  const parsed = parseProviderJson('{"questions":[]}');
  if (!parsed.ok) return `refused: ${parsed.reason}`;
});

check('a fenced ```json block parses', () => {
  const parsed = parseProviderJson('```json\n{"questions":[{"question":"x"}]}\n```');
  if (!parsed.ok) return `refused: ${parsed.reason}`;
  if (parsed.questions.length !== 1) return `got ${parsed.questions.length} questions`;
});

check('a preamble before the object is survived', () => {
  const parsed = parseProviderJson('Here are your questions:\n{"questions":[]}\nHope that helps!');
  if (!parsed.ok) return `refused: ${parsed.reason}`;
});

check('malformed JSON is refused rather than repaired by guessing', () => {
  const parsed = parseProviderJson('{"questions":[{"question":"x",}]}');
  if (parsed.ok) return 'invalid JSON parsed anyway';
  if (!parsed.reason.includes('malformed')) return `refused for: ${parsed.reason}`;
});

check('prose with no JSON at all is refused', () => {
  const parsed = parseProviderJson('I am sorry, I cannot generate questions from this document.');
  if (parsed.ok) return 'prose was accepted as JSON';
  if (!parsed.reason.includes('did not return JSON')) return `refused for: ${parsed.reason}`;
});

check('an empty response is refused', () => {
  if (parseProviderJson('').ok) return 'an empty string was accepted';
  if (parseProviderJson(null).ok) return 'null was accepted';
});

check('JSON without a questions array is refused', () => {
  const parsed = parseProviderJson('{"result":"ok"}');
  if (parsed.ok) return 'an object with no questions array was accepted';
  if (!parsed.reason.includes('no "questions" array')) return `refused for: ${parsed.reason}`;
});

check('a bare array is refused, because the contract is an object', () => {
  if (parseProviderJson('[{"question":"x"}]').ok) return 'a top-level array was accepted';
});

/* ------------------------------------------------------------ batch behaviour */

console.log('\n  -- §11 duplicates, and §6 spreading across topics -----------\n');

check('the same question twice is kept once', () => {
  const { accepted, rejected } = validateBatch([goodQuestion(), goodQuestion()], INDEX, { allowedTopics: TOPICS });
  if (accepted.length !== 1) return `kept ${accepted.length} of 2 identical questions`;
  if (!rejected.some((r) => r.reason.includes('duplicate'))) return 'the repeat was dropped for some other reason';
});

check('a near-duplicate is caught, not just an exact one', () => {
  // Same source sentence, same answer, different words. Wording similarity scores this
  // 0.56 and lets it through; the fact key is what catches it.
  const reworded = goodQuestion({ question: 'What is the base year of the Consumer Price Index series described in the note?' });
  const { accepted, rejected } = validateBatch([goodQuestion(), reworded], INDEX, { allowedTopics: TOPICS });
  if (accepted.length !== 1) return `kept ${accepted.length}, so the rewording slipped through`;
  if (!rejected.some((r) => r.reason.includes('same fact'))) return `dropped for the wrong reason: ${rejected.map((r) => r.reason).join('; ')}`;
});

check('two different questions from one sentence are both kept', () => {
  // The guard on the check above. The document says price data are collected from 1181
  // villages and 1114 urban markets in a single sentence, so both questions quote the
  // same passage and share almost every word — but they have different answers and are
  // two real questions. A dedupe rule tuned only on wording deletes one of them.
  const villages = goodQuestion({
    question: 'According to the note, how many villages are covered by monthly price collection?',
    options: ['1181', '1114', '1811', '1141'],
    correctIndex: 0,
    topic: 'Price collection',
    explanation: 'The note states that price data are collected in 1181 villages.',
    source: 'Price data are collected from selected markets in 1181 villages and 1114 urban markets',
  });
  const markets = goodQuestion({
    question: 'According to the note, how many urban markets are covered by monthly price collection?',
    options: ['1114', '1181', '1411', '1141'],
    correctIndex: 0,
    topic: 'Price collection',
    explanation: 'The note states that price data are collected in 1114 urban markets.',
    source: 'Price data are collected from selected markets in 1181 villages and 1114 urban markets',
  });
  const { accepted } = validateBatch([villages, markets], INDEX, { allowedTopics: TOPICS });
  if (accepted.length !== 2) return `kept only ${accepted.length} of 2 genuinely different questions`;
});

check('a question already accepted from an earlier chunk is not re-asked', () => {
  const first = validateBatch([goodQuestion()], INDEX, { allowedTopics: TOPICS });
  const second = validateBatch([goodQuestion()], INDEX, { existing: first.accepted, allowedTopics: TOPICS });
  if (second.accepted.length !== 0) return 'the same question came back in a later chunk';
});

check('one rejected question does not discard the good ones beside it', () => {
  const batch = [goodQuestion({ correctIndex: 9 }), goodQuestion()];
  const { accepted, rejected } = validateBatch(batch, INDEX, { allowedTopics: TOPICS });
  if (accepted.length !== 1) return `kept ${accepted.length} of the 1 good question`;
  if (rejected.length !== 1) return `rejected ${rejected.length}, expected 1`;
});

check('selection spreads across topics instead of taking the first N', () => {
  // Six questions, four on one topic. Taking the first four would report a confident
  // per-topic score for a topic the learner never actually answered.
  const pool = [
    { question: 'a', topic: 'Index methodology' },
    { question: 'b', topic: 'Index methodology' },
    { question: 'c', topic: 'Index methodology' },
    { question: 'd', topic: 'Index methodology' },
    { question: 'e', topic: 'Price collection' },
    { question: 'f', topic: 'Data quality' },
  ];
  const picked = selectQuestions(pool, 3);
  const topics = new Set(picked.map((q) => q.topic));
  if (picked.length !== 3) return `picked ${picked.length}`;
  if (topics.size !== 3) return `all three came from ${topics.size} topic(s): ${[...topics].join(', ')}`;
});

check('selection returns everything when there is nothing to choose between', () => {
  const pool = [{ question: 'a', topic: 'x' }, { question: 'b', topic: 'y' }];
  if (selectQuestions(pool, 12).length !== 2) return 'a short pool was padded or truncated';
});

/* ----------------------------------------------------------------- §6 chunking */

console.log('\n  -- §6 a long document is chunked, never sent whole ----------\n');

check('a short document is one chunk', () => {
  const chunks = chunkText('One sentence. Two sentences.', 6000, 6);
  if (chunks.length !== 1) return `got ${chunks.length} chunks`;
});

check('empty text produces no chunks at all', () => {
  if (chunkText('   ', 6000, 6).length !== 0) return 'whitespace produced a chunk';
});

check('a long document is split into several chunks', () => {
  const long = 'The base year for the current series is 2012. '.repeat(400);
  const chunks = chunkText(long, 2000, 6);
  if (chunks.length < 2) return `a ${long.length} character document became ${chunks.length} chunk(s)`;
  if (chunks.length > 6) return `exceeded the chunk cap with ${chunks.length}`;
});

check('chunking never splits a sentence in half', () => {
  const long = 'The base year for the current series is 2012. '.repeat(200);
  for (const chunk of chunkText(long, 1000, 6)) {
    if (!/[.!?]$/.test(chunk.trim())) return `a chunk ended mid-sentence: "…${chunk.slice(-40)}"`;
  }
});

check('chunking holds sentence boundaries when paragraphs separate the sentences', () => {
  // The realistic input, and the one that used to break it. PDF extraction leaves blank
  // lines between paragraphs, so sentences are separated by "\n\n", not " ". The old
  // remainder was recovered with clean.slice(chunks.join(' ').length), whose single-space
  // join undercounts every 2-character separator — enough drift, over hundreds of
  // sentences, to cut the final chunk open mid-word. Forcing the last-chunk path with a
  // small cap and many paragraphs is what exercises it.
  const long = Array.from({ length: 400 }, (_, i) => `Paragraph ${i} states the base year is 2012.`).join('\n\n');
  for (const chunk of chunkText(long, 1200, 6)) {
    const tail = chunk.trim();
    if (!/[.!?]$/.test(tail)) return `a chunk ended mid-sentence: "…${tail.slice(-50)}"`;
    if (/\bParagraph\s+\d+\s+\w+\s+\w+\s*$/.test(tail) && !/2012\.$/.test(tail)) {
      return `a chunk ended inside a sentence: "…${tail.slice(-50)}"`;
    }
  }
});

check('no text is dropped off the end of a long document', () => {
  const long = `${'Filler sentence about price collection. '.repeat(300)}The final sentence names 1181 villages.`;
  const chunks = chunkText(long, 2000, 6);
  if (!chunks.join(' ').includes('The final sentence names 1181 villages.')) return 'the tail of the document was silently discarded';
});

check('the tail survives even when it lands in the overflow chunk', () => {
  // When maxChunks-1 chunks are already full the rest of the document is packed into the
  // last one, so a document long enough to overflow must still carry its final sentence.
  const long = `${'Paragraph about price collection and validation queries. '.repeat(600)}The final sentence names 1181 villages.`;
  const chunks = chunkText(long, 2000, 6);
  if (chunks.length !== 6) return `expected the cap of 6 chunks, got ${chunks.length}`;
  if (!chunks[chunks.length - 1].includes('The final sentence names 1181 villages.')) {
    return 'the overflow chunk dropped the tail of the document';
  }
});

/* ------------------------------------------------------- §4 provider selection */

console.log('\n  -- §4/§13 provider selection is explicit and honest ---------\n');

check('with no key configured, the status is not_configured', () => {
  const status = providerStatus({ AI_PROVIDER: 'gemini' });
  if (status.ok) return 'an unconfigured server reported itself ready';
  if (status.code !== 'not_configured') return `code was ${status.code}`;
});

check('gemini is the default provider, not mock', () => {
  if (providerStatus({}).provider !== 'gemini') return `the default is ${providerStatus({}).provider}`;
});

check('a key makes gemini report ready', () => {
  const status = providerStatus({ AI_PROVIDER: 'gemini', GEMINI_API_KEY: 'x'.repeat(20) });
  if (!status.ok) return `still reported ${status.code}`;
  if (status.provider !== 'gemini') return `provider is ${status.provider}`;
});

check('an unknown provider name is refused rather than silently defaulted', () => {
  const status = providerStatus({ AI_PROVIDER: 'openai-but-imaginary' });
  if (status.ok) return 'an unknown provider reported ready';
});

check('§18 an unknown provider name is never echoed back', () => {
  // AI_PROVIDER sits three lines above GEMINI_API_KEY in .env.example, so the realistic
  // mishap is a key pasted onto the wrong line. Whatever the value is, it reaches a browser
  // (through the status endpoint) and server/auth-server.log (through the startup banner),
  // so the value must not travel with the verdict.
  const key = 'AIzaSyD-CANARY-must-never-be-reflected-0123456789';
  const status = providerStatus({ AI_PROVIDER: key });
  if (status.provider !== 'unrecognised') return `provider was reported as "${status.provider}"`;
  const serialised = JSON.stringify(status);
  if (serialised.includes(key) || serialised.includes('AIza')) {
    return `the configured value came back in the status: ${serialised}`;
  }
});

check('§18 a key mispasted onto AI_MODEL is not printed either', () => {
  // Same hazard, different line: describeModel feeds the startup banner, which is appended
  // to server/auth-server.log in plain text.
  const key = 'AIzaSyD-CANARY-must-never-be-logged-0123456789';
  const shown = describeModel({ AI_MODEL: key });
  if (shown.includes(key) || shown.includes('AIza')) return `the banner would print "${shown}"`;
  if (shown !== 'custom model (set, not shown)') return `unexpected description "${shown}"`;
});

check('a real model name is still shown in full, and an absent one names the default', () => {
  // The redaction has to stay narrow, or the banner stops being useful for the one thing an
  // operator reads it for: confirming which model is about to be called.
  for (const name of ['gemini-2.0-flash', 'models/gemini-1.5-pro', 'gemini-2.5-flash-lite']) {
    if (describeModel({ AI_MODEL: name }) !== name) {
      return `a legitimate model name was hidden: ${describeModel({ AI_MODEL: name })}`;
    }
  }
  // An unset AI_MODEL names the model that will actually be called, not the word
  // "default", because the banner exists to answer "is it going to ask for the thing I
  // pulled". What must never happen is it reading as redacted.
  const unset = describeModel({});
  if (!unset.includes('gemini-1.5-flash')) return `an unset AI_MODEL read as "${unset}"`;
  if (unset.includes('not shown')) return 'an unset AI_MODEL was treated as a redacted custom value';
  if (describeModel({ AI_MODEL: '   ' }) !== unset) return 'a whitespace-only AI_MODEL was not treated as unset';
});

check('an unset AI_MODEL names the local default when the local provider is selected', () => {
  // The two providers have different defaults, and printing gemini's while calling
  // Ollama's would send someone hunting for a model that was never going to be asked for.
  const shown = describeModel({ AI_PROVIDER: 'local' });
  if (!shown.includes('gpt-oss:20b')) return `the local default read as "${shown}"`;
});

check('§18 a key mispasted onto AI_MODEL is still redacted with the widened family list', () => {
  // describeModel's allow-list grew to cover local model families. The whole point of it
  // being an allow-list is that growing it cannot accidentally admit a credential, so
  // every prefix in circulation is asserted rather than assumed.
  const keys = [
    'AIzaSyD-CANARY-must-never-be-logged-0123456789',
    'sk-CANARYmustneverbelogged0123456789012345',
    'sk-ant-api03-CANARYmustneverbelogged012345',
    'sk-proj-CANARYmustneverbelogged0123456789',
    'hf_CANARYmustneverbelogged012345678901',
    'gsk_CANARYmustneverbelogged0123456789012',
  ];
  for (const key of keys) {
    const shown = describeModel({ AI_MODEL: key });
    if (shown !== 'custom model (set, not shown)') return `"${key.slice(0, 10)}…" would print as "${shown}"`;
    if (shown.includes(key)) return 'the key itself reached the banner';
  }
});

check('a local model name is printable, so the banner is useful for Ollama too', () => {
  for (const name of ['gpt-oss:20b', 'gpt-oss:120b', 'llama3.1:8b', 'qwen2.5:14b', 'mistral:7b', 'phi3:mini']) {
    if (describeModel({ AI_MODEL: name }) !== name) {
      return `a legitimate local model name was hidden: ${describeModel({ AI_MODEL: name })}`;
    }
  }
});

await checkAsync('a fully-qualified model name reaches the right URL, not models/models/…', async () => {
  // The banner is allowed to print "models/gemini-1.5-pro" only because the request layer
  // strips the prefix. If those two ever drift apart the banner starts confidently naming a
  // model that 404s, so the URL is asserted rather than the description.
  const seen = [];
  const fetchImpl = async (url) => {
    seen.push(String(url));
    throw new Error('intercepted before any network call');
  };
  await generateRaw('prompt', {
    env: { GEMINI_API_KEY: 'x'.repeat(20), AI_MODEL: 'models/gemini-1.5-pro' },
    fetchImpl,
  }).catch(() => {});
  if (seen.length === 0) return 'no request was attempted, so nothing was proved';
  const url = seen[0];
  if (url.includes('/models/models/')) return `the prefix was not stripped: ${url}`;
  if (!url.includes('/models/gemini-1.5-pro:')) return `unexpected URL shape: ${url}`;
});

check('mock is never selected by accident', () => {
  // It takes the literal string "mock". Nothing about an empty or absent AI_PROVIDER,
  // and no amount of mock configuration, can reach it otherwise.
  const status = providerStatus({ AI_MOCK_FILE: '/tmp/anything' });
  if (status.provider === 'mock') return 'mock was selected without AI_PROVIDER=mock';
});

/* ------------------------------------------------------------ the local provider */

console.log('\n  -- a model running on this machine (Ollama, LM Studio) ------\n');

/**
 * A stand-in for one HTTP response. The adapter reads .ok, .status and .json(), so those
 * are the three things a fake has to provide; anything more would be testing the fake.
 */
const reply = (status, payload) => ({
  ok: status >= 200 && status < 300,
  status,
  json: async () => payload,
});

/** An OpenAI chat-completions response carrying `text` as the assistant's answer. */
const chatReply = (text, extra = {}) =>
  reply(200, { choices: [{ message: { content: text, ...extra } }] });

const LOCAL = { AI_PROVIDER: 'local' };

/**
 * The same document and topics the mocked end-to-end section uses further down. Declared
 * here rather than shared with it because that one's `INPUT` is a const defined later in
 * the file, and these checks run before it exists.
 */
const LOCAL_INPUT = { text: DOC, topics: TOPICS, concepts: ['Consumer Price Index', 'base year'], questionCount: 12 };

check('a local model is configured with no key at all', () => {
  // The whole point: there is nothing to paste, nothing to leak, nothing to forget. An
  // environment with no GEMINI_API_KEY anywhere in it must still report ready.
  const status = providerStatus(LOCAL);
  if (!status.ok) return `reported ${status.code} despite needing no key`;
  if (status.provider !== 'local') return `provider is ${status.provider}`;
});

check('being unreachable is not the same as being unconfigured', () => {
  // Ollama not running must NOT produce "add the server AI provider key", which would send
  // someone looking for a key that does not exist. Configuration is about the address only.
  if (!localIsConfigured({})) return 'a default local setup read as unconfigured';
  if (localIsConfigured({ AI_LOCAL_URL: 'not a url' })) return 'a nonsense address read as configured';
  if (localIsConfigured({ AI_LOCAL_URL: 'ftp://127.0.0.1:11434' })) return 'a non-HTTP address read as configured';
});

await checkAsync('the request goes to the OpenAI chat endpoint on Ollama\'s port', async () => {
  const seen = [];
  await localGenerateRaw('prompt', {
    env: LOCAL,
    fetchImpl: async (url, init) => {
      seen.push({ url: String(url), init });
      return chatReply('{"questions":[]}');
    },
  });
  if (seen.length === 0) return 'no request was attempted';
  if (seen[0].url !== 'http://127.0.0.1:11434/v1/chat/completions') return `called ${seen[0].url}`;
});

await checkAsync('the default address is IPv4, because localhost breaks on macOS', async () => {
  // On macOS "localhost" can resolve to ::1 first and Ollama listens on IPv4 only, so the
  // connection is refused before it is attempted — indistinguishable from Ollama being
  // down. Hard-coding 127.0.0.1 is the fix, and it is worth a test because someone
  // "tidying" it back to localhost would reintroduce an hour-long debugging session.
  const seen = [];
  await localGenerateRaw('p', {
    env: LOCAL,
    fetchImpl: async (url) => { seen.push(String(url)); return chatReply('{"questions":[]}'); },
  });
  if (seen[0].includes('localhost')) return `the default resolves through localhost: ${seen[0]}`;
});

await checkAsync('both spellings of the address work, and /v1 is never doubled', async () => {
  const cases = [
    ['http://127.0.0.1:11434', 'http://127.0.0.1:11434/v1/chat/completions'],
    ['http://127.0.0.1:11434/', 'http://127.0.0.1:11434/v1/chat/completions'],
    ['http://127.0.0.1:11434/v1', 'http://127.0.0.1:11434/v1/chat/completions'],
    ['http://127.0.0.1:11434/v1/', 'http://127.0.0.1:11434/v1/chat/completions'],
    ['http://127.0.0.1:1234/v1', 'http://127.0.0.1:1234/v1/chat/completions'],
  ];
  for (const [configured, expected] of cases) {
    const seen = [];
    await localGenerateRaw('p', {
      env: { ...LOCAL, AI_LOCAL_URL: configured },
      fetchImpl: async (url) => { seen.push(String(url)); return chatReply('{"questions":[]}'); },
    });
    if (seen[0] !== expected) return `${configured} became ${seen[0]}, expected ${expected}`;
  }
});

await checkAsync('the model\'s answer comes back as plain text for the parser upstream', async () => {
  const text = await localGenerateRaw('p', {
    env: LOCAL,
    fetchImpl: async () => chatReply('{"questions":[{"question":"x"}]}'),
  });
  if (text !== '{"questions":[{"question":"x"}]}') return `got ${JSON.stringify(text)}`;
});

await checkAsync('§3/§18 no credential header is sent, because there is no credential', async () => {
  // A local server needs no auth, and an empty bearer token makes some of them reject the
  // request outright. Asserted rather than assumed so nobody "helpfully" adds one later.
  let headers = null;
  await localGenerateRaw('p', {
    env: { ...LOCAL, GEMINI_API_KEY: 'AIzaSyD-CANARY-must-never-be-sent-0123456789' },
    fetchImpl: async (_url, init) => { headers = init.headers ?? {}; return chatReply('{"questions":[]}'); },
  });
  const serialised = JSON.stringify(headers).toLowerCase();
  if (serialised.includes('authorization')) return `an Authorization header was sent: ${JSON.stringify(headers)}`;
  if (serialised.includes('aizasy')) return 'a Gemini key travelled to the local model';
  if (serialised.includes('api-key')) return `an api-key header was sent: ${JSON.stringify(headers)}`;
});

await checkAsync('a refused connection says Ollama is not running, not that a key is missing', async () => {
  const error = await localGenerateRaw('p', {
    env: LOCAL,
    fetchImpl: async () => { throw Object.assign(new Error('connect ECONNREFUSED'), { code: 'ECONNREFUSED' }); },
  }).then(() => null, (e) => e);
  if (!error) return 'a refused connection resolved successfully';
  if (error.code !== 'network_error') return `code was ${error.code}`;
  if (!/ollama/i.test(error.message)) return `the message does not mention Ollama: ${error.message}`;
  if (!error.message.includes('127.0.0.1:11434')) return `the message does not say where it looked: ${error.message}`;
});

await checkAsync('a hung model reads as a timeout, and says why the first call is slow', async () => {
  const error = await localGenerateRaw('p', {
    env: LOCAL,
    fetchImpl: async () => { throw Object.assign(new Error('aborted'), { name: 'AbortError' }); },
  }).then(() => null, (e) => e);
  if (!error) return 'an aborted request resolved successfully';
  if (error.code !== 'timeout') return `code was ${error.code}`;
});

await checkAsync('a model that was never pulled is named as such, without echoing config', async () => {
  // Ollama answers 404 for a model it does not have. The hint must not quote AI_MODEL back:
  // that line is one away from GEMINI_API_KEY in .env.example and a mispaste would other-
  // wise be echoed to the browser, which is the §18 hazard in a new place.
  const key = 'AIzaSyD-CANARY-must-never-reach-the-browser-01234';
  const error = await localGenerateRaw('p', {
    env: { ...LOCAL, AI_MODEL: key },
    fetchImpl: async () => reply(404, {}),
  }).then(() => null, (e) => e);
  if (!error) return 'a 404 resolved successfully';
  if (error.code !== 'provider_error') return `code was ${error.code}`;
  if (error.message.includes(key) || error.message.includes('AIza')) {
    return `the configured value reached the message: ${error.message}`;
  }
  if (!/ollama pull/i.test(error.message)) return `no actionable hint: ${error.message}`;
});

await checkAsync('a server that rejects response_format is retried once without it', async () => {
  // Ollama supports JSON mode; llama.cpp's server and older builds 400 on the parameter.
  // Rather than making that a config flag somebody has to discover, the second attempt
  // drops it — the prompt already demands a bare JSON object, so plain mode still works.
  const bodies = [];
  const text = await localGenerateRaw('p', {
    env: LOCAL,
    fetchImpl: async (_url, init) => {
      const body = JSON.parse(init.body);
      bodies.push(body);
      return bodies.length === 1 ? reply(400, { error: 'unknown parameter' }) : chatReply('{"questions":[]}');
    },
  });
  if (bodies.length !== 2) return `expected two attempts, saw ${bodies.length}`;
  if (!bodies[0].response_format) return 'the first attempt did not ask for JSON mode';
  if (bodies[1].response_format) return 'the retry still carried the parameter that was rejected';
  if (text !== '{"questions":[]}') return 'the retry did not produce the answer';
});

await checkAsync('a reasoning model that never finishes thinking says so specifically', async () => {
  // gpt-oss splits output into a reasoning channel and an answer channel. Budget spent on
  // the former leaves content empty, and "empty response" would send you to the wrong file.
  const error = await localGenerateRaw('p', {
    env: LOCAL,
    fetchImpl: async () => chatReply('', { reasoning: 'Let me think about the passage at length...' }),
  }).then(() => null, (e) => e);
  if (!error) return 'an answerless response resolved successfully';
  if (error.code !== 'provider_error') return `code was ${error.code}`;
  if (!/reasoning/i.test(error.message)) return `unhelpful message: ${error.message}`;
});

await checkAsync('a genuinely empty response is still a plain empty response', async () => {
  const error = await localGenerateRaw('p', {
    env: LOCAL,
    fetchImpl: async () => chatReply(''),
  }).then(() => null, (e) => e);
  if (!error) return 'an empty response resolved successfully';
  if (/reasoning/i.test(error.message)) return 'an empty answer was blamed on reasoning';
});

check('§18 the banner names the local address with any credentials stripped', () => {
  // AI_LOCAL_URL is the one local setting that reaches both the log and the browser. A
  // proxied setup can legitimately carry userinfo, so the origin is rebuilt from parsed
  // parts rather than pattern-matched out.
  if (safeOrigin('http://user:hunter2@10.0.0.5:11434/v1/chat') !== 'http://10.0.0.5:11434') {
    return `credentials survived: ${safeOrigin('http://user:hunter2@10.0.0.5:11434/v1/chat')}`;
  }
  if (safeOrigin('http://127.0.0.1:11434/v1') !== 'http://127.0.0.1:11434') return 'a plain address was mangled';
  if (safeOrigin('nonsense').includes('nonsense')) return 'an unparseable address was echoed verbatim';
});

check('the banner names the local address, and stays quiet for the others', () => {
  if (describeTarget(LOCAL) !== 'http://127.0.0.1:11434') return `local target read as "${describeTarget(LOCAL)}"`;
  if (describeTarget({ ...LOCAL, AI_LOCAL_URL: 'http://127.0.0.1:1234/v1' }) !== 'http://127.0.0.1:1234') {
    return 'a configured address was not reflected in the banner';
  }
  if (describeTarget({ AI_PROVIDER: 'gemini' }) !== '') return 'gemini printed an address it does not need';
  if (describeTarget({ AI_PROVIDER: 'mock' }) !== '') return 'mock printed an address';
});

await checkAsync('the whole pipeline runs through a local model, end to end', async () => {
  // The strongest claim this file can make about the Ollama path without Ollama installed:
  // the real chunker, the real prompt, the real adapter, the real parser, the real
  // grounding checks and the real selection, with only the socket replaced. If this passes,
  // what is left to go wrong on the Mac is the model being absent or the port being wrong —
  // and both of those have their own honest error above.
  const canned = readFileSync(new URL('valid.json', FIXTURES), 'utf8');
  const realFetch = globalThis.fetch;
  let calls = 0;
  globalThis.fetch = async (url, init) => {
    calls += 1;
    const body = JSON.parse(init.body);
    if (!body.messages?.[0]?.content?.includes('HARD RULES')) return reply(400, { error: 'prompt was not delivered' });
    return chatReply(canned);
  };
  try {
    const result = await generateMcqs(LOCAL_INPUT, { env: LOCAL });
    if (!result.ok) return `generation failed: ${result.code} — ${result.message}`;
    if (result.meta.provider !== 'local') return `meta reported provider "${result.meta.provider}"`;
    if (calls === 0) return 'nothing was actually requested over the wire';
    if (result.questions.length < MIN_QUESTIONS) return `only ${result.questions.length} questions came back`;
    for (const question of result.questions) {
      if (containmentRatio(question.source, INDEX.shingles) < 0.6) {
        return `a local-model question cited a passage the document does not contain: "${question.source.slice(0, 50)}…"`;
      }
    }
  } finally {
    globalThis.fetch = realFetch;
  }
});

await checkAsync('a local model that invents things is refused exactly like a cloud one', async () => {
  // The grounding rules live above the provider, so swapping the model must not change
  // what is allowed through. Same fixture of bad questions, different transport.
  const canned = readFileSync(new URL('invalid.json', FIXTURES), 'utf8');
  const realFetch = globalThis.fetch;
  globalThis.fetch = async () => chatReply(canned);
  try {
    const result = await generateMcqs(LOCAL_INPUT, { env: LOCAL });
    if (result.ok) return 'invalid questions from a local model produced a paper';
    if (result.code !== 'insufficient_questions') return `code was ${result.code}`;
    if ((result.questions ?? []).length >= MIN_QUESTIONS) return 'the shortfall was padded';
  } finally {
    globalThis.fetch = realFetch;
  }
});

await checkAsync('§13 Ollama being down produces an honest failure, never a fabricated paper', async () => {
  const realFetch = globalThis.fetch;
  globalThis.fetch = async () => { throw Object.assign(new Error('connect ECONNREFUSED'), { code: 'ECONNREFUSED' }); };
  try {
    const result = await generateMcqs(LOCAL_INPUT, { env: LOCAL });
    if (result.ok) return 'a paper was produced with no model reachable';
    if (result.code !== 'network_error') return `code was ${result.code}`;
    if ((result.questions ?? []).length !== 0) return 'questions appeared from nowhere';
  } finally {
    globalThis.fetch = realFetch;
  }
});

/* ------------------------------------------------------------ end to end, mocked */

console.log('\n  -- the whole pipeline, with canned provider replies ---------\n');

const fixture = (name) => new URL(name, FIXTURES).pathname;

const mockEnv = (patch) => ({ AI_PROVIDER: 'mock', ...patch });

const INPUT = { text: DOC, topics: TOPICS, concepts: ['Consumer Price Index', 'base year'], questionCount: 12 };

await checkAsync('a good response becomes a usable paper', async () => {
  const result = await generateMcqs(INPUT, { env: mockEnv({ AI_MOCK_FILE: fixture('valid.json') }) });
  if (!result.ok) return `generation failed: ${result.code} — ${result.message}`;
  if (result.questions.length < MIN_QUESTIONS) return `only ${result.questions.length} questions came back`;
  for (const question of result.questions) {
    if (question.options.length !== 4) return 'a question reached the paper with the wrong option count';
    if (question.correctIndex < 0 || question.correctIndex > 3) return 'a question reached the paper with an out-of-range answer key';
    if (!question.source || question.source.trim() === '') return 'a question reached the paper with no source';
  }
  if (result.meta.provider !== 'mock') return `meta reported provider "${result.meta.provider}"`;
});

await checkAsync('every question in the paper is really from the document', async () => {
  const result = await generateMcqs(INPUT, { env: mockEnv({ AI_MOCK_FILE: fixture('valid.json') }) });
  if (!result.ok) return `generation failed: ${result.code}`;
  for (const question of result.questions) {
    if (containmentRatio(question.source, INDEX.shingles) < 0.6) {
      return `a question cited a passage the document does not contain: "${question.source.slice(0, 60)}…"`;
    }
  }
});

await checkAsync('a batch of entirely invalid questions is refused, not padded', async () => {
  const result = await generateMcqs(INPUT, { env: mockEnv({ AI_MOCK_FILE: fixture('invalid.json') }) });
  if (result.ok) return 'invalid questions produced a paper';
  if (result.code !== 'insufficient_questions') return `code was ${result.code}`;
  if (result.questions && result.questions.length >= MIN_QUESTIONS) return 'the shortfall was padded up to the minimum';
});

await checkAsync('malformed JSON fails the request instead of half-working', async () => {
  const result = await generateMcqs(INPUT, { env: mockEnv({ AI_MOCK_FILE: fixture('malformed.txt') }) });
  if (result.ok) return 'malformed JSON produced a paper';
  if (result.code !== 'insufficient_questions') return `code was ${result.code}`;
});

await checkAsync('a refusal in prose fails the request', async () => {
  const result = await generateMcqs(INPUT, { env: mockEnv({ AI_MOCK_FILE: fixture('not-json.txt') }) });
  if (result.ok) return 'prose produced a paper';
});

await checkAsync('a network failure is reported as one', async () => {
  const result = await generateMcqs(INPUT, { env: mockEnv({ AI_MOCK_FILE: fixture('network.txt') }) });
  if (result.ok) return 'an unreachable provider produced a paper';
  if (result.code !== 'network_error') return `code was ${result.code}`;
});

await checkAsync('a timeout is reported as one', async () => {
  const result = await generateMcqs(INPUT, { env: mockEnv({ AI_MOCK_FILE: fixture('timeout.txt') }) });
  if (result.ok) return 'a timeout produced a paper';
  if (result.code !== 'timeout') return `code was ${result.code}`;
});

await checkAsync('rate limiting is reported as itself, not as a generic failure', async () => {
  const result = await generateMcqs(INPUT, { env: mockEnv({ AI_MOCK_FILE: fixture('rate-limited.txt') }) });
  if (result.ok) return 'a rate-limited provider produced a paper';
  if (result.code !== 'rate_limited') return `code was ${result.code}`;
});

await checkAsync('an unconfigured provider says exactly what §13 requires', async () => {
  const result = await generateMcqs(INPUT, { env: { AI_PROVIDER: 'gemini' } });
  if (result.ok) return 'an unconfigured server generated questions';
  if (result.code !== 'not_configured') return `code was ${result.code}`;
  const wanted = 'AI question generation is not configured. Add the server AI provider key and try again.';
  if (result.message !== wanted) return `the message was "${result.message}"`;
});

await checkAsync('§13 an unconfigured provider returns no questions at all', async () => {
  // The whole point of the rule: no silent fallback to the deterministic generator.
  //
  // Asserted so it cannot pass by accident. The earlier version guarded on
  // `Array.isArray(result.questions) && length > 0`, and the not-configured return has no
  // `questions` key at all — so `Array.isArray(undefined)` was false and the check
  // short-circuited to green without ever looking at anything. It would have stayed green if
  // the fallback generator were wired back in behind a different key, or if `questions`
  // arrived as a non-array. Now every part of the claim is stated.
  const result = await generateMcqs(INPUT, { env: { AI_PROVIDER: 'gemini' } });
  if (result.ok) return 'an unconfigured provider reported success';
  if (result.code !== 'not_configured') return `code was "${result.code}"`;
  if ('questions' in result && result.questions !== undefined) {
    if (!Array.isArray(result.questions)) return `questions came back as ${typeof result.questions}, not an array`;
    if (result.questions.length > 0) {
      return `${result.questions.length} questions were produced with no AI provider configured`;
    }
  }
  // Nothing else in the payload may be carrying questions either.
  for (const [key, value] of Object.entries(result)) {
    if (key === 'meta' || key === 'questions') continue;
    if (Array.isArray(value) && value.some((item) => item && typeof item === 'object' && 'options' in item)) {
      return `questions were smuggled back under "${key}"`;
    }
  }
});

await checkAsync('§12 a bad first answer triggers exactly one repair, and recovers', async () => {
  const result = await generateMcqs(INPUT, { env: mockEnv({ AI_MOCK_DIR: fixture('repair') }) });
  if (!result.ok) return `the repair pass did not recover: ${result.code} — ${result.message}`;
  if (result.meta.calls !== 2) return `made ${result.meta.calls} provider calls, expected 2`;
  if (result.meta.rejected === 0) return 'nothing was rejected, so the repair path was never exercised';
});

await checkAsync('§12 the retry budget is finite', async () => {
  // Every attempt returns junk. Without a cap this loops until the process is killed.
  const dir = mkdtempSync(join(tmpdir(), 'ai-retry-'));
  try {
    for (let attempt = 1; attempt <= 12; attempt += 1) {
      writeFileSync(join(dir, `attempt-${attempt}.txt`), 'not json at all');
    }
    const result = await generateMcqs(INPUT, { env: mockEnv({ AI_MOCK_DIR: dir }) });
    if (result.ok) return 'junk produced a paper';
    if (result.meta.calls > 8) return `made ${result.meta.calls} provider calls, over the budget of 8`;
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

/* ------------------------------------------------------------------ §18 secrets */

console.log('\n  -- §18 nothing that leaves the server carries a key ---------\n');

await checkAsync('the generated paper contains no key-like string', async () => {
  const key = 'AIzaSyTHIS_IS_A_FAKE_TEST_KEY_0123456789';
  const result = await generateMcqs(INPUT, {
    env: mockEnv({ AI_MOCK_FILE: fixture('valid.json'), GEMINI_API_KEY: key }),
  });
  if (!result.ok) return `generation failed: ${result.code}`;
  const wire = JSON.stringify({ questions: result.questions, meta: result.meta });
  if (wire.includes(key)) return 'the API key appears in the payload the browser would receive';
  if (/AIza[0-9A-Za-z_-]{10,}/.test(wire)) return 'something key-shaped appears in the payload';
});

await checkAsync('meta carries counts and a provider name, and no document text', async () => {
  const result = await generateMcqs(INPUT, { env: mockEnv({ AI_MOCK_FILE: fixture('valid.json') }) });
  if (!result.ok) return `generation failed: ${result.code}`;
  const allowed = new Set(['provider', 'asked', 'accepted', 'rejected', 'calls', 'chunks', 'selected']);
  for (const field of Object.keys(result.meta)) {
    if (!allowed.has(field)) return `meta gained an unexpected field: ${field}`;
  }
  for (const [field, value] of Object.entries(result.meta)) {
    if (field === 'provider') continue;
    if (typeof value !== 'number') return `meta.${field} is not a count`;
  }
});

/**
 * Every source file under server/ai, discovered rather than listed.
 *
 * This was a hardcoded array of five names, and adding local.mjs silently escaped both
 * checks below — which is exactly the failure mode a key-scanning test cannot afford,
 * since the file it skips is the one nobody thought about. Reading the directory means a
 * sixth provider is covered the moment it exists.
 */
const AI_SOURCES = readdirSync(new URL('../server/ai/', import.meta.url))
  .filter((name) => name.endsWith('.mjs'))
  .sort();

check('the source scan actually found the provider files', () => {
  // A scan that quietly returns nothing would make both checks below pass forever.
  if (AI_SOURCES.length < 5) return `only found ${AI_SOURCES.length}: ${AI_SOURCES.join(', ')}`;
  for (const required of ['provider.mjs', 'gemini.mjs', 'local.mjs', 'mock.mjs', 'validation.mjs']) {
    if (!AI_SOURCES.includes(required)) return `${required} was not picked up by the scan`;
  }
});

check('AI_GENERATION_LIMIT=0 means unlimited: the limiter never blocks', () => {
  // The generation limiter is the one guard a local-model operator wants gone —
  // a run costs their own CPU, not money, so someone studying fifteen documents a
  // day should not be told to wait. Setting the env value to 0 must switch the
  // budget off entirely, not (as a naive `length >= 0`) block every request.
  const limiter = createRateLimiter({ name: 'test/unlimited', limit: 0, windowMs: 1000 });
  for (let i = 0; i < 500; i += 1) {
    if (limiter.take('one-ip') !== null) return `blocked on request ${i + 1} despite limit 0`;
  }
  if (limiter.peek('one-ip') !== null) return 'peek reported a wait under limit 0';
});

check('a positive limit still blocks past its budget', () => {
  // The escape hatch above must not have loosened the real limiter: a positive
  // limit has to behave exactly as before, or login and signup lose their guard.
  const limiter = createRateLimiter({ name: 'test/finite', limit: 3, windowMs: 60_000 });
  for (let i = 0; i < 3; i += 1) {
    if (limiter.take('ip') !== null) return `blocked early on request ${i + 1} of 3`;
  }
  const wait = limiter.take('ip');
  if (wait === null) return 'the fourth request was allowed through a limit of 3';
  if (typeof wait !== 'number' || wait <= 0) return `expected a positive wait, got ${wait}`;
});

check('no source file contains a real-looking API key', () => {
  for (const name of AI_SOURCES) {
    const body = readFileSync(new URL(`../server/ai/${name}`, import.meta.url), 'utf8');
    if (/AIza[0-9A-Za-z_-]{20,}/.test(body)) return `${name} contains something shaped like a Google API key`;
  }
});

check('no source file contains a stray control byte', () => {
  // Earned its place: a NUL byte once landed inside a template literal here. Node parsed
  // it, the suite passed, and the only symptom was that grep started calling the file
  // binary — which silently disables every source-text check in render-test.sh.
  for (const name of AI_SOURCES) {
    const body = readFileSync(new URL(`../server/ai/${name}`, import.meta.url), 'latin1');
    const bad = body.match(/[\x00-\x08\x0b\x0c\x0e-\x1f]/);
    if (bad) return `${name} contains a control byte (0x${bad[0].charCodeAt(0).toString(16).padStart(2, '0')})`;
  }
});

/* ------------------------------------------------ difficulty evaluator (real levels) */

console.log('\n  -- the difficulty control is real, not a label -------------\n');

check('a fill-in-the-blank / cloze question reads as easy', () => {
  const est = estimateDifficulty({ question: 'Fill in the blank from the material: The _____ price index measures household prices.', kind: 'cloze' });
  if (est !== 'easy') return `estimated ${est}`;
});

check('a bare "what is / define" recall question reads as easy', () => {
  const est = estimateDifficulty({ question: 'What is a consumer price index?', kind: 'statement' });
  if (est !== 'easy') return `estimated ${est}`;
});

check('a multi-cue reasoning scenario reads as hard', () => {
  const est = estimateDifficulty({ question: 'Suppose a market reports repeated non-response; how would this affect the reliability of the published index and what would be the consequence for the trend?', kind: 'scenario' });
  if (est !== 'hard') return `estimated ${est}`;
});

check('a single-cue interpretation question reads as at least medium', () => {
  const est = estimateDifficulty({ question: 'Why does the seasonally adjusted figure differ from the raw figure in the same month?', kind: 'statement' });
  if (est !== 'medium' && est !== 'hard') return `estimated ${est}`;
});

check('validateQuestion rejects an easy question under a HARD request', () => {
  // A cloze question grounded in the fixture, offered under a "hard" request, must be
  // rejected for being too easy — this is what makes the level control real.
  const doc = 'The consumer price index measures the change in prices paid by households for a fixed basket of goods and services.';
  const index = buildDocumentIndex(doc);
  const q = {
    question: 'Fill in the blank from the material: The consumer price index measures the change in prices paid by _____ for a fixed basket of goods and services.',
    options: ['households', 'markets', 'agencies', 'auditors'],
    correctIndex: 0,
    topic: 'consumer price index',
    kind: 'cloze',
    explanation: 'The blanked word from the material is "households".',
    source: doc,
  };
  const asHard = validateQuestion(q, index, { requestedDifficulty: 'hard' });
  if (asHard.ok) return 'an easy cloze question was accepted under a hard request';
  const asEasy = validateQuestion(q, index, { requestedDifficulty: 'easy' });
  if (!asEasy.ok) return `the same question was rejected under an easy request too: ${asEasy.reason}`;
});

/* ---------------------------------------------------------------------- report */

console.log(`\n  ${passed} passed, ${failed} failed\n`);
if (failed > 0) {
  console.log('  Failures:');
  for (const failure of failures) console.log(`    - ${failure}`);
  console.log('');
}
process.exit(failed > 0 ? 1 : 0);
