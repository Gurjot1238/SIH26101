/**
 * The login gate. Wraps every page that is not /login or /signup.
 *
 * The interesting case is not "signed out" — it is "the auth server is not
 * running". Those two look the same to a boolean, and treating them the same
 * gives you a dead end: the browser bounces you to /login, you type a correct
 * password, and it fails again with no explanation of why.
 *
 * So this component asks the session for four states and answers each one
 * differently. When the server cannot be reached it says so, prints the command
 * that starts it, offers a retry, and offers to open the demo anyway.
 *
 * Why offering that bypass is not a hole: nothing behind this gate is
 * server-side data. Every page here renders local demonstration data that ships
 * in the bundle, so anyone with the files already has it. The gate is here so
 * the product behaves like a real product, not to protect a secret. The things
 * that do need protecting — the account records and the session cookie — are
 * enforced on the server in server/index.mjs, where a browser cannot argue with
 * them. If real per-user data is ever served from an API, delete the bypass
 * button below and rely on the server rejecting the request instead.
 *
 * Turn the gate off entirely with VITE_REQUIRE_AUTH=false in .env.local.
 */

import { type ReactNode, useState } from 'react';
import { Redirect } from 'wouter';
import { PlugZap, RefreshCw } from 'lucide-react';
import { ActionButton, Card, LoadingBlock } from '@/components/ui';
import { useSession } from '@/components/session-provider';
import { API_URL } from '@/lib/auth';

/** Default is on. Only the exact string "false" turns it off. */
export const AUTH_REQUIRED = String(import.meta.env.VITE_REQUIRE_AUTH ?? 'true').toLowerCase() !== 'false';

export function RequireAuth({ children, fallback = '/login' }: { children: ReactNode; fallback?: string }) {
  const { status, problem, refresh } = useSession();
  // Set only by the button on the unreachable panel, and only for this page
  // load — nothing is written to storage, so a reload asks again.
  const [openedAnyway, setOpenedAnyway] = useState(false);

  if (!AUTH_REQUIRED || openedAnyway) return <>{children}</>;

  if (status === 'checking') {
    return <div className="mx-auto max-w-md p-8"><LoadingBlock label="Checking your session" /></div>;
  }

  if (status === 'unreachable') {
    return <ServerDown problem={problem} onRetry={refresh} onSkip={() => setOpenedAnyway(true)} />;
  }

  if (status === 'signed-out') {
    return <Redirect to={fallback} />;
  }

  return <>{children}</>;
}

function ServerDown({ problem, onRetry, onSkip }: { problem: string; onRetry: () => void; onSkip: () => void }) {
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
        <button data-testid="button-open-demo-anyway" onClick={onSkip} className="text-sm font-semibold text-primary hover:underline">
          Open the demo without signing in
        </button>
      </div>
      <p className="mt-6 border-t border-border pt-4 text-xs leading-5 text-muted-foreground">
        Every page in the workspace shows demonstration data held in the app itself, so opening it
        without an account exposes nothing. Accounts and sessions are enforced on the server.
      </p>
    </Card>
  </div>;
}
