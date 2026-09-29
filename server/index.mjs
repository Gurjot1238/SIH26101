#!/usr/bin/env node
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
const TRUSTED_PROXY_HOPS = TRUST_PROXY ? envInt('TRUSTED_PROXY_HOPS', 1) : 0;

const ALLOWED_ORIGINS = new Set(
  (process.env.ALLOWED_ORIGINS || 'http://localhost:5173,http://127.0.0.1:5173')
    .split(',')
    .map((value) => value.trim().replace(/\/$/, ''))
    .filter(Boolean),
);

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

const SESSION_FP_KEY = deriveSubkey(sessionSecret, 'session-fingerprint:v1');
const INTERACTION_KEY = deriveSubkey(sessionSecret, 'interaction-pseudonym:v1');

const AI_GENERATION_LIMIT = (() => {
  const configured = envIntAllowingZero('AI_GENERATION_LIMIT', 30);
  if (configured > 0) return configured;
  if (providerStatus(process.env).provider !== 'gemini') return 0;
  const safe = 30;
  console.warn(
    '[ai] AI_GENERATION_LIMIT=0 (unlimited) is unsafe with a metered provider — each '
    + `generation bills the provider. Clamping to ${safe} requests/IP/hour. Set `
    + 'AI_GENERATION_LIMIT to a positive number to choose your own cap.',
  );
  return safe;
})();

const limiters = {
  signupAttemptsPerIp: createRateLimiter({ name: 'signup-attempts/ip', limit: envInt('SIGNUP_ATTEMPT_LIMIT', 40), windowMs: 60 * 60 * 1000 }),
  signupCreatedPerIp: createRateLimiter({ name: 'signup-created/ip', limit: envInt('SIGNUP_LIMIT', 5), windowMs: 60 * 60 * 1000 }),
  loginPerAccount: createRateLimiter({ name: 'login/account', limit: envInt('LOGIN_LIMIT', 8), windowMs: 15 * 60 * 1000 }),
  loginPerIp: createRateLimiter({ name: 'login/ip', limit: envInt('LOGIN_IP_LIMIT', 30), windowMs: 15 * 60 * 1000 }),
  loginPerAccountGlobal: createRateLimiter({ name: 'login/account-global', limit: envInt('LOGIN_ACCOUNT_LIMIT', 50), windowMs: 60 * 60 * 1000 }),
  progressWritesPerIp: createRateLimiter({ name: 'progress-writes/ip', limit: envInt('PROGRESS_WRITE_LIMIT', 240), windowMs: 60 * 60 * 1000 }),
  aiGenerationsPerIp: createRateLimiter({ name: 'ai-generations/ip', limit: AI_GENERATION_LIMIT, windowMs: 60 * 60 * 1000 }),
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

const store = await openStore(DATA_DIR);
const documentStore = await openDocumentStore(join(DATA_DIR, 'documents'));
const docConfig = loadConfig(process.env);
await warmUp();

const recommendationService = new RecommendationService();

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
  await store.touchSession(fingerprint, nextExpiry, { persist: nextExpiry - session.expiresAt > 10 * 60 * 1000 });
  return { user, fingerprint };
}

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
    throw new HttpError(409, 'email_taken', 'An account with that email already exists.', {
      email: 'An account with that email already exists.',
    });
  }

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
  const ok = user ? await verifyPassword(password, user.passwordHash) : await burnTime(password);

  if (!ok || !user) {
    enforce(limiters.loginPerAccountGlobal, email);
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
  const session = await currentUser(req);
  if (session) Object.assign(base, store.counts());
  sendJson(res, 200, base, cors);
}

async function requireSession(req) {
  const session = await currentUser(req);
  if (!session) throw new HttpError(401, 'not_authenticated', 'You are not signed in.');
  return session;
}

async function requireSessionForWrite(req) {
  assertTrustedOrigin(req, ALLOWED_ORIGINS);
  const session = await requireSession(req);
  enforce(limiters.progressWritesPerIp, clientKey(req, TRUSTED_PROXY_HOPS));
  return session;
}

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

function recentAttempts(attempts, limit) {
  return attempts.slice(-limit).reverse().map(publicAttempt);
}

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

  if (body.source === ASSESSMENT_SOURCE) {
    const message = 'An assessment is graded on the server. Submit it to /api/assessment/submit instead.';
    throw new HttpError(400, 'grade_on_server', message, { source: message });
  }

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

async function handleClearAttempts(req, res, cors) {
  const { user } = await requireSessionForWrite(req);
  const removed = await store.deleteAttemptsForUser(user.id);
  sendJson(res, 200, { ok: true, removed, progress: computeProgress([]) }, cors);
}

async function handlePreferences(req, res, cors) {
  const { user } = await requireSessionForWrite(req);
  const body = await readJsonBody(req);

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
  await store.updateProfile(user.id, (raw) => {
    const profile = normalizeProfile(raw);
    const current = Object.hasOwn(profile.courses, body.courseId) ? profile.courses[body.courseId] : null;
    course = validateCourseUpdate(body, current, now);
    assertCourseRoom(profile.courses, course.courseId);
    courses = { ...profile.courses, [course.courseId]: course };
    return { ...profile, courses, updatedAt: now };
  });

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
  await store.updateProfile(user.id, (raw) => {
    const profile = normalizeProfile(raw);
    return { ...profile, notificationsSeenAt: now, updatedAt: now };
  });
  const feed = notificationsFor(user, now);
  sendJson(res, 200, { ok: true, ...feed }, cors);
}

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

async function handleDeletePaper(req, res, cors) {
  const { user } = await requireSessionForWrite(req);
  const id = new URL(req.url ?? '/', 'http://internal').searchParams.get('id') ?? '';
  const removed = await store.deletePaper(user.id, id.trim());
  if (!removed) throw new HttpError(404, 'not_found', 'No saved paper with that id.');
  sendJson(res, 200, { ok: true, removed: true }, cors);
}

async function handleAssessmentPaper(req, res, cors) {
  await requireSession(req);
  sendJson(res, 200, { ok: true, paper: sealedPaper() }, cors);
}

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

  const freshAnalytics = buildAnalyticsSummary(store.attemptsForUser(user.id), { scope: 'latest' });
  void logInteractions(
    (freshAnalytics.gaps ?? []).map((g) => ({
      userId: user.id,
      type: 'competency_measured',
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
    answers: analyseAnswers(graded.questions),
    attempt: publicAttempt(record),
    dropped,
    progress: computeProgress(store.attemptsForUser(user.id)),
  }, cors);
}

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

async function handleAnalytics(req, res, cors) {
  const { user } = await requireSession(req);
  const scope = analyticsScope(req);
  const analytics = buildAnalyticsSummary(store.attemptsForUser(user.id), { scope });
  sendJson(res, 200, { ok: true, analytics }, cors);
}

async function handleRecommendedCourses(req, res, cors) {
  const { user } = await requireSession(req);
  const scope = analyticsScope(req);
  const analytics = buildAnalyticsSummary(store.attemptsForUser(user.id), { scope });

  const context = buildLearnerContext(user.id, analytics);

  const recommendations = recommendationService.recommend(analytics, catalogue(), {
    interactionCount: store.interactionCount(),
    context,
  });

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

function buildLearnerContext(userId, analytics) {
  const competencyScores = new Map(
    (analytics.competencies ?? []).map((c) => [c.competency, c.currentScore]),
  );
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

async function logInteractions(rawEvents) {
  try {
    for (const raw of Array.isArray(rawEvents) ? rawEvents : []) {
      if (forbiddenKeysIn(raw).length > 0) continue;
      const event = sanitizeEvent({ ...raw, secret: INTERACTION_KEY });
      if (event) await store.addInteraction(event);
    }
  } catch {
    /* logging is best-effort; never surface to the caller */
  }
}

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
      analytics,
    }, cors);
    return;
  }

  sendJson(res, 200, { ok: true, explanation: outcome.explanation, analytics }, cors);
}

const ANALYTICS_FAILURE_STATUS = {
  no_data: 409,
  unverified: 502,
};

const MAX_TOPICS = 12;
const MAX_CONCEPTS = 60;
const MAX_LABEL_CHARS = 120;

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

  let difficulty;
  if (typeof body.difficulty === 'string') {
    const wanted = body.difficulty.trim().toLowerCase();
    if (wanted === 'easy' || wanted === 'medium' || wanted === 'hard') difficulty = wanted;
  }

  return { text, topics, concepts, questionCount, difficulty };
}

const AI_FAILURE_STATUS = {
  not_configured: 503,
  rate_limited: 429,
  timeout: 504,
  network_error: 502,
  provider_error: 502,
  insufficient_questions: 422,
};

function guardExtractedText(text) {
  const estPages = Math.max(1, Math.round((typeof text === 'string' ? text.length : 0) / 1800));
  return guardDocument({ text, filename: '', pageCount: estPages, charsPerPage: null });
}

async function handleGenerateMcqs(req, res, cors) {
  assertTrustedOrigin(req, ALLOWED_ORIGINS);
  await requireSession(req);
  enforce(limiters.aiGenerationsPerIp, clientKey(req, TRUSTED_PROXY_HOPS));

  const body = await readJsonBody(req, { maxBytes: MAX_AI_BODY_BYTES });
  const input = validateGenerationRequest(body);

  const guard = guardExtractedText(input.text);
  if (guard.decision === 'reject') {
    console.log(`  ai.guard: generation blocked type=${guard.documentType} conf=${guard.confidence}`);
    sendJson(res, 422, { ok: false, error: { code: 'document_rejected', message: guard.message }, documentType: guard.documentType }, cors);
    return;
  }

  const outcome = await generateMcqs(input, { env: process.env });

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

  const guard = guardExtractedText(text);
  if (guard.decision === 'reject') {
    console.log(`  ai.guard: classify blocked type=${guard.documentType} conf=${guard.confidence}`);
    sendJson(res, 422, { ok: false, error: { code: 'document_rejected', message: guard.message }, documentType: guard.documentType }, cors);
    return;
  }

  const result = await classifyMaterial({ text }, { env: process.env });

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

function queryParam(req, name) {
  return new URL(req.url ?? '/', 'http://internal').searchParams.get(name);
}

async function handleCoursesCatalogue(req, res, cors) {
  const id = queryParam(req, 'id');
  if (id !== null) {
    sendJson(res, 200, { ok: true, course: getCourse(id) }, cors);
    return;
  }
  sendJson(res, 200, { ok: true, ...catalogue() }, cors);
}

async function handleCourseContent(req, res, cors) {
  const id = queryParam(req, 'id');
  const file = queryParam(req, 'file');
  if (id === null || file === null) {
    throw new HttpError(400, 'invalid_input', 'Both id and file are required.');
  }
  const { path, contentType } = resolveContent(id, file);
  const size = statSync(path).size;

  const isActiveType = /^(text\/html|image\/svg\+xml|application\/xhtml)/i.test(contentType);
  const headers = {
    ...cors,
    'Content-Length': size,
    'Cache-Control': 'private, max-age=3600',
    'X-Content-Type-Options': 'nosniff',
    'Content-Security-Policy': "default-src 'none'; sandbox",
    'Referrer-Policy': 'no-referrer',
  };
  if (isActiveType) {
    headers['Content-Type'] = 'application/octet-stream';
    const safeName = String(file).split(/[\\/]/).pop().replace(/[^A-Za-z0-9._-]/g, '_') || 'lesson';
    headers['Content-Disposition'] = `attachment; filename="${safeName}"`;
  } else {
    headers['Content-Type'] = contentType;
    headers['Content-Disposition'] = 'inline';
  }
  res.writeHead(200, headers);
  const stream = createReadStream(path);
  stream.on('error', () => {
    if (!res.headersSent) sendJson(res, 500, { ok: false, error: { code: 'read_failed', message: 'Could not read the file.' } }, cors);
    else res.end();
  });
  stream.pipe(res);
}

const MAX_TOPIC_QUERY_CHARS = 200;
const MAX_PAGE_BATCH = 400;

const MAX_OCR_BODY_BYTES = Math.ceil((docConfig.ocr.maxImageBytes * 4) / 3) + 16 * 1024;

function requireDocId(body) {
  const id = typeof body?.documentId === 'string' ? body.documentId.trim() : '';
  if (id === '') throw badRequest('document_required', 'A documentId is required.', { documentId: 'required' });
  return id;
}

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

async function handleDocumentFinalize(req, res, cors) {
  assertTrustedOrigin(req, ALLOWED_ORIGINS);
  const { user } = await requireSessionForWrite(req);
  enforce(limiters.aiGenerationsPerIp, clientKey(req, TRUSTED_PROXY_HOPS));
  const body = await readJsonBody(req, { maxBytes: MAX_AI_BODY_BYTES });
  const documentId = requireDocId(body);
  const outcome = await finalizeDocument({ store: documentStore, userId: user.id, documentId, env: process.env });
  console.log(`  doc.finalize: id=${documentId} ok=${outcome.ok} type=${outcome.classification?.documentType ?? '-'} mode=${outcome.mode ?? '-'} chunks=${outcome.document?.chunkCount ?? 0}`);
  if (!outcome.ok) {
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

async function handleDocumentOcrPage(req, res, cors) {
  assertTrustedOrigin(req, ALLOWED_ORIGINS);
  const { user } = await requireSession(req);
  enforce(limiters.ocrPagesPerIp, clientKey(req, TRUSTED_PROXY_HOPS));
  if (!docConfig.ocr.enabled) throw new HttpError(503, 'ocr_disabled', 'OCR is not enabled on this server.');

  const body = await readJsonBody(req, { maxBytes: MAX_OCR_BODY_BYTES });
  const documentId = typeof body?.documentId === 'string' ? body.documentId.trim() : '';
  if (documentId !== '' && !documentStore.getDocument(user.id, documentId)) throw new HttpError(404, 'not_found', 'No such document.');

  const imageBase64 = typeof body.imageBase64 === 'string' ? body.imageBase64 : '';
  if (imageBase64 === '') throw badRequest('image_required', 'A page image is required.', { imageBase64: 'required' });
  const pageNumber = Number.isInteger(body.pageNumber) ? body.pageNumber : null;
  const stubText = typeof body.stubText === 'string' ? body.stubText : undefined;

  const result = await ocrImage({ imageBase64, pageNumber, stubText, cfg: docConfig, env: process.env });
  if (!result.ok) {
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

async function handleDocumentList(req, res, cors) {
  const { user } = await requireSession(req);
  const docs = documentStore.listDocuments(user.id).map(publicDocument);
  sendJson(res, 200, { ok: true, documents: docs }, cors);
}

async function handleDocumentOcrHealth(req, res, cors) {
  await requireSession(req);
  if (!docConfig.ocr.enabled || docConfig.ocr.provider === 'disabled') {
    sendJson(res, 200, { ok: true, enabled: false, available: false }, cors);
    return;
  }
  const health = await ocrHealth({ cfg: docConfig, env: process.env });
  sendJson(res, 200, { ok: true, enabled: true, ...health }, cors);
}

async function handleDocumentJob(req, res, cors) {
  const { user } = await requireSession(req);
  const id = queryParam(req, 'id');
  if (!id) throw badRequest('job_required', 'A job id is required.');
  const job = documentStore.getJob(user.id, id);
  if (!job) throw new HttpError(404, 'not_found', 'No such job.');
  sendJson(res, 200, { ok: true, job: jobView(job) }, cors);
}

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
    preview: result.retrieval.usedChunks.slice(0, 3).map((c) => ({ pageStart: c.pageStart, pageEnd: c.pageEnd, section: c.section, snippet: c.text.slice(0, 240) })),
  }, cors);
}

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
  const d = outcome.debug ?? {};
  console.log(`  doc.generate: q="${query.slice(0, 40)}" requested=${questionCount} parsed=${d.parsedQuestionCount ?? '-'} valid=${d.validQuestionCount ?? '-'} dup=${d.duplicateQuestionCount ?? '-'} rej=${d.rejectedQuestionCount ?? '-'} backfill=${d.backfillQuestionCount ?? '-'} final=${d.finalQuestionCount ?? (outcome.questions?.length ?? 0)}${outcome.ok ? '' : ` failed=${outcome.code}`}`);
  if (!outcome.ok) {
    const status = AI_FAILURE_STATUS[outcome.code] ?? 502;
    sendJson(res, status, { ok: false, error: { code: outcome.code, message: outcome.message }, questions: outcome.questions ?? [], preview: outcome.preview ?? null }, cors);
    return;
  }
  sendJson(res, 200, { ok: true, query, questions: outcome.questions, meta: outcome.meta, preview: outcome.preview, material: outcome.material }, cors);
}

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
      const allow = [...ROUTES.keys()].filter((key) => key.endsWith(` ${pathname}`)).map((key) => key.split(' ')[0]);
      if (allow.length > 0) {
        const err = new HttpError(405, 'method_not_allowed', `${req.method} is not allowed on ${pathname}.`);
        err.allow = [...new Set([...allow, 'OPTIONS'])].sort();
        throw err;
      }
      throw new HttpError(404, 'not_found', 'No such endpoint.');
    }
    await handler(req, res, cors);
  } catch (error) {
    respondWithError(res, error, cors, req, pathname);
  } finally {
    const ms = Number(process.hrtime.bigint() - started) / 1e6;
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
    if (Array.isArray(error.allow) && error.allow.length > 0) headers['Allow'] = error.allow.join(', ');
    sendJson(res, error.status, payload, headers);
    return;
  }

  console.error(`[500] ${req.method} ${pathname}`, error);
  sendJson(res, 500, { ok: false, error: { code: 'server_error', message: 'Something went wrong.' } }, cors);
}

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
      await store.drain();
      console.log('  Stopped cleanly.\n');
      process.exit(0);
    });
    setTimeout(() => process.exit(0), 3000).unref();
  });
}
