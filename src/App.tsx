import { type ReactNode, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import { AppShell } from '@/components/shell';
import { RequireAuth } from '@/components/require-auth';
import { SessionProvider } from '@/components/session-provider';
import { ProgressProvider } from '@/components/progress-provider';
import { Assessment, CourseDetail, CourseLibrary, Dashboard, Integrations, Intelligence, Learning, Materials, Presentation, Profile, Quiz, Roadmap } from '@/pages/demo-pages';
import { Login, Signup } from '@/pages/auth-pages';
import {
  Route,
  Switch,
  useLocation,
  Router as WouterRouter,
} from 'wouter';

const queryClient = new QueryClient();

/**
 * Sign in and create account render full-page, so they sit in their own Switch
 * ahead of the shell. Everything else falls through to <RequireAuth>, which
 * sends a signed-out visitor to /login and otherwise hands over to <AppShell>
 * with every existing page exactly as it was.
 *
 * Set VITE_REQUIRE_AUTH=false in .env.local to open the workspace without an
 * account, which is what the app did before the gate existed.
 *
 * Exported so the route table itself can be rendered and asserted on — see
 * scripts/render-test.mjs.
 */
export function Router() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/signup" component={Signup} />
      <Route><RequireAuth><ShellRoutes /></RequireAuth></Route>
    </Switch>
  );
}

function ShellRoutes() {
  const [role, setRole] = useState<'learner' | 'manager'>('learner');
  return (
    <AppShell role={role} onRoleChange={setRole}>
      <RoutedErrorBoundary>
        <Switch>
          <Route path="/" component={Dashboard} />
          <Route path="/dashboard" component={Dashboard} />
          <Route path="/assessment" component={Assessment} />
          <Route path="/learning" component={Learning} />
          <Route path="/course-library" component={CourseLibrary} />
          <Route path="/courses/:id" component={CourseDetail} />
          <Route path="/materials" component={Materials} />
          <Route path="/quiz" component={Quiz} />
          <Route path="/intelligence" component={Intelligence} />
          <Route path="/roadmap" component={Roadmap} />
          <Route path="/profile" component={Profile} />
          <Route path="/integrations" component={Integrations} />
          <Route path="/presentation" component={Presentation} />
          <Route component={NotFound} />
        </Switch>
      </RoutedErrorBoundary>
    </AppShell>
  );
}

function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <SessionProvider>
          <ProgressProvider>
            <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
              <Router />
            </WouterRouter>
          </ProgressProvider>
        </SessionProvider>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
