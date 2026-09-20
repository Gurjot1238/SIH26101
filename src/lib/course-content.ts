/**
 * Browser client for the dataset courses served by GET /api/courses.
 *
 * Not to be confused with `./courses.ts`, which describes the three internal
 * pathways the app has always listed. This file is about the *real, downloaded*
 * courses — the openly-licensed content the dataset builder fetched to disk. They
 * are reference material, not the learner's private data, so reading them needs no
 * session. A learner's *progress* through one is private and lives in `progress.ts`
 * as `completedLessons`.
 *
 * The completion percentage is computed here, in one place, from the formula the
 * dataset itself declares: completed lessons / total lessons. It divides into the
 * course's real lesson ids, so a stale id left in a stored record after a course is
 * rebuilt can never push the number past 100.
 */

import { API_URL, AuthError } from './auth';

type Failure = { ok: false; error: { code: string; message: string } };

export type CatalogueCourse = {
  courseId: string;
  title: string;
  provider: string;
  category: string;
  subcategory: string;
  level: string;
  description: string;
  estimatedHours: number | null;
  competencies: string[];
  topics: string[];
  license: string;
  officialUrl: string;
  modules: number;
  lessons: number;
};

export type Catalogue = {
  available: boolean;
  total: number;
  technology: number;
  medical: number;
  courses: CatalogueCourse[];
};

export type CourseLesson = {
  lessonId: string;
  title: string;
  type: string;
  estimatedMinutes: number | null;
  contentFile: string;
  hasContent: boolean;
  sourceUrl: string;
};

export type CourseModule = {
  moduleId: string;
  title: string;
  competencies: string[];
  lessons: CourseLesson[];
};

// `CatalogueCourse.modules` is a count (a number); in the detail response the same
// key carries the full module tree instead. Omit the numeric field before widening
// it to the array, otherwise the intersection `number & CourseModule[]` collapses to
// `never` and TypeScript silently accepts rendering the array straight into JSX.
export type CourseDetail = Omit<CatalogueCourse, 'modules'> & {
  progressModel: { unit: string; formula: string };
  modules: CourseModule[];
  /** Every lesson id in order — the set the completion percentage divides into. */
  lessonIds: string[];
};

async function getJson<T>(path: string): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, { credentials: 'include' });
  } catch {
    throw new AuthError(`Cannot reach the server at ${API_URL}. Start it with: node server/index.mjs`, {
      code: 'network_error',
    });
  }

  let payload: (T & { ok: true }) | Failure | null = null;
  try {
    payload = (await response.json()) as (T & { ok: true }) | Failure;
  } catch {
    payload = null;
  }

  if (!response.ok || !payload || payload.ok !== true) {
    const failure = payload && payload.ok === false ? payload.error : null;
    throw new AuthError(failure?.message ?? `Request failed (${response.status}).`, {
      code: failure?.code ?? 'server_error',
      status: response.status,
    });
  }
  return payload;
}

/** The whole catalogue in one call. `available: false` means no dataset is present. */
export function fetchCatalogue(): Promise<Catalogue> {
  return getJson<Catalogue & { ok: true }>('/api/courses');
}

/** One course's full module/lesson tree. */
export async function fetchCourse(courseId: string): Promise<CourseDetail> {
  const data = await getJson<{ ok: true; course: CourseDetail }>(
    `/api/courses?id=${encodeURIComponent(courseId)}`,
  );
  return data.course;
}

/** The URL that opens one lesson's file (PDF, notes, slides). Used by the in-app reader and PDF embed. */
export function contentUrl(courseId: string, contentFile: string): string {
  return `${API_URL}/api/courses/content?id=${encodeURIComponent(courseId)}&file=${encodeURIComponent(contentFile)}`;
}

/**
 * Fetch one lesson's raw text so it can be rendered inside the app (the reader that lets
 * us tell a lesson has actually been read). Course content is public, so no session is
 * needed. Returns the text and its MIME type; the reader renders Markdown/plain text and
 * falls back to an embed for anything binary (PDF).
 */
export async function fetchLessonContent(
  courseId: string,
  contentFile: string,
): Promise<{ text: string; contentType: string }> {
  let response: Response;
  try {
    response = await fetch(contentUrl(courseId, contentFile));
  } catch {
    throw new AuthError(`Cannot reach the server at ${API_URL}. Start it with: node server/index.mjs`, {
      code: 'network_error',
    });
  }
  if (!response.ok) {
    throw new AuthError(`This lesson's file could not be opened (${response.status}).`, {
      code: 'content_unavailable',
      status: response.status,
    });
  }
  const contentType = response.headers.get('content-type') ?? 'application/octet-stream';
  const text = await response.text();
  return { text, contentType };
}

/**
 * Completion percentage for one course: how many of its real lessons the learner
 * has marked done. `completed` may hold ids that no longer exist (a course was
 * rebuilt), so we count only the intersection with the course's current lessons.
 */
export function completionPercent(lessonIds: string[], completed: string[] | undefined): number {
  return lessonIds.length ? Math.round((completedCount(lessonIds, completed) / lessonIds.length) * 100) : 0;
}

/** How many of a course's real lessons are done — the "7 / 40" the card shows. */
export function completedCount(lessonIds: string[], completed: string[] | undefined): number {
  if (!lessonIds.length || !completed?.length) return 0;
  const done = new Set(completed);
  let hit = 0;
  for (const id of lessonIds) if (done.has(id)) hit += 1;
  return hit;
}
