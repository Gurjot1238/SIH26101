import { createHmac } from 'node:crypto';

export const INTERACTION_TYPES = Object.freeze([
  'recommendation_shown', // a course appeared in a recommendation list
  'course_opened',        // the learner opened the course
  'lesson_read',          // a lesson was completed (reader scroll-to-complete)
  'course_completed',     // completion reached 100%
  'competency_measured',  // a fresh competency score was recorded (before/after signal)
]);

const NUMBER = (v) => (Number.isFinite(Number(v)) ? Number(v) : null);
const BOOL = (v) => (typeof v === 'boolean' ? v : v === undefined ? null : Boolean(v));
const SLUG = (v) => (typeof v === 'string' && /^[a-z0-9][a-z0-9-]{0,63}$/.test(v) ? v : null);
const SHORT = (v) => (typeof v === 'string' ? v.slice(0, 64) : null);
const TAGS = (v) => (Array.isArray(v) ? v.filter((t) => typeof t === 'string').slice(0, 24).map((t) => t.slice(0, 48)) : []);

export function anonymiseLearner(userId, secret) {
  if (!secret || typeof secret !== 'string') {
    throw new Error('anonymiseLearner requires a server secret; refusing to log without one.');
  }
  return createHmac('sha256', secret).update(String(userId)).digest('hex').slice(0, 32);
}

export function sanitizeEvent(input = {}) {
  const type = INTERACTION_TYPES.includes(input.type) ? input.type : null;
  const courseId = SLUG(input.courseId);
  if (!type || !courseId) return null;
  if (input.userId === undefined || input.userId === null) return null;

  const learner = anonymiseLearner(input.userId, input.secret);

  const event = {
    learner,
    type,
    courseId,
    competency: SLUG(input.competency),
    competencyScoreBefore: NUMBER(input.competencyScoreBefore),
    competencyScoreAfter: NUMBER(input.competencyScoreAfter),
    gapBefore: NUMBER(input.gapBefore),
    gapAfter: NUMBER(input.gapAfter),
    assessmentScore: NUMBER(input.assessmentScore),
    attempts: NUMBER(input.attempts),
    courseStarted: BOOL(input.courseStarted),
    completionPercent: NUMBER(input.completionPercent),
    completed: BOOL(input.completed),
    timeSpentMinutes: NUMBER(input.timeSpentMinutes),
    courseLevel: SHORT(input.courseLevel),
    courseDurationHours: NUMBER(input.courseDurationHours),
    courseTopics: TAGS(input.courseTopics),
    courseCompetencies: TAGS(input.courseCompetencies),
    strategy: SHORT(input.strategy),
    modelVersion: SHORT(input.modelVersion),
    at: Number.isFinite(input.at) ? input.at : Date.now(),
  };

  for (const key of Object.keys(event)) {
    if (event[key] === null) delete event[key];
  }
  return event;
}

const FORBIDDEN_KEYS = ['password', 'passwordHash', 'token', 'sessionToken', 'apiKey', 'email', 'name', 'documentText', 'questionText', 'answerText'];
export function forbiddenKeysIn(input = {}) {
  return FORBIDDEN_KEYS.filter((key) => key in input);
}

export function buildTrainingRows(events) {
  const byPair = new Map();
  for (const e of Array.isArray(events) ? events : []) {
    if (!e || !e.learner || !e.courseId) continue;
    const key = `${e.learner}::${e.courseId}`;
    const row = byPair.get(key) ?? {
      learner: e.learner,
      courseId: e.courseId,
      competency: e.competency ?? null,
      shown: false,
      opened: false,
      completionPercent: 0,
      completed: false,
      competencyScoreBefore: null,
      competencyScoreAfter: null,
      gapBefore: null,
      gapAfter: null,
      timeSpentMinutes: 0,
      lastAt: 0,
    };
    if (e.type === 'recommendation_shown') row.shown = true;
    if (e.type === 'course_opened') row.opened = true;
    if (e.type === 'course_completed') row.completed = true;
    if (Number.isFinite(e.completionPercent)) row.completionPercent = Math.max(row.completionPercent, e.completionPercent);
    if (Number.isFinite(e.timeSpentMinutes)) row.timeSpentMinutes += e.timeSpentMinutes;
    if (Number.isFinite(e.competencyScoreBefore) && row.competencyScoreBefore === null) row.competencyScoreBefore = e.competencyScoreBefore;
    if (Number.isFinite(e.competencyScoreAfter)) row.competencyScoreAfter = e.competencyScoreAfter;
    if (Number.isFinite(e.gapBefore) && row.gapBefore === null) row.gapBefore = e.gapBefore;
    if (Number.isFinite(e.gapAfter)) row.gapAfter = e.gapAfter;
    if (Number.isFinite(e.at)) row.lastAt = Math.max(row.lastAt, e.at);
    byPair.set(key, row);
  }
  return [...byPair.values()];
}
