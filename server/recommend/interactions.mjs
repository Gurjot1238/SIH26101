/**
 * The anonymised learning-interaction log — the raw material a future model trains on.
 *
 * The spec is explicit about what this is and is not. It IS an append-only record of real
 * learning events (a course was recommended, opened, read, completed; a competency moved
 * before/after). It is NOT a behavioural surveillance log and it must never carry anything
 * that could identify a person or leak their private data. So two rules are enforced *here*,
 * at the only place events are created, rather than trusted to callers:
 *
 *   1. The learner is referred to only by an anonymised id — an HMAC of their real user id
 *      under a server secret. It is stable (so a learner's events group together for
 *      collaborative-filtering) but not reversible to the account without the secret, and it
 *      is never the email, name, or raw user id.
 *
 *   2. An event is rebuilt field-by-field from an allow-list (`sanitizeEvent`). Anything not
 *      on the list — a password, a token, an email, document text, free-form notes — is
 *      dropped on the floor. This mirrors how progress.mjs rebuilds an attempt so question
 *      and document text can never reach disk. If a caller passes junk, junk does not persist.
 *
 * The fields kept are exactly the training features the spec named: learner (anon), course,
 * competency, competency_score_before/after, gap_before/after, assessment_score, attempts,
 * course_started, completion_percent, completed, time_spent, course metadata, interaction
 * type, timestamp. Every one is a learning signal; none is PII.
 *
 * Storage is the same append-only JSON pattern as attempts/papers (see store.mjs), so this
 * needs no new persistence engine — it plugs into the store the same way. This module owns
 * the *shape and safety* of an event; the store owns writing it.
 */

import { createHmac } from 'node:crypto';

/** The interaction verbs we record. An unknown verb is rejected, not stored as-is. */
export const INTERACTION_TYPES = Object.freeze([
  'recommendation_shown', // a course appeared in a recommendation list
  'course_opened',        // the learner opened the course
  'lesson_read',          // a lesson was completed (reader scroll-to-complete)
  'course_completed',     // completion reached 100%
  'competency_measured',  // a fresh competency score was recorded (before/after signal)
]);

/** Every field an event may carry, with a coercer. Anything else is dropped. */
const NUMBER = (v) => (Number.isFinite(Number(v)) ? Number(v) : null);
const BOOL = (v) => (typeof v === 'boolean' ? v : v === undefined ? null : Boolean(v));
const SLUG = (v) => (typeof v === 'string' && /^[a-z0-9][a-z0-9-]{0,63}$/.test(v) ? v : null);
const SHORT = (v) => (typeof v === 'string' ? v.slice(0, 64) : null);
const TAGS = (v) => (Array.isArray(v) ? v.filter((t) => typeof t === 'string').slice(0, 24).map((t) => t.slice(0, 48)) : []);

/**
 * Turn a real user id into the stable, non-reversible anonymised learner id stored on every
 * event. HMAC-SHA256 under the server secret, hex-truncated to 32 chars — enough to avoid
 * collisions across a demo-sized user base, and useless to anyone without the secret. The
 * secret is the same class of value used to fingerprint sessions; if it is absent we refuse
 * to anonymise (and callers must not log), rather than fall back to a weak or empty key.
 */
export function anonymiseLearner(userId, secret) {
  if (!secret || typeof secret !== 'string') {
    throw new Error('anonymiseLearner requires a server secret; refusing to log without one.');
  }
  return createHmac('sha256', secret).update(String(userId)).digest('hex').slice(0, 32);
}

/**
 * Rebuild one event from an allow-list. Returns a clean event object, or null if it is not
 * even minimally valid (no known type, or no course to attach it to). Never throws on junk
 * fields — it simply does not copy them.
 *
 *   input.userId   the REAL user id (hashed here, never stored raw)
 *   input.secret   the server secret for the HMAC
 *   input.type     one of INTERACTION_TYPES
 *   input.courseId a course slug
 *   ...            the learning fields below, all optional
 */
export function sanitizeEvent(input = {}) {
  const type = INTERACTION_TYPES.includes(input.type) ? input.type : null;
  const courseId = SLUG(input.courseId);
  if (!type || !courseId) return null;
  if (input.userId === undefined || input.userId === null) return null;

  // The ONLY identity that persists is the HMAC. The raw userId and secret are used here and
  // then discarded — they are not copied into the returned object.
  const learner = anonymiseLearner(input.userId, input.secret);

  const event = {
    learner,
    type,
    courseId,
    competency: SLUG(input.competency),
    // before/after learning signals — the heart of "did this course help?"
    competencyScoreBefore: NUMBER(input.competencyScoreBefore),
    competencyScoreAfter: NUMBER(input.competencyScoreAfter),
    gapBefore: NUMBER(input.gapBefore),
    gapAfter: NUMBER(input.gapAfter),
    assessmentScore: NUMBER(input.assessmentScore),
    attempts: NUMBER(input.attempts),
    // engagement signals
    courseStarted: BOOL(input.courseStarted),
    completionPercent: NUMBER(input.completionPercent),
    completed: BOOL(input.completed),
    timeSpentMinutes: NUMBER(input.timeSpentMinutes),
    // course metadata snapshot (so training does not depend on the course still existing)
    courseLevel: SHORT(input.courseLevel),
    courseDurationHours: NUMBER(input.courseDurationHours),
    courseTopics: TAGS(input.courseTopics),
    courseCompetencies: TAGS(input.courseCompetencies),
    // which strategy produced the recommendation this event responds to (traceability)
    strategy: SHORT(input.strategy),
    modelVersion: SHORT(input.modelVersion),
    at: Number.isFinite(input.at) ? input.at : Date.now(),
  };

  // Drop keys that came through as null so the stored record is compact and its absence is
  // honest (a missing competencyScoreAfter means "not measured", not "zero").
  for (const key of Object.keys(event)) {
    if (event[key] === null) delete event[key];
  }
  return event;
}

/**
 * A guard a caller can use to prove an object it is about to log carries no forbidden field.
 * Belt-and-braces alongside sanitizeEvent's allow-list: if any of these key names appear on a
 * raw input, that input was assembled wrongly and should be reviewed, not logged. Returns the
 * offending keys (empty array = clean).
 */
const FORBIDDEN_KEYS = ['password', 'passwordHash', 'token', 'sessionToken', 'apiKey', 'email', 'name', 'documentText', 'questionText', 'answerText'];
export function forbiddenKeysIn(input = {}) {
  return FORBIDDEN_KEYS.filter((key) => key in input);
}

/**
 * Build the training dataset view from the raw event list: one row per (learner, course)
 * with the observed outcome, ready for the offline trainer to pair with `extractFeatures`.
 * Pure — it derives, it does not fetch. This is the boundary the offline pipeline reads from,
 * so the app never has to hand the trainer anything but anonymised, allow-listed rows.
 */
export function buildTrainingRows(events) {
  const byPair = new Map(); // `${learner}::${courseId}` -> aggregated row
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
