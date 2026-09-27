import { Link } from 'wouter';
import { Compass, ArrowLeft } from 'lucide-react';
import { Card } from '@/components/ui';

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] w-full items-center justify-center p-6">
      <Card className="w-full max-w-md p-8 text-center">
        <div className="mx-auto flex size-12 items-center justify-center rounded-xl bg-secondary text-primary">
          <Compass className="size-6" />
        </div>
        <h1 className="mt-5 font-serif text-2xl leading-tight text-foreground">
          404 Page Not Found
        </h1>
        <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
          We couldn&rsquo;t find the page you were looking for. It may have moved,
          or the link may be out of date.
        </p>
        <Link
          href="/dashboard"
          data-testid="link-notfound-home"
          className="mt-6 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
        >
          <ArrowLeft className="size-4" /> Back to dashboard
        </Link>
      </Card>
    </div>
  );
}
