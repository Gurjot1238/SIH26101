import { readFileSync, existsSync, statSync, readdirSync, realpathSync } from 'node:fs';
import { dirname, join, resolve, sep, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { HttpError } from './http.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));

const COURSE_ID = /^[a-z0-9][a-z0-9-]{0,63}$/;

function resolveDatasetDir() {
  const fromEnv = process.env.NEXORA_DATASET_DIR;
  const candidates = fromEnv
    ? [fromEnv]
    : [
        join(HERE, '..', '..', 'Nexora-Course-Dataset'), // sibling of the app repo
        join(HERE, '..', 'Nexora-Course-Dataset'), // inside the app repo
      ];
  for (const dir of candidates) {
    try {
      if (existsSync(join(dir, 'courses')) && statSync(join(dir, 'courses')).isDirectory()) {
        return resolve(dir);
      }
    } catch {
      /* keep looking */
    }
  }
  return fromEnv ? resolve(fromEnv) : null;
}

function summarize(course) {
  const totals = course.totals ?? {};
  const lessonCount =
    typeof totals.lessons === 'number'
      ? totals.lessons
      : (course.modules ?? []).reduce((n, m) => n + (m.lessons?.length ?? 0), 0);
  const moduleCount =
    typeof totals.modules === 'number' ? totals.modules : (course.modules ?? []).length;
  const source = course.source ?? {};
  return {
    courseId: course.course_id,
    title: course.title ?? course.course_id,
    provider: course.provider ?? source.name ?? '',
    category: course.category ?? '',
    subcategory: course.subcategory ?? '',
    level: course.level ?? '',
    description: typeof course.description === 'string' ? course.description : '',
    estimatedHours:
      (course.duration && course.duration.estimated_hours) ??
      (course.duration && course.duration.estimatedHours) ??
      null,
    competencies: Array.isArray(course.competencies) ? course.competencies : [],
    topics: Array.isArray(course.topics) ? course.topics : [],
    license: source.license ?? '',
    officialUrl: source.official_url ?? '',
    modules: moduleCount,
    lessons: lessonCount,
    language: typeof course.language === 'string' ? course.language : '',
    learningFormat: course.learning_format ?? course.format ?? '',
    prerequisites: Array.isArray(course.prerequisites) ? course.prerequisites : [],
    availability: normaliseAvailability(course.availability),
  };
}

function normaliseAvailability(value) {
  if (value === undefined || value === null || value === true) return 'available';
  if (value === false) return 'unavailable';
  const key = String(value).toLowerCase().trim();
  if (key === '' || key === 'available' || key === 'active' || key === 'published') return 'available';
  return 'unavailable';
}

let cache = null;

function load() {
  if (cache) return cache;

  const root = resolveDatasetDir();
  if (!root) {
    cache = { root: null, courses: [], byId: new Map(), dirById: new Map() };
    return cache;
  }

  const coursesDir = join(root, 'courses');
  const byId = new Map();
  const dirById = new Map();
  const summaries = [];

  let folders = [];
  try {
    folders = readdirSync(coursesDir, { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .map((d) => d.name)
      .sort();
  } catch {
    folders = [];
  }

  for (const folder of folders) {
    const courseDir = join(coursesDir, folder);
    const jsonPath = join(courseDir, 'course.json');
    if (!existsSync(jsonPath)) continue;
    let course;
    try {
      course = JSON.parse(readFileSync(jsonPath, 'utf8'));
    } catch {
      continue;
    }
    const id = course.course_id;
    if (typeof id !== 'string' || !COURSE_ID.test(id)) continue;
    if (byId.has(id)) continue;

    byId.set(id, course);
    dirById.set(id, courseDir);
    summaries.push(summarize(course));
  }

  summaries.sort(
    (a, b) => a.category.localeCompare(b.category) || a.title.localeCompare(b.title),
  );

  cache = { root, courses: summaries, byId, dirById };
  return cache;
}

export function resetCoursesCache() {
  cache = null;
}

export function datasetAvailable() {
  return load().root !== null;
}

export function catalogue() {
  const { root, courses } = load();
  const technology = courses.filter((c) => c.category.toLowerCase().startsWith('tech')).length;
  const medical = courses.filter((c) => c.category.toLowerCase().startsWith('med')).length;
  return {
    available: root !== null,
    total: courses.length,
    technology,
    medical,
    courses,
  };
}

export function getCourse(courseId) {
  if (typeof courseId !== 'string' || !COURSE_ID.test(courseId)) {
    throw new HttpError(400, 'invalid_input', 'Course id must be a lowercase slug.');
  }
  const { byId, dirById } = load();
  const course = byId.get(courseId);
  if (!course) throw new HttpError(404, 'not_found', 'No such course.');
  const courseDir = dirById.get(courseId);

  const modules = (course.modules ?? []).map((m) => ({
    moduleId: m.module_id,
    title: m.title ?? '',
    competencies: Array.isArray(m.competencies) ? m.competencies : [],
    lessons: (m.lessons ?? []).map((l) => {
      const contentFile = typeof l.content_file === 'string' ? l.content_file : '';
      const hasContent = contentFile !== '' && fileWithin(courseDir, contentFile) !== null;
      return {
        lessonId: l.lesson_id,
        title: l.title ?? '',
        type: l.type ?? 'file',
        estimatedMinutes: l.estimated_minutes ?? null,
        contentFile,
        hasContent,
        sourceUrl: l.source_url ?? (course.source ?? {}).official_url ?? '',
      };
    }),
  }));

  const lessonIds = [];
  for (const m of modules) for (const l of m.lessons) lessonIds.push(l.lessonId);

  return {
    ...summarize(course),
    progressModel: course.progress_model ?? { unit: 'lesson', formula: 'completed_lessons / total_lessons * 100' },
    modules,
    lessonIds,
  };
}

const CONTENT_TYPES = {
  '.pdf': 'application/pdf',
  '.txt': 'text/plain; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8',
  '.markdown': 'text/markdown; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.htm': 'text/html; charset=utf-8',
  '.csv': 'text/csv; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.ipynb': 'application/json; charset=utf-8',
  '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  '.ppt': 'application/vnd.ms-powerpoint',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.doc': 'application/msword',
  '.zip': 'application/zip',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
};

function fileWithin(courseDir, relativePath) {
  if (typeof relativePath !== 'string' || relativePath === '') return null;
  if (relativePath.startsWith('/') || relativePath.startsWith('\\') || /^[a-zA-Z]:/.test(relativePath)) {
    return null;
  }
  const base = resolve(courseDir);
  const target = resolve(base, relativePath);
  if (target !== base && !target.startsWith(base + sep)) return null;
  try {
    const st = statSync(target);
    if (!st.isFile() || st.size === 0) return null;
    const realBase = realpathSync(base);
    const realTarget = realpathSync(target);
    if (realTarget !== realBase && !realTarget.startsWith(realBase + sep)) return null;
    return realTarget;
  } catch {
    return null;
  }
}

export function resolveContent(courseId, file) {
  if (typeof courseId !== 'string' || !COURSE_ID.test(courseId)) {
    throw new HttpError(400, 'invalid_input', 'Course id must be a lowercase slug.');
  }
  const { dirById } = load();
  const courseDir = dirById.get(courseId);
  if (!courseDir) throw new HttpError(404, 'not_found', 'No such course.');

  const abs = fileWithin(courseDir, file);
  if (!abs) throw new HttpError(404, 'not_found', 'No such file in this course.');

  return { path: abs, contentType: CONTENT_TYPES[extname(abs).toLowerCase()] ?? 'application/octet-stream' };
}

export function coursesStatus() {
  const { root, courses } = load();
  return { root, count: courses.length };
}
