/**
 * Tests the browser progress client against the real server.
 *
 * Usage:  node scripts/client-test.mjs <compiled-out-dir> <base-url>
 *         (or, more usefully:  npm run client:test)
 *
 * `server/smoke-test.sh` proves the API behaves. `scripts/engine-test.mjs` proves
 * the question engine and the scorer behave. Neither proves the two halves agree:
 * a client that posts `questionCount` to an API expecting `total` passes both and
 * fails in the browser. So this harness imports the compiled `src/lib/progress.ts`
 * — the same module the pages import — and calls it against a live server.
 *
 * The one thing it cannot use is the browser's cookie jar, so `fetch` is wrapped
 * below to carry Set-Cookie between calls. That wrapper is the only simulated part;
 * the module under test, the requests it builds and the server answering them are
 * all real.
 */

const [OUT, BASE] = process.argv.slice(2);
if (!OUT || !BASE) {
  console.error('usage: node scripts/client-test.mjs <compiled-out-dir> <base-url>');
  process.exit(2);
}

/* ------------------------------------------------------------ browser shims */

// auth.js reads import.meta.env at module scope, which compile-src.sh rewrote to
// this global. It has to exist before the import below, not after.
globalThis.__VITE_ENV__ = { VITE_API_URL: BASE, VITE_REQUIRE_AUTH: 'true', BASE_URL: '/' };

const jar = new Map();
const realFetch = globalThis.fetch;

/**
 * A cookie jar, because Node's fetch ignores `credentials: 'include'`.
 *
 * Deliberately thin: it stores name=value and sends them back. It does not honour
 * Path, Domain, Max-Age or Expires, so it must never be used to assert anything
 * about cookie policy — `server/smoke-test.sh` does that with curl, which does
 * implement them.
 */
globalThis.fetch = async (url, init = {}) => {
  const headers = new Headers(init.headers ?? {});
  if (jar.size > 0) headers.set('cookie', [...jar].map(([k, v]) => `${k}=${v}`).join('; '));
  // A browser always sends Origin on a cross-origin call; the server's allow-list
  // checks it, so omitting it here would skip a control the real app must satisfy.
  headers.set('origin', 'http://localhost:5173');

  const response = await realFetch(url, { ...init, headers });
  for (const line of response.headers.getSetCookie?.() ?? []) {
    const [pair] = line.split(';');
    const eq = pair.indexOf('=');
    if (eq < 1) continue;
    const name = pair.slice(0, eq).trim();
    const value = pair.slice(eq + 1).trim();
    if (value === '' || /Max-Age=0/i.test(line)) jar.delete(name);
    else jar.set(name, value);
  }
  return response;
};

/* --------------------------------------------------------- modules under test */

const realWarn = console.warn;
console.warn = () => {};
const auth = await import(`${OUT}/lib/auth.js`);
const progress = await import(`${OUT}/lib/progress.js`);
const materials = await import(`${OUT}/lib/materials.js`);
const scoring = await import(`${OUT}/lib/scoring.js`);
const assessment = await import(`${OUT}/lib/assessment.js`);
const papers = await import(`${OUT}/lib/papers.js`);
const courseContent = await import(`${OUT}/lib/course-content.js`);
console.warn = realWarn;

/**
 * Not a module under test: the server's own item bank, imported for its answer key.
 *
 * A perfect sitting cannot be built without knowing which option is right, and the key
 * exists in exactly one place — which is the entire point of the design, so reaching
 * across for it here is the honest way to sit the paper rather than a shortcut. If this
 * import could be replaced by one from `${OUT}/lib/`, the assessment would be back in
 * the browser bundle and `scripts/render-test.mjs` would be failing.
 */
const exam = await import(new URL('../server/assessment.mjs', import.meta.url).href);

let passed = 0;
let failed = 0;
const failures = [];

async function check(name, run) {
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

function section(title) {
  console.log(`\n  -- ${title} ${'-'.repeat(Math.max(0, 58 - title.length))}`);
}

/** Assert and return, so a value can be checked and reused in one expression. */
function must(condition, message) {
  if (!condition) throw new Error(message);
}

const account = {
  name: 'Client Harness',
  email: `harness.${Date.now().toString(36)}@example.gov`,
  // Must not contain the full name or the email local part — server/auth.mjs
  // rejects both, and the first draft of this fixture tripped that rule.
  password: 'a long enough passphrase for tests',
};

console.log(`\n  Progress client against a live server\n  ====================================\n`);
console.log(`  module: ${OUT}/lib/progress.js\n  server: ${BASE}\n`);

section('before signing in');

await check('fetchProgress surfaces the 401 rather than hanging', async () => {
  try {
    await progress.fetchProgress();
    return 'the call resolved while signed out';
  } catch (error) {
    must(error instanceof auth.AuthError, `threw ${error?.name}, not AuthError`);
    must(error.status === 401, `status was ${error.status}, wanted 401`);
    return true;
  }
});

await check('emptyRollup matches what a new account gets', () => {
  const empty = progress.emptyRollup();
  must(empty.band === 'unrated', `band was ${empty.band}`);
  must(empty.attempts === 0 && empty.questions === 0, 'counts were not zero');
  must(Array.isArray(empty.topics) && empty.topics.length === 0, 'topics was not an empty list');
  return true;
});

section('signing in');

await check('signup returns the account', async () => {
  const user = await auth.signup(account);
  must(user.email === account.email.toLowerCase(), `email came back as ${user.email}`);
  must(!('passwordHash' in user), 'the account object carries a password hash');
  return true;
});

await check('the empty account reads as unrated, not as an error', async () => {
  const bundle = await progress.fetchProgress();
  must(bundle.progress.attempts === 0, `attempts was ${bundle.progress.attempts}`);
  must(bundle.progress.band === 'unrated', `band was ${bundle.progress.band}`);
  must(bundle.preferences.language === 'English', `language was ${bundle.preferences.language}`);
  must(bundle.preferences.demoLabels === true, 'demoLabels did not default to on');
  must(bundle.courses.length === 0 && bundle.history.length === 0, 'a new account already had records');
  return true;
});

await check('the shape the client declares is the shape the server sends', async () => {
  const bundle = await progress.fetchProgress();
  const wanted = Object.keys(progress.emptyRollup()).sort();
  const got = Object.keys(bundle.progress).sort();
  must(
    wanted.length === got.length && wanted.every((key, i) => key === got[i]),
    `client expects [${wanted}], server sent [${got}]`,
  );
  return true;
});

section('a real paper, end to end');

// Document text -> questions -> answers -> grading -> payload -> server. Every step
// is the real module; nothing between them is stubbed.
const paper = materials.analyzeMaterial(materials.sampleMaterialText, 1);
const answers = paper.questions.map((question, index) =>
  index % 3 === 0 ? question.correct : (question.correct + 1) % 4,
);
const graded = scoring.gradeAttempt(paper.questions, answers);
const payload = scoring.toAttemptPayload(graded, {
  source: 'material',
  label: 'Sampling and estimation primer.pdf',
  durationSeconds: 512,
});

await check('the analyzer produced at least 10 questions', () =>
  paper.questions.length >= 10 ? true : `only ${paper.questions.length} questions`,
);

await check('the payload carries counts and topic names, and nothing else', () => {
  const serialised = JSON.stringify(payload);
  for (const question of paper.questions) {
    // `question.q` is the stem and `question.a` the options. Reading a field the type
    // does not have — `question.stem` was the first draft — makes `includes(undefined)`
    // search for the literal string "undefined", which passes whatever the payload holds.
    must(typeof question.q === 'string' && question.q.length > 0, 'the question stem is not where this check thinks it is');
    must(!serialised.includes(question.q), 'a question stem is in the payload');
    must(!serialised.includes(question.source), 'a source sentence is in the payload');
    // Not asserted: the options. A cloze question's options *are* topic terms, and
    // topic names are exactly what the payload is supposed to carry, so "no option
    // appears" would be false by design rather than a leak.
  }
  const allowed = new Set([
    'source', 'label', 'total', 'correct', 'percent', 'band', 'durationSeconds', 'topics', 'competencyPercents',
  ]);
  const extra = Object.keys(payload).filter((key) => !allowed.has(key));
  must(extra.length === 0, `unexpected field(s): ${extra}`);
  return true;
});

let saved = null;
await check('saveAttempt stores it and returns a rollup', async () => {
  saved = await progress.saveAttempt(payload);
  must(saved.attempt.id.startsWith('att_'), `id was ${saved.attempt.id}`);
  must(saved.dropped === 0, `dropped ${saved.dropped} attempts on the first save`);
  must(saved.progress.attempts === 1, `rollup counted ${saved.progress.attempts} attempts`);
  return true;
});

await check('the server and the local scorer reach the same numbers', () => {
  must(saved.attempt.total === graded.total, `total ${saved.attempt.total} vs ${graded.total}`);
  must(saved.attempt.correct === graded.correct, `correct ${saved.attempt.correct} vs ${graded.correct}`);
  must(saved.attempt.percent === graded.percent, `percent ${saved.attempt.percent} vs ${graded.percent}`);
  must(saved.attempt.band === graded.band, `band ${saved.attempt.band} vs ${graded.band}`);
  return true;
});

await check('every locally graded topic came back with the same band', () => {
  for (const topic of graded.topics) {
    const stored = saved.attempt.topics.find((row) => row.topic === topic.topic.slice(0, 80));
    must(stored, `"${topic.topic}" is missing from the stored attempt`);
    must(stored.correct === topic.correct && stored.total === topic.total, `"${topic.topic}" counts differ`);
    must(stored.band === topic.band, `"${topic.topic}" band ${stored.band} vs ${topic.band}`);
  }
  return true;
});

await check('the weak topics the learner must revise survived the round trip', () => {
  must(graded.focus.length > 0, 'this answer pattern was meant to leave weak topics');
  const weakest = saved.progress.topics[0];
  must(weakest.band !== 'strong', `the worst stored topic came back as ${weakest.band}`);
  return true;
});

await check('a client that lies about its score is corrected, not believed', async () => {
  const lying = { ...payload, percent: 100, band: 'strong', label: 'Lying client' };
  const result = await progress.saveAttempt(lying);
  must(result.attempt.percent === graded.percent, `stored ${result.attempt.percent}, expected ${graded.percent}`);
  must(result.attempt.band === graded.band, `stored band ${result.attempt.band}`);
  return true;
});

section('history');

await check('fetchHistory returns both attempts, newest first', async () => {
  const page = await progress.fetchHistory();
  must(page.total === 2, `total was ${page.total}`);
  must(page.attempts[0].label === 'Lying client', `newest was "${page.attempts[0].label}"`);
  return true;
});

await check('limit is clamped by the server, not rejected', async () => {
  const page = await progress.fetchHistory(9999);
  must(page.limit === 200, `limit came back as ${page.limit}`);
  return true;
});

await check('a bad limit is a clear error, not a silent default', async () => {
  try {
    await progress.fetchHistory(0);
    return 'limit=0 was accepted';
  } catch (error) {
    must(error.status === 400, `status was ${error.status}`);
    return true;
  }
});

section('preferences and courses');

await check('savePreferences patches one field and leaves the rest', async () => {
  const { preferences } = await progress.savePreferences({ language: 'Hindi' });
  must(preferences.language === 'Hindi', `language came back as ${preferences.language}`);
  must(preferences.weeklyNote === true, 'weeklyNote was reset by a patch that never mentioned it');
  must(preferences.demoLabels === true, 'demoLabels was reset by a patch that never mentioned it');
  return true;
});

await check('an unsupported language is refused', async () => {
  try {
    await progress.savePreferences({ language: 'Klingon' });
    return 'Klingon was accepted';
  } catch (error) {
    must(error.status === 400, `status was ${error.status}`);
    return true;
  }
});

await check('saveCourse bookmarks a course and the server sets startedAt', async () => {
  const { course } = await progress.saveCourse({ courseId: 'time-series', saved: true, started: true });
  must(course.saved === true, 'saved did not stick');
  must(typeof course.startedAt === 'string' && course.startedAt.startsWith('20'), `startedAt was ${course.startedAt}`);
  return true;
});

await check('marking modules complete deduplicates and sorts them', async () => {
  const { course } = await progress.saveCourse({ courseId: 'time-series', completedModules: [2, 0, 2] });
  must(JSON.stringify(course.completedModules) === '[0,2]', `modules came back as ${JSON.stringify(course.completedModules)}`);
  return true;
});

await check('re-marking a started course keeps the original startedAt', async () => {
  const first = await progress.saveCourse({ courseId: 'time-series', started: true });
  const again = await progress.saveCourse({ courseId: 'time-series', started: true });
  must(first.course.startedAt === again.course.startedAt, 'startedAt moved on the second call');
  return true;
});

await check('everything persisted reads back on the next fetch', async () => {
  const bundle = await progress.fetchProgress();
  must(bundle.preferences.language === 'Hindi', `language was ${bundle.preferences.language}`);
  must(bundle.progress.attempts === 2, `attempts was ${bundle.progress.attempts}`);
  must(bundle.history.length === 2, `history held ${bundle.history.length}`);
  const course = bundle.courses.find((row) => row.courseId === 'time-series');
  must(course && course.saved === true, 'the bookmarked course was not in the bundle');
  return true;
});

section('clearing');

await check('clearHistory removes the attempts and nothing else', async () => {
  const { removed, progress: rollup } = await progress.clearHistory();
  must(removed === 2, `removed ${removed}`);
  must(rollup.attempts === 0 && rollup.band === 'unrated', 'the returned rollup was not empty');
  const bundle = await progress.fetchProgress();
  must(bundle.preferences.language === 'Hindi', 'clearing history also wiped the preferences');
  must(bundle.courses.length === 1, 'clearing history also wiped the saved courses');
  return true;
});

section('the assessment: dealt sealed, marked on the server');

/*
 * The history was cleared a moment ago, so this account holds nothing and every count
 * below is the assessment's own. Two sittings are submitted: a perfect one, which proves
 * the option-id round trip end to end, and a deliberately mixed one, which proves the
 * figures the report screens show are the server's even when they are not 100%.
 *
 * `server/smoke-test.sh` covers the same endpoints with curl. What it cannot cover is
 * this: that `src/lib/progress.ts` and `src/lib/assessment.ts` — the exact modules the
 * page imports — build a submission the server grades the way the page then reports it.
 */

const key = new Map(exam.answerKey().map((row) => [row.id, row.option]));

/** Where the right option landed on screen, per question, for a dealt paper. */
function rightPositions(paper) {
  return paper.questions.map((question) => question.options.findIndex((option) => option.id === key.get(question.id)));
}

/**
 * How many right options did *not* land back in their bank position.
 *
 * Every check below that claims to prove "graded by id, not by position" is worthless on
 * a paper dealt in bank order, where the two agree. This is what makes that visible.
 */
function moved(paper, positions) {
  return positions.filter((index, slot) => index !== exam.OPTION_IDS.indexOf(key.get(paper.questions[slot].id))).length;
}

let dealt = null;
let picks = null;
let marking = null;

await check('fetchAssessmentPaper deals a whole paper', async () => {
  dealt = await progress.fetchAssessmentPaper();
  must(dealt.questions.length === exam.ASSESSMENT_LENGTH, `dealt ${dealt.questions.length} of ${exam.ASSESSMENT_LENGTH}`);
  must(dealt.sections.length === exam.SECTIONS.length, `dealt ${dealt.sections.length} sections`);
  must(dealt.questionsPerSection === exam.QUESTIONS_PER_SECTION, `questionsPerSection was ${dealt.questionsPerSection}`);
  must(dealt.note === exam.ASSESSMENT_NOTE, 'the paper arrived without the disclaimer the page prints');
  must(dealt.questions.every((q) => q.options.length === exam.OPTION_IDS.length), 'a question arrived without four options');
  must(new Set(dealt.questions.map((q) => q.id)).size === dealt.questions.length, 'the same question was dealt twice');
  return true;
});

await check('what the client parsed carries no answer key', () => {
  const serialised = JSON.stringify(dealt);
  // Field names, quoted. An unquoted /correct/ matches scenario prose — an early version
  // of this probe did exactly that and reported a leak that was not there.
  for (const field of ['"correct"', '"correctOption"', '"explanation"', '"answer"', '"key"', '"right"']) {
    must(!serialised.includes(field), `the dealt paper carries ${field}`);
  }
  for (const question of dealt.questions) {
    for (const option of question.options) {
      const fields = Object.keys(option).sort().join(',');
      must(fields === 'id,text', `an option arrived as {${fields}}`);
    }
  }
  return true;
});

await check('a perfect sitting is marked 100%, by option id and not by position', async () => {
  picks = rightPositions(dealt);
  must(picks.every((index) => index >= 0), 'the key names an option that is not on the dealt paper');
  must(moved(dealt, picks) > 0, 'this deal left every right option in its bank position, so nothing was proven');

  const choices = assessment.toChoices(dealt, picks);
  must(choices.length === dealt.questions.length, `toChoices sent ${choices.length} answers`);
  must(choices.every((choice) => exam.OPTION_IDS.includes(choice.option)), 'toChoices sent something that is not an option id');

  marking = await progress.submitAssessment({ choices, durationSeconds: 754 });
  must(marking.result.percent === 100, `the server marked it ${marking.result.percent}%`);
  must(marking.result.correct === marking.result.total, `${marking.result.correct} of ${marking.result.total}`);
  must(marking.result.answered === marking.result.total, `answered ${marking.result.answered}`);
  must(marking.result.band === 'strong', `band was ${marking.result.band}`);
  return true;
});

await check('the key arrives with the marking and not before', () => {
  const marked = marking.result.questions;
  must(marked.length === exam.ASSESSMENT_LENGTH, `the marking covered ${marked.length} questions`);
  must(marked.every((row) => row.right === true), 'a question in a perfect sitting came back wrong');
  must(marked.every((row) => row.chosen === row.correctOption), 'the marking records a choice this harness never made');
  must(marked.every((row) => typeof row.explanation === 'string' && row.explanation.length > 20), 'a marked question came back without its explanation');
  return true;
});

await check('the sitting is stored as an assessment, with no question text', async () => {
  must(marking.attempt.source === 'assessment', `stored source was ${marking.attempt.source}`);
  must(marking.attempt.percent === 100, `stored percent was ${marking.attempt.percent}`);
  must(marking.attempt.durationSeconds === 754, `stored duration was ${marking.attempt.durationSeconds}`);
  must(marking.progress.attempts === 1, `the rollup counted ${marking.progress.attempts} attempts`);
  must(marking.progress.topics.length === exam.SECTIONS.length, `the rollup held ${marking.progress.topics.length} topics`);
  must(marking.progress.topics.every((row) => row.band === 'strong'), 'a topic in a perfect sitting is not strong');
  const stored = JSON.stringify(marking.attempt);
  must(dealt.questions.every((question) => !stored.includes(question.q)), 'a scenario was stored with the attempt');
  return true;
});

await check('the report is rebuilt at the position the learner saw', () => {
  const rebuilt = assessment.rebuildPaper(dealt, marking.result);
  must(rebuilt.length === dealt.questions.length, `rebuilt ${rebuilt.length} questions`);
  must(rebuilt.every((question, index) => question.q === dealt.questions[index].q), 'the rebuilt paper is in a different order than the dealt one');
  must(rebuilt.every((question, index) => question.correct === picks[index]), 'a rebuilt question points at an option the learner did not click');
  must(rebuilt.every((question) => question.explanation.length > 20), 'a rebuilt question lost its explanation');
  const local = scoring.gradeAttempt(rebuilt, picks);
  must(local.percent === 100, `grading the rebuilt paper locally gave ${local.percent}%`);
  const shown = assessment.adoptServerScore(local, marking.result);
  must(shown.percent === marking.result.percent, `the screen would show ${shown.percent}% for a stored ${marking.result.percent}%`);
  must(shown.band === marking.result.band, `the screen would show ${shown.band} for a stored ${marking.result.band}`);
  return true;
});

await check('a mixed sitting: the server and the report on screen reach the same numbers', async () => {
  const second = await progress.fetchAssessmentPaper();
  const right = rightPositions(second);
  must(moved(second, right) > 0, 'this deal left every right option in its bank position, so nothing was proven');

  // Right on every third question, wrong on the rest, first one left blank — so the score
  // is neither 0 nor 100, the topics do not all band alike, and an unanswered question has
  // to survive the round trip as unanswered rather than as a wrong guess or a gap.
  const chosen = second.questions.map((question, index) => {
    if (index === 0) return null;
    return index % 3 === 0 ? right[index] : (right[index] + 1) % question.options.length;
  });
  const expected = chosen.filter(
    (pick, index) => pick !== null && second.questions[index].options[pick].id === key.get(second.questions[index].id),
  ).length;
  must(expected > 0 && expected < second.questions.length, `this pattern scored ${expected} of ${second.questions.length}`);

  const outcome = await progress.submitAssessment({
    choices: assessment.toChoices(second, chosen),
    durationSeconds: 402,
  });
  must(outcome.result.correct === expected, `the server counted ${outcome.result.correct}, the harness expected ${expected}`);
  must(outcome.result.answered === second.questions.length - 1, `answered ${outcome.result.answered}`);
  must(
    outcome.result.percent === Math.round((expected / second.questions.length) * 100),
    `percent came back as ${outcome.result.percent}`,
  );
  must(
    outcome.result.questions.some((row) => row.chosen === null && row.right === false),
    'the unanswered question was not recorded as unanswered',
  );

  // The one that matters: what the page would print, against what the server stored.
  const local = scoring.gradeAttempt(assessment.rebuildPaper(second, outcome.result), chosen);
  must(local.correct === outcome.result.correct, `the report counted ${local.correct}, the server ${outcome.result.correct}`);
  must(local.percent === outcome.result.percent, `report ${local.percent}% vs stored ${outcome.result.percent}%`);
  must(local.band === outcome.result.band, `report band ${local.band} vs stored ${outcome.result.band}`);
  for (const topic of outcome.result.topics) {
    const mine = local.topics.find((row) => row.topic === topic.topic);
    must(mine, `"${topic.topic}" is missing from the report`);
    must(mine.correct === topic.correct && mine.total === topic.total, `"${topic.topic}" counts differ`);
    must(mine.band === topic.band, `"${topic.topic}" banded ${mine.band} on screen, ${topic.band} on the server`);
  }
  return true;
});

await check('an assessment posted to the quiz route is refused, with a code the page can read', async () => {
  try {
    await progress.saveAttempt({ ...payload, source: 'assessment', label: 'Filed by hand' });
    return 'a hand-filed assessment was stored';
  } catch (error) {
    must(error.status === 400, `status was ${error.status}`);
    must(error.code === 'grade_on_server', `code was ${error.code}`);
    return true;
  }
});

await check('both sittings are in the history, newest first, as assessments', async () => {
  const page = await progress.fetchHistory();
  must(page.total === 2, `total was ${page.total}`);
  must(page.attempts.every((row) => row.source === 'assessment'), 'a stored row is not an assessment');
  // The mixed sitting was submitted second and scored below 100, so this is ordering and
  // "the refused post really was refused" in one assertion.
  must(page.attempts[0].percent < page.attempts[1].percent, `newest was ${page.attempts[0].percent}%`);
  return true;
});

section('saved question sets');

/** Built here rather than generated, so the assertions below are about the round trip. */
function samplePaper(count) {
  return Array.from({ length: count }, (unused, index) => ({
    q: `What does indicator ${index + 1} measure?`,
    a: [`Answer ${index + 1}A`, `Answer ${index + 1}B`, `Answer ${index + 1}C`, `Answer ${index + 1}D`],
    correct: index % 4,
    topic: index % 2 === 0 ? 'Price Indices' : 'Sampling',
    kind: 'statement',
    explanation: `Because the passage defines indicator ${index + 1} that way.`,
    source: `Indicator ${index + 1} is defined in the source document.`,
    sourceIndex: index,
  }));
}

let savedId = '';

await check('the cap the page prints is the cap the server enforces', async () => {
  // The number is written in two files that cannot import each other. If they ever
  // disagree, the page states a limit the learner will not actually hit.
  const server = await import(new URL('../server/papers.mjs', import.meta.url).href);
  must(
    papers.MAX_SAVED_PAPERS === server.PAPER_LIMITS.maxPerUser,
    `client says ${papers.MAX_SAVED_PAPERS}, server enforces ${server.PAPER_LIMITS.maxPerUser}`,
  );
  return true;
});

await check('a generated set is saved and comes back with a server id', async () => {
  const saved = await papers.savePaper({ title: 'CPI brief.pdf', difficulty: 'hard', questions: samplePaper(6) });
  must(saved.id.startsWith('pap_'), `id was ${saved.id}`);
  must(saved.count === 6, `count was ${saved.count}`);
  must(saved.difficulty === 'hard', `difficulty was ${saved.difficulty}`);
  // The topics are derived by the server from the questions, not sent by the client.
  must(saved.topics.includes('Price Indices') && saved.topics.includes('Sampling'), `topics were ${saved.topics}`);
  must(typeof saved.createdAt === 'string' && saved.createdAt !== '', 'no createdAt came back');
  savedId = saved.id;
  return true;
});

await check('the list carries the summary but not the questions', async () => {
  const list = await papers.listPapers();
  must(list.length === 1, `list held ${list.length}`);
  must(list[0].id === savedId, 'the saved id is not in the list');
  // A list of sixty papers should not ship sixty answer keys to render six cards.
  must(!('questions' in list[0]), 'the summary carried its questions');
  return true;
});

await check('opening one returns the questions, answers and explanations intact', async () => {
  const paper = await papers.getPaper(savedId);
  must(paper.questions.length === 6, `questions were ${paper.questions.length}`);
  const [first] = paper.questions;
  must(first.q === 'What does indicator 1 measure?', `stem was ${first.q}`);
  must(first.a.length === 4, `options were ${first.a.length}`);
  must(first.correct === 0, `correct was ${first.correct}`);
  // The answer key and the reason are the whole point of saving: a set that came back
  // without them would still pass a count check and be useless to review from.
  must(first.explanation.includes('defines indicator 1'), `explanation was ${first.explanation}`);
  must(first.source.includes('Indicator 1'), `source was ${first.source}`);
  return true;
});

await check('a set with a three-option question is refused, not stored half-formed', async () => {
  const broken = samplePaper(1);
  broken[0].a = ['only', 'three', 'options'];
  try {
    await papers.savePaper({ title: 'Broken', questions: broken });
    return 'the malformed set was accepted';
  } catch (error) {
    must(error.status === 400, `status was ${error.status}`);
    must(error.code === 'invalid_input', `code was ${error.code}`);
    return true;
  }
});

await check('an answer index outside the options is refused', async () => {
  const broken = samplePaper(1);
  broken[0].correct = 7;
  try {
    await papers.savePaper({ title: 'Broken', questions: broken });
    return 'an out-of-range answer key was accepted';
  } catch (error) {
    must(error.status === 400, `status was ${error.status}`);
    return true;
  }
});

await check('deleting one removes it and leaves the account readable', async () => {
  await papers.deletePaper(savedId);
  const list = await papers.listPapers();
  must(list.length === 0, `list still held ${list.length}`);
  return true;
});

await check('deleting a paper that is gone is a 404, not a silent success', async () => {
  try {
    await papers.deletePaper(savedId);
    return 'deleting a missing paper reported success';
  } catch (error) {
    must(error.status === 404, `status was ${error.status}`);
    return true;
  }
});

section('signing out');

await check('after logout the client is told 401, not given stale data', async () => {
  await auth.logout();
  try {
    await progress.fetchProgress();
    return 'progress was still readable after logout';
  } catch (error) {
    must(error.status === 401, `status was ${error.status}`);
    return true;
  }
});

await check('a save attempted after logout fails loudly', async () => {
  try {
    await progress.saveAttempt(payload);
    return 'the attempt was accepted with no session';
  } catch (error) {
    must(error.status === 401, `status was ${error.status}`);
    return true;
  }
});

await check('signing back in returns the same account, with its records', async () => {
  await auth.login({ email: account.email, password: account.password });
  const bundle = await progress.fetchProgress();
  must(bundle.preferences.language === 'Hindi', `language was ${bundle.preferences.language}`);
  must(bundle.courses.length === 1, `courses held ${bundle.courses.length}`);
  // The two sittings outlived the session that produced them, which is the difference
  // between storage on the server and state in a tab.
  must(bundle.progress.attempts === 2, `attempts was ${bundle.progress.attempts}`);
  must(bundle.history.every((row) => row.source === 'assessment'), 'a stored row came back as something else');
  return true;
});

section('dataset courses: catalogue, content and lesson completion');

/*
 * The other half of the courses feature: the read-only dataset client
 * (src/lib/course-content.ts) and the completion percentage the course page shows.
 * The server was started with NEXORA_DATASET_DIR pointing at server/course-fixtures,
 * so fetchCatalogue and fetchCourse run against a real reader over real files. This
 * account is signed in again from the section above, so saveCourse can record which
 * lessons are done — the number the donut divides into the course's real lessons.
 *
 * server/smoke-test.sh proves the endpoints; what this adds is that the exact module
 * the page imports parses those responses and computes the same percentage.
 */

let datasetDetail = null;
await check('fetchCatalogue lists the fixture course served from disk', async () => {
  const cat = await courseContent.fetchCatalogue();
  must(cat.available === true, 'the catalogue reports no dataset present');
  must(cat.total >= 1, `catalogue held ${cat.total} courses`);
  const row = cat.courses.find((course) => course.courseId === 'demo-open-stats');
  must(row, 'the fixture course is not in the catalogue');
  must(row.lessons === 2, `the course reported ${row.lessons} lessons`);
  return true;
});

await check('fetchCourse returns the module tree, in order, with content flags', async () => {
  datasetDetail = await courseContent.fetchCourse('demo-open-stats');
  must(datasetDetail.modules.length === 1, `got ${datasetDetail.modules.length} modules`);
  must(
    JSON.stringify(datasetDetail.lessonIds) === '["les-01-sampling","les-02-quality"]',
    `lessonIds were ${JSON.stringify(datasetDetail.lessonIds)}`,
  );
  must(datasetDetail.modules[0].lessons.every((lesson) => lesson.hasContent === true), 'a lesson reported no file on disk');
  return true;
});

await check('completionPercent is 0 before any lesson is marked', () => {
  must(courseContent.completionPercent(datasetDetail.lessonIds, []) === 0, 'an untouched course was not 0%');
  must(courseContent.completionPercent(datasetDetail.lessonIds, undefined) === 0, 'undefined completed was not 0%');
  return true;
});

await check('marking one of two lessons round-trips and measures 50%', async () => {
  const { course } = await progress.saveCourse({ courseId: 'demo-open-stats', started: true, completedLessons: ['les-01-sampling'] });
  must(JSON.stringify(course.completedLessons) === '["les-01-sampling"]', `stored ${JSON.stringify(course.completedLessons)}`);
  must(courseContent.completionPercent(datasetDetail.lessonIds, course.completedLessons) === 50, 'one of two lessons was not 50%');
  must(courseContent.completedCount(datasetDetail.lessonIds, course.completedLessons) === 1, 'completedCount was not 1');
  return true;
});

await check('marking both is 100%, and a stale lesson id cannot exceed it', async () => {
  const { course } = await progress.saveCourse({ courseId: 'demo-open-stats', completedLessons: ['les-02-quality', 'les-01-sampling', 'les-01-sampling'] });
  must(JSON.stringify(course.completedLessons) === '["les-01-sampling","les-02-quality"]', `stored ${JSON.stringify(course.completedLessons)}`);
  must(courseContent.completionPercent(datasetDetail.lessonIds, course.completedLessons) === 100, 'both lessons was not 100%');
  // The guard that matters: an id left over from a rebuilt course must not count.
  must(
    courseContent.completionPercent(datasetDetail.lessonIds, [...course.completedLessons, 'les-99-ghost']) === 100,
    'a stale id pushed the percentage past 100',
  );
  return true;
});

await check('contentUrl addresses the streaming route for a lesson file', () => {
  const url = courseContent.contentUrl('demo-open-stats', 'content/lesson-01-sampling.txt');
  must(url.includes('/api/courses/content'), `url was ${url}`);
  must(url.includes('id=demo-open-stats'), 'the url does not carry the course id');
  must(url.includes('file=content'), 'the url does not carry the file path');
  return true;
});

/* ------------------------------------------------------------------- summary */

console.log(`\n  ====================================`);
console.log(`  ${passed} passed, ${failed} failed\n`);
if (failed > 0) {
  for (const line of failures) console.log(`  - ${line}`);
  console.log('');
}
process.exit(failed === 0 ? 0 : 1);

