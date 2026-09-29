export const API_URL = (import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:4000').replace(/\/$/, '');

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
  lastLoginAt: string | null;
};

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
      credentials: 'include',
      headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
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

export async function me(): Promise<AuthUser | null> {
  try {
    const { user } = await request('/api/auth/me');
    return user ?? null;
  } catch (error) {
    if (error instanceof AuthError && error.status === 401) return null;
    throw error;
  }
}

export const PASSWORD_MIN = 10;
