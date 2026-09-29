import { API_URL, AuthError } from './auth';

export type NotificationItem = {
  id: string;
  kind: 'welcome' | 'summary' | 'focus' | 'course';
  title: string;
  body: string;
  at: string | null;
};

export type NotificationFeed = {
  items: NotificationItem[];
  unread: number;
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

export function fetchNotifications(): Promise<NotificationFeed> {
  return request('GET', '/api/notifications');
}

export function markNotificationsSeen(): Promise<NotificationFeed> {
  return request('POST', '/api/notifications/seen');
}
