import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { useFeedback } from '@/components/feedback/FeedbackProvider';
import {
  ProtectedOfficeFrame,
  resolveOfficeBasePath
} from '@/components/layout/ProtectedOfficeFrame';
import { GenealogyTree } from '../components/ops/GenealogyTree';
import {
  DataListCard,
  GatedActionsCard,
  MetricGrid,
  ModuleTableCard,
  QuickLinkGrid,
  ReportTableView
} from '@/components/ops/office-ui';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import type {
  AdminActivationCodeCenter,
  AdminEncashmentCenter,
  AdminMvpDashboardData,
  AdminOfficeData,
  DashboardSummary,
  GenealogyCenter,
  OperationalModule
} from '../types/auth';

const formatCurrency = (value: number): string =>
  `PHP ${value.toLocaleString('en-PH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;

const customAdminModuleIds = new Set([
  'dashboard',
  'activation-codes',
  'encashment-reports',
  'binary-placement-tree',
  'sponsor-tree'
]);

function getVisibleAdminMetrics(moduleId: string, metrics: AdminOfficeData['metrics']) {
  if (moduleId === 'dashboard') {
    return metrics;
  }

  if (moduleId === 'binary-placement-tree' || moduleId === 'sponsor-tree') {
    return metrics.filter((metric) => metric.label.toLowerCase().includes('direct referral'));
  }

  return [];
}

export function AdminDashboardPage() {
  const {
    approveEncashment,
    generateActivationCodes,
    getAdminActivationCodes,
    getAdminBinaryTree,
    getAdminEncashments,
    getAdminModule,
    getAdminMvpDashboard,
    getAdminOffice,
    getAdminSponsorTree,
    getAdminSummary
  } = useAuth();
  const { confirmAction, notify } = useFeedback();
  const { moduleId = 'dashboard' } = useParams();
  const location = useLocation();
  const officeBasePath = resolveOfficeBasePath(location.pathname);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [office, setOffice] = useState<AdminOfficeData | null>(null);
  const [mvpDashboard, setMvpDashboard] = useState<AdminMvpDashboardData | null>(null);
  const [activeModule, setActiveModule] = useState<OperationalModule | null>(null);
  const [activationCodes, setActivationCodes] = useState<AdminActivationCodeCenter | null>(null);
  const [encashments, setEncashments] = useState<AdminEncashmentCenter | null>(null);
  const [genealogyTree, setGenealogyTree] = useState<GenealogyCenter | null>(null);
  const [selectedTreeNodeId, setSelectedTreeNodeId] = useState<string | null>(null);
  const [treeRootUsername, setTreeRootUsername] = useState('YOR0001');
  const [codeBatchQuantity, setCodeBatchQuantity] = useState(5);
  const [codeBatchPackageTier, setCodeBatchPackageTier] = useState('Standard');
  const [codeBatchAssignedTo, setCodeBatchAssignedTo] = useState('YOR0001');
  const [error, setError] = useState<string | null>(null);
  const [reloadNonce, setReloadNonce] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function loadAdminModule() {
      try {
        setError(null);
        setActivationCodes(null);
        setEncashments(null);
        setGenealogyTree(null);
        setSelectedTreeNodeId(null);

        const [nextSummary, nextOffice, nextMvpDashboard, nextModule] = await Promise.all([
          getAdminSummary(),
          getAdminOffice(),
          getAdminMvpDashboard(),
          getAdminModule(moduleId)
        ]);

        if (cancelled) {
          return;
        }

        setSummary(nextSummary);
        setOffice(nextOffice);
        setMvpDashboard(nextMvpDashboard);
        setActiveModule(nextModule);

        if (moduleId === 'activation-codes') {
          const nextActivationCodes = await getAdminActivationCodes();
          if (!cancelled) {
            setActivationCodes(nextActivationCodes);
          }
        }

        if (moduleId === 'encashment-reports') {
          const nextEncashments = await getAdminEncashments();
          if (!cancelled) {
            setEncashments(nextEncashments);
          }
        }

        if (moduleId === 'binary-placement-tree' || moduleId === 'sponsor-tree') {
          const nextTree =
            moduleId === 'sponsor-tree'
              ? await getAdminSponsorTree(treeRootUsername)
              : await getAdminBinaryTree(treeRootUsername);

          if (!cancelled) {
            setGenealogyTree(nextTree);
            setSelectedTreeNodeId(nextTree.root.nodeId);
          }
        }
      } catch (cause) {
        if (!cancelled) {
          setError(cause instanceof Error ? cause.message : 'Unable to load admin dashboard');
        }
      }
    }

    void loadAdminModule();

    return () => {
      cancelled = true;
    };
  }, [
    getAdminActivationCodes,
    getAdminBinaryTree,
    getAdminEncashments,
    getAdminModule,
    getAdminMvpDashboard,
    getAdminOffice,
    getAdminSponsorTree,
    getAdminSummary,
    moduleId,
    reloadNonce,
    treeRootUsername
  ]);

  async function handleGenerateCodes() {
    const confirmed = await confirmAction({
      title: 'Generate activation code batch?',
      description: `Generate ${codeBatchQuantity} ${codeBatchPackageTier} code(s) for ${codeBatchAssignedTo} in the branch sandbox inventory.`,
      confirmLabel: 'Generate Batch',
      tone: 'warning'
    });

    if (!confirmed) {
      return;
    }

    try {
      const result = await generateActivationCodes({
        quantity: codeBatchQuantity,
        packageTier: codeBatchPackageTier,
        assignedTo: codeBatchAssignedTo
      });
      notify({
        title: result.moneyMode === 'sandbox' ? 'Code batch generated' : 'Code generation checked',
        description: result.detail ?? result.reason,
        tone: result.moneyMode === 'sandbox' ? 'success' : 'warning'
      });
      setReloadNonce((value) => value + 1);
    } catch (cause) {
      notify({
        title: 'Unable to generate codes',
        description: cause instanceof Error ? cause.message : 'Please try again.',
        tone: 'destructive'
      });
    }
  }

  async function handleApproveEncashment(encashmentId: string) {
    const confirmed = await confirmAction({
      title: 'Approve encashment queue item?',
      description: `Approve ${encashmentId} inside the branch sandbox queue so the member and admin views both move forward.`,
      confirmLabel: 'Approve',
      tone: 'warning'
    });

    if (!confirmed) {
      return;
    }

    try {
      const result = await approveEncashment(encashmentId);
      notify({
        title: result.moneyMode === 'sandbox' ? 'Encashment approved' : 'Encashment approval checked',
        description: result.detail ?? result.reason,
        tone: result.moneyMode === 'sandbox' ? 'success' : 'warning'
      });
      setReloadNonce((value) => value + 1);
    } catch (cause) {
      notify({
        title: 'Unable to approve encashment',
        description: cause instanceof Error ? cause.message : 'Please try again.',
        tone: 'destructive'
      });
    }
  }

  const selectedTreeNode =
    genealogyTree?.nodes.find((node) => node.nodeId === selectedTreeNodeId) ?? null;
  const quickLinks = useMemo(() => {
    const quickLinkMap: Record<string, { title: string; body: string }> = {
      'member-management': {
        title: 'Member Management',
        body: 'Open the clean masterlist-style account view used for sponsor, package, and status checks.'
      },
      'binary-placement-tree': {
        title: 'Binary Tree',
        body: 'Inspect placement and open slots using the same left and right slot rules members depend on.'
      },
      'sponsor-tree': {
        title: 'Sponsor Tree',
        body: 'Review direct sponsorship separately so referral and unilevel reporting stay clean.'
      },
      'activation-codes': {
        title: 'Activation Codes',
        body: 'Validate generation, release, and transfer readiness without enabling live writes.'
      },
      'encashment-reports': {
        title: 'Encashment Queue',
        body: 'Review the Tuesday encashment and Friday payout queue and move requests through the branch-local sandbox.'
      },
      'payment-verification': {
        title: 'Payment Verification',
        body: 'Check proof and payment-readiness without enabling live approval writes.'
      },
      'wallet-ledger': {
        title: 'Wallet Ledger',
        body: 'Inspect append-only finance traces, balance exposure, and audit-sensitive entries.'
      },
      'get-five-reports': {
        title: 'Get Yor Five',
        body: 'Monitor five-direct qualification using Yor terminology instead of the legacy Hi-Five label.'
      }
    };

    return (office?.modules ?? [])
      .filter((module) => quickLinkMap[module.id])
      .slice(0, 4)
      .map((module) => ({
        title: quickLinkMap[module.id].title,
        body: quickLinkMap[module.id].body,
        href: module.id === 'dashboard' ? officeBasePath : `${officeBasePath}/${module.id}`
      }));
  }, [office?.modules, officeBasePath]);
  const branchNotes = activeModule?.gatedActions.length ? activeModule.gatedActions : office?.gatedActions ?? [];
  const showModuleTable = Boolean(activeModule && !customAdminModuleIds.has(moduleId));
  const showSecurityRail = moduleId === 'dashboard' || moduleId === 'audit-status';
  const showDashboardActions = moduleId === 'dashboard' && (mvpDashboard?.moneyMode ?? 'playground') !== 'sandbox' && branchNotes.length > 0;
  const visibleMetrics = office ? getVisibleAdminMetrics(moduleId, office.metrics) : [];
  const summaryCard =
    moduleId === 'dashboard'
      ? {
          label: 'Visible Modules',
          value: office?.modules.length ?? 0,
          detail: `Role scope: ${office?.profile.accessScope ?? 'ops'}`
        }
      : undefined;

  if (error) {
    return (
      <section className="min-h-screen bg-[var(--background)] px-4 py-10 text-[var(--foreground)]">
        <div className="mx-auto max-w-3xl pt-16">
          <Card>
            <CardHeader>
              <CardDescription>Admin Access</CardDescription>
              <CardTitle>Unable to load admin dashboard</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-[var(--muted-foreground)]">{error}</CardContent>
          </Card>
        </div>
      </section>
    );
  }

  return (
    <ProtectedOfficeFrame
      currentModuleId={moduleId}
      moduleLabel={activeModule?.label ?? 'Operational Dashboard'}
      moduleDescription={
        activeModule?.description ??
        'Professional operations shell aligned to the Yor compensation plan and the current protected operating flow.'
      }
      sidebarHeading="Yor Control"
      sidebarSubheading={office?.profile.officeTitle ?? 'Operations office'}
      modules={office?.modules ?? []}
      headerBadge={office?.profile.officeTitle ?? 'Admin Office'}
      summaryCard={summaryCard}
      footerLinks={[
        { label: 'Open public site', href: '/' },
        { label: 'Open registration page', href: '/register' }
      ]}
    >
      <div className="space-y-4">
          {visibleMetrics.length ? <MetricGrid metrics={visibleMetrics} /> : null}
          {moduleId === 'dashboard' ? <QuickLinkGrid links={quickLinks} /> : null}

          {moduleId === 'dashboard' && office?.queues.length ? (
            <section className="grid gap-3 md:grid-cols-3">
              {office.queues.map((queue) => (
                <Card key={queue.label} className="border-[var(--border)] bg-[var(--card)]">
                  <CardHeader className="pb-3">
                    <CardDescription className="text-xs uppercase tracking-[0.18em]">Queue</CardDescription>
                    <CardTitle className="text-base">{queue.label}</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-[var(--muted-foreground)]">Items</span>
                      <Badge variant={queue.status === 'attention' ? 'warning' : 'outline'}>
                        {queue.count}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </section>
          ) : null}

          {showModuleTable && activeModule ? <ModuleTableCard module={activeModule} /> : null}

          {moduleId === 'activation-codes' && activationCodes ? (
            <section className="grid gap-4 xl:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
              <DataListCard
                title="Code Metrics"
                rows={[
                  { label: 'Total Codes', value: activationCodes.metrics.totalCodes },
                  { label: 'Available', value: activationCodes.metrics.availableCodes },
                  { label: 'Used', value: activationCodes.metrics.usedCodes }
                ]}
              />
              <Card className="border-[var(--border)] bg-[var(--card)]">
                <CardHeader>
                  <CardTitle>Generation Control</CardTitle>
                  <CardDescription>
                    {activationCodes.moneyMode === 'sandbox'
                      ? 'Generate sponsor-owned inventory directly into the branch sandbox so registration can keep moving.'
                      : 'Batch generation stays easy to review while final inventory writes remain in protected playground mode.'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-3 sm:grid-cols-3">
                    <label className="grid gap-2 text-sm">
                      <span className="font-medium text-[var(--muted-foreground)]">Quantity</span>
                      <Input
                        type="number"
                        value={codeBatchQuantity}
                        onChange={(event) => setCodeBatchQuantity(Number(event.target.value))}
                      />
                    </label>
                    <label className="grid gap-2 text-sm">
                      <span className="font-medium text-[var(--muted-foreground)]">Package</span>
                      <select
                        className="flex h-10 w-full rounded-md border border-[var(--input)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
                        value={codeBatchPackageTier}
                        onChange={(event) => setCodeBatchPackageTier(event.target.value)}
                      >
                        <option value="Classic">Classic</option>
                        <option value="Basic">Basic</option>
                        <option value="Standard">Standard</option>
                        <option value="Business">Business</option>
                        <option value="VIP">VIP</option>
                      </select>
                    </label>
                    <label className="grid gap-2 text-sm">
                      <span className="font-medium text-[var(--muted-foreground)]">Assign To</span>
                      <Input
                        value={codeBatchAssignedTo}
                        onChange={(event) => setCodeBatchAssignedTo(event.target.value.toUpperCase())}
                      />
                    </label>
                  </div>
                  <Button type="button" onClick={handleGenerateCodes}>
                    Generate Batch
                  </Button>
                  <div className="space-y-3 rounded-xl border border-[var(--border)] bg-[var(--background)] p-4">
                    <p className="text-sm font-medium text-[var(--foreground)]">Audit Trail</p>
                    {activationCodes.auditTrail.map((event) => (
                      <div key={`${event.occurredAt}-${event.action}`} className="flex items-start justify-between gap-4 text-sm">
                        <span className="text-[var(--foreground)]">{event.action}</span>
                        <span className="text-right text-[var(--muted-foreground)]">{event.actor}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
              <Card className="border-[var(--border)] bg-[var(--card)] xl:col-span-2">
                <CardHeader>
                  <CardTitle>Activation Code Inventory</CardTitle>
                  <CardDescription>Shows who owns a code, which ones are released, and which paths are ready for the next registration or transfer step.</CardDescription>
                </CardHeader>
                <CardContent>
                  <ReportTableView
                    table={{
                      title: 'Admin Activation Codes',
                      columns: [
                        { key: 'code', label: 'Code' },
                        { key: 'packageTier', label: 'Package' },
                        { key: 'assignedTo', label: 'Assigned To' },
                        { key: 'status', label: 'Status' },
                        { key: 'generatedAt', label: 'Generated' }
                      ],
                      rows: activationCodes.inventory.map((item) => ({
                        code: item.code,
                        packageTier: item.packageTier,
                        assignedTo: item.assignedTo,
                        status: item.status,
                        generatedAt: item.generatedAt
                      }))
                    }}
                  />
                </CardContent>
              </Card>
            </section>
          ) : null}

          {moduleId === 'encashment-reports' && encashments ? (
            <section className="grid gap-4 xl:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
              <DataListCard
                title="Queue Totals"
                rows={[
                  { label: 'Gross', value: formatCurrency(encashments.totals.gross) },
                  { label: 'Net', value: formatCurrency(encashments.totals.net) },
                  { label: 'Awaiting Review', value: encashments.totals.awaitingReview }
                ]}
              />
              <Card className="border-[var(--border)] bg-[var(--card)]">
                <CardHeader>
                  <CardTitle>Process Notes</CardTitle>
                  <CardDescription>
                    {encashments.moneyMode === 'sandbox'
                      ? 'Money movement now writes into the local branch queue and can be approved end to end.'
                      : 'Money movement is visible and testable in protected playground mode while policy evidence remains under review.'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2 text-sm leading-6 text-[var(--muted-foreground)]">
                  {encashments.processNotes.map((note) => (
                    <p key={note}>{note}</p>
                  ))}
                </CardContent>
              </Card>
              <Card className="border-[var(--border)] bg-[var(--card)] xl:col-span-2">
                <CardHeader>
                  <CardTitle>Encashment Queue</CardTitle>
                  <CardDescription>Operational payout queue with a real approve path and branch-only sandbox persistence.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {encashments.encashments.map((item) => (
                    <div key={item.id} className="rounded-xl border border-[var(--border)] p-4">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="font-medium text-[var(--foreground)]">{item.member}</p>
                          <p className="text-sm text-[var(--muted-foreground)]">
                            {item.id} / {item.method}
                          </p>
                        </div>
                        <div className="text-sm text-[var(--muted-foreground)]">
                          Gross {item.gross} / Net {item.net}
                        </div>
                        <Button type="button" variant="outline" onClick={() => handleApproveEncashment(item.id)}>
                          Approve
                        </Button>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </section>
          ) : null}

          {(moduleId === 'binary-placement-tree' || moduleId === 'sponsor-tree') && genealogyTree ? (
            <section className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
              <Card className="border-[var(--border)] bg-[var(--card)] xl:col-span-2">
                <CardHeader className="gap-4 md:flex-row md:items-end md:justify-between">
                  <div>
                    <CardTitle>{moduleId === 'sponsor-tree' ? 'Sponsor Network View' : 'Placement Network View'}</CardTitle>
                    <CardDescription>
                      Search a root account and inspect the tree without collapsing sponsor and binary logic into the same payload.
                    </CardDescription>
                  </div>
                  <div className="w-full max-w-md space-y-2">
                    <Input
                      value={treeRootUsername}
                      onChange={(event) => setTreeRootUsername(event.target.value.toUpperCase())}
                      placeholder="Enter username or referral code"
                    />
                    <p className="text-xs text-[var(--muted-foreground)]">
                      Tree refreshes when the root code changes.
                    </p>
                  </div>
                </CardHeader>
                <CardContent>
                  <GenealogyTree
                    root={genealogyTree.root}
                    selectedNodeId={selectedTreeNodeId}
                    onSelect={setSelectedTreeNodeId}
                  />
                </CardContent>
              </Card>
              {selectedTreeNode ? (
                <Card className="border-[var(--border)] bg-[var(--card)]">
                  <CardHeader>
                    <CardTitle>Node Focus</CardTitle>
                    <CardDescription>Searchable admin node detail with package, state, and point context.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <DataPoint label="Username" value={selectedTreeNode.username} />
                    <DataPoint label="Package" value={selectedTreeNode.packageTier} />
                    <DataPoint label="Placement" value={selectedTreeNode.placement} />
                    <DataPoint label="Account State" value={selectedTreeNode.accountStateLabel} />
                    <DataPoint label="Direct Referrals" value={selectedTreeNode.directReferrals} />
                  </CardContent>
                </Card>
              ) : null}
            </section>
          ) : null}

          {showSecurityRail || showDashboardActions ? (
            <section className="grid gap-4 xl:grid-cols-2">
              {showDashboardActions ? <GatedActionsCard actions={branchNotes} /> : null}

              {showSecurityRail ? (
                <Card className="border-[var(--border)] bg-[var(--card)]">
                  <CardHeader>
                    <CardTitle>Security Status</CardTitle>
                    <CardDescription>Protected access posture and audit mindset for the current office role.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {summary
                      ? Object.entries(summary.status).map(([key, value]) => (
                          <div key={key} className="flex items-start justify-between gap-3 text-sm">
                            <span className="text-[var(--muted-foreground)]">{key}</span>
                            <strong className="text-right text-[var(--foreground)]">{value}</strong>
                          </div>
                        ))
                      : null}
                    {office?.auditEvents.length ? (
                      <div className="rounded-xl border border-[var(--border)] bg-[var(--background)] p-4">
                        <p className="mb-2 text-sm font-medium text-[var(--foreground)]">Recent audit events</p>
                        <div className="space-y-2 text-sm text-[var(--muted-foreground)]">
                          {office.auditEvents.slice(0, 4).map((event) => (
                            <p key={`${event.occurredAt}-${event.action}`}>
                              {event.action} / {event.actor}
                            </p>
                          ))}
                        </div>
                      </div>
                    ) : null}
                  </CardContent>
                </Card>
              ) : null}
            </section>
          ) : null}
      </div>
    </ProtectedOfficeFrame>
  );
}

function DataPoint({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--background)] p-3">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted-foreground)]">{label}</p>
      <p className="mt-2 text-sm font-medium text-[var(--foreground)]">{value}</p>
    </div>
  );
}
