/**
 * One place that knows who is signed in.
 *
 * The session lives in an HttpOnly cookie, so the browser cannot read it — the
 * only way to find out who you are is to ask the server. That request happens
 * exactly once here, on mount, and everything else reads the answer from
 * context. Without this, the gate, the sidebar and the profile page would each
 * fire their own /api/auth/me.
 *
 * Four states, and the fourth is the one that matters:
 *
 *   checking     the first request is still in flight
 *   signed-in    the server returned an account
 *   signed-out   the server answered 401 — the normal "not signed in" reply
 *   unreachable  the server never answered at all
 *
 * "Signed out" and "the auth server is not running" look identical if you only
 * keep a boolean, and they need opposite responses: one sends you to the login
 * page, the other tells you to start the server. Keeping them apart is why this
 * file exists rather than a two-line useState.
 */

import { createContext, type ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { AuthError, type AuthUser, logout as apiLogout, me } from '@/lib/auth';

export type SessionStatus = 'checking' | 'signed-in' | 'signed-out' | 'unreachable';

export type Session = {
  status: SessionStatus;
  user: AuthUser | null;
  /** Why the last check failed. Only set when status is 'unreachable'. */
  problem: string;
  /** Ask the server again — used by the retry button on the unreachable panel. */
  refresh: () => Promise<void>;
  /**
   * Record the account the server just returned from signup or login.
   *
   * Needed, not a convenience: the login page navigates to /dashboard the moment
   * the request succeeds, but this provider still holds the 'signed-out' answer
   * from its first check. Without adopt(), the gate would read that stale answer
   * and bounce a freshly signed-in user straight back to /login.
   */
  adopt: (user: AuthUser) => void;
  signOut: () => Promise<void>;
};

/**
 * What useSession returns when no provider is mounted above it. Returning a
 * harmless signed-out session instead of throwing means an existing component
 * that reads the session still renders — it just shows its demo fallbacks.
 */
const NO_PROVIDER: Session = {
  status: 'signed-out',
  user: null,
  problem: '',
  refresh: async () => {},
  adopt: () => {},
  signOut: async () => {},
};

/**
 * Exported so a test or a preview can supply a session directly, instead of
 * standing up a server just to render a signed-in screen. Application code
 * should use <SessionProvider> and useSession(), not this.
 */
export const SessionContext = createContext<Session | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<SessionStatus>('checking');
  const [user, setUser] = useState<AuthUser | null>(null);
  const [problem, setProblem] = useState('');

  const refresh = useCallback(async () => {
    setStatus('checking');
    try {
      const found = await me();
      setUser(found);
      setProblem('');
      setStatus(found ? 'signed-in' : 'signed-out');
    } catch (error) {
      // me() already turns a 401 into null, so anything thrown here is the
      // server being absent or broken — not the user being signed out.
      setUser(null);
      setProblem(error instanceof AuthError ? error.message : 'The auth server did not answer.');
      setStatus('unreachable');
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const adopt = useCallback((found: AuthUser) => {
    setUser(found);
    setProblem('');
    setStatus('signed-in');
  }, []);

  const signOut = useCallback(async () => {
    // If the call fails the server-side session may survive, but this browser
    // has no usable cookie either way, so the local state is still correct.
    try {
      await apiLogout();
    } catch {
      /* ignored on purpose — see above */
    }
    setUser(null);
    setProblem('');
    setStatus('signed-out');
  }, []);

  const value = useMemo<Session>(
    () => ({ status, user, problem, refresh, adopt, signOut }),
    [status, user, problem, refresh, adopt, signOut],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): Session {
  return useContext(SessionContext) ?? NO_PROVIDER;
}

/* ------------------------------------------------------------------ display */
/* The fallbacks are the strings that were hardcoded in the UI before accounts
 * existed, so a signed-out screen looks exactly as it always did. */

/** "Ananya Sharma" → "AS". First and last initial, never more than two. */
export function initials(name: string | undefined, fallback = 'AS'): string {
  const parts = (name ?? '').trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return fallback;
  const first = parts[0].charAt(0);
  const last = parts.length > 1 ? parts[parts.length - 1].charAt(0) : '';
  return (first + last).toUpperCase();
}

export function firstName(name: string | undefined, fallback = 'Ananya'): string {
  const first = (name ?? '').trim().split(/\s+/)[0];
  return first || fallback;
}

/** Local-clock greeting, so the header is not stuck on "Good morning" at 9pm. */
export function greeting(now: Date = new Date()): string {
  const hour = now.getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}
