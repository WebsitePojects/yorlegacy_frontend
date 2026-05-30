import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowRight, GitBranch, ShieldCheck } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { useFeedback } from '@/components/feedback/FeedbackProvider';
import { ProtectedOfficeFrame } from '@/components/layout/ProtectedOfficeFrame';
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
  DashboardSummary,
  GenealogyCenter,
  MemberActivationCodeCenter,
  MemberMvpDashboardData,
  MemberOfficeData,
  MemberTransactionDetail,
  MemberTransactionSummary,
  MemberWalletDetail,
  OperationalModule,
  RegistrationReadiness
} from '../types/auth';

const formatCurrency = (value: number): string =>
  `PHP ${value.toLocaleString('en-PH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;

const customMemberModuleIds = new Set([
  'dashboard',
  'wallet',
  'account-details',
  'transactions',
  'activation-codes',
  'upgrade-registration',
  'genealogy'
]);

const memberIncomeRouteMap: Record<string, { memberModuleId: string; publicHref: string }> = {
  'direct-selling': { memberModuleId: 'product-orders', publicHref: '/earn/direct-selling' },
  'direct-referral': { memberModuleId: 'direct-referrals', publicHref: '/earn/direct-referral' },
  salesmatch: { memberModuleId: 'salesmatch-bonus', publicHref: '/earn/salesmatch' },
  'binary-cycle': { memberModuleId: 'binary-cycle-bonus', publicHref: '/earn/binary-cycle' },
  'get-five': { memberModuleId: 'get-five-bonus', publicHref: '/earn/get-five' },
  'lifestyle-rewards': { memberModuleId: 'lifestyle-rewards', publicHref: '/earn/lifestyle-rewards' },
  unilevel: { memberModuleId: 'unilevel-rank-progress', publicHref: '/earn/unilevel' },
  global: { memberModuleId: 'global-bonus-eligibility', publicHref: '/earn/global' }
};

function getVisibleMemberMetrics(moduleId: string, metrics: MemberOfficeData['metrics']) {
  if (moduleId === 'dashboard') {
    return metrics;
  }

  if (moduleId === 'direct-referrals') {
    return metrics.filter((metric) => metric.label.toLowerCase().includes('direct referral'));
  }

  if (
    moduleId === 'genealogy' ||
    moduleId === 'salesmatch-bonus' ||
    moduleId === 'binary-cycle-bonus' ||
    moduleId === 'unilevel-rank-progress' ||
    moduleId === 'global-bonus-eligibility'
  ) {
    return metrics.filter((metric) => {
      const label = metric.label.toLowerCase();
      return label.includes('left points') || label.includes('right points');
    });
  }

  return [];
}

export function MemberDashboardPage() {
  const {
    getMemberActivationCodes,
    getMemberBinaryTree,
    getMemberModule,
    getMemberMvpDashboard,
    getMemberOffice,
    getMemberRegistrationReadiness,
    getMemberSummary,
    getMemberTransactionDetail,
    getMemberTransactions,
    getMemberWalletDetail,
    previewEncashment,
    submitEncashment,
    transferActivationCodes,
    upgradeActivationCode,
    useMaintenanceCode
  } = useAuth();
  const { confirmAction, notify } = useFeedback();
  const { moduleId = 'dashboard' } = useParams();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [office, setOffice] = useState<MemberOfficeData | null>(null);
  const [mvpDashboard, setMvpDashboard] = useState<MemberMvpDashboardData | null>(null);
  const [activeModule, setActiveModule] = useState<OperationalModule | null>(null);
  const [activationCodes, setActivationCodes] = useState<MemberActivationCodeCenter | null>(null);
  const [walletDetail, setWalletDetail] = useState<MemberWalletDetail | null>(null);
  const [transactions, setTransactions] = useState<MemberTransactionSummary[]>([]);
  const [transactionDetail, setTransactionDetail] = useState<MemberTransactionDetail | null>(null);
  const [registrationReadiness, setRegistrationReadiness] = useState<RegistrationReadiness | null>(null);
  const [binaryTree, setBinaryTree] = useState<GenealogyCenter | null>(null);
  const [selectedTreeNodeId, setSelectedTreeNodeId] = useState<string | null>(null);
  const [encashAmount, setEncashAmount] = useState(5000);
  const [selectedCode, setSelectedCode] = useState('');
  const [transferTarget, setTransferTarget] = useState('');
  const [maintenanceCode, setMaintenanceCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [reloadNonce, setReloadNonce] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function loadMemberModule() {
      try {
        setError(null);
        setActivationCodes(null);
        setWalletDetail(null);
        setTransactions([]);
        setTransactionDetail(null);
        setRegistrationReadiness(null);
        setBinaryTree(null);
        setSelectedTreeNodeId(null);

        const [nextSummary, nextOffice, nextMvpDashboard, nextModule] = await Promise.all([
          getMemberSummary(),
          getMemberOffice(),
          getMemberMvpDashboard(),
          getMemberModule(moduleId)
        ]);

        if (cancelled) {
          return;
        }

        setSummary(nextSummary);
        setOffice(nextOffice);
        setMvpDashboard(nextMvpDashboard);
        setActiveModule(nextModule);

        if (moduleId === 'wallet') {
          const nextWalletDetail = await getMemberWalletDetail();
          if (cancelled) {
            return;
          }
          setWalletDetail(nextWalletDetail);
          setEncashAmount(nextWalletDetail.preview.requestedAmount);
        }

        if (moduleId === 'activation-codes') {
          const nextActivationCodes = await getMemberActivationCodes();
          if (cancelled) {
            return;
          }
          setActivationCodes(nextActivationCodes);
          setSelectedCode(nextActivationCodes.inventory[0]?.code ?? '');
          setMaintenanceCode(nextActivationCodes.inventory[0]?.code ?? '');
          setTransferTarget(nextActivationCodes.transferTargets[0]?.username ?? '');
        }

        if (moduleId === 'transactions') {
          const nextTransactions = await getMemberTransactions();
          if (cancelled) {
            return;
          }
          setTransactions(nextTransactions.transactions);

          if (nextTransactions.transactions[0]) {
            const nextTransactionDetail = await getMemberTransactionDetail(nextTransactions.transactions[0].id);
            if (!cancelled) {
              setTransactionDetail(nextTransactionDetail);
            }
          }
        }

        if (moduleId === 'upgrade-registration') {
          const nextRegistrationReadiness = await getMemberRegistrationReadiness();
          if (cancelled) {
            return;
          }
          setRegistrationReadiness(nextRegistrationReadiness);
        }

        if (moduleId === 'genealogy') {
          const nextBinaryTree = await getMemberBinaryTree();
          if (cancelled) {
            return;
          }
          setBinaryTree(nextBinaryTree);
          setSelectedTreeNodeId(nextBinaryTree.root.nodeId);
        }
      } catch (cause) {
        if (!cancelled) {
          setError(cause instanceof Error ? cause.message : 'Unable to load member dashboard');
        }
      }
    }

    void loadMemberModule();

    return () => {
      cancelled = true;
    };
  }, [
    getMemberActivationCodes,
    getMemberBinaryTree,
    getMemberModule,
    getMemberMvpDashboard,
    getMemberOffice,
    getMemberRegistrationReadiness,
    getMemberSummary,
    getMemberTransactionDetail,
    getMemberTransactions,
    getMemberWalletDetail,
    moduleId,
    reloadNonce
  ]);

  async function handlePreviewEncashment() {
    try {
      const result = await previewEncashment(encashAmount);
      notify({
        title: 'Encashment preview ready',
        description: `Net receivable ${formatCurrency(result.preview.netReceivable)} after fee ${formatCurrency(result.preview.fee)} and CD deduction ${formatCurrency(result.preview.cdDeduction)}.`,
        tone: result.preview.sufficientBalance ? 'success' : 'warning'
      });
    } catch (cause) {
      notify({
        title: 'Unable to preview encashment',
        description: cause instanceof Error ? cause.message : 'Please try again.',
        tone: 'destructive'
      });
    }
  }

  async function handleSubmitEncashment() {
    const confirmed = await confirmAction({
      title: 'Submit encashment request?',
      description: `This will queue a sandbox encashment for ${formatCurrency(encashAmount)} and write it into the local ledger and admin approval queue.`,
      confirmLabel: 'Submit Request',
      tone: 'warning'
    });

    if (!confirmed) {
      return;
    }

    try {
      const result = await submitEncashment(encashAmount);
      notify({
        title: result.moneyMode === 'sandbox' ? 'Encashment queued' : 'Encashment request checked',
        description: result.detail ?? result.reason,
        tone: result.moneyMode === 'sandbox' ? 'success' : 'warning'
      });
      setReloadNonce((value) => value + 1);
    } catch (cause) {
      notify({
        title: 'Unable to submit encashment',
        description: cause instanceof Error ? cause.message : 'Please try again.',
        tone: 'destructive'
      });
    }
  }

  async function handleTransferCodes() {
    const confirmed = await confirmAction({
      title: 'Transfer activation code?',
      description: `Transfer ${selectedCode || 'the selected code'} to ${transferTarget || 'the selected member'} in the branch sandbox inventory.`,
      confirmLabel: 'Transfer Code',
      tone: 'warning'
    });

    if (!confirmed) {
      return;
    }

    try {
      const result = await transferActivationCodes({
        targetUsername: transferTarget,
        codes: selectedCode ? [selectedCode] : []
      });
      notify({
        title: result.moneyMode === 'sandbox' ? 'Code transferred' : 'Transfer workflow checked',
        description: result.detail ?? result.reason,
        tone: result.moneyMode === 'sandbox' ? 'success' : 'warning'
      });
      setReloadNonce((value) => value + 1);
    } catch (cause) {
      notify({
        title: 'Unable to transfer code',
        description: cause instanceof Error ? cause.message : 'Please try again.',
        tone: 'destructive'
      });
    }
  }

  async function handleUpgradeCode() {
    const confirmed = await confirmAction({
      title: 'Use code for account upgrade?',
      description: `Apply ${selectedCode || 'the selected activation code'} to the current member in the sandbox runtime.`,
      confirmLabel: 'Apply Upgrade',
      tone: 'warning'
    });

    if (!confirmed) {
      return;
    }

    try {
      const result = await upgradeActivationCode({ code: selectedCode });
      notify({
        title: result.moneyMode === 'sandbox' ? 'Upgrade committed' : 'Upgrade workflow checked',
        description: result.detail ?? result.reason,
        tone: result.moneyMode === 'sandbox' ? 'success' : 'warning'
      });
      setReloadNonce((value) => value + 1);
    } catch (cause) {
      notify({
        title: 'Unable to check upgrade',
        description: cause instanceof Error ? cause.message : 'Please try again.',
        tone: 'destructive'
      });
    }
  }

  async function handleMaintenanceCode() {
    const confirmed = await confirmAction({
      title: 'Use maintenance code?',
      description: `Consume ${maintenanceCode || 'the entered code'} as a maintenance action in the sandbox runtime.`,
      confirmLabel: 'Use Code',
      tone: 'warning'
    });

    if (!confirmed) {
      return;
    }

    try {
      const result = await useMaintenanceCode({ code: maintenanceCode, transType: 1 });
      notify({
        title: result.moneyMode === 'sandbox' ? 'Maintenance committed' : 'Maintenance workflow checked',
        description: result.detail ?? result.reason,
        tone: result.moneyMode === 'sandbox' ? 'success' : 'warning'
      });
      setReloadNonce((value) => value + 1);
    } catch (cause) {
      notify({
        title: 'Unable to use maintenance code',
        description: cause instanceof Error ? cause.message : 'Please try again.',
        tone: 'destructive'
      });
    }
  }

  async function handleSelectTransaction(transactionId: string) {
    try {
      const detail = await getMemberTransactionDetail(transactionId);
      setTransactionDetail(detail);
      notify({
        title: 'Transaction loaded',
        description: detail.transaction.id,
        tone: 'info'
      });
    } catch (cause) {
      notify({
        title: 'Unable to load transaction',
        description: cause instanceof Error ? cause.message : 'Please try again.',
        tone: 'destructive'
      });
    }
  }

  const selectedTreeNode = binaryTree?.nodes.find((node) => node.nodeId === selectedTreeNodeId) ?? null;
  const branchNotes = activeModule?.gatedActions.length ? activeModule.gatedActions : office?.gatedActions ?? [];
  const modulePathById = useMemo(
    () => new Map((office?.modules ?? []).map((module) => [module.id, module.path])),
    [office?.modules]
  );
  const quickLinks = useMemo(() => {
    return [
      {
        title: 'How To Earn',
        body: 'Open the full eight-stream earn map before you decide where to focus first.',
        href: '/earn'
      },
      {
        title: 'Process Money',
        body: 'Start in wallet if you need to preview net receivable, deductions, and encashment steps.',
        href: '/member/wallet'
      },
      {
        title: 'Registration',
        body: 'Check sponsor, placement, and available codes before opening a registration link.',
        href: '/member/upgrade-registration'
      },
      {
        title: 'Binary Tree',
        body: 'Review left and right placement before using a code or suggesting a slot.',
        href: '/member/genealogy'
      },
      {
        title: 'Activation Codes',
        body: 'Inspect owned codes, transfer targets, and upgrade or maintenance actions.',
        href: '/member/activation-codes'
      },
      {
        title: 'Account',
        body: 'Keep profile, sponsor code, payout method, and package status in one clean screen.',
        href: '/member/account-details'
      }
    ];
  }, []);
  const showModuleTable = Boolean(activeModule && !customMemberModuleIds.has(moduleId));
  const showStatusRail = moduleId === 'dashboard' || moduleId === 'account-details';
  const showDashboardActions = moduleId === 'dashboard' && (mvpDashboard?.moneyMode ?? 'playground') !== 'sandbox' && branchNotes.length > 0;
  const visibleMetrics = office ? getVisibleMemberMetrics(moduleId, office.metrics) : [];
  const summaryCard =
    moduleId === 'dashboard' || moduleId === 'wallet' || moduleId === 'account-details'
      ? {
          label: 'Available Wallet',
          value: office?.wallet.availableBalance ?? 'PHP 0.00',
          detail: office?.wallet.payoutSchedule
        }
      : undefined;

  if (error) {
    return (
      <section className="min-h-screen bg-[var(--background)] px-4 py-10 text-[var(--foreground)]">
        <div className="mx-auto max-w-3xl pt-16">
          <Card>
            <CardHeader>
              <CardDescription>Member Access</CardDescription>
              <CardTitle>Unable to load member dashboard</CardTitle>
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
      moduleLabel={activeModule?.label ?? 'Member Dashboard'}
      moduleDescription={
        activeModule?.description ??
        'Clean operations layout for wallet, registration, referrals, codes, and compensation monitoring.'
      }
      sidebarHeading={office?.profile.username ?? 'Yor Member'}
      sidebarSubheading={office?.profile.fullName ?? 'Protected member office'}
      modules={office?.modules ?? []}
      headerBadge="Member Office"
      summaryCard={summaryCard}
      footerLinks={[
        { label: 'Public registration page', href: '/register' },
        { label: 'Products and packages', href: '/packages' }
      ]}
    >
      <div className="space-y-4">
          {visibleMetrics.length ? <MetricGrid metrics={visibleMetrics} /> : null}

          {moduleId === 'dashboard' ? <QuickLinkGrid links={quickLinks} /> : null}

          {moduleId === 'dashboard' && mvpDashboard?.incomeStreams.length ? (
            <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              {mvpDashboard.incomeStreams.map((stream) => {
                const routeConfig = memberIncomeRouteMap[stream.streamId];
                const workspaceHref = routeConfig
                  ? (modulePathById.get(routeConfig.memberModuleId) ?? routeConfig.publicHref)
                  : '/earn';

                return (
                <Card key={stream.streamId} className="border-[var(--border)] bg-[var(--card)]">
                  <CardHeader className="pb-3">
                    <CardDescription className="text-xs uppercase tracking-[0.18em]">
                      8 Ways Of Wealth
                    </CardDescription>
                    <CardTitle className="text-base">{stream.label}</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex items-center justify-between text-sm text-[var(--muted-foreground)]">
                      <span>Status</span>
                      <Badge variant="warning">{stream.writeStatus}</Badge>
                    </div>
                    <p className="mt-3 text-sm leading-6 text-[var(--muted-foreground)]">
                      {stream.statusLabel}
                    </p>
                    <div className="mt-4 flex items-center justify-between gap-3">
                      <Button asChild size="sm">
                        <Link to={workspaceHref}>Open Workflow</Link>
                      </Button>
                      {routeConfig ? (
                        <Link
                          to={routeConfig.publicHref}
                          className="text-xs font-medium uppercase tracking-[0.18em] text-[var(--muted-foreground)] transition hover:text-[var(--foreground)]"
                        >
                          Public Page
                        </Link>
                      ) : null}
                    </div>
                  </CardContent>
                </Card>
                );
              })}
            </section>
          ) : null}

          {showModuleTable && activeModule ? <ModuleTableCard module={activeModule} /> : null}

          {moduleId === 'wallet' && walletDetail ? (
            <section className="grid gap-4 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
              <DataListCard
                title="Wallet Summary"
                rows={[
                  { label: 'Available', value: formatCurrency(walletDetail.summary.availableBalance) },
                  { label: 'Pending', value: formatCurrency(walletDetail.summary.pendingBalance) },
                  { label: 'CD Balance', value: formatCurrency(walletDetail.summary.cdBalance) },
                  { label: 'Payout Method', value: walletDetail.summary.payoutMethod }
                ]}
              />
              <Card className="border-[var(--border)] bg-[var(--card)]">
                <CardHeader>
                  <CardTitle>Encashment Preview</CardTitle>
                  <CardDescription>{walletDetail.preview.note}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <label className="grid gap-2 text-sm">
                    <span className="font-medium text-[var(--muted-foreground)]">Requested amount</span>
                    <Input
                      type="number"
                      value={encashAmount}
                      onChange={(event) => setEncashAmount(Number(event.target.value))}
                    />
                  </label>
                  <div className="grid gap-3 sm:grid-cols-3">
                    <DataPoint label="Fee" value={formatCurrency(walletDetail.preview.fee)} />
                    <DataPoint label="CD Deduction" value={formatCurrency(walletDetail.preview.cdDeduction)} />
                    <DataPoint label="Net" value={formatCurrency(walletDetail.preview.netReceivable)} />
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <Button type="button" onClick={handlePreviewEncashment}>
                      Preview
                    </Button>
                    <Button type="button" variant="outline" onClick={handleSubmitEncashment}>
                      Submit Request
                    </Button>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-[var(--border)] bg-[var(--card)] xl:col-span-2">
                <CardHeader>
                  <CardTitle>Wallet Ledger</CardTitle>
                  <CardDescription>Append-only preview of wallet movement and balance-after values.</CardDescription>
                </CardHeader>
                <CardContent>
                  <ReportTableView
                    table={{
                      title: 'Wallet Ledger',
                      columns: [
                        { key: 'walletType', label: 'Wallet' },
                        { key: 'entryType', label: 'Entry' },
                        { key: 'sourceReference', label: 'Source' },
                        { key: 'creditAmount', label: 'Credit' },
                        { key: 'debitAmount', label: 'Debit' },
                        { key: 'balanceAfter', label: 'Balance' },
                        { key: 'status', label: 'Status' }
                      ],
                      rows: walletDetail.ledger.map((entry) => ({
                        walletType: entry.walletType,
                        entryType: entry.entryType,
                        sourceReference: entry.sourceReference,
                        creditAmount: formatCurrency(entry.creditAmount),
                        debitAmount: formatCurrency(entry.debitAmount),
                        balanceAfter: formatCurrency(entry.balanceAfter),
                        status: entry.status
                      }))
                    }}
                  />
                </CardContent>
              </Card>
            </section>
          ) : null}

          {moduleId === 'activation-codes' && activationCodes ? (
            <section className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
              <Card className="border-[var(--border)] bg-[var(--card)] xl:col-span-2">
                <CardHeader>
                  <CardTitle>Activation Code Inventory</CardTitle>
                  <CardDescription>Inspect, transfer, upgrade, or reserve codes without burying the main actions under extra panels.</CardDescription>
                </CardHeader>
                <CardContent>
                  <ReportTableView
                    table={{
                      title: 'Activation Inventory',
                      columns: [
                        { key: 'code', label: 'Code' },
                        { key: 'packageTier', label: 'Package' },
                        { key: 'assignedTo', label: 'Assigned' },
                        { key: 'status', label: 'Status' },
                        { key: 'visibility', label: 'Visibility' }
                      ],
                      rows: activationCodes.inventory
                        .map((item) => ({
                          code: item.code,
                          packageTier: item.packageTier,
                          assignedTo: item.assignedTo,
                          status: item.status,
                          visibility: item.visibility
                        }))
                    }}
                  />
                </CardContent>
              </Card>
              <Card className="border-[var(--border)] bg-[var(--card)]">
                <CardHeader>
                  <CardTitle>Code Actions</CardTitle>
                  <CardDescription>
                    {activationCodes.moneyMode === 'sandbox'
                      ? 'Transfers, upgrades, and maintenance writes now commit into the branch sandbox inventory.'
                      : 'Controls are live for workflow testing but stay financially in protected playground mode.'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FieldSelect
                    label="Code"
                    value={selectedCode}
                    onChange={setSelectedCode}
                    options={activationCodes.inventory.map((item) => ({
                      label: `${item.code} / ${item.packageTier}`,
                      value: item.code
                    }))}
                  />
                  <FieldSelect
                    label="Target member"
                    value={transferTarget}
                    onChange={setTransferTarget}
                    options={activationCodes.transferTargets.map((target) => ({
                      label: `${target.username} / ${target.packageTier}`,
                      value: target.username
                    }))}
                  />
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Button type="button" onClick={handleTransferCodes}>
                      Transfer Code
                    </Button>
                    <Button type="button" variant="outline" onClick={handleUpgradeCode}>
                      Upgrade Account
                    </Button>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-[var(--border)] bg-[var(--card)]">
                <CardHeader>
                  <CardTitle>Maintenance Use</CardTitle>
                  <CardDescription>Use the code as maintenance inventory when the package and eligibility rules allow it.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <label className="grid gap-2 text-sm">
                    <span className="font-medium text-[var(--muted-foreground)]">Maintenance code</span>
                    <Input value={maintenanceCode} onChange={(event) => setMaintenanceCode(event.target.value)} />
                  </label>
                  <Button type="button" className="w-full" onClick={handleMaintenanceCode}>
                    Use Maintenance Code
                  </Button>
                  <ul className="space-y-2 text-sm leading-6 text-[var(--muted-foreground)]">
                    {activationCodes.hints.map((hint) => (
                      <li key={hint}>{hint}</li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </section>
          ) : null}

          {moduleId === 'transactions' ? (
            <section className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
              <Card className="border-[var(--border)] bg-[var(--card)]">
                <CardHeader>
                  <CardTitle>Transaction History</CardTitle>
                  <CardDescription>Wallet movements and encashment rows in member-readable form.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {transactions.map((transaction) => (
                    <button
                      key={transaction.id}
                      type="button"
                      className="flex w-full items-center justify-between rounded-xl border border-[var(--border)] p-3 text-left hover:bg-[var(--accent)]"
                      onClick={() => handleSelectTransaction(transaction.id)}
                    >
                      <div>
                        <p className="font-medium text-[var(--foreground)]">{transaction.source}</p>
                        <p className="text-sm text-[var(--muted-foreground)]">
                          {transaction.date} / {transaction.category}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-[var(--foreground)]">{transaction.net}</p>
                        <p className="text-sm text-[var(--muted-foreground)]">{transaction.status}</p>
                      </div>
                    </button>
                  ))}
                </CardContent>
              </Card>
              {transactionDetail ? (
                <Card className="border-[var(--border)] bg-[var(--card)]">
                  <CardHeader>
                    <CardTitle>Transaction Detail</CardTitle>
                    <CardDescription>
                      {transactionDetail.moneyMode === 'sandbox'
                        ? 'Supporting traces stay visible alongside real branch-only sandbox ledger changes.'
                        : 'Supporting traces stay visible even while the ledger remains simulation-only.'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <DataPoint label="Source" value={transactionDetail.transaction.source} />
                    <DataPoint label="Category" value={transactionDetail.transaction.category} />
                    <DataPoint label="Gross" value={transactionDetail.transaction.gross} />
                    <DataPoint label="Net" value={transactionDetail.transaction.net} />
                    <div className="rounded-xl border border-[var(--border)] bg-[var(--background)] p-4">
                      <p className="text-sm font-medium text-[var(--foreground)]">Trace notes</p>
                      <ul className="mt-2 space-y-2 text-sm leading-6 text-[var(--muted-foreground)]">
                        {transactionDetail.transaction.support.notes.map((note) => (
                          <li key={note}>{note}</li>
                        ))}
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              ) : null}
            </section>
          ) : null}

          {moduleId === 'account-details' && office ? (
            <section className="grid gap-4 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
              <DataListCard
                title="Profile"
                rows={[
                  { label: 'Username', value: office.profile.username },
                  { label: 'Full Name', value: office.profile.fullName },
                  { label: 'Email', value: summary?.user.email ?? 'member@yor.local' },
                  { label: 'Package', value: office.profile.packageTier },
                  { label: 'Account Status', value: office.profile.accountStatus }
                ]}
              />
              <DataListCard
                title="Sponsor And Payout"
                rows={[
                  { label: 'Referral Code', value: office.profile.referralCode },
                  { label: 'Sponsor Code', value: office.profile.sponsorCode },
                  { label: 'Payout Method', value: office.profile.payoutMethod },
                  { label: 'Payout Schedule', value: office.wallet.payoutSchedule },
                  { label: 'Available Wallet', value: office.wallet.availableBalance }
                ]}
              />
              <Card className="border-[var(--border)] bg-[var(--card)] xl:col-span-2">
                <CardHeader>
                  <CardTitle>Next Member Actions</CardTitle>
                  <CardDescription>Use this page as your clean account checkpoint before money, code, or network actions.</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-3">
                  <Button asChild>
                    <Link to="/member/wallet">Open Wallet</Link>
                  </Button>
                  <Button asChild variant="outline">
                    <Link to="/member/activation-codes">Manage Codes</Link>
                  </Button>
                  <Button asChild variant="outline">
                    <Link to="/member/genealogy">Review Placement</Link>
                  </Button>
                </CardContent>
              </Card>
            </section>
          ) : null}

          {moduleId === 'upgrade-registration' && registrationReadiness ? (
            <section className="grid gap-4 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
              <Card className="border-[var(--border)] bg-[var(--card)]">
                <CardHeader>
                  <CardTitle>Registration Readiness</CardTitle>
                  <CardDescription>Keep sponsor, placement, available code, and registration link in one sequence.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <DataPoint label="Sponsor" value={registrationReadiness.sponsor.username} />
                  <DataPoint label="Referral Code" value={registrationReadiness.sponsor.referralCode} />
                  <DataPoint label="Placement Username" value={registrationReadiness.placementPolicy.recommendation.placementUsername} />
                  <DataPoint label="Placement Side" value={registrationReadiness.placementPolicy.recommendation.placementSide} />
                  <div className="rounded-xl border border-[var(--border)] bg-[var(--background)] p-4 text-sm leading-6 text-[var(--muted-foreground)]">
                    {registrationReadiness.placementPolicy.recommendation.note}
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <Button asChild>
                      <Link to={`/register?ref=${registrationReadiness.sponsor.referralCode}`}>
                        Open Registration
                        <ArrowRight className="size-4" />
                      </Link>
                    </Button>
                    <Button asChild variant="outline">
                      <Link to="/member/genealogy">
                        Review Tree
                        <GitBranch className="size-4" />
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-[var(--border)] bg-[var(--card)]">
                <CardHeader>
                  <CardTitle>Checklist</CardTitle>
                  <CardDescription>Keep the sponsor side and the binary side aligned before a code is used.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {registrationReadiness.checklist.map((item) => (
                    <div key={item} className="flex items-start gap-3 rounded-xl border border-[var(--border)] p-3">
                      <ShieldCheck className="mt-0.5 size-4 text-emerald-500" />
                      <span className="text-sm leading-6 text-[var(--foreground)]">{item}</span>
                    </div>
                  ))}
                  <div className="rounded-xl border border-[var(--border)] bg-[var(--background)] p-4">
                    <p className="text-sm font-medium text-[var(--foreground)]">Available codes</p>
                    <p className="mt-2 text-sm text-[var(--muted-foreground)]">
                      {registrationReadiness.availableCodes.map((item) => item.code).join(', ') || 'No available codes'}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </section>
          ) : null}

          {moduleId === 'genealogy' && binaryTree ? (
            <section className="grid gap-4 xl:grid-cols-[minmax(0,1.25fr)_minmax(0,0.75fr)]">
              <Card className="border-[var(--border)] bg-[var(--card)]">
                <CardHeader>
                  <CardTitle>Placement Network View</CardTitle>
                  <CardDescription>Review left and right slots before you hand a sponsor or registrant a placement recommendation.</CardDescription>
                </CardHeader>
                <CardContent>
                  <GenealogyTree
                    root={binaryTree.root}
                    selectedNodeId={selectedTreeNodeId}
                    onSelect={setSelectedTreeNodeId}
                  />
                </CardContent>
              </Card>
              {selectedTreeNode ? (
                <Card className="border-[var(--border)] bg-[var(--card)]">
                  <CardHeader>
                    <CardTitle>Node Focus</CardTitle>
                    <CardDescription>Use this panel to verify slot availability before registration.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <DataPoint label="Username" value={selectedTreeNode.username} />
                    <DataPoint label="Package" value={selectedTreeNode.packageTier} />
                    <DataPoint label="Placement" value={selectedTreeNode.placement} />
                    <DataPoint label="Account State" value={selectedTreeNode.accountStateLabel} />
                    <DataPoint label="Direct Referrals" value={selectedTreeNode.directReferrals} />
                    <DataPoint label="Left Points" value={selectedTreeNode.leftPoints} />
                    <DataPoint label="Right Points" value={selectedTreeNode.rightPoints} />
                  </CardContent>
                </Card>
              ) : null}
            </section>
          ) : null}

          {showStatusRail || showDashboardActions ? (
            <section className="grid gap-4 xl:grid-cols-3">
              {showStatusRail ? (
                <Card className="border-[var(--border)] bg-[var(--card)]">
                  <CardHeader>
                    <CardTitle>Account Snapshot</CardTitle>
                    <CardDescription>Core account fields that members actually look up when they need a fast answer.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {office
                      ? Object.entries(office.profile).map(([key, value]) => (
                          <div key={key} className="flex items-start justify-between gap-3 text-sm">
                            <span className="text-[var(--muted-foreground)]">{key}</span>
                            <strong className="text-right text-[var(--foreground)]">{value}</strong>
                          </div>
                        ))
                      : null}
                  </CardContent>
                </Card>
              ) : null}

              {showDashboardActions ? <GatedActionsCard actions={branchNotes} /> : null}

              {showStatusRail ? (
                <Card className="border-[var(--border)] bg-[var(--card)]">
                  <CardHeader>
                    <CardTitle>Current Status</CardTitle>
                    <CardDescription>Session, payout, and account-state checks from the protected member APIs.</CardDescription>
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
                  </CardContent>
                </Card>
              ) : null}
            </section>
          ) : null}
      </div>
    </ProtectedOfficeFrame>
  );
}

function FieldSelect({
  label,
  value,
  onChange,
  options
}: {
  label: string;
  value: string;
  onChange: (nextValue: string) => void;
  options: Array<{ label: string; value: string }>;
}) {
  return (
    <label className="grid gap-2 text-sm">
      <span className="font-medium text-[var(--muted-foreground)]">{label}</span>
      <select
        className="flex h-10 w-full rounded-md border border-[var(--input)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
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
