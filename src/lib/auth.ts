/**
 * Browser-side client for the auth server in ./server.
 *
 * Two rules this file exists to enforce:
 *
 *  1. `credentials: 'include'` on every call. The session lives in an HttpOnly
 *     cookie, which JavaScript cannot read — that is the point. Without this
 *     flag the browser would not send it to a different port and every request
 *     would look signed out.
 *  2. No token, password or secret is ever kept in JS. Nothing is written to
 *     localStorage, so nothing can be stolen by a script on the page.
 */

/** Override with VITE_API_URL in .env.local when the API is not on port 4000. */
export const API_URL = (import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:4000').replace(/\/$/, '');

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
  lastLoginAt: string | null;
};

/** Field-level messages the server sends back, keyed by input name. */
export type FieldErrors = Partial<Record<'name' | 'email' | 'password', string>>;

export class AuthError extends Error {
  code: string;
  status: number;
  fields: FieldErrors;

  constructor(message: string, { code = 'error', status = 0, fields = {} } = {}) {
    super(message);
    this.name = 'AuthError';
    this.code = code;
    this.status = status;
    this.fields = fields;
  }
}

type ApiSuccess = { ok: true; user?: AuthUser };
type ApiFailure = { ok: false; error: { code: string; message: string; fields?: FieldErrors } };

async function request(path: string, body?: unknown): Promise<ApiSuccess> {
  let response: Response;

  try {
    response = await fetch(`${API_URL}${path}`, {
      method: body === undefined ? 'GET' : 'POST',
      // Sends and accepts the session cookie across the origin boundary.
      credentials: 'include',
      headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    // fetch only rejects when the request never completed: server down, wrong
    // port, DNS, or a CORS preflight the browser refused outright.
    throw new AuthError(
      `Cannot reach the auth server at ${API_URL}. Start it with: node server/index.mjs`,
      { code: 'network_error' },
    );
  }

  let payload: ApiSuccess | ApiFailure | null = null;
  try {
    payload = (await response.json()) as ApiSuccess | ApiFailure;
  } catch {
    payload = null;
  }

  if (!response.ok || !payload || payload.ok !== true) {
    const failure = payload && payload.ok === false ? payload.error : null;
    throw new AuthError(failure?.message ?? `Request failed (${response.status}).`, {
      code: failure?.code ?? 'server_error',
      status: response.status,
      fields: failure?.fields ?? {},
    });
  }

  return payload;
}

export async function signup(input: { name: string; email: string; password: string }): Promise<AuthUser> {
  const { user } = await request('/api/auth/signup', input);
  if (!user) throw new AuthError('The server did not return an account.', { code: 'bad_response' });
  return user;
}

export async function login(input: { email: string; password: string }): Promise<AuthUser> {
  const { user } = await request('/api/auth/login', input);
  if (!user) throw new AuthError('The server did not return an account.', { code: 'bad_response' });
  return user;
}

export async function logout(): Promise<void> {
  await request('/api/auth/logout', {});
}

/**
 * Who is signed in, or null. A 401 here is the normal "not signed in" answer,
 * not a failure, so it is translated rather than thrown.
 */
export async function me(): Promise<AuthUser | null> {
  try {
    const { user } = await request('/api/auth/me');
    return user ?? null;
  } catch (error) {
    if (error instanceof AuthError && error.status === 401) return null;
    throw error;
  }
}

/** Password rules, mirrored from server/auth.mjs so the form can hint early. */
export const PASSWORD_MIN = 10;
