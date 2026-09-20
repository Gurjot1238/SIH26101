/**
 * The browser client for saved MCQ sets.
 *
 * A learner can save a generated paper to their account and open it later. Everything
 * here talks to `/api/papers`, carries the session cookie, and returns typed results or
 * throws `PaperError` so a page can say what happened. The server owns the id, the
 * timestamp and the owner; this file never invents them.
 */

import { API_URL } from './auth';
import { type MaterialQuestion } from './materials';

/**
 * The per-account cap, mirrored from `PAPER_LIMITS.maxPerUser` in server/papers.mjs so the
 * page can state the number without a round trip. `scripts/client-test.mjs` asserts the two
 * agree — a cap printed on screen that disagrees with the one the server enforces is worse
 * than printing no number at all.
 */
export const MAX_SAVED_PAPERS = 60;

export type SavedPaperSummary = {
  id: string;
  title: string;
  difficulty: string;
  count: number;
  topics: string[];
  createdAt: string;
};

export type SavedPaper = SavedPaperSummary & {
  questions: MaterialQuestion[];
};

export class PaperError extends Error {
  code: string;
  status: number;

  constructor(message: string, { code = 'paper_error', status = 0 } = {}) {
    super(message);
    this.name = 'PaperError';
    this.code = code;
    this.status = status;
  }
}

type ErrorBody = { ok?: boolean; error?: { code?: string; message?: string } };

async function request<T>(path: string, init: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      credentials: 'include',
      ...init,
    });
  } catch {
    throw new PaperError(
      `Cannot reach the NEXORA AI server at ${API_URL}. Start it with: node server/index.mjs`,
      { code: 'network_error' },
    );
  }

  let payload: unknown = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok || (payload as ErrorBody)?.ok !== true) {
    const body = (payload ?? {}) as ErrorBody;
    const code = body.error?.code ?? (response.status === 401 ? 'unauthorized' : 'paper_error');
    const message = body.error?.message
      ?? (response.status === 401 ? 'Sign in to save and open your papers.' : 'That did not work. Please try again.');
    throw new PaperError(message, { code, status: response.status });
  }

  return payload as T;
}

/**
 * Save a generated set. `title` defaults to the file name on the server if blank.
 * Only the fields the server allow-lists are kept, so passing the whole question
 * objects is safe.
 */
export async function savePaper(input: {
  title: string;
  difficulty?: string;
  questions: MaterialQuestion[];
}): Promise<SavedPaperSummary> {
  const body = await request<{ paper: SavedPaper }>('/api/papers', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title: input.title,
      ...(input.difficulty ? { difficulty: input.difficulty } : {}),
      questions: input.questions,
    }),
  });
  return body.paper;
}

/** The caller's saved papers, newest first, without their questions. */
export async function listPapers(): Promise<SavedPaperSummary[]> {
  const body = await request<{ papers: SavedPaperSummary[] }>('/api/papers', { method: 'GET' });
  return body.papers;
}

/** One saved paper in full, including its questions. */
export async function getPaper(id: string): Promise<SavedPaper> {
  const body = await request<{ paper: SavedPaper }>(`/api/papers?id=${encodeURIComponent(id)}`, { method: 'GET' });
  return body.paper;
}

/** Delete one saved paper by id. */
export async function deletePaper(id: string): Promise<void> {
  await request<{ removed: boolean }>(`/api/papers?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
}
