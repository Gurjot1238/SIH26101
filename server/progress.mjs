/**
 * Attempt history, preferences and course progress: validation and rollup.
 *
 * `store.mjs` knows how to put bytes on disk; this file knows what is allowed to
 * be there. It is kept separate from `index.mjs` for the same reason `auth.mjs`
 * is: the rules are worth reading on their own, and they are what a reviewer
 * will want to check.
 *
 * Two properties this file exists to guarantee:
 *
 *   1. **Nothing but an allow-list gets stored.** Every record is rebuilt field
 *      by field from the request, so a body carrying `text`, `questions` or
 *      `sentences` has those keys dropped on the floor. There is no field on the
 *      server that can hold document text or question text. The PDF is read by
 *      pdf.js in the browser tab and stays there; this is the file that keeps
 *      that claim true from the other side.
 *   2. **Derived numbers are recomputed, never trusted.** `percent`, `band` and
 *      the per-competency percentages are calculated here from `correct`,
 *      `total` and the topic list, so a stored attempt cannot be internally
 *      inconsistent no matter what the client posted.
 *
 * The competency ids and the band thresholds below are a second copy of what
 * `src/lib/topics.ts` defines — the server is plain .mjs and cannot import a
 * TypeScript module. `server/smoke-test.sh` parses that file and fails if the
 * two ever disagree, so the duplication cannot drift silently.
 */

import { randomUUID } from 'node:crypto';

import { HttpError } from './http.mjs';

/** Mirrors CompetencyId in src/lib/topics.ts. */
export const COMPETENCY_IDS = ['data-quality', 'inference', 'dissemination', 'digital-tools', 'leadership'];
/** Mirrors Band in src/lib/topics.ts. */
export const BANDS = ['strong', 'average', 'needs-work', 'unrated'];
/** Mirrors BAND_STRONG_MIN / BAND_AVERAGE_MIN / MIN_QUESTIONS_FOR_BAND. */
export const BAND_STRONG_MIN = 80;
export const BAND_AVERAGE_MIN = 50;
export const MIN_QUESTIONS_FOR_BAND = 2;

/** The three options the Profile page offers. */
export const LANGUAGES = ['English', 'Hindi', 'Kannada'];
export const ATTEMPT_SOURCES = ['material', 'assessment'];

export const LIMITS = {
  /** A generated paper is 10-12 questions; an imported one could be longer. */
  maxQuestions: 200,
  /** MAX_TOPICS is 5 on the client. The headroom is for a future longer paper. */
  maxTopics: 12,
  maxLabel: 120,
  maxTopicName: 80,
  /** Longer than this is a tab left open overnight, not study time. */
  maxDurationSeconds: 12 * 60 * 60,
  /** Oldest attempts fall off beyond this. A whole-file JSON store cannot grow forever. */
  maxAttemptsPerUser: 200,
  maxCoursesPerUser: 50,
  maxModulesPerCourse: 60,
  /** Dataset courses track completion per lesson; the largest has well under this. */
  maxLessonsPerCourse: 400,
  defaultHistory: 50,
  /** How many recent attempts GET /api/progress inlines, so one request fills a page. */
  inlineHistory: 20,
};

/* ------------------------------------------------------------------- helpers */

function fieldError(field, message) {
  return new HttpError(400, 'invalid_input', message, { [field]: message });
}

/**
 * One line of plain text: control characters removed, then trimmed, then capped.
 * Done by code point so no literal control byte appears in this source file, the
 * same way `cleanText` does it in auth.mjs.
 */
function cleanLine(value, max) {
  let out = '';
  for (const char of value) {
    const code = char.codePointAt(0);
    if (code > 31 && code !== 127) out += char;
  }
  return out.trim().slice(0, max);
}

function requireInteger(value, field, label, { min, max }) {
  if (typeof value !== 'number' || !Number.isFinite(value) || !Number.isInteger(value)) {
    throw fieldError(field, `${label} must be a whole number.`);
  }
  if (value < min || value > max) {
    throw fieldError(field, `${label} must be between ${min} and ${max}.`);
  }
  return value;
}

function requireBoolean(value, field, label) {
  if (typeof value !== 'boolean') throw fieldError(field, `${label} must be true or false.`);
  return value;
}

export function percentOf(correct, total) {
  if (total <= 0) return 0;
  return Math.round((correct / total) * 100);
}

/** Same rule as bandFor() in src/lib/topics.ts: one question is not a measurement. */
export function bandFor(percent, questionCount) {
  if (questionCount < MIN_QUESTIONS_FOR_BAND) return 'unrated';
  if (percent >= BAND_STRONG_MIN) return 'strong';
  if (percent >= BAND_AVERAGE_MIN) return 'average';
  return 'needs-work';
}

export function newAttemptId() {
  return `att_${randomUUID().replaceAll('-', '')}`;
}

/* ------------------------------------------------------------------ attempts */

/**
 * Validate one posted attempt and return the record to store.
 *
 * The return value is built key by key on purpose. Whatever else the body
 * contained is not copied, so there is no path by which document text, question
 * text or an answer key reaches the disk.
 */
export function validateAttempt(body) {
  if (!ATTEMPT_SOURCES.includes(body.source)) {
    throw fieldError('source', `Source must be one of: ${ATTEMPT_SOURCES.join(', ')}.`);
  }

  if (typeof body.label !== 'string') throw fieldError('label', 'A label for this attempt is required.');
  const label = cleanLine(body.label, LIMITS.maxLabel);
  if (label === '') throw fieldError('label', 'A label for this attempt is required.');

  const total = requireInteger(body.total, 'total', 'Question count', { min: 1, max: LIMITS.maxQuestions });
  const correct = requireInteger(body.correct, 'correct', 'Correct count', { min: 0, max: total });

  // Time is a nice-to-have, not evidence: a missing value is fine, and a value
  // from a tab left open overnight is clamped rather than rejected.
  let durationSeconds = 0;
  if (body.durationSeconds !== undefined && body.durationSeconds !== null) {
    if (typeof body.durationSeconds !== 'number' || !Number.isFinite(body.durationSeconds)) {
      throw fieldError('durationSeconds', 'Duration must be a number of seconds.');
    }
    durationSeconds = Math.min(LIMITS.maxDurationSeconds, Math.max(0, Math.round(body.durationSeconds)));
  }

  const topics = validateTopics(body.topics, { total, correct });

  const percent = percentOf(correct, total);
  return {
    source: body.source,
    label,
    total,
    correct,
    // Recomputed, never taken from the request, so the stored row cannot lie.
    percent,
    band: bandFor(percent, total),
    durationSeconds,
    topics,
    competencyPercents: rollUpPercents(topics),
  };
}

function validateTopics(value, paper) {
  if (value === undefined || value === null) return [];
  if (!Array.isArray(value)) throw fieldError('topics', 'Topics must be a list.');
  if (value.length > LIMITS.maxTopics) {
    throw fieldError('topics', `An attempt can report at most ${LIMITS.maxTopics} topics.`);
  }

  const out = [];
  const seen = new Set();
  let questionSum = 0;
  let correctSum = 0;

  for (const entry of value) {
    if (entry === null || typeof entry !== 'object' || Array.isArray(entry)) {
      throw fieldError('topics', 'Each topic must be an object.');
    }
    if (typeof entry.topic !== 'string') throw fieldError('topics', 'Each topic needs a name.');

    const topic = cleanLine(entry.topic, LIMITS.maxTopicName);
    if (topic === '') throw fieldError('topics', 'Each topic needs a name.');

    if (entry.competency !== null && entry.competency !== undefined && !COMPETENCY_IDS.includes(entry.competency)) {
      throw fieldError('topics', `Unknown competency "${cleanLine(String(entry.competency), 40)}".`);
    }

    const total = requireInteger(entry.total, 'topics', `Question count for ${topic}`, { min: 1, max: paper.total });
    const correct = requireInteger(entry.correct, 'topics', `Correct count for ${topic}`, { min: 0, max: total });

    // A repeated topic name would double-count in every rollup. Keep the first.
    const key = topic.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);

    questionSum += total;
    correctSum += correct;
    const percent = percentOf(correct, total);
    out.push({ topic, competency: entry.competency ?? null, correct, total, percent, band: bandFor(percent, total) });
  }

  // The breakdown cannot describe more questions than the paper had. Checked
  // rather than assumed, because everything downstream sums these numbers.
  if (questionSum > paper.total) throw fieldError('topics', 'Topic question counts add up to more than the paper.');
  if (correctSum > paper.correct) throw fieldError('topics', 'Topic correct counts add up to more than the score.');
  return out;
}

/** Per-competency percentages for one attempt, computed from its topic rows. */
function rollUpPercents(topics) {
  const totals = new Map();
  for (const topic of topics) {
    if (!topic.competency) continue;
    const entry = totals.get(topic.competency) ?? { correct: 0, total: 0 };
    entry.correct += topic.correct;
    entry.total += topic.total;
    totals.set(topic.competency, entry);
  }

  const out = {};
  // Framework order, so the stored object reads the same way every time.
  for (const id of COMPETENCY_IDS) {
    const entry = totals.get(id);
    if (entry) out[id] = percentOf(entry.correct, entry.total);
  }
  return out;
}

/* ------------------------------------------------------------------- rollups */

/** Worst first; "not enough questions" sits after the real bands, as in scoring.ts. */
const bandRank = { 'needs-work': 0, average: 1, unrated: 2, strong: 3 };

/**
 * Everything the Dashboard needs about a learner, computed from their attempts.
 *
 * Deliberately contains nothing bucketed by day. Grouping into weekdays or
 * counting a streak depends on the learner's timezone, which the server does not
 * know — doing it here would quietly mislabel a late-evening attempt. The raw
 * timestamps go back with the history and the browser groups them itself.
 */
export function computeProgress(attempts) {
  const competencyTotals = new Map();
  const topicTotals = new Map();
  const sources = {};
  let questions = 0;
  let correct = 0;
  let seconds = 0;

  for (const attempt of attempts) {
    questions += attempt.total;
    correct += attempt.correct;
    seconds += attempt.durationSeconds ?? 0;
    sources[attempt.source] = (sources[attempt.source] ?? 0) + 1;

    for (const topic of attempt.topics ?? []) {
      const key = topic.topic.toLowerCase();
      const row = topicTotals.get(key) ?? {
        topic: topic.topic,
        competency: topic.competency ?? null,
        correct: 0,
        total: 0,
        attempts: 0,
        lastSeenAt: attempt.at,
      };
      row.correct += topic.correct;
      row.total += topic.total;
      row.attempts += 1;
      row.lastSeenAt = attempt.at;
      // A later attempt may classify a topic the first one could not.
      if (!row.competency && topic.competency) row.competency = topic.competency;
      topicTotals.set(key, row);

      if (!topic.competency) continue;
      const entry = competencyTotals.get(topic.competency) ?? { correct: 0, total: 0, attempts: new Set() };
      entry.correct += topic.correct;
      entry.total += topic.total;
      entry.attempts.add(attempt.id);
      competencyTotals.set(topic.competency, entry);
    }
  }

  const percent = percentOf(correct, questions);
  const competencies = COMPETENCY_IDS.filter((id) => competencyTotals.has(id))
    .map((id) => {
      const entry = competencyTotals.get(id);
      const value = percentOf(entry.correct, entry.total);
      return {
        id,
        correct: entry.correct,
        total: entry.total,
        percent: value,
        band: bandFor(value, entry.total),
        attempts: entry.attempts.size,
      };
    })
    .sort((a, b) => a.percent - b.percent || a.id.localeCompare(b.id));

  const topics = [...topicTotals.values()]
    .map((row) => {
      const value = percentOf(row.correct, row.total);
      return { ...row, percent: value, band: bandFor(value, row.total) };
    })
    .sort(
      (a, b) => bandRank[a.band] - bandRank[b.band] || a.percent - b.percent || a.topic.localeCompare(b.topic),
    );

  return {
    attempts: attempts.length,
    questions,
    correct,
    percent,
    // One decimal place, because that is how the pages already print an index.
    index: questions > 0 ? Math.round((correct / questions) * 1000) / 10 : 0,
    band: bandFor(percent, questions),
    minutes: Math.round(seconds / 60),
    firstAttemptAt: attempts.length > 0 ? attempts[0].at : null,
    lastAttemptAt: attempts.length > 0 ? attempts[attempts.length - 1].at : null,
    sources,
    competencies,
    topics,
    /** Competencies worth working on, weakest first. Empty is a real answer. */
    focus: competencies.filter((item) => item.band === 'needs-work' || item.band === 'average'),
  };
}

/** The response shape. `userId` is an internal join key and never goes out. */
export function publicAttempt(record) {
  return {
    id: record.id,
    at: record.at,
    source: record.source,
    label: record.label,
    total: record.total,
    correct: record.correct,
    percent: record.percent,
    band: record.band,
    durationSeconds: record.durationSeconds,
    topics: record.topics,
    competencyPercents: record.competencyPercents,
  };
}

/* --------------------------------------------------------------- preferences */

const PREFERENCE_KEYS = ['language', 'weeklyNote', 'demoLabels', 'notify'];

export function defaultPreferences() {
  return {
    language: 'English',
    /** The Monday brief toggle on the Profile page. */
    weeklyNote: true,
    /** Whether "Sample / Demonstration Data" markers stay visible. Default on, on purpose. */
    demoLabels: true,
    /** Whether the in-app notification bell fetches and shows a feed. Default on. */
    notify: true,
  };
}

/**
 * The stored preferences, field by field, with a default wherever the file does
 * not hold a usable value. Read paths are allow-listed for the same reason write
 * paths are: `profiles.json` sits on disk and can be hand-edited, and an unknown
 * key that survives a round trip is a key the client starts depending on.
 */
export function normalizePreferences(stored) {
  const base = defaultPreferences();
  const raw = stored !== null && typeof stored === 'object' && !Array.isArray(stored) ? stored : {};
  return {
    language: LANGUAGES.includes(raw.language) ? raw.language : base.language,
    weeklyNote: typeof raw.weeklyNote === 'boolean' ? raw.weeklyNote : base.weeklyNote,
    demoLabels: typeof raw.demoLabels === 'boolean' ? raw.demoLabels : base.demoLabels,
    notify: typeof raw.notify === 'boolean' ? raw.notify : base.notify,
  };
}

/**
 * Merge a patch into the stored preferences. Unknown keys are rejected rather
 * than ignored: a typo that silently does nothing is worse than an error, and
 * the set is small and closed.
 */
export function validatePreferences(patch, current) {
  if (patch === null || typeof patch !== 'object' || Array.isArray(patch)) {
    throw new HttpError(400, 'invalid_input', 'Send preferences as a JSON object.');
  }
  for (const key of Object.keys(patch)) {
    if (!PREFERENCE_KEYS.includes(key)) {
      throw fieldError(key, `"${cleanLine(key, 40)}" is not a preference this server stores.`);
    }
  }

  const next = normalizePreferences(current);
  if (Object.hasOwn(patch, 'language')) {
    if (!LANGUAGES.includes(patch.language)) {
      throw fieldError('language', `Language must be one of: ${LANGUAGES.join(', ')}.`);
    }
    next.language = patch.language;
  }
  if (Object.hasOwn(patch, 'weeklyNote')) next.weeklyNote = requireBoolean(patch.weeklyNote, 'weeklyNote', 'Weekly note');
  if (Object.hasOwn(patch, 'demoLabels')) next.demoLabels = requireBoolean(patch.demoLabels, 'demoLabels', 'Demonstration labels');
  if (Object.hasOwn(patch, 'notify')) next.notify = requireBoolean(patch.notify, 'notify', 'Notifications');
  return next;
}

/* ------------------------------------------------------------- personal details */

/**
 * The editable identity fields on the Profile page. Name and email are NOT here:
 * they are the account's own credentials, owned by auth.mjs, and are read-only on
 * the profile. These are the free-text extras a learner may fill in, each capped
 * so a hand-edited profiles.json cannot smuggle in an unbounded blob.
 */
const PERSONAL_KEYS = ['phone', 'bio', 'role', 'department', 'location'];
const PERSONAL_CAPS = { phone: 40, bio: 400, role: 80, department: 120, location: 80 };

export function defaultPersonal() {
  return { phone: '', bio: '', role: '', department: '', location: '' };
}

/**
 * The stored personal block, field by field, each cleaned to one line and capped.
 * Same allow-list discipline as preferences: an unknown key on disk is dropped, a
 * missing one defaults to empty string.
 */
export function normalizePersonal(stored) {
  const raw = stored !== null && typeof stored === 'object' && !Array.isArray(stored) ? stored : {};
  const out = defaultPersonal();
  for (const key of PERSONAL_KEYS) {
    if (typeof raw[key] === 'string') out[key] = cleanLine(raw[key], PERSONAL_CAPS[key]);
  }
  return out;
}

/**
 * Merge a patch into the stored personal details. Unknown keys are rejected (a
 * silent no-op is worse than an error); each supplied value must be a string and
 * is cleaned + capped before it is stored. An empty string is a valid value: it
 * is how a learner clears a field.
 */
export function validatePersonal(patch, current) {
  if (patch === null || typeof patch !== 'object' || Array.isArray(patch)) {
    throw new HttpError(400, 'invalid_input', 'Send profile details as a JSON object.');
  }
  for (const key of Object.keys(patch)) {
    if (!PERSONAL_KEYS.includes(key)) {
      throw fieldError(key, `"${cleanLine(key, 40)}" is not a profile field this server stores.`);
    }
  }

  const next = normalizePersonal(current);
  for (const key of PERSONAL_KEYS) {
    if (Object.hasOwn(patch, key)) {
      if (typeof patch[key] !== 'string') throw fieldError(key, `${key} must be text.`);
      next[key] = cleanLine(patch[key], PERSONAL_CAPS[key]);
    }
  }
  return next;
}

/* ------------------------------------------------------------ course progress */

const COURSE_KEYS = ['courseId', 'saved', 'started', 'completedModules', 'completedLessons'];
/**
 * Slug shape only. The catalogue itself lives in the app / dataset, not here.
 * Widened to 64 chars so dataset course ids (e.g. the longer MIT titles) fit; the
 * dataset reader in courses.mjs uses the same bound.
 */
const COURSE_ID = /^[a-z0-9][a-z0-9-]{0,63}$/;
/** A lesson id from the dataset, e.g. "mit-6-006-algorithms-m01-l01". */
const LESSON_ID = /^[a-z0-9][a-z0-9-]{0,79}$/;

/**
 * Merge a patch into one course record. Which courses exist is the app's
 * business — this only checks that the id looks like a slug, so adding a fourth
 * pathway does not mean editing the server.
 */
export function validateCourseUpdate(body, current, now) {
  for (const key of Object.keys(body)) {
    if (!COURSE_KEYS.includes(key)) {
      throw fieldError(key, `"${cleanLine(key, 40)}" is not part of a course update.`);
    }
  }
  if (typeof body.courseId !== 'string' || !COURSE_ID.test(body.courseId)) {
    throw fieldError('courseId', 'Course id must be a lowercase slug, like "time-series".');
  }

  const previous = current ?? {};
  const next = {
    courseId: body.courseId,
    saved: previous.saved === true,
    startedAt: previous.startedAt ?? null,
    completedModules: Array.isArray(previous.completedModules) ? previous.completedModules : [],
    completedLessons: Array.isArray(previous.completedLessons) ? previous.completedLessons : [],
    updatedAt: now,
  };

  if (Object.hasOwn(body, 'saved')) next.saved = requireBoolean(body.saved, 'saved', 'Saved');
  if (Object.hasOwn(body, 'started')) {
    // Keep the original start time when re-marking as started, so "started 3 days
    // ago" stays true after a resume.
    next.startedAt = requireBoolean(body.started, 'started', 'Started') ? (next.startedAt ?? now) : null;
  }
  if (Object.hasOwn(body, 'completedModules')) {
    next.completedModules = validateModules(body.completedModules);
    if (next.completedModules.length > 0 && !next.startedAt) next.startedAt = now;
  }
  if (Object.hasOwn(body, 'completedLessons')) {
    // The dataset courses track completion per lesson id, which is what the
    // completion percentage divides into. Marking any lesson done implies started.
    next.completedLessons = validateLessons(body.completedLessons);
    if (next.completedLessons.length > 0 && !next.startedAt) next.startedAt = now;
  }
  return next;
}

function validateModules(value) {
  if (!Array.isArray(value)) throw fieldError('completedModules', 'Completed modules must be a list of numbers.');
  if (value.length > LIMITS.maxModulesPerCourse) {
    throw fieldError('completedModules', `A course can have at most ${LIMITS.maxModulesPerCourse} modules.`);
  }
  const out = new Set();
  for (const entry of value) {
    out.add(requireInteger(entry, 'completedModules', 'Module number', { min: 0, max: LIMITS.maxModulesPerCourse - 1 }));
  }
  return [...out].sort((a, b) => a - b);
}

/**
 * Completed lesson ids, de-duplicated and shape-checked. Ids are opaque to the
 * server — which lessons exist is the dataset's business — so this only enforces
 * the slug shape (so a hand-edited file cannot smuggle in a `__proto__`-style key
 * or an unbounded blob) and the per-course cap. Sorted so the stored row is stable.
 */
function validateLessons(value) {
  if (!Array.isArray(value)) throw fieldError('completedLessons', 'Completed lessons must be a list of lesson ids.');
  if (value.length > LIMITS.maxLessonsPerCourse) {
    throw fieldError('completedLessons', `A course can track at most ${LIMITS.maxLessonsPerCourse} lessons.`);
  }
  const out = new Set();
  for (const entry of value) {
    if (typeof entry !== 'string' || !LESSON_ID.test(entry)) {
      throw fieldError('completedLessons', 'Each lesson id must be a lowercase slug.');
    }
    out.add(entry);
  }
  return [...out].sort();
}

/** One stored course record, rebuilt field by field. Same reasoning as preferences. */
function normalizeCourse(courseId, stored) {
  const raw = stored !== null && typeof stored === 'object' && !Array.isArray(stored) ? stored : {};
  const modules = Array.isArray(raw.completedModules)
    ? [...new Set(raw.completedModules.filter((n) => Number.isInteger(n) && n >= 0 && n < LIMITS.maxModulesPerCourse))]
    : [];
  const lessons = Array.isArray(raw.completedLessons)
    ? [...new Set(raw.completedLessons.filter((id) => typeof id === 'string' && LESSON_ID.test(id)))].slice(0, LIMITS.maxLessonsPerCourse)
    : [];
  return {
    courseId,
    saved: raw.saved === true,
    startedAt: typeof raw.startedAt === 'string' ? raw.startedAt : null,
    completedModules: modules.sort((a, b) => a - b),
    completedLessons: lessons.sort(),
    updatedAt: typeof raw.updatedAt === 'string' ? raw.updatedAt : null,
  };
}

/**
 * A whole stored profile, normalised. A record written by an earlier version, or
 * edited by hand, still comes back with every field present and nothing extra.
 * Course keys that do not look like slugs are dropped rather than repaired —
 * `__proto__` must never become a key the rest of the server reads back.
 */
export function normalizeProfile(stored) {
  const record = stored !== null && typeof stored === 'object' && !Array.isArray(stored) ? stored : {};
  const courses = {};
  const raw = record.courses;
  if (raw !== null && typeof raw === 'object' && !Array.isArray(raw)) {
    for (const [courseId, course] of Object.entries(raw)) {
      if (COURSE_ID.test(courseId)) courses[courseId] = normalizeCourse(courseId, course);
    }
  }
  return {
    preferences: normalizePreferences(record.preferences),
    personal: normalizePersonal(record.personal),
    courses,
    /** When the learner last opened the notification panel; drives the unread count. */
    notificationsSeenAt: typeof record.notificationsSeenAt === 'string' ? record.notificationsSeenAt : null,
    updatedAt: typeof record.updatedAt === 'string' ? record.updatedAt : null,
  };
}

/**
 * Refuse a brand-new course once the per-account cap is reached. Updating one that
 * already exists is always allowed, so a learner can never be locked out of the
 * pathway they are actually working through.
 */
export function assertCourseRoom(courses, courseId) {
  if (Object.hasOwn(courses, courseId)) return;
  if (Object.keys(courses).length >= LIMITS.maxCoursesPerUser) {
    throw new HttpError(
      409,
      'too_many_courses',
      `An account can track at most ${LIMITS.maxCoursesPerUser} courses.`,
    );
  }
}
