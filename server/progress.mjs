import { randomUUID } from 'node:crypto';

import { HttpError } from './http.mjs';

export const COMPETENCY_IDS = ['data-quality', 'inference', 'dissemination', 'digital-tools', 'leadership'];
export const BANDS = ['strong', 'average', 'needs-work', 'unrated'];
export const BAND_STRONG_MIN = 80;
export const BAND_AVERAGE_MIN = 50;
export const MIN_QUESTIONS_FOR_BAND = 2;

export const LANGUAGES = ['English', 'Hindi', 'Kannada'];
export const ATTEMPT_SOURCES = ['material', 'assessment'];

export const LIMITS = {
  maxQuestions: 200,
  maxTopics: 12,
  maxLabel: 120,
  maxTopicName: 80,
  maxDurationSeconds: 12 * 60 * 60,
  maxAttemptsPerUser: 200,
  maxCoursesPerUser: 50,
  maxModulesPerCourse: 60,
  maxLessonsPerCourse: 400,
  defaultHistory: 50,
  inlineHistory: 20,
};

function fieldError(field, message) {
  return new HttpError(400, 'invalid_input', message, { [field]: message });
}

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

export function bandFor(percent, questionCount) {
  if (questionCount < MIN_QUESTIONS_FOR_BAND) return 'unrated';
  if (percent >= BAND_STRONG_MIN) return 'strong';
  if (percent >= BAND_AVERAGE_MIN) return 'average';
  return 'needs-work';
}

export function newAttemptId() {
  return `att_${randomUUID().replaceAll('-', '')}`;
}

export function validateAttempt(body) {
  if (!ATTEMPT_SOURCES.includes(body.source)) {
    throw fieldError('source', `Source must be one of: ${ATTEMPT_SOURCES.join(', ')}.`);
  }

  if (typeof body.label !== 'string') throw fieldError('label', 'A label for this attempt is required.');
  const label = cleanLine(body.label, LIMITS.maxLabel);
  if (label === '') throw fieldError('label', 'A label for this attempt is required.');

  const total = requireInteger(body.total, 'total', 'Question count', { min: 1, max: LIMITS.maxQuestions });
  const correct = requireInteger(body.correct, 'correct', 'Correct count', { min: 0, max: total });

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

    const key = topic.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);

    questionSum += total;
    correctSum += correct;
    const percent = percentOf(correct, total);
    out.push({ topic, competency: entry.competency ?? null, correct, total, percent, band: bandFor(percent, total) });
  }

  if (questionSum > paper.total) throw fieldError('topics', 'Topic question counts add up to more than the paper.');
  if (correctSum > paper.correct) throw fieldError('topics', 'Topic correct counts add up to more than the score.');
  return out;
}

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
  for (const id of COMPETENCY_IDS) {
    const entry = totals.get(id);
    if (entry) out[id] = percentOf(entry.correct, entry.total);
  }
  return out;
}

const bandRank = { 'needs-work': 0, average: 1, unrated: 2, strong: 3 };

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
    index: questions > 0 ? Math.round((correct / questions) * 1000) / 10 : 0,
    band: bandFor(percent, questions),
    minutes: Math.round(seconds / 60),
    firstAttemptAt: attempts.length > 0 ? attempts[0].at : null,
    lastAttemptAt: attempts.length > 0 ? attempts[attempts.length - 1].at : null,
    sources,
    competencies,
    topics,
    focus: competencies.filter((item) => item.band === 'needs-work' || item.band === 'average'),
  };
}

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

const PREFERENCE_KEYS = ['language', 'weeklyNote', 'demoLabels', 'notify'];

export function defaultPreferences() {
  return {
    language: 'English',
    weeklyNote: true,
    demoLabels: true,
    notify: true,
  };
}

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

const PERSONAL_KEYS = ['phone', 'bio', 'role', 'department', 'location'];
const PERSONAL_CAPS = { phone: 40, bio: 400, role: 80, department: 120, location: 80 };

export function defaultPersonal() {
  return { phone: '', bio: '', role: '', department: '', location: '' };
}

export function normalizePersonal(stored) {
  const raw = stored !== null && typeof stored === 'object' && !Array.isArray(stored) ? stored : {};
  const out = defaultPersonal();
  for (const key of PERSONAL_KEYS) {
    if (typeof raw[key] === 'string') out[key] = cleanLine(raw[key], PERSONAL_CAPS[key]);
  }
  return out;
}

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

const COURSE_KEYS = ['courseId', 'saved', 'started', 'completedModules', 'completedLessons'];
const COURSE_ID = /^[a-z0-9][a-z0-9-]{0,63}$/;
const LESSON_ID = /^[a-z0-9][a-z0-9-]{0,79}$/;

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
    next.startedAt = requireBoolean(body.started, 'started', 'Started') ? (next.startedAt ?? now) : null;
  }
  if (Object.hasOwn(body, 'completedModules')) {
    next.completedModules = validateModules(body.completedModules);
    if (next.completedModules.length > 0 && !next.startedAt) next.startedAt = now;
  }
  if (Object.hasOwn(body, 'completedLessons')) {
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
    notificationsSeenAt: typeof record.notificationsSeenAt === 'string' ? record.notificationsSeenAt : null,
    updatedAt: typeof record.updatedAt === 'string' ? record.updatedAt : null,
  };
}

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
