import { useEffect, useRef, useState, type PropsWithChildren } from 'react';
import {
  ChevronRight,
  LayoutDashboard,
  LogOut,
  UserCircle2
} from 'lucide-react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/auth/AuthContext';
import { useFeedback } from '@/components/feedback/FeedbackProvider';
import { ModeToggle } from '@/components/mode-toggle';
import { MobileOfficeNav, OfficeSidebar } from '@/components/ops/office-ui';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { YorBrandMark } from '@/components/branding/YorBrandMark';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import type { AppRole, OperationalModule } from '@/types/auth';

export type OfficeBasePath = '/member' | '/admin' | '/cashier' | '/bod';

type ProtectedOfficeFrameProps = PropsWithChildren<{
  currentModuleId: string;
  moduleLabel: string;
  moduleDescription: string;
  sidebarHeading: string;
  sidebarSubheading: string;
  modules: OperationalModule[];
  headerBadge: string;
  isContentLoading?: boolean;
  loadingLabel?: string;
  onPrefetchModule?: (moduleId: string) => void;
  summaryCard?: {
    label: string;
    value: string | number;
    detail?: string;
  };
  footerLinks?: Array<{ label: string; href: string; external?: boolean }>;
}>;

type WorkspaceLink = {
  href: OfficeBasePath | '/';
  label: string;
};

export function resolveOfficeBasePath(pathname: string): OfficeBasePath {
  if (pathname.startsWith('/cashier')) {
    return '/cashier';
  }

  if (pathname.startsWith('/bod')) {
    return '/bod';
  }

  if (pathname.startsWith('/admin')) {
    return '/admin';
  }

  return '/member';
}

function officeLabelForBasePath(basePath: OfficeBasePath): string {
  switch (basePath) {
    case '/cashier':
      return 'Cashier Office';
    case '/bod':
      return 'Board Office';
    case '/admin':
      return 'Admin Office';
    default:
      return 'Member Office';
  }
}

function workspaceLinksForRole(role: AppRole | undefined): WorkspaceLink[] {
  if (role === 'member') {
    return [
      { href: '/member', label: 'Member' }
    ];
  }

  if (role === 'cashier') {
    return [
      { href: '/cashier', label: 'Cashier' },
      { href: '/member', label: 'Member View' }
    ];
  }

  if (role === 'bod') {
    return [
      { href: '/bod', label: 'Board' },
      { href: '/member', label: 'Member View' }
    ];
  }

  return [
    { href: '/admin', label: 'Admin' },
    { href: '/cashier', label: 'Cashier' },
    { href: '/bod', label: 'Board' },
    { href: '/member', label: 'Member View' }
  ];
}

export function ProtectedOfficeFrame({
  currentModuleId,
  moduleLabel,
  moduleDescription,
  sidebarHeading,
  sidebarSubheading,
  modules,
  headerBadge,
  isContentLoading = false,
  loadingLabel = 'Loading office module',
  onPrefetchModule,
  summaryCard,
  footerLinks = [],
  children
}: ProtectedOfficeFrameProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const { confirmAction, notify } = useFeedback();
  const basePath = resolveOfficeBasePath(location.pathname);
  const officeLabel = officeLabelForBasePath(basePath);
  const workspaceLinks = workspaceLinksForRole(user?.role);
  const profilePath = '/member/account-details';
  const shellStorageKey = `yor-office-shell:${basePath}:${user?.role ?? 'guest'}`;
  const [sidebarExpanded, setSidebarExpanded] = useState(() => {
    if (typeof window === 'undefined') {
      return true;
    }

    const stored = window.localStorage.getItem(shellStorageKey);
    return stored ? stored === 'open' : true;
  });
  const [scrollElevated, setScrollElevated] = useState(false);
  const [prefetchedModules, setPrefetchedModules] = useState<Set<string>>(() => new Set());
  const stageRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const stored = window.localStorage.getItem(shellStorageKey);
    setSidebarExpanded(stored ? stored === 'open' : false);
  }, [shellStorageKey]);

  useEffect(() => {
    window.localStorage.setItem(shellStorageKey, sidebarExpanded ? 'open' : 'closed');
  }, [shellStorageKey, sidebarExpanded]);

  useEffect(() => {
    setScrollElevated(false);
    requestAnimationFrame(() => {
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
      if (typeof stageRef.current?.scrollTo === 'function') {
        stageRef.current.scrollTo({ top: 0, left: 0, behavior: 'auto' });
      }
    });
  }, [location.pathname]);

  useEffect(() => {
    setPrefetchedModules((current) => {
      if (!current.has(currentModuleId)) {
        return current;
      }

      const next = new Set(current);
      next.delete(currentModuleId);
      return next;
    });
  }, [currentModuleId]);

  function handlePrefetchModule(moduleId: string) {
    if (!onPrefetchModule || moduleId === currentModuleId || prefetchedModules.has(moduleId)) {
      return;
    }

    setPrefetchedModules((current) => {
      const next = new Set(current);
      next.add(moduleId);
      return next;
    });

    onPrefetchModule(moduleId);
  }

  async function handleSignOut() {
    const confirmed = await confirmAction({
      title: 'Log out of Yor Office?',
      description: 'Your protected office session will close and you will return to the sign-in screen.',
      confirmLabel: 'Log Out',
      tone: 'warning'
    });

    if (!confirmed) {
      return;
    }

    await logout();
    notify({
      title: 'Signed out',
      description: 'Your protected office session has ended.',
      tone: 'success'
    });
    navigate('/login', { replace: true });
  }

  return (
    <section className="ops-shell bg-[var(--background)] text-[var(--foreground)]">
      <header className={cn('ops-shell-header', scrollElevated ? 'is-scrolled' : '')}>
        <div className="ops-shell-header-main flex min-w-0 items-center gap-3">
          <Link to={basePath} className="protected-brand-link" aria-label="Office home">
            <YorBrandMark className="protected-brand-mark" />
          </Link>
          <div className="min-w-0 hidden sm:block">
            <nav className="office-breadcrumb" aria-label="Breadcrumb">
              <span className="office-breadcrumb-parent">{sidebarHeading}</span>
              <span className="office-breadcrumb-sep" aria-hidden="true">›</span>
              <span className="office-breadcrumb-current">{moduleLabel}</span>
            </nav>
          </div>
        </div>

        <nav className="office-workspace-tabs hidden lg:flex" aria-label="Switch office view">
          {workspaceLinks.map((link) => {
            const isActive = location.pathname.startsWith(link.href) && link.href !== '/';
            return (
              <NavLink
                key={link.href}
                to={link.href}
                className={`office-workspace-tab${isActive ? ' is-active' : ''}`}
                viewTransition
              >
                {isActive && <span className="office-workspace-tab-pill" aria-hidden="true" />}
                <span className="office-workspace-tab-label">{link.label}</span>
              </NavLink>
            );
          })}
        </nav>

        <div className="ops-shell-header-actions flex items-center gap-2">
          <div className="ops-shell-theme-toggle">
            <ModeToggle />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                aria-label="Open user menu"
                type="button"
                className="ops-shell-profile-trigger"
              >
                <span className="flex size-7 items-center justify-center rounded-full bg-[var(--office-active-bg)] text-[var(--color-primary)]">
                  <UserCircle2 className="size-4" />
                </span>
                <span className="protected-office-user-copy hidden text-left sm:block">
                  <span className="block text-sm font-semibold leading-5" style={{ color: 'var(--office-text)', fontSize: 'var(--text-sm)' }}>{user?.name ?? 'Protected User'}</span>
                  <span className="block" style={{ color: 'var(--office-muted)', fontSize: 'var(--text-xs)' }}>{user?.email ?? 'Signed in'}</span>
                </span>
              </button>
            </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="z-[120] w-64">
                <DropdownMenuLabel className="space-y-1">
                  <p className="text-sm font-semibold">{user?.name ?? 'Protected User'}</p>
                  <p className="text-xs font-normal text-[var(--muted-foreground)]">{user?.email ?? 'No email available'}</p>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <div className="px-2 py-1.5">
                  <Badge variant="outline">{user?.role ?? 'member'}</Badge>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to={profilePath}>
                    <UserCircle2 className="size-4" />
                    Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to={basePath}>
                    <LayoutDashboard className="size-4" />
                    Office Home
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => void handleSignOut()}>
                  <LogOut className="size-4" />
                  Log Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
      </header>

      <div className="ops-shell-body">
        <OfficeSidebar
          basePath={basePath}
          currentModuleId={currentModuleId}
          heading={sidebarHeading}
          subheading={sidebarSubheading}
          modules={modules}
          footerLinks={footerLinks}
          expanded={sidebarExpanded}
          onSignOut={() => void handleSignOut()}
          onPrefetchModule={handlePrefetchModule}
          onExpandedChange={setSidebarExpanded}
        />

        <main ref={stageRef} className="ops-content-stage" onScroll={(event) => {
          const target = event.currentTarget;
          setScrollElevated(target.scrollTop > 8);
        }}>
          <section className="ops-stage-hero">
            <div className="ops-stage-hero-header gap-4 md:flex-row md:items-start md:justify-between">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <span className="badge" style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  width: 'fit-content',
                  padding: '2px 10px',
                  borderRadius: '999px',
                  background: 'var(--office-primary-tint)',
                  border: '1px solid var(--office-border-mid)',
                  color: 'var(--color-primary)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: 'var(--text-xs)',
                  fontWeight: 600,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                }}>{headerBadge}</span>
                <h1 className="ops-stage-title">{moduleLabel}</h1>
                <p className="ops-stage-description">{moduleDescription}</p>
              </div>
              {summaryCard ? (
                <div className="ops-stage-summary-card">
                  <p style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--office-muted)', fontWeight: 600 }}>
                    {summaryCard.label}
                  </p>
                  <p style={{ fontFamily: 'var(--font-headline)', fontSize: '20px', fontWeight: 700, color: 'var(--office-text)', marginTop: '6px' }}>{summaryCard.value}</p>
                  {summaryCard.detail ? (
                    <p style={{ fontSize: 'var(--text-xs)', color: 'var(--office-muted)', marginTop: '3px' }}>{summaryCard.detail}</p>
                  ) : null}
                </div>
              ) : null}
            </div>
          </section>

          <div className={cn('ops-content-shell', isContentLoading && 'is-loading')} aria-busy={isContentLoading}>
            <div className="ops-content-shell-stage">{children}</div>
            {isContentLoading ? (
              <div className="ops-content-loader-card">
                <div className="ops-content-loader-body">
                  <Badge variant="outline">Loading</Badge>
                </div>
                <div className="ops-content-loader-copy">
                  <h2>{loadingLabel}</h2>
                  <p>The content area is refreshing with the latest protected-office data.</p>
                </div>
                <div className="ops-content-loader-pulse" aria-hidden="true">
                  <span />
                  <span />
                  <span />
                </div>
                <div className="ops-content-loader-brand">
                  <YorBrandMark className="ops-content-loader-logo" />
                  <span>YOR Office</span>
                </div>
              </div>
            ) : null}
          </div>
        </main>
      </div>

      {/* Fixed bottom nav — rendered outside scroll container so it truly sticks */}
      <MobileOfficeNav
        basePath={basePath}
        currentModuleId={currentModuleId}
        modules={modules}
        onPrefetchModule={handlePrefetchModule}
      />
    </section>
  );
}
