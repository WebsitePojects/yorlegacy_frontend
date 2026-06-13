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
    return [];
  }

  if (role === 'cashier') {
    return [];
  }

  if (role === 'bod') {
    return [
      { href: '/bod', label: 'Board' },
      { href: '/member', label: 'Member View' },
      { href: '/', label: 'Public Site' }
    ];
  }

  return [
    { href: '/admin', label: 'Admin' },
    { href: '/bod', label: 'Board' },
    { href: '/member', label: 'Member View' },
    { href: '/', label: 'Public Site' }
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
  const [scrollElevated, setScrollElevated] = useState(false);
  const [prefetchedModules, setPrefetchedModules] = useState<Set<string>>(() => new Set());
  const stageRef = useRef<HTMLElement | null>(null);

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
      {isContentLoading ? (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-[var(--background)]/80 backdrop-blur-sm">
          <div className="ops-content-loader-body">
            <Badge variant="outline">Loading</Badge>
            <div className="ops-content-loader-copy">
              <h2>{loadingLabel}</h2>
              <p>The content area is refreshing with the latest workspace data.</p>
            </div>
            <div className="ops-content-loader-pulse" aria-hidden="true">
              <span />
              <span />
              <span />
            </div>
          </div>
        </div>
      ) : null}
      <header className={cn('ops-shell-header', scrollElevated ? 'is-scrolled' : '')}>
        <div className="ops-shell-header-main flex min-w-0 items-center gap-3">
          <Link to={basePath} className="protected-brand-link">
            <YorBrandMark className="protected-brand-mark" />
          </Link>
          <div className="min-w-0 overflow-hidden">
            <div className="flex items-center gap-2 overflow-hidden">
              <p className="protected-office-title truncate text-sm font-semibold text-[var(--foreground)]">Yor International</p>
              <Badge variant="outline" className="ops-header-office-badge shrink-0">{officeLabel}</Badge>
            </div>
            <div className="office-breadcrumb protected-office-breadcrumb mt-0.5 flex items-center gap-1 text-xs text-[var(--muted-foreground)] overflow-hidden">
              <span className="truncate">{sidebarHeading}</span>
              <ChevronRight className="size-3 shrink-0" />
              <span className="truncate">{moduleLabel}</span>
            </div>
          </div>
        </div>

        <div className="ops-shell-header-actions flex items-center justify-end gap-2">
          {workspaceLinks.length ? (
            <nav className="hidden items-center gap-1 lg:flex">
              {workspaceLinks.map((link) => (
                <Button
                  key={link.href}
                  asChild
                  variant={location.pathname.startsWith(link.href) && link.href !== '/' ? 'secondary' : 'ghost'}
                  size="sm"
                  className="h-8 rounded-lg text-xs"
                >
                  <NavLink to={link.href}>{link.label}</NavLink>
                </Button>
              ))}
            </nav>
          ) : null}

          <div className="ops-shell-header-tools flex items-center gap-2">
            <MobileOfficeNav
              basePath={basePath}
              currentModuleId={currentModuleId}
              heading={sidebarHeading}
              subheading={sidebarSubheading}
              modules={modules}
              footerLinks={footerLinks}
              onSignOut={() => void handleSignOut()}
              onPrefetchModule={handlePrefetchModule}
            />
            <div className="ops-shell-theme-toggle hidden md:block">
              <ModeToggle />
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  aria-label="Open user menu"
                  variant="outline"
                  className="ops-shell-profile-trigger h-10 gap-3 rounded-full px-3"
                >
                  <span className="flex size-8 items-center justify-center rounded-full bg-[var(--background)] text-[var(--yor-copper-soft)]">
                    <UserCircle2 className="size-5" />
                  </span>
                  <span className="protected-office-user-copy hidden text-left sm:block">
                    <span className="block text-sm font-medium leading-5">{user?.name ?? 'Protected User'}</span>
                    <span className="block text-xs text-[var(--muted-foreground)]">{user?.email ?? 'Signed in'}</span>
                  </span>
                </Button>
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
          expanded={true}
          onSignOut={() => void handleSignOut()}
          onPrefetchModule={handlePrefetchModule}
        />

        <main ref={stageRef} className="ops-content-stage" onScroll={(event) => {
          const target = event.currentTarget;
          setScrollElevated(target.scrollTop > 8);
        }}>
          <section className="ops-stage-hero">
            <div className="ops-stage-hero-header gap-4 md:flex-row md:items-start md:justify-between">
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline">{headerBadge}</Badge>
                </div>
                <div className="space-y-1">
                  <h1 className="ops-stage-title text-2xl">{moduleLabel}</h1>
                  <p className="ops-stage-description max-w-3xl leading-6 text-[var(--muted-foreground)]">{moduleDescription}</p>
                </div>
              </div>
              {summaryCard ? (
                <div className="ops-stage-summary-card min-w-56 rounded-xl border border-[var(--border)] bg-[var(--background)] p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted-foreground)]">
                    {summaryCard.label}
                  </p>
                  <p className="mt-2 text-xl font-semibold text-[var(--foreground)]">{summaryCard.value}</p>
                  {summaryCard.detail ? (
                    <p className="mt-1 text-sm text-[var(--muted-foreground)]">{summaryCard.detail}</p>
                  ) : null}
                </div>
              ) : null}
            </div>
          </section>

          <div className="ops-content-shell" aria-busy={isContentLoading}>
            <div className="ops-content-shell-stage">{children}</div>
          </div>
        </main>
      </div>
    </section>
  );
}
