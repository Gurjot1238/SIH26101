import { type ReactNode } from 'react';
import { ArrowUpRight, Check, ChevronRight, CircleAlert, LoaderCircle } from 'lucide-react';

export function Badge({ children, tone = 'neutral' }: { children: ReactNode; tone?: 'neutral' | 'teal' | 'amber' | 'coral' | 'navy' }) {
  const tones = {
    neutral: 'bg-secondary text-muted-foreground',
    teal: 'bg-[#e2f1ef] text-[#216b67]',
    amber: 'bg-[#fff2d8] text-[#8a6319]',
    coral: 'bg-[#f9e5e1] text-[#a34d43]',
    navy: 'bg-[#e1e9ef] text-[#29485a]',
  };
  return <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold tracking-[.02em] ${tones[tone]}`}>{children}</span>;
}

export function Card({ children, className = '', interactive = false }: { children: ReactNode; className?: string; interactive?: boolean }) {
  return <section className={`rounded-[14px] border border-border bg-card shadow-[0_3px_15px_hsl(214_30%_20%/.035)] ${interactive ? 'transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-[0_8px_22px_hsl(214_30%_20%/.08)]' : ''} ${className}`}>{children}</section>;
}

export function ProgressBar({ value, color = 'bg-primary', className = '' }: { value: number; color?: string; className?: string }) {
  return <div className={`h-2 overflow-hidden rounded-full bg-secondary ${className}`}><div className={`h-full rounded-full transition-all duration-500 ${color}`} style={{ width: `${Math.min(100, value)}%` }} /></div>;
}

export function SectionHeading({ eyebrow, title, description, action }: { eyebrow?: string; title: string; description?: string; action?: ReactNode }) {
  return <div className="mb-5 flex items-end justify-between gap-4">
    <div>
      {eyebrow && <p className="mb-1 font-mono text-[10px] font-medium uppercase tracking-[.16em] text-primary">{eyebrow}</p>}
      <h2 className="font-serif text-[23px] leading-tight text-foreground">{title}</h2>
      {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
    </div>
    {action}
  </div>;
}

export function ActionButton({ children, onClick, variant = 'primary', icon, className = '', type = 'button', disabled = false }: { children: ReactNode; onClick?: () => void; variant?: 'primary' | 'outline' | 'quiet' | 'amber'; icon?: ReactNode; className?: string; type?: 'button' | 'submit'; disabled?: boolean }) {
  const styles = {
    primary: 'bg-primary text-primary-foreground hover:bg-[#245b62]',
    outline: 'border border-border bg-card text-foreground hover:border-primary/50 hover:bg-secondary',
    quiet: 'text-primary hover:bg-secondary',
    amber: 'bg-accent text-accent-foreground hover:bg-[#e7b95d]',
  };
  return <button data-testid={`button-${typeof children === 'string' ? children.toLowerCase().replaceAll(' ', '-') : 'action'}`} type={type} onClick={onClick} disabled={disabled} className={`inline-flex items-center justify-center gap-2 rounded-lg px-3.5 py-2.5 text-sm font-semibold transition-all duration-200 active:scale-[.98] disabled:cursor-not-allowed disabled:opacity-60 ${styles[variant]} ${className}`}>{children}{icon}</button>;
}

export function EmptyState({ title, description, action }: { title: string; description: string; action?: ReactNode }) {
  return <div className="rounded-xl border border-dashed border-border bg-secondary/40 px-6 py-10 text-center">
    <CircleAlert className="mx-auto mb-3 size-5 text-primary/70" />
    <h3 className="font-semibold text-foreground">{title}</h3>
    <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>
    {action && <div className="mt-4">{action}</div>}
  </div>;
}

export function ToastMessage({ message, onClose }: { message: string; onClose: () => void }) {
  return <div className="fixed bottom-5 right-5 z-40 flex items-center gap-3 rounded-lg border border-[#b4d8d3] bg-[#edf8f5] px-4 py-3 text-sm font-medium text-[#216b67] shadow-lg animate-rise-in">
    <Check className="size-4" /> {message}
    <button data-testid="button-dismiss-toast" onClick={onClose} className="ml-2 text-xs underline">Dismiss</button>
  </div>;
}

export function LoadingBlock({ label = 'Preparing intelligence' }: { label?: string }) {
  return <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-6 text-sm text-muted-foreground"><LoaderCircle className="size-4 animate-spin text-primary" /> {label}</div>;
}

export function LinkAction({ href, children }: { href: string; children: ReactNode }) {
  return <a href={href} className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline">{children}<ArrowUpRight className="size-3.5" /></a>;
}

export function ChevronAction({ children, onClick }: { children: ReactNode; onClick: () => void }) {
  return <button data-testid="button-chevron-action" onClick={onClick} className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline">{children}<ChevronRight className="size-4" /></button>;
}