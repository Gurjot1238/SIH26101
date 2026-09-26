#!/usr/bin/env node
/**
 * NEXORA AI auth and progress server.
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
 *   POST   /api/ai/generate-mcqs       { text, topics, concepts, questionCount }
 *
 * Every /api/progress route requires a session and only ever touches the caller's
 * own records. There is no endpoint that reads another account's data.
 *
 * /api/ai/generate-mcqs is the one route that receives document text, and it is worth
 * being precise about what that means. A PDF is still opened and parsed entirely in the
 * browser tab — the file itself never moves. But the *extracted text* is posted here and
 * forwarded to the configured AI provider, because questions grounded in a document
 * cannot be written by anything that has not read it. Nothing about that text is
 * persisted: it is held in memory for the duration of the request, never written to
 * ./data, and never logged. The request log prints method, path, status and duration
 * only. The UI says the same thing on the upload screen, because a user agreeing to
 * "local extraction" should not discover later that their material was sent somewhere.
 *
 * Two kinds of score reach the disk by two different routes, and the difference is
 * deliberate. An assessment is graded here, from the key in ./assessment.mjs, so
 * /api/progress/attempts refuses a posted assessment outright. A material quiz is
 * graded in the tab: the questions came from the learner's own document, and although
 * this server generated them it does not keep them, so it has no key to grade against.
 * The stored `source` field keeps the two distinguishable instead of implying both were
 * invigilated.
 */

import { createServer } from 'node:http';
import { readFileSync, createReadStream, statSync } from 'node:fs';
import { randomBytes } from 'node:crypto';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  HttpError,
  MAX_AI_BODY_BYTES,
  MAX_BODY_BYTES,
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
  deriveSubkey,
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
import { openDocumentStore, DocumentPageLimitError } from './documents/store.mjs';
import { ingestDocument, finalizeDocument, searchDocuments, generateFromTopic } from './documents/pipeline.mjs';
import { guardDocument } from './documents/document-type-guard.mjs';
import { ocrImage, ocrHealth } from './documents/ocr.mjs';
import { jobView } from './documents/jobs.mjs';
import { extractMarksheet, analyzePerformance } from './documents/marksheet.mjs';
import { loadConfig } from './documents/config.mjs';
import { catalogue, getCourse, resolveContent, coursesStatus } from './courses.mjs';
import { RecommendationService } from './recommend/service.mjs';
import { learnerLevelRank } from './recommend/features.mjs';
import { sanitizeEvent, forbiddenKeysIn } from './recommend/interactions.mjs';
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
  validatePersonal,
  validatePreferences,
} from './progress.mjs';
import { buildNotifications } from './notifications.mjs';
import {
  MAX_QUESTIONS,
  MAX_TEXT_CHARS,
  MIN_QUESTIONS,
  MIN_TEXT_CHARS,
  TARGET_QUESTIONS,
  describeModel,
  describeTarget,
  generateMcqs,
  providerStatus,
} from './ai/provider.mjs';
import {
  classifyMaterial,
  classificationStatus,
} from './ai/classify.mjs';
import { explainAnalytics } from './ai/explain.mjs';
import {
  PAPER_LIMITS,
  newPaperId,
  paperSummary,
  publicPaper,
  validateSavedPaper,
} from './papers.mjs';
import {
  ANALYTICS_SCOPES,
  analyseAnswers,
  buildAnalyticsSummary,
} from './competency.mjs';

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

/**
 * Like envInt, but zero is allowed and means "no limit". Only the AI generation
 * budget uses this: on a local model a run costs the operator's own CPU and nothing
 * else, so 0 is a legitimate "let me run as many as I like" rather than an error.
 * The rate limiter treats a limit of 0 as unlimited (see createRateLimiter).
 */
function envIntAllowingZero(name, fallback) {
  const raw = process.env[name];
  if (raw === undefined || raw === '') return fallback;
  const value = Number.parseInt(raw, 10);
  if (!Number.isInteger(value) || value < 0) {
    throw new Error(`${name} must be zero or a positive integer, got "${raw}".`);
  }
  return value;
}

const PORT = envInt('AUTH_PORT', 4000);
const HOST = process.env.AUTH_HOST || '127.0.0.1';
const DATA_DIR = process.env.AUTH_DATA_DIR || join(HERE, 'data');
const SESSION_TTL_MS = envInt('SESSION_TTL_HOURS', 168) * 60 * 60 * 1000;
const COOKIE_SECURE = envFlag('COOKIE_SECURE', IS_PRODUCTION);
const TRUST_PROXY = envFlag('TRUST_PROXY', false);
// How many trusted reverse-proxy hops sit in front of this server. Only consulted when
// TRUST_PROXY is on. The client IP is read this many entries from the RIGHT of
// X-Forwarded-For (see clientKey), so a client cannot forge its rate-limit bucket by
// prepending fake hops. Default 1 = a single reverse proxy (the common case).
const TRUSTED_PROXY_HOPS = TRUST_PROXY ? envInt('TRUSTED_PROXY_HOPS', 1) : 0;

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

// Purpose-specific subkeys, so the session-cookie HMAC and the interaction-log pseudonym never
// share raw key material (audit A10). Each is an independent HMAC of SESSION_SECRET under a
// distinct label; obtaining or attacking one tells you nothing about the other, and neither is
// the bare secret. (Both still change if SESSION_SECRET is rotated — that is inherent to keying
// from one master secret; supply a separate secret only if the log must survive rotation.)
const SESSION_FP_KEY = deriveSubkey(sessionSecret, 'session-fingerprint:v1');
const INTERACTION_KEY = deriveSubkey(sessionSecret, 'interaction-pseudonym:v1');

/* -------------------------------------------------------------- rate limiters */

/**
 * AI generation budget, with a guard against an expensive foot-gun (audit A14).
 *
 * `0` means "no limit". That is fine for a local model, where a request costs only
 * this machine's CPU — but a metered provider (gemini bills per call) exposed with
 * no cap is an open-ended bill waiting for the first abusive loop. So when the
 * provider is metered we refuse to run unlimited: the limit is clamped to a safe
 * positive default and the operator is warned once at boot. Choosing a higher cap
 * is a matter of setting a positive number; running a metered provider with no cap
 * at all is never a safe default and is deliberately not offered.
 */
const AI_GENERATION_LIMIT = (() => {
  const configured = envIntAllowingZero('AI_GENERATION_LIMIT', 30);
  if (configured > 0) return configured;
  if (providerStatus(process.env).provider !== 'gemini') return 0; // local/mock: only CPU is spent
  const safe = 30;
  console.warn(
    '[ai] AI_GENERATION_LIMIT=0 (unlimited) is unsafe with a metered provider — each '
    + `generation bills the provider. Clamping to ${safe} requests/IP/hour. Set `
    + 'AI_GENERATION_LIMIT to a positive number to choose your own cap.',
  );
  return safe;
})();

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
   * Failed logins per account across ALL source IPs. The `login/account` limiter above is
   * keyed `ip|email`, so an attacker rotating IPs earns a fresh budget per IP against one
   * targeted account (audit A3). This global-by-email cap closes that: a higher budget over a
   * longer window, spent ONLY on a failed attempt and cleared on success — so a correct
   * password always logs the real owner in and this can never be used to lock them out.
   */
  loginPerAccountGlobal: createRateLimiter({ name: 'login/account-global', limit: envInt('LOGIN_ACCOUNT_LIMIT', 50), windowMs: 60 * 60 * 1000 }),
  /**
   * Progress writes are cheap for the client and not for the server: each one
   * rewrites a whole JSON file. 240 an hour is far more than a person studying
   * can produce and far less than a loop can.
   */
  progressWritesPerIp: createRateLimiter({ name: 'progress-writes/ip', limit: envInt('PROGRESS_WRITE_LIMIT', 240), windowMs: 60 * 60 * 1000 }),
  /**
   * AI generation gets its own budget, and a small one. Every call spends real money
   * with the provider and takes tens of seconds, so this is the one endpoint where a
   * loop costs the operator rather than just the CPU. 30 an hour is more documents than
   * a person studies in a day; it is nowhere near enough to run up a bill.
   */
  aiGenerationsPerIp: createRateLimiter({ name: 'ai-generations/ip', limit: AI_GENERATION_LIMIT, windowMs: 60 * 60 * 1000 }),
  /**
   * OCR pages get their own budget so a scanned book cannot starve ordinary progress
   * writes, and so a loop cannot pin the local OCR engine. One request is one page
   * image; 600 an hour covers three full-length scanned documents and is far beyond a
   * human studying, while still bounding abuse. Local inference costs no money, only CPU.
   */
  ocrPagesPerIp: createRateLimiter({ name: 'ocr-pages/ip', limit: envInt('OCR_PAGE_LIMIT', 600), windowMs: 60 * 60 * 1000 }),
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
// The document-intelligence store lives in its own subtree so a large book's chunks never
// share a file with accounts or attempts. Same JSON-on-disk approach, same honest limits.
const documentStore = await openDocumentStore(join(DATA_DIR, 'documents'));
const docConfig = loadConfig(process.env);
await warmUp();

/**
 * The recommendation service: one door for all course recommendations. It defaults to the
 * hybrid engine, which generates candidates with the proven deterministic engine and only
 * lets the ML ranker reorder them once a trained model AND enough interaction data exist.
 * With neither present today it behaves exactly like the current system — the upgrade is
 * additive and cannot empty or corrupt the list. See recommend/service.mjs.
 */
const recommendationService = new RecommendationService();

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
    fingerprint: fingerprintToken(token, SESSION_FP_KEY),
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

  const fingerprint = fingerprintToken(token, SESSION_FP_KEY);
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
  const ip = clientKey(req, TRUSTED_PROXY_HOPS);
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
  const ip = clientKey(req, TRUSTED_PROXY_HOPS);
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
    // Only NOW (on a genuine failure) charge the global per-account budget, keyed by the
    // submitted email regardless of whether it exists (so this stays non-enumerable). A
    // correct password never reaches this line, so the real owner can never be locked out;
    // a distributed guesser rotating IPs is still capped per account. Over budget → 429.
    enforce(limiters.loginPerAccountGlobal, email);
    // One message for both cases, on purpose.
    throw new HttpError(401, 'invalid_credentials', 'That email and password do not match.');
  }

  limiters.loginPerAccount.clear(`${ip}|${email}`);
  limiters.loginPerAccountGlobal.clear(email);
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

async function handleHealth(req, res, cors) {
  const base = {
    ok: true,
    service: 'NEXORA AI-auth',
    passwordHash: 'scrypt',
    passwordPolicy: PASSWORD_POLICY,
  };
  // Global record counts (accounts / sessions / attempts / saved sets) are operational
  // detail, not public: an anonymous caller must not be able to read them (audit A8). A
  // signed-in caller still sees them. Liveness and the (non-sensitive) hash scheme stay public.
  const session = await currentUser(req);
  if (session) Object.assign(base, store.counts());
  sendJson(res, 200, base, cors);
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
  enforce(limiters.progressWritesPerIp, clientKey(req, TRUSTED_PROXY_HOPS));
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
    personal: profile.personal,
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

  // Serialized read-modify-write: validation and the merge both run inside the store's
  // per-user lock, against the freshest profile, so a concurrent course-progress save
  // for the same account cannot clobber these preferences (audit A19).
  let preferences;
  await store.updateProfile(user.id, (raw) => {
    const profile = normalizeProfile(raw);
    preferences = validatePreferences(body, profile.preferences);
    return { ...profile, preferences, updatedAt: new Date().toISOString() };
  });
  sendJson(res, 200, { ok: true, preferences }, cors);
}

async function handleProfileDetails(req, res, cors) {
  const { user } = await requireSessionForWrite(req);
  const body = await readJsonBody(req);

  // Same lost-update-safe path as preferences (audit A19): validate and merge the
  // personal block against the freshest profile inside the per-user lock. Name and
  // email are NOT touched here — they are account credentials owned by auth.mjs and
  // stay read-only on the profile.
  let personal;
  await store.updateProfile(user.id, (raw) => {
    const profile = normalizeProfile(raw);
    personal = validatePersonal(body, profile.personal);
    return { ...profile, personal, updatedAt: new Date().toISOString() };
  });
  sendJson(res, 200, { ok: true, personal }, cors);
}

async function handleCourseProgress(req, res, cors) {
  const { user } = await requireSessionForWrite(req);
  const body = await readJsonBody(req);

  const now = new Date().toISOString();
  let course;
  let courses;
  // Same lost-update-safe path as preferences: read the freshest courses map, validate and
  // merge this one course into it, and persist — all inside the per-user lock (audit A19).
  await store.updateProfile(user.id, (raw) => {
    const profile = normalizeProfile(raw);
    // hasOwn, not a plain lookup: `courses` is a literal, so an id like
    // "__proto__" would otherwise read straight off Object.prototype.
    const current = Object.hasOwn(profile.courses, body.courseId) ? profile.courses[body.courseId] : null;
    course = validateCourseUpdate(body, current, now);
    assertCourseRoom(profile.courses, course.courseId);
    courses = { ...profile.courses, [course.courseId]: course };
    return { ...profile, courses, updatedAt: now };
  });

  // Record the engagement signal this update carries. Completion is computed against the
  // course's real lesson count (the dataset's, not something the client sent), so it is the
  // same denominator the UI shows. These are the strong training signals: a course that is
  // opened and completed is a positive example; opened and abandoned at 3% is a negative one.
  // Anonymised and allow-listed downstream; no lesson text or ids beyond counts are logged.
  let totalLessons = 0;
  try {
    totalLessons = getCourse(course.courseId).lessonIds.length;
  } catch {
    /* course not in the dataset (or invalid id) — log without a completion percent */
  }
  const completionPercent = totalLessons > 0 ? Math.round((course.completedLessons.length / totalLessons) * 100) : null;
  void logInteractions([
    {
      userId: user.id,
      type: completionPercent === 100 ? 'course_completed' : 'course_opened',
      courseId: course.courseId,
      courseStarted: Boolean(course.startedAt),
      completionPercent,
      completed: completionPercent === 100,
    },
  ]);

  sendJson(res, 200, { ok: true, course, courses: Object.values(courses) }, cors);
}

/* --------------------------------------------------------------- notifications */

/**
 * The notification feed is derived on read from the account's own progress,
 * courses and profile — there is no stored feed. `buildNotifications` is pure, so
 * everything here is a read: no write, no lock. `notificationsSeenAt` (set by the
 * /seen route) turns the raw items into an unread count.
 */
function notificationsFor(user, now = new Date().toISOString()) {
  const attempts = store.attemptsForUser(user.id);
  const profile = normalizeProfile(store.profileForUser(user.id));
  return buildNotifications({
    progress: computeProgress(attempts),
    courses: Object.values(profile.courses),
    profile,
    now,
  });
}

async function handleNotifications(req, res, cors) {
  const { user } = await requireSession(req);
  const feed = notificationsFor(user);
  sendJson(res, 200, { ok: true, ...feed }, cors);
}

async function handleNotificationsSeen(req, res, cors) {
  const { user } = await requireSessionForWrite(req);
  const now = new Date().toISOString();
  // Record that the panel was opened now, inside the per-user lock so a concurrent
  // profile write cannot lose it (audit A19). The rebuilt feed then reads unread = 0.
  await store.updateProfile(user.id, (raw) => {
    const profile = normalizeProfile(raw);
    return { ...profile, notificationsSeenAt: now, updatedAt: now };
  });
  const feed = notificationsFor(user, now);
  sendJson(res, 200, { ok: true, ...feed }, cors);
}

/* --------------------------------------------------------------- saved papers */

/**
 * Save a generated MCQ set to the caller's account.
 *
 * The stored record is `validateSavedPaper`'s field-by-field rebuild plus the three
 * server-owned fields (id, owner, timestamp). The client cannot choose any of those,
 * and nothing outside the allow-list in papers.mjs reaches disk. Body cap is the same
 * 256 KB as generation, since a full paper can be a few kilobytes of question text.
 */
async function handleSavePaper(req, res, cors) {
  const { user } = await requireSessionForWrite(req);
  const body = await readJsonBody(req, { maxBytes: MAX_AI_BODY_BYTES });
  const record = {
    id: newPaperId(),
    userId: user.id,
    createdAt: new Date().toISOString(),
    ...validateSavedPaper(body),
  };
  const { dropped } = await store.addPaper(record, { maxPerUser: PAPER_LIMITS.maxPerUser });
  sendJson(res, 201, { ok: true, paper: publicPaper(record), dropped }, cors);
}

/**
 * List the caller's saved papers, or return one in full when `?id=` is given.
 *
 * Both are GET /api/papers because the router matches on method and path only; the id
 * query is what picks between the list (summaries, newest first) and a single paper
 * (with its questions). Either way `store` scopes the read to this account, so there is
 * no id a caller can pass to read someone else's saved set.
 */
async function handlePapersGet(req, res, cors) {
  const { user } = await requireSession(req);
  const id = new URL(req.url ?? '/', 'http://internal').searchParams.get('id');
  if (id !== null && id.trim() !== '') {
    const paper = store.paperForUser(user.id, id.trim());
    if (!paper) throw new HttpError(404, 'not_found', 'No saved paper with that id.');
    sendJson(res, 200, { ok: true, paper: publicPaper(paper) }, cors);
    return;
  }
  const papers = store.papersForUser(user.id);
  sendJson(res, 200, { ok: true, papers: papers.slice().reverse().map(paperSummary), total: papers.length }, cors);
}

/**
 * Delete one of the caller's saved papers, chosen by `?id=`. Same protections as
 * clearing history: the SameSite=Lax cookie and the origin allow-list, plus the fact
 * that `store.deletePaper` only ever touches this account's own list.
 */
async function handleDeletePaper(req, res, cors) {
  const { user } = await requireSessionForWrite(req);
  const id = new URL(req.url ?? '/', 'http://internal').searchParams.get('id') ?? '';
  const removed = await store.deletePaper(user.id, id.trim());
  if (!removed) throw new HttpError(404, 'not_found', 'No saved paper with that id.');
  sendJson(res, 200, { ok: true, removed: true }, cors);
}

/* --------------------------------------------------------------- assessment */

/**
 * Deal a sealed paper.
 *
 * A session is required. Not because the questions are secret — they are NEXORA AI's
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

  // The after-state for the feedback loop (§11). A fresh sitting gives a new competency score
  // per area; logging it as competency_measured lets buildTrainingRows pair a course's
  // recommendation_shown (competency-before) with the later measurement (competency-after)
  // into a real "did studying this improve the competency?" label. Anonymised + allow-listed
  // downstream; only the competency id and its new score/gap are recorded, never answers.
  const freshAnalytics = buildAnalyticsSummary(store.attemptsForUser(user.id), { scope: 'latest' });
  void logInteractions(
    (freshAnalytics.gaps ?? []).map((g) => ({
      userId: user.id,
      type: 'competency_measured',
      // competency_measured is not tied to one course; use a stable sentinel course id so the
      // event validates (courseId is required) without implying a specific course.
      courseId: 'competency-measurement',
      competency: g.competency,
      competencyScoreAfter: g.currentScore,
      gapAfter: g.gap,
      assessmentScore: graded.score ?? graded.percent,
    })),
  );

  sendJson(res, 201, {
    ok: true,
    result: graded,
    /**
     * Which questions were missed and under which topic, summarised. Computed from
     * the same grading, so it cannot disagree with the report beside it, and it
     * carries no question text and no answer key of its own.
     */
    answers: analyseAnswers(graded.questions),
    attempt: publicAttempt(record),
    dropped,
    progress: computeProgress(store.attemptsForUser(user.id)),
  }, cors);
}

/* ------------------------------------------------------------- analytics */

/** `?scope=` on the analytics endpoint. Anything unrecognised is refused, not defaulted. */
function analyticsScope(req) {
  const raw = new URL(req.url ?? '/', 'http://internal').searchParams.get('scope');
  if (raw === null || raw.trim() === '') return 'all';
  const scope = raw.trim().toLowerCase();
  if (!ANALYTICS_SCOPES.includes(scope)) {
    const message = `scope must be one of: ${ANALYTICS_SCOPES.join(', ')}.`;
    throw new HttpError(400, 'invalid_input', message, { scope: message });
  }
  return scope;
}

/**
 * The competency analysis for the signed-in account.
 *
 * Every figure in the response is computed here from stored attempts — the scores,
 * the bands, the gaps against the target levels and the learning priority order. The
 * browser does no competency arithmetic at all; it maps a status to a colour and
 * draws what it was sent. That is the point of the endpoint: two copies of a scoring
 * rule drift, and the one on screen would be the one nobody tested.
 *
 * `?scope=latest` analyses the newest sitting alone. The trend is built from the whole
 * history either way, because "how did that paper go" and "am I improving" are
 * different questions.
 */
async function handleAnalytics(req, res, cors) {
  const { user } = await requireSession(req);
  const scope = analyticsScope(req);
  const analytics = buildAnalyticsSummary(store.attemptsForUser(user.id), { scope });
  sendJson(res, 200, { ok: true, analytics }, cors);
}

/**
 * Real dataset courses to open next, chosen from the signed-in account's competency
 * gaps.
 *
 * The gap ranking is the analytics engine's own (gap x weakness x confidence), and the
 * courses are whatever the dataset holds — this endpoint only bridges the two
 * vocabularies (see course-recommendations.mjs) and never invents a score or a course.
 * Session-guarded because it reads the learner's private results, unlike the public
 * course catalogue. A brand-new account, or one with no matchable gap, gets a valid
 * empty payload with a `note`, not an error.
 */
async function handleRecommendedCourses(req, res, cors) {
  const { user } = await requireSession(req);
  // `?scope=latest` derives the gaps (and so the courses) from the newest sitting alone,
  // for the Knowledge check page; omitted (`all`) it ranks gaps across the whole history,
  // as the Dashboard does. Validated by the same guard as the competencies endpoint.
  const scope = analyticsScope(req);
  const analytics = buildAnalyticsSummary(store.attemptsForUser(user.id), { scope });

  // The learner facts the quality gate and explanations need — all derived from data we
  // already hold (analytics + the account's saved course progress). No new reads of anything
  // sensitive; competency scores and completed-course ids only.
  const context = buildLearnerContext(user.id, analytics);

  // Route through the service rather than calling the engine directly. The response keeps
  // every field the UI already reads (available/measured/hasGaps/groups/courses/note) and
  // gains an additive `strategy` block; the interaction count decides whether the hybrid
  // engine is even allowed to consult the ML ranker (it is not, until a model is trained).
  const recommendations = recommendationService.recommend(analytics, catalogue(), {
    interactionCount: store.interactionCount(),
    context,
  });

  // Record that these courses were shown, WITH the learner's competency-before / gap-before
  // for each — the anchor of the feedback loop (§11). After the learner studies and sits a
  // fresh assessment, competency_measured events carry the after-state, and buildTrainingRows
  // pairs them into a real improvement label. Each event is anonymised and allow-listed by
  // recommend/interactions.mjs before it reaches the store; no user id, email or document text
  // is ever written. Best-effort: a logging failure must never break the response.
  const scoreByComp = context.competencyScores;
  const gapByComp = new Map((analytics.gaps ?? []).map((g) => [g.competency, g.gap]));
  void logInteractions(
    (recommendations.courses ?? []).map((course) => ({
      userId: user.id,
      type: 'recommendation_shown',
      courseId: course.courseId,
      competency: course.forCompetency,
      competencyScoreBefore: scoreByComp.get(course.forCompetency),
      gapBefore: gapByComp.get(course.forCompetency),
      courseLevel: course.level,
      courseDurationHours: course.estimatedHours,
      courseCompetencies: course.competencies,
      strategy: recommendations.strategy?.engine,
      modelVersion: recommendations.strategy?.modelVersion,
    })),
  );

  sendJson(res, 200, { ok: true, recommendations }, cors);
}

/**
 * Assemble the learner context the recommendation pipeline needs, from data already on hand:
 *   - competencyScores  Map(competencyId -> current score)  from the analytics summary
 *   - learnerLevel      0..3 coarse level                    from the overall score
 *   - completedCourseIds Set                                 courses whose every lesson is done
 *   - weakTopicsByCompetency Map(compId -> [{topic,percent}]) the assessment's own weak topics
 *
 * Completion is computed against the dataset's real lesson count (getCourse), the same
 * denominator the UI shows, so "completed" here means genuinely finished, not merely started.
 */
function buildLearnerContext(userId, analytics) {
  const competencyScores = new Map(
    (analytics.competencies ?? []).map((c) => [c.competency, c.currentScore]),
  );
  // Fall back to gap rows if competencies[] is absent for any reason.
  for (const g of analytics.gaps ?? []) {
    if (!competencyScores.has(g.competency) && Number.isFinite(g.currentScore)) {
      competencyScores.set(g.competency, g.currentScore);
    }
  }

  const weakTopicsByCompetency = new Map();
  for (const c of analytics.competencies ?? []) {
    const weak = (c.topics ?? [])
      .filter((t) => t.status === 'weak' || (Number.isFinite(t.score) && t.score < 50))
      .map((t) => ({ topic: t.name, percent: t.score }));
    if (weak.length > 0) weakTopicsByCompetency.set(c.competency, weak);
  }

  const overall = Number.isFinite(analytics.attempts?.overallScore)
    ? analytics.attempts.overallScore
    : (analytics.overallScore ?? 0);
  const learnerLevel = learnerLevelRank(overall);

  const completedCourseIds = new Set();
  const profile = store.profileForUser(userId);
  const courses = profile && profile.courses ? profile.courses : {};
  for (const [courseId, record] of Object.entries(courses)) {
    const done = Array.isArray(record?.completedLessons) ? record.completedLessons.length : 0;
    if (done === 0) continue;
    try {
      const total = getCourse(courseId).lessonIds.length;
      if (total > 0 && done >= total) completedCourseIds.add(courseId);
    } catch {
      /* course not in the dataset any more — cannot confirm completion, so skip */
    }
  }

  return { competencyScores, learnerLevel, completedCourseIds, weakTopicsByCompetency };
}

/**
 * Anonymise, allow-list, and append a batch of learning-interaction events. This is the one
 * place events are written, so the privacy guarantees live here: `sanitizeEvent` rebuilds
 * each event from an allow-list (dropping any PII or document text) and hashes the user id
 * under the session secret; `forbiddenKeysIn` is a belt-and-braces check that refuses to log
 * a raw input that carries a forbidden field at all. Failures are swallowed on purpose —
 * training data is valuable but never worth failing a user-facing request over.
 */
async function logInteractions(rawEvents) {
  try {
    for (const raw of Array.isArray(rawEvents) ? rawEvents : []) {
      if (forbiddenKeysIn(raw).length > 0) continue; // caller assembled it wrongly — skip
      const event = sanitizeEvent({ ...raw, secret: INTERACTION_KEY });
      if (event) await store.addInteraction(event);
    }
  } catch {
    /* logging is best-effort; never surface to the caller */
  }
}

/**
 * Ask the model to put that analysis into sentences.
 *
 * The payload is rebuilt here from stored attempts and is not read from the request at
 * all. A body carrying its own scores would let the browser dictate what the model is
 * told, and the guarantee this endpoint makes — the numbers in the paragraph are the
 * numbers the server calculated — would be worth nothing. `?scope=` is the only thing
 * the caller gets to choose, and it only selects which attempts are analysed.
 *
 * Shares the AI rate limiter with generation and classification because it is the same
 * model on the same machine.
 */
async function handleExplainAnalytics(req, res, cors) {
  assertTrustedOrigin(req, ALLOWED_ORIGINS);
  const { user } = await requireSession(req);
  enforce(limiters.aiGenerationsPerIp, clientKey(req, TRUSTED_PROXY_HOPS));

  const scope = analyticsScope(req);
  const analytics = buildAnalyticsSummary(store.attemptsForUser(user.id), { scope });
  const outcome = await explainAnalytics(analytics, { env: process.env });

  console.log(
    `  analytics: explain provider=${outcome.explanation?.provider ?? outcome.provider ?? 'none'} ` +
      (outcome.ok ? `ok attempts=${outcome.explanation.attempts}` : `failed=${outcome.code}`),
  );

  if (!outcome.ok) {
    const status = ANALYTICS_FAILURE_STATUS[outcome.code] ?? AI_FAILURE_STATUS[outcome.code] ?? 502;
    sendJson(res, status, {
      ok: false,
      error: { code: outcome.code, message: outcome.message },
      // The charts do not need the model, so send the analysis regardless. A page that
      // loses its whole dashboard because Ollama is asleep would be a worse failure than
      // the one that actually happened.
      analytics,
    }, cors);
    return;
  }

  sendJson(res, 200, { ok: true, explanation: outcome.explanation, analytics }, cors);
}

/**
 * Two failures generation cannot produce. `no_data` is the caller's state, not a fault,
 * and `unverified` means the model worked and was caught inventing figures — a bad
 * gateway response, since the thing upstream returned something unusable.
 */
const ANALYTICS_FAILURE_STATUS = {
  no_data: 409,
  unverified: 502,
};

/* --------------------------------------------------------------------- ai */

/** Caps on the metadata that rides along with the text, so neither can be used to bloat a request. */
const MAX_TOPICS = 12;
const MAX_CONCEPTS = 60;
const MAX_LABEL_CHARS = 120;

/**
 * A defect in what the browser sent, phrased for the person who will read it.
 *
 * `fields` is what the Materials page uses to decide whether to blame the document or
 * the request, so the codes here are stable rather than prose.
 */
function badRequest(code, message, fields) {
  return new HttpError(400, code, message, fields);
}

function validateGenerationRequest(body) {
  if (!body || typeof body !== 'object') {
    throw badRequest('invalid_body', 'Send a JSON object with the extracted document text.');
  }

  if (typeof body.text !== 'string') {
    throw badRequest('text_required', 'No document text was sent.', { text: 'required' });
  }
  const text = body.text.trim();
  if (text === '') {
    throw badRequest('text_required', 'No document text was sent.', { text: 'required' });
  }
  if (text.length < MIN_TEXT_CHARS) {
    throw badRequest(
      'text_too_short',
      `This document only has ${text.length} characters of readable text. At least ${MIN_TEXT_CHARS} are needed to write questions worth answering.`,
      { text: 'too_short' },
    );
  }
  if (text.length > MAX_TEXT_CHARS) {
    throw badRequest(
      'text_too_long',
      `This document has ${text.length.toLocaleString('en-IN')} characters of text, which is more than the ${MAX_TEXT_CHARS.toLocaleString('en-IN')} this can process in one go. Try a single chapter or section.`,
      { text: 'too_long' },
    );
  }

  const list = (value, name, cap) => {
    if (value === undefined) return [];
    if (!Array.isArray(value)) {
      throw badRequest(`${name}_invalid`, `"${name}" must be an array.`, { [name]: 'invalid' });
    }
    if (value.length > cap) {
      throw badRequest(`${name}_invalid`, `Too many ${name} were sent.`, { [name]: 'invalid' });
    }
    return value
      .filter((entry) => typeof entry === 'string')
      .map((entry) => entry.trim().slice(0, MAX_LABEL_CHARS))
      .filter((entry) => entry !== '');
  };

  const topics = list(body.topics, 'topics', MAX_TOPICS);
  const concepts = list(body.concepts, 'concepts', MAX_CONCEPTS);

  let questionCount = TARGET_QUESTIONS;
  if (body.questionCount !== undefined) {
    if (!Number.isInteger(body.questionCount)) {
      throw badRequest('question_count_invalid', `"questionCount" must be a whole number between ${MIN_QUESTIONS} and ${MAX_QUESTIONS}.`, { questionCount: 'invalid' });
    }
    if (body.questionCount < MIN_QUESTIONS || body.questionCount > MAX_QUESTIONS) {
      throw badRequest('question_count_invalid', `"questionCount" must be between ${MIN_QUESTIONS} and ${MAX_QUESTIONS}.`, { questionCount: 'invalid' });
    }
    questionCount = body.questionCount;
  }

  // Difficulty is optional and, unlike the count, never fatal: an unrecognised value is
  // dropped rather than rejected, because it only tunes the prompt and a bad one should
  // fall back to the balanced default, not fail the whole request.
  let difficulty;
  if (typeof body.difficulty === 'string') {
    const wanted = body.difficulty.trim().toLowerCase();
    if (wanted === 'easy' || wanted === 'medium' || wanted === 'hard') difficulty = wanted;
  }

  return { text, topics, concepts, questionCount, difficulty };
}

/**
 * Which HTTP status an AI failure deserves.
 *
 * Split by whose fault it is, because the page reacts differently: 503 means "the
 * operator has not finished setting this up", 502/504 mean "the provider is having a
 * bad day, try again", and 422 means "your document was fine, there just was not enough
 * in it" — which is not an error the user should be told to retry.
 */
const AI_FAILURE_STATUS = {
  not_configured: 503,
  rate_limited: 429,
  timeout: 504,
  network_error: 502,
  provider_error: 502,
  insufficient_questions: 422,
};

/**
 * STUDY MATERIAL ONLY server-side gate for the text (small-document) AI routes (spec §10/§17).
 * Runs the local, no-AI guard on the extracted text so a client that bypasses the frontend
 * cannot push a marksheet / ID / bank statement / medical report / resume / form into
 * generation or classification. The document text is never logged (spec §14). pageCount is
 * estimated from length only to feed the length-aware signals; the char-based checks dominate.
 */
function guardExtractedText(text) {
  const estPages = Math.max(1, Math.round((typeof text === 'string' ? text.length : 0) / 1800));
  return guardDocument({ text, filename: '', pageCount: estPages, charsPerPage: null });
}

/**
 * Generate MCQs from an uploaded document.
 *
 * The browser has already extracted the text and pulled out topics; this route adds the
 * things that must not happen in a browser tab — holding the provider key, calling the
 * provider, and refusing to believe what it says until every question has been checked
 * against the document it claims to quote.
 *
 * There is deliberately no fallback to the deterministic generator in ./src/lib. If the
 * provider is unconfigured or down, this returns an honest failure and the page says so.
 * Quietly serving locally-assembled questions under an "AI generated" label would be a
 * lie the user has no way to detect.
 */
async function handleGenerateMcqs(req, res, cors) {
  assertTrustedOrigin(req, ALLOWED_ORIGINS);
  // Session first, then the budget, so an anonymous flood cannot spend a real user's
  // quota — same order as every other write on this server.
  await requireSession(req);
  enforce(limiters.aiGenerationsPerIp, clientKey(req, TRUSTED_PROXY_HOPS));

  const body = await readJsonBody(req, { maxBytes: MAX_AI_BODY_BYTES });
  const input = validateGenerationRequest(body);

  // STUDY MATERIAL ONLY enforcement (spec §10/§15/§17): reject non-study documents here,
  // server-side, BEFORE any Gemini call. A rejected document (marksheet, ID, financial,
  // medical, resume, form, unknown, …) never reaches the provider.
  const guard = guardExtractedText(input.text);
  if (guard.decision === 'reject') {
    console.log(`  ai.guard: generation blocked type=${guard.documentType} conf=${guard.confidence}`);
    sendJson(res, 422, { ok: false, error: { code: 'document_rejected', message: guard.message }, documentType: guard.documentType }, cors);
    return;
  }

  const outcome = await generateMcqs(input, { env: process.env });

  // Counts and the provider name only. The document text and the questions themselves
  // are never logged: this is the one route that sees a learner's material. The debug
  // breakdown answers "asked for N, got M?" at a glance — how many the model parsed,
  // how many were valid, how many were duplicates vs. other rejects, and how many the
  // document-grounded backfill added to hit the requested count.
  const dbg = outcome.debug ?? {};
  console.log(
    `  ai: provider=${outcome.meta.provider} chunks=${outcome.meta.chunks} calls=${outcome.meta.calls} ` +
      `asked=${outcome.meta.asked} accepted=${outcome.meta.accepted} rejected=${outcome.meta.rejected}` +
      (outcome.ok ? '' : ` failed=${outcome.code}`),
  );
  console.log(
    `  ai.count: requested=${dbg.requestedCount} parsed=${dbg.parsedQuestionCount} valid=${dbg.validQuestionCount} ` +
      `duplicate=${dbg.duplicateQuestionCount} rejected=${dbg.rejectedQuestionCount} ` +
      `backfill=${dbg.backfillQuestionCount} final=${dbg.finalQuestionCount}`,
  );

  if (!outcome.ok) {
    const status = AI_FAILURE_STATUS[outcome.code] ?? 502;
    sendJson(res, status, {
      ok: false,
      error: { code: outcome.code, message: outcome.message },
      // A shortfall still returns what survived validation, so the page can say "6 of 10"
      // rather than an unexplained failure.
      questions: outcome.questions ?? [],
      meta: outcome.meta,
    }, cors);
    return;
  }

  sendJson(res, 200, {
    ok: true,
    questions: outcome.questions,
    meta: outcome.meta,
  }, cors);
}

/**
 * Classify an uploaded document before generating questions.
 *
 * Takes the extracted text and asks the local model what kind of document it is —
 * study material, marksheet, report, etc. The page uses this to warn the learner
 * before spending thirty seconds on MCQ generation from a document that cannot
 * yield good questions.
 *
 * Shares the AI rate-limiter with generation, because it is the same model.
 */
async function handleClassifyMaterial(req, res, cors) {
  assertTrustedOrigin(req, ALLOWED_ORIGINS);
  await requireSession(req);
  enforce(limiters.aiGenerationsPerIp, clientKey(req, TRUSTED_PROXY_HOPS));

  const body = await readJsonBody(req, { maxBytes: MAX_AI_BODY_BYTES });

  if (!body || typeof body !== 'object') {
    throw badRequest('invalid_body', 'Send a JSON object with the extracted document text.');
  }
  if (typeof body.text !== 'string' || body.text.trim() === '') {
    throw badRequest('text_required', 'No document text was sent for classification.', { text: 'required' });
  }
  const text = body.text.trim();
  if (text.length < MIN_TEXT_CHARS) {
    throw badRequest(
      'text_too_short',
      `This document only has ${text.length} characters of readable text. At least ${MIN_TEXT_CHARS} are needed to classify it.`,
      { text: 'too_short' },
    );
  }

  // STUDY MATERIAL ONLY enforcement (spec §3/§10): a rejected personal/sensitive document is
  // NEVER sent to Gemini — not even for classification. The local guard decides first.
  const guard = guardExtractedText(text);
  if (guard.decision === 'reject') {
    console.log(`  ai.guard: classify blocked type=${guard.documentType} conf=${guard.confidence}`);
    sendJson(res, 422, { ok: false, error: { code: 'document_rejected', message: guard.message }, documentType: guard.documentType }, cors);
    return;
  }

  const result = await classifyMaterial({ text }, { env: process.env });

  // Counts only — no document text in the log.
  if (result.ok) {
    console.log(`  ai: classified as ${result.classification.type} (confidence=${result.classification.confidence})`);
  } else {
    console.log(`  ai: classification failed: ${result.code}`);
  }

  if (!result.ok) {
    const status = AI_FAILURE_STATUS[result.code] ?? 502;
    sendJson(res, status, {
      ok: false,
      error: { code: result.code, message: result.message },
    }, cors);
    return;
  }

  sendJson(res, 200, {
    ok: true,
    classification: result.classification,
  }, cors);
}

/* --------------------------------------------------------------- courses */

/**
 * The dataset courses are public reference content, not a learner's private data,
 * so these three reads do not require a session — the same way a course catalogue
 * on a website is browsable before you log in. Progress *through* a course is
 * private and still goes through the session-guarded /api/progress/courses write.
 */
function queryParam(req, name) {
  return new URL(req.url ?? '/', 'http://internal').searchParams.get(name);
}

async function handleCoursesCatalogue(req, res, cors) {
  const id = queryParam(req, 'id');
  if (id !== null) {
    // ?id= returns one course's full module/lesson tree.
    sendJson(res, 200, { ok: true, course: getCourse(id) }, cors);
    return;
  }
  sendJson(res, 200, { ok: true, ...catalogue() }, cors);
}

/**
 * Stream one lesson file. `resolveContent` has already proven the path sits inside
 * that course's own folder, so nothing here can read outside the dataset. The file
 * is sent with its real content type and a length; it is cacheable because dataset
 * content does not change without a server restart.
 */
async function handleCourseContent(req, res, cors) {
  const id = queryParam(req, 'id');
  const file = queryParam(req, 'file');
  if (id === null || file === null) {
    throw new HttpError(400, 'invalid_input', 'Both id and file are required.');
  }
  const { path, contentType } = resolveContent(id, file);
  const size = statSync(path).size;
  res.writeHead(200, {
    ...cors,
    'Content-Type': contentType,
    'Content-Length': size,
    'Cache-Control': 'private, max-age=3600',
    // Inline for things a browser renders (PDF, text, images); the UI opens these in a new tab.
    'Content-Disposition': 'inline',
    'X-Content-Type-Options': 'nosniff',
  });
  const stream = createReadStream(path);
  stream.on('error', () => {
    if (!res.headersSent) sendJson(res, 500, { ok: false, error: { code: 'read_failed', message: 'Could not read the file.' } }, cors);
    else res.end();
  });
  stream.pipe(res);
}

/* --------------------------------------------------- large-document pipeline */

/**
 * Smart Document Intelligence routes. A large book is never sent whole to the AI: it is
 * uploaded as bounded page batches, chunked and indexed ONCE, then a topic search retrieves
 * only the relevant chunks and MCQ generation runs on that bounded context. Every route is
 * session-guarded and every document lookup is ownership-checked in documentStore, so one
 * account can never read or search another's uploads.
 */

const MAX_TOPIC_QUERY_CHARS = 200;
const MAX_PAGE_BATCH = 400; // pages per append request — keeps any single request bounded

// A single scanned-page image, base64-encoded, is far larger than a JSON text batch.
// Bound it to the configured decoded ceiling plus base64 inflation (~4/3) and a little
// slack for the surrounding JSON, so the route accepts a real page image but nothing wild.
const MAX_OCR_BODY_BYTES = Math.ceil((docConfig.ocr.maxImageBytes * 4) / 3) + 16 * 1024;

function requireDocId(body) {
  const id = typeof body?.documentId === 'string' ? body.documentId.trim() : '';
  if (id === '') throw badRequest('document_required', 'A documentId is required.', { documentId: 'required' });
  return id;
}

/** Create a document record for a staged upload. Body: { filename, sizeBytes }. */
async function handleDocumentUpload(req, res, cors) {
  assertTrustedOrigin(req, ALLOWED_ORIGINS);
  const { user } = await requireSessionForWrite(req);
  enforce(limiters.aiGenerationsPerIp, clientKey(req, TRUSTED_PROXY_HOPS));
  const body = await readJsonBody(req, { maxBytes: MAX_AI_BODY_BYTES });
  if (!body || typeof body !== 'object') throw badRequest('invalid_body', 'Send a JSON object.');
  const filename = typeof body.filename === 'string' && body.filename.trim() !== '' ? body.filename.trim() : 'document';
  const sizeBytes = Number.isInteger(body.sizeBytes) ? body.sizeBytes : 0;
  if (sizeBytes > docConfig.upload.maxBytes) {
    throw badRequest('file_too_large', `That file is larger than the ${(docConfig.upload.maxBytes / (1024 * 1024)).toFixed(0)} MB limit.`, { file: 'too_large' });
  }
  const doc = await documentStore.createDocument({ userId: user.id, filename, sizeBytes });
  sendJson(res, 201, { ok: true, documentId: doc.id, document: publicDocument(doc) }, cors);
}

/** Append a bounded batch of extracted pages. Body: { documentId, pages:[{page,text}] }. */
async function handleDocumentAppend(req, res, cors) {
  assertTrustedOrigin(req, ALLOWED_ORIGINS);
  const { user } = await requireSessionForWrite(req);
  const body = await readJsonBody(req, { maxBytes: MAX_AI_BODY_BYTES });
  const documentId = requireDocId(body);
  if (!documentStore.getDocument(user.id, documentId)) throw new HttpError(404, 'not_found', 'No such document.');
  if (!Array.isArray(body.pages) || body.pages.length === 0) throw badRequest('pages_required', 'Send a non-empty pages array.');
  if (body.pages.length > MAX_PAGE_BATCH) throw badRequest('batch_too_large', `Send at most ${MAX_PAGE_BATCH} pages per request.`);
  const pages = body.pages
    .filter((p) => p && (typeof p.text === 'string'))
    .map((p, i) => {
      const page = { page: Number.isInteger(p.page) ? p.page : i + 1, text: String(p.text).slice(0, 200_000) };
      // Preserve optional extraction provenance so OCR'd pages stay distinguishable from
      // typed ones all the way through chunking. Only a known source label is accepted.
      if (p.source === 'ocr' || p.source === 'ocr_failed' || p.source === 'native_text') page.source = p.source;
      if (typeof p.confidence === 'number' && p.confidence >= 0 && p.confidence <= 1) page.confidence = p.confidence;
      return page;
    });
  let total;
  try {
    total = await documentStore.appendPages(user.id, documentId, pages, { maxPages: docConfig.upload.maxPages });
  } catch (error) {
    if (error instanceof DocumentPageLimitError) {
      throw badRequest('too_many_pages', `This document exceeds the ${docConfig.upload.maxPages}-page limit.`);
    }
    throw error;
  }
  sendJson(res, 200, { ok: true, documentId, pageCount: total }, cors);
}

/** Finalize: classify, chunk, index, run the job on the accumulated pages. Body: { documentId }. */
async function handleDocumentFinalize(req, res, cors) {
  assertTrustedOrigin(req, ALLOWED_ORIGINS);
  const { user } = await requireSessionForWrite(req);
  enforce(limiters.aiGenerationsPerIp, clientKey(req, TRUSTED_PROXY_HOPS));
  const body = await readJsonBody(req, { maxBytes: MAX_AI_BODY_BYTES });
  const documentId = requireDocId(body);
  const outcome = await finalizeDocument({ store: documentStore, userId: user.id, documentId, env: process.env });
  console.log(`  doc.finalize: id=${documentId} ok=${outcome.ok} type=${outcome.classification?.documentType ?? '-'} mode=${outcome.mode ?? '-'} chunks=${outcome.document?.chunkCount ?? 0}`);
  if (!outcome.ok) {
    // A study-material rejection carries the category so the client can show the precise
    // message; the reason string is safe metadata (no personal content). Other failures are
    // unchanged (404 for not_found, 422 otherwise).
    sendJson(res, outcome.code === 'not_found' ? 404 : 422, {
      ok: false,
      error: { code: outcome.code, message: outcome.message },
      ...(outcome.documentType ? { documentType: outcome.documentType } : {}),
    }, cors);
    return;
  }
  sendJson(res, 200, {
    ok: true,
    document: publicDocument(outcome.document),
    job: outcome.job,
    classification: outcome.classification,
    mode: outcome.mode,
    isLargeMode: outcome.isLargeMode,
  }, cors);
}

/**
 * Map a provider-neutral OCR failure code to an HTTP status. Codes come from either the local
 * adapter or the hosted (official_api) adapter; both are provider-neutral by design. Anything
 * not listed is a bad upstream reply → 502. None of these statuses ever carries a secret: the
 * body is only { code, message } where message is a fixed, safe string.
 *   503  OCR can't serve right now (disabled, not configured, auth misconfig, unreachable)
 *   504  the engine took too long
 *   429  the cloud service is rate-limiting us
 *   400  the caller's own input was bad (missing / oversized image)
 *   502  malformed / empty / rejected upstream response (default)
 */
const OCR_PAGE_STATUS_BY_CODE = Object.freeze({
  ocr_disabled: 503,
  ocr_not_configured: 503,
  ocr_auth_failed: 503,
  ocr_unavailable: 503,
  service_unavailable: 503,
  connection_error: 503,
  connection_reset: 503,
  bad_config: 503,
  timeout: 504,
  ocr_rate_limited: 429,
  image_too_large: 400,
  image_required: 400,
});

/**
 * OCR a single scanned page image and return its recognised text. The browser has already
 * rasterised only the low-text pages (native extraction runs there first), so this receives
 * at most one page image per request — the "never send 1000 pages at once" rule holds by
 * construction. The image is bytes, never a path, so there is no file-read surface. An OCR
 * failure is reported honestly (source:'ocr_failed'); it never crashes the request.
 * Body: { documentId, pageNumber, imageBase64 }.
 */
async function handleDocumentOcrPage(req, res, cors) {
  assertTrustedOrigin(req, ALLOWED_ORIGINS);
  const { user } = await requireSession(req);
  enforce(limiters.ocrPagesPerIp, clientKey(req, TRUSTED_PROXY_HOPS));
  if (!docConfig.ocr.enabled) throw new HttpError(503, 'ocr_disabled', 'OCR is not enabled on this server.');

  const body = await readJsonBody(req, { maxBytes: MAX_OCR_BODY_BYTES });
  // documentId is OPTIONAL here: OCR is stateless (image bytes in, text out) and writes
  // nothing to the document, so a small scanned PDF that was never staged server-side can
  // still be recognised. When an id IS supplied we verify ownership as defence in depth;
  // the session cookie and per-IP rate limiter gate the endpoint either way.
  const documentId = typeof body?.documentId === 'string' ? body.documentId.trim() : '';
  if (documentId !== '' && !documentStore.getDocument(user.id, documentId)) throw new HttpError(404, 'not_found', 'No such document.');

  const imageBase64 = typeof body.imageBase64 === 'string' ? body.imageBase64 : '';
  if (imageBase64 === '') throw badRequest('image_required', 'A page image is required.', { imageBase64: 'required' });
  const pageNumber = Number.isInteger(body.pageNumber) ? body.pageNumber : null;
  // stubText is honoured only by the stub engine (tests); the real engine ignores it.
  const stubText = typeof body.stubText === 'string' ? body.stubText : undefined;

  const result = await ocrImage({ imageBase64, pageNumber, stubText, cfg: docConfig, env: process.env });
  if (!result.ok) {
    // The failure code is provider-neutral, so this map covers local and cloud alike. The log
    // records ONLY the code — never the token, the recognised text, or the image bytes.
    const status = OCR_PAGE_STATUS_BY_CODE[result.code] ?? 502;
    console.log(`  doc.ocr-page: doc=${documentId ? documentId.slice(0, 8) : '-'} page=${pageNumber ?? '-'} failed=${result.code}`);
    sendJson(res, status, { ok: false, error: { code: result.code, message: result.message }, page: pageNumber, source: 'ocr_failed' }, cors);
    return;
  }
  console.log(`  doc.ocr-page: doc=${documentId ? documentId.slice(0, 8) : '-'} page=${pageNumber ?? '-'} lines=${result.lineCount} conf=${result.confidence}`);
  sendJson(res, 200, {
    ok: true, page: pageNumber, source: 'ocr',
    text: result.text, confidence: result.confidence, lineCount: result.lineCount, engine: result.engine,
  }, cors);
}

/** List the signed-in user's documents (metadata only). */
async function handleDocumentList(req, res, cors) {
  const { user } = await requireSession(req);
  const docs = documentStore.listDocuments(user.id).map(publicDocument);
  sendJson(res, 200, { ok: true, documents: docs }, cors);
}

/**
 * Whether OCR is available right now, so the browser can decide before it bothers
 * rasterising a scanned page. Reports config state without ever blocking on a slow
 * engine and without ever leaking a secret: if OCR is disabled (master switch off or
 * provider 'disabled') it answers instantly; the local provider probes the loopback
 * service with a short timeout; the hosted (official_api) provider answers from config
 * alone (token present?) with no network call and the token itself never included.
 */
async function handleDocumentOcrHealth(req, res, cors) {
  await requireSession(req);
  if (!docConfig.ocr.enabled || docConfig.ocr.provider === 'disabled') {
    sendJson(res, 200, { ok: true, enabled: false, available: false }, cors);
    return;
  }
  const health = await ocrHealth({ cfg: docConfig, env: process.env });
  sendJson(res, 200, { ok: true, enabled: true, ...health }, cors);
}

/** Job status for the processing progress UI. Query: ?id=jobId. */
async function handleDocumentJob(req, res, cors) {
  const { user } = await requireSession(req);
  const id = queryParam(req, 'id');
  if (!id) throw badRequest('job_required', 'A job id is required.');
  const job = documentStore.getJob(user.id, id);
  if (!job) throw new HttpError(404, 'not_found', 'No such job.');
  sendJson(res, 200, { ok: true, job: jobView(job) }, cors);
}

/** Topic search over one/more owned documents. Body: { documentId | documentIds, query }. */
async function handleDocumentSearch(req, res, cors) {
  assertTrustedOrigin(req, ALLOWED_ORIGINS);
  const { user } = await requireSessionForWrite(req);
  const body = await readJsonBody(req, { maxBytes: MAX_AI_BODY_BYTES });
  const query = typeof body?.query === 'string' ? body.query.trim().slice(0, MAX_TOPIC_QUERY_CHARS) : '';
  if (query === '') throw badRequest('query_required', 'Enter a topic to search for.', { query: 'required' });
  const documentIds = normalizeDocIds(body);
  const result = await searchDocuments({ store: documentStore, userId: user.id, documentIds, query, env: process.env });
  if (!result.ok) {
    sendJson(res, result.code === 'no_documents' ? 404 : 400, { ok: false, error: { code: result.code, message: result.message } }, cors);
    return;
  }
  console.log(`  doc.search: user=${user.id.slice(0, 8)} docs=${documentIds.length} q="${query.slice(0, 40)}" found=${result.found}`);
  // Topic-not-found: no fabrication. Offer section-title suggestions from the document.
  if (result.found === 0) {
    const suggestions = await documentSectionSuggestions(user.id, documentIds);
    sendJson(res, 200, { ok: true, query, found: 0, topicFound: false, suggestions }, cors);
    return;
  }
  sendJson(res, 200, {
    ok: true,
    query,
    topicFound: true,
    found: result.found,
    sections: result.sections,
    chapters: result.chapters,
    pageRanges: result.pageRanges,
    estimatedTokens: result.estimatedTokens,
    // A short preview only — never the whole book.
    preview: result.retrieval.usedChunks.slice(0, 3).map((c) => ({ pageStart: c.pageStart, pageEnd: c.pageEnd, section: c.section, snippet: c.text.slice(0, 240) })),
  }, cors);
}

/** Generate MCQs (and optionally material) from a topic over owned documents. */
async function handleDocumentGenerate(req, res, cors) {
  assertTrustedOrigin(req, ALLOWED_ORIGINS);
  const { user } = await requireSessionForWrite(req);
  enforce(limiters.aiGenerationsPerIp, clientKey(req, TRUSTED_PROXY_HOPS));
  const body = await readJsonBody(req, { maxBytes: MAX_AI_BODY_BYTES });
  const query = typeof body?.query === 'string' ? body.query.trim().slice(0, MAX_TOPIC_QUERY_CHARS) : '';
  if (query === '') throw badRequest('query_required', 'A topic is required.', { query: 'required' });
  const documentIds = normalizeDocIds(body);
  let questionCount = TARGET_QUESTIONS;
  if (body.questionCount !== undefined) {
    if (!Number.isInteger(body.questionCount) || body.questionCount < MIN_QUESTIONS || body.questionCount > MAX_QUESTIONS) {
      throw badRequest('question_count_invalid', `"questionCount" must be between ${MIN_QUESTIONS} and ${MAX_QUESTIONS}.`, { questionCount: 'invalid' });
    }
    questionCount = body.questionCount;
  }
  const difficulty = ['easy', 'medium', 'hard'].includes(body.difficulty) ? body.difficulty : undefined;
  const wantMaterial = body.wantMaterial === true;
  const materialStyle = typeof body.materialStyle === 'string' ? body.materialStyle : 'revision';

  const outcome = await generateFromTopic({
    store: documentStore, userId: user.id, documentIds, query, questionCount, difficulty, wantMaterial, materialStyle, env: process.env,
  });
  // Structured debug line — the "asked for 20, got N?" breakdown, no document text.
  const d = outcome.debug ?? {};
  console.log(`  doc.generate: q="${query.slice(0, 40)}" requested=${questionCount} parsed=${d.parsedQuestionCount ?? '-'} valid=${d.validQuestionCount ?? '-'} dup=${d.duplicateQuestionCount ?? '-'} rej=${d.rejectedQuestionCount ?? '-'} backfill=${d.backfillQuestionCount ?? '-'} final=${d.finalQuestionCount ?? (outcome.questions?.length ?? 0)}${outcome.ok ? '' : ` failed=${outcome.code}`}`);
  if (!outcome.ok) {
    const status = AI_FAILURE_STATUS[outcome.code] ?? 502;
    sendJson(res, status, { ok: false, error: { code: outcome.code, message: outcome.message }, questions: outcome.questions ?? [], preview: outcome.preview ?? null }, cors);
    return;
  }
  sendJson(res, 200, { ok: true, query, questions: outcome.questions, meta: outcome.meta, preview: outcome.preview, material: outcome.material }, cors);
}

/** Analyze a finalized marksheet document into performance + competency gaps. */
async function handleDocumentMarksheet(req, res, cors) {
  assertTrustedOrigin(req, ALLOWED_ORIGINS);
  const { user } = await requireSessionForWrite(req);
  const body = await readJsonBody(req, { maxBytes: MAX_AI_BODY_BYTES });
  const documentId = requireDocId(body);
  const doc = documentStore.getDocument(user.id, documentId);
  if (!doc) throw new HttpError(404, 'not_found', 'No such document.');
  const chunks = await documentStore.getChunks(user.id, documentId);
  const text = (chunks ?? []).map((c) => c.text).join('\n');
  if (text.trim() === '') throw badRequest('not_indexed', 'This document has not finished processing yet.');
  const marksheet = extractMarksheet(text);
  const analysis = analyzePerformance(marksheet);
  sendJson(res, 200, { ok: true, documentId, marksheet, analysis }, cors);
}

/** Rename a document. Body: { documentId, title }. */
async function handleDocumentRename(req, res, cors) {
  assertTrustedOrigin(req, ALLOWED_ORIGINS);
  const { user } = await requireSessionForWrite(req);
  const body = await readJsonBody(req, { maxBytes: MAX_BODY_BYTES });
  const documentId = requireDocId(body);
  const title = typeof body.title === 'string' ? body.title.trim() : '';
  if (title === '') throw badRequest('title_required', 'A new title is required.', { title: 'required' });
  const rec = await documentStore.renameDocument(user.id, documentId, title);
  if (!rec) throw new HttpError(404, 'not_found', 'No such document.');
  sendJson(res, 200, { ok: true, document: publicDocument(rec) }, cors);
}

/** Delete a document and its chunks/job. Body or ?id=. */
async function handleDocumentDelete(req, res, cors) {
  assertTrustedOrigin(req, ALLOWED_ORIGINS);
  const { user } = await requireSessionForWrite(req);
  let id = queryParam(req, 'id');
  if (!id) { const body = await readJsonBody(req, { maxBytes: MAX_BODY_BYTES }); id = typeof body?.documentId === 'string' ? body.documentId.trim() : ''; }
  if (!id) throw badRequest('document_required', 'A documentId is required.');
  const removed = await documentStore.deleteDocument(user.id, id);
  if (!removed) throw new HttpError(404, 'not_found', 'No such document.');
  sendJson(res, 200, { ok: true, deleted: id }, cors);
}

/**
 * Local, NO-AI study-material guard (spec §4/§9/§10). The frontend calls this BEFORE it
 * parses, uploads, or generates, so a non-study document is stopped without any Gemini call
 * and without starting a large-document job. Server-side enforcement in the generate /
 * finalize / classify routes is the authoritative gate; this route lets the UI fail fast
 * with the correct, professional message. Body: { text, filename?, pageCount?, charsPerPage? }.
 * The text is capped to a head sample and is never logged (spec §14).
 */
async function handleDocumentGuard(req, res, cors) {
  assertTrustedOrigin(req, ALLOWED_ORIGINS);
  await requireSession(req);
  enforce(limiters.aiGenerationsPerIp, clientKey(req, TRUSTED_PROXY_HOPS));
  const body = await readJsonBody(req, { maxBytes: MAX_AI_BODY_BYTES });
  if (!body || typeof body !== 'object') throw badRequest('invalid_body', 'Send a JSON object with the extracted document text.');
  const text = typeof body.text === 'string' ? body.text.slice(0, 8000) : '';
  const filename = typeof body.filename === 'string' ? body.filename.slice(0, 256) : '';
  const pageCount = Number.isInteger(body.pageCount) && body.pageCount > 0 ? body.pageCount : Math.max(1, Math.round(text.length / 1800));
  const charsPerPage = typeof body.charsPerPage === 'number' && body.charsPerPage >= 0 ? body.charsPerPage : null;
  const guard = guardDocument({ text, filename, pageCount, charsPerPage });
  console.log(`  doc.guard: decision=${guard.decision} type=${guard.documentType} conf=${guard.confidence}`);
  sendJson(res, 200, {
    ok: true,
    decision: guard.decision,
    accepted: guard.decision === 'accept',
    documentType: guard.documentType,
    confidence: guard.confidence,
    reason: guard.reason,
    message: guard.decision === 'reject' ? guard.message : null,
  }, cors);
}

/** The client-safe view of a document record (no internal paths, no other user's id leak). */
function publicDocument(doc) {
  if (!doc) return null;
  return {
    id: doc.id,
    title: doc.title,
    filename: doc.filename,
    documentType: doc.documentType,
    confidence: doc.confidence,
    mode: doc.mode,
    pageCount: doc.pageCount,
    chunkCount: doc.chunkCount,
    topicsIndexed: doc.topicsIndexed,
    status: doc.status,
    // OCR provenance (present only once a document has been finalised). All optional so a
    // document created before OCR existed simply omits them.
    ocrStatus: doc.ocrStatus ?? undefined,
    pagesOcred: doc.pagesOcred ?? undefined,
    pagesOcrFailed: doc.pagesOcrFailed ?? undefined,
    extractionMethod: doc.extractionMethod ?? undefined,
    createdAt: doc.createdAt,
  };
}

function normalizeDocIds(body) {
  if (Array.isArray(body?.documentIds)) return body.documentIds.filter((x) => typeof x === 'string').slice(0, 10);
  if (typeof body?.documentId === 'string') return [body.documentId];
  throw badRequest('document_required', 'A documentId or documentIds array is required.', { documentId: 'required' });
}

/** Section/chapter titles from a document's chunks, offered as "did you mean" suggestions. */
async function documentSectionSuggestions(userId, documentIds) {
  const titles = new Set();
  for (const id of documentIds) {
    // eslint-disable-next-line no-await-in-loop
    const chunks = await documentStore.getChunks(userId, id);
    for (const c of chunks ?? []) {
      if (c.section) titles.add(c.section);
      else if (c.chapter) titles.add(c.chapter);
      if (titles.size >= 8) break;
    }
  }
  return [...titles].slice(0, 8);
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
  ['POST /api/progress/profile', handleProfileDetails],
  ['POST /api/progress/courses', handleCourseProgress],
  ['GET /api/notifications', handleNotifications],
  ['POST /api/notifications/seen', handleNotificationsSeen],
  ['GET /api/analytics/competencies', handleAnalytics],
  ['GET /api/analytics/recommended-courses', handleRecommendedCourses],
  ['POST /api/analytics/explain', handleExplainAnalytics],
  ['POST /api/ai/generate-mcqs', handleGenerateMcqs],
  ['POST /api/ai/classify-material', handleClassifyMaterial],
  ['POST /api/papers', handleSavePaper],
  ['GET /api/papers', handlePapersGet],
  ['DELETE /api/papers', handleDeletePaper],
  ['GET /api/courses', handleCoursesCatalogue],
  ['GET /api/courses/content', handleCourseContent],
  ['POST /api/documents/upload', handleDocumentUpload],
  ['POST /api/documents/guard', handleDocumentGuard],
  ['POST /api/documents/append', handleDocumentAppend],
  ['POST /api/documents/ocr-page', handleDocumentOcrPage],
  ['POST /api/documents/finalize', handleDocumentFinalize],
  ['GET /api/documents', handleDocumentList],
  ['GET /api/documents/ocr-health', handleDocumentOcrHealth],
  ['GET /api/documents/job', handleDocumentJob],
  ['POST /api/documents/search', handleDocumentSearch],
  ['POST /api/documents/generate', handleDocumentGenerate],
  ['POST /api/documents/marksheet', handleDocumentMarksheet],
  ['POST /api/documents/rename', handleDocumentRename],
  ['DELETE /api/documents', handleDocumentDelete],
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
  const ai = providerStatus(process.env);
  console.log(`
  NEXORA AI auth server
  ---------------------
  URL        http://${HOST}:${PORT}
  Accounts   ${counts.users}
  Sessions   ${counts.sessions}
  Attempts   ${counts.attempts}
  Saved sets ${counts.papers}
  Data       ${DATA_DIR} (users, sessions, attempts, profiles, papers)
  Courses    ${coursesStatus().root ? `${coursesStatus().count} from ${coursesStatus().root}` : 'no dataset found (set NEXORA_DATASET_DIR) — /api/courses returns an empty catalogue'}
  Assessment ${ASSESSMENT_LENGTH} questions, graded here (the browser never sees the key)
  AI         ${ai.ok ? `${ai.provider} ready (${describeModel(process.env)})${describeTarget(process.env) ? ` at ${describeTarget(process.env)}` : ''}` : `${ai.provider} NOT configured — question generation will return an honest error`}
  Hashing    scrypt (Node built-in), min ${PASSWORD_POLICY.min} character password
  Origins    ${[...ALLOWED_ORIGINS].join(', ')}
  Cookie     ${SESSION_COOKIE}; HttpOnly; SameSite=Lax${COOKIE_SECURE ? '; Secure' : ' (Secure off — http is fine on localhost)'}
  Env file   ${usedEnvFile ? 'server/.env loaded' : 'no server/.env (using defaults)'}
`);

  if (!ai.ok) {
    console.log(
      '  Note: AI question generation is off. Uploading material will report that\n' +
        '  it is not configured rather than inventing questions. To switch it on,\n' +
        '  add ONE of these to server/.env:\n\n' +
        '    a cloud model:   AI_PROVIDER=gemini\n' +
        '                     GEMINI_API_KEY=your-key-here\n\n' +
        '    a local model:   AI_PROVIDER=local\n' +
        '                     (needs Ollama running: ollama run gpt-oss:20b)\n',
    );
  }

  if (ai.provider === 'mock') {
    console.log(
      '  WARNING: AI_PROVIDER=mock. Questions come from a canned file, not a model.\n' +
        '  This is for tests only — do not demo with it.\n',
    );
  }

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
