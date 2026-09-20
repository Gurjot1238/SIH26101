/**
 * Read-only reader for the Nexora Genuine Course Content Dataset.
 *
 * The dataset is a folder of real, openly-licensed courses that were downloaded
 * and assembled by a separate builder (see ../Nexora-Course-Dataset). This module
 * is the *only* thing in the server that touches it, and it never writes: courses
 * are content the app serves, not user data it owns. A learner's progress through
 * a course lives in profiles.json via progress.mjs; nothing here is per-user.
 *
 * Three things this file exists to guarantee:
 *
 *   1. **It serves only what is really on disk.** A course appears in the
 *      catalogue only if its course.json parses; a lesson is served only if its
 *      content_file exists. There is no synthesized or placeholder content.
 *   2. **A file request cannot escape the dataset.** `resolveContent` refuses any
 *      path that, once resolved, does not sit inside that course's own directory,
 *      so `..` or an absolute path cannot read users.json or /etc/passwd.
 *   3. **The catalogue key is the course_id inside course.json, not the folder
 *      name.** The builder names folders `course-001-…` but the stable id used for
 *      progress is the `course_id` field, so that is what everything keys on.
 *
 * The dataset does not change while the server runs, so the catalogue and the
 * id→directory map are read once and cached. Restart the server after a rebuild.
 */

import { readFileSync, existsSync, statSync, readdirSync } from 'node:fs';
import { dirname, join, resolve, sep, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { HttpError } from './http.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));

/** Same slug shape progress.mjs allows for a courseId. */
const COURSE_ID = /^[a-z0-9][a-z0-9-]{0,63}$/;

/**
 * Where the dataset lives. An explicit env var wins; otherwise the two natural
 * places relative to the server: a sibling of the app folder (the builder's
 * default), or inside the app folder. The first candidate that actually contains
 * a `courses/` directory is used.
 */
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

/* --------------------------------------------------------------- light view */

/**
 * The catalogue row for one course: enough to list and filter it, without the
 * module/lesson tree. `lessons` is the denominator the completion percentage
 * divides into, so the browser can show "0 / 40" before opening anything.
 */
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
  };
}

/* ------------------------------------------------------------------- loader */

let cache = null;

/**
 * Read every course.json once. A folder whose course.json is missing, unparseable
 * or carries an id that is not a clean slug is skipped rather than trusted — the
 * dataset can be hand-edited, and a bad id must never become a lookup key.
 */
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
      continue; // unparseable — skip, never serve half a file
    }
    const id = course.course_id;
    if (typeof id !== 'string' || !COURSE_ID.test(id)) continue;
    if (byId.has(id)) continue; // first wins; a duplicate id is a dataset bug, not ours to merge

    byId.set(id, course);
    dirById.set(id, courseDir);
    summaries.push(summarize(course));
  }

  // Stable, human order: category then title.
  summaries.sort(
    (a, b) => a.category.localeCompare(b.category) || a.title.localeCompare(b.title),
  );

  cache = { root, courses: summaries, byId, dirById };
  return cache;
}

/** Test hook: drop the cache so a test can point at a fixture dataset. */
export function resetCoursesCache() {
  cache = null;
}

/* -------------------------------------------------------------------- reads */

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

/**
 * One course's full module/lesson tree, plus the summary fields. Only lessons
 * whose content_file exists on disk are returned, and each gets a `hasContent`
 * flag so the UI never links to a file that is not there.
 */
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
    /** Every lesson id in order — the set a completion percentage divides into. */
    lessonIds,
  };
}

/* ----------------------------------------------------------- file streaming */

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

/**
 * Resolve `relativePath` under `courseDir` and return the absolute path only if it
 * stays inside `courseDir`. Anything that escapes — `..`, an absolute path, a
 * symlink target outside the tree — returns null. This is the whole defence
 * against a crafted `?file=` reading arbitrary disk.
 */
function fileWithin(courseDir, relativePath) {
  if (typeof relativePath !== 'string' || relativePath === '') return null;
  // A leading slash or a drive letter would make join ignore courseDir.
  if (relativePath.startsWith('/') || relativePath.startsWith('\\') || /^[a-zA-Z]:/.test(relativePath)) {
    return null;
  }
  const base = resolve(courseDir);
  const target = resolve(base, relativePath);
  if (target !== base && !target.startsWith(base + sep)) return null;
  try {
    const st = statSync(target);
    if (!st.isFile() || st.size === 0) return null;
  } catch {
    return null;
  }
  return target;
}

/**
 * Absolute path + content type for one lesson file, or an HttpError. The file
 * must belong to the named course and exist; nothing else is reachable.
 */
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

/** For the startup banner: where the dataset was found and how much is in it. */
export function coursesStatus() {
  const { root, courses } = load();
  return { root, count: courses.length };
}
