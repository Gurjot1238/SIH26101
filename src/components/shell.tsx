import { type ReactNode, useState } from 'react';
import { Bell, BookOpen, Building2, ChevronDown, ClipboardCheck, Compass, FileText, GraduationCap, LayoutDashboard, Library, Menu, Network, Presentation, Sparkles, UserRound, X } from 'lucide-react';
import { Link, useLocation } from 'wouter';
import { Badge } from './ui';
import { firstName, greeting, initials, useSession } from './session-provider';

type NavItem = { href: string; label: string; icon: typeof LayoutDashboard; count?: string };
const learnerNav: NavItem[] = [
  { href: '/dashboard', label: 'Overview', icon: LayoutDashboard },
  { href: '/assessment', label: 'Assessment', icon: ClipboardCheck, count: '2' },
  { href: '/learning', label: 'My learning', icon: BookOpen },
  { href: '/catalog', label: 'Course catalogue', icon: Library },
  { href: '/course-library', label: 'Course library', icon: GraduationCap },
  { href: '/materials', label: 'Materials lab', icon: FileText },
  { href: '/quiz', label: 'Knowledge check', icon: Sparkles },
  { href: '/roadmap', label: 'Career roadmap', icon: Compass },
];
const systemNav: NavItem[] = [
  { href: '/intelligence', label: 'Org intelligence', icon: Network },
  { href: '/integrations', label: 'Integrations', icon: Building2 },
];

export function AppShell({ children, role, onRoleChange }: { children: ReactNode; role: 'learner' | 'manager'; onRoleChange: (role: 'learner' | 'manager') => void }) {
  const [location, setLocation] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [noticeOpen, setNoticeOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  // Who is actually signed in. Null when the auth server is not running or the
  // gate is switched off, in which case every line below falls back to the
  // original demonstration text.
  const { user, signOut } = useSession();
  const [signingOut, setSigningOut] = useState(false);
  const nav = role === 'manager' ? [...learnerNav.slice(0, 1), ...systemNav, ...learnerNav.slice(1)] : learnerNav;
  const currentLabel = [...learnerNav, ...systemNav].find((item) => location.startsWith(item.href))?.label || 'Overview';
  return <div className="noise min-h-[100dvh] bg-background text-foreground">
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-[252px] flex-col bg-sidebar text-sidebar-foreground md:flex">
      <div className="border-b border-sidebar-border px-6 py-5">
        <Link href="/dashboard" data-testid="link-brand" className="flex items-center gap-3">
          <div className="relative flex size-9 items-center justify-center rounded-lg bg-accent text-sidebar"><span className="font-serif text-xl font-semibold">S</span><span className="absolute -right-1 -top-1 size-2 rounded-full bg-[#9ed5cc]" /></div>
          <div><p className="font-serif text-[21px] leading-none text-white">NEXORA AI</p><p className="mt-1 font-mono text-[8px] uppercase tracking-[.18em] text-sidebar-foreground/60">Intelligence platform</p></div>
        </Link>
      </div>
      <div className="flex-1 overflow-y-auto px-3 py-5">
        <p className="mb-2 px-3 font-mono text-[9px] uppercase tracking-[.18em] text-sidebar-foreground/45">Workspace</p>
        <nav className="space-y-1">
          {nav.map((item) => <Link key={item.href} href={item.href} data-testid={`link-nav-${item.label.toLowerCase().replaceAll(' ', '-')}`} onClick={() => setMobileOpen(false)} className={`group flex items-center justify-between rounded-lg px-3 py-2.5 text-sm transition-colors ${location.startsWith(item.href) ? 'bg-sidebar-accent text-white' : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/70 hover:text-white'}`}>
            <span className="flex items-center gap-3"><item.icon className={`size-[17px] ${location.startsWith(item.href) ? 'text-accent' : 'text-sidebar-foreground/55 group-hover:text-accent'}`} />{item.label}</span>
            {item.count && <span className="rounded-full bg-accent px-1.5 py-0.5 text-[10px] font-bold text-sidebar">{item.count}</span>}
          </Link>)}
        </nav>
        <p className="mb-2 mt-8 px-3 font-mono text-[9px] uppercase tracking-[.18em] text-sidebar-foreground/45">System</p>
        <nav className="space-y-1">
          <Link href="/profile" data-testid="link-nav-profile" className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm ${location.startsWith('/profile') ? 'bg-sidebar-accent text-white' : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/70 hover:text-white'}`}><UserRound className="size-[17px] text-sidebar-foreground/55" />Profile & preferences</Link>
          <Link href="/presentation" data-testid="link-nav-presentation" className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-sidebar-foreground/70 hover:bg-sidebar-accent/70 hover:text-white"><Presentation className="size-[17px] text-sidebar-foreground/55" />Presentation mode</Link>
        </nav>
      </div>
      <div className="border-t border-sidebar-border p-4">
        <Link href="/profile" data-testid="link-profile-card" className="flex items-center gap-3 rounded-lg bg-sidebar-accent/65 p-3 transition-colors hover:bg-sidebar-accent cursor-pointer">
          <div className="flex size-9 items-center justify-center rounded-full bg-[#b8ddd6] text-xs font-bold text-sidebar">{initials(user?.name)}</div>
          <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-white">{user?.name ?? 'Ananya Sharma'}</p><p className="truncate text-[11px] text-sidebar-foreground/55">{user?.email ?? 'Directorate of Economics'}</p></div>
          <button data-testid="button-profile-menu" onClick={(e) => { e.preventDefault(); e.stopPropagation(); setProfileOpen(!profileOpen); }} className="text-sidebar-foreground/60 hover:text-white"><ChevronDown className="size-4" /></button>
        </Link>
        {profileOpen && <div className="mt-2 rounded-lg border border-sidebar-border bg-sidebar-accent p-2 text-xs"><button data-testid="button-signout-demo" disabled={signingOut} onClick={async () => { if (signingOut) return; setSigningOut(true); setProfileOpen(false); await signOut(); setLocation('/login'); }} className="w-full rounded px-2 py-1.5 text-left text-sidebar-foreground/80 hover:bg-sidebar">{signingOut ? 'Signing out...' : user ? 'Sign out' : 'Sign out of demo'}</button></div>}
      </div>
    </aside>
    <div className="md:pl-[252px]">
      <header className="sticky top-0 z-20 border-b border-border bg-background/90 backdrop-blur-md">
        <div className="flex h-[68px] items-center justify-between px-4 sm:px-7 lg:px-10">
          <div className="flex items-center gap-3">
            <button data-testid="button-mobile-menu" onClick={() => setMobileOpen(!mobileOpen)} className="rounded-lg p-2 hover:bg-secondary md:hidden">{mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}</button>
            <div><p className="font-mono text-[10px] uppercase tracking-[.14em] text-muted-foreground">NEXORA AI / {currentLabel}</p><h1 className="mt-0.5 text-sm font-semibold text-foreground">{greeting()}, {firstName(user?.name)}</h1></div>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <button data-testid="button-role-switch" onClick={() => onRoleChange(role === 'learner' ? 'manager' : 'learner')} className="hidden items-center gap-2 rounded-full border border-border bg-card px-3 py-2 text-xs font-semibold text-foreground sm:flex"><span className="size-2 rounded-full bg-[#74b7ad]" />{role === 'learner' ? 'Learner view' : 'Manager view'}<ChevronDown className="size-3.5 text-muted-foreground" /></button>
            <button data-testid="button-notifications" onClick={() => setNoticeOpen(!noticeOpen)} className="relative rounded-lg p-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"><Bell className="size-[18px]" /><span className="absolute right-1.5 top-1.5 size-1.5 rounded-full bg-[#c86c5e]" /></button>
            <Link href="/presentation" data-testid="link-header-presentation" className="hidden items-center gap-2 rounded-lg bg-primary px-3.5 py-2.5 text-xs font-semibold text-primary-foreground shadow-sm transition-transform hover:-translate-y-0.5 sm:flex"><Presentation className="size-3.5" /> Present demo</Link>
          </div>
        </div>
        {noticeOpen && <div className="absolute right-5 top-[62px] w-[290px] rounded-xl border border-border bg-card p-4 shadow-xl animate-rise-in"><div className="flex items-center justify-between"><p className="font-semibold">Notifications</p><Badge tone="teal">3 new</Badge></div><div className="mt-3 space-y-3 text-xs"><p className="border-l-2 border-accent pl-3"><b>Assessment window open</b><br /><span className="text-muted-foreground">Your quarterly competency check is ready.</span></p><p className="border-l-2 border-primary pl-3"><b>New pathway suggestion</b><br /><span className="text-muted-foreground">Time Series Analysis was added to your plan.</span></p><p className="border-l-2 border-border pl-3"><b>iGOT sync complete</b><br /><span className="text-muted-foreground">Training history updated today.</span></p></div><button data-testid="button-mark-notifications" onClick={() => setNoticeOpen(false)} className="mt-3 text-xs font-semibold text-primary">Mark all as read</button></div>}
      </header>
      {mobileOpen && <div className="fixed inset-x-0 top-[68px] z-20 border-b border-border bg-sidebar p-3 md:hidden"><nav className="grid grid-cols-2 gap-1">{nav.map((item) => <Link key={item.href} href={item.href} data-testid={`link-mobile-${item.label.toLowerCase().replaceAll(' ', '-')}`} className="flex items-center gap-2 rounded-lg px-3 py-3 text-sm text-sidebar-foreground hover:bg-sidebar-accent"><item.icon className="size-4 text-accent" />{item.label}</Link>)}</nav></div>}
      <main className="civic-grid min-h-[calc(100dvh-68px)] px-4 py-7 sm:px-7 lg:px-10">{children}</main>
    </div>
  </div>;
}