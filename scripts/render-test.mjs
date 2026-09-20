/**
 * Renders the real route table from src/App.tsx and asserts what comes out.
 *
 * Run it with scripts/render-test.sh, which compiles src/ to plain JS first and
 * passes the output directory in as argv[1].
 *
 * Why server-rendering instead of a browser: it needs no browser, no test
 * runner and no extra dependency, and it still proves the things that actually
 * break — that every route resolves, that the gate lets nothing through when
 * signed out, and that the signed-in name really comes from the session.
 *
 * What it cannot prove: anything that only happens in an effect or on a click.
 * useEffect does not run during server rendering, which is exactly why the
 * session is injected through SessionContext here rather than fetched.
 */

import { createElement as h } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const OUT = process.argv[2];
if (!OUT) {
  console.error('usage: node render-test.mjs <compiled-src-dir>');
  process.exit(2);
}

/**
 * Vite replaces import.meta.env at build time; plain Node has no such thing, so
 * the compile step rewrites it to this global. Set before the app modules load.
 */
globalThis.__VITE_ENV__ = {
  BASE_URL: '/',
  DEV: false,
  VITE_API_URL: process.env.VITE_API_URL ?? 'http://127.0.0.1:4000',
  VITE_REQUIRE_AUTH: process.env.VITE_REQUIRE_AUTH ?? 'true',
};

/**
 * pdfjs-dist prints "Please use the legacy build in Node.js environments" the
 * moment it is imported, because src/lib/materials.ts loads it at module scope.
 * It has nothing to do with rendering, so it is dropped rather than left to look
 * like a test failure. Every other warning still comes through.
 */
const warn = console.warn;
console.warn = (...args) => {
  if (String(args[0] ?? '').includes('legacy')) return;
  warn(...args);
};

const { Router } = await import(`${OUT}/App.js`);
const { SessionContext } = await import(`${OUT}/components/session-provider.js`);
const { Router: WouterRouter } = await import('wouter');
console.warn = warn;

/**
 * The real item bank, imported from the server so the leak checks below are looking
 * for the actual scenarios rather than a fixture that resembles them. `src/` no longer
 * contains a single question, which is the point of importing it from here.
 */
const paperSource = await import(new URL('../server/assessment.mjs', import.meta.url).href);

/* ------------------------------------------------------------------ harness */

let pass = 0;
let fail = 0;

function check(name, condition) {
  if (condition) {
    pass += 1;
    console.log(`  ok    ${name}`);
  } else {
    fail += 1;
    console.log(`  FAIL  ${name}`);
  }
}

/** React 19 emits camelCase attributes server-side, so match case-insensitively. */
function has(html, needle) {
  return html.toLowerCase().includes(String(needle).toLowerCase());
}

/**
 * React escapes text before it reaches the markup, so a question containing an
 * apostrophe is never in the HTML verbatim. Asserting on raw question text would
 * therefore fail for the wrong reason — or worse, a `not present` assertion would
 * pass for the wrong reason. This mirrors React's own text escaping.
 */
function esc(text) {
  return String(text)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#x27;');
}

const ACCOUNT = {
  id: 'u_test',
  name: 'Ravi Kumar Menon',
  email: 'ravi.menon@mospi.gov.in',
  role: 'learner',
  createdAt: '2026-09-05T00:00:00.000Z',
  lastLoginAt: null,
};

function session(status, user = null, problem = '') {
  return {
    status,
    user,
    problem,
    refresh: async () => {},
    adopt: () => {},
    signOut: async () => {},
  };
}

function render(path, value) {
  return renderToStaticMarkup(
    h(SessionContext.Provider, { value }, h(WouterRouter, { ssrPath: path }, h(Router, null))),
  );
}

const SIGNED_IN = session('signed-in', ACCOUNT);
const SIGNED_OUT = session('signed-out');
const CHECKING = session('checking');
const UNREACHABLE = session('unreachable', null, 'Cannot reach the auth server at http://127.0.0.1:4000.');

/** The sidebar only exists inside AppShell, so this is the tell for "gated page". */
const SIDEBAR = 'data-testid="link-nav-overview"';

console.log(`\n  Rendering the real route table from src/App.tsx\n  gate: ${process.env.VITE_REQUIRE_AUTH === 'false' ? 'OFF (VITE_REQUIRE_AUTH=false)' : 'ON'}\n`);

const GATE_OFF = process.env.VITE_REQUIRE_AUTH === 'false';

/* Every route in src/App.tsx, with a string only that page produces. Proves the
 * route resolved to the right component, not merely that the shell rendered. */
const ROUTES = [
  ['/', 'Your next best move is clear.'],
  ['/dashboard', 'Your next best move is clear.'],
  ['/assessment', 'Assessment, without the anxiety.'],
  ['/learning', 'A pathway built around your work.'],
  ['/course-library', 'Courses worth your evening'],
  ['/courses/time-series', 'data-testid="link-back-learning"'],
  ['/materials', 'Turn a brief into a knowledge check.'],
  ['/quiz', 'Generate a quiz from your material.'],
  ['/intelligence', 'See the capability picture.'],
  ['/roadmap', 'Make the next role legible.'],
  ['/profile', 'Your NEXORA AI identity.'],
  ['/integrations', 'Connect the systems that know your work.'],
  ['/presentation', 'data-testid="button-presentation-next"'],
  ['/no-such-page', '404 Page Not Found'],
];

if (!GATE_OFF) {
  console.log('  -- the gate ------------------------------------------------');

  const out = render('/dashboard', SIGNED_OUT);
  check('signed out at /dashboard renders no sidebar', !has(out, SIDEBAR));
  check('signed out at /dashboard renders no page content', out.trim() === '');
  check('signed out never leaks the dashboard heading', !has(out, 'Your next best move is clear.'));

  const checking = render('/dashboard', CHECKING);
  check('while checking, it says so', has(checking, 'Checking your session'));
  check('while checking, no protected content is rendered', !has(checking, SIDEBAR));

  const down = render('/dashboard', UNREACHABLE);
  check('unreachable server explains itself', has(down, 'The auth server is not answering.'));
  check('unreachable server prints the command', has(down, 'npm run auth'));
  check('unreachable server passes the real error through', has(down, 'Cannot reach the auth server'));
  check('unreachable server offers the demo escape', has(down, 'data-testid="button-open-demo-anyway"'));
  check('unreachable server renders no protected content', !has(down, SIDEBAR));

  console.log('\n  -- signed in: the real account, not the demo one -----------');

  const app = render('/dashboard', SIGNED_IN);
  check('signed in reaches the shell', has(app, SIDEBAR));
  check('sidebar shows the account name', has(app, 'Ravi Kumar Menon'));
  check('sidebar shows the account email', has(app, 'ravi.menon@mospi.gov.in'));
  check('sidebar shows initials derived from the name (RM)', has(app, '>RM</div>'));
  check('the hardcoded demo name is gone', !has(app, 'Ananya Sharma'));
  check('the hardcoded demo department is gone', !has(app, 'Directorate of Economics<'));
  check('greeting uses the real first name', /Good (morning|afternoon|evening), Ravi</.test(app));
}

if (GATE_OFF) {
  console.log('  -- gate off: the app opens exactly as it did before ---------');

  const app = render('/dashboard', SIGNED_OUT);
  check('signed out still reaches the shell', has(app, SIDEBAR));
  check('the dashboard renders', has(app, 'Your next best move is clear.'));
  check('the original demo name is shown', has(app, 'Ananya Sharma'));
  check('the original demo department is shown', has(app, 'Directorate of Economics'));
  check('the original greeting name is shown', /Good (morning|afternoon|evening), Ananya</.test(app));

  const profile = render('/profile', SIGNED_OUT);
  check('the profile page shows the original demo identity', has(profile, 'Ananya Sharma'));
  check('the profile page shows the original department', has(profile, 'Directorate of Economics &amp; Statistics'));
  check('the profile initials fall back to AS', has(profile, '>AS</div>'));
}

console.log('\n  -- the profile page follows the session ---------------------');

const profileIn = render('/profile', GATE_OFF ? session('signed-in', ACCOUNT) : SIGNED_IN);
check('profile shows the account name', has(profileIn, 'Ravi Kumar Menon'));
check('profile shows the account email', has(profileIn, 'ravi.menon@mospi.gov.in'));
check('profile shows the account initials', has(profileIn, '>RM</div>'));
check('profile no longer shows the demo identity', !has(profileIn, 'Ananya Sharma'));

console.log('\n  -- every route in src/App.tsx still resolves ----------------');

for (const [path, marker] of ROUTES) {
  const html = render(path, session('signed-in', ACCOUNT));
  const inShell = has(html, SIDEBAR);
  check(`${path} renders its own page inside the shell`, inShell && has(html, marker));
}

console.log('\n  -- the assessment is dealt by the server, not by the bundle -');

/*
 * This section used to prove that the paper the page held in memory did not leak its key
 * into the markup. The paper is no longer held in memory: it is fetched, so an effect has
 * to run before a single scenario exists, and effects do not run in server rendering.
 *
 * That changes what is worth asserting. The first render is the waiting state, and the
 * guarantee is now the stronger one — there is no copy of the paper in `src/` at all for a
 * render to leak. The fixture below is the real item bank, imported from the server, so a
 * re-added local fallback would fail here rather than pass for lack of anything to compare
 * against. `server/smoke-test.sh` covers the same ground from the API side.
 */
const exam = render('/assessment', session('signed-in', ACCOUNT));
const bank = paperSource.sealedPaper({ shuffle: false });
/* Grading an empty submission is how the explanations are reached without a sitting. */
const bankKey = paperSource.gradeSubmission({ choices: [] });

check('the assessment page renders while the paper is being dealt', has(exam, 'data-testid="assessment-dealing"'));
check('it says where the paper and the key are held', has(exam, esc('held on the server')));
check(
  'no scenario from the bank reaches the markup before one is dealt',
  bank.questions.every((question) => !has(exam, esc(question.q))),
);
check(
  'no option from the bank reaches the markup either',
  bank.questions.every((question) => question.options.every((option) => !has(exam, esc(option.text)))),
);
check(
  'no explanation reaches the markup',
  bankKey.questions.every((question) => !has(exam, esc(question.explanation))),
);
check('nothing on screen is marked as the answer', !has(exam, 'Answer:'));
check('the review card cannot be reached before submitting', !has(exam, 'button-assessment-review'));
check('no option is pressable before a paper arrives', !has(exam, 'button-assessment-option-0'));
check('the paper cannot be submitted before it is dealt', !has(exam, 'button-assessment-back'));

/* What the fake version said, and must not say any more. */
check('the countdown that counted nothing is gone', !has(exam, '6 min remaining'));
check('the paper is not labelled a demonstration', !has(exam, 'Demonstration score'));

/*
 * The strongest form of the same guarantee, and the reason the bank was moved at all.
 * A render can only leak what the bundle contains, so this searches every file Vite
 * would compile for the scenarios and the explanations themselves. It is what would
 * have failed loudly when `src/lib/assessment.ts` held the key.
 */
const sourceFiles = [];
(function walk(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (/\.(ts|tsx|js|jsx)$/.test(entry.name)) sourceFiles.push(full);
  }
})(fileURLToPath(new URL('../src', import.meta.url)));
const sourceText = sourceFiles.map((file) => readFileSync(file, 'utf8')).join('\n');

check(`${sourceFiles.length} files under src/ were searched`, sourceFiles.length >= 10);
check(
  'no scenario from the bank exists anywhere in src/',
  bank.questions.every((question) => !sourceText.includes(question.q.slice(0, 40))),
);
check(
  'no option text from the bank exists anywhere in src/',
  bank.questions.every((question) => question.options.every((option) => !sourceText.includes(option.text.slice(0, 30)))),
);
check(
  'no explanation from the bank exists anywhere in src/',
  bankKey.questions.every((question) => !sourceText.includes(question.explanation.slice(0, 40))),
);

console.log('\n  -- the auth pages stay full-page ---------------------------');

const loginHtml = render('/login', SIGNED_OUT);
check('/login has no sidebar', !has(loginHtml, SIDEBAR));
check('/login renders the email field', has(loginHtml, 'data-testid="input-login-email"'));
check('/login renders the password field', has(loginHtml, 'data-testid="input-login-password"'));
check('/login asks for autocomplete=current-password', has(loginHtml, 'autocomplete="current-password"'));
check('/login links to signup', has(loginHtml, 'data-testid="link-goto-signup"'));

const signupHtml = render('/signup', SIGNED_OUT);
check('/signup has no sidebar', !has(signupHtml, SIDEBAR));
check('/signup renders the name field', has(signupHtml, 'data-testid="input-signup-name"'));
check('/signup asks for autocomplete=new-password', has(signupHtml, 'autocomplete="new-password"'));
check('/signup enforces the minimum length in markup', has(signupHtml, 'minlength="10"'));
check('/signup shows the strength meter', has(signupHtml, 'data-testid="text-password-strength"'));

const loginWhileIn = render('/login', session('signed-in', ACCOUNT));
check('/login recognises an existing session', has(loginWhileIn, 'Signed in as'));
check('/login names the signed-in account', has(loginWhileIn, 'Ravi Kumar Menon'));

console.log(`\n  ${pass} passed, ${fail} failed\n`);
process.exit(fail === 0 ? 0 : 1);
