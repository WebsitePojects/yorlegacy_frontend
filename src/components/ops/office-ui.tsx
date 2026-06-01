import { useEffect, useMemo, useState, type ComponentType } from 'react';
import {
  Activity,
  ArrowLeftRight,
  ArrowRight,
  BadgeCheck,
  BadgeDollarSign,
  Banknote,
  BarChart3,
  ExternalLink,
  FileBadge,
  GitBranch,
  Globe2,
  Headphones,
  HelpCircle,
  KeyRound,
  LayoutDashboard,
  Medal,
  Menu,
  LogOut,
  PanelLeftClose,
  ReceiptText,
  RefreshCcw,
  Shield,
  ShieldAlert,
  ShoppingBag,
  Sparkles,
  Table2,
  UserCircle2,
  UserPlus,
  Users,
  WalletCards,
  X
} from 'lucide-react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import type {
  GatedAction,
  OperationalMetric,
  OperationalModule,
  ReportTable
} from '@/types/auth';

type OfficeSidebarProps = {
  basePath: '/member' | '/admin' | '/cashier' | '/bod';
  currentModuleId: string;
  heading: string;
  subheading: string;
  modules: OperationalModule[];
  footerLinks?: Array<{ label: string; href: string; external?: boolean }>;
  expanded: boolean;
  onSignOut?: () => void;
  onPrefetchModule?: (moduleId: string) => void;
  onExpandedChange: (nextExpanded: boolean) => void;
};

export function OfficeSidebar({
  basePath,
  currentModuleId,
  heading,
  subheading,
  modules,
  footerLinks = [],
  expanded,
  onSignOut,
  onExpandedChange,
  onPrefetchModule
}: OfficeSidebarProps) {
  const grouped = useMemo(() => groupModules(modules), [modules]);
  const sidebarWidth = expanded ? '300px' : '72px';
  const sidebarFlex = expanded ? '0 0 300px' : '0 0 72px';

  return (
    <aside
      className={cn('relative hidden h-full min-h-0 overflow-hidden lg:block', expanded ? 'ops-sidebar-expanded' : 'ops-sidebar-collapsed')}
      style={{ width: sidebarWidth, minWidth: sidebarWidth, flex: sidebarFlex }}
    >
      <div className={cn('ops-sidebar-shell', expanded ? 'is-expanded' : 'is-collapsed')}>
        {expanded ? (
          <div className="ops-sidebar-panel" aria-hidden={!expanded}>
            <div className="ops-sidebar-panel-header">
              <button
                aria-label="Collapse sidebar"
                aria-expanded={expanded}
                className="ops-sidebar-toggle"
                type="button"
                onClick={() => onExpandedChange(false)}
              >
                <PanelLeftClose className="size-4" />
              </button>
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--muted-foreground)]">
                  Yor Office
                </p>
                <h1 className="text-lg font-semibold text-[var(--foreground)]">{heading}</h1>
                <p className="text-sm leading-6 text-[var(--muted-foreground)]">{subheading}</p>
              </div>
            </div>

            <div className="space-y-3">
              {grouped.map(([group, groupModules]) => (
                <div key={group} className="space-y-2">
                  <p className="px-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--muted-foreground)]">
                    {group}
                  </p>
                  <div className="space-y-1">
                    {groupModules.map((module) => {
                      const active = module.id === currentModuleId;
                      return (
                        <NavLink
                          key={module.id}
                          to={module.id === 'dashboard' ? basePath : `${basePath}/${module.id}`}
                          className={cn(
                            'block rounded-xl border px-3 py-2.5 transition-colors',
                            active
                              ? 'border-[var(--ring)] bg-[var(--accent)]'
                              : 'border-transparent hover:border-[var(--border)] hover:bg-[var(--accent)]'
                          )}
                          onClick={() => onExpandedChange(true)}
                          onMouseEnter={() => onPrefetchModule?.(module.id)}
                          onFocus={() => onPrefetchModule?.(module.id)}
                        >
                          <div className="flex items-start gap-3">
                            <span className="ops-sidebar-item-icon mt-0.5">{renderIcon(getModuleIcon(module.id), 'size-4')}</span>
                            <span className="ops-sidebar-link-text flex-1 whitespace-normal break-words text-sm font-medium leading-5 text-[var(--foreground)]">
                              {module.label}
                            </span>
                          </div>
                        </NavLink>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
            {footerLinks.length ? (
              <>
                <Separator className="my-4" />
                <div className="space-y-2">
                  {footerLinks.map((link) => (
                    <Link
                      key={link.href}
                      to={link.href}
                      className="flex items-center justify-between rounded-lg px-2 py-2 text-sm text-[var(--muted-foreground)] hover:bg-[var(--accent)] hover:text-[var(--foreground)]"
                    >
                      <span className="whitespace-normal break-words">{link.label}</span>
                      {link.external ? <ExternalLink className="size-4" /> : <ArrowRight className="size-4" />}
                    </Link>
                  ))}
                </div>
              </>
            ) : null}
            {onSignOut ? (
              <>
                <Separator className="my-4" />
                <button
                  className="flex w-full items-center justify-between rounded-lg px-2 py-2 text-sm text-[var(--muted-foreground)] hover:bg-[var(--accent)] hover:text-[var(--foreground)]"
                  type="button"
                  onClick={onSignOut}
                >
                  <span>Log Out</span>
                  <LogOut className="size-4" />
                </button>
              </>
            ) : null}
          </div>
        ) : (
          <div className="ops-sidebar-rail">
            <button
              aria-label="Expand sidebar"
              className="ops-sidebar-toggle"
              aria-expanded={expanded}
              type="button"
              onClick={() => onExpandedChange(true)}
            >
              <Menu className="size-4" />
            </button>
            <div className="ops-sidebar-rail-stack">
              {grouped.map(([group, groupModules]) => (
                <button
                  key={group}
                  className={cn(
                    'ops-sidebar-rail-chip',
                    groupModules.some((module) => module.id === currentModuleId) ? 'is-active' : ''
                  )}
                  type="button"
                  title={group}
                  aria-label={group}
                  onClick={() => onExpandedChange(true)}
                >
                  {renderIcon(getGroupIcon(group), 'size-4')}
                </button>
              ))}
            </div>
            {onSignOut ? (
              <button
                className="ops-sidebar-rail-chip mt-auto"
                type="button"
                title="Log Out"
                aria-label="Log Out"
                onClick={onSignOut}
              >
                <LogOut className="size-4" />
              </button>
            ) : null}
          </div>
        )}
      </div>
    </aside>
  );
}

export function MobileOfficeNav({
  basePath,
  currentModuleId,
  modules,
  onPrefetchModule
}: {
  basePath: '/member' | '/admin' | '/cashier' | '/bod';
  currentModuleId: string;
  modules: OperationalModule[];
  onPrefetchModule?: (moduleId: string) => void;
}) {
  const [activeGroup, setActiveGroup] = useState<string | null>(null);
  const [closingGroup, setClosingGroup] = useState<string | null>(null);
  const location = useLocation();
  const grouped = useMemo(() => groupModules(modules), [modules]);
  const preferredGroups = ['Overview', 'Finance', 'Compensation', 'Network', 'Account'];
  const orderedGroups = [
    ...preferredGroups
      .map((groupName) => grouped.find(([group]) => group.toLowerCase() === groupName.toLowerCase()))
      .filter((group): group is [string, OperationalModule[]] => Boolean(group)),
    ...grouped.filter(
      ([group]) => !preferredGroups.some((groupName) => groupName.toLowerCase() === group.toLowerCase())
    )
  ].slice(0, 5);
  const compensationIndex = orderedGroups.findIndex(([group]) => group.toLowerCase() === 'compensation');
  const centerIndex = compensationIndex >= 0 ? compensationIndex : Math.min(2, orderedGroups.length - 1);
  const activeGroupEntry = orderedGroups.find(([group]) => group === activeGroup);

  useEffect(() => {
    if (!activeGroup) {
      return;
    }

    setClosingGroup(activeGroup);
    const timeout = window.setTimeout(() => {
      setActiveGroup(null);
      setClosingGroup(null);
    }, 210);

    return () => window.clearTimeout(timeout);
  }, [location.pathname]);

  function closeActiveGroup() {
    if (!activeGroup) {
      return;
    }

    setClosingGroup(activeGroup);
    window.setTimeout(() => {
      setActiveGroup(null);
      setClosingGroup(null);
    }, 210);
  }

  return (
    <nav className="ops-mobile-bottom-nav lg:hidden" aria-label={`${basePath.slice(1)} mobile office navigation`}>
      {activeGroupEntry ? (
        <div className={cn('ops-mobile-bottom-popover', closingGroup === activeGroupEntry[0] && 'is-closing')}>
          <div className="ops-mobile-bottom-popover-head">
            <span>{activeGroupEntry[0]}</span>
            <button type="button" onClick={closeActiveGroup} aria-label="Close office section">
              <X className="size-4" />
            </button>
          </div>
          <div className="ops-mobile-bottom-links">
            {activeGroupEntry[1].map((module) => (
              <NavLink
                key={module.id}
                to={module.id === 'dashboard' ? basePath : `${basePath}/${module.id}`}
                className={cn(currentModuleId === module.id && 'is-active')}
                onClick={closeActiveGroup}
                onMouseEnter={() => onPrefetchModule?.(module.id)}
                onFocus={() => onPrefetchModule?.(module.id)}
                onTouchStart={() => onPrefetchModule?.(module.id)}
              >
                <span className="ops-mobile-bottom-link-icon">{renderIcon(getModuleIcon(module.id), 'size-4')}</span>
                <span>{module.label}</span>
              </NavLink>
            ))}
          </div>
        </div>
      ) : null}
      <div className="ops-mobile-bottom-shell">
        {orderedGroups.map(([group, groupModules], index) => {
          const active = groupModules.some((module) => module.id === currentModuleId) || activeGroup === group;
          const Icon = getGroupIcon(group);
          const center = index === centerIndex;

          return (
            <button
              key={group}
              type="button"
              className={cn('ops-mobile-bottom-item', center && 'is-center', active && 'is-active')}
              aria-expanded={activeGroup === group}
              onClick={() => setActiveGroup((current) => (current === group ? null : group))}
            >
              <Icon className={center ? 'size-5' : 'size-4'} />
              <span>{group}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

export function MetricGrid({ metrics }: { metrics: OperationalMetric[] }) {
  return (
    <section className="ops-metric-grid grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {metrics.map((metric) => (
        <Card key={metric.label} className="ops-metric-card border-[var(--border)] bg-[var(--card)]">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs uppercase tracking-[0.18em]">{metric.label}</CardDescription>
            <CardTitle className="text-2xl">{metric.value}</CardTitle>
          </CardHeader>
          {metric.detail ? <CardContent className="pt-0 text-sm text-[var(--muted-foreground)]">{metric.detail}</CardContent> : null}
        </Card>
      ))}
    </section>
  );
}

export function QuickLinkGrid({
  links
}: {
  links: Array<{ title: string; body: string; href: string }>;
}) {
  return (
    <section className="ops-quicklink-grid grid gap-3 md:grid-cols-2 xl:grid-cols-4">
      {links.map((link) => (
        <Card key={link.href} className="ops-quicklink-card border-[var(--border)] bg-[var(--card)]">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{link.title}</CardTitle>
            <CardDescription className="leading-6">{link.body}</CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <Button asChild variant="outline" className="ops-inline-action w-full justify-between">
              <Link to={link.href}>
                Open
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      ))}
    </section>
  );
}

export function ModuleTableCard({
  module,
  heading = module.table.title,
  subtitle
}: {
  module: OperationalModule;
  heading?: string;
  subtitle?: string;
}) {
  return (
    <Card className="ops-module-table-card border-[var(--border)] bg-[var(--card)]">
      <CardHeader className="ops-module-table-header gap-3 md:flex-row md:items-start md:justify-between">
        <div className="space-y-1">
          <CardTitle>{heading}</CardTitle>
          <CardDescription>{subtitle ?? module.description}</CardDescription>
        </div>
        <div className="ops-module-table-metrics flex flex-wrap gap-2">
          {module.metrics.map((metric) => (
            <Badge key={metric.label} variant="outline">
              {metric.label}: {metric.value}
            </Badge>
          ))}
        </div>
      </CardHeader>
      <CardContent>
        <ReportTableView table={module.table} />
      </CardContent>
    </Card>
  );
}

export function ReportTableView({ table }: { table: ReportTable }) {
  return (
    <div className="ops-report-table-shell overflow-hidden rounded-xl border border-[var(--border)]">
      <div className="ops-report-table-scroll overflow-x-auto">
        <table className="ops-report-table min-w-full text-left text-sm">
          <thead className="bg-[var(--muted)]/55">
            <tr>
              {table.columns.map((column) => (
                <th
                  key={column.key}
                  className="whitespace-nowrap px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--muted-foreground)]"
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {table.rows.map((row, index) => (
              <tr key={`${table.title}-${index}`} className="border-t border-[var(--border)]">
                {table.columns.map((column) => (
                  <td
                    key={column.key}
                    data-label={column.label}
                    className="whitespace-pre-wrap px-4 py-3 align-top text-[var(--foreground)]"
                  >
                    {String(row[column.key] ?? '')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function DataListCard({
  title,
  description,
  rows
}: {
  title: string;
  description?: string;
  rows: Array<{ label: string; value: string | number }>;
}) {
  return (
    <Card className="ops-data-list-card border-[var(--border)] bg-[var(--card)]">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description ? <CardDescription>{description}</CardDescription> : null}
      </CardHeader>
      <CardContent className="ops-data-list-content space-y-3">
        {rows.map((row) => (
          <div
            key={row.label}
            className="ops-data-list-row flex items-start justify-between gap-4 border-b border-[var(--border)] pb-3 last:border-b-0 last:pb-0"
          >
            <span className="text-sm text-[var(--muted-foreground)]">{row.label}</span>
            <strong className="text-right text-sm text-[var(--foreground)]">{row.value}</strong>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export function GatedActionsCard({ actions }: { actions: GatedAction[] }) {
  return (
    <Card className="ops-gated-card border-amber-500/30 bg-amber-500/5">
      <CardHeader>
        <div className="flex items-center gap-2">
          <ShieldAlert className="size-4 text-amber-500" />
          <CardTitle>Sandbox Notes</CardTitle>
        </div>
        <CardDescription>These notes explain how the branch-local sandbox behaves so the team can test hard without mistaking it for production.</CardDescription>
      </CardHeader>
      <CardContent className="ops-gated-card-content space-y-3">
        {actions.map((action) => (
          <div key={action.label} className="ops-gated-item rounded-lg border border-amber-500/20 bg-[var(--card)] p-3">
            <p className="font-medium text-[var(--foreground)]">{action.label}</p>
            <p className="mt-1 text-sm leading-6 text-[var(--muted-foreground)]">{action.reason}</p>
            <p className="mt-2 text-xs uppercase tracking-[0.16em] text-amber-600 dark:text-amber-300">
              Required evidence: {action.requiredEvidence}
            </p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function groupModules(modules: OperationalModule[]) {
  const map = new Map<string, OperationalModule[]>();

  for (const module of modules) {
    const group = module.group || 'General';
    const groupModules = map.get(group) ?? [];
    groupModules.push(module);
    map.set(group, groupModules);
  }

  return Array.from(map.entries());
}

function renderIcon(Icon: ComponentType<{ className?: string }>, className = 'size-4') {
  return <Icon className={className} />;
}

function getGroupIcon(group: string) {
  switch (group.toLowerCase()) {
    case 'overview':
      return LayoutDashboard;
    case 'finance':
      return WalletCards;
    case 'account':
    case 'accounts':
      return UserCircle2;
    case 'network':
      return GitBranch;
    case 'compensation':
      return BadgeDollarSign;
    case 'codes':
      return KeyRound;
    case 'support':
      return Headphones;
    case 'security':
      return Shield;
    default:
      return HelpCircle;
  }
}

function getModuleIcon(moduleId: string) {
  const iconMap: Record<string, ComponentType<{ className?: string }>> = {
    dashboard: LayoutDashboard,
    wallet: WalletCards,
    'account-details': UserCircle2,
    transactions: ReceiptText,
    'direct-referrals': Users,
    genealogy: GitBranch,
    'salesmatch-bonus': ArrowLeftRight,
    'binary-cycle-bonus': RefreshCcw,
    'get-five-bonus': Medal,
    'activation-codes': KeyRound,
    support: Headphones,
    'upgrade-registration': UserPlus,
    'product-orders': ShoppingBag,
    'lifestyle-rewards': Sparkles,
    'unilevel-rank-progress': BarChart3,
    'global-bonus-eligibility': Globe2,
    'member-management': Users,
    'account-shadow-management': Shield,
    'account-genealogy': GitBranch,
    'payment-verification': BadgeCheck,
    'package-rule-matrix': Table2,
    'direct-referral-reports': BadgeDollarSign,
    'salesmatch-reports': ArrowLeftRight,
    'binary-cycle-reports': RefreshCcw,
    'lifestyle-rewards-reports': Sparkles,
    'unilevel-rank-reports': Medal,
    'global-bonus-pool': Globe2,
    'wallet-ledger': WalletCards,
    'system-health': Activity,
    'encashment-reports': Banknote,
    'finance-accounting': ReceiptText,
    'cd-accounts': BadgeCheck,
    'voucher-management': KeyRound,
    rankings: Medal,
    'global-bonus': Globe2,
    'get-five-package-claims': Sparkles,
    'audit-status': FileBadge
  };

  return iconMap[moduleId] ?? HelpCircle;
}
