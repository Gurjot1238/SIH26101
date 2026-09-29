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

export type CourseDetail = Omit<CatalogueCourse, 'modules'> & {
  progressModel: { unit: string; formula: string };
  modules: CourseModule[];
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

export function fetchCatalogue(): Promise<Catalogue> {
  return getJson<Catalogue & { ok: true }>('/api/courses');
}

export async function fetchCourse(courseId: string): Promise<CourseDetail> {
  const data = await getJson<{ ok: true; course: CourseDetail }>(
    `/api/courses?id=${encodeURIComponent(courseId)}`,
  );
  return data.course;
}

export function contentUrl(courseId: string, contentFile: string): string {
  return `${API_URL}/api/courses/content?id=${encodeURIComponent(courseId)}&file=${encodeURIComponent(contentFile)}`;
}

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

export function completionPercent(lessonIds: string[], completed: string[] | undefined): number {
  return lessonIds.length ? Math.round((completedCount(lessonIds, completed) / lessonIds.length) * 100) : 0;
}

export function completedCount(lessonIds: string[], completed: string[] | undefined): number {
  if (!lessonIds.length || !completed?.length) return 0;
  const done = new Set(completed);
  let hit = 0;
  for (const id of lessonIds) if (done.has(id)) hit += 1;
  return hit;
}
