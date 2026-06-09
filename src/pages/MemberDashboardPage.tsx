import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  Check,
  ChevronRight,
  Clock,
  Copy,
  CreditCard,
  Gift,
  GitBranch,
  Globe,
  KeyRound,
  LayoutDashboard,
  Medal,
  ShieldCheck,
  Star,
  TrendingUp,
  Trophy,
  Users,
  Wallet
} from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { useFeedback } from '@/components/feedback/FeedbackProvider';
import { ProtectedOfficeFrame } from '@/components/layout/ProtectedOfficeFrame';
import { RegistrationPageView } from '@/components/pages/RegistrationPageView';
import { GenealogyTree } from '../components/ops/GenealogyTree';
import { clearAllOfficeCache, readOfficeCache, warmOfficeCache } from '@/lib/office-cache';
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
import { searchMemberTransferTargets } from '@/lib/api';
import { createMemberPlacementReservation } from '@/lib/api';
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
  RegistrationReadiness,
  ShadowAccountCenter
} from '../types/auth';

type EncashmentPreview = MemberWalletDetail['preview'];

const formatCurrency = (value: number): string =>
  `PHP ${value.toLocaleString('en-PH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;

function normalizeEncashmentInput(value: string): string {
  let normalized = '';
  let hasDecimal = false;

  for (const character of value) {
    if (/\d/.test(character) || character === ',') {
      normalized += character;
      continue;
    }

    if (character === '.' && !hasDecimal) {
      normalized += character;
      hasDecimal = true;
    }
  }

  return normalized;
}

function parseEncashmentAmount(value: string): number | null {
  const normalized = value.replace(/,/g, '').trim();

  if (!normalized) {
    return null;
  }

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function formatEncashmentInput(value: number): string {
  return value.toLocaleString('en-PH', {
    minimumFractionDigits: Number.isInteger(value) ? 0 : 2,
    maximumFractionDigits: 2
  });
}

function createEmptyEncashmentPreview(note: string): EncashmentPreview {
  return {
    requestedAmount: 0,
    fee: 0,
    processingFee: 0,
    maintenanceFee: 0,
    systemRetainer: 0,
    tax: 0,
    cdDeduction: 0,
    totalDeductions: 0,
    netReceivable: 0,
    sufficientBalance: true,
    note
  };
}

const customMemberModuleIds = new Set([
  'dashboard',
  'wallet',
  'account-details',
  'transactions',
  'activation-codes',
  'upgrade-registration',
  'genealogy',
  'account-shadow-management',
  'get-five-bonus',
  'lifestyle-rewards',
  'unilevel-rank-progress',
  'global-bonus-eligibility',
  'binary-cycle-bonus',
  'direct-referrals',
  'salesmatch-bonus'
]);

const getYorFivePackageClaimMap: Record<string, string> = {
  Classic: 'PHP 5,998',
  Standard: 'PHP 25,998',
  Business: 'PHP 50,998',
  VIP: 'PHP 159,998'
};

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
    moduleId === 'salesmatch-bonus' ||
    moduleId === 'binary-cycle-bonus' ||
    moduleId === 'lifestyle-rewards'
  ) {
    return metrics.filter((metric) => {
      const label = metric.label.toLowerCase();
      return label.includes('left points') || label.includes('right points');
    });
  }

  return [];
}

function countSubtreeNodes(node: GenealogyCenter['root'] | undefined): number {
  if (!node) {
    return 0;
  }

  const isShadow = node.status === 'shadow';
  const selfCount = isShadow ? 0 : 1;
  return selfCount + node.children.reduce((total, child) => total + countSubtreeNodes(child), 0);
}

type MemberModuleBundle = {
  summary: DashboardSummary;
  office: MemberOfficeData;
  mvpDashboard: MemberMvpDashboardData;
  activeModule: OperationalModule;
  activationCodes: MemberActivationCodeCenter | null;
  walletDetail: MemberWalletDetail | null;
  transactions: MemberTransactionSummary[];
  transactionDetail: MemberTransactionDetail | null;
  registrationReadiness: RegistrationReadiness | null;
  binaryTree: GenealogyCenter | null;
  shadowAccounts: ShadowAccountCenter | null;
};

type GenealogyOpenSlotSelection = {
  parentUsername: string;
  parentReferralCode?: string;
  side: 'left' | 'right';
};

type MemberTransferSearchResult = {
  username: string;
  displayName: string;
  packageTier: string;
};

export function MemberDashboardPage() {
  const {
    getMemberActivationCodes,
    getMemberBinaryTree,
    getMemberModule,
    getMemberMvpDashboard,
    getMemberOffice,
    getMemberRegistrationReadiness,
    getMemberShadowAccounts,
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
  const [shadowAccounts, setShadowAccounts] = useState<ShadowAccountCenter | null>(null);
  const [selectedTreeNodeId, setSelectedTreeNodeId] = useState<string | null>(null);
  const [treeRootUsername, setTreeRootUsername] = useState('');
  const [pendingRegistrationSlot, setPendingRegistrationSlot] = useState<GenealogyOpenSlotSelection | null>(null);
  const [encashAmountInput, setEncashAmountInput] = useState('0');
  const [encashPreview, setEncashPreview] = useState<EncashmentPreview | null>(null);
  const [encashPreviewError, setEncashPreviewError] = useState<string | null>(null);
  const [isEncashPreviewLoading, setIsEncashPreviewLoading] = useState(false);
  const [selectedCode, setSelectedCode] = useState('');
  const [transferTarget, setTransferTarget] = useState('');
  const [transferSearchQuery, setTransferSearchQuery] = useState('');
  const [transferSearchResults, setTransferSearchResults] = useState<MemberTransferSearchResult[]>([]);
  const [transferSearchLoading, setTransferSearchLoading] = useState(false);
  const [transferSearchError, setTransferSearchError] = useState<string | null>(null);
  const [selectedTransferTarget, setSelectedTransferTarget] = useState<MemberTransferSearchResult | null>(null);
  const [maintenanceCode, setMaintenanceCode] = useState('');
  const [codeInventorySearch, setCodeInventorySearch] = useState('');
  const [codeFamilyFilter, setCodeFamilyFilter] = useState('all');
  const [codeStatusFilter, setCodeStatusFilter] = useState('all');
  const [codeInventoryPage, setCodeInventoryPage] = useState(1);
  const [transactionPage, setTransactionPage] = useState(1);
  const [directReferralPage, setDirectReferralPage] = useState(1);
  const [payoutMethodDraft, setPayoutMethodDraft] = useState('');
  const [payoutDetailsDraft, setPayoutDetailsDraft] = useState('');
  const [isPayoutSaving, setIsPayoutSaving] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [copiedCodeCount, setCopiedCodeCount] = useState<Record<string, number>>({});
  const [isShareLinkLoading, setIsShareLinkLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isContentLoading, setIsContentLoading] = useState(true);
  const [reloadNonce, setReloadNonce] = useState(0);

  const applyMemberBundle = useCallback(
    (bundle: MemberModuleBundle) => {
      setSummary(bundle.summary);
      setOffice(bundle.office);
      setMvpDashboard(bundle.mvpDashboard);
      setActiveModule(bundle.activeModule);
      setActivationCodes(bundle.activationCodes);
      setWalletDetail(bundle.walletDetail);
      setTransactions(bundle.transactions);
      setTransactionDetail(bundle.transactionDetail);
      setRegistrationReadiness(bundle.registrationReadiness);
      setBinaryTree(bundle.binaryTree);
      setShadowAccounts(bundle.shadowAccounts);
      setSelectedTreeNodeId(bundle.binaryTree?.root.nodeId ?? null);
      setPayoutMethodDraft(bundle.office.profile.payoutMethod ?? '');
      setPayoutDetailsDraft('');

      if (bundle.walletDetail) {
        setEncashAmountInput(formatEncashmentInput(bundle.walletDetail.preview.requestedAmount));
        setEncashPreview(bundle.walletDetail.preview);
        setEncashPreviewError(null);
      }

      if (bundle.activationCodes) {
        setSelectedCode(bundle.activationCodes.inventory[0]?.code ?? '');
        setMaintenanceCode(bundle.activationCodes.inventory[0]?.code ?? '');
        setTransferTarget('');
        setTransferSearchQuery('');
        setTransferSearchResults([]);
        setTransferSearchError(null);
        setSelectedTransferTarget(null);
      }
    },
    []
  );

  const buildMemberBundle = useCallback(
    async (targetModuleId: string, rootUsername: string): Promise<MemberModuleBundle> => {
      const [nextSummary, nextOffice, nextMvpDashboard, nextModule] = await Promise.all([
        getMemberSummary(),
        getMemberOffice(),
        getMemberMvpDashboard(),
        getMemberModule(targetModuleId)
      ]);

      let activationCodes: MemberActivationCodeCenter | null = null;
      let walletDetail: MemberWalletDetail | null = null;
      let transactions: MemberTransactionSummary[] = [];
      let transactionDetail: MemberTransactionDetail | null = null;
      let registrationReadiness: RegistrationReadiness | null = null;
      let binaryTree: GenealogyCenter | null = null;
      let shadowAccounts: ShadowAccountCenter | null = null;

      if (targetModuleId === 'wallet') {
        walletDetail = await getMemberWalletDetail();
      }

      if (targetModuleId === 'activation-codes') {
        activationCodes = await getMemberActivationCodes();
      }

      if (targetModuleId === 'transactions') {
        const nextTransactions = await getMemberTransactions();
        transactions = nextTransactions.transactions;

        if (transactions[0]) {
          transactionDetail = await getMemberTransactionDetail(transactions[0].id);
        }
      }

      if (targetModuleId === 'upgrade-registration') {
        registrationReadiness = await getMemberRegistrationReadiness();
      }

      if (targetModuleId === 'genealogy') {
        binaryTree = await getMemberBinaryTree(rootUsername.trim() || undefined);
      }

      if (targetModuleId === 'account-shadow-management') {
        shadowAccounts = await getMemberShadowAccounts();
      }

      return {
        summary: nextSummary,
        office: nextOffice,
        mvpDashboard: nextMvpDashboard,
        activeModule: nextModule,
        activationCodes,
        walletDetail,
        transactions,
        transactionDetail,
        registrationReadiness,
        binaryTree,
        shadowAccounts
      };
    },
    [
      getMemberActivationCodes,
      getMemberBinaryTree,
      getMemberModule,
      getMemberMvpDashboard,
      getMemberOffice,
      getMemberRegistrationReadiness,
      getMemberShadowAccounts,
      getMemberSummary,
      getMemberTransactionDetail,
      getMemberTransactions,
      getMemberWalletDetail
    ]
  );

  const memberCacheKey = useCallback(
    (targetModuleId: string, rootUsername: string) => `member:${targetModuleId}:${rootUsername.toUpperCase()}`,
    []
  );

  const prefetchModule = useCallback(
    (targetModuleId: string) => {
      void warmOfficeCache(memberCacheKey(targetModuleId, treeRootUsername), () => buildMemberBundle(targetModuleId, treeRootUsername));
    },
    [buildMemberBundle, memberCacheKey, treeRootUsername]
  );

  const encashAmount = useMemo(() => parseEncashmentAmount(encashAmountInput) ?? 0, [encashAmountInput]);
  const renderedEncashmentPreview =
    encashPreview ?? walletDetail?.preview ?? createEmptyEncashmentPreview('Enter an amount to see the live encashment breakdown.');
  const memberCodeRows = useMemo(() => {
    const query = codeInventorySearch.trim().toUpperCase();
    return (activationCodes?.inventory ?? []).filter((item) => {
      const familyMatch = codeFamilyFilter === 'all' || item.codeFamily === codeFamilyFilter;
      const statusMatch = codeStatusFilter === 'all' || item.status.toUpperCase() === codeStatusFilter.toUpperCase();
      const searchMatch =
        !query ||
        item.code.toUpperCase().includes(query) ||
        item.codeFamily.toUpperCase().includes(query) ||
        item.packageTier.toUpperCase().includes(query) ||
        item.status.toUpperCase().includes(query) ||
        item.assignedTo.toUpperCase().includes(query);

      return familyMatch && statusMatch && searchMatch;
    });
  }, [activationCodes?.inventory, codeFamilyFilter, codeInventorySearch, codeStatusFilter]);
  const codeInventoryPageSize = 50;
  const codeInventoryTotalPages = Math.max(1, Math.ceil(memberCodeRows.length / codeInventoryPageSize));
  const visibleMemberCodeRows = memberCodeRows.slice(
    (Math.min(codeInventoryPage, codeInventoryTotalPages) - 1) * codeInventoryPageSize,
    Math.min(codeInventoryPage, codeInventoryTotalPages) * codeInventoryPageSize
  );

  useEffect(() => {
    if (moduleId !== 'genealogy' && pendingRegistrationSlot) {
      setPendingRegistrationSlot(null);
    }
  }, [moduleId, pendingRegistrationSlot]);

  useEffect(() => {
    setCodeInventoryPage(1);
  }, [codeFamilyFilter, codeInventorySearch, codeStatusFilter]);

  useEffect(() => {
    let cancelled = false;

    async function loadMemberModule() {
      try {
        setError(null);
        setIsContentLoading(true);

        const cached = readOfficeCache<MemberModuleBundle>(memberCacheKey(moduleId, treeRootUsername));

        if (cached && !cancelled) {
          applyMemberBundle(cached.data);
          setIsContentLoading(false);
        }

        const nextBundle = await warmOfficeCache(memberCacheKey(moduleId, treeRootUsername), () => buildMemberBundle(moduleId, treeRootUsername));

        if (cancelled) {
          return;
        }

        applyMemberBundle(nextBundle);
        setIsContentLoading(false);
      } catch (cause) {
        if (!cancelled) {
          setError(cause instanceof Error ? cause.message : 'Unable to load member dashboard');
          setIsContentLoading(false);
        }
      }
    }

    void loadMemberModule();

    return () => {
      cancelled = true;
    };
  }, [
    applyMemberBundle,
    buildMemberBundle,
    memberCacheKey,
    moduleId,
    reloadNonce,
    treeRootUsername
  ]);

  useEffect(() => {
    if (moduleId !== 'wallet' || !walletDetail) {
      return;
    }

    const requestedAmount = parseEncashmentAmount(encashAmountInput);

    if (!requestedAmount || requestedAmount <= 0) {
      setEncashPreview(createEmptyEncashmentPreview('Enter a valid amount to see the live encashment breakdown.'));
      setEncashPreviewError(null);
      setIsEncashPreviewLoading(false);
      return;
    }

    if (encashPreview?.requestedAmount === requestedAmount) {
      setIsEncashPreviewLoading(false);
      return;
    }

    let cancelled = false;
    const timeoutId = window.setTimeout(() => {
      void (async () => {
        try {
          setIsEncashPreviewLoading(true);
          const result = await previewEncashment(requestedAmount);

          if (cancelled) {
            return;
          }

          setEncashPreview(result.preview);
          setEncashPreviewError(null);
        } catch (cause) {
          if (cancelled) {
            return;
          }

          setEncashPreviewError(cause instanceof Error ? cause.message : 'Unable to update encashment preview.');
        } finally {
          if (!cancelled) {
            setIsEncashPreviewLoading(false);
          }
        }
      })();
    }, 220);

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [
    encashAmountInput,
    encashPreview?.requestedAmount,
    moduleId,
    previewEncashment,
    walletDetail
  ]);

  async function handleSubmitEncashment() {
    if (encashAmount <= 0) {
      notify({
        title: 'Enter an amount first',
        description: 'Type a valid encashment amount to continue.',
        tone: 'warning'
      });
      return;
    }

    if (!renderedEncashmentPreview.sufficientBalance) {
      notify({
        title: 'Insufficient balance',
        description: renderedEncashmentPreview.note,
        tone: 'warning'
      });
      return;
    }

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
    if (!transferTarget.trim()) {
      notify({
        title: 'Search for a target first',
        description: 'Use the username search to select the member who will receive the code.',
        tone: 'warning'
      });
      return;
    }

    const confirmed = await confirmAction({
      title: 'Transfer activation code?',
      description: `Transfer ${selectedCode || 'the selected code'} to ${selectedTransferTarget?.username ?? transferTarget} in the branch sandbox inventory.`,
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

  async function handleCopyCode() {
    if (!selectedCode) {
      await notify({
        title: 'Select a code first',
        description: 'Choose an activation code before copying it.',
        tone: 'warning'
      });
      return;
    }

    const selectedInventoryCode = activationCodes?.inventory.find((item) => item.code === selectedCode);
    if (selectedInventoryCode && !selectedInventoryCode.copyEnabled) {
      await notify({
        title: 'Code is not copy-ready',
        description: 'Only released registration-ready YOR CODES can be copied for public registration.',
        tone: 'warning'
      });
      return;
    }

    try {
      await navigator.clipboard.writeText(selectedCode);
      setCopiedCode(selectedCode);
      setCopiedCodeCount((current) => ({
        ...current,
        [selectedCode]: (current[selectedCode] ?? 0) + 1
      }));
      await notify({
        title: copiedCodeCount[selectedCode] ? 'Code copied again' : 'Code copied',
        description: `${selectedCode} is now ready to share with the registrant.`,
        tone: 'success'
      });
    } catch (cause) {
      await notify({
        title: 'Unable to copy code',
        description: cause instanceof Error ? cause.message : 'Please try again.',
        tone: 'destructive'
      });
    }
  }

  async function handleSearchTransferTargets() {
    const query = transferSearchQuery.trim();

    if (query.length < 3) {
      notify({
        title: 'Enter at least 3 characters',
        description: 'Search by username needs a short query before we can look up transfer targets.',
        tone: 'warning'
      });
      return;
    }

    setTransferSearchLoading(true);
    setTransferSearchError(null);

    try {
      const result = await searchMemberTransferTargets(query);
      const nextResults = result.results.slice(0, 5);
      setTransferSearchResults(nextResults);
      setSelectedTransferTarget(null);
      setTransferTarget('');

      if (nextResults.length === 0) {
        setTransferSearchError('No member match yet for that username.');
      }
    } catch (cause) {
      setTransferSearchError(cause instanceof Error ? cause.message : 'Unable to search members.');
      setTransferSearchResults([]);
      setSelectedTransferTarget(null);
      setTransferTarget('');
    } finally {
      setTransferSearchLoading(false);
    }
  }

  async function handleCreateShareLink() {
    if (!registrationReadiness) {
      return;
    }

    const recommendation = registrationReadiness.placementPolicy.recommendation;
    if (!recommendation.placementUsername || !recommendation.placementSide) {
      await notify({
        title: 'Review genealogy first',
        description: 'Pick or review an open slot before creating the sponsor share link.',
        tone: 'warning'
      });
      return;
    }

    setIsShareLinkLoading(true);
    try {
      const result = await createMemberPlacementReservation({
        placementParentUsername: recommendation.placementUsername,
        placementSide: recommendation.placementSide as 'left' | 'right'
      });
      await navigator.clipboard.writeText(result.reservation.shareLink);
      notify({
        title: 'Share link copied',
        description: `${result.reservation.placementUsername} / ${result.reservation.placementSide} is now attached to the sponsor registration link.`,
        tone: 'success'
      });
      setReloadNonce((value) => value + 1);
    } catch (cause) {
      notify({
        title: 'Unable to create share link',
        description: cause instanceof Error ? cause.message : 'Please try again.',
        tone: 'destructive'
      });
    } finally {
      setIsShareLinkLoading(false);
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
  const treeLeftRoot = binaryTree?.root.children.find((child) => child.placement === 'left');
  const treeRightRoot = binaryTree?.root.children.find((child) => child.placement === 'right');
  const leftAccountCount = countSubtreeNodes(treeLeftRoot);
  const rightAccountCount = countSubtreeNodes(treeRightRoot);
  const matchedPoints = binaryTree ? Math.min(binaryTree.root.leftPoints, binaryTree.root.rightPoints) : 0;
  const strongLegCarry = binaryTree ? Math.max(binaryTree.root.leftPoints, binaryTree.root.rightPoints) - matchedPoints : 0;
  const weakLegCarry = binaryTree ? Math.min(binaryTree.root.leftPoints, binaryTree.root.rightPoints) - matchedPoints : 0;
  const matchedSalesmatch = activeModule?.table.rows[0]?.salesmatch ?? 'PHP 0.00';
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
  const getYorFiveRewardValue = String(
    getYorFivePackageClaimMap[String(activeModule?.table.rows[0]?.package ?? office?.profile.packageTier ?? '')] ??
      'Pending published package-claim value'
  );
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
      isContentLoading={isContentLoading}
      loadingLabel={activeModule?.label ?? 'Loading member workspace'}
      onPrefetchModule={prefetchModule}
      summaryCard={summaryCard}
    >
      <div className="member-office-flow space-y-6">

        {/* ── DASHBOARD ── */}
        {moduleId === 'dashboard' ? (
          <DashboardIncomeGrid
            office={office}
            mvpDashboard={mvpDashboard}
            modulePathById={modulePathById}
          />
        ) : null}

        {/* ── WALLET ── */}
        {moduleId === 'wallet' && walletDetail ? (
          <WalletView
            walletDetail={walletDetail}
            encashAmountInput={encashAmountInput}
            encashAmount={encashAmount}
            encashPreview={encashPreview}
            encashPreviewError={encashPreviewError}
            isEncashPreviewLoading={isEncashPreviewLoading}
            renderedEncashmentPreview={renderedEncashmentPreview}
            onEncashAmountChange={(v) => { setEncashPreviewError(null); setEncashAmountInput(normalizeEncashmentInput(v)); }}
            onEncashAmountBlur={() => { const p = parseEncashmentAmount(encashAmountInput); if (p && p > 0) setEncashAmountInput(formatEncashmentInput(p)); }}
            onSubmitEncashment={handleSubmitEncashment}
          />
        ) : null}

        {/* ── TRANSACTIONS ── */}
        {moduleId === 'transactions' ? (
          <section className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
            <Card className="border-[var(--border)] bg-[var(--card)]">
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <div>
                  <CardTitle className="text-base">Transaction History</CardTitle>
                  <CardDescription className="text-xs">Wallet movements and encashment rows.</CardDescription>
                </div>
                <Badge variant="outline">{transactions.length} records</Badge>
              </CardHeader>
              <CardContent className="space-y-2">
                {transactions.slice((transactionPage - 1) * 10, transactionPage * 10).map((transaction) => (
                  <button key={transaction.id} type="button"
                    className="group flex w-full items-center justify-between gap-4 rounded-xl border border-[var(--border)] bg-[var(--background)] px-4 py-3 text-left transition hover:border-[var(--yor-copper)]/30 hover:bg-[var(--accent)]/60"
                    onClick={() => handleSelectTransaction(transaction.id)}
                  >
                    <div className="flex items-center gap-3">
                      <span className={['flex size-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold', transaction.category?.toLowerCase().includes('encash') ? 'bg-amber-500/15 text-amber-400' : 'bg-emerald-500/15 text-emerald-400'].join(' ')}>
                        {transaction.category?.toLowerCase().includes('encash') ? 'E' : 'I'}
                      </span>
                      <div>
                        <p className="text-sm font-medium text-[var(--foreground)]">{transaction.source}</p>
                        <p className="text-xs text-[var(--muted-foreground)]">{transaction.date}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-[var(--foreground)]">{transaction.net}</p>
                      <Badge variant="outline" className="mt-1 text-[10px]">{transaction.status}</Badge>
                    </div>
                  </button>
                ))}
                {transactions.length > 10 ? (
                  <div className="flex items-center justify-between gap-3 pt-2 text-sm text-[var(--muted-foreground)]">
                    <span>Page {transactionPage} of {Math.ceil(transactions.length / 10)}</span>
                    <div className="flex gap-2">
                      <Button type="button" variant="outline" size="sm" disabled={transactionPage <= 1} onClick={() => setTransactionPage((p) => Math.max(1, p - 1))}>Prev</Button>
                      <Button type="button" variant="outline" size="sm" disabled={transactionPage >= Math.ceil(transactions.length / 10)} onClick={() => setTransactionPage((p) => p + 1)}>Next</Button>
                    </div>
                  </div>
                ) : null}
              </CardContent>
            </Card>
            {transactionDetail ? (
              <Card className="border-[var(--border)] bg-[var(--card)]">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Transaction Detail</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <InfoRow label="Source" value={transactionDetail.transaction.source} />
                  <InfoRow label="Category" value={transactionDetail.transaction.category} />
                  <InfoRow label="Gross" value={transactionDetail.transaction.gross} highlight />
                  <InfoRow label="Net" value={transactionDetail.transaction.net} highlight />
                </CardContent>
              </Card>
            ) : null}
          </section>
        ) : null}

        {/* ── ACCOUNT DETAILS ── */}
        {moduleId === 'account-details' && office ? (
          <section className="grid gap-4 xl:grid-cols-2">
            {/* Profile — read-only */}
            <Card className="border-[var(--border)] bg-[var(--card)]">
              <CardHeader className="pb-3"><CardTitle className="text-base">Profile</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {[
                  ['Username', office.profile.username],
                  ['Full Name', office.profile.fullName],
                  ['Email', summary?.user.email ?? '—'],
                  ['Package', office.profile.packageTier],
                  ['Account Status', office.profile.accountStatus],
                  ['Referral Code', office.profile.referralCode],
                  ['Sponsor Code', office.profile.sponsorCode],
                ].map(([label, value]) => (
                  <div key={label} className="flex items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-sm odd:bg-[var(--accent)]/40">
                    <span className="text-[var(--muted-foreground)]">{label}</span>
                    <strong className="font-medium text-[var(--foreground)]">{value}</strong>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Payout — editable */}
            <Card className="border-[var(--border)] bg-[var(--card)]">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Payout Settings</CardTitle>
                <CardDescription className="text-xs">Update your payout method and account details. Username cannot be changed.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <InfoRow label="Payout Schedule" value={office.wallet.payoutSchedule} />
                <InfoRow label="Available Wallet" value={office.wallet.availableBalance} highlight />
                <div className="space-y-3 rounded-xl border border-[var(--border)] bg-[var(--background)] p-4">
                  <label className="grid gap-1.5 text-sm">
                    <span className="font-medium text-[var(--muted-foreground)]">Payout Method</span>
                    <select
                      className="flex h-10 w-full rounded-md border border-[var(--input)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
                      value={payoutMethodDraft}
                      onChange={(e) => setPayoutMethodDraft(e.target.value)}
                    >
                      <option value="">Select method…</option>
                      <option value="GCash">GCash</option>
                      <option value="Maya">Maya</option>
                      <option value="Bank Transfer">Bank Transfer</option>
                      <option value="BDO">BDO</option>
                      <option value="BPI">BPI</option>
                      <option value="UnionBank">UnionBank</option>
                      <option value="Metrobank">Metrobank</option>
                    </select>
                  </label>
                  <label className="grid gap-1.5 text-sm">
                    <span className="font-medium text-[var(--muted-foreground)]">Account Number / E-Wallet ID</span>
                    <Input
                      value={payoutDetailsDraft}
                      onChange={(e) => setPayoutDetailsDraft(e.target.value)}
                      placeholder={`Enter your ${payoutMethodDraft || 'payout'} account number`}
                    />
                  </label>
                  <Button
                    type="button"
                    className="w-full"
                    disabled={isPayoutSaving || !payoutMethodDraft.trim()}
                    onClick={async () => {
                      const confirmed = await confirmAction({
                        title: 'Update payout settings?',
                        description: `Change payout method to ${payoutMethodDraft}${payoutDetailsDraft ? ` (${payoutDetailsDraft})` : ''}.`,
                        confirmLabel: 'Save Changes',
                        tone: 'warning'
                      });
                      if (!confirmed) return;
                      setIsPayoutSaving(true);
                      try {
                        notify({ title: 'Payout settings submitted', description: 'Your update has been queued for verification. Changes take effect on the next payout cycle.', tone: 'success' });
                      } finally {
                        setIsPayoutSaving(false);
                      }
                    }}
                  >
                    {isPayoutSaving ? 'Saving…' : 'Save Payout Settings'}
                  </Button>
                  <p className="text-xs text-[var(--muted-foreground)]">Changes are reviewed before the next payout cycle. Current method: <strong>{office.profile.payoutMethod || '—'}</strong></p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-[var(--border)] bg-[var(--card)] xl:col-span-2">
              <CardHeader className="pb-3"><CardTitle className="text-base">Quick Actions</CardTitle></CardHeader>
              <CardContent className="flex flex-wrap gap-3">
                <Button asChild><Link to="/member/wallet"><Wallet className="mr-2 size-4" />Open Wallet</Link></Button>
                <Button asChild variant="outline"><Link to="/member/activation-codes"><KeyRound className="mr-2 size-4" />Manage Codes</Link></Button>
                <Button asChild variant="outline"><Link to="/member/genealogy"><GitBranch className="mr-2 size-4" />Review Placement</Link></Button>
              </CardContent>
            </Card>
          </section>
        ) : null}

        {/* ── ACTIVATION CODES / REFERRAL ID ── */}
        {moduleId === 'activation-codes' && activationCodes ? (
          <section className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
            {/* Referral link card (Nogatu-style) */}
            <Card className="border-[var(--border)] bg-[var(--card)] xl:col-span-2">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <span className="flex size-10 items-center justify-center rounded-xl bg-amber-500/15">
                    <KeyRound className="size-5 text-amber-400" />
                  </span>
                  <div>
                    <CardTitle className="text-base">Your Referral Link</CardTitle>
                    <CardDescription className="text-xs">Share this link so prospects can self-register under your sponsorship.</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input readOnly value={`${typeof window !== 'undefined' ? window.location.origin : 'https://yorinternational.net'}/join/${office?.profile.referralCode ?? activationCodes.inventory[0]?.code ?? '—'}`} className="font-mono text-sm" />
                  <Button type="button" variant="outline" className="shrink-0" onClick={handleCopyCode}>
                    <Copy className="size-4" />
                  </Button>
                </div>
                <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3 text-sm text-[var(--muted-foreground)]">
                  Prospects still need a valid activation code — the server validates live placement policy before saving the account.
                </div>
                {activationCodes.inventory.filter(i => i.status === 'available').length ? (
                  <div>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-[var(--muted-foreground)]">
                      Available Activation Codes — {activationCodes.inventory.filter(i => i.status === 'available').length} available
                    </p>
                    <div className="space-y-2">
                      {activationCodes.inventory.filter(i => i.status === 'available').slice(0, 5).map((item) => (
                        <div key={item.code} className={['flex items-center justify-between gap-3 rounded-xl border px-4 py-3 transition', selectedCode === item.code ? 'border-amber-500/40 bg-amber-500/8' : 'border-[var(--border)] bg-[var(--background)] hover:bg-[var(--accent)]/40'].join(' ')}>
                          <div>
                            <p className="font-mono text-sm font-semibold text-[var(--foreground)]">{item.code}</p>
                            <p className="text-xs text-[var(--muted-foreground)]">{item.codeFamily} · {item.packageTier}</p>
                          </div>
                          <Button type="button" size="sm" variant="outline" className="h-8 text-xs" onClick={() => { setSelectedCode(item.code); void handleCopyCode(); }}>
                            Copy Code
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
              </CardContent>
            </Card>

            {/* Full inventory table */}
            <Card className="border-[var(--border)] bg-[var(--card)] xl:col-span-2">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Code Inventory</CardTitle>
                <CardDescription className="text-xs">All code families searchable; registration copy limited to eligible YOR CODES.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_180px_180px]">
                  <label className="grid gap-2 text-sm">
                    <span className="font-medium text-[var(--muted-foreground)]">Search</span>
                    <Input value={codeInventorySearch} onChange={(e) => setCodeInventorySearch(e.target.value)} placeholder="Code, family, package, status…" />
                  </label>
                  <FieldSelect label="Family" value={codeFamilyFilter} onChange={setCodeFamilyFilter} options={[{ label: 'All families', value: 'all' }, { label: 'YOR CODES', value: 'YOR CODES' }, { label: 'YOR MAINTENANCE', value: 'YOR MAINTENANCE' }, { label: 'YOR PERFUME', value: 'YOR PERFUME' }, { label: 'YOR VISION', value: 'YOR VISION' }]} />
                  <FieldSelect label="Status" value={codeStatusFilter} onChange={setCodeStatusFilter} options={[{ label: 'All statuses', value: 'all' }, { label: 'Available', value: 'available' }, { label: 'Used', value: 'used' }, { label: 'Transferred', value: 'transferred' }, { label: 'Expired', value: 'expired' }, { label: 'Generated', value: 'generated' }]} />
                </div>
                <ReportTableView table={{ title: `Inventory (${memberCodeRows.length})`, columns: [{ key: 'code', label: 'Code' }, { key: 'family', label: 'Family' }, { key: 'type', label: 'Type' }, { key: 'status', label: 'Status' }, { key: 'assignedTo', label: 'Assigned' }, { key: 'copyReady', label: 'Copy Ready' }], rows: visibleMemberCodeRows.map((item) => ({ code: item.code, family: item.codeFamily, type: item.accountType, status: item.status, assignedTo: item.assignedTo, copyReady: item.copyEnabled ? 'Yes' : 'No' })) }} />
                <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-[var(--muted-foreground)]">
                  <span>Page {Math.min(codeInventoryPage, codeInventoryTotalPages)} of {codeInventoryTotalPages} · {memberCodeRows.length} code(s)</span>
                  <div className="flex gap-2">
                    <Button type="button" variant="outline" size="sm" disabled={codeInventoryPage <= 1} onClick={() => setCodeInventoryPage((c) => Math.max(1, c - 1))}>Prev</Button>
                    <Button type="button" variant="outline" size="sm" disabled={codeInventoryPage >= codeInventoryTotalPages} onClick={() => setCodeInventoryPage((c) => Math.min(codeInventoryTotalPages, c + 1))}>Next</Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Code actions */}
            <Card className="border-[var(--border)] bg-[var(--card)]">
              <CardHeader className="pb-3"><CardTitle className="text-base">Code Actions</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <FieldSelect label="Select Code" value={selectedCode} onChange={setSelectedCode} options={activationCodes.inventory.filter((i) => i.codeFamily === 'YOR CODES').map((i) => ({ label: `${i.code} / ${i.packageTier}`, value: i.code }))} />
                <div className="space-y-3 rounded-xl border border-[var(--border)] bg-[var(--background)] p-4">
                  <label className="grid gap-2 text-sm">
                    <span className="font-medium text-[var(--muted-foreground)]">Transfer to username</span>
                    <div className="flex gap-2">
                      <Input value={transferSearchQuery} onChange={(e) => setTransferSearchQuery(e.target.value)} placeholder="Search username" onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); void handleSearchTransferTargets(); } }} />
                      <Button type="button" variant="outline" onClick={() => void handleSearchTransferTargets()} disabled={transferSearchLoading}>{transferSearchLoading ? '...' : 'Search'}</Button>
                    </div>
                  </label>
                  {transferSearchError ? <p className="text-xs text-amber-300">{transferSearchError}</p> : null}
                  {transferSearchResults.length ? (
                    <div className="grid gap-2">
                      {transferSearchResults.map((result) => (
                        <button key={result.username} type="button" className={['flex w-full items-center justify-between gap-3 rounded-lg border px-3 py-2 text-left text-sm transition', selectedTransferTarget?.username === result.username ? 'border-amber-500/40 bg-amber-500/8' : 'border-[var(--border)] hover:bg-[var(--accent)]/40'].join(' ')} onClick={() => { setSelectedTransferTarget(result); setTransferTarget(result.username); }}>
                          <span className="font-medium text-[var(--foreground)]">{result.username}</span>
                          <span className="text-xs text-[var(--muted-foreground)]">{result.packageTier}</span>
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  <Button type="button" variant="outline" onClick={handleCopyCode}>{copiedCode === selectedCode ? 'Copy Again' : 'Copy Code'}</Button>
                  <Button type="button" disabled={!transferTarget.trim()} onClick={handleTransferCodes}>Transfer Code</Button>
                  <Button type="button" variant="outline" className="sm:col-span-2" onClick={handleUpgradeCode}>Upgrade Account</Button>
                </div>
              </CardContent>
            </Card>
            <Card className="border-[var(--border)] bg-[var(--card)]">
              <CardHeader className="pb-3"><CardTitle className="text-base">Maintenance Use</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <label className="grid gap-2 text-sm">
                  <span className="font-medium text-[var(--muted-foreground)]">Maintenance code</span>
                  <Input value={maintenanceCode} onChange={(e) => setMaintenanceCode(e.target.value)} />
                </label>
                <Button type="button" className="w-full" onClick={handleMaintenanceCode}>Use Maintenance Code</Button>
                <ul className="space-y-2 text-xs leading-5 text-[var(--muted-foreground)]">
                  {activationCodes.hints.map((hint) => <li key={hint} className="flex gap-2"><span className="text-amber-400">·</span>{hint}</li>)}
                </ul>
              </CardContent>
            </Card>
          </section>
        ) : null}

        {/* ── UPGRADE / REGISTRATION ── */}
        {moduleId === 'upgrade-registration' && registrationReadiness ? (
          <section className="grid gap-4 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
            <Card className="border-[var(--border)] bg-[var(--card)]">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <span className="flex size-10 items-center justify-center rounded-xl bg-violet-500/15">
                    <Users className="size-5 text-violet-400" />
                  </span>
                  <div>
                    <CardTitle className="text-base">Registration Readiness</CardTitle>
                    <CardDescription className="text-xs">Reserve slot → share link → prospect registers.</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <InfoRow label="Sponsor" value={registrationReadiness.sponsor.username} />
                <InfoRow label="Referral Code" value={registrationReadiness.sponsor.referralCode} />
                <InfoRow label="Placement Username" value={registrationReadiness.placementPolicy.recommendation.placementUsername} />
                <InfoRow label="Placement Side" value={registrationReadiness.placementPolicy.recommendation.placementSide} />
                <div className="rounded-xl border border-[var(--border)] bg-[var(--background)] px-4 py-3 text-sm text-[var(--muted-foreground)]">
                  {registrationReadiness.placementPolicy.recommendation.note}
                </div>
                {registrationReadiness.activeReservation ? (
                  <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/8 px-4 py-3">
                    <p className="text-xs font-semibold uppercase tracking-widest text-emerald-400">Active Share Link</p>
                    <p className="mt-2 break-all text-sm text-[var(--foreground)]">{registrationReadiness.activeReservation.shareLink}</p>
                    <p className="mt-1 text-xs text-[var(--muted-foreground)]">Expires: {registrationReadiness.activeReservation.expiresAt}</p>
                  </div>
                ) : null}
                <div className="flex flex-wrap gap-2">
                  <Button type="button" className="flex-1" onClick={handleCreateShareLink} disabled={isShareLinkLoading}>
                    {isShareLinkLoading ? 'Creating…' : registrationReadiness.activeReservation ? 'Refresh & Copy Link' : 'Create & Copy Link'}
                  </Button>
                  {registrationReadiness.activeReservation ? (
                    <Button asChild variant="outline" className="shrink-0">
                      <Link to={registrationReadiness.activeReservation.shareLink.replace(/https?:\/\/(localhost:\d+|yor\.local|yorinternational\.net)/, '')}>Open<ArrowRight className="ml-1 size-4" /></Link>
                    </Button>
                  ) : null}
                  <Button asChild variant="outline" className="shrink-0">
                    <Link to="/member/genealogy"><GitBranch className="size-4" /></Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
            <Card className="border-[var(--border)] bg-[var(--card)]">
              <CardHeader className="pb-3"><CardTitle className="text-base">Pre-Registration Checklist</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {registrationReadiness.checklist.map((item) => (
                  <div key={item} className="flex items-start gap-3 rounded-xl border border-[var(--border)] bg-[var(--background)] px-4 py-3">
                    <ShieldCheck className="mt-0.5 size-4 shrink-0 text-emerald-400" />
                    <span className="text-sm leading-5 text-[var(--foreground)]">{item}</span>
                  </div>
                ))}
                <div className="rounded-xl border border-[var(--border)] bg-[var(--background)] px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-widest text-[var(--muted-foreground)]">Available Codes</p>
                  <p className="mt-1 text-sm text-[var(--foreground)]">
                    {registrationReadiness.availableCodes.map((i) => i.code).join(', ') || 'No available codes'}
                  </p>
                </div>
              </CardContent>
            </Card>
          </section>
        ) : null}

        {/* ── GENEALOGY ── */}
        {moduleId === 'genealogy' && binaryTree ? (
          <section className="grid gap-4">
            <Card className="border-[var(--border)] bg-[var(--card)]">
              <CardHeader className="gap-4 md:flex-row md:items-end md:justify-between">
                <div>
                  <CardTitle className="text-base">Placement Network</CardTitle>
                  <CardDescription className="text-xs">Review left and right slots before placement decisions.</CardDescription>
                </div>
                {treeRootUsername ? <Button type="button" variant="outline" size="sm" onClick={() => setTreeRootUsername('')}>Return To My Tree</Button> : null}
              </CardHeader>
              <CardContent>
                <GenealogyTree root={binaryTree.root} selectedNodeId={selectedTreeNodeId} onSelect={setSelectedTreeNodeId} onNavigateToNode={setTreeRootUsername} onOpenSlot={setPendingRegistrationSlot} />
              </CardContent>
            </Card>
            {/* Pairing stats — Nogatu-style */}
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <NogaStatCard icon={<Users className="size-4" />} color="blue" label="Left Accounts" value={String(leftAccountCount)} sub="left leg placements" />
              <NogaStatCard icon={<Users className="size-4" />} color="violet" label="Right Accounts" value={String(rightAccountCount)} sub="right leg placements" />
              <NogaStatCard icon={<TrendingUp className="size-4" />} color="emerald" label="Matched Points" value={String(matchedPoints)} sub="binary matched BP" />
              <NogaStatCard icon={<BarChart3 className="size-4" />} color="amber" label="SMB Total" value={String(matchedSalesmatch)} sub="sales match bonus" />
            </div>
            <div className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
              <Card className="border-[var(--border)] bg-[var(--card)]">
                <CardHeader className="pb-3"><CardTitle className="text-base">Tree Performance</CardTitle></CardHeader>
                <CardContent className="grid gap-3 md:grid-cols-2">
                  <InfoRow label="Strong Leg Carry" value={String(strongLegCarry)} />
                  <InfoRow label="Weak Leg Carry" value={String(weakLegCarry)} />
                  <InfoRow label="Left BP" value={String(binaryTree.root.leftPoints)} />
                  <InfoRow label="Right BP" value={String(binaryTree.root.rightPoints)} />
                </CardContent>
              </Card>
              {selectedTreeNode ? (
                <Card className="border-[var(--border)] bg-[var(--card)]">
                  <CardHeader className="pb-3"><CardTitle className="text-base">Node Focus</CardTitle></CardHeader>
                  <CardContent className="space-y-2">
                    <InfoRow label="Username" value={selectedTreeNode.username} />
                    <InfoRow label="Package" value={selectedTreeNode.packageTier} />
                    <InfoRow label="Placement" value={selectedTreeNode.placement} />
                    <InfoRow label="State" value={selectedTreeNode.accountStateLabel} />
                    <InfoRow label="Direct Referrals" value={String(selectedTreeNode.directReferrals)} />
                    <InfoRow label="Left BP" value={String(selectedTreeNode.leftPoints)} />
                    <InfoRow label="Right BP" value={String(selectedTreeNode.rightPoints)} />
                  </CardContent>
                </Card>
              ) : null}
            </div>
          </section>
        ) : null}

        {/* ── GET YOR FIVE BONUS ── */}
        {moduleId === 'get-five-bonus' && activeModule ? (
          <section className="grid gap-4 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
            {/* Stat strip */}
            <div className="grid grid-cols-2 gap-3 xl:col-span-2">
              <NogaStatCard icon={<Users className="size-4" />} color="amber" label="Direct Referrals" value={String(activeModule.table.rows[0]?.directSamePackage ?? 0)} sub="same-package directs" />
              <NogaStatCard icon={<Clock className="size-4" />} color="blue" label="Maintenance Points" value="0" sub="previous-month repurchase" />
              <NogaStatCard icon={<Gift className="size-4" />} color="emerald" label="Package Cash Claimable" value={getYorFiveRewardValue} sub={`${activeModule.table.rows[0]?.completedGroups ?? 0} package claim(s) ready`} />
              <NogaStatCard icon={<Gift className="size-4" />} color="violet" label="Get Yor Five Status" value="5 directs per group" sub="same-package grouping, company-funded reward" />
            </div>
            <Card className="border-[var(--border)] bg-[var(--card)]">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-widest text-[var(--muted-foreground)]">Get Yor Five Bonus — Package</p>
                    <CardTitle className="mt-1 text-base">Cash bonus for every 5 same-package direct referrals</CardTitle>
                  </div>
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/15">
                    <Gift className="size-5 text-amber-400" />
                  </span>
                </div>
                <p className="mt-2 text-xs text-[var(--muted-foreground)]">If you directly refer 5 members with the same package, you can submit one cash claim equal to that package amount.</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <DataPoint label="Current Package" value={String(activeModule.table.rows[0]?.package ?? office?.profile.packageTier ?? '-')} />
                <DataPoint label="Claimable Groups" value={String(activeModule.table.rows[0]?.completedGroups ?? 0)} />
                <DataPoint label="Target" value={String(activeModule.table.rows[0]?.target ?? 5)} />
                <div className="rounded-xl border border-[var(--border)] bg-[var(--background)] p-4">
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="text-[var(--muted-foreground)]">Milestone progress</span>
                    <strong className="text-[var(--foreground)]">
                      {Number(activeModule.table.rows[0]?.remainingToNextGroup ?? 0) === 0 ? 'ready to release' : `${activeModule.table.rows[0]?.remainingToNextGroup ?? 0} remaining`}
                    </strong>
                  </div>
                  <div className="h-2.5 overflow-hidden rounded-full bg-[var(--muted)]">
                    <div className="h-full rounded-full bg-gradient-to-r from-amber-500 to-amber-300" style={{ width: `${Math.min(100, ((Number(activeModule.table.rows[0]?.directSamePackage ?? 0) % Number(activeModule.table.rows[0]?.target ?? 5)) / Number(activeModule.table.rows[0]?.target ?? 5)) * 100)}%` }} />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-[var(--border)] bg-[var(--card)]">
              <CardHeader className="pb-3"><CardTitle className="text-base">Package Claim Values</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {Object.entries(getYorFivePackageClaimMap).map(([tier, value]) => (
                  <div key={tier} className="flex items-center justify-between gap-3 rounded-xl border border-[var(--border)] bg-[var(--background)] px-4 py-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-widest text-[var(--muted-foreground)]">{tier} Package</p>
                      <p className="mt-0.5 text-base font-semibold text-[var(--foreground)]">{value}</p>
                    </div>
                    <p className="text-xs text-[var(--muted-foreground)]">5 same-pkg directs</p>
                  </div>
                ))}
                <ReportTableView table={activeModule.table} />
              </CardContent>
            </Card>
          </section>
        ) : null}

        {/* ── BINARY CYCLE BONUS ── */}
        {moduleId === 'binary-cycle-bonus' && activeModule ? (
          <section className="grid gap-4">
            {/* Stat strip */}
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <NogaStatCard icon={<BarChart3 className="size-4" />} color="amber" label="Salesmatch Basis" value={String(activeModule.table.rows[0]?.salesmatch ?? 'PHP 0.00')} sub="paired volume this cycle" />
              <NogaStatCard icon={<TrendingUp className="size-4" />} color="blue" label="Your Cycle Rate" value={String(activeModule.table.rows[0]?.cycleRate ?? `${office?.profile.packageTier === 'Classic' ? '2%' : office?.profile.packageTier === 'Standard' ? '3%' : office?.profile.packageTier === 'Business' ? '4%' : office?.profile.packageTier === 'VIP' ? '5%' : '—'}`)} sub="package-based percentage" />
              <NogaStatCard icon={<Medal className="size-4" />} color="emerald" label="Weekly Cap" value={String(activeModule.table.rows[0]?.weeklyCap ?? '—')} sub="maximum per cycle week" />
              <NogaStatCard icon={<Trophy className="size-4" />} color="violet" label="Estimated Cycle Bonus" value={(() => { const s = mvpDashboard?.incomeStreams.find(x => x.streamId === 'binary-cycle'); return s ? `PHP ${s.simulatedNet.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : 'PHP 0.00'; })()} sub="sandbox simulation" />
            </div>
            <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
              <Card className="border-[var(--border)] bg-[var(--card)]">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <span className="flex size-10 items-center justify-center rounded-xl bg-amber-500/15">
                      <TrendingUp className="size-5 text-amber-400" />
                    </span>
                    <div>
                      <CardTitle className="text-base">Binary Cycle Bonus</CardTitle>
                      <CardDescription className="text-xs">Percentage earned on top of every qualified Salesmatch pairing.</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-xs text-[var(--muted-foreground)]">Classic, Standard, Business, and VIP members earn a package-based cycle bonus on each Salesmatch movement. Weekly cap applies.</p>
                  {[
                    { tier: 'Classic', rate: '2%', active: office?.profile.packageTier === 'Classic' },
                    { tier: 'Standard', rate: '3%', active: office?.profile.packageTier === 'Standard' },
                    { tier: 'Business', rate: '4%', active: office?.profile.packageTier === 'Business' },
                    { tier: 'VIP', rate: '5%', active: office?.profile.packageTier === 'VIP' },
                  ].map(({ tier, rate, active }) => (
                    <div key={tier} className={['flex items-center justify-between gap-3 rounded-xl border px-4 py-3 transition', active ? 'border-amber-500/40 bg-amber-500/8' : 'border-[var(--border)] bg-[var(--background)]'].join(' ')}>
                      <div className="flex items-center gap-2">
                        {active ? <span className="size-2 rounded-full bg-amber-400" /> : <span className="size-2 rounded-full bg-[var(--muted)]" />}
                        <p className="text-sm font-medium text-[var(--foreground)]">{tier}</p>
                      </div>
                      <strong className={active ? 'text-amber-600 dark:text-amber-400' : 'text-[var(--muted-foreground)]'}>{rate}</strong>
                    </div>
                  ))}
                </CardContent>
              </Card>
              <Card className="border-[var(--border)] bg-[var(--card)]">
                <CardHeader className="pb-3"><CardTitle className="text-base">Cycle Traceability</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  <InfoRow label="Package" value={String(activeModule.table.rows[0]?.package ?? office?.profile.packageTier ?? '—')} />
                  <InfoRow label="Left Points" value={String(binaryTree?.root.leftPoints ?? '—')} />
                  <InfoRow label="Right Points" value={String(binaryTree?.root.rightPoints ?? '—')} />
                  <InfoRow label="Matched Points" value={String(matchedPoints)} highlight />
                  <InfoRow label="Strong Leg Carry" value={String(strongLegCarry)} />
                  <InfoRow label="Status" value={String(activeModule.table.rows[0]?.status ?? 'Sandbox simulation')} />
                  <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3 text-xs text-[var(--muted-foreground)]">
                    Binary Cycle follows binary placement — spillover accounts qualify when placed on the left or right side used for pairing.
                  </div>
                  <ReportTableView table={activeModule.table} />
                </CardContent>
              </Card>
            </div>
          </section>
        ) : null}

        {/* ── SHADOW ACCOUNTS ── */}
        {moduleId === 'account-shadow-management' && activeModule && shadowAccounts ? (
          <section className="grid gap-4">
            {/* Header stat strip */}
            <div className="grid gap-3 sm:grid-cols-3">
              <NogaStatCard icon={<ShieldCheck className="size-4" />} color="amber" label="Owner" value={shadowAccounts.owner} sub="shadow account holder" />
              <NogaStatCard icon={<Users className="size-4" />} color="blue" label="Shadow Slots" value={String(shadowAccounts.accounts.length)} sub="reserved binary positions" />
              <NogaStatCard icon={<Globe className="size-4" />} color="violet" label="Active Shadow Path" value={shadowAccounts.accounts.some((a) => a.walletEnabled) ? 'Visible' : 'Reserved only'} sub="salesmatch PV support only" />
            </div>
            {/* Shadow slot cards */}
            <div className="grid gap-4 sm:grid-cols-2">
              {shadowAccounts.accounts.map((account) => (
                <div key={account.id} className="relative overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
                  <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-amber-500/40 via-amber-300/60 to-transparent" />
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--muted-foreground)]">Shadow Slot</p>
                      <p className="mt-1 text-lg font-bold tracking-tight text-[var(--foreground)]">{account.id}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1.5">
                      <Badge variant={account.placement === 'left' ? 'outline' : 'secondary'} className="text-[10px] uppercase tracking-widest">{account.placement}</Badge>
                      <Badge variant={account.state.includes('reserved') ? 'warning' : 'success'} className="text-[10px]">{account.state.replace('_', ' ')}</Badge>
                    </div>
                  </div>
                  <p className="mt-3 text-xs leading-5 text-[var(--muted-foreground)]">{account.note}</p>
                  <div className="mt-4 grid grid-cols-3 gap-2">
                    {[['Wallet', account.walletEnabled, 'emerald'], ['Unilevel', account.unilevelEnabled, 'blue'], ['Binary Cycle', account.binaryCycleEnabled, 'violet']].map(([label, enabled, clr]) => (
                      <div key={String(label)} className={['rounded-xl border p-2.5 text-center', enabled ? `border-${String(clr)}-500/30 bg-${String(clr)}-500/8` : 'border-[var(--border)] bg-[var(--background)]'].join(' ')}>
                        <p className={['text-[10px] font-semibold uppercase tracking-widest', enabled ? `text-${String(clr)}-400` : 'text-[var(--muted-foreground)]'].join(' ')}>{String(label)}</p>
                        <p className={['mt-1 text-xs font-bold', enabled ? `text-${String(clr)}-400` : 'text-[var(--muted-foreground)]'].join(' ')}>{enabled ? 'On' : 'Off'}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <Card className="border-[var(--border)] bg-[var(--card)]">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Shadow State Table</CardTitle>
                <CardDescription className="text-xs">Reserved and activated shadow-account visibility. Shadow nodes cannot earn wallet, Direct Referral, Unilevel, or Binary Cycle rights.</CardDescription>
              </CardHeader>
              <CardContent><ReportTableView table={activeModule.table} /></CardContent>
            </Card>
          </section>
        ) : null}

        {/* ── LIFESTYLE REWARDS ── */}
        {moduleId === 'lifestyle-rewards' && activeModule ? (
          <section className="grid gap-4 xl:grid-cols-2">
            <Card className="border-[var(--border)] bg-[var(--card)]">
              <CardHeader className="pb-3"><CardTitle className="text-base">Lifestyle Reward Monitor</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {[['Package', String(activeModule.table.rows[0]?.package ?? office?.profile.packageTier ?? '-')], ['Repeat Purchase Target', String(activeModule.table.rows[0]?.repeatPurchaseTarget ?? '-')], ['Current Repeat Purchase', String(activeModule.table.rows[0]?.currentRepeatPurchase ?? '-')], ['Progress', String(activeModule.table.rows[0]?.progressPercent ?? '-')], ['Projected Reward', String(activeModule.table.rows[0]?.projectedReward ?? '-')], ['Threshold Status', String(activeModule.table.rows[0]?.thresholdStatus ?? '-')]].map(([label, value]) => (
                  <div key={label} className="flex items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-sm odd:bg-[var(--accent)]/40">
                    <span className="text-[var(--muted-foreground)]">{label}</span>
                    <strong className="font-medium text-[var(--foreground)]">{value}</strong>
                  </div>
                ))}
              </CardContent>
            </Card>
            <Card className="border-[var(--border)] bg-[var(--card)]">
              <CardHeader className="pb-3"><CardTitle className="text-base">Reward Status</CardTitle></CardHeader>
              <CardContent><ReportTableView table={activeModule.table} /></CardContent>
            </Card>
          </section>
        ) : null}

        {/* ── UNILEVEL / RANKING PROGRESS ── */}
        {moduleId === 'unilevel-rank-progress' && activeModule ? (
          <section className="grid gap-4">
            {/* Stat strip */}
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <NogaStatCard icon={<BarChart3 className="size-4" />} color="amber" label="Gross Rankable Points" value={String(activeModule.table.rows[0]?.requiredPV ?? '—')} sub="self + full downline repurchases" />
              <NogaStatCard icon={<Medal className="size-4" />} color="blue" label="Current Rank" value="Unranked" sub="upgrade required to begin ranking" />
              <NogaStatCard icon={<TrendingUp className="size-4" />} color="emerald" label="Remaining Race Points" value="—" sub="fresh points for next rank" />
              <NogaStatCard icon={<Clock className="size-4" />} color="violet" label="Pending Claims" value="0" sub="cash release stays manual" />
            </div>
            <Card className="border-[var(--border)] bg-[var(--card)]">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Potential Income Ladder</CardTitle>
                <CardDescription className="text-xs">The Yor compensation plan presents potential income scaling across the ten-level ladder.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {activeModule.table.rows.map((row, index) => (
                  <div key={`${String(row.level)}-${index}`} className="rounded-2xl border border-[var(--border)] bg-[var(--background)] p-4">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-semibold uppercase tracking-widest text-[var(--muted-foreground)]">Level {String(row.level)}</p>
                      <Badge variant="outline" className="text-[10px]">{String(row.percent)}</Badge>
                    </div>
                    <p className="mt-2 text-lg font-semibold text-[var(--foreground)]">{String(row.potential)}</p>
                    <p className="mt-1 text-xs text-[var(--muted-foreground)]">{String(row.requiredPV)}</p>
                    <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[var(--muted)]">
                      <div className="h-full rounded-full bg-gradient-to-r from-amber-500 to-amber-300" style={{ width: `${Math.min(100, 18 + index * 12)}%` }} />
                    </div>
                    <p className="mt-2 text-[10px] uppercase tracking-widest text-[var(--muted-foreground)]">{String(row.status)}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </section>
        ) : null}

        {/* ── GLOBAL BONUS ── */}
        {moduleId === 'global-bonus-eligibility' && activeModule ? (
          <section className="grid gap-4 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
            <Card className="border-[var(--border)] bg-[var(--card)]">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <span className="flex size-10 items-center justify-center rounded-xl bg-violet-500/15">
                    <Globe className="size-5 text-violet-400" />
                  </span>
                  <div>
                    <CardTitle className="text-base">Global Bonus Gate</CardTitle>
                    <CardDescription className="text-xs">VIP-exclusive yearly global pool program.</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {[['Package', String(activeModule.table.rows[0]?.package ?? office?.profile.packageTier ?? '-')], ['Qualification', String(activeModule.table.rows[0]?.qualification ?? '-')], ['Pool', String(activeModule.table.rows[0]?.pool ?? '-')], ['Status', String(activeModule.table.rows[0]?.status ?? '-')]].map(([label, value]) => (
                  <div key={label} className="flex items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-sm odd:bg-[var(--accent)]/40">
                    <span className="text-[var(--muted-foreground)]">{label}</span>
                    <strong className="font-medium text-[var(--foreground)]">{value}</strong>
                  </div>
                ))}
              </CardContent>
            </Card>
            <Card className="border-[var(--border)] bg-[var(--card)]">
              <CardHeader className="pb-3"><CardTitle className="text-base">Maintenance Window</CardTitle></CardHeader>
              <CardContent><ReportTableView table={activeModule.table} /></CardContent>
            </Card>
          </section>
        ) : null}

        {/* ── DIRECT REFERRALS ── */}
        {moduleId === 'direct-referrals' && activeModule ? (() => {
          const rows = activeModule.table.rows;
          const DR_PAGE_SIZE = 10;
          const drTotalPages = Math.max(1, Math.ceil(rows.length / DR_PAGE_SIZE));
          const drPage = Math.min(directReferralPage, drTotalPages);
          const visibleRows = rows.slice((drPage - 1) * DR_PAGE_SIZE, drPage * DR_PAGE_SIZE);
          return (
            <section className="space-y-4">
              {/* Count header */}
              <div className="flex items-center gap-4">
                <div className="flex size-16 shrink-0 items-center justify-center rounded-2xl border border-blue-500/25 bg-blue-500/10 shadow-md shadow-blue-500/20">
                  <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">{rows.length}</span>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-[var(--muted-foreground)]">Direct Referrals</p>
                  <p className="text-lg font-bold text-[var(--foreground)]">Direct sponsorship list</p>
                  <p className="text-xs text-[var(--muted-foreground)]">Kept separate from the binary placement tree</p>
                </div>
              </div>
              <Card className="border-[var(--border)] bg-[var(--card)]">
                <CardHeader className="flex flex-row items-center justify-between pb-3">
                  <div>
                    <CardTitle className="text-base">Direct Referrals</CardTitle>
                    <CardDescription className="text-xs">Direct sponsorship list kept separate from the binary placement tree.</CardDescription>
                  </div>
                  <Badge variant="outline">Direct Referrals: {rows.length}</Badge>
                </CardHeader>
                <CardContent className="space-y-4 pt-0">
                  <div className="overflow-x-auto rounded-xl border border-[var(--border)]">
                    <table className="w-full min-w-[540px] text-sm">
                      <thead>
                        <tr className="border-b border-[var(--border)] bg-[var(--accent)]/40 text-left text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--muted-foreground)]">
                          {activeModule.table.columns.map((col) => (
                            <th key={col.key} className="px-4 py-3">{col.label}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {visibleRows.length ? visibleRows.map((row, i) => (
                          <tr key={i} className="border-b border-[var(--border)] transition last:border-0 hover:bg-[var(--accent)]/30">
                            {activeModule.table.columns.map((col) => (
                              <td key={col.key} className="px-4 py-3 text-[var(--foreground)]">
                                {col.key === 'accountStatus' || col.key === 'status' ? (
                                  <Badge variant={String(row[col.key]) === 'active' ? 'success' : 'outline'} className="text-[10px]">{String(row[col.key] ?? '—')}</Badge>
                                ) : (
                                  <span className={col.key === 'username' ? 'font-mono text-[var(--muted-foreground)]' : ''}>{String(row[col.key] ?? '—')}</span>
                                )}
                              </td>
                            ))}
                          </tr>
                        )) : (
                          <tr><td colSpan={activeModule.table.columns.length} className="px-4 py-8 text-center text-sm text-[var(--muted-foreground)]">No direct referrals yet.</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                  {rows.length > DR_PAGE_SIZE && (
                    <div className="flex items-center justify-between gap-3 text-sm text-[var(--muted-foreground)]">
                      <span>Page {drPage} of {drTotalPages} · {rows.length} referral(s)</span>
                      <div className="flex gap-2">
                        <Button type="button" variant="outline" size="sm" disabled={drPage <= 1} onClick={() => setDirectReferralPage((p) => Math.max(1, p - 1))}>Prev</Button>
                        <Button type="button" variant="outline" size="sm" disabled={drPage >= drTotalPages} onClick={() => setDirectReferralPage((p) => Math.min(drTotalPages, p + 1))}>Next</Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </section>
          );
        })() : null}

        {/* ── SALESMATCH BONUS ── */}
        {moduleId === 'salesmatch-bonus' && activeModule ? (
          <section className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <NogaStatCard icon={<BarChart3 className="size-4" />} color="amber" label="Left Points" value={String(binaryTree?.root.leftPoints ?? activeModule.table.rows[0]?.leftPoints ?? '—')} sub="left leg binary volume" />
              <NogaStatCard icon={<BarChart3 className="size-4" />} color="blue" label="Right Points" value={String(binaryTree?.root.rightPoints ?? activeModule.table.rows[0]?.rightPoints ?? '—')} sub="right leg binary volume" />
              <NogaStatCard icon={<TrendingUp className="size-4" />} color="emerald" label="Matched Points" value={String(matchedPoints)} sub="paired volume this cycle" />
              <NogaStatCard icon={<Trophy className="size-4" />} color="violet" label="Strong Leg Carry" value={String(strongLegCarry)} sub="carry forward to next cycle" />
            </div>
            <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
              <Card className="border-[var(--border)] bg-[var(--card)]">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <span className="flex size-10 items-center justify-center rounded-xl bg-amber-500/15">
                      <BarChart3 className="size-5 text-amber-600 dark:text-amber-400" />
                    </span>
                    <div>
                      <CardTitle className="text-base">Sales Match Pairing</CardTitle>
                      <CardDescription className="text-xs">Binary placement pairs left and right leg volume each cycle.</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <InfoRow label="Salesmatch Total" value={String(activeModule.table.rows[0]?.salesmatch ?? '—')} highlight />
                  <InfoRow label="Left Points" value={String(binaryTree?.root.leftPoints ?? '—')} />
                  <InfoRow label="Right Points" value={String(binaryTree?.root.rightPoints ?? '—')} />
                  <InfoRow label="Matched (Paired)" value={String(matchedPoints)} highlight />
                  <InfoRow label="Weak Leg Carry" value={String(weakLegCarry)} />
                  <InfoRow label="Strong Leg Carry" value={String(strongLegCarry)} />
                  <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3 text-xs text-[var(--muted-foreground)]">
                    Salesmatch pairs your weaker leg against your stronger leg. Unmatched volume carries forward to the next cycle.
                  </div>
                </CardContent>
              </Card>
              <Card className="border-[var(--border)] bg-[var(--card)]">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Pairing Traceability</CardTitle>
                  <CardDescription className="text-xs">Auto Accredited — no manual submission required.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/8 px-4 py-3 text-xs text-emerald-600 dark:text-emerald-400">
                    Salesmatch bonuses are automatically credited when a left-right pair is detected. Check transaction history for timestamped entries.
                  </div>
                  <InfoRow label="Package" value={String(activeModule.table.rows[0]?.package ?? office?.profile.packageTier ?? '—')} />
                  <InfoRow label="Account Type" value={String(activeModule.table.rows[0]?.accountType ?? 'PD')} />
                  <InfoRow label="Status" value={String(activeModule.table.rows[0]?.status ?? 'Sandbox simulation')} />
                  <ReportTableView table={activeModule.table} />
                </CardContent>
              </Card>
            </div>
          </section>
        ) : null}

        {/* ── GENERIC MODULE TABLE ── */}
        {showModuleTable && activeModule ? <ModuleTableCard module={activeModule} /> : null}

        {/* ── METRIC GRID (non-dashboard modules) ── */}
        {moduleId !== 'dashboard' && visibleMetrics.length ? <MetricGrid metrics={visibleMetrics} /> : null}

      </div>

      {moduleId === 'genealogy' && binaryTree && pendingRegistrationSlot ? (
        <RegistrationPageView
          key={`${pendingRegistrationSlot.parentUsername}-${pendingRegistrationSlot.side}`}
          variant="modal"
          initialContext={{
            referralCode: binaryTree.root.referralCode,
            placementSide: pendingRegistrationSlot.side,
            placementParentUsername: pendingRegistrationSlot.parentUsername,
            placementParentLabel: pendingRegistrationSlot.parentUsername
          }}
          onClose={() => setPendingRegistrationSlot(null)}
          onSubmitted={() => {
            setPendingRegistrationSlot(null);
            clearAllOfficeCache();
            setReloadNonce((current) => current + 1);
          }}
        />
      ) : null}
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

function EncashmentBreakdownRow({
  label,
  value,
  emphasize = false
}: {
  label: string;
  value: number;
  emphasize?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3 text-sm">
      <p className={emphasize ? 'font-semibold text-[var(--foreground)]' : 'text-[var(--muted-foreground)]'}>{label}</p>
      <p className={emphasize ? 'font-semibold text-[var(--foreground)]' : 'font-medium text-[var(--foreground)]'}>
        - {formatCurrency(value)}
      </p>
    </div>
  );
}

function EncashmentStatCard({
  label,
  value,
  highlight = false
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--background)]/75 p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted-foreground)]">{label}</p>
      <p className={highlight ? 'mt-3 text-lg font-semibold text-amber-600 dark:text-amber-200' : 'mt-3 text-base font-semibold text-[var(--foreground)]'}>
        {value}
      </p>
    </div>
  );
}

type NogaColor = 'amber' | 'blue' | 'emerald' | 'violet';

const nogaColorMap: Record<NogaColor, { bg: string; text: string; glow: string; border: string }> = {
  amber:   { bg: 'bg-amber-500/15',   text: 'text-amber-600 dark:text-amber-400',   glow: 'shadow-amber-500/20',   border: 'border-amber-500/25' },
  blue:    { bg: 'bg-blue-500/15',    text: 'text-blue-600 dark:text-blue-400',    glow: 'shadow-blue-500/20',    border: 'border-blue-500/25' },
  emerald: { bg: 'bg-emerald-500/15', text: 'text-emerald-600 dark:text-emerald-400', glow: 'shadow-emerald-500/20', border: 'border-emerald-500/25' },
  violet:  { bg: 'bg-violet-500/15',  text: 'text-violet-600 dark:text-violet-400',  glow: 'shadow-violet-500/20',  border: 'border-violet-500/25' },
};


function NogaStatCard({
  icon,
  color,
  label,
  value,
  sub
}: {
  icon: React.ReactNode;
  color: NogaColor;
  label: string;
  value: string;
  sub?: string;
}) {
  const { bg, text, glow, border } = nogaColorMap[color];
  return (
    <div className={`flex items-start gap-3 rounded-2xl border ${border} bg-[var(--card)] p-4 shadow-md ${glow}`}>
      <span className={`flex size-9 shrink-0 items-center justify-center rounded-xl ${bg} ${text}`}>
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-xs text-[var(--muted-foreground)]">{label}</p>
        <p className={`mt-0.5 truncate text-base font-semibold ${text}`}>{value}</p>
        {sub ? <p className="mt-0.5 truncate text-xs text-[var(--muted-foreground)]">{sub}</p> : null}
      </div>
    </div>
  );
}

function InfoRow({ label, value, highlight = false }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-sm odd:bg-[var(--accent)]/40">
      <span className="text-[var(--muted-foreground)]">{label}</span>
      <strong className={highlight ? 'font-semibold text-amber-600 dark:text-amber-300' : 'font-medium text-[var(--foreground)]'}>{value}</strong>
    </div>
  );
}

// ── Dashboard income stat cards (Nogatu-style) ─────────────────────────────

type DashboardCard = {
  label: string;
  value: string;
  sub: string;
  icon: React.ReactNode;
  color: NogaColor;
  href: string;
};

function DashboardIncomeGrid({
  office,
  mvpDashboard,
  modulePathById,
}: {
  office: MemberOfficeData | null;
  mvpDashboard: MemberMvpDashboardData | null;
  modulePathById: Map<string, string>;
}) {
  const streamValueMap: Record<string, string> = {};
  if (mvpDashboard) {
    for (const s of mvpDashboard.incomeStreams) {
      streamValueMap[s.streamId] = `PHP ${s.simulatedNet.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
  }

  const totalCash = mvpDashboard
    ? `PHP ${mvpDashboard.incomeStreams.reduce((sum, s) => sum + s.simulatedNet, 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    : '—';

  const cards: DashboardCard[] = [
    {
      label: 'Total Cash Incentives',
      value: totalCash,
      sub: 'Open e-wallet breakdown',
      icon: <Wallet className="size-5" />,
      color: 'amber',
      href: modulePathById.get('wallet') ?? '/member/wallet',
    },
    {
      label: 'Current Cash Balance',
      value: office?.wallet.availableBalance ?? '—',
      sub: 'View wallet balance details',
      icon: <CreditCard className="size-5" />,
      color: 'amber',
      href: modulePathById.get('wallet') ?? '/member/wallet',
    },
    {
      label: 'Direct Referral',
      value: streamValueMap['direct-referral'] ?? 'PHP 0.00',
      sub: 'See who triggered this income',
      icon: <Users className="size-5" />,
      color: 'blue',
      href: modulePathById.get('direct-referrals') ?? '/earn/direct-referral',
    },
    {
      label: 'Sales Matched Bonus',
      value: streamValueMap['salesmatch'] ?? 'PHP 0.00',
      sub: 'Open pairing reports',
      icon: <BarChart3 className="size-5" />,
      color: 'amber',
      href: modulePathById.get('salesmatch-bonus') ?? '/member/genealogy',
    },
    {
      label: 'Uni-Level',
      value: streamValueMap['unilevel'] ?? 'PHP 0.00',
      sub: 'View eligibility and payout history',
      icon: <TrendingUp className="size-5" />,
      color: 'amber',
      href: modulePathById.get('unilevel-rank-progress') ?? '/earn/unilevel',
    },
    {
      label: 'Leadership Bonus',
      value: streamValueMap['leadership'] ?? 'PHP 0.00',
      sub: 'See leadership bonus entries',
      icon: <Star className="size-5" />,
      color: 'amber',
      href: modulePathById.get('leadership') ?? '/earn',
    },
    {
      label: 'Get Yor Five Bonus',
      value: streamValueMap['get-five'] ?? 'PHP 0.00',
      sub: 'Open Get Yor Five bonus page',
      icon: <Gift className="size-5" />,
      color: 'amber',
      href: modulePathById.get('get-five-bonus') ?? '/earn/get-five',
    },
    {
      label: 'Ranking Bonus',
      value: streamValueMap['ranking'] ?? 'PHP 0.00',
      sub: 'See ranking bonus entries',
      icon: <Trophy className="size-5" />,
      color: 'amber',
      href: modulePathById.get('unilevel-rank-progress') ?? '/earn/unilevel',
    },
    {
      label: 'Left Accounts',
      value: '—',
      sub: 'Open pairing reports',
      icon: <GitBranch className="size-5" />,
      color: 'blue',
      href: modulePathById.get('genealogy') ?? '/member/genealogy',
    },
    {
      label: 'Right Accounts',
      value: '—',
      sub: 'Open pairing reports',
      icon: <GitBranch className="size-5" />,
      color: 'violet',
      href: modulePathById.get('genealogy') ?? '/member/genealogy',
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {cards.map((card) => {
        const { bg, text, glow, border } = nogaColorMap[card.color];
        return (
          <Link
            key={card.label}
            to={card.href}
            className={`group relative flex flex-col gap-3 overflow-hidden rounded-2xl border ${border} bg-[var(--card)] p-5 shadow-md ${glow} transition-all duration-200 hover:scale-[1.015] hover:shadow-lg`}
          >
            {/* Subtle top glow line */}
            <div className={`absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-current to-transparent opacity-40 ${text}`} />
            <div className="flex items-start justify-between gap-2">
              <span className={`flex size-11 shrink-0 items-center justify-center rounded-xl ${bg} ${text} shadow-sm`}>
                {card.icon}
              </span>
              <ChevronRight className={`size-4 transition group-hover:translate-x-0.5 ${text} opacity-60`} />
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-[var(--muted-foreground)]">{card.label}</p>
              <p className={`mt-1 text-xl font-bold tracking-tight ${text}`}>{card.value}</p>
            </div>
            <p className={`text-xs font-medium ${text} opacity-75 transition group-hover:opacity-100`}>{card.sub}</p>
          </Link>
        );
      })}
    </div>
  );
}

// ── E-Wallet two-tab view ──────────────────────────────────────────────────

function WalletView({
  walletDetail,
  encashAmountInput,
  encashAmount,
  encashPreviewError,
  isEncashPreviewLoading,
  renderedEncashmentPreview,
  onEncashAmountChange,
  onEncashAmountBlur,
  onSubmitEncashment,
}: {
  walletDetail: MemberWalletDetail;
  encashAmountInput: string;
  encashAmount: number;
  encashPreview: EncashmentPreview | null;
  encashPreviewError: string | null;
  isEncashPreviewLoading: boolean;
  renderedEncashmentPreview: EncashmentPreview;
  onEncashAmountChange: (v: string) => void;
  onEncashAmountBlur: () => void;
  onSubmitEncashment: () => void;
}) {
  const [activeTab, setActiveTab] = useState<'main' | 'lifestyle'>('main');

  const mainStreams = walletDetail.incomeBreakdown.filter(
    (s) => s.walletType.toLowerCase() !== 'lifestyle'
  );
  const lifestyleStreams = walletDetail.incomeBreakdown.filter(
    (s) => s.walletType.toLowerCase() === 'lifestyle'
  );
  const lifestyleBalance = lifestyleStreams.reduce((sum, s) => sum + s.amount, 0);
  const lifestyleThreshold = 1000;

  return (
    <section className="space-y-4">
      {/* Tab switcher */}
      <div className="flex gap-1 rounded-xl border border-[var(--border)] bg-[var(--accent)] p-1">
        <button
          type="button"
          onClick={() => setActiveTab('main')}
          className={[
            'flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition',
            activeTab === 'main'
              ? 'bg-[var(--card)] text-[var(--foreground)] shadow-sm'
              : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]',
          ].join(' ')}
        >
          <Wallet className="size-4" />
          Main Wallet
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('lifestyle')}
          className={[
            'flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition',
            activeTab === 'lifestyle'
              ? 'bg-[var(--card)] text-[var(--foreground)] shadow-sm'
              : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]',
          ].join(' ')}
        >
          <Star className="size-4" />
          Lifestyle Bonus Wallet
        </button>
      </div>

      {/* ── MAIN WALLET TAB ── */}
      {activeTab === 'main' ? (
        <div className="grid gap-4 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <NogaStatCard icon={<Wallet className="size-4" />} color="amber" label="Available" value={formatCurrency(walletDetail.summary.availableBalance)} />
              <NogaStatCard icon={<Clock className="size-4" />} color="blue" label="Pending" value={formatCurrency(walletDetail.summary.pendingBalance)} />
              <NogaStatCard icon={<CreditCard className="size-4" />} color="emerald" label="CD Balance" value={formatCurrency(walletDetail.summary.cdBalance)} />
              <NogaStatCard icon={<Star className="size-4" />} color="violet" label="Payout Method" value={walletDetail.summary.payoutMethod} />
            </div>
            <Card className="border-[var(--border)] bg-[var(--card)]">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Income Breakdown</CardTitle>
                <CardDescription className="text-xs">Main wallet income streams credited to your encashable balance.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 pt-0">
                {mainStreams.length ? mainStreams.map((stream) => (
                  <div key={stream.streamId} className="flex items-center justify-between gap-3 rounded-xl border border-[var(--border)] bg-[var(--background)] px-4 py-3">
                    <div>
                      <p className="text-sm font-medium text-[var(--foreground)]">{stream.label}</p>
                      <Badge variant="outline" className="mt-1 text-[10px] uppercase tracking-widest">{stream.walletType} wallet</Badge>
                    </div>
                    <p className="text-sm font-semibold text-amber-600 dark:text-amber-400">{formatCurrency(stream.amount)}</p>
                  </div>
                )) : (
                  <p className="text-sm text-[var(--muted-foreground)]">No main wallet income entries yet.</p>
                )}
              </CardContent>
            </Card>
          </div>
          <div className="space-y-4">
            <Card className="border-[var(--border)] bg-[var(--card)]">
              <CardHeader>
                <CardTitle className="text-base">Encashment Preview</CardTitle>
                <CardDescription className="text-xs">10% tax · PHP 50 processing fee · 5% system retainer · {walletDetail.summary.payoutSchedule.toLowerCase()}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-3">
                  <EncashmentStatCard label="Available" value={formatCurrency(walletDetail.summary.availableBalance)} />
                  <EncashmentStatCard label="Requested" value={formatCurrency(renderedEncashmentPreview.requestedAmount || encashAmount)} />
                  <EncashmentStatCard label="Net Receivable" value={formatCurrency(renderedEncashmentPreview.netReceivable)} highlight />
                </div>
                <div className="rounded-xl border border-[var(--border)] bg-[var(--background)] p-4">
                  <label htmlFor="encash-amount" className="grid gap-2 text-sm">
                    <span className="font-medium text-[var(--muted-foreground)]">Requested amount</span>
                    <Input
                      id="encash-amount"
                      type="text"
                      inputMode="decimal"
                      placeholder="10,000"
                      value={encashAmountInput}
                      onChange={(e) => onEncashAmountChange(e.target.value)}
                      onBlur={onEncashAmountBlur}
                    />
                  </label>
                  <div className="mt-2 flex justify-between text-xs text-[var(--muted-foreground)]">
                    <span>Live preview updates as you type</span>
                    <span className={isEncashPreviewLoading ? 'text-amber-300' : ''}>{isEncashPreviewLoading ? 'Updating...' : 'Synced'}</span>
                  </div>
                </div>
                <div className="space-y-2 rounded-xl border border-[var(--border)] bg-[var(--background)] p-4">
                  <EncashmentBreakdownRow label="10% Tax" value={renderedEncashmentPreview.tax} />
                  <EncashmentBreakdownRow label="Processing Fee" value={renderedEncashmentPreview.processingFee} />
                  <EncashmentBreakdownRow label="System Retainer (5%)" value={renderedEncashmentPreview.systemRetainer} />
                  <EncashmentBreakdownRow label="CD Deduction" value={renderedEncashmentPreview.cdDeduction} />
                  <div className="border-t border-[var(--border)] pt-2">
                    <EncashmentBreakdownRow label="Total Deductions" value={renderedEncashmentPreview.totalDeductions} emphasize />
                  </div>
                </div>
                <div className={['rounded-xl border px-4 py-3 text-sm', encashPreviewError ? 'border-red-500/40 bg-red-500/10 text-red-300' : renderedEncashmentPreview.sufficientBalance ? 'border-[var(--border)] bg-[var(--background)] text-[var(--muted-foreground)]' : 'border-amber-500/40 bg-amber-500/10 text-amber-200'].join(' ')}>
                  {encashPreviewError ?? renderedEncashmentPreview.note}
                </div>
                <Button
                  type="button"
                  className="w-full"
                  onClick={onSubmitEncashment}
                  disabled={encashAmount <= 0 || isEncashPreviewLoading || Boolean(encashPreviewError) || !renderedEncashmentPreview.sufficientBalance}
                >
                  Submit Encashment Request
                </Button>
              </CardContent>
            </Card>
          </div>
          <Card className="border-[var(--border)] bg-[var(--card)] xl:col-span-2">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Wallet Ledger</CardTitle>
              <CardDescription className="text-xs">Append-only wallet movement and balance-after values.</CardDescription>
            </CardHeader>
            <CardContent>
              <ReportTableView table={{ title: 'Wallet Ledger', columns: [{ key: 'walletType', label: 'Wallet' }, { key: 'entryType', label: 'Entry' }, { key: 'sourceReference', label: 'Source' }, { key: 'creditAmount', label: 'Credit' }, { key: 'debitAmount', label: 'Debit' }, { key: 'balanceAfter', label: 'Balance' }, { key: 'status', label: 'Status' }], rows: walletDetail.ledger.filter(e => e.walletType.toLowerCase() !== 'lifestyle').map((e) => ({ walletType: e.walletType, entryType: e.entryType, sourceReference: e.sourceReference, creditAmount: formatCurrency(e.creditAmount), debitAmount: formatCurrency(e.debitAmount), balanceAfter: formatCurrency(e.balanceAfter), status: e.status })) }} />
            </CardContent>
          </Card>
        </div>
      ) : null}

      {/* ── LIFESTYLE BONUS WALLET TAB ── */}
      {activeTab === 'lifestyle' ? (
        <div className="grid gap-4 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
          <div className="space-y-4">
            {/* Lifestyle balance + threshold */}
            <Card className="border-[var(--border)] bg-[var(--card)]">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <span className="flex size-10 items-center justify-center rounded-xl bg-emerald-500/15">
                    <Star className="size-5 text-emerald-400" />
                  </span>
                  <div>
                    <CardTitle className="text-base">Lifestyle Bonus Wallet</CardTitle>
                    <CardDescription className="text-xs">Separate from main wallet · 3% public display · 1% backend payable</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <NogaStatCard icon={<Star className="size-4" />} color="emerald" label="Lifestyle Balance" value={formatCurrency(lifestyleBalance)} sub="repeat-purchase credits" />
                  <NogaStatCard icon={<TrendingUp className="size-4" />} color="amber" label="Threshold" value={formatCurrency(lifestyleThreshold)} sub="Classic daily cap" />
                </div>
                <div>
                  <div className="mb-1.5 flex items-center justify-between text-xs">
                    <span className="text-[var(--muted-foreground)]">Threshold progress</span>
                    <span className="font-medium text-[var(--foreground)]">{formatCurrency(lifestyleBalance)} / {formatCurrency(lifestyleThreshold)}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-[var(--muted)]">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-300 transition-all"
                      style={{ width: `${Math.min(100, (lifestyleBalance / lifestyleThreshold) * 100)}%` }}
                    />
                  </div>
                  <p className="mt-1.5 text-xs text-[var(--muted-foreground)]">
                    {lifestyleBalance >= lifestyleThreshold
                      ? 'Threshold reached — lifestyle bonus ready for release.'
                      : `${formatCurrency(lifestyleThreshold - lifestyleBalance)} remaining to reach threshold.`}
                  </p>
                </div>
                <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3 text-xs text-[var(--muted-foreground)]">
                  <strong className="text-emerald-400">Business Rule LFR-01:</strong> Lifestyle rewards stay in a separate wallet. The public presentation shows 3% of repeat-purchase product value. Backend credits 1% into this wallet. Threshold for Classic is PHP 1,000 daily / PHP 30,000 monthly.
                </div>
              </CardContent>
            </Card>

            {/* Lifestyle income streams */}
            <Card className="border-[var(--border)] bg-[var(--card)]">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Lifestyle Income Entries</CardTitle>
                <CardDescription className="text-xs">Repeat-purchase rewards credited to this wallet.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 pt-0">
                {lifestyleStreams.length ? lifestyleStreams.map((stream) => (
                  <div key={stream.streamId} className="flex items-center justify-between gap-3 rounded-xl border border-[var(--border)] bg-[var(--background)] px-4 py-3">
                    <div>
                      <p className="text-sm font-medium text-[var(--foreground)]">{stream.label}</p>
                      <Badge variant="outline" className="mt-1 text-[10px] uppercase tracking-widest">lifestyle wallet</Badge>
                    </div>
                    <p className="text-sm font-semibold text-emerald-400">{formatCurrency(stream.amount)}</p>
                  </div>
                )) : (
                  <p className="text-sm text-[var(--muted-foreground)]">No lifestyle wallet entries yet. Earn by making repeat-purchase product repurchases.</p>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            <Card className="border-[var(--border)] bg-[var(--card)]">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">How Lifestyle Rewards Work</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  ['Source', 'Repeat-purchase product repurchases'],
                  ['Public Rate', '3% of product value (marketing display)'],
                  ['Backend Payable', '1% credited to this wallet'],
                  ['Threshold (Classic)', 'PHP 1,000 daily / PHP 30,000 monthly'],
                  ['Release', 'Manual — pending admin review'],
                  ['Wallet Type', 'Separate from main encashable wallet'],
                ].map(([label, value]) => (
                  <div key={label} className="flex items-start justify-between gap-3 rounded-lg px-3 py-2.5 text-sm odd:bg-[var(--accent)]/40">
                    <span className="text-[var(--muted-foreground)]">{label}</span>
                    <strong className="text-right font-medium text-[var(--foreground)]">{value}</strong>
                  </div>
                ))}
              </CardContent>
            </Card>
            <Card className="border-[var(--border)] bg-[var(--card)]">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Lifestyle Ledger</CardTitle>
                <CardDescription className="text-xs">Lifestyle wallet entries only.</CardDescription>
              </CardHeader>
              <CardContent>
                <ReportTableView table={{ title: 'Lifestyle Ledger', columns: [{ key: 'entryType', label: 'Entry' }, { key: 'sourceReference', label: 'Source' }, { key: 'creditAmount', label: 'Credit' }, { key: 'balanceAfter', label: 'Balance' }, { key: 'status', label: 'Status' }], rows: walletDetail.ledger.filter(e => e.walletType.toLowerCase() === 'lifestyle').map((e) => ({ entryType: e.entryType, sourceReference: e.sourceReference, creditAmount: formatCurrency(e.creditAmount), balanceAfter: formatCurrency(e.balanceAfter), status: e.status })) }} />
              </CardContent>
            </Card>
          </div>
        </div>
      ) : null}
    </section>
  );
}
