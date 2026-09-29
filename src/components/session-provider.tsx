import { createContext, type ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { AuthError, type AuthUser, logout as apiLogout, me } from '@/lib/auth';

export type SessionStatus = 'checking' | 'signed-in' | 'signed-out' | 'unreachable';

export type Session = {
  status: SessionStatus;
  user: AuthUser | null;
  problem: string;
  refresh: () => Promise<void>;
  adopt: (user: AuthUser) => void;
  signOut: () => Promise<void>;
};

const NO_PROVIDER: Session = {
  status: 'signed-out',
  user: null,
  problem: '',
  refresh: async () => {},
  adopt: () => {},
  signOut: async () => {},
};

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

export function greeting(now: Date = new Date()): string {
  const hour = now.getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}
