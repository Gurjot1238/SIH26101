#!/usr/bin/env node
/**
 * StatSkill auth and progress server.
 *
 *   node server/index.mjs
 *
 * No dependencies, no build step, no native modules. Configuration comes from
 * server/.env (see .env.example). No secret is hardcoded anywhere in this repo.
 *
 * Endpoints
 *   GET    /api/health
 *   POST   /api/auth/signup            { name, email, password }
 *   POST   /api/auth/login             { email, password }
 *   POST   /api/auth/logout
 *   GET    /api/auth/me
 *   GET    /api/assessment/paper       the fixed paper, minus the answer key
 *   POST   /api/assessment/submit      { choices: [{ question, option }] } graded here
 *   GET    /api/progress               rollup + preferences + courses + recent history
 *   POST   /api/progress/attempts      save one graded quiz (material quizzes only)
 *   GET    /api/progress/attempts      own history, newest first, ?limit=
 *   DELETE /api/progress/attempts      clear own history
 *   POST   /api/progress/preferences   { language?, weeklyNote?, demoLabels? }
 *   POST   /api/progress/courses       { courseId, saved?, started?, completedModules? }
 *
 * Every /api/progress route requires a session and only ever touches the caller's
 * own records. There is no endpoint that reads another account's data, and no
 * field anywhere that can hold document text or question text: uploaded PDFs are
 * parsed in the browser tab and never leave it.
 *
 * Two kinds of score reach the disk by two different routes, and the difference is
 * deliberate. An assessment is graded here, from the key in ./assessment.mjs, so
 * /api/progress/attempts refuses a posted assessment outright. A material quiz is
 * graded in the tab, because its questions came from a document the tab never
 * uploaded — nothing on this side has ever seen them. The stored `source` field keeps
 * the two distinguishable instead of implying both were invigilated.
 */

import { createServer } from 'node:http';
import { readFileSync } from 'node:fs';
import { randomBytes } from 'node:crypto';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  HttpError,
  assertTrustedOrigin,
  clientKey,
  corsHeaders,
  handlePreflight,
  parseCookies,
  readJsonBody,
  sendJson,
  serializeCookie,
} from './http.mjs';
import {
  PASSWORD_POLICY,
  SESSION_COOKIE,
  burnTime,
  createRateLimiter,
  fingerprintToken,
  hashPassword,
  newSessionToken,
  newUserId,
  validateEmail,
  validateName,
  validateNewPassword,
  validatePasswordPresent,
  verifyPassword,
  warmUp,
} from './auth.mjs';
import { openStore } from './store.mjs';
import {
  ASSESSMENT_LENGTH,
  ASSESSMENT_SOURCE,
  attemptPayload,
  gradeSubmission,
  sealedPaper,
} from './assessment.mjs';
import {
  LIMITS,
  assertCourseRoom,
  computeProgress,
  newAttemptId,
  normalizeProfile,
  publicAttempt,
  validateAttempt,
  validateCourseUpdate,
  validatePreferences,
} from './progress.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));

/* ------------------------------------------------------------------- config */

/**
 * Minimal .env reader. Written by hand rather than pulled from npm so the
 * backend keeps its zero-dependency promise and works on any Node 20+.
 * Values already present in the real environment always win.
 */
function loadEnvFile(path) {
  let raw;
  try {
    raw = readFileSync(path, 'utf8');
  } catch {
    return false;
  }
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (trimmed === '' || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq < 1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (value.length >= 2 && ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'")))) {
      value = value.slice(1, -1);
    }
    if (process.env[key] === undefined) process.env[key] = value;
  }
  return true;
}

const usedEnvFile = loadEnvFile(join(HERE, '.env'));

const IS_PRODUCTION = process.env.NODE_ENV === 'production';

function envFlag(name, fallback) {
  const raw = process.env[name];
  if (raw === undefined || raw === '') return fallback;
  return ['1', 'true', 'yes', 'on'].includes(raw.toLowerCase());
}

function envInt(name, fallback) {
  const raw = process.env[name];
  if (raw === undefined || raw === '') return fallback;
  const value = Number.parseInt(raw, 10);
  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(`${name} must be a positive integer, got "${raw}".`);
  }
  return value;
}

const PORT = envInt('AUTH_PORT', 4000);
const HOST = process.env.AUTH_HOST || '127.0.0.1';
const DATA_DIR = process.env.AUTH_DATA_DIR || join(HERE, 'data');
const SESSION_TTL_MS = envInt('SESSION_TTL_HOURS', 168) * 60 * 60 * 1000;
const COOKIE_SECURE = envFlag('COOKIE_SECURE', IS_PRODUCTION);
const TRUST_PROXY = envFlag('TRUST_PROXY', false);

const ALLOWED_ORIGINS = new Set(
  (process.env.ALLOWED_ORIGINS || 'http://localhost:5173,http://127.0.0.1:5173')
    .split(',')
    .map((value) => value.trim().replace(/\/$/, ''))
    .filter(Boolean),
);

/**
 * The session secret is never written into the source. In production it must be
 * supplied or the server refuses to boot. In development a random one is
 * generated per boot, which is safe but means a restart signs everybody out.
 */
let sessionSecret = process.env.SESSION_SECRET ?? '';
let ephemeralSecret = false;
if (sessionSecret.length < 32) {
  if (IS_PRODUCTION) {
    console.error(
      '\n  SESSION_SECRET is missing or shorter than 32 characters.\n' +
        '  Generate one and put it in server/.env:\n\n' +
        '    node -e "console.log(require(\'node:crypto\').randomBytes(48).toString(\'base64url\'))"\n',
    );
    process.exit(1);
  }
  sessionSecret = randomBytes(48).toString('base64url');
  ephemeralSecret = true;
}

/* -------------------------------------------------------------- rate limiters */

const limiters = {
  /**
   * Two separate budgets for signup, on purpose. The loose one stops someone
   * hammering the endpoint; the strict one caps how many accounts an address can
   * actually create. Only real account creations spend the strict budget, so a
   * user who mistypes the form a few times is not locked out.
   */
  signupAttemptsPerIp: createRateLimiter({ name: 'signup-attempts/ip', limit: envInt('SIGNUP_ATTEMPT_LIMIT', 40), windowMs: 60 * 60 * 1000 }),
  signupCreatedPerIp: createRateLimiter({ name: 'signup-created/ip', limit: envInt('SIGNUP_LIMIT', 5), windowMs: 60 * 60 * 1000 }),
  loginPerAccount: createRateLimiter({ name: 'login/account', limit: envInt('LOGIN_LIMIT', 8), windowMs: 15 * 60 * 1000 }),
  loginPerIp: createRateLimiter({ name: 'login/ip', limit: envInt('LOGIN_IP_LIMIT', 30), windowMs: 15 * 60 * 1000 }),
  /**
   * Progress writes are cheap for the client and not for the server: each one
   * rewrites a whole JSON file. 240 an hour is far more than a person studying
   * can produce and far less than a loop can.
   */
  progressWritesPerIp: createRateLimiter({ name: 'progress-writes/ip', limit: envInt('PROGRESS_WRITE_LIMIT', 240), windowMs: 60 * 60 * 1000 }),
};

function tooManyRequests(retryAfter) {
  const wait = retryAfter > 60 ? `${Math.ceil(retryAfter / 60)} minutes` : `${retryAfter} seconds`;
  return new HttpError(429, 'too_many_requests', `Too many attempts. Try again in ${wait}.`);
}

function enforce(limiter, key) {
  const retryAfter = limiter.take(key);
  if (retryAfter !== null) throw tooManyRequests(retryAfter);
}

function enforceWithoutSpending(limiter, key) {
  const retryAfter = limiter.peek(key);
  if (retryAfter !== null) throw tooManyRequests(retryAfter);
}

/* -------------------------------------------------------------------- store */

const store = await openStore(DATA_DIR);
await warmUp();

/* ----------------------------------------------------------------- sessions */

/** Never returns the password hash. This is the only user shape the API emits. */
function publicUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt,
    lastLoginAt: user.lastLoginAt ?? null,
  };
}

function sessionCookie(token) {
  return serializeCookie(SESSION_COOKIE, token, {
    maxAge: Math.floor(SESSION_TTL_MS / 1000),
    sameSite: 'Lax',
    secure: COOKIE_SECURE,
    httpOnly: true,
  });
}

function expiredCookie() {
  return serializeCookie(SESSION_COOKIE, '', {
    maxAge: 0,
    sameSite: 'Lax',
    secure: COOKIE_SECURE,
    httpOnly: true,
  });
}

async function startSession(userId) {
  const token = newSessionToken();
  const now = Date.now();
  await store.createSession({
    fingerprint: fingerprintToken(token, sessionSecret),
    userId,
    createdAt: now,
    lastSeenAt: now,
    expiresAt: now + SESSION_TTL_MS,
  });
  return token;
}

/** Resolves the caller from the cookie, sliding the expiry forward as it goes. */
async function currentUser(req) {
  const token = parseCookies(req.headers.cookie)[SESSION_COOKIE];
  if (!token) return null;

  const fingerprint = fingerprintToken(token, sessionSecret);
  const session = store.findSession(fingerprint);
  if (!session) return null;

  const user = store.findUserById(session.userId);
  if (!user) {
    await store.deleteSession(fingerprint);
    return null;
  }

  const nextExpiry = Date.now() + SESSION_TTL_MS;
  // Only pay for a disk write when the expiry moves meaningfully.
  await store.touchSession(fingerprint, nextExpiry, { persist: nextExpiry - session.expiresAt > 10 * 60 * 1000 });
  return { user, fingerprint };
}

/* ----------------------------------------------------------------- handlers */

async function handleSignup(req, res, cors) {
  assertTrustedOrigin(req, ALLOWED_ORIGINS);
  const ip = clientKey(req, TRUST_PROXY);
  enforce(limiters.signupAttemptsPerIp, ip);
  enforceWithoutSpending(limiters.signupCreatedPerIp, ip);

  const body = await readJsonBody(req);
  const name = validateName(body.name);
  const email = validateEmail(body.email);
  const password = validateNewPassword(body.password, { email, name });

  const now = new Date().toISOString();
  const created = await store.createUser({
    id: newUserId(),
    name,
    email,
    role: 'learner',
    passwordHash: await hashPassword(password),
    createdAt: now,
    lastLoginAt: null,
  });

  if (!created) {
    // A tradeoff, stated plainly: telling the truth here leaks that the address
    // is registered, but hiding it makes signup genuinely confusing. Real
    // products solve this with email verification instead.
    throw new HttpError(409, 'email_taken', 'An account with that email already exists.', {
      email: 'An account with that email already exists.',
    });
  }

  // Only a real account creation spends the strict budget.
  limiters.signupCreatedPerIp.take(ip);

  const token = await startSession(created.id);
  sendJson(res, 201, { ok: true, user: publicUser(created) }, { ...cors, 'Set-Cookie': sessionCookie(token) });
}

async function handleLogin(req, res, cors) {
  assertTrustedOrigin(req, ALLOWED_ORIGINS);
  const ip = clientKey(req, TRUST_PROXY);
  enforce(limiters.loginPerIp, ip);

  const body = await readJsonBody(req);
  const email = validateEmail(body.email);
  const password = validatePasswordPresent(body.password);

  enforce(limiters.loginPerAccount, `${ip}|${email}`);

  const user = store.findUserByEmail(email);
  // When the account is unknown, still spend the same CPU on a decoy hash so
  // response time cannot be used to discover which emails are registered.
  const ok = user ? await verifyPassword(password, user.passwordHash) : await burnTime(password);

  if (!ok || !user) {
    // One message for both cases, on purpose.
    throw new HttpError(401, 'invalid_credentials', 'That email and password do not match.');
  }

  limiters.loginPerAccount.clear(`${ip}|${email}`);
  const token = await startSession(user.id);
  await store.recordLogin(user.id, new Date().toISOString());
  sendJson(res, 200, { ok: true, user: publicUser(user) }, { ...cors, 'Set-Cookie': sessionCookie(token) });
}

async function handleLogout(req, res, cors) {
  assertTrustedOrigin(req, ALLOWED_ORIGINS);
  const session = await currentUser(req);
  if (session) await store.deleteSession(session.fingerprint);
  // Always clear the cookie and always return 204, even if there was no session.
  sendJson(res, 200, { ok: true }, { ...cors, 'Set-Cookie': expiredCookie() });
}

async function handleMe(req, res, cors) {
  const session = await currentUser(req);
  if (!session) {
    throw new HttpError(401, 'not_authenticated', 'You are not signed in.');
  }
  sendJson(res, 200, { ok: true, user: publicUser(session.user) }, cors);
}

function handleHealth(_req, res, cors) {
  sendJson(res, 200, {
    ok: true,
    service: 'statskill-auth',
    passwordHash: 'scrypt',
    passwordPolicy: PASSWORD_POLICY,
    ...store.counts(),
  }, cors);
}

/* ----------------------------------------------------------------- progress */

/**
 * Every progress endpoint is private, so they all start the same way. Written as
 * one helper rather than repeated per handler: an endpoint that forgets this
 * check would leak another learner's results, and a single line is easy to audit.
 */
async function requireSession(req) {
  const session = await currentUser(req);
  if (!session) throw new HttpError(401, 'not_authenticated', 'You are not signed in.');
  return session;
}

/**
 * Guard shared by all four writes. Session first, then the budget: an anonymous
 * flood should be rejected before it can spend the quota of a real user sitting
 * behind the same address.
 */
async function requireSessionForWrite(req) {
  assertTrustedOrigin(req, ALLOWED_ORIGINS);
  const session = await requireSession(req);
  enforce(limiters.progressWritesPerIp, clientKey(req, TRUST_PROXY));
  return session;
}

/** `?limit=` for the history endpoint. Absent means the default, never "all". */
function historyLimit(req) {
  const raw = new URL(req.url ?? '/', 'http://internal').searchParams.get('limit');
  if (raw === null || raw.trim() === '') return LIMITS.defaultHistory;

  const value = Number.parseInt(raw, 10);
  if (!Number.isInteger(value) || value < 1) {
    throw new HttpError(400, 'invalid_input', 'limit must be a whole number of 1 or more.', {
      limit: 'limit must be a whole number of 1 or more.',
    });
  }
  return Math.min(value, LIMITS.maxAttemptsPerUser);
}

/** Newest first, because every page that shows history shows the recent end. */
function recentAttempts(attempts, limit) {
  return attempts.slice(-limit).reverse().map(publicAttempt);
}

/**
 * Everything the Dashboard needs in one response, so a page load is one request:
 * the rollup across every attempt, the account's preferences and course progress,
 * and enough recent attempts to draw a trend.
 */
function progressBundle(user) {
  const attempts = store.attemptsForUser(user.id);
  const profile = normalizeProfile(store.profileForUser(user.id));
  return {
    progress: computeProgress(attempts),
    preferences: profile.preferences,
    courses: Object.values(profile.courses),
    history: recentAttempts(attempts, LIMITS.inlineHistory),
  };
}

async function handleProgress(req, res, cors) {
  const { user } = await requireSession(req);
  sendJson(res, 200, { ok: true, ...progressBundle(user) }, cors);
}

async function handleSaveAttempt(req, res, cors) {
  const { user } = await requireSessionForWrite(req);
  const body = await readJsonBody(req);

  // An assessment score is not the client's to state. Those questions live in
  // server/assessment.mjs and are graded by POST /api/assessment/submit, so a
  // posted "assessment" here is either a stale build or somebody filing 15/15 by
  // hand. A material quiz is different and is allowed: its questions were built
  // from a document that never left the tab, so the tab is the only thing that
  // could grade it. Which of the two produced a stored row stays visible in
  // `source`, and the Dashboard says so rather than implying both were invigilated.
  if (body.source === ASSESSMENT_SOURCE) {
    const message = 'An assessment is graded on the server. Submit it to /api/assessment/submit instead.';
    throw new HttpError(400, 'grade_on_server', message, { source: message });
  }

  // The stored record is `validateAttempt`'s return value plus server-owned
  // fields. The client cannot choose the id, the timestamp or the account.
  const record = {
    id: newAttemptId(),
    userId: user.id,
    at: new Date().toISOString(),
    ...validateAttempt(body),
  };

  const { dropped } = await store.addAttempt(record, { maxPerUser: LIMITS.maxAttemptsPerUser });
  sendJson(res, 201, {
    ok: true,
    attempt: publicAttempt(record),
    /** How many oldest attempts fell off to stay under the cap. Usually 0. */
    dropped,
    progress: computeProgress(store.attemptsForUser(user.id)),
  }, cors);
}

async function handleListAttempts(req, res, cors) {
  const { user } = await requireSession(req);
  const limit = historyLimit(req);
  const attempts = store.attemptsForUser(user.id);
  sendJson(res, 200, { ok: true, attempts: recentAttempts(attempts, limit), total: attempts.length, limit }, cors);
}

/**
 * Clear one account's own history. DELETE carries no body, so the JSON
 * content-type rule cannot help here; what protects it is the SameSite=Lax
 * cookie plus the origin allow-list, and the fact that no HTML form can issue a
 * DELETE at all. The UI pairs this with a confirmation dialog.
 */
async function handleClearAttempts(req, res, cors) {
  const { user } = await requireSessionForWrite(req);
  const removed = await store.deleteAttemptsForUser(user.id);
  sendJson(res, 200, { ok: true, removed, progress: computeProgress([]) }, cors);
}

async function handlePreferences(req, res, cors) {
  const { user } = await requireSessionForWrite(req);
  const body = await readJsonBody(req);

  const profile = normalizeProfile(store.profileForUser(user.id));
  const preferences = validatePreferences(body, profile.preferences);
  await store.saveProfile(user.id, { ...profile, preferences, updatedAt: new Date().toISOString() });
  sendJson(res, 200, { ok: true, preferences }, cors);
}

async function handleCourseProgress(req, res, cors) {
  const { user } = await requireSessionForWrite(req);
  const body = await readJsonBody(req);

  const profile = normalizeProfile(store.profileForUser(user.id));
  // hasOwn, not a plain lookup: `courses` is a literal, so an id like
  // "__proto__" would otherwise read straight off Object.prototype.
  const current = Object.hasOwn(profile.courses, body.courseId) ? profile.courses[body.courseId] : null;

  const now = new Date().toISOString();
  const course = validateCourseUpdate(body, current, now);
  assertCourseRoom(profile.courses, course.courseId);

  const courses = { ...profile.courses, [course.courseId]: course };
  await store.saveProfile(user.id, { ...profile, courses, updatedAt: now });
  sendJson(res, 200, { ok: true, course, courses: Object.values(courses) }, cors);
}

/* --------------------------------------------------------------- assessment */

/**
 * Deal a sealed paper.
 *
 * A session is required. Not because the questions are secret — they are StatSkill's
 * own scenarios and a determined visitor could collect them by signing up — but
 * because an anonymous caller has no attempt to file, so the only use for an
 * unauthenticated copy of the bank is scraping it.
 *
 * What comes back has no `correct` and no `explanation` anywhere in it. That is
 * asserted by `assessment: the sealed paper carries no answer key` in the engine
 * tests and by a grep over the response in ./smoke-test.sh, because a field added to
 * the item type later would otherwise ride along unnoticed.
 */
async function handleAssessmentPaper(req, res, cors) {
  await requireSession(req);
  sendJson(res, 200, { ok: true, paper: sealedPaper() }, cors);
}

/**
 * Grade a submission, store it, and only then hand back the key.
 *
 * The body carries which option was picked for which question. A `correct`,
 * `percent` or `band` alongside them is ignored rather than rejected: the record is
 * built from `gradeSubmission`, so there is no code path by which a number chosen in
 * the browser becomes a number on disk.
 *
 * The reply is deliberately generous — the result, the key with explanations, the
 * stored attempt and the recomputed rollup — so the page can draw its whole report,
 * including the review screen, without a second round trip.
 */
async function handleAssessmentSubmit(req, res, cors) {
  const { user } = await requireSessionForWrite(req);
  const body = await readJsonBody(req);

  const graded = gradeSubmission(body);
  const record = {
    id: newAttemptId(),
    userId: user.id,
    at: new Date().toISOString(),
    ...validateAttempt(attemptPayload(graded, { durationSeconds: body.durationSeconds })),
  };

  const { dropped } = await store.addAttempt(record, { maxPerUser: LIMITS.maxAttemptsPerUser });
  sendJson(res, 201, {
    ok: true,
    result: graded,
    attempt: publicAttempt(record),
    dropped,
    progress: computeProgress(store.attemptsForUser(user.id)),
  }, cors);
}

/* ------------------------------------------------------------------- routing */

const ROUTES = new Map([
  ['GET /api/health', handleHealth],
  ['POST /api/auth/signup', handleSignup],
  ['POST /api/auth/login', handleLogin],
  ['POST /api/auth/logout', handleLogout],
  ['GET /api/auth/me', handleMe],
  ['GET /api/assessment/paper', handleAssessmentPaper],
  ['POST /api/assessment/submit', handleAssessmentSubmit],
  ['GET /api/progress', handleProgress],
  ['POST /api/progress/attempts', handleSaveAttempt],
  ['GET /api/progress/attempts', handleListAttempts],
  ['DELETE /api/progress/attempts', handleClearAttempts],
  ['POST /api/progress/preferences', handlePreferences],
  ['POST /api/progress/courses', handleCourseProgress],
]);

const server = createServer(async (req, res) => {
  const started = process.hrtime.bigint();
  let pathname = '/';

  try {
    pathname = new URL(req.url ?? '/', 'http://internal').pathname;
  } catch {
    sendJson(res, 400, { ok: false, error: { code: 'bad_request', message: 'Malformed URL.' } });
    return;
  }

  const cors = corsHeaders(req, ALLOWED_ORIGINS);

  if (req.method === 'OPTIONS') {
    handlePreflight(req, res, ALLOWED_ORIGINS);
    return;
  }

  const handler = ROUTES.get(`${req.method} ${pathname}`);

  try {
    if (!handler) {
      // Distinguish "wrong method" from "no such route" without listing routes.
      const methodMismatch = [...ROUTES.keys()].some((key) => key.endsWith(` ${pathname}`));
      throw methodMismatch
        ? new HttpError(405, 'method_not_allowed', `${req.method} is not allowed on ${pathname}.`)
        : new HttpError(404, 'not_found', 'No such endpoint.');
    }
    await handler(req, res, cors);
  } catch (error) {
    respondWithError(res, error, cors, req, pathname);
  } finally {
    const ms = Number(process.hrtime.bigint() - started) / 1e6;
    // Method, path, status and duration only. Never the body, never a password.
    console.log(`${req.method} ${pathname} ${res.statusCode} ${ms.toFixed(1)}ms`);
  }
});

function respondWithError(res, error, cors, req, pathname) {
  if (res.headersSent) {
    res.end();
    return;
  }

  if (error instanceof HttpError) {
    const payload = { ok: false, error: { code: error.code, message: error.message } };
    if (error.fields) payload.error.fields = error.fields;
    const headers = { ...cors };
    if (error.status === 429) headers['Retry-After'] = '60';
    sendJson(res, error.status, payload, headers);
    return;
  }

  // Unexpected: log the detail on the server, tell the client nothing useful.
  console.error(`[500] ${req.method} ${pathname}`, error);
  sendJson(res, 500, { ok: false, error: { code: 'server_error', message: 'Something went wrong.' } }, cors);
}

/* ------------------------------------------------------------------- startup */

// Slow-loris protection: drop connections that dawdle over their headers.
server.headersTimeout = 10_000;
server.requestTimeout = 20_000;
server.keepAliveTimeout = 5_000;

const housekeeping = setInterval(() => {
  void store.purgeExpiredSessions();
  for (const limiter of Object.values(limiters)) limiter.sweep();
}, 10 * 60 * 1000);
housekeeping.unref();

server.listen(PORT, HOST, () => {
  const counts = store.counts();
  console.log(`
  StatSkill auth server
  ---------------------
  URL        http://${HOST}:${PORT}
  Accounts   ${counts.users}
  Sessions   ${counts.sessions}
  Attempts   ${counts.attempts}
  Data       ${DATA_DIR} (users, sessions, attempts, profiles)
  Assessment ${ASSESSMENT_LENGTH} questions, graded here (the browser never sees the key)
  Hashing    scrypt (Node built-in), min ${PASSWORD_POLICY.min} character password
  Origins    ${[...ALLOWED_ORIGINS].join(', ')}
  Cookie     ${SESSION_COOKIE}; HttpOnly; SameSite=Lax${COOKIE_SECURE ? '; Secure' : ' (Secure off — http is fine on localhost)'}
  Env file   ${usedEnvFile ? 'server/.env loaded' : 'no server/.env (using defaults)'}
`);

  if (ephemeralSecret) {
    console.log(
      '  Note: SESSION_SECRET is not set, so a random one was generated for this run.\n' +
        '  Everything works, but restarting the server signs everyone out.\n' +
        '  To make sessions survive a restart, create server/.env with:\n\n' +
        `    SESSION_SECRET=${randomBytes(48).toString('base64url')}\n`,
    );
  }
  console.log('  Press Control-C to stop.\n');
});

server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`\n  Port ${PORT} is already in use.\n  Start on another port:  AUTH_PORT=4100 node server/index.mjs\n`);
    process.exit(1);
  }
  console.error(error);
  process.exit(1);
});

let closing = false;
for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => {
    if (closing) return;
    closing = true;
    console.log('\n  Stopping...');
    clearInterval(housekeeping);
    server.close(async () => {
      // Wait for any queued file write so a JSON file cannot be left truncated.
      await store.drain();
      console.log('  Stopped cleanly.\n');
      process.exit(0);
    });
    // Do not hang forever on a stuck keep-alive connection.
    setTimeout(() => process.exit(0), 3000).unref();
  });
}
