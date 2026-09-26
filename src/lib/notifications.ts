/**
 * Browser-side client for the notification feed.
 *
 * The feed is *derived* on the server from the account's own progress, courses and
 * profile — there is no stored notifications table. This client only reads it and
 * records that the panel was opened. Same two rules as the rest of the API layer:
 * `credentials: 'include'` because the session is an HttpOnly cookie, and nothing
 * is written to localStorage.
 *
 * `progress.ts` keeps its `request` helper private, so a small equivalent lives
 * here rather than widening that module's surface for one more consumer.
 */

import { API_URL, AuthError } from './auth';

/** One derived notice. `at` is an ISO timestamp, or null for an undated call-to-action. */
export type NotificationItem = {
  id: string;
  kind: 'welcome' | 'summary' | 'focus' | 'course';
  title: string;
  body: string;
  at: string | null;
};

export type NotificationFeed = {
  items: NotificationItem[];
  /** How many items arrived since the panel was last opened. */
  unread: number;
  /** When the panel was last opened, or null if never. */
  seenAt: string | null;
};

type Success = NotificationFeed & { ok: true };
type Failure = { ok: false; error: { code: string; message: string } };

async function request(method: 'GET' | 'POST', path: string): Promise<NotificationFeed> {
  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, { method, credentials: 'include' });
  } catch {
    throw new AuthError(`Cannot reach the server at ${API_URL}.`, { code: 'network_error' });
  }

  let payload: Success | Failure | null = null;
  try {
    payload = (await response.json()) as Success | Failure;
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

  return { items: payload.items, unread: payload.unread, seenAt: payload.seenAt };
}

/** The current feed for the signed-in account. */
export function fetchNotifications(): Promise<NotificationFeed> {
  return request('GET', '/api/notifications');
}

/** Mark everything read as of now; returns the rebuilt feed (unread should be 0). */
export function markNotificationsSeen(): Promise<NotificationFeed> {
  return request('POST', '/api/notifications/seen');
}
