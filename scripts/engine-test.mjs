/**
 * Tests the question engine, the scorer and the recommender by running them.
 *
 * Usage:  node scripts/engine-test.mjs <compiled-out-dir>
 *         (or, more usefully:  npm run engine:test)
 *
 * These are assertions about behaviour, not about source text. Every check below
 * imports the real compiled module, feeds it a document, and inspects what comes
 * back. Several exist because the first working version of the generator failed
 * them: it made "and the" a topic, it printed five cloze questions in a row, it
 * offered "the base year is 3622" as a distractor, and it gave the cloze answer
 * away by capitalising it differently from the other three options.
 */

const OUT = process.argv[2];
if (!OUT) {
  console.error('usage: node scripts/engine-test.mjs <compiled-out-dir>');
  process.exit(2);
}

// pdfjs-dist prints a legacy-build warning on import in Node. It is irrelevant
// here and would drown the report, so it is silenced for the import only.
const realWarn = console.warn;
console.warn = () => {};
const materials = await import(`${OUT}/lib/materials.js`);
const scoring = await import(`${OUT}/lib/scoring.js`);
const recommendations = await import(`${OUT}/lib/recommendations.js`);
const courseLib = await import(`${OUT}/lib/courses.js`);
const taxonomy = await import(`${OUT}/lib/topics.js`);
const assessment = await import(`${OUT}/lib/assessment.js`);
console.warn = realWarn;

/**
 * The assessment item bank now lives on the server, so the checks on it import the
 * server module rather than the compiled `src/`. It is plain ESM over Node built-ins,
 * which is what makes that possible from here: `src/lib/assessment.ts` holds the two
 * index spaces and no questions, and both halves are exercised below together.
 */
const exam = await import(new URL('../server/assessment.mjs', import.meta.url).href);

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

function section(title) {
  console.log(`\n  -- ${title} ${'-'.repeat(Math.max(0, 58 - title.length))}`);
}

/** A second document, deliberately about a different subject than the built-in sample. */
const surveyDoc = [
  'The quarterly labour force survey collects employment status from a rotating panel of households across all states.',
  'The survey response rate for the quarter was 84 percent, down from 89 percent in the previous round.',
  'A falling response rate raises the risk of nonresponse bias, because the households that drop out are not a random subset.',
  'Field staff record every refusal and every unreachable address, and the nonresponse bias is assessed against the sampling frame.',
  'The sampling frame is drawn from the most recent population census and is updated for new construction each year.',
  'Estimates are published with a margin of error, and the margin of error widens for smaller states.',
  'A state estimate with a margin of error above 5 percentage points is flagged in the release table rather than suppressed.',
  'The release note explains the margin of error in plain language, because a user who ignores it will overread small differences.',
  'Seasonal adjustment is applied to the national series only, since the state series are too short to estimate a stable seasonal pattern.',
  'Every published estimate carries the reference period, the coverage and the revision status in its metadata.',
  'The dissemination calendar is fixed twelve months ahead, and the release time is 17:30 on the announced date.',
  'A revision is published as a separate vintage, and the first estimate remains available for comparison.',
].join(' ');

const sample = materials.analyzeMaterial(materials.sampleMaterialText, 1);
const survey = materials.analyzeMaterial(surveyDoc, 3);
const documents = [
  ['sample methodology note', sample],
  ['labour force survey note', survey],
];

/** Words that must never begin or end a topic, nor be a topic on their own. */
const functionWords = new Set([
  'the', 'and', 'a', 'an', 'of', 'in', 'to', 'for', 'is', 'are', 'was', 'were',
  'with', 'that', 'this', 'its', 'it', 'any', 'all', 'from', 'on', 'by', 'as',
]);

section('generation: counts and shape');

for (const [label, doc] of documents) {
  check(`${label}: at least ${materials.MIN_QUESTIONS} questions`, () => {
    if (doc.questions.length < materials.MIN_QUESTIONS) {
      return `got ${doc.questions.length}`;
    }
  });

  check(`${label}: every question has four distinct, non-empty options`, () => {
    for (const [index, question] of doc.questions.entries()) {
      if (question.a.length !== 4) return `Q${index + 1} has ${question.a.length} options`;
      const trimmed = question.a.map((option) => option.trim());
      if (trimmed.some((option) => option.length === 0)) return `Q${index + 1} has a blank option`;
      const unique = new Set(trimmed.map((option) => option.toLowerCase()));
      if (unique.size !== 4) return `Q${index + 1} repeats an option`;
    }
  });

  check(`${label}: correct index is in range and question text is non-empty`, () => {
    for (const [index, question] of doc.questions.entries()) {
      if (!Number.isInteger(question.correct) || question.correct < 0 || question.correct > 3) {
        return `Q${index + 1} correct=${question.correct}`;
      }
      if (!question.q || question.q.trim().length < 12) return `Q${index + 1} has no question text`;
      if (!question.source || question.source.trim().length === 0) return `Q${index + 1} has no source`;
      if (!question.explanation || !question.explanation.includes(question.source.slice(0, 30))) {
        return `Q${index + 1} explanation does not quote its own source`;
      }
    }
  });

  check(`${label}: the answer is not parked at a fixed position`, () => {
    const positions = new Set(doc.questions.map((question) => question.correct));
    if (positions.size < 3) return `only ${positions.size} distinct positions used`;
    const cyclic = doc.questions.every((question, index) => question.correct === index % 4);
    if (cyclic) return 'correct answer follows index % 4';
  });
}

section('generation: topics are real topics');

for (const [label, doc] of documents) {
  check(`${label}: at most ${materials.MAX_TOPICS} topics, none of them function words`, () => {
    if (doc.topics.length === 0) return 'no topics extracted';
    if (doc.topics.length > materials.MAX_TOPICS) return `got ${doc.topics.length}`;
    for (const topic of doc.topics) {
      const parts = topic.toLowerCase().split(/\s+/);
      if (parts.every((word) => functionWords.has(word))) return `"${topic}" is only function words`;
      if (functionWords.has(parts[0])) return `"${topic}" starts with a function word`;
      if (functionWords.has(parts[parts.length - 1])) return `"${topic}" ends with a function word`;
      if (topic.trim().length < 4) return `"${topic}" is too short to be a topic`;
    }
  });

  check(`${label}: no topic is a bare unit of measure`, () => {
    const units = ['percent', 'percentage', 'point', 'points', 'unit', 'units', 'number', 'numbers'];
    for (const topic of doc.topics) {
      if (units.includes(topic.toLowerCase())) return `"${topic}" is a unit, not a topic`;
    }
  });

  check(`${label}: every topic carries at least ${taxonomy.MIN_QUESTIONS_FOR_BAND} questions`, () => {
    const counts = new Map();
    for (const question of doc.questions) {
      counts.set(question.topic, (counts.get(question.topic) ?? 0) + 1);
    }
    for (const [topic, count] of counts) {
      if (count < taxonomy.MIN_QUESTIONS_FOR_BAND) return `"${topic}" has only ${count}`;
    }
  });

  check(`${label}: no topic duplicates a phrase it sits inside`, () => {
    for (const outer of doc.topics) {
      for (const inner of doc.topics) {
        if (outer === inner) continue;
        if (` ${outer.toLowerCase()} `.includes(` ${inner.toLowerCase()} `)) {
          return `"${inner}" is already covered by "${outer}"`;
        }
      }
    }
  });
}

section('generation: question quality');

check('sample: all four question kinds are used', () => {
  const kinds = new Set(sample.questions.map((question) => question.kind));
  const wanted = ['statement', 'cloze', 'numeric', 'identify'];
  const missing = wanted.filter((kind) => !kinds.has(kind));
  if (missing.length > 0) return `missing ${missing.join(', ')}`;
});

check('kinds do not arrive in one long run', () => {
  // The first working version emitted cloze x5, statement x5, numeric x2.
  let longest = 1;
  let run = 1;
  for (let index = 1; index < sample.questions.length; index += 1) {
    run = sample.questions[index].kind === sample.questions[index - 1].kind ? run + 1 : 1;
    longest = Math.max(longest, run);
  }
  if (longest > 4) return `${longest} questions of the same kind in a row`;
});

for (const [label, doc] of documents) {
  check(`${label}: cloze options are cased alike`, () => {
    // A lowercase answer beside three title-cased distractors is findable without
    // reading the passage. All four must look the same.
    for (const question of doc.questions) {
      if (question.kind !== 'cloze') continue;
      const leading = question.a.map((option) => /^[A-Z]/.test(option));
      if (new Set(leading).size !== 1) return `"${question.a[question.correct]}" stands out by case`;
    }
    return true;
  });

  check(`${label}: cloze questions really contain a blank`, () => {
    for (const question of doc.questions) {
      if (question.kind !== 'cloze') continue;
      if (!question.q.includes('______')) return 'a cloze question has no blank';
      const answer = question.a[question.correct].toLowerCase();
      if (question.q.toLowerCase().includes(answer)) return `the stem contains its own answer "${answer}"`;
    }
    return true;
  });

  check(`${label}: statement answers are quoted from the document`, () => {
    const text = (label.includes('sample') ? materials.sampleMaterialText : surveyDoc).toLowerCase();
    for (const question of doc.questions) {
      if (question.kind !== 'statement' && question.kind !== 'identify') continue;
      const answer = question.a[question.correct].replace(/…$/, '').toLowerCase();
      if (!text.includes(answer.slice(0, 60))) return `"${answer.slice(0, 50)}…" is not in the document`;
    }
    return true;
  });

  check(`${label}: no wrong option is an unaltered document sentence`, () => {
    // Two true options means the question has no answer.
    const sentences = new Set(doc.sentences.map((sentence) => sentence.toLowerCase()));
    for (const [index, question] of doc.questions.entries()) {
      if (question.kind !== 'statement' && question.kind !== 'identify') continue;
      for (const [optionIndex, option] of question.a.entries()) {
        if (optionIndex === question.correct) continue;
        if (sentences.has(option.replace(/…$/, '').toLowerCase())) {
          return `Q${index + 1} option ${optionIndex} is a true sentence`;
        }
      }
    }
    return true;
  });

  check(`${label}: numeric distractors stay plausible`, () => {
    for (const question of doc.questions) {
      if (question.kind !== 'numeric') continue;
      const answer = Number(question.a[question.correct].replace(/,/g, ''));
      const isYear = Number.isInteger(answer) && answer >= 1900 && answer <= 2100;
      for (const option of question.a) {
        const value = Number(option.replace(/,/g, ''));
        if (!Number.isFinite(value)) return `option "${option}" is not a number`;
        // A year answered with 3622 is a free mark; so is 240 percent.
        if (isYear && (value < 1900 || value > 2100)) return `year option "${option}" is not a year`;
        if (!isYear && answer <= 100 && value > 100) return `option "${option}" exceeds 100 where the answer is ${answer}`;
      }
    }
    return true;
  });
}

section('generation: determinism and edge cases');

check('the same document always produces the same paper', () => {
  const again = materials.analyzeMaterial(materials.sampleMaterialText, 1);
  if (JSON.stringify(again.questions) !== JSON.stringify(sample.questions)) {
    return 'two runs over the same text disagree';
  }
});

check('a different document produces a different paper', () => {
  if (JSON.stringify(survey.questions) === JSON.stringify(sample.questions)) {
    return 'two different documents produced identical questions';
  }
});

check('an empty document produces no questions and does not throw', () => {
  const empty = materials.analyzeMaterial('', 0);
  if (empty.questions.length !== 0) return `got ${empty.questions.length} questions from nothing`;
  if (empty.topics.length !== 0) return 'topics were invented from an empty document';
});

check('a one-line document degrades instead of failing', () => {
  const thin = materials.analyzeMaterial('The consumer price index rose by 4.1 percent this quarter.', 1);
  if (!Array.isArray(thin.questions)) return 'questions is not an array';
  // Fewer than ten is the honest outcome here; the UI has to handle it, not pretend.
  if (thin.questions.length > materials.TARGET_QUESTIONS) return 'padded a one-line document';
});

check('supported extensions no longer advertise formats the reader cannot open', () => {
  const list = materials.supportedExtensions;
  if (!list.includes('pdf') || !list.includes('txt')) return `got ${list.join(', ')}`;
  if (list.includes('docx') || list.includes('pptx')) return 'still advertising docx/pptx';
});

section('scoring');

const allRight = sample.questions.map((question) => question.correct);
const allWrong = sample.questions.map((question) => (question.correct + 1) % 4);

check('a perfect paper scores 100 and needs no revision', () => {
  const result = scoring.gradeAttempt(sample.questions, allRight);
  if (result.percent !== 100) return `percent=${result.percent}`;
  if (result.band !== 'strong') return `band=${result.band}`;
  if (result.focus.length !== 0) return `${result.focus.length} topics flagged on a perfect paper`;
  if (result.skipped !== 0) return `skipped=${result.skipped}`;
});

check('an all-wrong paper scores 0 and flags every topic', () => {
  const result = scoring.gradeAttempt(sample.questions, allWrong);
  if (result.percent !== 0) return `percent=${result.percent}`;
  if (result.band !== 'needs-work') return `band=${result.band}`;
  if (result.focus.length !== result.topics.length) return 'not every topic was flagged';
  for (const topic of result.topics) {
    if (topic.band !== 'needs-work') return `"${topic.topic}" came out ${topic.band}`;
  }
});

check('skipped answers count as wrong but are reported separately', () => {
  const chosen = allRight.slice();
  chosen[0] = null;
  chosen[1] = null;
  const result = scoring.gradeAttempt(sample.questions, chosen);
  if (result.skipped !== 2) return `skipped=${result.skipped}`;
  if (result.answered !== sample.questions.length - 2) return `answered=${result.answered}`;
  if (result.correct !== sample.questions.length - 2) return `correct=${result.correct}`;
});

check('a half-finished paper still grades', () => {
  const result = scoring.gradeAttempt(sample.questions, allRight.slice(0, 4));
  if (result.total !== sample.questions.length) return `total=${result.total}`;
  if (result.correct !== 4) return `correct=${result.correct}`;
  if (result.skipped !== sample.questions.length - 4) return `skipped=${result.skipped}`;
});

check('one question is not enough to band a topic', () => {
  // Built by hand: two topics, one question each. Neither may be called weak.
  const questions = [
    { q: 'a', a: ['1', '2', '3', '4'], correct: 0, source: 'x', topic: 'Sampling Frame', kind: 'statement', explanation: 'x', sourceIndex: 0 },
    { q: 'b', a: ['1', '2', '3', '4'], correct: 0, source: 'y', topic: 'Response Rate', kind: 'statement', explanation: 'y', sourceIndex: 1 },
  ];
  const result = scoring.gradeAttempt(questions, [1, 0]);
  for (const topic of result.topics) {
    if (topic.band !== 'unrated') return `"${topic.topic}" was banded ${topic.band} on one question`;
  }
  if (result.focus.length !== 0) return 'an unrated topic was pushed into the revision plan';
});

check('bands land on the documented thresholds', () => {
  const at = (correct, total) => {
    const questions = Array.from({ length: total }, (_unused, index) => ({
      q: `q${index}`, a: ['1', '2', '3', '4'], correct: 0,
      source: 's', topic: 'One Topic', kind: 'statement', explanation: 's', sourceIndex: index,
    }));
    const chosen = questions.map((_question, index) => (index < correct ? 0 : 1));
    return scoring.gradeAttempt(questions, chosen).topics[0].band;
  };
  if (at(8, 10) !== 'strong') return `80% came out ${at(8, 10)}`;
  if (at(7, 10) !== 'average') return `70% came out ${at(7, 10)}`;
  if (at(5, 10) !== 'average') return `50% came out ${at(5, 10)}`;
  if (at(4, 10) !== 'needs-work') return `40% came out ${at(4, 10)}`;
});

check('the roll-up reports only competencies the paper tested', () => {
  const result = scoring.gradeAttempt(sample.questions, allWrong);
  if (result.competencies.length === 0) return 'no competency was matched at all';
  if (result.competencies.length >= taxonomy.competencies.length) {
    return 'every competency was reported from one document';
  }
  for (const entry of result.competencies) {
    if (entry.total <= 0) return `"${entry.name}" was reported with no questions behind it`;
  }
});

check('the stored payload carries no document text', () => {
  // The PDF is read in the tab and must stay there. This is the assertion that
  // keeps that claim true as the payload changes.
  const result = scoring.gradeAttempt(sample.questions, allWrong);
  const payload = scoring.toAttemptPayload(result, {
    source: 'material',
    label: 'Sample_Price_Index_Methodology_Note.txt',
    durationSeconds: 412.6,
  });
  const json = JSON.stringify(payload).toLowerCase();
  for (const sentence of sample.sentences) {
    const fragment = sentence.toLowerCase().slice(0, 40);
    if (fragment.length > 20 && json.includes(fragment)) return `payload contains "${fragment}"`;
  }
  for (const question of sample.questions) {
    if (json.includes(question.q.toLowerCase().slice(0, 40))) return 'payload contains a question';
  }
  if (payload.durationSeconds !== 413) return `durationSeconds=${payload.durationSeconds}`;
  if (payload.topics.length !== result.topics.length) return 'payload lost a topic';
});

check('the summary sentence is plain and non-empty', () => {
  const result = scoring.gradeAttempt(sample.questions, allWrong);
  const text = scoring.describeAttempt(result);
  if (!text || text.length < 20) return `got "${text}"`;
  if (!text.includes(`of ${sample.questions.length}`)) return 'the summary does not state the score';
});

section('recommendations');

const weakResult = scoring.gradeAttempt(sample.questions, allWrong);
const weakPlan = recommendations.buildStudyPlan(sample.questions, weakResult);

check('a weak attempt is answered with passages from the learner own document', () => {
  if (weakPlan.passages.length === 0) return 'no revision passages were produced';
  const text = materials.sampleMaterialText;
  for (const passage of weakPlan.passages) {
    if (!text.includes(passage.text)) return `"${passage.text.slice(0, 40)}…" is not in the document`;
  }
});

check('revision passages read in document order', () => {
  for (let index = 1; index < weakPlan.passages.length; index += 1) {
    if (weakPlan.passages[index].sourceIndex < weakPlan.passages[index - 1].sourceIndex) {
      return 'passages are out of order';
    }
  }
});

check('the retry contains only questions that were actually missed', () => {
  if (weakPlan.retry.length === 0) return 'nothing to retry after an all-wrong paper';
  const missed = new Set(weakResult.topics.flatMap((topic) => topic.missed));
  for (const index of weakPlan.retry) {
    if (!missed.has(index)) return `question ${index + 1} was not missed`;
  }
  if (new Set(weakPlan.retry).size !== weakPlan.retry.length) return 'the retry repeats a question';
});

check('the retry paper keeps the original options and answer key', () => {
  const paper = recommendations.buildRetryPaper(sample.questions, weakPlan);
  if (paper.questions.length !== weakPlan.retry.length) return `got ${paper.questions.length}`;
  paper.questions.forEach((question, index) => {
    const original = sample.questions[paper.sourceIndexes[index]];
    if (question !== original) throw new Error(`retry question ${index + 1} is not the original object`);
  });
});

check('every recommended pathway is one the app actually has', () => {
  const real = new Set(courseLib.courseFacts.map((course) => course.id));
  for (const course of weakPlan.courses) {
    if (!real.has(course.id)) return `"${course.id}" is not in the catalogue`;
  }
  for (const topic of weakPlan.topics) {
    if (topic.competencyName === null && topic.courses.length > 0) {
      return `"${topic.score.topic}" has no competency but was given a course anyway`;
    }
  }
});

check('a perfect attempt is not given a revision plan', () => {
  const plan = recommendations.buildStudyPlan(sample.questions, scoring.gradeAttempt(sample.questions, allRight));
  if (plan.topics.length !== 0) return `${plan.topics.length} topics recommended after a perfect paper`;
  if (plan.retry.length !== 0) return 'a retry was offered with nothing to retry';
  if (!plan.headline.toLowerCase().includes('nothing')) return `headline reads "${plan.headline}"`;
});

check('the plan headline states real counts', () => {
  if (!weakPlan.headline.includes(String(weakPlan.retry.length))) {
    return `headline "${weakPlan.headline}" does not match ${weakPlan.retry.length} questions`;
  }
  if (weakPlan.topics.length > 0 && !/\d/.test(weakPlan.headline)) return 'headline has no numbers in it';
});

check('every weak topic gets either a pathway or a passage to read', () => {
  for (const topic of weakPlan.topics) {
    if (topic.courses.length === 0 && topic.passages.length === 0) {
      return `"${topic.score.topic}" was flagged with no advice at all`;
    }
    if (!['Good', 'Average', 'Needs work'].includes(topic.bandLabel)) {
      return `"${topic.score.topic}" has band label "${topic.bandLabel}"`;
    }
  }
});

check('the one-line summaries name the topic and the score', () => {
  const lines = recommendations.summarizePlan(weakPlan);
  if (lines.length !== weakPlan.topics.length) return `got ${lines.length} lines`;
  lines.forEach((line, index) => {
    const topic = weakPlan.topics[index];
    if (!line.includes(topic.score.topic)) throw new Error(`line ${index + 1} does not name its topic`);
    if (!line.includes(`of ${topic.score.total}`)) throw new Error(`line ${index + 1} does not give the score`);
  });
});

section('course catalogue');

check('the outlines add up to the durations the Learning page prints', () => {
  const stated = { 'time-series': 260, 'data-ethics': 130, 'r-programming': 400 };
  for (const [id, minutes] of Object.entries(stated)) {
    const actual = courseLib.courseMinutes(id);
    if (actual !== minutes) return `${id}: outline is ${actual}m, the page says ${minutes}m`;
  }
});

check('durations format the way the page writes them', () => {
  if (courseLib.formatMinutes(260) !== '4h 20m') return courseLib.formatMinutes(260);
  if (courseLib.formatMinutes(130) !== '2h 10m') return courseLib.formatMinutes(130);
  if (courseLib.formatMinutes(400) !== '6h 40m') return courseLib.formatMinutes(400);
  if (courseLib.formatMinutes(45) !== '45m') return courseLib.formatMinutes(45);
});

check('every pathway names a real competency and has an outline', () => {
  const ids = new Set(taxonomy.competencies.map((competency) => competency.id));
  for (const course of courseLib.courseFacts) {
    if (!ids.has(course.competency)) return `${course.id} claims "${course.competency}"`;
    for (const also of course.alsoBuilds) {
      if (!ids.has(also)) return `${course.id} also claims "${also}"`;
      if (also === course.competency) return `${course.id} lists its own competency twice`;
    }
    if (course.modules.length < 3) return `${course.id} has only ${course.modules.length} modules`;
    for (const module of course.modules) {
      if (!module.title || !module.summary) return `${course.id} has an unlabelled module`;
      if (!(module.minutes > 0)) return `${course.id} has a module with no duration`;
    }
  }
});

check('the catalogue says out loud that no lesson content ships', () => {
  const note = courseLib.catalogueNote.toLowerCase();
  if (!note.includes('sample') && !note.includes('demonstration')) return `note reads "${courseLib.catalogueNote}"`;
});

check('classifyTopic refuses to guess', () => {
  if (taxonomy.classifyTopic('Kabaddi Tournament', 'The final was held on Sunday.') !== null) {
    return 'an unrelated topic was filed under a competency';
  }
  if (taxonomy.classifyTopic('Response Rate', 'The survey response rate fell because of nonresponse.') !== 'data-quality') {
    return 'a clear data-quality topic was not recognised';
  }
});

section('the generated paper survives a reload');

/**
 * `material-session.ts` is a browser module, so Node needs a `window.sessionStorage`.
 * The shim is a real string store on purpose: the claim under test is that a paper the
 * Materials page wrote can be read back by the Quiz page after the tab reloads, and a
 * shim that handed objects back by reference would hide a broken JSON round trip.
 */
const cell = new Map();
globalThis.window = {
  sessionStorage: {
    getItem: (key) => (cell.has(key) ? cell.get(key) : null),
    setItem: (key, value) => { cell.set(key, String(value)); },
    removeItem: (key) => { cell.delete(key); },
  },
};

const STORE = `${OUT}/lib/material-session.js`;
const session = await import(STORE);

const paper = {
  fileName: 'Price_index_note.txt',
  fileSize: materials.sampleMaterialText.length,
  fileType: 'txt',
  pageCount: 1,
  concepts: sample.concepts,
  topics: sample.topics,
  questions: sample.questions,
  createdAt: new Date().toISOString(),
  isSample: false,
};

let announced = 0;
const unsubscribe = session.subscribe(() => { announced += 1; });
session.setMaterial(paper);

check('setMaterial notifies the pages watching the store', () =>
  announced === 1 ? true : `${announced} notifications for one write`,
);

check('a successful write is reported as durable', () =>
  session.isDurable() ? true : 'the write was recorded as having failed',
);

check('the paper is stored as JSON text, not held by reference', () => {
  const raw = cell.get('statskill.material.v1');
  if (typeof raw !== 'string') return `tab storage holds a ${typeof raw}`;
  if (JSON.parse(raw).questions.length !== sample.questions.length) return 'the stored copy lost questions';
});

// A fresh module instance has empty in-memory state, which is exactly what a page reload
// leaves behind: nothing but whatever sessionStorage kept.
const afterReload = await import(`${STORE}?reload=1`);

check('a reload restores the same paper from tab storage', () => {
  const restored = afterReload.getMaterial();
  if (!restored) return 'the paper was gone after a reload';
  if (restored.questions.length !== sample.questions.length) {
    return `${restored.questions.length} of ${sample.questions.length} questions survived`;
  }
  if (restored.questions[0].q !== sample.questions[0].q) return 'the first question changed';
  if (restored.questions[0].correct !== sample.questions[0].correct) return 'the answer key changed';
  if (restored.fileName !== paper.fileName) return `the file name came back as "${restored.fileName}"`;
});

const damaged = [
  ['no questions at all', { ...paper, questions: [] }],
  ['an answer key past the last option', { ...paper, questions: [{ ...sample.questions[0], correct: 9 }] }],
  ['a question with one option', { ...paper, questions: [{ ...sample.questions[0], a: ['only this'], correct: 0 }] }],
  ['a stem that is not text', { ...paper, questions: [{ ...sample.questions[0], q: 42 }] }],
];

let damageIndex = 0;
for (const [label, bad] of damaged) {
  damageIndex += 1;
  cell.set('statskill.material.v1', JSON.stringify(bad));
  const fresh = await import(`${STORE}?damaged=${damageIndex}`);
  const restored = fresh.getMaterial();
  const stillStored = cell.has('statskill.material.v1');
  check(`a stored paper with ${label} is refused`, () => {
    if (restored !== null) return 'it was accepted and would have been graded';
    if (stillStored) return 'it was refused but left in storage to fail on every later read';
  });
}

cell.set('statskill.material.v1', '{"questions":[{"q":"half a pap');
const afterTruncation = await import(`${STORE}?damaged=truncated`);

check('a paper truncated mid-write is dropped rather than parsed', () => {
  if (afterTruncation.getMaterial() !== null) return 'a half-written value was accepted';
  if (cell.has('statskill.material.v1')) return 'the unparseable value was left in storage';
});

session.setMaterial(paper);
session.clearMaterial();

check('clearMaterial empties both the store and tab storage', () => {
  if (session.getMaterial() !== null) return 'the paper is still in memory';
  if (cell.has('statskill.material.v1')) return 'the paper is still in tab storage';
});

check('unsubscribing stops the notifications', () => {
  const before = announced;
  unsubscribe();
  session.setMaterial(paper);
  session.clearMaterial();
  return announced === before ? true : `${announced - before} notifications arrived after unsubscribing`;
});

// Safari in private mode and a full quota both throw on setItem. The paper still has to
// work for as long as the tab stays open — but the page must be told, so it can stop
// promising that a reload is safe.
globalThis.window = {
  sessionStorage: {
    getItem: () => null,
    setItem: () => { throw new Error('QuotaExceededError'); },
    removeItem: () => {},
  },
};
const withoutStorage = await import(`${STORE}?storage=blocked`);
withoutStorage.setMaterial(paper);

check('a browser blocking tab storage still yields a usable paper', () => {
  const held = withoutStorage.getMaterial();
  if (!held) return 'the paper was lost when the write failed';
  if (held.questions.length !== sample.questions.length) return 'the in-memory paper is incomplete';
});

check('a failed write is reported, so the page can stop promising a reload is safe', () =>
  withoutStorage.isDurable() === false ? true : 'the store still claims the paper is durable',
);

section('reading a file the way the page does');

const pageEvents = [];
const readBack = await materials.readMaterial(
  new File([materials.sampleMaterialText], 'Methodology_note.txt', { type: 'text/plain' }),
  (pagesRead, pageCount) => { pageEvents.push(`${pagesRead}/${pageCount}`); },
);

check('a txt file comes back as text and reports its one page', () => {
  if (readBack.pageCount !== 1) return `pageCount was ${readBack.pageCount}`;
  if (!readBack.text.includes('consumer price index')) return 'the extracted text is not the file contents';
  if (pageEvents.join(' ') !== '1/1') return `progress events were [${pageEvents}]`;
});

let refusedFormat = null;
try {
  await materials.readMaterial(new File(['a spreadsheet, not a document'], 'figures.xlsx'));
} catch (error) {
  refusedFormat = error;
}

check('an unsupported extension is refused and named', () => {
  if (!refusedFormat) return 'an .xlsx file was accepted';
  if (!refusedFormat.message.includes('.xlsx')) return `the message does not name the format: ${refusedFormat.message}`;
});

let refusedThin = null;
try {
  await materials.readMaterial(new File(['Two words.'], 'thin.md'));
} catch (error) {
  refusedThin = error;
}

check('a file with almost no text is refused, not half-analysed', () =>
  refusedThin ? true : 'a ten-character file was accepted',
);

check('the file input and the help text offer the same formats', () => {
  const offered = materials.supportedAccept.split(',').map((item) => item.replace('.', '').toUpperCase());
  if (offered.length !== materials.supportedExtensions.length) return `accept="${materials.supportedAccept}" lost a format`;
  for (const name of offered) {
    if (!materials.supportedFormatsSentence.includes(name)) {
      return `${name} is offered by the file input but missing from "${materials.supportedFormatsSentence}"`;
    }
  }
});

// A PDF's text layer routinely arrives with NUL bytes, form feeds and CRLF endings.
// They reach the sentence splitter unless extraction strips them, and a NUL inside a
// sentence would be quoted straight back to the learner as part of a question. Every
// control character below is written as an escape, so this file stays plain text.
const messy = await materials.readMaterial(
  new File(
    [
      'Line one.\u0000\r\nLine two has a form feed\u000cand a tab\there.\r\n\r\n\r\n' +
      'Line three ends the note about the consumer price index basket.',
    ],
    'messy.txt',
  ),
);

check('control characters and CRLF endings are cleaned out of extracted text', () => {
  if (/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(messy.text)) return 'a control character survived extraction';
  if (messy.text.includes('\r')) return 'a carriage return survived extraction';
  if (/\n{3,}/.test(messy.text)) return 'three or more blank lines survived extraction';
  if (!messy.text.includes('form feed and a tab here')) return `the surrounding words were mangled: "${messy.text}"`;
});

check('no two questions in a paper share a stem', () => {
  for (const [label, doc] of documents) {
    const stems = new Set(doc.questions.map((question) => question.q.toLowerCase()));
    if (stems.size !== doc.questions.length) {
      return `${label} repeats a stem (${doc.questions.length - stems.size} duplicate)`;
    }
  }
});

section('the retry loop the quiz page runs');

/*
 * The Quiz report offers "practise what you missed", and the paper it builds is a
 * subset of the paper just graded. That makes the question indexes relative to the
 * subset, not to the original document — so a second retry has to be planned from
 * the retry paper. Passing the original list there would quote the wrong passages
 * and re-ask questions the learner already got right, which is the defect these
 * checks exist to catch.
 *
 * The fixture is the reason this section works at all. It first used `weakPlan`,
 * which comes from an all-wrong attempt: every question is missed, so the retry
 * paper is the whole paper and "the retry is shorter" could not fail no matter what
 * buildRetryPaper did. Missing every third question instead retries 4 of the 12
 * questions across 4 of the 5 topics, so "shorter" and "fewer topics" are both
 * claims the code has to earn.
 */
const mixedAnswers = sample.questions.map((question, index) =>
  index % 3 === 0 ? (question.correct + 1) % question.a.length : question.correct,
);
const mixedMissed = mixedAnswers
  .map((choice, index) => (choice === sample.questions[index].correct ? -1 : index))
  .filter((index) => index >= 0);
const mixedResult = scoring.gradeAttempt(sample.questions, mixedAnswers);
const mixedPlan = recommendations.buildStudyPlan(sample.questions, mixedResult);
const retryOne = recommendations.buildRetryPaper(sample.questions, mixedPlan);
const paperTopics = new Set(sample.questions.map((question) => question.topic));

check('the retry paper holds only the questions that were missed', () => {
  if (retryOne.questions.length === 0) return 'the retry paper is empty';
  if (retryOne.questions.length >= sample.questions.length) {
    return `the retry is ${retryOne.questions.length} of ${sample.questions.length} questions, so it is not a subset`;
  }
  if (retryOne.questions.length !== mixedMissed.length) {
    return `${retryOne.questions.length} questions retried for ${mixedMissed.length} missed`;
  }
  for (const index of retryOne.sourceIndexes) {
    if (!mixedMissed.includes(index)) return `question ${index} was answered correctly but is being re-asked`;
  }
  for (let slot = 0; slot < retryOne.questions.length; slot += 1) {
    if (retryOne.questions[slot] !== sample.questions[retryOne.sourceIndexes[slot]]) {
      return `slot ${slot} does not match the index it claims to come from`;
    }
  }
  const stems = new Set(retryOne.questions.map((question) => question.q));
  if (stems.size !== retryOne.questions.length) return 'the retry repeats a question';
});

check('answering the retry correctly scores 100 and ends the loop', () => {
  const answers = retryOne.questions.map((question) => question.correct);
  const result = scoring.gradeAttempt(retryOne.questions, answers);
  if (result.percent !== 100) return `percent=${result.percent}`;
  const plan = recommendations.buildStudyPlan(retryOne.questions, result);
  if (plan.retry.length !== 0) return `${plan.retry.length} questions still offered for retry`;
  if (plan.topics.length !== 0) return `${plan.topics.length} topics still flagged`;
});

check('a retry of a retry re-asks only what was missed in the retry', () => {
  // Miss exactly the first question of the retry paper, answer the rest.
  const answers = retryOne.questions.map((question, index) =>
    index === 0 ? (question.correct + 1) % question.a.length : question.correct,
  );
  const result = scoring.gradeAttempt(retryOne.questions, answers);
  if (result.correct !== retryOne.questions.length - 1) return `correct=${result.correct}`;
  const plan = recommendations.buildStudyPlan(retryOne.questions, result);
  const second = recommendations.buildRetryPaper(retryOne.questions, plan);
  if (second.questions.length !== 1) return `the second retry holds ${second.questions.length} questions`;
  if (second.questions[0] !== retryOne.questions[0]) return 'the second retry re-asks the wrong question';
});

check('the report only names topics the paper being graded actually covers', () => {
  const answers = retryOne.questions.map(() => null);
  const result = scoring.gradeAttempt(retryOne.questions, answers);
  const covered = new Set(retryOne.questions.map((question) => question.topic));
  if (covered.size >= paperTopics.size) {
    return `the retry covers ${covered.size} of the paper's ${paperTopics.size} topics, so this check proves nothing`;
  }
  for (const score of result.topics) {
    if (!covered.has(score.topic)) return `"${score.topic}" is not in the retry paper`;
  }
  if (result.topics.length !== covered.size) return `${result.topics.length} topics reported for ${covered.size} covered`;
  if (result.skipped !== retryOne.questions.length) return `skipped=${result.skipped}`;
});

/*
 * The three checks below exist because of a real defect, found by the fixture above.
 *
 * `plan.retry` used to be collected from `plan.topics`, which only holds topics that
 * earned a band — and a topic needs MIN_QUESTIONS_FOR_BAND questions to earn one. A
 * retry paper is short, so it typically carries one question per topic: every topic
 * came back `unrated`, `focus` was empty, and the retry list came back empty even
 * though the learner had just got a question wrong. The Quiz page gates its
 * "practise what you missed" button on `retry.length`, so the loop dead-ended.
 */
check('a missed question is still offered for retry when its topic is unrated', () => {
  const answers = retryOne.questions.map((question, index) =>
    index === 0 ? (question.correct + 1) % question.a.length : question.correct,
  );
  const result = scoring.gradeAttempt(retryOne.questions, answers);
  const topic = result.topics.find((score) => score.topic === retryOne.questions[0].topic);
  if (!topic) return 'the missed question topic is missing from the report';
  if (topic.total >= taxonomy.MIN_QUESTIONS_FOR_BAND) {
    return `"${topic.topic}" carries ${topic.total} questions, so this check proves nothing`;
  }
  if (topic.band !== 'unrated') return `an unrated topic was banded "${topic.band}"`;
  const plan = recommendations.buildStudyPlan(retryOne.questions, result);
  if (plan.topics.length !== 0) return 'an unrated topic was given topic-level advice';
  if (plan.retry.length !== 1) return `${plan.retry.length} questions offered for retry, expected 1`;
  if (plan.retry[0] !== 0) return `question ${plan.retry[0]} offered instead of the one that was missed`;
});

check('the retry list puts weak topics first, then the rest in document order', () => {
  const weakFirst = weakPlan.retry;
  if (weakFirst.length !== sample.questions.length) return `${weakFirst.length} of ${sample.questions.length} after an all-wrong paper`;
  if (new Set(weakFirst).size !== weakFirst.length) return 'the retry list repeats a question';
  const fromFocus = [];
  for (const topic of weakPlan.topics) for (const index of topic.retry) if (!fromFocus.includes(index)) fromFocus.push(index);
  for (let slot = 0; slot < fromFocus.length; slot += 1) {
    if (weakFirst[slot] !== fromFocus[slot]) return `slot ${slot} is ${weakFirst[slot]}, not the weak-topic order ${fromFocus[slot]}`;
  }
  const tail = weakFirst.slice(fromFocus.length);
  for (let slot = 1; slot < tail.length; slot += 1) {
    if (tail[slot] < tail[slot - 1]) return 'the questions after the weak topics are not in document order';
  }
});

check('the plan headline never hides a retry and never invents one', () => {
  const cases = [
    ['all wrong', sample.questions, weakPlan],
    ['all right', sample.questions, recommendations.buildStudyPlan(sample.questions, scoring.gradeAttempt(sample.questions, allRight))],
    ['mixed', sample.questions, mixedPlan],
  ];
  const oneMissed = scoring.gradeAttempt(
    retryOne.questions,
    retryOne.questions.map((question, index) => (index === 0 ? (question.correct + 1) % question.a.length : question.correct)),
  );
  cases.push(['one missed, nothing rated', retryOne.questions, recommendations.buildStudyPlan(retryOne.questions, oneMissed)]);

  for (const [label, , plan] of cases) {
    const mentions = /retry|retrying/i.test(plan.headline);
    if (plan.retry.length > 0 && !mentions) return `${label}: ${plan.retry.length} to retry but the headline does not say so — "${plan.headline}"`;
    if (plan.retry.length === 0 && mentions) return `${label}: nothing to retry but the headline offers one — "${plan.headline}"`;
    if (plan.retry.length > 0 && !plan.headline.includes(String(plan.retry.length))) {
      return `${label}: headline "${plan.headline}" does not state the count ${plan.retry.length}`;
    }
  }
});

section('the quarterly assessment paper');

/*
 * The Assessment page had three questions and no answer key, so it scored every
 * sitting 78% and "2 / 3 correct" whatever was chosen. These checks are against the
 * curated paper that replaced it. They matter more than they look: nothing else in the
 * project can tell whether a hand-written item bank is well formed, and a paper with a
 * stub option, a repeated stem or every answer at position B measures nothing while
 * still rendering perfectly.
 *
 * The bank moved to `server/assessment.mjs` so the key would stop shipping in the
 * browser bundle. That splits what used to be one object in two, and the fixture below
 * is how the two halves are put back together — the same way the page does it:
 *
 *   sealedPaper()    the questions a browser is allowed to see, no key
 *   gradeSubmission  the server marking a sitting, which returns the key with it
 *   rebuildPaper     the client folding both into the `MaterialQuestion[]` the
 *                    report, the study plan and the retry paper already speak
 *
 * So every check from here down runs both sides, and a drift between them fails here
 * rather than on screen. `shuffle: false` deals the bank in its written order so the
 * assertions can name a fixed paper; the shuffled path is checked on its own below.
 */
const sealedExam = exam.sealedPaper({ shuffle: false });
const examSections = sealedExam.sections;
const optionLetters = 'ABCD';

/** One sitting, every answer right, expressed the way the tab would express it. */
function sitPerfectly(paper) {
  const keyById = new Map(exam.answerKey().map((row) => [row.id, row.option]));
  return paper.questions.map((question) => ({ question: question.id, option: keyById.get(question.id) ?? null }));
}

const perfectMarking = exam.gradeSubmission({ choices: sitPerfectly(sealedExam) });
const examPaper = assessment.rebuildPaper(sealedExam, perfectMarking);
const examKey = examPaper.map((question) => question.correct);

check('assessment: five sections, one per framework competency, none repeated', () => {
  if (examSections.length !== taxonomy.competencies.length) {
    return `${examSections.length} sections for ${taxonomy.competencies.length} competencies`;
  }
  if (examPaper.length !== exam.ASSESSMENT_LENGTH) {
    return `the paper holds ${examPaper.length} questions but ASSESSMENT_LENGTH says ${exam.ASSESSMENT_LENGTH}`;
  }
  if (sealedExam.length !== examPaper.length) {
    return `the dealt paper announces ${sealedExam.length} questions and carries ${examPaper.length}`;
  }
  const ids = examSections.map((item) => item.competency);
  if (new Set(ids).size !== ids.length) return `a competency is used twice: ${ids.join(', ')}`;
  for (const id of ids) {
    if (!taxonomy.competencies.some((competency) => competency.id === id)) {
      return `"${id}" is not a competency in topics.ts`;
    }
  }
  const topics = examSections.map((item) => item.topic);
  if (new Set(topics).size !== topics.length) {
    return 'two sections share a topic label, so their scores would be merged into one';
  }
  for (const item of examSections) {
    if (!item.topic || !item.focus) return `section "${item.competency}" is missing a label`;
  }
});

check('assessment: every section carries enough questions to earn a band', () => {
  for (const item of examSections) {
    const count = examPaper.filter((question) => question.topic === item.topic).length;
    if (count < taxonomy.MIN_QUESTIONS_FOR_BAND) {
      return `"${item.topic}" carries ${count}, under MIN_QUESTIONS_FOR_BAND=${taxonomy.MIN_QUESTIONS_FOR_BAND}, so it would report as unrated`;
    }
    if (count !== exam.QUESTIONS_PER_SECTION) {
      return `"${item.topic}" carries ${count}, not the ${exam.QUESTIONS_PER_SECTION} the page tells the learner to expect`;
    }
  }
  if (sealedExam.questionsPerSection !== exam.QUESTIONS_PER_SECTION) {
    return `the dealt paper tells the page ${sealedExam.questionsPerSection} per section`;
  }
});

check('assessment: every question has four options, one key and a reason', () => {
  for (let index = 0; index < examPaper.length; index += 1) {
    const question = examPaper[index];
    const where = `question ${index + 1}`;
    if (question.a.length !== 4) return `${where} has ${question.a.length} options`;
    if (!Number.isInteger(question.correct) || question.correct < 0 || question.correct >= question.a.length) {
      return `${where} keys option ${question.correct}, which is not one of its four`;
    }
    if (new Set(question.a.map((option) => option.trim().toLowerCase())).size !== 4) {
      return `${where} repeats an option, so two answers would both be right`;
    }
    for (const option of question.a) {
      if (option.trim().length < 12) return `${where} has a stub option: "${option}"`;
    }
    if (question.q.trim().length < 40) return `${where} has no real stem`;
    if (question.explanation.trim().length < 60) return `${where} has no real explanation to show on review`;
    if (question.kind !== 'scenario') return `${where} is kind "${question.kind}", not scenario`;
    if (question.source !== '') return `${where} claims a source document that does not exist`;
  }
  const stems = examPaper.map((question) => question.q);
  if (new Set(stems).size !== stems.length) return 'two questions share a stem';
});

check('assessment: the scenario kind has a label the review screen can print', () => {
  const label = materials.questionKindLabels[examPaper[0].kind];
  if (!label) return `questionKindLabels has no entry for "${examPaper[0].kind}", so review would print undefined`;
  if (label.trim().length < 4) return `the label for "${examPaper[0].kind}" is "${label}"`;
});

check('assessment: the answer key is spread across all four positions', () => {
  const counts = [0, 0, 0, 0];
  for (const key of examKey) counts[key] += 1;
  for (let position = 0; position < counts.length; position += 1) {
    if (counts[position] === 0) {
      return `no answer sits at position ${optionLetters[position]} (spread is ${counts.join('/')})`;
    }
  }
  const most = Math.max(...counts);
  if (most > examPaper.length / 3) {
    return `position ${optionLetters[counts.indexOf(most)]} holds ${most} of ${examPaper.length} answers (spread is ${counts.join('/')})`;
  }
  for (const item of examSections) {
    const keys = examPaper.filter((question) => question.topic === item.topic).map((question) => question.correct);
    if (new Set(keys).size === 1) {
      return `every answer in "${item.topic}" sits at position ${optionLetters[keys[0]]}`;
    }
  }
});

check('assessment: sectionOf places every question in the section it was written for', () => {
  for (let index = 0; index < examPaper.length; index += 1) {
    const item = examSections[assessment.sectionOf(sealedExam, index)];
    if (!item) return `question ${index + 1} maps to section ${assessment.sectionOf(sealedExam, index)}, which does not exist`;
    if (item.topic !== examPaper[index].topic) {
      return `question ${index + 1} is topic "${examPaper[index].topic}" but sectionOf says "${item.topic}"`;
    }
  }
  // The stepper highlights the dot sectionOf returns, so interleaved sections would make
  // it jump backwards mid-paper.
  let previous = 0;
  for (let index = 0; index < examPaper.length; index += 1) {
    const current = assessment.sectionOf(sealedExam, index);
    if (current < previous) return `section ${current} appears after section ${previous}, so the stepper would run backwards`;
    previous = current;
  }
  if (assessment.sectionOf(sealedExam, examPaper.length) !== 0) {
    return 'an index past the end should fall back to the first section';
  }
});

check('assessment: nothing in a dealt paper gives the answer away', () => {
  const dealt = exam.sealedPaper();
  const serialized = JSON.stringify(dealt);
  // Field names with their quotes, so a scenario that happens to discuss "the correct
  // procedure" in prose does not read as a leak.
  for (const field of ['"correct"', '"explanation"', '"answer"', '"key"', '"right"']) {
    if (serialized.includes(field)) return `a dealt paper carries ${field}`;
  }
  const keyed = exam.answerKey();
  for (const question of dealt.questions) {
    if (!Array.isArray(question.options) || question.options.length !== 4) {
      return `${question.id} was dealt ${question.options && question.options.length} options`;
    }
    const ids = question.options.map((option) => option.id);
    if (new Set(ids).size !== 4) return `${question.id} repeats an option id: ${ids.join(', ')}`;
    for (const option of question.options) {
      if (Object.keys(option).join(',') !== 'id,text') return `${question.id} deals an option as {${Object.keys(option)}}`;
    }
    // The key exists for this question, and none of the four options is marked as it.
    if (!keyed.some((row) => row.id === question.id)) return `${question.id} has no entry in the answer key`;
  }
});

check('assessment: shuffling moves options without moving them between sections', () => {
  const first = exam.sealedPaper();
  const second = exam.sealedPaper();
  if (first === second || first.questions === second.questions) return 'two sittings share one object';

  // Section grouping survives, because the stepper walks the five competencies in order.
  for (const paper of [first, second]) {
    let previous = 0;
    for (const question of paper.questions) {
      if (question.section < previous) return 'a section reappears after a later one';
      previous = question.section;
    }
    for (const item of examSections) {
      const count = paper.questions.filter((question) => question.topic === item.topic).length;
      if (count !== exam.QUESTIONS_PER_SECTION) return `"${item.topic}" was dealt ${count} questions`;
    }
  }

  // And something actually moved. Two independent shuffles of fifteen questions and
  // sixty options agreeing everywhere would mean `shuffle` is not shuffling.
  const orderMoved = first.questions.some((question, index) => question.id !== second.questions[index].id);
  const optionsMoved = first.questions.some((question, index) =>
    question.options.some((option, slot) => option.id !== second.questions[index].options[slot].id),
  );
  if (!orderMoved && !optionsMoved) return 'two dealt papers are identical, so nothing is being shuffled';
});

check('assessment: a shuffled sitting is graded by option id, not by position', () => {
  // The one check that proves the two index spaces are handled correctly end to end.
  // A page that sent display positions would score near a quarter of the paper here.
  const keyById = new Map(exam.answerKey().map((row) => [row.id, row.option]));
  let moved = 0;
  for (let attempt = 0; attempt < 12; attempt += 1) {
    const dealt = exam.sealedPaper();
    // Which button the learner would press for the right answer on this sitting.
    const answers = dealt.questions.map((question) =>
      question.options.findIndex((option) => option.id === keyById.get(question.id)),
    );
    if (answers.some((index) => index < 0)) return 'a dealt question does not contain its own keyed option';
    // How many of those buttons are in a different slot than the bank position, which is
    // the difference a position-based submission would get wrong.
    moved += answers.filter(
      (index, slot) => index !== exam.OPTION_IDS.indexOf(keyById.get(dealt.questions[slot].id)),
    ).length;

    const marking = exam.gradeSubmission({ choices: assessment.toChoices(dealt, answers) });
    if (marking.correct !== dealt.length || marking.percent !== 100) {
      return `a fully correct sitting was marked ${marking.correct}/${marking.total} = ${marking.percent}%`;
    }
    if (marking.answered !== dealt.length) return `${marking.answered} of ${dealt.length} counted as answered`;
  }
  if (moved === 0) {
    return 'no keyed option moved off its bank position in twelve sittings, so this check proves nothing';
  }
});

check('assessment: an unanswered question is submitted as unanswered, not dropped', () => {
  const dealt = exam.sealedPaper();
  const answers = dealt.questions.map((question, index) => (index % 3 === 0 ? null : 0));
  const choices = assessment.toChoices(dealt, answers);
  if (choices.length !== dealt.questions.length) return `${choices.length} choices for ${dealt.questions.length} questions`;
  for (let index = 0; index < choices.length; index += 1) {
    const expected = answers[index] === null ? null : dealt.questions[index].options[0].id;
    if (choices[index].option !== expected) return `slot ${index} sent "${choices[index].option}"`;
    if (choices[index].question !== dealt.questions[index].id) return `slot ${index} names ${choices[index].question}`;
  }
  const marking = exam.gradeSubmission({ choices });
  const blanks = marking.questions.filter((row) => row.chosen === null).length;
  const expectedBlanks = answers.filter((pick) => pick === null).length;
  if (blanks !== expectedBlanks) return `${blanks} questions came back unanswered, expected ${expectedBlanks}`;
  if (marking.total !== dealt.length) return `the paper shrank to ${marking.total}`;
});

check('assessment: the report is rebuilt at the position the learner saw, not the bank position', () => {
  const dealt = exam.sealedPaper();
  const keyById = new Map(exam.answerKey().map((row) => [row.id, row.option]));
  const marking = exam.gradeSubmission({ choices: sitPerfectly(dealt) });
  const rebuilt = assessment.rebuildPaper(dealt, marking);
  let moved = 0;
  for (let index = 0; index < rebuilt.length; index += 1) {
    const question = rebuilt[index];
    const dealtQuestion = dealt.questions[index];
    const keyed = keyById.get(dealtQuestion.id);
    const onScreen = dealtQuestion.options.findIndex((option) => option.id === keyed);
    if (question.correct !== onScreen) {
      return `${dealtQuestion.id}: rebuilt as position ${question.correct}, dealt at position ${onScreen}`;
    }
    if (question.a[question.correct] !== dealtQuestion.options[onScreen].text) {
      return `${dealtQuestion.id}: the review screen would print the wrong option as the answer`;
    }
    if (question.explanation.trim().length < 60) return `${dealtQuestion.id} came back with no explanation to show`;
    if (onScreen !== exam.OPTION_IDS.indexOf(keyed)) moved += 1;
  }
  if (moved === 0) return 'no option moved on this sitting, so this check proves nothing';
});

check('assessment: a question the marking omits cannot be marked right by accident', () => {
  // A truncated or filtered response. `correct: -1` is equal to no choice, so every
  // question in the gap reads as missed rather than as correct-by-default.
  const truncated = { ...perfectMarking, questions: perfectMarking.questions.slice(0, 2) };
  const rebuilt = assessment.rebuildPaper(sealedExam, truncated);
  if (rebuilt.length !== sealedExam.questions.length) return `${rebuilt.length} questions rebuilt`;
  for (let index = 2; index < rebuilt.length; index += 1) {
    if (rebuilt[index].correct !== -1) return `question ${index + 1} was keyed to ${rebuilt[index].correct}`;
  }
  const graded = scoring.gradeAttempt(rebuilt, examKey);
  if (graded.correct !== 2) return `${graded.correct} answers were accepted from a two-question key`;
});

check('assessment: the score on screen is the score the server stored', () => {
  // adoptServerScore exists so a drift between the two banding implementations shows
  // rather than hides. Feed it a marking that disagrees with the local grading and the
  // server's figures must be the ones that survive.
  //
  // `total: 16` is the stale-bundle case: the server dealt a paper of a length this build
  // does not expect. It is here because the first version of this claim agreed with the
  // local grading on `total`, so `total: local.total` inside adoptServerScore was a
  // mutation this check could not see — verified by making it and watching 104 pass.
  const local = scoring.gradeAttempt(examPaper, examKey);
  const claim = {
    ...perfectMarking,
    total: 16,
    correct: 9,
    answered: 14,
    percent: 60,
    band: 'average',
    topics: perfectMarking.topics.map((row, index) =>
      index === 0 ? { ...row, correct: 0, percent: 0, band: 'needs-work' } : row,
    ),
  };
  const adopted = assessment.adoptServerScore(local, claim);
  if (adopted.percent !== 60 || adopted.correct !== 9 || adopted.band !== 'average') {
    return `the page kept its own figures: ${adopted.correct}/${adopted.total} = ${adopted.percent}% (${adopted.band})`;
  }
  if (adopted.total !== 16) return `the page kept its own paper length: ${adopted.total}`;
  if (adopted.answered !== 14 || adopted.skipped !== adopted.total - 14) {
    return `${adopted.answered} answered and ${adopted.skipped} skipped of ${adopted.total}`;
  }
  const first = adopted.topics[0];
  if (first.topic !== claim.topics[0].topic || first.band !== 'needs-work') {
    return `the adopted weak topic did not sort to the front (got "${first.topic}", band ${first.band})`;
  }
  if (adopted.weak.length !== 1 || adopted.weak[0].topic !== claim.topics[0].topic) {
    return `${adopted.weak.length} topics grouped as weak after adopting the server's bands`;
  }
  const rolled = adopted.competencies.find((entry) => entry.id === claim.topics[0].competency);
  if (!rolled || rolled.percent !== 0) return 'the competency roll-up was not recomputed from the adopted numbers';
});

check('assessment: a perfect sitting scores 100 and reports all five competencies', () => {
  const result = scoring.gradeAttempt(examPaper, examKey);
  if (result.total !== examPaper.length) return `graded ${result.total} of ${examPaper.length}`;
  if (result.correct !== examPaper.length || result.percent !== 100) return `${result.correct}/${result.total} = ${result.percent}%`;
  if (result.band !== 'strong') return `band "${result.band}" for a perfect paper`;
  if (result.skipped !== 0) return `${result.skipped} counted as skipped`;
  if (result.topics.length !== examSections.length) {
    return `${result.topics.length} topics reported for ${examSections.length} sections`;
  }
  if (result.competencies.length !== taxonomy.competencies.length) {
    return `${result.competencies.length} competencies reported, expected all ${taxonomy.competencies.length}`;
  }
  for (const entry of result.competencies) {
    if (entry.total !== exam.QUESTIONS_PER_SECTION || entry.percent !== 100) {
      return `${entry.name} rolled up as ${entry.correct}/${entry.total} = ${entry.percent}%`;
    }
  }
});

check('assessment: a section is filed under the competency it declares, not a keyword guess', () => {
  const result = scoring.gradeAttempt(examPaper, examKey);
  const filed = new Map(result.topics.map((score) => [score.topic, score.competency]));
  let guessable = 0;
  for (const item of examSections) {
    if (filed.get(item.topic) !== item.competency) {
      return `"${item.topic}" was filed under ${filed.get(item.topic)}, not the ${item.competency} it declares`;
    }
    const context = examPaper
      .filter((question) => question.topic === item.topic)
      .map((question) => question.source)
      .join(' ');
    if (taxonomy.classifyTopic(item.topic, context) === item.competency) guessable += 1;
  }
  if (guessable === examSections.length) {
    return `the keyword pass reaches the same answer for all ${guessable} sections, so this check proves nothing`;
  }
});

check('assessment: a disagreement between two questions is not resolved by ordering', () => {
  // Same topic, different declared competencies. Neither claim can be trusted, so the
  // keyword pass has to decide rather than whichever question happened to come first.
  const [a, b] = [examPaper[0], examPaper[1]];
  const clash = [
    { ...a, topic: 'Shared label', competency: 'inference' },
    { ...b, topic: 'Shared label', competency: 'leadership' },
  ];
  const forward = scoring.gradeAttempt(clash, [clash[0].correct, clash[1].correct]);
  const backward = scoring.gradeAttempt([clash[1], clash[0]], [clash[1].correct, clash[0].correct]);
  const one = forward.topics[0].competency;
  const other = backward.topics[0].competency;
  if (one !== other) return `order decided the competency: ${one} forwards, ${other} backwards`;
  if (one === 'inference' || one === 'leadership') {
    return `a contested claim was still trusted (${one})`;
  }
  if (one !== taxonomy.classifyTopic('Shared label', '')) {
    return `expected the keyword pass to decide (${taxonomy.classifyTopic('Shared label', '')}), got ${one}`;
  }
});

/*
 * One section answered entirely wrong, the rest right. This is the fixture the page's
 * result screen is built for: a real band per section, one weak topic to advise on, and
 * a retry that holds three questions rather than fifteen.
 */
const weakSection = examSections[2];
const missOneSection = examPaper.map((question) =>
  question.topic === weakSection.topic ? (question.correct + 1) % question.a.length : question.correct,
);
const sectionResult = scoring.gradeAttempt(examPaper, missOneSection);
const sectionPlan = recommendations.buildStudyPlan(examPaper, sectionResult);

check('assessment: missing one section reports that section weak and the rest strong', () => {
  const weak = sectionResult.topics.filter((score) => score.band === 'needs-work');
  if (weak.length !== 1) return `${weak.length} topics came back weak, expected 1`;
  if (weak[0].topic !== weakSection.topic) return `weak topic is "${weak[0].topic}", expected "${weakSection.topic}"`;
  if (weak[0].percent !== 0) return `${weak[0].percent}% for a section answered entirely wrong`;
  if (weak[0].competency !== weakSection.competency) return `the weak topic was filed under ${weak[0].competency}`;
  if (weak[0].missed.length !== exam.QUESTIONS_PER_SECTION) return `${weak[0].missed.length} questions recorded as missed`;
  if (sectionResult.strong.length !== examSections.length - 1) {
    return `${sectionResult.strong.length} strong topics, expected ${examSections.length - 1}`;
  }
  const expected = Math.round(((examPaper.length - exam.QUESTIONS_PER_SECTION) / examPaper.length) * 100);
  if (sectionResult.percent !== expected) return `overall ${sectionResult.percent}%, expected ${expected}%`;
  const rolled = sectionResult.competencies.find((entry) => entry.id === weakSection.competency);
  if (!rolled) return `${weakSection.competency} is missing from the roll-up`;
  if (rolled.percent !== 0) return `${weakSection.competency} rolled up to ${rolled.percent}%`;
  if (rolled.band !== 'needs-work') return `${weakSection.competency} banded "${rolled.band}"`;
});

check('assessment: the plan retries what was missed without quoting a passage it lacks', () => {
  if (sectionPlan.passages.length !== 0) {
    return `${sectionPlan.passages.length} passages quoted from a paper with no document behind it`;
  }
  for (const topic of sectionPlan.topics) {
    if (topic.passages.length !== 0) return `"${topic.score.topic}" quoted ${topic.passages.length} passages`;
  }
  if (/re-read the passages/i.test(sectionPlan.headline)) {
    return `the headline points at passages that do not exist — "${sectionPlan.headline}"`;
  }
  if (!/retry/i.test(sectionPlan.headline) || !sectionPlan.headline.includes(String(sectionPlan.retry.length))) {
    return `the headline does not offer the ${sectionPlan.retry.length} questions to retry — "${sectionPlan.headline}"`;
  }
  if (sectionPlan.retry.length !== exam.QUESTIONS_PER_SECTION) {
    return `${sectionPlan.retry.length} questions offered for retry, expected ${exam.QUESTIONS_PER_SECTION}`;
  }
  for (const index of sectionPlan.retry) {
    if (examPaper[index].topic !== weakSection.topic) {
      return `the retry includes "${examPaper[index].topic}", which was answered correctly`;
    }
  }
  const retry = recommendations.buildRetryPaper(examPaper, sectionPlan);
  if (retry.questions.length !== sectionPlan.retry.length) return `the retry paper holds ${retry.questions.length}`;
  for (let slot = 0; slot < retry.questions.length; slot += 1) {
    if (retry.questions[slot].q !== examPaper[retry.sourceIndexes[slot]].q) {
      return `retry slot ${slot} does not match the index it claims to come from`;
    }
  }
});

check('assessment: a weak section still gets a pathway when one builds that competency', () => {
  const inference = examSections.find((item) => item.competency === 'inference');
  if (!inference) return 'no section declares inference, so this check proves nothing';
  const missed = examPaper.map((question) =>
    question.topic === inference.topic ? (question.correct + 1) % question.a.length : question.correct,
  );
  const plan = recommendations.buildStudyPlan(examPaper, scoring.gradeAttempt(examPaper, missed));
  if (plan.courses.length === 0) return 'no pathway offered for a weak inference section';
  const primary = courseLib.coursesForCompetency('inference').filter((course) => course.competency === 'inference');
  if (primary.length === 0) return 'nothing lists inference as its primary competency, so this check proves nothing';
  if (!plan.courses.some((course) => course.id === primary[0].id)) {
    return `expected ${primary[0].id} first, got ${plan.courses.map((course) => course.id).join(', ')}`;
  }
});

check('assessment: a topic with no pathway and no passage is summarised honestly', () => {
  const bare = examPaper
    .slice(0, exam.QUESTIONS_PER_SECTION)
    .map((question) => ({ ...question, topic: 'Unfiled scenarios', competency: null }));
  const barePlan = recommendations.buildStudyPlan(
    bare,
    scoring.gradeAttempt(bare, bare.map((question) => (question.correct + 1) % question.a.length)),
  );
  if (barePlan.topics.length !== 1) return `${barePlan.topics.length} topics planned, expected 1`;
  if (barePlan.topics[0].courses.length !== 0) return 'the fixture found a pathway, so this check proves nothing';
  if (barePlan.topics[0].passages.length !== 0) return 'the fixture found a passage, so this check proves nothing';
  const [line] = recommendations.summarizePlan(barePlan);
  if (/passage/i.test(line)) return `the summary promises a passage it does not have: "${line}"`;
  if (!/explanation/i.test(line)) return `the summary leaves the learner nothing to do: "${line}"`;
});

check('assessment: a recorded sitting carries topic counts and no question text', () => {
  const payload = scoring.toAttemptPayload(sectionResult, {
    source: 'assessment',
    label: 'Quarterly competency check',
    durationSeconds: 512.4,
  });
  if (payload.source !== 'assessment') return `payload source is "${payload.source}"`;
  if (payload.total !== examPaper.length) return `payload reports ${payload.total} questions`;
  if (payload.durationSeconds !== 512) return `duration recorded as ${payload.durationSeconds}`;
  if (payload.topics.length !== examSections.length) return `${payload.topics.length} topics in the payload`;
  if (Object.keys(payload.competencyPercents).length !== taxonomy.competencies.length) {
    return `${Object.keys(payload.competencyPercents).length} competency percents, expected ${taxonomy.competencies.length}`;
  }
  const serialized = JSON.stringify(payload);
  for (const question of examPaper) {
    if (serialized.includes(question.q.slice(0, 40))) return `the payload carries question text: "${question.q.slice(0, 40)}"`;
    if (serialized.includes(question.explanation.slice(0, 40))) return 'the payload carries an explanation';
    for (const option of question.a) {
      if (serialized.includes(option.slice(0, 30))) return `the payload carries an option: "${option.slice(0, 30)}"`;
    }
  }
});

check('assessment: the paper says out loud that it is not an official rating', () => {
  const note = exam.ASSESSMENT_NOTE;
  if (typeof note !== 'string' || note.trim().length < 60) return 'there is no note for the page to print';
  if (!/\bnot\b/i.test(note)) return `the note makes no disclaimer — "${note}"`;
  if (!/(official|certification|certified)/i.test(note)) return `the note does not say it is not a certification — "${note}"`;
  if (!/(MoSPI|iGOT|Karmayogi)/i.test(note)) return 'the note does not name the authority it is not speaking for';
  if (/\b(certified|accredited|approved|endorsed) by\b/i.test(note)) return `the note claims an endorsement — "${note}"`;
});

section('the overview: every figure on the Dashboard, derived');

const insights = await import(`${OUT}/lib/insights.js`);

/**
 * A pinned "now" — Thursday 10 September 2026, 14:00 local — because every figure the
 * overview prints depends on today's date. The fixture below straddles three different
 * windows on purpose: the last seven days, this calendar month, and everything held.
 * One history therefore proves that the three are not the same arithmetic.
 */
const DASH_NOW = new Date(2026, 8, 10, 14, 0, 0);

function sitting(daysBack, minutes, percent, band, extra = {}) {
  const when = new Date(2026, 8, 10 - daysBack, 9, 30, 0);
  const total = 20;
  return {
    id: `dash-${daysBack}`,
    at: when.toISOString(),
    source: 'material',
    label: `Sitting ${daysBack} days back`,
    total,
    correct: Math.round((percent / 100) * total),
    percent,
    band,
    durationSeconds: minutes * 60,
    topics: [],
    competencyPercents: {},
    ...extra,
  };
}

// Newest first, as the server sends it.
const dashHistory = [
  sitting(0, 20, 78, 'average', { source: 'assessment', label: 'Quarterly competency assessment' }),
  sitting(1, 15, 61, 'average'),
  sitting(2, 12, 42, 'needs-work'),
  sitting(5, 9, 55, 'average'),
  sitting(9, 30, 48, 'needs-work'),
  sitting(12, 10, 40, 'needs-work'),
  sitting(13, 10, 38, 'needs-work'),
  sitting(14, 10, 33, 'needs-work'),
  sitting(15, 10, 30, 'needs-work'),
];

const dashBuckets = insights.weekBuckets(dashHistory, DASH_NOW);

check('the rhythm chart covers seven days ending today, and only those', () => {
  if (dashBuckets.length !== insights.WEEK_DAYS) return `${dashBuckets.length} buckets`;
  if (dashBuckets[6].key !== '2026-09-10') return `the last bucket is ${dashBuckets[6].key}`;
  if (dashBuckets[0].key !== '2026-09-04') return `the first bucket is ${dashBuckets[0].key}`;
  const keys = dashBuckets.map((day) => day.key);
  if (keys.join() !== [...keys].sort().join()) return `the buckets are not in date order: ${keys.join(' ')}`;
  // 1 Sep and the four August sittings are in the history and must not be in the window.
  const minutes = dashBuckets.reduce((sum, day) => sum + day.minutes, 0);
  if (minutes !== 20 + 15 + 12 + 9) return `${minutes} minutes in the window, expected 56`;
  if (insights.bucketHours(dashBuckets) !== 0.9) return `the badge would read ${insights.bucketHours(dashBuckets)} hours`;
  if (insights.activeDays(dashBuckets) !== 4) return `${insights.activeDays(dashBuckets)} active days, expected 4`;
  const named = new Set(dashBuckets.map((day) => day.name));
  if (named.size !== 7) return `the axis repeats a weekday: ${dashBuckets.map((day) => day.name).join(' ')}`;
});

check('an empty history is a flat week, not a missing one', () => {
  const empty = insights.weekBuckets([], DASH_NOW);
  if (empty.length !== insights.WEEK_DAYS) return `${empty.length} buckets`;
  if (empty.some((day) => day.active)) return 'a day with no attempt came back active';
  if (insights.bucketHours(empty) !== 0) return `${insights.bucketHours(empty)} hours out of nothing`;
  if (insights.activeDays(empty) !== 0) return `${insights.activeDays(empty)} active days out of nothing`;
});

check('the streak counts real consecutive days, and the best run is not the current one', () => {
  const streak = insights.practiceStreak(dashHistory, DASH_NOW);
  if (streak.current !== 3) return `current streak ${streak.current}, expected 3 (8, 9, 10 Sep)`;
  if (streak.best !== 4) return `best streak ${streak.best}, expected 4 (26–29 Aug)`;
  if (streak.best === streak.current) return 'the fixture cannot tell the two apart, so this check proves nothing';
  const none = insights.practiceStreak([], DASH_NOW);
  if (none.current !== 0 || none.best !== 0) return `an empty history produced ${JSON.stringify(none)}`;
  // A run that ended three days ago has ended.
  const stale = insights.practiceStreak([sitting(3, 10, 50, 'average')], DASH_NOW);
  if (stale.current !== 0) return `a sitting three days ago still counts as a current streak of ${stale.current}`;
  if (stale.best !== 1) return `its best run came back as ${stale.best}`;
  // Yesterday still counts, or every streak reads zero until the learner practises today.
  const yesterday = insights.practiceStreak([sitting(1, 10, 50, 'average')], DASH_NOW);
  if (yesterday.current !== 1) return `a sitting yesterday counted ${yesterday.current}`;
});

check('hours this month is this calendar month, not the last thirty days', () => {
  const month = insights.monthEffort(dashHistory, DASH_NOW);
  if (month.sittings !== 5) return `${month.sittings} sittings, expected the 5 in September`;
  if (month.minutes !== 20 + 15 + 12 + 9 + 30) return `${month.minutes} minutes, expected 86`;
  if (month.hours !== 1.4) return `the metric would read ${month.hours}`;
  if (month.minutes === dashBuckets.reduce((sum, day) => sum + day.minutes, 0)) {
    return 'the month and the week agree, so the fixture proves nothing';
  }
  const august = insights.monthEffort(dashHistory, new Date(2026, 7, 31, 12, 0, 0));
  if (august.sittings !== 4) return `August held ${august.sittings} sittings, expected 4`;
  if (august.minutes !== 40) return `August held ${august.minutes} minutes`;
});

const dashRollup = {
  attempts: dashHistory.length,
  questions: 96,
  correct: 61,
  percent: 64,
  index: 63.5,
  band: 'average',
  minutes: 126,
  firstAttemptAt: dashHistory[dashHistory.length - 1].at,
  lastAttemptAt: dashHistory[0].at,
  sources: { assessment: 1, material: 8 },
  competencies: [
    { id: 'data-quality', correct: 18, total: 20, percent: 90, band: 'strong', attempts: 4 },
    { id: 'inference', correct: 9, total: 22, percent: 41, band: 'needs-work', attempts: 4 },
    { id: 'dissemination', correct: 12, total: 18, percent: 67, band: 'average', attempts: 3 },
    { id: 'leadership', correct: 0, total: 0, percent: 0, band: 'unrated', attempts: 0 },
    { id: 'digital-tools', correct: 7, total: 12, percent: 58, band: 'average', attempts: 2 },
  ],
  topics: [],
  focus: [
    { id: 'inference', correct: 9, total: 22, percent: 41, band: 'needs-work', attempts: 4 },
    { id: 'digital-tools', correct: 7, total: 12, percent: 58, band: 'average', attempts: 2 },
  ],
};

check('the competency chart shows what was answered, strongest first, and nothing else', () => {
  const bars = insights.competencyBars(dashRollup);
  if (bars.length !== 4) return `${bars.length} bars — leadership has no questions and must not be charted`;
  if (bars.some((bar) => bar.id === 'leadership')) return 'an unanswered competency was charted at 0%';
  const scores = bars.map((bar) => bar.score);
  if (scores.join() !== [...scores].sort((left, right) => right - left).join()) return `not sorted: ${scores.join(' ')}`;
  if (bars[0].score !== 90 || bars[3].score !== 41) return `the ends are ${bars[0].score} and ${bars[3].score}`;
  // The axis labels must stay the compact names the chart was designed around.
  const expected = taxonomy.competencyById('data-quality').short;
  if (bars[0].name !== expected) return `the top bar is labelled "${bars[0].name}", not "${expected}"`;
  if (insights.competencyBars(emptyDashRollup()).length !== 0) return 'a new account produced bars';
});

function emptyDashRollup() {
  return { ...dashRollup, attempts: 0, questions: 0, correct: 0, percent: 0, index: 0, band: 'unrated', minutes: 0, firstAttemptAt: null, lastAttemptAt: null, sources: {}, competencies: [], topics: [], focus: [] };
}

check('the deltas are points, and the trend spans the window', () => {
  const delta = insights.lastDelta(dashHistory);
  if (delta !== '+17 pts since your last sitting') return `the note reads "${delta}"`;
  if (insights.lastDelta([]) !== 'Nothing measured yet') return `an empty history says "${insights.lastDelta([])}"`;
  if (insights.lastDelta([dashHistory[0]]) !== 'Your first sitting') return `one sitting says "${insights.lastDelta([dashHistory[0]])}"`;
  const level = insights.lastDelta([dashHistory[0], { ...dashHistory[1], percent: dashHistory[0].percent }]);
  if (level !== 'Level with your last sitting') return `no change says "${level}"`;
  const down = insights.lastDelta([dashHistory[2], dashHistory[0]]);
  if (down !== '-36 pts since your last sitting') return `a fall reads "${down}"`;

  const up = insights.trend(dashHistory);
  if (up.direction !== 'up' || up.up !== true) return `the trend came back ${JSON.stringify(up)}`;
  if (!up.label.includes('48 pts') || !up.label.includes('9 sittings')) return `the label reads "${up.label}"`;
  const falling = insights.trend([dashHistory[8], dashHistory[0]]);
  if (falling.direction !== 'down' || falling.up !== false) return `a falling trend came back ${JSON.stringify(falling)}`;
  if (/\bUp\b/.test(falling.label)) return `a falling trend is labelled "${falling.label}"`;
  const flat = insights.trend([dashHistory[0], { ...dashHistory[1], percent: dashHistory[0].percent }]);
  if (flat.direction !== 'flat') return `an unchanged pair came back ${flat.direction}`;
  if (insights.trend([dashHistory[0]]).direction !== 'none') return 'one sitting claimed a direction';
});

check('the activity list is the stored history, with its own dates and bands', () => {
  const rows = insights.activityRows(dashHistory, 3);
  if (rows.length !== 3) return `${rows.length} rows`;
  if (rows[0].title !== 'Quarterly competency assessment') return `the newest row is "${rows[0].title}"`;
  if (rows[0].date !== '10 Sep') return `the newest row is dated "${rows[0].date}"`;
  if (rows[2].date !== '8 Sep') return `the third row is dated "${rows[2].date}"`;
  if (!rows[0].detail.includes('78%')) return `the detail line is "${rows[0].detail}"`;
  if (!rows[0].detail.includes(taxonomy.bandLabels.average)) return `the detail line omits the band: "${rows[0].detail}"`;
  if (rows[0].tone !== 'amber' || rows[2].tone !== 'navy') return `tones came back ${rows[0].tone} and ${rows[2].tone}`;
  if (insights.activityRows(dashHistory, 20).length !== dashHistory.length) return 'expanding the list dropped rows';
  if (insights.activityRows([], 3).length !== 0) return 'an empty history produced a row';
});

const timeSeriesModules = courseLib.courseFactsFor('time-series').modules.length;
const dataEthicsModules = courseLib.courseFactsFor('data-ethics').modules.length;
const dashCourses = [
  // Two valid modules, one of them recorded twice, and one index the outline does not have.
  { courseId: 'time-series', saved: true, startedAt: '2026-09-01T10:00:00.000Z', completedModules: [0, 1, 1, 99], updatedAt: '2026-09-09T10:00:00.000Z' },
  { courseId: 'data-ethics', saved: false, startedAt: '2026-09-03T10:00:00.000Z', completedModules: [0], updatedAt: '2026-09-03T10:00:00.000Z' },
  { courseId: 'r-programming', saved: false, startedAt: null, completedModules: [], updatedAt: null },
  { courseId: 'not-a-course', saved: true, startedAt: '2026-09-04T10:00:00.000Z', completedModules: [0, 1, 2], updatedAt: null },
];

check('pathway completion counts modules that exist, once, in pathways actually opened', () => {
  if (timeSeriesModules < 3) return `time-series has ${timeSeriesModules} modules, so 2 of them proves nothing`;
  const percent = insights.courseProgress('time-series', dashCourses[0]);
  const expected = Math.round((2 / timeSeriesModules) * 100);
  if (percent !== expected) return `one pathway reads ${percent}%, expected ${expected}% — 2 of ${timeSeriesModules}`;
  if (insights.completedCount('time-series', dashCourses[0]) !== 2) {
    return `${insights.completedCount('time-series', dashCourses[0])} modules counted from [0, 1, 1, 99]`;
  }
  if (insights.courseProgress('time-series', null) !== 0) return 'a pathway with no record reported progress';
  if (insights.courseProgress('not-a-course', dashCourses[3]) !== 0) return 'an unknown pathway reported progress';

  const roll = insights.pathwayProgress(dashCourses);
  if (roll.tracked !== 2) return `${roll.tracked} pathways tracked — saved or started only, and never the unknown one`;
  if (roll.total !== timeSeriesModules + dataEthicsModules) return `${roll.total} modules in the denominator`;
  if (roll.done !== 3) return `${roll.done} modules done, expected 3`;
  if (roll.percent !== Math.round((3 / (timeSeriesModules + dataEthicsModules)) * 100)) return `the metric reads ${roll.percent}%`;
  const untouched = insights.pathwayProgress([dashCourses[2]]);
  if (untouched.tracked !== 0 || untouched.percent !== 0) return `an unopened pathway produced ${JSON.stringify(untouched)}`;
});

check('the recommendations are ordered by what scored weakest, and say so in numbers', () => {
  const recs = insights.recommended(dashRollup, dashCourses);
  if (recs.length !== courseLib.courseFacts.length) return `${recs.length} recommendations for ${courseLib.courseFacts.length} pathways`;
  if (recs[0].id !== 'time-series') return `the first card is ${recs[0].id}, but inference scored 41%`;
  if (recs[0].competency !== 'inference') return `the first card builds ${recs[0].competency}`;
  if (recs[1].id !== 'r-programming') return `the second card is ${recs[1].id}, but digital-tools is the other focus`;
  if (recs[2].id !== 'data-ethics') return `the strong competency's pathway is not last: ${recs.map((rec) => rec.id).join(' → ')}`;
  if (recs[0].tag !== 'Recommended') return `the weakest pathway is badged "${recs[0].tag}"`;
  if (recs[2].tag !== 'In progress') return `a started pathway is badged "${recs[2].tag}"`;
  if (!recs[0].why.includes('41%')) return `the reason reads "${recs[0].why}"`;
  if (!recs[0].why.includes('22 question')) return `the reason does not say how many questions: "${recs[0].why}"`;
  if (!recs[0].why.toLowerCase().includes(taxonomy.bandLabels['needs-work'].toLowerCase())) {
    return `the reason omits the band: "${recs[0].why}"`;
  }
  if (recs[0].percent !== Math.round((2 / timeSeriesModules) * 100)) return `the card's progress bar reads ${recs[0].percent}%`;
  // An account with nothing measured gets the catalogue, in its own order, with no claims.
  const cold = insights.recommended(emptyDashRollup(), []);
  if (cold.length !== courseLib.courseFacts.length) return `${cold.length} cards for a new account`;
  if (cold.some((rec) => rec.why !== '')) return `a new account was told why: "${cold.find((rec) => rec.why !== '').why}"`;
  if (cold.some((rec) => rec.tag === 'Recommended')) return 'a new account had a pathway recommended on no evidence';
  if (cold.some((rec) => rec.percent !== 0)) return 'a new account had progress on a pathway';
});

check('the signal card names the real gap, and goes somewhere real', () => {
  const sig = insights.signal(dashRollup);
  if (!sig) return 'a measured account got no signal';
  if (!sig.headline.includes('Data quality')) return `the headline reads "${sig.headline}"`;
  if (!sig.detail.includes('90%') || !sig.detail.includes('41%')) return `the detail reads "${sig.detail}"`;
  if (!sig.detail.includes('49 point')) return `the gap is not stated: "${sig.detail}"`;
  if (sig.href !== '/courses/time-series') return `the button goes to ${sig.href}`;
  if (!courseLib.courseFactsFor(sig.href.replace('/courses/', ''))) return `the button goes to a pathway that does not exist: ${sig.href}`;
  if (insights.signal(emptyDashRollup()) !== null) return 'a new account was given a signal about nothing';
  const single = insights.signal({ ...emptyDashRollup(), attempts: 1, competencies: [dashRollup.competencies[0]] });
  if (!single) return 'one measured competency produced no signal';
  if (single.detail.includes('gap')) return `one competency claimed a gap: "${single.detail}"`;
});

check('the note at the top says what is measured, including when nothing is', () => {
  const cold = insights.dashboardNote(emptyDashRollup());
  if (!cold.includes('Take your first assessment to generate your learning profile.')) return `a new account is told "${cold}"`;
  const warm = insights.dashboardNote(dashRollup);
  if (!warm.includes('Inference')) return `the note does not name the weakest competency: "${warm}"`;
  if (!warm.includes('41%')) return `the note does not carry the number: "${warm}"`;
  const clean = insights.dashboardNote({ ...dashRollup, focus: [] });
  if (clean.includes('weakest')) return `an account with no weak band is told "${clean}"`;
  if (!clean.includes('96')) return `the note drops the question count: "${clean}"`;
});

check('the dates on screen are the dates in the data', () => {
  if (insights.quarterLabel(DASH_NOW) !== 'Q3 2026') return `the eyebrow reads ${insights.quarterLabel(DASH_NOW)}`;
  if (insights.quarterLabel(new Date(2026, 0, 4)) !== 'Q1 2026') return 'January is not Q1';
  if (insights.quarterLabel(new Date(2026, 11, 31)) !== 'Q4 2026') return 'December is not Q4';
  if (insights.longDate(dashHistory[0].at) !== '10 Sep 2026') return `the footer reads "${insights.longDate(dashHistory[0].at)}"`;
  if (insights.shortDate(dashHistory[0].at) !== '10 Sep') return `the row reads "${insights.shortDate(dashHistory[0].at)}"`;
  if (insights.longDate(null) !== '') return 'a missing date printed something';
  if (insights.shortDate('not a date') !== '') return 'an unparseable date printed something';
});
if (failed > 0) {
  console.log('  Failures:');
  for (const failure of failures) console.log(`    - ${failure}`);
  console.log('');
}
process.exit(failed > 0 ? 1 : 0);
