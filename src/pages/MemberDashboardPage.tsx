import { useCallback, useEffect, useMemo, useState } from 'react';
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
import { readOfficeCache, warmOfficeCache } from '@/lib/office-cache';
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
  'global-bonus-eligibility'
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

  return 1 + node.children.reduce((total, child) => total + countSubtreeNodes(child), 0);
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
      footerLinks={[
        { label: 'Public registration page', href: '/register' },
        { label: 'Products and packages', href: '/packages' }
      ]}
    >
      <div className="member-office-flow space-y-6">

        {/* ── DASHBOARD ── */}
        {moduleId === 'dashboard' ? (
          <>
            {/* Wallet stat strip */}
            {office ? (
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <NogaStatCard icon={<Wallet className="size-4" />} color="amber" label="Available Wallet" value={office.wallet.availableBalance} sub={office.wallet.payoutSchedule} />
                <NogaStatCard icon={<Users className="size-4" />} color="blue" label="Direct Referrals" value={String(office.metrics.find(m => m.label.toLowerCase().includes('direct referral'))?.value ?? '—')} sub="your network" />
                <NogaStatCard icon={<TrendingUp className="size-4" />} color="emerald" label="Package Tier" value={office.profile.packageTier} sub={office.profile.accountStatus} />
                <NogaStatCard icon={<BarChart3 className="size-4" />} color="violet" label="Payout Method" value={office.profile.payoutMethod} sub="payout channel" />
              </div>
            ) : null}

            {/* 8 Income Streams */}
            {mvpDashboard?.incomeStreams.length ? (
              <div>
                <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted-foreground)]">8 Ways Of Wealth</p>
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                  {mvpDashboard.incomeStreams.map((stream) => {
                    const routeConfig = memberIncomeRouteMap[stream.streamId];
                    const workspaceHref = routeConfig
                      ? (modulePathById.get(routeConfig.memberModuleId) ?? routeConfig.publicHref)
                      : '/earn';
                    return (
                      <div key={stream.streamId} className="flex flex-col gap-3 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 transition hover:shadow-sm">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-semibold leading-5 text-[var(--foreground)]">{stream.label}</p>
                          <Badge variant="outline" className="shrink-0 text-[10px]">{stream.writeStatus}</Badge>
                        </div>
                        <p className="flex-1 text-xs leading-5 text-[var(--muted-foreground)]">{stream.statusLabel}</p>
                        <div className="flex items-center gap-2">
                          <Button asChild size="sm" className="h-8 flex-1 rounded-lg text-xs">
                            <Link to={workspaceHref}>Open<ChevronRight className="ml-1 size-3" /></Link>
                          </Button>
                          {routeConfig ? (
                            <Link to={routeConfig.publicHref} className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-[var(--border)] text-[var(--muted-foreground)] transition hover:text-[var(--foreground)]">
                              <ArrowUpRight className="size-3.5" />
                            </Link>
                          ) : null}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : null}

            {/* Quick links */}
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {quickLinks.map((link) => (
                <Link key={link.href} to={link.href} className="group flex items-start gap-4 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 transition hover:border-[var(--yor-copper)]/40 hover:shadow-sm">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[var(--accent)]">
                    <LayoutDashboard className="size-4 text-[var(--muted-foreground)] group-hover:text-[var(--yor-copper)]" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-[var(--foreground)] group-hover:text-[var(--yor-copper)]">{link.title}</p>
                    <p className="mt-0.5 text-xs leading-5 text-[var(--muted-foreground)]">{link.body}</p>
                  </div>
                </Link>
              ))}
            </div>

            {/* Account snapshot */}
            {office ? (
              <div className="grid gap-4 xl:grid-cols-2">
                <Card className="border-[var(--border)] bg-[var(--card)]">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Account Snapshot</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {Object.entries(office.profile).map(([key, value]) => (
                      <div key={key} className="flex items-center justify-between gap-3 rounded-lg px-3 py-2 text-sm odd:bg-[var(--accent)]/40">
                        <span className="text-[var(--muted-foreground)]">{key}</span>
                        <strong className="text-right font-medium text-[var(--foreground)]">{value}</strong>
                      </div>
                    ))}
                  </CardContent>
                </Card>
                {summary ? (
                  <Card className="border-[var(--border)] bg-[var(--card)]">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">Current Status</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {Object.entries(summary.status).map(([key, value]) => (
                        <div key={key} className="flex items-center justify-between gap-3 rounded-lg px-3 py-2 text-sm odd:bg-[var(--accent)]/40">
                          <span className="text-[var(--muted-foreground)]">{key}</span>
                          <strong className="text-right font-medium text-[var(--foreground)]">{value}</strong>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                ) : null}
              </div>
            ) : null}
            {showDashboardActions ? <GatedActionsCard actions={branchNotes} /> : null}
          </>
        ) : null}

        {/* ── WALLET ── */}
        {moduleId === 'wallet' && walletDetail ? (
          <section className="grid gap-4 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
            <div className="space-y-4">
              {/* Wallet stat strip */}
              <div className="grid grid-cols-2 gap-3">
                <NogaStatCard icon={<Wallet className="size-4" />} color="amber" label="Available" value={formatCurrency(walletDetail.summary.availableBalance)} />
                <NogaStatCard icon={<Clock className="size-4" />} color="blue" label="Pending" value={formatCurrency(walletDetail.summary.pendingBalance)} />
                <NogaStatCard icon={<CreditCard className="size-4" />} color="emerald" label="CD Balance" value={formatCurrency(walletDetail.summary.cdBalance)} />
                <NogaStatCard icon={<Star className="size-4" />} color="violet" label="Payout" value={walletDetail.summary.payoutMethod} />
              </div>
              <Card className="border-[var(--border)] bg-[var(--card)]">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Income Breakdown</CardTitle>
                  <CardDescription className="text-xs">Every approved income stream feeding your wallet buckets.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2 pt-0">
                  {walletDetail.incomeBreakdown.map((stream) => (
                    <div key={stream.streamId} className="flex items-center justify-between gap-3 rounded-xl border border-[var(--border)] bg-[var(--background)] px-4 py-3">
                      <div>
                        <p className="text-sm font-medium text-[var(--foreground)]">{stream.label}</p>
                        <Badge variant="outline" className="mt-1 text-[10px] uppercase tracking-widest">{stream.walletType} wallet</Badge>
                      </div>
                      <p className="text-sm font-semibold" style={{color:'var(--yor-gold, #c9a227)'}}>{formatCurrency(stream.amount)}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
            <div className="space-y-4">
              <Card className="border-[var(--border)] bg-[var(--card)]">
                <CardHeader>
                  <CardTitle>Encashment Preview</CardTitle>
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
                      <Input id="encash-amount" type="text" inputMode="decimal" placeholder="10,000" value={encashAmountInput}
                        onChange={(e) => { setEncashPreviewError(null); setEncashAmountInput(normalizeEncashmentInput(e.target.value)); }}
                        onBlur={() => { const p = parseEncashmentAmount(encashAmountInput); if (p && p > 0) setEncashAmountInput(formatEncashmentInput(p)); }}
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
                    <EncashmentBreakdownRow label="System Retainer" value={renderedEncashmentPreview.systemRetainer} />
                    <EncashmentBreakdownRow label="CD Deduction" value={renderedEncashmentPreview.cdDeduction} />
                    <div className="border-t border-[var(--border)] pt-2">
                      <EncashmentBreakdownRow label="Total Deductions" value={renderedEncashmentPreview.totalDeductions} emphasize />
                    </div>
                  </div>
                  <div className={['rounded-xl border px-4 py-3 text-sm', encashPreviewError ? 'border-red-500/40 bg-red-500/10 text-red-300' : renderedEncashmentPreview.sufficientBalance ? 'border-[var(--border)] bg-[var(--background)] text-[var(--muted-foreground)]' : 'border-amber-500/40 bg-amber-500/10 text-amber-200'].join(' ')}>
                    {encashPreviewError ?? renderedEncashmentPreview.note}
                  </div>
                  <Button type="button" className="w-full" onClick={handleSubmitEncashment} disabled={encashAmount <= 0 || isEncashPreviewLoading || Boolean(encashPreviewError) || !renderedEncashmentPreview.sufficientBalance}>
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
                <ReportTableView table={{ title: 'Wallet Ledger', columns: [{ key: 'walletType', label: 'Wallet' }, { key: 'entryType', label: 'Entry' }, { key: 'sourceReference', label: 'Source' }, { key: 'creditAmount', label: 'Credit' }, { key: 'debitAmount', label: 'Debit' }, { key: 'balanceAfter', label: 'Balance' }, { key: 'status', label: 'Status' }], rows: walletDetail.ledger.map((e) => ({ walletType: e.walletType, entryType: e.entryType, sourceReference: e.sourceReference, creditAmount: formatCurrency(e.creditAmount), debitAmount: formatCurrency(e.debitAmount), balanceAfter: formatCurrency(e.balanceAfter), status: e.status })) }} />
              </CardContent>
            </Card>
          </section>
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
                {transactions.map((transaction) => (
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
                  <div className="rounded-xl border border-[var(--border)] bg-[var(--background)] p-4">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-[var(--muted-foreground)]">Trace notes</p>
                    <ul className="space-y-2">
                      {transactionDetail.transaction.support.notes.map((note) => (
                        <li key={note} className="flex items-start gap-2 text-sm text-[var(--muted-foreground)]">
                          <Check className="mt-0.5 size-3.5 shrink-0 text-emerald-400" />{note}
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            ) : null}
          </section>
        ) : null}

        {/* ── ACCOUNT DETAILS ── */}
        {moduleId === 'account-details' && office ? (
          <section className="grid gap-4 xl:grid-cols-2">
            <Card className="border-[var(--border)] bg-[var(--card)]">
              <CardHeader className="pb-3"><CardTitle className="text-base">Profile</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {[['Username', office.profile.username], ['Full Name', office.profile.fullName], ['Email', summary?.user.email ?? '—'], ['Package', office.profile.packageTier], ['Account Status', office.profile.accountStatus]].map(([label, value]) => (
                  <div key={label} className="flex items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-sm odd:bg-[var(--accent)]/40">
                    <span className="text-[var(--muted-foreground)]">{label}</span>
                    <strong className="font-medium text-[var(--foreground)]">{value}</strong>
                  </div>
                ))}
              </CardContent>
            </Card>
            <Card className="border-[var(--border)] bg-[var(--card)]">
              <CardHeader className="pb-3"><CardTitle className="text-base">Sponsor & Payout</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {[['Referral Code', office.profile.referralCode], ['Sponsor Code', office.profile.sponsorCode], ['Payout Method', office.profile.payoutMethod], ['Payout Schedule', office.wallet.payoutSchedule], ['Available Wallet', office.wallet.availableBalance]].map(([label, value]) => (
                  <div key={label} className="flex items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-sm odd:bg-[var(--accent)]/40">
                    <span className="text-[var(--muted-foreground)]">{label}</span>
                    <strong className="font-medium text-[var(--foreground)]">{value}</strong>
                  </div>
                ))}
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
                  <Input readOnly value={`yor.app/join/${office?.profile.referralCode ?? activationCodes.inventory[0]?.code ?? '—'}`} className="font-mono text-sm" />
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
                      <Input value={transferSearchQuery} onChange={(e) => setTransferSearchQuery(e.target.value.toUpperCase())} placeholder="Search username" onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); void handleSearchTransferTargets(); } }} />
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
                      <Link to={registrationReadiness.activeReservation.shareLink.replace('https://yor.local', '')}>Open<ArrowRight className="ml-1 size-4" /></Link>
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

        {/* ── GET FIVE / HI-FIVE BONUS ── */}
        {moduleId === 'get-five-bonus' && activeModule ? (
          <section className="grid gap-4 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
            {/* Stat strip */}
            <div className="grid grid-cols-2 gap-3 xl:col-span-2">
              <NogaStatCard icon={<Users className="size-4" />} color="amber" label="Direct Referrals" value={String(activeModule.table.rows[0]?.directSamePackage ?? 0)} sub="same-package directs" />
              <NogaStatCard icon={<Clock className="size-4" />} color="blue" label="Maintenance Points" value="0" sub="previous-month repurchase" />
              <NogaStatCard icon={<Gift className="size-4" />} color="emerald" label="Package Cash Claimable" value={getYorFiveRewardValue} sub={`${activeModule.table.rows[0]?.completedGroups ?? 0} package claim(s) ready`} />
              <NogaStatCard icon={<Gift className="size-4" />} color="violet" label="Product Hi-Five Status" value="200 pts needed" sub="reach 200 points to unlock product redemptions" />
            </div>
            <Card className="border-[var(--border)] bg-[var(--card)]">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-widest text-[var(--muted-foreground)]">Hi-Five Bonus — Package</p>
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

        {/* ── SHADOW ACCOUNTS ── */}
        {moduleId === 'account-shadow-management' && activeModule && shadowAccounts ? (
          <section className="grid gap-4 xl:grid-cols-[minmax(0,0.88fr)_minmax(0,1.12fr)]">
            <Card className="border-[var(--border)] bg-[var(--card)]">
              <CardHeader className="pb-3"><CardTitle className="text-base">Shadow Account Logic</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <InfoRow label="Owner" value={shadowAccounts.owner} />
                <InfoRow label="Shadow Slots" value={String(shadowAccounts.accounts.length)} />
                <InfoRow label="Active Shadow Path" value={shadowAccounts.accounts.some((a) => a.walletEnabled) ? 'Visible' : 'Reserved only'} />
                <div className="grid gap-3 sm:grid-cols-2">
                  {shadowAccounts.accounts.map((account) => (
                    <div key={account.id} className="rounded-2xl border border-[var(--border)] bg-[var(--background)] p-4">
                      <div className="flex items-center justify-between gap-2">
                        <Badge variant={account.walletEnabled ? 'success' : 'outline'}>{account.placement}</Badge>
                        <Badge variant={account.state.includes('reserved') ? 'warning' : 'outline'}>{account.state}</Badge>
                      </div>
                      <p className="mt-3 font-semibold text-[var(--foreground)]">{account.id}</p>
                      <p className="mt-1 text-xs leading-5 text-[var(--muted-foreground)]">{account.note}</p>
                      <div className="mt-3 space-y-1.5 text-sm">
                        {[['Wallet', account.walletEnabled], ['Unilevel', account.unilevelEnabled], ['Binary Cycle', account.binaryCycleEnabled]].map(([label, enabled]) => (
                          <div key={String(label)} className="flex items-center justify-between gap-2">
                            <span className="text-[var(--muted-foreground)]">{String(label)}</span>
                            <strong className={enabled ? 'text-emerald-400' : 'text-[var(--muted-foreground)]'}>{enabled ? 'Enabled' : 'Disabled'}</strong>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            <Card className="border-[var(--border)] bg-[var(--card)]">
              <CardHeader className="pb-3"><CardTitle className="text-base">Shadow State Table</CardTitle></CardHeader>
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
      <p className={highlight ? 'mt-3 text-lg font-semibold text-amber-200' : 'mt-3 text-base font-semibold text-[var(--foreground)]'}>
        {value}
      </p>
    </div>
  );
}
