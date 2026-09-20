/**
 * Renders the CatalogCourse *ready* branch and asserts an object is never handed
 * to React as a child.
 *
 * Why this exists: render-test.mjs renders /catalog/:id but only ever reaches the
 * loading state, because useEffect does not run during server rendering and the
 * course is fetched in an effect. So the half of the page that lists modules and
 * lessons — the `.map` over the course tree — was never exercised by any test, and
 * a real bug shipped there: the module *count* line rendered `{course.modules}`,
 * the whole array of module objects, which React refuses with "Objects are not
 * valid as a React child (found: object with keys {moduleId, title, ...})".
 *
 * Run it with scripts/catalog-ready-test.sh, which compiles src/ to plain JS,
 * drops in a hook shim that seeds CatalogCourse straight into its ready state, and
 * passes the output directory in as argv[2]. The data is the committed fixture
 * course, so this needs no live dataset and no network.
 *
 * The tool is renderToStaticMarkup from react-dom/server, not createElement:
 * createElement only builds an element tree and never checks whether a child is a
 * valid node, so a createElement harness renders the bug without complaint.
 * renderToStaticMarkup runs the same child validation the browser does, so it
 * throws on the bug exactly as the app did.
 */

import { renderToStaticMarkup } from 'react-dom/server';
import { jsx } from 'react/jsx-runtime';
import { Router as WouterRouter } from 'wouter';

const OUT = process.argv[2];
if (!OUT) {
  console.error('usage: node catalog-ready-test.mjs <compiled-src-dir>');
  process.exit(2);
}

/** Vite replaces import.meta.env at build; the compile step rewrites it to this. */
globalThis.__VITE_ENV__ = {
  BASE_URL: '/',
  DEV: false,
  VITE_API_URL: 'http://127.0.0.1:4000',
  VITE_REQUIRE_AUTH: 'true',
};

/** pdfjs-dist prints a legacy-build notice at import; it is noise here. */
const warn = console.warn;
console.warn = (...args) => {
  if (String(args[0] ?? '').includes('legacy')) return;
  warn(...args);
};

const { CatalogCourse } = await import(`${OUT}/pages/demo-pages.js`);
const { __seed } = await import(`${OUT}/react-hooks-shim.js`);
/** The server reader is the source of the exact shape the browser client receives. */
const { catalogue, getCourse } = await import(new URL('../server/courses.mjs', import.meta.url).href);
console.warn = warn;

let pass = 0;
let fail = 0;
function check(name, condition) {
  if (condition) { pass += 1; console.log(`  ok    ${name}`); }
  else { fail += 1; console.log(`  FAIL  ${name}`); }
}

/** React escapes text before it reaches markup; match its escaping to search it. */
function esc(text) {
  return String(text)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#x27;');
}

const cat = catalogue();
if (!cat.available || cat.courses.length === 0) {
  console.error('  no fixture course found — is NEXORA_DATASET_DIR pointed at the fixture?');
  process.exit(2);
}

console.log('\n  Rendering the CatalogCourse ready branch (server-side child validation)\n');

/*
 * First prove the check has teeth. The bug was rendering the modules array itself
 * as a child; this is that exact shape. If renderToStaticMarkup ever stops
 * validating children, this passes silently and the real assertions below would
 * mean nothing — so assert the throw, and that its message is the one users saw.
 */
const sample = getCourse(cat.courses[0].courseId);
let teeth = '';
try {
  renderToStaticMarkup(jsx('div', { children: sample.modules }));
} catch (error) {
  teeth = String(error?.message ?? error);
}
check('a modules array handed to React as a child throws (the harness has teeth)', /not valid as a React child/i.test(teeth));
check('the throw names the moduleId object, i.e. the exact error users hit', /moduleId/.test(teeth));

/*
 * Now the real thing: drive CatalogCourse to its ready state with real course data
 * and render it. The shim seeds the course and flips status to ready so the first
 * (and only) server render is the branch that lists modules and lessons. The bug
 * lived on the module-count line, so the assertion that matters most is simply
 * that this render does not throw.
 */
for (const summary of cat.courses) {
  const course = getCourse(summary.courseId);
  __seed(course);
  let html = '';
  let err = '';
  try {
    html = renderToStaticMarkup(jsx(WouterRouter, { ssrPath: `/catalog/${course.courseId}`, children: jsx(CatalogCourse, {}) }));
  } catch (error) {
    err = String(error?.message ?? error);
  }

  check(`[${course.courseId}] ready branch renders without an object-as-child throw`, err === '');
  if (err) { console.log(`        -> ${err}`); continue; }

  check(`[${course.courseId}] the course title renders`, html.includes(esc(course.title)));
  check(`[${course.courseId}] the module count renders as a number ("${course.modules.length} modules")`, html.includes(`${course.modules.length} modules`));
  check(`[${course.courseId}] the lesson count renders ("${course.lessons} lessons")`, html.includes(`${course.lessons} lessons`));
  check(`[${course.courseId}] no module or lesson object leaked as "[object Object]"`, !html.includes('[object Object]'));

  const firstModule = course.modules[0];
  if (firstModule?.title) check(`[${course.courseId}] the first module title renders`, html.includes(esc(firstModule.title)));
  const firstLesson = firstModule?.lessons?.[0];
  if (firstLesson?.title) check(`[${course.courseId}] the first lesson title renders`, html.includes(esc(firstLesson.title)));

  check(`[${course.courseId}] the page is fully composed (back link + progress donut)`, html.includes('link-back-catalog') && html.includes('% complete'));
}

console.log(`\n  ${pass} passed, ${fail} failed\n`);
process.exit(fail === 0 ? 0 : 1);
