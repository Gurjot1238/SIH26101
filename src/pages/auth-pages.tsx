/**
 * Sign in and create account pages.
 *
 * Every visual token here is borrowed from the rest of StatSkill — the same
 * `Card`, the same `ActionButton`, the same field markup used on the Profile
 * page, the same `civic-grid` / `noise` / `animate-rise-in` utilities. Nothing
 * in an existing file was modified to make these fit.
 *
 * Differences from the HTML mockups these replace, all deliberate:
 *   - autocomplete hints so password managers behave
 *   - a show/hide toggle instead of a password you cannot check
 *   - real loading, error, field-error and success states
 *   - no "Remember me" checkbox, because the session length is fixed by the
 *     server and a checkbox that changes nothing is worse than no checkbox
 *   - the cross-links point at /signup and /login, not /signup.html
 */

import { type ReactNode, useId, useState } from 'react';
import { ArrowRight, Check, CircleAlert, Eye, EyeOff, LoaderCircle, ShieldCheck } from 'lucide-react';
import { Link, useLocation } from 'wouter';
import { ActionButton, Card, ProgressBar } from '@/components/ui';
import { useSession } from '@/components/session-provider';
import { AuthError, PASSWORD_MIN, type AuthUser, type FieldErrors, login, signup } from '@/lib/auth';

/* ------------------------------------------------------------------ layout */

function AuthLayout({ eyebrow, title, description, children, footer }: {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
  footer: ReactNode;
}) {
  return <div className="noise flex min-h-[100dvh] flex-col bg-background text-foreground">
    <div className="civic-grid flex flex-1 items-center justify-center px-4 py-10 sm:px-6">
      <div className="w-full max-w-[460px] animate-rise-in">
        <Link href="/dashboard" data-testid="link-auth-brand" className="mb-7 flex items-center justify-center gap-3">
          <div className="relative flex size-9 items-center justify-center rounded-lg bg-accent text-sidebar">
            <span className="font-serif text-xl font-semibold">S</span>
            <span className="absolute -right-1 -top-1 size-2 rounded-full bg-[#9ed5cc]" />
          </div>
          <div>
            <p className="font-serif text-[21px] leading-none text-foreground">StatSkill</p>
            <p className="mt-1 font-mono text-[8px] uppercase tracking-[.18em] text-muted-foreground">Intelligence platform</p>
          </div>
        </Link>
        <Card className="p-7 sm:p-8">
          <p className="mb-1 font-mono text-[10px] font-medium uppercase tracking-[.16em] text-primary">{eyebrow}</p>
          <h1 className="font-serif text-[27px] leading-tight text-foreground">{title}</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">{description}</p>
          <div className="mt-6">{children}</div>
        </Card>
        <p className="mt-5 text-center text-sm text-muted-foreground">{footer}</p>
        <p className="mt-4 flex items-center justify-center gap-1.5 text-center font-mono text-[10px] uppercase tracking-[.12em] text-muted-foreground/70">
          <ShieldCheck className="size-3.5 text-primary/70" /> scrypt hashing · http-only session cookie
        </p>
      </div>
    </div>
  </div>;
}

/* ------------------------------------------------------------------- fields */

const FIELD_BASE = 'mt-2 w-full rounded-lg border bg-card px-3 py-2.5 text-sm outline-none transition-colors';
const FIELD_OK = 'border-input focus:ring-2 focus:ring-primary/20';
const FIELD_BAD = 'border-[#c86c5e] focus:ring-2 focus:ring-[#c86c5e]/25';

function fieldClass(hasError: boolean) {
  return `${FIELD_BASE} ${hasError ? FIELD_BAD : FIELD_OK}`;
}

/** Shown under an input. Also referenced by aria-describedby so it is announced. */
function FieldNote({ id, error, hint }: { id: string; error?: string; hint?: string }) {
  if (error) {
    return <span id={id} role="alert" className="mt-1.5 flex items-start gap-1.5 text-xs font-medium text-[#a34d43]">
      <CircleAlert className="mt-px size-3.5 shrink-0" />{error}
    </span>;
  }
  if (hint) return <span id={id} className="mt-1.5 block text-xs text-muted-foreground">{hint}</span>;
  return null;
}

/** The one place a request-level failure is rendered, so both pages match. */
function ErrorBanner({ message }: { message: string }) {
  return <div
    role="alert"
    data-testid="text-auth-error"
    className="mb-5 flex items-start gap-2.5 rounded-lg border border-[#e6bdb5] bg-[#fbeeeb] px-3.5 py-3 text-sm text-[#8f4137] animate-rise-in"
  >
    <CircleAlert className="mt-0.5 size-4 shrink-0" />
    <span>{message}</span>
  </div>;
}

function SuccessBanner({ message }: { message: string }) {
  return <div
    role="status"
    data-testid="text-auth-success"
    className="mb-5 flex items-start gap-2.5 rounded-lg border border-[#b4d8d3] bg-[#edf8f5] px-3.5 py-3 text-sm font-medium text-[#216b67] animate-rise-in"
  >
    <Check className="mt-0.5 size-4 shrink-0" />
    <span>{message}</span>
  </div>;
}

/** Reveal toggle. Sits inside the input's box so the layout does not shift. */
function RevealButton({ shown, onToggle }: { shown: boolean; onToggle: () => void }) {
  return <button
    type="button"
    data-testid="button-toggle-password"
    onClick={onToggle}
    aria-label={shown ? 'Hide password' : 'Show password'}
    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
  >
    {shown ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
  </button>;
}

/* ---------------------------------------------------------------- session peek */

/**
 * Both pages read the one session the app already fetched, rather than asking
 * the server again. If somebody is signed in, the page says so instead of
 * silently presenting a form that would just replace their session. A server
 * that is down leaves this null and never blocks the form.
 */
function AlreadySignedIn({ user, onContinue }: { user: AuthUser; onContinue: () => void }) {
  return <div className="mb-5 rounded-lg border border-[#b4d8d3] bg-[#edf8f5] px-3.5 py-3 text-sm text-[#216b67] animate-rise-in">
    <p>Signed in as <b>{user.name}</b>.</p>
    <button
      type="button"
      data-testid="button-continue-to-app"
      onClick={onContinue}
      className="mt-1.5 inline-flex items-center gap-1 text-sm font-semibold underline"
    >
      Continue to the workspace <ArrowRight className="size-3.5" />
    </button>
  </div>;
}

/* --------------------------------------------------------------------- login */

export function Login() {
  const [, setLocation] = useLocation();
  const { user: existing, adopt } = useSession();
  const ids = useId();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [reveal, setReveal] = useState(false);
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState('');
  const [fields, setFields] = useState<FieldErrors>({});
  const [done, setDone] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (busy) return;

    setBusy(true);
    setFailure('');
    setFields({});

    try {
      const user = await login({ email, password });
      // Hand the account to the session before navigating, or the gate on
      // /dashboard would still be holding the earlier "signed out" answer.
      adopt(user);
      setDone(true);
      // Give the success line a beat to render before leaving the page.
      window.setTimeout(() => setLocation('/dashboard'), 600);
    } catch (error) {
      if (error instanceof AuthError) {
        setFailure(error.message);
        setFields(error.fields);
      } else {
        setFailure('Something went wrong. Please try again.');
      }
      setPassword('');
      setBusy(false);
    }
  }

  return <AuthLayout
    eyebrow="Secure sign in"
    title="Welcome back."
    description="Sign in to pick up your competency plan where you left it."
    footer={<>New to StatSkill? <Link href="/signup" data-testid="link-goto-signup" className="font-semibold text-primary hover:underline">Create an account</Link></>}
  >
    {existing && !done && <AlreadySignedIn user={existing} onContinue={() => setLocation('/dashboard')} />}
    {done && <SuccessBanner message="Signed in. Taking you to your workspace..." />}
    {failure && !done && <ErrorBanner message={failure} />}

    <form onSubmit={submit} noValidate className="space-y-5">
      <label className="block" htmlFor={`${ids}-email`}>
        <span className="text-sm font-semibold">Email address</span>
        <input
          id={`${ids}-email`}
          data-testid="input-login-email"
          type="email"
          name="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          autoCapitalize="none"
          spellCheck={false}
          required
          maxLength={254}
          disabled={busy || done}
          placeholder="you@mospi.gov.in"
          aria-invalid={Boolean(fields.email)}
          aria-describedby={`${ids}-email-note`}
          className={fieldClass(Boolean(fields.email))}
        />
        <FieldNote id={`${ids}-email-note`} error={fields.email} />
      </label>

      <label className="block" htmlFor={`${ids}-password`}>
        <span className="text-sm font-semibold">Password</span>
        <span className="relative block">
          <input
            id={`${ids}-password`}
            data-testid="input-login-password"
            type={reveal ? 'text' : 'password'}
            name="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
            maxLength={200}
            disabled={busy || done}
            placeholder="Your password"
            aria-invalid={Boolean(fields.password)}
            aria-describedby={`${ids}-password-note`}
            className={`${fieldClass(Boolean(fields.password))} pr-11`}
          />
          <RevealButton shown={reveal} onToggle={() => setReveal(!reveal)} />
        </span>
        <FieldNote
          id={`${ids}-password-note`}
          error={fields.password}
          hint="Password reset is not built yet — ask your administrator to set a new one."
        />
      </label>

      <ActionButton type="submit" className="w-full" disabled={busy || done}>
        {busy ? <><LoaderCircle className="size-4 animate-spin" /> Signing in...</> : <>Sign in <ArrowRight className="size-4" /></>}
      </ActionButton>
    </form>

    <p className="mt-5 border-t border-border pt-4 text-xs text-muted-foreground">
      You stay signed in on this device for 7 days, or until you sign out.
    </p>
  </AuthLayout>;
}

/* ------------------------------------------------------------ password meter */

/**
 * A hint, not a gate. The server owns the real policy (see validateNewPassword
 * in server/auth.mjs); this only tells the user which way is up while they type.
 * Length is weighted hardest because length beats character-class trickery.
 */
function passwordStrength(value: string) {
  if (value === '') return { score: 0, label: 'Not set yet', color: 'bg-secondary' };

  let score = 0;
  if (value.length >= 6) score += 15;
  if (value.length >= PASSWORD_MIN) score += 30;
  if (value.length >= 16) score += 20;
  if (/[a-z]/.test(value) && /[A-Z]/.test(value)) score += 12;
  if (/\d/.test(value)) score += 11;
  if (/[^A-Za-z0-9]/.test(value)) score += 12;
  score = Math.min(100, score);

  if (value.length < PASSWORD_MIN) return { score: Math.min(score, 35), label: `Too short — ${PASSWORD_MIN - value.length} more to go`, color: 'bg-[#c86c5e]' };
  if (score < 65) return { score, label: 'Acceptable', color: 'bg-accent' };
  if (score < 88) return { score, label: 'Strong', color: 'bg-primary' };
  return { score, label: 'Very strong', color: 'bg-primary' };
}

/* -------------------------------------------------------------------- signup */

export function Signup() {
  const [, setLocation] = useLocation();
  const { user: existing, adopt } = useSession();
  const ids = useId();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [reveal, setReveal] = useState(false);
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState('');
  const [fields, setFields] = useState<FieldErrors>({});
  const [created, setCreated] = useState<AuthUser | null>(null);

  const strength = passwordStrength(password);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (busy) return;

    setBusy(true);
    setFailure('');
    setFields({});

    try {
      const user = await signup({ name, email, password });
      // Same reason as on the login page: the gate must know before we navigate.
      adopt(user);
      setCreated(user);
      setPassword('');
      window.setTimeout(() => setLocation('/dashboard'), 900);
    } catch (error) {
      if (error instanceof AuthError) {
        setFailure(error.message);
        setFields(error.fields);
      } else {
        setFailure('Something went wrong. Please try again.');
      }
      setBusy(false);
    }
  }

  return <AuthLayout
    eyebrow="Create your account"
    title="Start your skill profile."
    description="One account gives you the competency assessment, your learning plan and your progress record."
    footer={<>Already registered? <Link href="/login" data-testid="link-goto-login" className="font-semibold text-primary hover:underline">Sign in instead</Link></>}
  >
    {existing && !created && <AlreadySignedIn user={existing} onContinue={() => setLocation('/dashboard')} />}
    {created && <SuccessBanner message={`Account created for ${created.email}. Setting up your workspace...`} />}
    {failure && !created && <ErrorBanner message={failure} />}

    <form onSubmit={submit} noValidate className="space-y-5">
      <label className="block" htmlFor={`${ids}-name`}>
        <span className="text-sm font-semibold">Full name</span>
        <input
          id={`${ids}-name`}
          data-testid="input-signup-name"
          type="text"
          name="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoComplete="name"
          required
          minLength={2}
          maxLength={80}
          disabled={busy || Boolean(created)}
          placeholder="Ananya Sharma"
          aria-invalid={Boolean(fields.name)}
          aria-describedby={`${ids}-name-note`}
          className={fieldClass(Boolean(fields.name))}
        />
        <FieldNote id={`${ids}-name-note`} error={fields.name} />
      </label>

      <label className="block" htmlFor={`${ids}-signup-email`}>
        <span className="text-sm font-semibold">Email address</span>
        <input
          id={`${ids}-signup-email`}
          data-testid="input-signup-email"
          type="email"
          name="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          autoCapitalize="none"
          spellCheck={false}
          required
          maxLength={254}
          disabled={busy || Boolean(created)}
          placeholder="you@mospi.gov.in"
          aria-invalid={Boolean(fields.email)}
          aria-describedby={`${ids}-signup-email-note`}
          className={fieldClass(Boolean(fields.email))}
        />
        <FieldNote id={`${ids}-signup-email-note`} error={fields.email} hint="Use your official work address where possible." />
      </label>

      <label className="block" htmlFor={`${ids}-signup-password`}>
        <span className="flex items-baseline justify-between gap-3">
          <span className="text-sm font-semibold">Password</span>
          <span data-testid="text-password-strength" className="font-mono text-[10px] uppercase tracking-[.12em] text-muted-foreground">{strength.label}</span>
        </span>
        <span className="relative block">
          <input
            id={`${ids}-signup-password`}
            data-testid="input-signup-password"
            type={reveal ? 'text' : 'password'}
            name="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
            required
            minLength={PASSWORD_MIN}
            maxLength={200}
            disabled={busy || Boolean(created)}
            placeholder={`At least ${PASSWORD_MIN} characters`}
            aria-invalid={Boolean(fields.password)}
            aria-describedby={`${ids}-signup-password-note`}
            className={`${fieldClass(Boolean(fields.password))} pr-11`}
          />
          <RevealButton shown={reveal} onToggle={() => setReveal(!reveal)} />
        </span>
        <ProgressBar value={strength.score} color={strength.color} className="mt-2.5" />
        <FieldNote
          id={`${ids}-signup-password-note`}
          error={fields.password}
          hint={`A short phrase you will remember beats a scrambled word. Minimum ${PASSWORD_MIN} characters, and it cannot contain your name or email.`}
        />
      </label>

      <ActionButton type="submit" className="w-full" disabled={busy || Boolean(created)}>
        {busy ? <><LoaderCircle className="size-4 animate-spin" /> Creating account...</> : <>Create account <ArrowRight className="size-4" /></>}
      </ActionButton>
    </form>

    <p className="mt-5 border-t border-border pt-4 text-xs text-muted-foreground">
      Your password is hashed before it is stored — it is never saved or logged in readable form.
    </p>
  </AuthLayout>;
}
