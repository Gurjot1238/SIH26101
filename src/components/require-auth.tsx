import { type ReactNode, useState } from 'react';
import { Redirect } from 'wouter';
import { PlugZap, RefreshCw } from 'lucide-react';
import { ActionButton, Card, LoadingBlock } from '@/components/ui';
import { useSession } from '@/components/session-provider';
import { API_URL } from '@/lib/auth';

export const AUTH_REQUIRED = String(import.meta.env.VITE_REQUIRE_AUTH ?? 'true').toLowerCase() !== 'false';

export function RequireAuth({ children, fallback = '/login' }: { children: ReactNode; fallback?: string }) {
  const { status, problem, refresh } = useSession();
  const [openedAnyway, setOpenedAnyway] = useState(false);

  if (!AUTH_REQUIRED || openedAnyway) return <>{children}</>;

  if (status === 'checking') {
    return <div className="mx-auto max-w-md p-8"><LoadingBlock label="Checking your session" /></div>;
  }

  if (status === 'unreachable') {
    return <ServerDown problem={problem} onRetry={refresh} onSkip={() => setOpenedAnyway(true)} allowBypass={import.meta.env.DEV || !AUTH_REQUIRED} />;
  }

  if (status === 'signed-out') {
    return <Redirect to={fallback} />;
  }

  return <>{children}</>;
}

function ServerDown({ problem, onRetry, onSkip, allowBypass }: { problem: string; onRetry: () => void; onSkip: () => void; allowBypass: boolean }) {
  return <div className="noise flex min-h-[100dvh] items-center justify-center bg-background px-4">
    <Card className="civic-grid w-full max-w-[460px] p-7 animate-rise-in">
      <div className="flex size-11 items-center justify-center rounded-xl bg-[#f9e5e1]"><PlugZap className="size-5 text-[#a34d43]" /></div>
      <p className="mt-5 font-mono text-[10px] uppercase tracking-[.16em] text-muted-foreground">Sign in unavailable</p>
      <h1 className="mt-1 font-serif text-2xl leading-tight text-foreground">The auth server is not answering.</h1>
      <p className="mt-3 text-sm leading-6 text-muted-foreground">
        {problem || `Nothing is listening at ${API_URL}.`} Start it in a second terminal, then retry:
      </p>
      <pre className="mt-4 overflow-x-auto rounded-lg bg-secondary px-4 py-3 font-mono text-xs text-foreground">npm run auth</pre>
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <ActionButton onClick={onRetry} icon={<RefreshCw className="size-4" />}>Retry</ActionButton>
        {allowBypass && <button data-testid="button-open-demo-anyway" onClick={onSkip} className="text-sm font-semibold text-primary hover:underline">
          Open the demo without signing in
        </button>}
      </div>
      <p className="mt-6 border-t border-border pt-4 text-xs leading-5 text-muted-foreground">
        {allowBypass
          ? 'Every page in the workspace shows demonstration data held in the app itself, so opening it without an account exposes nothing. Accounts and sessions are enforced on the server.'
          : 'Accounts and sessions are enforced on the server, so the workspace stays closed until sign in is available. Start the auth server above, then retry.'}
      </p>
    </Card>
  </div>;
}
