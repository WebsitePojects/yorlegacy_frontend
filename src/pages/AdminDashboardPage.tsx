import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import {
  AlertCircle,
  ArrowRight,
  Banknote,
  Bell,
  ChevronDown,
  ChevronRight,
  Eye,
  EyeOff,
  FileText,
  GitBranch,
  KeyRound,
  LayoutDashboard,
  Lock,
  Mail,
  MessageSquare,
  Newspaper,
  Plus,
  Search,
  Tag,
  TrendingUp,
  Users
} from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { useFeedback } from '@/components/feedback/FeedbackProvider';
import {
  ProtectedOfficeFrame,
  resolveOfficeBasePath
} from '@/components/layout/ProtectedOfficeFrame';
import { GenealogyTree } from '../components/ops/GenealogyTree';
import { LeaderboardInFrame } from './LeaderboardPage';
import { clearOfficeCache, readOfficeCache, warmOfficeCache } from '@/lib/office-cache';
import { cn, formatAccountTypeLabel } from '@/lib/utils';
import {
  GatedActionsCard,
  MetricGrid,
  ModuleTableCard,
  QuickLinkGrid
} from '@/components/ops/office-ui';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  fetchAdminContactMessages,
  updateAdminContactMessageStatus,
  searchAdminTransferTargets,
  fetchAdminMemberUnilevelData,
  fetchAdminSponsorTree,
  fetchAdminGlobalBonus,
  tagStockistLevel,
  type ContactMessage,
  type SupportMessageStatus,
  type UnilevelData,
  type SponsorTreeCenter,
  type GlobalBonusData,
  type GlobalBonusEntry,
  type StockistLevel
} from '@/lib/api';
import { SponsorTreeCanvas } from '@/features/unilevel/components/SponsorTreeCanvas';
import type {
  AdminActivationCodeCenter,
  AdminEncashmentCenter,
  AdminMemberManagementCenter,
  AdminMemberProfile,
  AdminMvpDashboardData,
  AdminOfficeData,
  AuthUser,
  DashboardSummary,
  GenealogyCenter,
  MemberAccountStatus,
  OperationalModule,
  ReportRow,
  ShadowAccountCenter
} from '../types/auth';

const formatCurrency = (value: number): string =>
  `PHP ${value.toLocaleString('en-PH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;

function formatDateTime(value: string | null | undefined): string {
  if (!value) {
    return 'Not yet recorded';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString('en-PH', {
    timeZone: 'Asia/Manila',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  });
}

function formatShadowStateLabel(value: string): string {
  return value
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function ShadowAccountsCard({ shadowAccounts }: { shadowAccounts: ShadowAccountCenter }) {
  const [expandedCode, setExpandedCode] = useState<string | null>(null);

  function toggle(code: string) {
    setExpandedCode((prev) => (prev === code ? null : code));
  }

  return (
    <Card className="border-[var(--border)] bg-[var(--card)]">
      <CardHeader>
        <CardTitle>Shadow Accounts</CardTitle>
        <CardDescription className="text-xs">
          Admin visibility for the selected member's Binary Function Only slots.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="grid gap-3 md:grid-cols-3">
          <DataPoint label="Owner" value={shadowAccounts.owner} />
          <DataPoint label="Shadow Slots" value={shadowAccounts.accounts.length} />
          <DataPoint label="Available Codes" value={shadowAccounts.availableCodes.length} />
        </div>
        <div className="h-[320px] flex flex-col overflow-hidden rounded-xl border border-[var(--border)]">
          <div className="grid grid-cols-[32px_1fr_80px_90px_80px_16px] gap-x-3 border-b border-[var(--border)] bg-[var(--background)] px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--muted-foreground)] sticky top-0">
            <span>Side</span>
            <span>Label / Code</span>
            <span>Package</span>
            <span>PV / SMB</span>
            <span>State</span>
            <span />
          </div>
          <div className="flex-1 overflow-y-auto divide-y divide-[var(--border)]">
            {shadowAccounts.accounts.map((account) => {
              const isExpanded = expandedCode === account.shadowCode;
              return (
                <div key={account.shadowCode}>
                  <button
                    type="button"
                    onClick={() => toggle(account.shadowCode)}
                    className="grid w-full grid-cols-[32px_1fr_80px_90px_80px_16px] gap-x-3 items-center px-3 py-2.5 text-left text-sm transition hover:bg-[var(--muted)]/30"
                  >
                    <span className={cn(
                      'inline-flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold',
                      account.placement === 'left'
                        ? 'bg-blue-500/15 text-blue-400'
                        : 'bg-emerald-500/15 text-emerald-400'
                    )}>
                      {account.placement === 'left' ? 'L' : 'R'}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate font-medium text-[var(--foreground)]">{account.label}</p>
                      <p className="truncate font-mono text-[10px] text-[var(--muted-foreground)]">{account.shadowCode}</p>
                    </div>
                    <span className="text-xs text-[var(--muted-foreground)]">{account.packageTier ?? '—'}</span>
                    <span className="text-xs text-[var(--muted-foreground)]">
                      {account.pvValue} PV / {formatCurrency(account.salesmatchValue)}
                    </span>
                    <Badge variant={account.state.includes('reserved') ? 'warning' : 'success'} className="text-[10px] w-fit">
                      {formatShadowStateLabel(account.state)}
                    </Badge>
                    {isExpanded
                      ? <ChevronDown className="size-3.5 text-[var(--muted-foreground)]" />
                      : <ChevronRight className="size-3.5 text-[var(--muted-foreground)]" />
                    }
                  </button>
                  {isExpanded && (
                    <div className="bg-[var(--muted)]/20 px-4 py-3 text-sm">
                      <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
                        <DataPoint label="Account Type" value={account.accountType ? formatAccountTypeLabel(account.accountType) : 'Pending'} />
                        <DataPoint label="Activation Code" value={account.activationCode ?? 'Not yet assigned'} />
                        <DataPoint label="Left Volume" value={account.leftVolume} />
                        <DataPoint label="Right Volume" value={account.rightVolume} />
                        <DataPoint label="Matched Points" value={account.matchedPoints} />
                        <DataPoint label="Total Earned" value={formatCurrency(account.totalEarned)} />
                        <DataPoint label="Wallet" value={account.walletEnabled ? 'Enabled' : 'Disabled'} />
                        <DataPoint label="Unilevel" value={account.unilevelEnabled ? 'Enabled' : 'Disabled'} />
                        <DataPoint label="Binary Cycle" value={account.binaryCycleEnabled ? 'Enabled' : 'Disabled'} />
                      </div>
                      <div className="mt-2 space-y-0.5 text-xs text-[var(--muted-foreground)]">
                        <p>Activated: {formatDateTime(account.activatedAt)}</p>
                        <p>Last upgrade: {formatDateTime(account.lastUpgradedAt)}</p>
                        {account.note ? <p className="italic">{account.note}</p> : null}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
        {shadowAccounts.notes.length ? (
          <div className="grid gap-2">
            {shadowAccounts.notes.map((note) => (
              <div key={note} className="rounded-xl border border-[var(--border)] px-3 py-2 text-sm text-[var(--muted-foreground)]">
                {note}
              </div>
            ))}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

function formatAuditActionLabel(action: string) {
  if (action === 'sandbox_runtime_enabled') {
    return 'runtime_enabled';
  }

  if (action.includes('sandbox')) {
    return action.replace(/sandbox/g, 'runtime');
  }

  if (action.includes('playground')) {
    return action.replace(/playground/g, 'review_mode');
  }

  return action;
}

type CodeGenerationOption = {
  value: string;
  label: string;
  packageTier: string;
  codeFamily: 'YOR CODES' | 'YOR MAINTENANCE' | 'YOR REFILL' | 'YOR VISION';
  kind: 'package' | 'product';
};

const CODE_GENERATION_OPTIONS: CodeGenerationOption[] = [
  { value: 'pkg-basic',    label: 'Basic Package',    packageTier: 'Basic',    codeFamily: 'YOR CODES', kind: 'package' },
  { value: 'pkg-classic',  label: 'Classic Package',  packageTier: 'Classic',  codeFamily: 'YOR CODES', kind: 'package' },
  { value: 'pkg-standard', label: 'Standard Package', packageTier: 'Standard', codeFamily: 'YOR CODES', kind: 'package' },
  { value: 'pkg-business', label: 'Business Package', packageTier: 'Business', codeFamily: 'YOR CODES', kind: 'package' },
  { value: 'pkg-vip',      label: 'VIP Package',      packageTier: 'VIP',      codeFamily: 'YOR CODES', kind: 'package' },
  // Product codes — price at point of sale is the buyer's tier-based discounted price (DP), not SRP.
  { value: 'product-yor-perfume', label: 'Yor Perfume', packageTier: 'Yor Perfume', codeFamily: 'YOR MAINTENANCE', kind: 'product' },
  { value: 'product-yor-vision',  label: 'Yor Vision',  packageTier: 'Yor Vision',  codeFamily: 'YOR VISION',      kind: 'product' },
  { value: 'product-yor-refill',  label: 'Yor Refill',  packageTier: 'Yor Refill',  codeFamily: 'YOR REFILL',      kind: 'product' },
];

const customAdminModuleIds = new Set([
  'dashboard',
  'member-management',
  'account-details',
  'activation-codes',
  'encashment-reports',
  'account-genealogy',
  'finance-accounting',
  'get-five-reports',
  'rankings',
  'global-bonus',
  'cd-accounts',
  'voucher-management',
  'contact-messages',
  'news-posts',
  'change-password',
  'unilevel-rank-progress'
]);

function getVisibleAdminMetrics(moduleId: string, metrics: AdminOfficeData['metrics']) {
  if (moduleId === 'dashboard') {
    return metrics;
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

type AdminModuleBundle = {
  summary: DashboardSummary;
  office: AdminOfficeData;
  mvpDashboard: AdminMvpDashboardData;
  activeModule: OperationalModule;
  activationCodes: AdminActivationCodeCenter | null;
  encashments: AdminEncashmentCenter | null;
  memberCenter: AdminMemberManagementCenter | null;
  genealogyTree: GenealogyCenter | null;
  shadowAccounts: ShadowAccountCenter | null;
};

type MemberProfileDraft = {
  username: string;
  newUsername: string;
  email: string;
  firstName: string;
  lastName: string;
  middleName: string;
  password: string;
  payoutOption: string;
  payoutDetails: string;
  address: string;
  contactNumber: string;
};

type EncashmentDraft = {
  id: string;
  method: string;
  fee: string;
  tax: string;
  cdDeduction: string;
  remarks: string;
};

type TransferSearchResult = {
  username: string;
  displayName: string;
  packageTier: string;
};

const EMPTY_MEMBER_PROFILE_DRAFT: MemberProfileDraft = {
  username: '',
  newUsername: '',
  email: '',
  firstName: '',
  lastName: '',
  middleName: '',
  password: '',
  payoutOption: '',
  payoutDetails: '',
  address: '',
  contactNumber: ''
};

const EMPTY_ENCASHMENT_DRAFT: EncashmentDraft = {
  id: '',
  method: '',
  fee: '0',
  tax: '0',
  cdDeduction: '0',
  remarks: ''
};

function parseMoneyValue(value: string) {
  return Number(String(value).replace(/[^0-9.-]/g, '')) || 0;
}

function buildMemberProfileDraft(profile: AdminMemberProfile | null): MemberProfileDraft {
  if (!profile) {
    return EMPTY_MEMBER_PROFILE_DRAFT;
  }

  return {
    username: profile.username,
    newUsername: profile.username,
    email: profile.email,
    firstName: profile.firstName,
    lastName: profile.lastName,
    middleName: profile.middleName,
    password: '',
    payoutOption: profile.payoutOption,
    payoutDetails: profile.payoutDetails,
    address: profile.address,
    contactNumber: profile.phone
  };
}

function buildEncashmentDraft(
  row: AdminEncashmentCenter['encashments'][number] | null | undefined
): EncashmentDraft {
  if (!row) {
    return EMPTY_ENCASHMENT_DRAFT;
  }

  return {
    id: row.id,
    method: row.method,
    fee: String(parseMoneyValue(row.fee)),
    tax: String(parseMoneyValue(row.tax)),
    cdDeduction: String(parseMoneyValue(row.cdDeduction)),
    remarks: row.remarks
  };
}

function labelForMemberStatus(status: MemberAccountStatus) {
  switch (status) {
    case 'active':
      return 'Activate';
    case 'frozen':
      return 'Freeze';
    case 'suspended':
      return 'Suspend';
    default:
      return 'Set Pending';
  }
}

export function AdminDashboardPage() {
  const {
    approveEncashment,
    generateActivationCodes,
    getAdminActivationCodes,
    getAdminBinaryTree,
    getAdminEncashments,
    getAdminMemberManagement,
    getAdminModule,
    getAdminMvpDashboard,
    getAdminOffice,
    getAdminShadowAccounts,
    getAdminSummary,
    listCashiers,
    releaseActivationCodes,
    reviewEncashment,
    resetSandbox,
    transferAdminCodes,
    updateMemberProfile,
    updateMemberStatus,
    user
  } = useAuth();
  const { confirmAction, notify } = useFeedback();
  const { moduleId = 'dashboard' } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const officeBasePath = resolveOfficeBasePath(location.pathname);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [office, setOffice] = useState<AdminOfficeData | null>(null);
  const [mvpDashboard, setMvpDashboard] = useState<AdminMvpDashboardData | null>(null);
  const [activeModule, setActiveModule] = useState<OperationalModule | null>(null);
  const [activationCodes, setActivationCodes] = useState<AdminActivationCodeCenter | null>(null);
  const [encashments, setEncashments] = useState<AdminEncashmentCenter | null>(null);
  const [memberCenter, setMemberCenter] = useState<AdminMemberManagementCenter | null>(null);
  const [genealogyTree, setGenealogyTree] = useState<GenealogyCenter | null>(null);
  const [shadowAccounts, setShadowAccounts] = useState<ShadowAccountCenter | null>(null);
  const [selectedTreeNodeId, setSelectedTreeNodeId] = useState<string | null>(null);
  const [treeRootUsername, setTreeRootUsername] = useState('');
  const [treeSearchInput, setTreeSearchInput] = useState('');
  const [memberSearchDraft, setMemberSearchDraft] = useState('');
  const [memberSearchQuery, setMemberSearchQuery] = useState('');
  const [memberPage, setMemberPage] = useState(1);
  const [memberDetailUsername, setMemberDetailUsername] = useState('');
  const [memberProfileDraft, setMemberProfileDraft] = useState<MemberProfileDraft>(EMPTY_MEMBER_PROFILE_DRAFT);
  const [codeBatchQuantity, setCodeBatchQuantity] = useState<string>('');
  const [codeBatchSelection, setCodeBatchSelection] = useState<string>('');
  const [codeBatchAccountType, setCodeBatchAccountType] = useState('PD');
  const [codeBatchAssignedTo, setCodeBatchAssignedTo] = useState('');
  const [codeBatchAssignedToUserId, setCodeBatchAssignedToUserId] = useState('');
  const [codeBatchRemarks, setCodeBatchRemarks] = useState('');
  const [cashierList, setCashierList] = useState<Array<{ id: string; displayName: string; email: string }>>([]);
  const [codeSearchQuery, setCodeSearchQuery] = useState('');
  const [inventorySortBy, setInventorySortBy] = useState<'recent' | 'newest' | 'oldest' | 'status'>('recent');
  const [inventoryStatusFilter, setInventoryStatusFilter] = useState<'' | 'unreleased' | 'available' | 'used'>('');
  const [error, setError] = useState<string | null>(null);
  const [isContentLoading, setIsContentLoading] = useState(true);
  const [reloadNonce, setReloadNonce] = useState(0);
  const [selectedAdminCodes, setSelectedAdminCodes] = useState<string[]>([]);
  const [adminTransferTarget, setAdminTransferTarget] = useState('');
  const [codeTransferSearchQuery, setCodeTransferSearchQuery] = useState('');
  const [codeTransferSearchResults, setCodeTransferSearchResults] = useState<TransferSearchResult[]>([]);
  const [codeTransferSearchLoading, setCodeTransferSearchLoading] = useState(false);
  const [codeTransferSearchError, setCodeTransferSearchError] = useState<string | null>(null);
  const [showTransferDropdown, setShowTransferDropdown] = useState(false);
  const [inventoryPage, setInventoryPage] = useState(1);
  const [selectedEncashmentId, setSelectedEncashmentId] = useState('');
  const [encashmentPage, setEncashmentPage] = useState(1);
  const [encashmentStatusFilter, setEncashmentStatusFilter] = useState<'all' | 'pending' | 'paid' | 'cancelled'>('all');
  const [encashmentDraft, setEncashmentDraft] = useState<EncashmentDraft>(EMPTY_ENCASHMENT_DRAFT);
  const [selectedCodeTransferTarget, setSelectedCodeTransferTarget] = useState<TransferSearchResult | null>(null);
  const [showAdminMemberPassword, setShowAdminMemberPassword] = useState(false);
  const [isMemberProfileSaving, setIsMemberProfileSaving] = useState(false);

  const applyAdminBundle = useCallback((bundle: AdminModuleBundle) => {
    setSummary(bundle.summary);
    setOffice(bundle.office);
    setMvpDashboard(bundle.mvpDashboard);
    setActiveModule(bundle.activeModule);
    setActivationCodes(bundle.activationCodes);
    setEncashments(bundle.encashments);
    setMemberCenter(bundle.memberCenter);
    setGenealogyTree(bundle.genealogyTree);
    setShadowAccounts(bundle.shadowAccounts);
    setSelectedTreeNodeId(bundle.genealogyTree?.root.nodeId ?? null);

    if (bundle.activationCodes) {
      setSelectedAdminCodes([]);
      setAdminTransferTarget('');
      setSelectedCodeTransferTarget(null);
      setCodeTransferSearchQuery('');
      setCodeTransferSearchResults([]);
      setCodeTransferSearchError(null);
      setCodeSearchQuery('');
      setCodeBatchRemarks('');
    }

    if (bundle.encashments) {
      const nextSelectedId = bundle.encashments.encashments[0]?.id ?? '';
      const selectedRow =
        bundle.encashments.encashments.find((row) => row.id === selectedEncashmentId) ??
        bundle.encashments.encashments[0] ??
        null;
      setSelectedEncashmentId(nextSelectedId || selectedRow?.id || '');
      setEncashmentDraft(buildEncashmentDraft(selectedRow));
    }

    if (bundle.memberCenter) {
      setMemberSearchDraft(bundle.memberCenter.query);
      setMemberSearchQuery(bundle.memberCenter.query);
      setMemberPage(bundle.memberCenter.page);
      setMemberDetailUsername(bundle.memberCenter.selectedMember?.username ?? '');
      setMemberProfileDraft(buildMemberProfileDraft(bundle.memberCenter.selectedMember));
    }
  }, [selectedEncashmentId]);

  const buildAdminBundle = useCallback(
    async (
      targetModuleId: string,
      options: {
        rootUsername: string;
        memberQuery: string;
        memberUsername: string;
        memberPage: number;
      }
    ): Promise<AdminModuleBundle> => {
      const [nextSummary, nextOffice, nextMvpDashboard, nextModule] = await Promise.all([
        getAdminSummary(),
        getAdminOffice(),
        getAdminMvpDashboard(),
        getAdminModule(targetModuleId)
      ]);

      let activationCodes: AdminActivationCodeCenter | null = null;
      let encashments: AdminEncashmentCenter | null = null;
      let memberCenter: AdminMemberManagementCenter | null = null;
      let genealogyTree: GenealogyCenter | null = null;
      let shadowAccounts: ShadowAccountCenter | null = null;

      if (targetModuleId === 'activation-codes') {
        activationCodes = await getAdminActivationCodes();
      }

      if (targetModuleId === 'encashment-reports') {
        encashments = await getAdminEncashments();
      }

      if (targetModuleId === 'member-management' || targetModuleId === 'account-details') {
        memberCenter = await getAdminMemberManagement({
          query: options.memberQuery,
          username: options.memberUsername,
          page: options.memberPage,
          pageSize: 10
        });
      }

      if (targetModuleId === 'account-genealogy' && options.rootUsername.trim()) {
        try {
          [genealogyTree, shadowAccounts] = await Promise.all([
            getAdminBinaryTree(options.rootUsername.trim()),
            getAdminShadowAccounts(options.rootUsername.trim())
          ]);
        } catch {
          // Member not found or invalid — stay on the page with empty tree
          genealogyTree = null;
          shadowAccounts = null;
        }
      }

      return {
        summary: nextSummary,
        office: nextOffice,
        mvpDashboard: nextMvpDashboard,
        activeModule: nextModule,
        activationCodes,
        encashments,
        memberCenter,
        genealogyTree,
        shadowAccounts
      };
    },
    [
      getAdminActivationCodes,
      getAdminBinaryTree,
      getAdminEncashments,
      getAdminMemberManagement,
      getAdminModule,
      getAdminMvpDashboard,
      getAdminOffice,
      getAdminShadowAccounts,
      getAdminSummary,
      listCashiers
    ]
  );

  const adminCacheKey = useCallback(
    (
      targetModuleId: string,
      options: {
        rootUsername: string;
        memberQuery: string;
        memberUsername: string;
        memberPage: number;
      }
    ) =>
      `admin:${officeBasePath}:${targetModuleId}:${options.rootUsername.toUpperCase()}:${options.memberQuery.toUpperCase()}:${options.memberUsername.toUpperCase()}:${options.memberPage}`,
    [officeBasePath]
  );

  const prefetchModule = useCallback(
    (targetModuleId: string) => {
      void warmOfficeCache(
        adminCacheKey(targetModuleId, {
          rootUsername: treeRootUsername,
          memberQuery: memberSearchQuery,
          memberUsername: memberDetailUsername,
          memberPage
        }),
        () =>
          buildAdminBundle(targetModuleId, {
            rootUsername: treeRootUsername,
            memberQuery: memberSearchQuery,
            memberUsername: memberDetailUsername,
            memberPage
          })
      );
    },
    [adminCacheKey, buildAdminBundle, memberDetailUsername, memberPage, memberSearchQuery, treeRootUsername]
  );

  useEffect(() => {
    if (user?.role !== 'cashier') {
      return;
    }

    const cashierAllowedModules = new Set(['activation-codes', 'account-details', 'account-genealogy', 'voucher-management']);
    if (!cashierAllowedModules.has(moduleId ?? '')) {
      navigate('/admin/activation-codes', { replace: true });
    }
  }, [moduleId, navigate, user?.role]);

  // Load cashier list once for the Code Generation dropdown — independent of module
  // loading so it survives bundle rerenders and cache hits.
  useEffect(() => {
    const role = user?.role;
    if (role === 'admin' || role === 'bod' || role === 'superadmin') {
      listCashiers().then(setCashierList).catch(() => {});
    }
  }, [user?.role, listCashiers]);

  useEffect(() => {
    let cancelled = false;

    async function loadAdminModule() {
      try {
        setError(null);
        setIsContentLoading(true);
        const requestOptions = {
          rootUsername: treeRootUsername,
          memberQuery: memberSearchQuery,
          memberUsername: memberDetailUsername,
          memberPage
        };
        const cacheKey = adminCacheKey(moduleId, requestOptions);
        const cached = readOfficeCache<AdminModuleBundle>(cacheKey);

        if (cached && !cancelled) {
          applyAdminBundle(cached.data);
          setIsContentLoading(false);
        }

        const nextBundle = await warmOfficeCache(cacheKey, () => buildAdminBundle(moduleId, requestOptions));

        if (cancelled) {
          return;
        }

        applyAdminBundle(nextBundle);
        setIsContentLoading(false);
      } catch (cause) {
        if (!cancelled) {
          setError(cause instanceof Error ? cause.message : 'Unable to load admin dashboard');
          setIsContentLoading(false);
        }
      }
    }

    void loadAdminModule();

    return () => {
      cancelled = true;
    };
  }, [
    adminCacheKey,
    applyAdminBundle,
    buildAdminBundle,
    moduleId,
    memberDetailUsername,
    memberPage,
    memberSearchQuery,
    reloadNonce,
    treeRootUsername
  ]);

  async function handleGenerateCodes() {
    const qty = parseInt(codeBatchQuantity, 10);
    if (!selectedCodeBatchOption) {
      notify({ title: 'Select a package / product first', tone: 'destructive' });
      return;
    }
    if (!qty || qty < 1) {
      notify({ title: 'Enter a valid quantity (1 or more)', tone: 'destructive' });
      return;
    }
    const selectedCashier = cashierList.find((c) => c.id === codeBatchAssignedToUserId);
    const confirmed = await confirmAction({
      title: 'Generate activation code batch?',
      description: selectedCashier
        ? `Generate ${qty} ${codeBatchAccountType} ${selectedCodeBatchOption.label} code(s) assigned to ${selectedCashier.displayName}.`
        : `Generate ${qty} ${codeBatchAccountType} ${selectedCodeBatchOption.label} code(s) into the unassigned code pool.`,
      confirmLabel: 'Generate Batch',
      tone: 'warning'
    });

    if (!confirmed) {
      return;
    }

    try {
      const result = await generateActivationCodes({
        quantity: qty,
        packageTier: selectedCodeBatchOption.packageTier,
        codeFamily: selectedCodeBatchOption.codeFamily,
        assignedToUserId: codeBatchAssignedToUserId || undefined,
        accountType: codeBatchAccountType,
        remarks: codeBatchRemarks.trim() || undefined
      });
      notify({
        title: 'Code batch generated',
        description: result.detail ?? result.reason,
        tone: 'success'
      });
      clearOfficeCache(currentAdminBundleCacheKey);
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
      title: 'Mark encashment as paid?',
      description: `Mark ${encashmentId} as paid so the member and office records move forward together.`,
      confirmLabel: 'Mark Paid',
      tone: 'warning'
    });

    if (!confirmed) {
      return;
    }

    try {
      const result = await approveEncashment(encashmentId);
      notify({
        title: 'Encashment marked paid',
        description: result.detail ?? result.reason,
        tone: 'success'
      });
      setReloadNonce((value) => value + 1);
    } catch (cause) {
      notify({
        title: 'Unable to mark encashment as paid',
        description: cause instanceof Error ? cause.message : 'Please try again.',
        tone: 'destructive'
      });
    }
  }

  // Autocomplete: search as user types (debounced 300ms)
  useEffect(() => {
    const q = codeTransferSearchQuery.trim();
    if (q.length < 2) {
      setCodeTransferSearchResults([]);
      setShowTransferDropdown(false);
      return;
    }
    const timer = setTimeout(async () => {
      setCodeTransferSearchLoading(true);
      try {
        const res = await searchAdminTransferTargets(q);
        const hits = res.results.slice(0, 8);
        setCodeTransferSearchResults(hits);
        setShowTransferDropdown(hits.length > 0);
        setCodeTransferSearchError(hits.length === 0 ? 'No members match that username.' : null);
      } catch {
        setCodeTransferSearchError('Search failed.');
      } finally {
        setCodeTransferSearchLoading(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [codeTransferSearchQuery, searchAdminTransferTargets]);

  // Reset to page 1 when inventory filter/sort changes
  useEffect(() => {
    setInventoryPage(1);
  }, [codeSearchQuery, inventoryStatusFilter, inventorySortBy]);

  function selectTransferTarget(result: TransferSearchResult) {
    setSelectedCodeTransferTarget(result);
    setAdminTransferTarget(result.username);
    setCodeTransferSearchQuery(result.username);
    setCodeTransferSearchResults([]);
    setShowTransferDropdown(false);
    setCodeTransferSearchError(null);
  }

  async function handleReleaseCodes() {
    const confirmed = await confirmAction({
      title: 'Release selected codes?',
      description: `Release ${selectedAdminCodes.length} selected code(s) so they become registration-ready.`,
      confirmLabel: 'Release Codes',
      tone: 'warning'
    });

    if (!confirmed) {
      return;
    }

    try {
      const result = await releaseActivationCodes(selectedAdminCodes);
      notify({
        title: 'Codes released',
        description: result.detail ?? result.reason,
        tone: 'success'
      });
      clearOfficeCache(currentAdminBundleCacheKey);
      setReloadNonce((value) => value + 1);
    } catch (cause) {
      notify({
        title: 'Unable to release codes',
        description: cause instanceof Error ? cause.message : 'Please try again.',
        tone: 'destructive'
      });
    }
  }

  async function handleTransferCodes() {
    if (!adminTransferTarget.trim()) {
      notify({
        title: 'Search for a target first',
        description: 'Use the username search to select the member who will receive the codes.',
        tone: 'warning'
      });
      return;
    }

    const confirmed = await confirmAction({
      title: 'Transfer selected codes?',
      description: `Transfer ${selectedAdminCodes.length} selected code(s) to ${selectedCodeTransferTarget?.username ?? adminTransferTarget}.`,
      confirmLabel: 'Transfer Codes',
      tone: 'warning'
    });

    if (!confirmed) {
      return;
    }

    try {
      const result = await transferAdminCodes({
        targetUsername: adminTransferTarget,
        codes: selectedAdminCodes
      });
      notify({
        title: 'Codes transferred',
        description: result.detail ?? result.reason,
        tone: 'success'
      });
      clearOfficeCache(currentAdminBundleCacheKey);
      setReloadNonce((value) => value + 1);
    } catch (cause) {
      notify({
        title: 'Unable to transfer codes',
        description: cause instanceof Error ? cause.message : 'Please try again.',
        tone: 'destructive'
      });
    }
  }

  async function handleReleaseAndTransferCodes() {
    if (!adminTransferTarget.trim()) {
      notify({
        title: 'Search for a target first',
        description: 'Use the username search to select the member who will receive the codes.',
        tone: 'warning'
      });
      return;
    }

    const confirmed = await confirmAction({
      title: 'Release & Transfer selected codes?',
      description: `Transfer ${selectedAdminCodes.length} code(s) to ${selectedCodeTransferTarget?.username ?? adminTransferTarget} and immediately release them so the member can use them.`,
      confirmLabel: 'Release & Transfer',
      tone: 'warning'
    });

    if (!confirmed) {
      return;
    }

    try {
      await transferAdminCodes({ targetUsername: adminTransferTarget, codes: selectedAdminCodes });
      const result = await releaseActivationCodes(selectedAdminCodes);
      notify({
        title: 'Codes released & transferred',
        description: `${selectedAdminCodes.length} code(s) transferred to ${selectedCodeTransferTarget?.username ?? adminTransferTarget} and released. ${result.reason}`,
        tone: 'success'
      });
      clearOfficeCache(currentAdminBundleCacheKey);
      setReloadNonce((value) => value + 1);
    } catch (cause) {
      notify({
        title: 'Unable to release & transfer',
        description: cause instanceof Error ? cause.message : 'Please try again.',
        tone: 'destructive'
      });
    }
  }

  async function handleSearchCodeTransferTargets() {
    const query = codeTransferSearchQuery.trim();

    if (query.length < 3) {
      notify({
        title: 'Enter at least 3 characters',
        description: 'Search by username needs a short query before we can look up transfer targets.',
        tone: 'warning'
      });
      return;
    }

    setCodeTransferSearchLoading(true);
    setCodeTransferSearchError(null);

    try {
      const result = await searchAdminTransferTargets(query);
      const nextResults = result.results.slice(0, 5);
      setCodeTransferSearchResults(nextResults);
      setSelectedCodeTransferTarget(null);
      setAdminTransferTarget('');

      if (nextResults.length === 0) {
        setCodeTransferSearchError('No member match yet for that username.');
      }
    } catch (cause) {
      setCodeTransferSearchError(cause instanceof Error ? cause.message : 'Unable to search members.');
      setCodeTransferSearchResults([]);
      setSelectedCodeTransferTarget(null);
      setAdminTransferTarget('');
    } finally {
      setCodeTransferSearchLoading(false);
    }
  }

  function handleSelectEncashment(encashmentId: string) {
    setSelectedEncashmentId(encashmentId);
    const selected = encashments?.encashments.find((item) => item.id === encashmentId);
    setEncashmentDraft(buildEncashmentDraft(selected));
  }

  async function handleReviewEncashment(action: 'queue' | 'mark-paid' | 'cancel' | 'edit') {
    if (!encashmentDraft.id) {
      return;
    }

    const labelMap = {
      queue: 'Queue Request',
      'mark-paid': 'Mark Paid',
      cancel: 'Cancel Request',
      edit: 'Save Changes'
    } as const;

    const confirmed = await confirmAction({
      title: `${labelMap[action]}?`,
      description: `${labelMap[action]} for ${encashmentDraft.id} using the current remarks and breakdown fields.`,
      confirmLabel: labelMap[action],
      tone: 'warning'
    });

    if (!confirmed) {
      return;
    }

    try {
      const result = await reviewEncashment(encashmentDraft.id, {
        action,
        method: encashmentDraft.method,
        fee: Number(encashmentDraft.fee),
        tax: Number(encashmentDraft.tax),
        cdDeduction: Number(encashmentDraft.cdDeduction),
        remarks: encashmentDraft.remarks
      });
      notify({
        title: 'Encashment updated',
        description: result.detail ?? result.reason,
        tone: 'success'
      });
      setReloadNonce((value) => value + 1);
    } catch (cause) {
      notify({
        title: 'Unable to update encashment',
        description: cause instanceof Error ? cause.message : 'Please try again.',
        tone: 'destructive'
      });
    }
  }

  function handleSearchMembers() {
    setMemberPage(1);
    setMemberSearchQuery(memberSearchDraft.trim());
  }

  function handleSelectMember(username: string) {
    setMemberDetailUsername(username);
  }

  function handleMemberProfileField<Key extends keyof MemberProfileDraft>(key: Key, value: MemberProfileDraft[Key]) {
    setMemberProfileDraft((current) => ({
      ...current,
      [key]: value
    }));
  }

  async function handleSaveMemberProfile() {
    const confirmed = await confirmAction({
      title: 'Save member profile update?',
      description: `Update ${memberProfileDraft.username || 'the selected member'} profile details.`,
      confirmLabel: 'Save Profile',
      tone: 'warning'
    });

    if (!confirmed) {
      return;
    }

    setIsMemberProfileSaving(true);
    try {
      const result = await updateMemberProfile(memberProfileDraft.username, {
        firstName: memberProfileDraft.firstName,
        lastName: memberProfileDraft.lastName,
        middleName: memberProfileDraft.middleName,
        password: memberProfileDraft.password || undefined,
        payoutOption: memberProfileDraft.payoutOption,
        payoutDetails: memberProfileDraft.payoutDetails,
        address: memberProfileDraft.address,
        contactNumber: memberProfileDraft.contactNumber,
        email: memberProfileDraft.email || undefined,
        newUsername: memberProfileDraft.newUsername !== memberProfileDraft.username ? memberProfileDraft.newUsername : undefined
      });
      notify({
        title: 'Member profile updated',
        description: result.detail ?? result.reason,
        tone: 'success'
      });
      setShowAdminMemberPassword(false);
      setReloadNonce((value) => value + 1);
    } catch (cause) {
      notify({
        title: 'Unable to update member profile',
        description: cause instanceof Error ? cause.message : 'Please try again.',
        tone: 'destructive'
      });
    } finally {
      setIsMemberProfileSaving(false);
    }
  }

  async function handleMemberStatusAction(username: string, status: MemberAccountStatus) {
    const confirmed = await confirmAction({
      title: `${labelForMemberStatus(status)} ${username}?`,
      description: `Apply ${status} status to ${username}.`,
      confirmLabel: labelForMemberStatus(status),
      tone: 'warning'
    });

    if (!confirmed) {
      return;
    }

    try {
      const result = await updateMemberStatus(username, status);
      notify({
        title: `${username} updated`,
        description: result.detail ?? result.reason,
        tone: 'success'
      });
      setReloadNonce((value) => value + 1);
    } catch (cause) {
      notify({
        title: 'Unable to update member status',
        description: cause instanceof Error ? cause.message : 'Please try again.',
        tone: 'destructive'
      });
    }
  }

  function openMemberWorkflow(modulePath: string | undefined, username: string) {
    if (!modulePath) {
      notify({
        title: 'Module still being aligned',
        description: `The ${username} drilldown will be fully wired in the next parity pass.`,
        tone: 'warning'
      });
      return;
    }

    navigate(`${modulePath}?username=${encodeURIComponent(username)}`);
  }

  async function handleResetSandbox() {
    const confirmed = await confirmAction({
      title: 'Reset runtime data?',
      description: 'This restores the current local runtime data to its seeded Yor test state for a fresh QA pass.',
      confirmLabel: 'Reset Data',
      tone: 'warning'
    });

    if (!confirmed) {
      return;
    }

    try {
      const result = await resetSandbox();
      notify({
        title: 'Runtime data reset completed',
        description: result.detail ?? result.reason,
        tone: 'success'
      });
      setReloadNonce((value) => value + 1);
    } catch (cause) {
      notify({
        title: 'Unable to reset runtime data',
        description: cause instanceof Error ? cause.message : 'Please try again.',
        tone: 'destructive'
      });
    }
  }

  const selectedTreeNode =
    genealogyTree?.nodes.find((node) => node.nodeId === selectedTreeNodeId) ?? null;
  const treeLeftRoot = genealogyTree?.root.children.find((child) => child.placement === 'left');
  const treeRightRoot = genealogyTree?.root.children.find((child) => child.placement === 'right');
  const leftAccountCount = countSubtreeNodes(treeLeftRoot);
  const rightAccountCount = countSubtreeNodes(treeRightRoot);
  const matchedPoints = genealogyTree ? Math.min(genealogyTree.root.leftPoints, genealogyTree.root.rightPoints) : 0;
  const strongLegCarry = genealogyTree ? Math.max(genealogyTree.root.leftPoints, genealogyTree.root.rightPoints) - matchedPoints : 0;
  const weakLegCarry = genealogyTree ? Math.min(genealogyTree.root.leftPoints, genealogyTree.root.rightPoints) - matchedPoints : 0;
  const quickLinks = useMemo(() => {
    const quickLinkMap: Record<string, { title: string; body: string }> = {
      'member-management': {
        title: 'Member Management',
        body: 'Open the clean masterlist-style account view used for sponsor, package, and status checks.'
      },
      'account-genealogy': {
        title: 'Account Genealogy',
        body: 'Inspect placement and open slots using the same left and right slot rules members depend on.'
      },
      'activation-codes': {
        title: 'Manage Codes',
        body: 'Generate, release, and transfer sponsor-owned codes before the next registration pass.'
      },
      'encashment-reports': {
        title: 'Encashment Queue',
        body: 'Review the Tuesday encashment and Friday payout queue with gross, deductions, remarks, and final paid state.'
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
  const currentOpsRole = office?.profile.accessScope ?? user?.role ?? 'admin';
  const effectiveAdminRole = currentOpsRole === 'platform' ? 'admin' : currentOpsRole;
  const isCashierRole = effectiveAdminRole === 'cashier' || user?.role === 'cashier';
  const canGenerateCodes = isCashierRole || effectiveAdminRole === 'admin' || effectiveAdminRole === 'superadmin';
  const canApproveEncashment = effectiveAdminRole === 'admin' || effectiveAdminRole === 'superadmin';
  const canChangeMemberStatus = effectiveAdminRole === 'admin' || effectiveAdminRole === 'superadmin';
  const canEditFullMemberProfile = effectiveAdminRole === 'admin' || effectiveAdminRole === 'superadmin' || effectiveAdminRole === 'bod';
  const showDashboardActions = moduleId === 'dashboard' && (mvpDashboard?.moneyMode ?? 'playground') !== 'sandbox' && branchNotes.length > 0;
  const visibleMetrics = office ? getVisibleAdminMetrics(moduleId, office.metrics) : [];
  const selectedCodeBatchOption =
    CODE_GENERATION_OPTIONS.find((option) => option.value === codeBatchSelection) ?? null;
  const currentAdminBundleCacheKey = adminCacheKey(moduleId, {
    rootUsername: treeRootUsername,
    memberQuery: memberSearchQuery,
    memberUsername: memberDetailUsername,
    memberPage
  });
  const filteredActivationInventory = (() => {
    const query = codeSearchQuery.trim().toUpperCase();
    const base = (activationCodes?.inventory ?? []).filter((item) => {
      if (inventoryStatusFilter && item.status !== inventoryStatusFilter) return false;
      if (!query) return true;
      const code = (item.code ?? '').toUpperCase();
      const assignedTo = (item.assignedTo ?? '').toUpperCase();
      const packageTier = (item.packageTier ?? '').toUpperCase();
      const remarks = (item.remarks ?? '').toUpperCase();
      return code.includes(query) || assignedTo.includes(query) || packageTier.includes(query) || remarks.includes(query);
    });
    const STATUS_ORDER: Record<string, number> = { unreleased: 0, available: 1, used: 2, lost: 3, disabled: 4 };
    return [...base].sort((a, b) => {
      if (inventorySortBy === 'newest') return b.generatedAt.localeCompare(a.generatedAt);
      if (inventorySortBy === 'oldest') return a.generatedAt.localeCompare(b.generatedAt);
      if (inventorySortBy === 'status') return (STATUS_ORDER[a.status] ?? 9) - (STATUS_ORDER[b.status] ?? 9);
      // 'recent' (default): sort by lastActivityAt if available, otherwise generatedAt
      const aTime = (item: typeof a) => ('lastActivityAt' in item ? (item as {lastActivityAt: string}).lastActivityAt : item.generatedAt);
      return aTime(b).localeCompare(aTime(a));
    });
  })();
  const INVENTORY_PAGE_SIZE = 100;
  const totalInventoryPages = Math.max(1, Math.ceil(filteredActivationInventory.length / INVENTORY_PAGE_SIZE));
  const safePage = Math.min(inventoryPage, totalInventoryPages);
  const pagedInventory = filteredActivationInventory.slice((safePage - 1) * INVENTORY_PAGE_SIZE, safePage * INVENTORY_PAGE_SIZE);
  const selectableAdminCodes = filteredActivationInventory.filter((item) => item.status !== 'used').map((item) => item.code);
  const allSelectableAdminCodesSelected =
    selectableAdminCodes.length > 0 && selectableAdminCodes.every((code) => selectedAdminCodes.includes(code));
  const activationFamilyCount =
    activationCodes?.inventory.filter((item) => (item.codeFamily ?? 'YOR CODES').trim().toUpperCase() === 'YOR CODES').length ?? 0;
  const productFamilyCount = (activationCodes?.inventory.length ?? 0) - activationFamilyCount;
  const financeModulePath = office?.modules.find((module) => module.id === 'finance-accounting')?.path;
  const cdAccountsModulePath = office?.modules.find((module) => module.id === 'cd-accounts')?.path;
  const selectedEncashment =
    encashments?.encashments.find((item) => item.id === selectedEncashmentId) ?? encashments?.encashments[0] ?? null;
  const summaryCard = undefined;

  function toggleAdminCodeSelection(code: string) {
    setSelectedAdminCodes((current) =>
      current.includes(code) ? current.filter((item) => item !== code) : [...current, code]
    );
  }

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
        moduleId === 'dashboard'
          ? ''
          : activeModule?.description ??
            'Operations portal.'
      }
      sidebarHeading="Yor Control"
      sidebarSubheading={office?.profile.officeTitle ?? 'Operations office'}
      modules={office?.modules ?? []}
      headerBadge={office?.profile.officeTitle ?? 'Admin Office'}
      isContentLoading={isContentLoading}
      loadingLabel={activeModule?.label ?? 'Loading office workspace'}
      onPrefetchModule={prefetchModule}
      summaryCard={summaryCard}
      footerLinks={[]}
    >
      <div className="ops-admin-page space-y-6">
          {moduleId === 'dashboard' ? (
            <AdminDashboardView
              office={office}
              mvpDashboard={mvpDashboard}
              user={user}
            />
          ) : (
            <>
              {visibleMetrics.length ? <MetricGrid metrics={visibleMetrics} /> : null}
              {showModuleTable && activeModule ? <ModuleTableCard module={activeModule} /> : null}
            </>
          )}

          {moduleId === 'activation-codes' && activationCodes ? (
            <section className="ops-admin-activation-grid grid gap-4">
              <div className="grid gap-3 grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
                <DataPoint label="Tracked Codes" value={activationCodes.metrics.totalCodes} />
                <DataPoint label="Activation Codes" value={activationFamilyCount} />
                <DataPoint label="Product Codes" value={productFamilyCount} />
                <DataPoint label="Released" value={activationCodes.metrics.availableCodes} />
                <DataPoint label="Awaiting Release" value={activationCodes.metrics.unreleasedCodes} />
                <DataPoint label="Used" value={activationCodes.metrics.usedCodes} />
              </div>
              <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
                <Card className="ops-admin-control-card border-[var(--border)] bg-[var(--card)]">
                  <CardHeader className="pb-3">
                    <CardTitle>Code Generation</CardTitle>
                    <CardDescription className="text-xs">Generate a batch and optionally assign it to a cashier who will distribute codes to customers.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    {canGenerateCodes ? (
                      <>
                        {/* Row 1: Quantity + Package */}
                        <div className="grid gap-3 grid-cols-1 sm:grid-cols-2">
                          <label className="grid gap-1.5 text-sm">
                            <span className="font-medium text-[var(--muted-foreground)]">Quantity</span>
                            <Input
                              type="number"
                              min={1}
                              placeholder="e.g. 12"
                              value={codeBatchQuantity}
                              onChange={(event) => setCodeBatchQuantity(event.target.value)}
                            />
                          </label>
                          <label className="grid gap-1.5 text-sm">
                            <span className="font-medium text-[var(--muted-foreground)]">Package / Product</span>
                            <select
                              className="flex h-10 w-full rounded-xl border border-[var(--input)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
                              value={codeBatchSelection}
                              onChange={(event) => setCodeBatchSelection(event.target.value)}
                            >
                              <option value="" disabled>Select package / product…</option>
                              {CODE_GENERATION_OPTIONS.map((option) => (
                                <option key={option.value} value={option.value}>{option.label}</option>
                              ))}
                            </select>
                          </label>
                        </div>

                        {/* Row 2: Account Type + Assign to Cashier */}
                        <div className="grid gap-3 grid-cols-1 sm:grid-cols-2">
                          <label className="grid gap-1.5 text-sm">
                            <span className="font-medium text-[var(--muted-foreground)]">Account Type</span>
                            <select
                              className="flex h-10 w-full rounded-xl border border-[var(--input)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
                              value={codeBatchAccountType}
                              onChange={(event) => setCodeBatchAccountType(event.target.value)}
                            >
                              <option value="PD">PD</option>
                              <option value="CD">CD</option>
                              <option value="FS">FS</option>
                            </select>
                          </label>
                          <label className="grid gap-1.5 text-sm">
                            <span className="font-medium text-[var(--muted-foreground)]">Assign to Cashier <span className="font-normal opacity-60">(optional)</span></span>
                            <select
                              className="flex h-10 w-full rounded-xl border border-[var(--input)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
                              value={codeBatchAssignedToUserId}
                              onChange={(event) => setCodeBatchAssignedToUserId(event.target.value)}
                            >
                              <option value="">— General pool (no cashier) —</option>
                              {cashierList.map((cashier) => (
                                <option key={cashier.id} value={cashier.id}>{cashier.displayName}</option>
                              ))}
                            </select>
                          </label>
                        </div>

                        {/* Row 3: Remarks */}
                        <label className="grid gap-1.5 text-sm">
                          <span className="font-medium text-[var(--muted-foreground)]">Remarks <span className="font-normal opacity-60">(optional)</span></span>
                          <textarea
                            maxLength={200}
                            value={codeBatchRemarks}
                            onChange={(event) => setCodeBatchRemarks(event.target.value)}
                            placeholder="Internal note for this batch — audit trail, customer name, follow-up…"
                            className="min-h-[80px] w-full rounded-xl border border-[var(--input)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] resize-none"
                          />
                          <span className="text-xs text-[var(--muted-foreground)]">{codeBatchRemarks.length}/200</span>
                        </label>

                        <Button className="ops-admin-primary-action w-full sm:w-auto" type="button" onClick={handleGenerateCodes}>
                          Generate Codes
                        </Button>
                      </>
                    ) : (
                      <div className="rounded-xl border border-dashed border-[var(--border)] bg-[var(--background)] p-4 text-sm text-[var(--muted-foreground)]">
                        This role can review, release, transfer, and correct codes, but general code generation is admin-side only.
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* ── Release & Transfer panel ── */}
                <Card className="ops-admin-transfer-card border-[var(--border)] bg-[var(--card)]">
                  <CardHeader>
                    <CardTitle>Release &amp; Transfer</CardTitle>
                    <CardDescription className="text-xs">Filter the inventory below, select codes, then release or transfer them to a member.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Inventory search */}
                    <label className="grid gap-2 text-sm">
                      <span className="font-medium text-[var(--muted-foreground)]">Filter inventory</span>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[var(--muted-foreground)]" />
                        <Input
                          value={codeSearchQuery}
                          onChange={(event) => setCodeSearchQuery(event.target.value)}
                          placeholder="Code, username, package, remarks…"
                          className="pl-9"
                        />
                      </div>
                    </label>

                    {/* Transfer target search — autocomplete combobox */}
                    <div className="rounded-xl border border-[var(--border)] bg-[var(--background)] p-4 space-y-3">
                      <p className="text-xs font-semibold uppercase tracking-widest text-[var(--muted-foreground)]">Transfer Target</p>
                      <div className="relative">
                        <Input
                          value={codeTransferSearchQuery}
                          onChange={(event) => {
                            setCodeTransferSearchQuery(event.target.value);
                            setSelectedCodeTransferTarget(null);
                            setAdminTransferTarget('');
                          }}
                          placeholder="Type username to search…"
                          onFocus={() => { if (codeTransferSearchResults.length > 0) setShowTransferDropdown(true); }}
                          onBlur={() => setTimeout(() => setShowTransferDropdown(false), 150)}
                          onKeyDown={(event) => {
                            if (event.key === 'Enter') {
                              event.preventDefault();
                              if (codeTransferSearchResults.length > 0) {
                                selectTransferTarget(codeTransferSearchResults[0]);
                              }
                            }
                            if (event.key === 'Escape') setShowTransferDropdown(false);
                          }}
                        />
                        {codeTransferSearchLoading && (
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[var(--muted-foreground)]">…</span>
                        )}
                        {showTransferDropdown && codeTransferSearchResults.length > 0 && (
                          <div className="absolute top-full left-0 z-50 mt-1 w-full overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--card)] shadow-lg">
                            {codeTransferSearchResults.map((result) => (
                              <button
                                key={result.username}
                                type="button"
                                className="flex w-full items-center justify-between gap-3 border-b border-[var(--border)] px-3 py-2.5 text-left text-sm last:border-b-0 hover:bg-[var(--muted)]/30"
                                onMouseDown={(e) => { e.preventDefault(); selectTransferTarget(result); }}
                              >
                                <span className="font-medium text-[var(--foreground)]">{result.username}</span>
                                <span className="text-xs text-[var(--muted-foreground)]">{result.displayName} · {result.packageTier}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                      {codeTransferSearchError && !showTransferDropdown ? (
                        <p className="text-sm text-amber-400">{codeTransferSearchError}</p>
                      ) : null}
                      {selectedCodeTransferTarget ? (
                        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-[var(--yor-copper)]/40 bg-[var(--yor-copper)]/5 px-3 py-2 text-sm">
                          <Badge variant="outline">{selectedCodeTransferTarget.username}</Badge>
                          <span className="text-[var(--foreground)]">{selectedCodeTransferTarget.displayName}</span>
                          <span className="text-[var(--muted-foreground)]">· {selectedCodeTransferTarget.packageTier}</span>
                          <button
                            type="button"
                            className="ml-auto text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                            onClick={() => { setSelectedCodeTransferTarget(null); setAdminTransferTarget(''); setCodeTransferSearchQuery(''); }}
                          >
                            ✕ clear
                          </button>
                        </div>
                      ) : null}
                    </div>

                    {/* Selection summary + actions */}
                    {selectedAdminCodes.length > 0 ? (
                      <div className="rounded-xl border border-[var(--border)] bg-[var(--background)] px-4 py-3 text-sm">
                        <span className="text-[var(--muted-foreground)]">
                          <strong className="text-[var(--foreground)]">{selectedAdminCodes.length}</strong> code{selectedAdminCodes.length !== 1 ? 's' : ''} selected
                        </span>
                      </div>
                    ) : (
                      <p className="text-xs text-[var(--muted-foreground)]">Select codes from the inventory table below to enable actions.</p>
                    )}

                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        disabled={!selectedAdminCodes.length}
                        onClick={handleReleaseCodes}
                        className="flex-1 bg-amber-500 text-white hover:bg-amber-600 disabled:opacity-40"
                      >
                        Release Selected
                      </Button>
                      <Button
                        type="button"
                        disabled={!selectedAdminCodes.length || !adminTransferTarget}
                        onClick={handleTransferCodes}
                        className="ops-admin-primary-action flex-1"
                      >
                        Transfer to {selectedCodeTransferTarget?.username ?? 'Member'}
                      </Button>
                    </div>
                    <Button
                      type="button"
                      disabled={!selectedAdminCodes.length || !adminTransferTarget}
                      onClick={() => void handleReleaseAndTransferCodes()}
                      className="w-full bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-40"
                    >
                      Release + Transfer to {selectedCodeTransferTarget?.username ?? 'Member'}
                    </Button>
                  </CardContent>
                </Card>
              </div>
              <Card className="ops-admin-table-card flex h-[640px] flex-col border-[var(--border)] bg-[var(--card)]">
                <CardHeader className="shrink-0">
                  <CardTitle>Code Inventory</CardTitle>
                </CardHeader>
                <CardContent className="flex min-h-0 flex-1 flex-col p-0 pb-0">
                  <div className="ops-code-table flex min-h-0 flex-1 flex-col overflow-hidden rounded-none border-t border-[var(--border)]">
                    <div className="ops-code-table-actions shrink-0 flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border)] bg-[var(--background)] px-4 py-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-medium text-[var(--foreground)]">Select codes from the table</p>
                        <span className="text-xs text-[var(--muted-foreground)]">({filteredActivationInventory.length})</span>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        {/* Status filter */}
                        <select
                          className="h-8 rounded-lg border border-[var(--input)] bg-[var(--background)] px-2 text-xs text-[var(--foreground)] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--ring)]"
                          value={inventoryStatusFilter}
                          onChange={(e) => setInventoryStatusFilter(e.target.value as typeof inventoryStatusFilter)}
                        >
                          <option value="">All statuses</option>
                          <option value="unreleased">Unreleased</option>
                          <option value="available">Available</option>
                          <option value="used">Used</option>
                        </select>
                        {/* Sort */}
                        <select
                          className="h-8 rounded-lg border border-[var(--input)] bg-[var(--background)] px-2 text-xs text-[var(--foreground)] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--ring)]"
                          value={inventorySortBy}
                          onChange={(e) => setInventorySortBy(e.target.value as typeof inventorySortBy)}
                        >
                          <option value="recent">Most recent activity</option>
                          <option value="newest">Newest generated</option>
                          <option value="oldest">Oldest generated</option>
                          <option value="status">By status</option>
                        </select>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={!selectableAdminCodes.length}
                          onClick={() =>
                            setSelectedAdminCodes(allSelectableAdminCodesSelected ? [] : selectableAdminCodes)
                          }
                        >
                          {allSelectableAdminCodesSelected ? 'Clear Selection' : 'Select All'}
                        </Button>
                      </div>
                    </div>
                    <div className="min-h-0 flex-1 overflow-x-auto overflow-y-auto">
                      <table className="w-full min-w-[1220px] text-sm">
                        <thead className="sticky top-0 z-10">
                          <tr className="border-b border-[var(--border)] bg-[var(--background)] text-left text-xs uppercase tracking-[0.16em] text-[var(--muted-foreground)]">
                            <th className="w-16 px-4 py-3">Action</th>
                            <th className="px-4 py-3">Code</th>
                            <th className="px-4 py-3">Account</th>
                            <th className="px-4 py-3">Package</th>
                            <th className="px-4 py-3">Owner</th>
                            <th className="px-4 py-3">Status</th>
                            <th className="px-4 py-3">Remarks</th>
                            <th className="px-4 py-3">Generated</th>
                          </tr>
                        </thead>
                        <tbody>
                          {pagedInventory.map((item) => {
                            const isSelected = selectedAdminCodes.includes(item.code);
                            const isLocked = item.status === 'used' || item.status === 'lost';

                            return (
                              <tr
                                key={item.code}
                                className={cn(
                                  'cursor-pointer border-b border-[var(--border)] transition hover:bg-[var(--muted)]/30',
                                  isSelected && 'bg-[var(--muted)]/40',
                                  isLocked && 'cursor-not-allowed opacity-60'
                                )}
                                onClick={() => {
                                  if (!isLocked) {
                                    toggleAdminCodeSelection(item.code);
                                  }
                                }}
                              >
                                <td className="px-4 py-3">
                                  <input
                                    aria-label={`Select ${item.code}`}
                                    type="checkbox"
                                    checked={isSelected}
                                    disabled={isLocked}
                                    onClick={(event) => event.stopPropagation()}
                                    onChange={() => toggleAdminCodeSelection(item.code)}
                                  />
                                </td>
                                <td className="px-4 py-3 font-mono text-[var(--yor-copper-soft)]">{item.code}</td>
                                <td className="px-4 py-3">{formatAccountTypeLabel(item.accountType, item.paymentStatus)}</td>
                                <td className="px-4 py-3">{item.packageTier}</td>
                                <td className="px-4 py-3">
                                  {item.assignedTo === 'Unassigned'
                                    ? <span className="text-xs italic text-[var(--muted-foreground)]">Loose pool</span>
                                    : item.assignedTo}
                                </td>
                                <td className="px-4 py-3">
                                  <Badge variant={item.status === 'available' ? 'success' : item.status === 'unreleased' || item.status === 'lost' ? 'warning' : 'outline'}>
                                    {item.status}
                                  </Badge>
                                </td>
                                <td className="px-4 py-3 text-[var(--muted-foreground)]">{item.remarks || '-'}</td>
                                <td className="px-4 py-3 text-[var(--muted-foreground)]">{item.generatedAt}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                    {/* Pagination footer */}
                    {totalInventoryPages > 1 && (
                      <div className="shrink-0 flex items-center justify-between border-t border-[var(--border)] bg-[var(--background)] px-4 py-2 text-xs text-[var(--muted-foreground)]">
                        <span>{(safePage - 1) * INVENTORY_PAGE_SIZE + 1}–{Math.min(safePage * INVENTORY_PAGE_SIZE, filteredActivationInventory.length)} of {filteredActivationInventory.length}</span>
                        <div className="flex gap-1">
                          <button type="button" disabled={safePage <= 1} className="rounded px-2 py-1 disabled:opacity-30 hover:bg-[var(--muted)]/30" onClick={() => setInventoryPage((p) => p - 1)}>← Prev</button>
                          <span className="px-2 py-1">{safePage} / {totalInventoryPages}</span>
                          <button type="button" disabled={safePage >= totalInventoryPages} className="rounded px-2 py-1 disabled:opacity-30 hover:bg-[var(--muted)]/30" onClick={() => setInventoryPage((p) => p + 1)}>Next →</button>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card className="ops-admin-table-card flex h-[480px] flex-col border-[var(--border)] bg-[var(--card)]">
                <CardHeader className="shrink-0">
                  <CardTitle>Code History</CardTitle>
                  <CardDescription>Latest activation-code events from the office ledger.</CardDescription>
                </CardHeader>
                <CardContent className="flex min-h-0 flex-1 flex-col p-0 pb-0">
                  {activationCodes.auditTrail.length ? (
                    <div className="min-h-0 flex-1 overflow-hidden rounded-none border-t border-[var(--border)]">
                      <div className="h-full overflow-x-auto overflow-y-auto">
                        <table className="w-full min-w-[920px] text-sm">
                          <thead className="sticky top-0 z-10">
                            <tr className="border-b border-[var(--border)] bg-[var(--background)] text-left text-xs uppercase tracking-[0.16em] text-[var(--muted-foreground)]">
                              <th className="px-4 py-3">Actor</th>
                              <th className="px-4 py-3">Action</th>
                              <th className="px-4 py-3">Code</th>
                              <th className="px-4 py-3">Time</th>
                            </tr>
                          </thead>
                          <tbody>
                            {activationCodes.auditTrail.map((event) => (
                              <tr key={`${event.action}-${event.target}-${event.occurredAt}`} className="border-b border-[var(--border)] last:border-b-0">
                                <td className="px-4 py-3">{event.actor}</td>
                                <td className="px-4 py-3">{formatAuditActionLabel(event.action)}</td>
                                <td className="px-4 py-3 font-mono text-[var(--yor-copper-soft)]">{event.target}</td>
                                <td className="px-4 py-3 text-[var(--muted-foreground)]">{event.occurredAt}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-[var(--muted-foreground)]">No activation-code history yet.</p>
                  )}
                </CardContent>
              </Card>
            </section>
          ) : null}

          {moduleId === 'member-management' && memberCenter ? (
            <section className="space-y-4">
              <Card className="border-[var(--border)] bg-[var(--card)]">
                <CardHeader>
                  <CardTitle>Member Profile Update</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto_auto]">
                    <Input
                      value={memberSearchDraft}
                      onChange={(event) => setMemberSearchDraft(event.target.value)}
                      placeholder="Search username, referral code, or member name"
                    />
                    <Button type="button" className="ops-admin-primary-action" onClick={handleSearchMembers}>
                      Search Member
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setMemberSearchDraft('');
                        setMemberSearchQuery('');
                        setMemberPage(1);
                        setMemberDetailUsername('');
                      }}
                    >
                      Clear
                    </Button>
                  </div>

                  {memberCenter.selectedMember ? (
                    <>
                      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                        <DataPoint label="Username" value={memberCenter.selectedMember.username} />
                        <DataPoint label="Package" value={memberCenter.selectedMember.packageTier} />
                        <DataPoint label="Status" value={memberCenter.selectedMember.accountStatus} />
                        <DataPoint label="Referral Code" value={memberCenter.selectedMember.referralCode} />
                        <DataPoint label="Sponsor Code" value={memberCenter.selectedMember.sponsorCode} />
                        <DataPoint label="Direct Referrals" value={memberCenter.selectedMember.directReferrals} />
                      </div>

                      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                        {/* Names — all roles can edit */}
                        <label className="grid gap-2 text-sm">
                          <span className="font-medium text-[var(--muted-foreground)]">First Name</span>
                          <Input value={memberProfileDraft.firstName} onChange={(event) => handleMemberProfileField('firstName', event.target.value)} />
                        </label>
                        <label className="grid gap-2 text-sm">
                          <span className="font-medium text-[var(--muted-foreground)]">Last Name</span>
                          <Input value={memberProfileDraft.lastName} onChange={(event) => handleMemberProfileField('lastName', event.target.value)} />
                        </label>
                        <label className="grid gap-2 text-sm">
                          <span className="font-medium text-[var(--muted-foreground)]">Middle Name</span>
                          <Input value={memberProfileDraft.middleName} onChange={(event) => handleMemberProfileField('middleName', event.target.value)} />
                        </label>
                        {/* Admin-only fields */}
                        {canEditFullMemberProfile ? (
                          <>
                            <label className="grid gap-2 text-sm">
                              <span className="font-medium text-[var(--muted-foreground)]">Username</span>
                              <Input
                                value={memberProfileDraft.newUsername}
                                onChange={(event) => handleMemberProfileField('newUsername', event.target.value)}
                                placeholder={memberProfileDraft.username}
                              />
                            </label>
                            <label className="grid gap-2 text-sm">
                              <span className="font-medium text-[var(--muted-foreground)]">Email</span>
                              <Input
                                type="email"
                                value={memberProfileDraft.email}
                                onChange={(event) => handleMemberProfileField('email', event.target.value)}
                              />
                            </label>
                            <label className="grid gap-2 text-sm">
                              <span className="font-medium text-[var(--muted-foreground)]">Password</span>
                              <div className="relative">
                                <Input
                                  type={showAdminMemberPassword ? 'text' : 'password'}
                                  value={memberProfileDraft.password}
                                  onChange={(event) => handleMemberProfileField('password', event.target.value)}
                                  placeholder="Leave blank to keep current"
                                  className="pr-10"
                                />
                                <button
                                  type="button"
                                  tabIndex={-1}
                                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)] transition hover:text-[var(--foreground)]"
                                  onClick={() => setShowAdminMemberPassword((v) => !v)}
                                  aria-label={showAdminMemberPassword ? 'Hide password' : 'Show password'}
                                >
                                  {showAdminMemberPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                                </button>
                              </div>
                            </label>
                            <label className="grid gap-2 text-sm">
                              <span className="font-medium text-[var(--muted-foreground)]">Contact Number</span>
                              <Input value={memberProfileDraft.contactNumber} onChange={(event) => handleMemberProfileField('contactNumber', event.target.value)} />
                            </label>
                            <label className="grid gap-2 text-sm">
                              <span className="font-medium text-[var(--muted-foreground)]">Payout Method</span>
                              <select
                                className="flex h-10 w-full rounded-xl border border-[var(--input)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
                                value={memberProfileDraft.payoutOption}
                                onChange={(event) => handleMemberProfileField('payoutOption', event.target.value)}
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
                            <label className="grid gap-2 text-sm">
                              <span className="font-medium text-[var(--muted-foreground)]">Account Number</span>
                              <Input value={memberProfileDraft.payoutDetails} onChange={(event) => handleMemberProfileField('payoutDetails', event.target.value)} placeholder="E-wallet or bank account number" />
                            </label>
                            <label className="grid gap-2 text-sm md:col-span-2 xl:col-span-3">
                              <span className="font-medium text-[var(--muted-foreground)]">Address</span>
                              <Input value={memberProfileDraft.address} onChange={(event) => handleMemberProfileField('address', event.target.value)} />
                            </label>
                          </>
                        ) : null}
                      </div>

                      <div className="flex flex-wrap gap-3">
                        <Button type="button" className="ops-admin-primary-action" disabled={isMemberProfileSaving} onClick={handleSaveMemberProfile}>
                          {isMemberProfileSaving ? 'Saving…' : 'Save Profile'}
                        </Button>
                        {canChangeMemberStatus ? (
                          <>
                            <Button type="button" variant="outline" onClick={() => handleMemberStatusAction(memberCenter.selectedMember!.username, 'active')}>
                              Activate
                            </Button>
                            <Button type="button" variant="outline" onClick={() => handleMemberStatusAction(memberCenter.selectedMember!.username, 'frozen')}>
                              Freeze
                            </Button>
                            <Button type="button" variant="outline" onClick={() => handleMemberStatusAction(memberCenter.selectedMember!.username, 'suspended')}>
                              Suspend
                            </Button>
                          </>
                        ) : null}
                      </div>
                    </>
                  ) : (
                    <div className="rounded-xl border border-dashed border-[var(--border)] bg-[var(--background)] p-5 text-sm text-[var(--muted-foreground)]">
                      Search a username to load the member details form.
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="border-[var(--border)] bg-[var(--card)]">
                <CardHeader>
                  <CardTitle>Member Directory</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="overflow-x-auto rounded-xl border border-[var(--border)]">
                    <table className="w-full min-w-[1280px] text-sm">
                      <thead>
                        <tr className="border-b border-[var(--border)] bg-[var(--background)] text-left text-xs uppercase tracking-[0.16em] text-[var(--muted-foreground)]">
                          <th className="px-4 py-3">Username</th>
                          <th className="px-4 py-3">Name</th>
                          <th className="px-4 py-3">Package</th>
                          <th className="px-4 py-3">Status</th>
                          <th className="px-4 py-3">Sponsor</th>
                          <th className="px-4 py-3">Direct Referrals</th>
                          <th className="px-4 py-3">Wallet</th>
                          <th className="px-4 py-3">CD Balance</th>
                          <th className="px-4 py-3">Last Activity</th>
                          <th className="px-4 py-3">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {memberCenter.rows.map((row) => (
                          <tr
                            key={row.username}
                            className={cn(
                              'cursor-pointer border-b border-[var(--border)] align-top transition hover:bg-[var(--muted)]/30',
                              memberCenter.selectedMember?.username === row.username && 'bg-[var(--muted)]/40'
                            )}
                            onClick={() => handleSelectMember(row.username)}
                          >
                            <td className="px-4 py-3 font-mono text-[var(--yor-copper-soft)]">{row.username}</td>
                            <td className="px-4 py-3">{row.fullName}</td>
                            <td className="px-4 py-3">{row.packageTier}</td>
                            <td className="px-4 py-3">
                              <Badge variant={row.accountStatus === 'active' ? 'success' : row.accountStatus === 'pending' ? 'warning' : 'outline'}>
                                {row.accountStatus}
                              </Badge>
                            </td>
                            <td className="px-4 py-3">{row.sponsorCode}</td>
                            <td className="px-4 py-3">{row.directReferrals}</td>
                            <td className="px-4 py-3">{row.walletAvailable}</td>
                            <td className="px-4 py-3">{row.cdBalance}</td>
                            <td className="px-4 py-3 text-[var(--muted-foreground)]">{row.lastActivity}</td>
                            <td className="px-4 py-3">
                              <div className="flex min-w-[360px] flex-wrap gap-2">
                                <Button type="button" size="sm" className="ops-admin-primary-action" onClick={(event) => {
                                  event.stopPropagation();
                                  handleSelectMember(row.username);
                                }}>
                                  Account Details
                                </Button>
                                <Button type="button" size="sm" variant="outline" onClick={(event) => {
                                  event.stopPropagation();
                                  openMemberWorkflow(financeModulePath, row.username);
                                }}>
                                  View Income
                                </Button>
                                {row.actions.includes('cd-details') ? (
                                  <Button type="button" size="sm" variant="outline" onClick={(event) => {
                                    event.stopPropagation();
                                    openMemberWorkflow(cdAccountsModulePath, row.username);
                                  }}>
                                    CD Details
                                  </Button>
                                ) : null}
                                {canChangeMemberStatus && row.actions.includes('freeze') ? (
                                  <Button type="button" size="sm" variant="outline" onClick={(event) => {
                                    event.stopPropagation();
                                    void handleMemberStatusAction(row.username, 'frozen');
                                  }}>
                                    Freeze
                                  </Button>
                                ) : null}
                                {canChangeMemberStatus && row.actions.includes('suspend') ? (
                                  <Button type="button" size="sm" variant="outline" onClick={(event) => {
                                    event.stopPropagation();
                                    void handleMemberStatusAction(row.username, 'suspended');
                                  }}>
                                    Suspend
                                  </Button>
                                ) : null}
                                {canChangeMemberStatus && row.actions.includes('activate') ? (
                                  <Button type="button" size="sm" variant="outline" onClick={(event) => {
                                    event.stopPropagation();
                                    void handleMemberStatusAction(row.username, 'active');
                                  }}>
                                    Activate
                                  </Button>
                                ) : null}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="flex flex-col gap-3 border-t border-[var(--border)] pt-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="text-sm text-[var(--muted-foreground)]">
                      Page {memberCenter.page} of {memberCenter.totalPages} / {memberCenter.total} members
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={memberCenter.page <= 1}
                        onClick={() => setMemberPage((current) => Math.max(1, current - 1))}
                      >
                        Prev
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={memberCenter.page >= memberCenter.totalPages}
                        onClick={() => setMemberPage((current) => Math.min(memberCenter.totalPages, current + 1))}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </section>
          ) : null}

          {/* ── ACCOUNT DETAILS (cashier + admin) ── */}
          {moduleId === 'account-details' && memberCenter ? (
            <section className="space-y-4">
              <Card className="border-[var(--border)] bg-[var(--card)]">
                <CardHeader>
                  <CardDescription className="text-xs">
                    {isCashierRole
                      ? 'Search a member to update their name. Cashier accounts may only edit first name, middle name, and last name.'
                      : 'Search a member to view and update their profile, credentials, and payout settings.'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto_auto]">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[var(--muted-foreground)]" />
                      <Input
                        value={memberSearchDraft}
                        onChange={(event) => setMemberSearchDraft(event.target.value)}
                        placeholder="Search by username, name, or referral code"
                        className="pl-9"
                        onKeyDown={(event) => {
                          if (event.key === 'Enter') {
                            event.preventDefault();
                            handleSearchMembers();
                          }
                        }}
                      />
                    </div>
                    <Button type="button" className="ops-admin-primary-action" onClick={handleSearchMembers}>
                      Search
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setMemberSearchDraft('');
                        setMemberSearchQuery('');
                        setMemberPage(1);
                        setMemberDetailUsername('');
                      }}
                    >
                      Clear
                    </Button>
                  </div>

                  {memberCenter.selectedMember ? (
                    <>
                      {/* Read-only profile info */}
                      <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
                        {[
                          ['Username', memberCenter.selectedMember.username],
                          ['Package', memberCenter.selectedMember.packageTier],
                          ['Status', memberCenter.selectedMember.accountStatus],
                          ['Referral Code', memberCenter.selectedMember.referralCode],
                        ].map(([label, value]) => (
                          <div key={label} className="flex flex-col gap-0.5 rounded-xl border border-[var(--border)] bg-[var(--background)] px-3.5 py-3">
                            <span className="text-[10px] font-semibold uppercase tracking-widest text-[var(--muted-foreground)]">{label}</span>
                            <span className="text-sm font-medium text-[var(--foreground)]">{String(value)}</span>
                          </div>
                        ))}
                      </div>

                      <div className="rounded-xl border border-[var(--border)] bg-[var(--background)] p-4">
                        <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-[var(--muted-foreground)]">
                          {isCashierRole ? 'Edit Names' : 'Edit Profile'}
                        </p>
                        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                          <label className="grid gap-2 text-sm">
                            <span className="font-medium text-[var(--muted-foreground)]">First Name</span>
                            <Input value={memberProfileDraft.firstName} onChange={(event) => handleMemberProfileField('firstName', event.target.value)} />
                          </label>
                          <label className="grid gap-2 text-sm">
                            <span className="font-medium text-[var(--muted-foreground)]">Last Name</span>
                            <Input value={memberProfileDraft.lastName} onChange={(event) => handleMemberProfileField('lastName', event.target.value)} />
                          </label>
                          <label className="grid gap-2 text-sm">
                            <span className="font-medium text-[var(--muted-foreground)]">Middle Name</span>
                            <Input value={memberProfileDraft.middleName} onChange={(event) => handleMemberProfileField('middleName', event.target.value)} />
                          </label>

                          {canEditFullMemberProfile ? (
                            <>
                              <label className="grid gap-2 text-sm">
                                <span className="font-medium text-[var(--muted-foreground)]">Username</span>
                                <Input
                                  value={memberProfileDraft.newUsername}
                                  onChange={(event) => handleMemberProfileField('newUsername', event.target.value)}
                                  placeholder={memberProfileDraft.username}
                                />
                              </label>
                              <label className="grid gap-2 text-sm">
                                <span className="font-medium text-[var(--muted-foreground)]">Email</span>
                                <Input
                                  type="email"
                                  value={memberProfileDraft.email}
                                  onChange={(event) => handleMemberProfileField('email', event.target.value)}
                                />
                              </label>
                              <label className="grid gap-2 text-sm">
                                <span className="font-medium text-[var(--muted-foreground)]">Password</span>
                                <div className="relative">
                                  <Input
                                    type={showAdminMemberPassword ? 'text' : 'password'}
                                    value={memberProfileDraft.password}
                                    onChange={(event) => handleMemberProfileField('password', event.target.value)}
                                    placeholder="Leave blank to keep current"
                                    className="pr-10"
                                  />
                                  <button
                                    type="button"
                                    tabIndex={-1}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)] transition hover:text-[var(--foreground)]"
                                    onClick={() => setShowAdminMemberPassword((v) => !v)}
                                  >
                                    {showAdminMemberPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                                  </button>
                                </div>
                              </label>
                              <label className="grid gap-2 text-sm">
                                <span className="font-medium text-[var(--muted-foreground)]">Payout Method</span>
                                <select
                                  className="flex h-10 w-full rounded-xl border border-[var(--input)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
                                  value={memberProfileDraft.payoutOption}
                                  onChange={(event) => handleMemberProfileField('payoutOption', event.target.value)}
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
                              <label className="grid gap-2 text-sm">
                                <span className="font-medium text-[var(--muted-foreground)]">Account Number</span>
                                <Input value={memberProfileDraft.payoutDetails} onChange={(event) => handleMemberProfileField('payoutDetails', event.target.value)} placeholder="E-wallet or bank account number" />
                              </label>
                            </>
                          ) : null}
                        </div>

                        <div className="mt-4 flex flex-wrap gap-3">
                          <Button type="button" className="ops-admin-primary-action" disabled={isMemberProfileSaving} onClick={handleSaveMemberProfile}>
                            {isMemberProfileSaving ? 'Saving…' : 'Update Profile'}
                          </Button>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="rounded-xl border border-dashed border-[var(--border)] bg-[var(--background)] p-6 text-center text-sm text-[var(--muted-foreground)]">
                      Search a member username or name above to load their account details.
                    </div>
                  )}

                  {/* Member directory list (compact) */}
                  {memberCenter.rows.length > 0 && (
                    <div className="overflow-hidden rounded-xl border border-[var(--border)]">
                      <div className="overflow-x-auto">
                        <table className="w-full min-w-[640px] text-sm">
                          <thead>
                            <tr className="border-b border-[var(--border)] bg-[var(--background)] text-left text-xs uppercase tracking-[0.16em] text-[var(--muted-foreground)]">
                              <th className="px-4 py-3">Username</th>
                              <th className="px-4 py-3">Full Name</th>
                              <th className="px-4 py-3">Package</th>
                              <th className="px-4 py-3">Status</th>
                              <th className="px-4 py-3">Action</th>
                            </tr>
                          </thead>
                          <tbody>
                            {memberCenter.rows.map((row) => (
                              <tr
                                key={row.username}
                                className={cn(
                                  'cursor-pointer border-b border-[var(--border)] transition hover:bg-[var(--muted)]/30',
                                  memberCenter.selectedMember?.username === row.username && 'bg-[var(--muted)]/40'
                                )}
                                onClick={() => handleSelectMember(row.username)}
                              >
                                <td className="px-4 py-3 font-mono text-[var(--yor-copper-soft)]">{row.username}</td>
                                <td className="px-4 py-3">{row.fullName}</td>
                                <td className="px-4 py-3">{row.packageTier}</td>
                                <td className="px-4 py-3">
                                  <Badge variant={row.accountStatus === 'active' ? 'success' : row.accountStatus === 'pending' ? 'warning' : 'outline'}>
                                    {row.accountStatus}
                                  </Badge>
                                </td>
                                <td className="px-4 py-3">
                                  <Button type="button" size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); handleSelectMember(row.username); }}>
                                    Select
                                  </Button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      <div className="flex items-center justify-between gap-3 border-t border-[var(--border)] bg-[var(--background)] px-4 py-3">
                        <span className="text-xs text-[var(--muted-foreground)]">Page {memberCenter.page} of {memberCenter.totalPages} / {memberCenter.total} members</span>
                        <div className="flex gap-2">
                          <Button type="button" variant="outline" size="sm" disabled={memberCenter.page <= 1} onClick={() => setMemberPage((p) => Math.max(1, p - 1))}>Prev</Button>
                          <Button type="button" variant="outline" size="sm" disabled={memberCenter.page >= memberCenter.totalPages} onClick={() => setMemberPage((p) => Math.min(memberCenter.totalPages, p + 1))}>Next</Button>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </section>
          ) : null}

          {moduleId === 'encashment-reports' && encashments ? (() => {
            const ENCASHMENT_PAGE_SIZE = 100;
            const allFiltered = encashments.encashments.filter((item) => {
              if (encashmentStatusFilter === 'all') return true;
              if (encashmentStatusFilter === 'paid') return /paid/i.test(item.status);
              if (encashmentStatusFilter === 'cancelled') return /cancel/i.test(item.status);
              return !/paid/i.test(item.status) && !/cancel/i.test(item.status);
            });
            const encTotalPages = Math.max(1, Math.ceil(allFiltered.length / ENCASHMENT_PAGE_SIZE));
            const safePage = Math.min(encashmentPage, encTotalPages);
            const pageRows = allFiltered.slice((safePage - 1) * ENCASHMENT_PAGE_SIZE, safePage * ENCASHMENT_PAGE_SIZE);

            return (
              <section className="grid gap-4">
                {/* ── Queue Table ── */}
                <Card className="border-[var(--border)] bg-[var(--card)]">
                  <CardHeader className="gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <CardTitle>Encashment Queue</CardTitle>
                      <div className="mt-1 flex gap-3 text-xs text-[var(--muted-foreground)]">
                        <span>Gross: {formatCurrency(encashments.totals.gross)}</span>
                        <span>Net: {formatCurrency(encashments.totals.net)}</span>
                        <span>Awaiting: {encashments.totals.awaitingReview}</span>
                      </div>
                    </div>
                    <div className="flex gap-1.5">
                      {(['all', 'pending', 'paid', 'cancelled'] as const).map((f) => (
                        <button
                          key={f}
                          type="button"
                          onClick={() => { setEncashmentStatusFilter(f); setEncashmentPage(1); }}
                          className={cn(
                            'rounded-lg px-3 py-1 text-xs font-medium transition',
                            encashmentStatusFilter === f
                              ? 'bg-[var(--foreground)] text-[var(--background)]'
                              : 'bg-[var(--muted)]/40 text-[var(--muted-foreground)] hover:bg-[var(--muted)]/70'
                          )}
                        >
                          {f.charAt(0).toUpperCase() + f.slice(1)}
                        </button>
                      ))}
                    </div>
                  </CardHeader>
                  <CardContent className="p-0 pb-0">
                    <div className="h-[420px] flex flex-col overflow-hidden border-t border-[var(--border)]">
                      <div className="overflow-x-auto flex-1 overflow-y-auto">
                        <table className="w-full min-w-[800px] text-sm">
                          <thead className="sticky top-0 z-10">
                            <tr className="border-b border-[var(--border)] bg-[var(--card)] text-left text-xs uppercase tracking-[0.16em] text-[var(--muted-foreground)]">
                              <th className="px-4 py-3">#</th>
                              <th className="px-4 py-3">Member</th>
                              <th className="px-4 py-3">Reference</th>
                              <th className="px-4 py-3">Method</th>
                              <th className="px-4 py-3">Gross</th>
                              <th className="px-4 py-3">Net</th>
                              <th className="px-4 py-3">Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {pageRows.length === 0 ? (
                              <tr>
                                <td colSpan={7} className="px-4 py-8 text-center text-sm text-[var(--muted-foreground)]">
                                  No encashments match the selected filter.
                                </td>
                              </tr>
                            ) : pageRows.map((item) => {
                              const selected = selectedEncashment?.id === item.id;
                              return (
                                <tr
                                  key={item.id}
                                  className={cn(
                                    'cursor-pointer border-b border-[var(--border)] transition hover:bg-[var(--muted)]/30',
                                    selected && 'bg-[var(--muted)]/40'
                                  )}
                                  onClick={() => handleSelectEncashment(item.id)}
                                >
                                  <td className="px-4 py-3 text-xs text-[var(--muted-foreground)]">{item.queueOrder}</td>
                                  <td className="px-4 py-3 font-medium text-[var(--foreground)]">{item.member}</td>
                                  <td className="px-4 py-3 font-mono text-xs text-[var(--yor-copper-soft)]">{item.id}</td>
                                  <td className="px-4 py-3">{item.method}</td>
                                  <td className="px-4 py-3">{item.gross}</td>
                                  <td className="px-4 py-3">{item.net}</td>
                                  <td className="px-4 py-3">
                                    <Badge variant={/paid/i.test(item.status) ? 'success' : /cancel/i.test(item.status) ? 'warning' : 'outline'}>
                                      {item.status}
                                    </Badge>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                      {encTotalPages > 1 && (
                        <div className="flex items-center justify-between gap-3 border-t border-[var(--border)] px-4 py-2 text-xs text-[var(--muted-foreground)]">
                          <button
                            type="button"
                            disabled={safePage <= 1}
                            onClick={() => setEncashmentPage((p) => Math.max(1, p - 1))}
                            className="rounded px-2 py-1 hover:bg-[var(--muted)]/40 disabled:opacity-40"
                          >
                            ← Prev
                          </button>
                          <span>Page {safePage} of {encTotalPages}</span>
                          <button
                            type="button"
                            disabled={safePage >= encTotalPages}
                            onClick={() => setEncashmentPage((p) => Math.min(encTotalPages, p + 1))}
                            className="rounded px-2 py-1 hover:bg-[var(--muted)]/40 disabled:opacity-40"
                          >
                            Next →
                          </button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* ── Selected Detail ── */}
                <Card className="border-[var(--border)] bg-[var(--card)]">
                  <CardHeader>
                    <CardTitle>Selected Request</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {selectedEncashment ? (
                      <>
                        {/* Encashment values are member-submitted and fixed. The admin
                            only settles the request — no field is editable. */}
                        <div className="grid gap-3 sm:grid-cols-2">
                          <DataPoint label="Member" value={selectedEncashment.member} />
                          <DataPoint label="Status" value={selectedEncashment.status} />
                          <DataPoint label="Payout Method" value={encashmentDraft.method || '—'} />
                          <DataPoint label="Remarks" value={encashmentDraft.remarks || '—'} />
                        </div>
                        <div className="rounded-xl border border-[var(--border)] bg-[var(--background)] p-4">
                          <div className="grid gap-2 text-sm text-[var(--muted-foreground)]">
                            <div className="flex items-center justify-between gap-3">
                              <span>Gross</span>
                              <strong className="text-[var(--foreground)]">{selectedEncashment.gross}</strong>
                            </div>
                            <div className="flex items-center justify-between gap-3">
                              <span>Fee</span>
                              <strong className="text-[var(--foreground)]">{formatCurrency(parseMoneyValue(encashmentDraft.fee))}</strong>
                            </div>
                            <div className="flex items-center justify-between gap-3">
                              <span>Tax</span>
                              <strong className="text-[var(--foreground)]">{formatCurrency(parseMoneyValue(encashmentDraft.tax))}</strong>
                            </div>
                            <div className="flex items-center justify-between gap-3">
                              <span>CD Deduction</span>
                              <strong className="text-[var(--foreground)]">{formatCurrency(parseMoneyValue(encashmentDraft.cdDeduction))}</strong>
                            </div>
                            <div className="flex items-center justify-between gap-3 border-t border-[var(--border)] pt-2">
                              <span>Net Receivable</span>
                              <strong className="text-[var(--foreground)]">{selectedEncashment.net}</strong>
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Button
                            type="button"
                            className="flex-1"
                            disabled={!canApproveEncashment || /paid/i.test(selectedEncashment.status)}
                            onClick={() => void handleReviewEncashment('mark-paid')}
                          >
                            {/paid/i.test(selectedEncashment.status) ? 'Already Paid' : 'Mark Paid'}
                          </Button>
                        </div>
                      </>
                    ) : (
                      <div className="rounded-xl border border-dashed border-[var(--border)] bg-[var(--background)] p-5 text-sm text-[var(--muted-foreground)]">
                        Select an encashment row to review gross, net, deductions, remarks, and settlement actions.
                      </div>
                    )}
                  </CardContent>
                </Card>
              </section>
            );
          })() : null}

          {moduleId === 'account-genealogy' ? (
            <section className="ops-admin-tree-grid grid gap-4">
              <Card className="ops-admin-tree-card border-[var(--border)] bg-[var(--card)] xl:col-span-2">
                <CardHeader className="ops-admin-tree-header gap-4 md:flex-row md:items-end md:justify-between">
                  <div>
                    <CardTitle>Account Genealogy</CardTitle>
                  </div>
                  <div className="ops-admin-tree-search flex w-full max-w-xl flex-col gap-2 sm:flex-row sm:items-center">
                    <Input
                      value={treeSearchInput}
                      onChange={(event) => setTreeSearchInput(event.target.value)}
                      placeholder="Enter username or referral code"
                    />
                    <Button
                      type="button"
                      className="ops-admin-primary-action"
                      disabled={!treeSearchInput.trim()}
                      onClick={() => setTreeRootUsername(treeSearchInput.trim())}
                    >
                      Search Tree
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setTreeSearchInput('');
                        setTreeRootUsername('');
                        setSelectedTreeNodeId(null);
                      }}
                    >
                      Reset
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {genealogyTree ? (
                    <GenealogyTree
                      root={genealogyTree.root}
                      selectedNodeId={selectedTreeNodeId}
                      onSelect={setSelectedTreeNodeId}
                      onNavigateToNode={(username) => {
                        setTreeSearchInput(username);
                        setTreeRootUsername(username);
                      }}
                      adminMode={true}
                    />
                  ) : treeRootUsername ? (
                    <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-8 text-sm text-destructive">
                      Member <strong>{treeRootUsername}</strong> was not found. The username may have changed — try searching with the updated username.
                    </div>
                  ) : (
                    <div className="rounded-xl border border-dashed border-[var(--border)] bg-[var(--background)] p-8 text-sm text-[var(--muted-foreground)]">
                      Enter a username such as yor01, YOR0002, or a referral code to load the tree.
                    </div>
                  )}
                </CardContent>
              </Card>
              {genealogyTree ? (
                <section className="grid gap-4">
                  <section className="grid gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
                    <Card className="border-[var(--border)] bg-[var(--card)]">
                      <CardHeader>
                        <CardTitle>Tree Summary</CardTitle>
                      </CardHeader>
                      <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                        <DataPoint label="Accounts On Left" value={leftAccountCount} />
                        <DataPoint label="Accounts On Right" value={rightAccountCount} />
                        <DataPoint label="Matched Points" value={matchedPoints} />
                        <DataPoint label="Tree Type" value={genealogyTree.treeType} />
                        <DataPoint label="Strong Leg Carry" value={strongLegCarry} />
                        <DataPoint label="Weak Leg Carry" value={weakLegCarry} />
                        <DataPoint label="Deepest Level" value={Math.max(...genealogyTree.nodes.map((node) => node.level), 0)} />
                      </CardContent>
                    </Card>
                    {selectedTreeNode ? (
                      <Card className="ops-admin-tree-detail-card border-[var(--border)] bg-[var(--card)]">
                        <CardHeader>
                          <CardTitle>Node Details</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-5">
                          <DataPoint label="Username" value={selectedTreeNode.username} />
                          <DataPoint label="Package" value={selectedTreeNode.packageTier} />
                          <DataPoint label="Placement" value={selectedTreeNode.placement} />
                          <DataPoint label="Level / Depth" value={selectedTreeNode.depth} />
                          <DataPoint label="Trace Path" value={selectedTreeNode.tracePath} />
                          <DataPoint label="Account State" value={selectedTreeNode.accountStateLabel} />
                          <DataPoint label="Direct Referrals" value={selectedTreeNode.directReferrals} />
                        </CardContent>
                      </Card>
                    ) : null}
                  </section>

                  {shadowAccounts ? (
                    <ShadowAccountsCard shadowAccounts={shadowAccounts} />
                  ) : null}
                </section>
              ) : null}
            </section>
          ) : null}

          {moduleId === 'finance-accounting' ? (
            <FinanceAccountingView activeModule={activeModule} />
          ) : null}

          {moduleId === 'get-five-reports' ? (
            <GetFiveRedeemView activeModule={activeModule} />
          ) : null}

          {moduleId === 'rankings' ? (
            <RankingsView activeModule={activeModule} />
          ) : null}

          {moduleId === 'leaderboard' ? (
            <LeaderboardInFrame showStanding={false} showTableHeader={false} />
          ) : null}

          {moduleId === 'global-bonus' ? (
            <GlobalBonusView activeModule={activeModule} />
          ) : null}

          {moduleId === 'cd-accounts' ? (
            <CdAccountsView activeModule={activeModule} />
          ) : null}

          {moduleId === 'voucher-management' ? (
            <VoucherManagementView activeModule={activeModule} />
          ) : null}

          {moduleId === 'contact-messages' ? (
            <ContactMessagesView activeModule={activeModule} />
          ) : null}

          {moduleId === 'unilevel-rank-progress' ? (
            <AdminUnilevelView />
          ) : null}

          {moduleId === 'news-posts' ? (
            <NewsPostsView activeModule={activeModule} />
          ) : null}

          {moduleId === 'change-password' ? (
            <ChangePasswordView />
          ) : null}

      </div>
    </ProtectedOfficeFrame>
  );
}

type AdminDashboardViewProps = {
  office: AdminOfficeData | null;
  mvpDashboard: AdminMvpDashboardData | null;
  user: AuthUser | null;
  quickLinks: Array<{ title: string; body: string; href: string }>;
};

const FALLBACK_QUICK_LINKS: Array<{
  title: string;
  body: string;
  href: string;
  icon: typeof Users;
  iconColor: string;
  iconBg: string;
}> = [
  {
    title: 'Member Management',
    body: 'Open the clean masterlist-style account view for sponsor, package, and status checks.',
    href: '/admin/member-management',
    icon: Users,
    iconColor: '#3b82f6',
    iconBg: 'rgba(59,130,246,0.12)'
  },
  {
    title: 'Account Genealogy',
    body: 'Inspect placement and open slots using the left and right slot rules members depend on.',
    href: '/admin/account-genealogy',
    icon: GitBranch,
    iconColor: '#ec4899',
    iconBg: 'rgba(236,72,153,0.12)'
  },
  {
    title: 'Manage Codes',
    body: 'Generate, release, and transfer sponsor-owned codes before the next registration pass.',
    href: '/admin/activation-codes',
    icon: KeyRound,
    iconColor: '#f59e0b',
    iconBg: 'rgba(245,158,11,0.12)'
  },
  {
    title: 'Encashment Queue',
    body: 'Review the Tuesday encashment and Friday payout queue with gross, deductions, and remarks.',
    href: '/admin/encashment-reports',
    icon: Banknote,
    iconColor: '#10b981',
    iconBg: 'rgba(16,185,129,0.12)'
  },
];

function resolvedQuickLinks(backendLinks: Array<{ title: string; body: string; href: string }>) {
  const iconMap: Record<string, { icon: typeof Users; iconColor: string; iconBg: string }> = {
    'member-management': { icon: Users, iconColor: '#3b82f6', iconBg: 'rgba(59,130,246,0.12)' },
    'account-genealogy': { icon: GitBranch, iconColor: '#ec4899', iconBg: 'rgba(236,72,153,0.12)' },
    'activation-codes': { icon: KeyRound, iconColor: '#f59e0b', iconBg: 'rgba(245,158,11,0.12)' },
    'encashment-reports': { icon: Banknote, iconColor: '#10b981', iconBg: 'rgba(16,185,129,0.12)' },
    'get-five-reports': { icon: TrendingUp, iconColor: '#8b5cf6', iconBg: 'rgba(139,92,246,0.12)' },
  };

  if (backendLinks.length > 0) {
    return backendLinks.map((link) => {
      const slug = link.href.split('/').pop() ?? '';
      const cfg = iconMap[slug] ?? { icon: LayoutDashboard, iconColor: '#6b7280', iconBg: 'rgba(107,114,128,0.12)' };
      return { ...link, ...cfg };
    });
  }

  return FALLBACK_QUICK_LINKS;
}

const STAT_CARD_CONFIG: Array<{
  metricKeywords: string[];
  icon: typeof Users;
  color: string;
  bg: string;
}> = [
  { metricKeywords: ['total', 'account', 'member'], icon: Users, color: '#3b82f6', bg: 'rgba(59,130,246,0.12)' },
  { metricKeywords: ['encash', 'payout', 'process'], icon: Banknote, color: '#10b981', bg: 'rgba(16,185,129,0.12)' },
  { metricKeywords: ['activat', 'code', 'registration'], icon: KeyRound, color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
  { metricKeywords: ['income', 'earn', 'bonus', 'commission'], icon: TrendingUp, color: '#8b5cf6', bg: 'rgba(139,92,246,0.12)' },
  { metricKeywords: ['genealog', 'tree', 'network', 'referral'], icon: GitBranch, color: '#ec4899', bg: 'rgba(236,72,153,0.12)' },
  { metricKeywords: ['pending', 'queue', 'review'], icon: AlertCircle, color: '#f97316', bg: 'rgba(249,115,22,0.12)' },
];

function resolveStatCardConfig(label: string) {
  const lower = label.toLowerCase();
  for (const config of STAT_CARD_CONFIG) {
    if (config.metricKeywords.some((kw) => lower.includes(kw))) {
      return config;
    }
  }
  return { icon: LayoutDashboard, color: '#6b7280', bg: 'rgba(107,114,128,0.12)' };
}

type AdminStatCard = {
  label: string;
  sub: string;
  icon: typeof Users;
  color: string;
  bg: string;
  glow: string;
  border: string;
  metricKeywords: string[];
};

const ADMIN_STAT_CARDS: AdminStatCard[] = [
  {
    label: 'Total Accounts',
    sub: 'All registered members',
    icon: Users,
    color: '#3b82f6',
    bg: 'rgba(59,130,246,0.12)',
    glow: '0 4px 24px 0 rgba(59,130,246,0.15)',
    border: 'rgba(59,130,246,0.25)',
    metricKeywords: ['total account', 'total member', 'member count'],
  },
  {
    label: 'Processed Encashments',
    sub: 'Lifetime paid out',
    icon: Banknote,
    color: '#10b981',
    bg: 'rgba(16,185,129,0.12)',
    glow: '0 4px 24px 0 rgba(16,185,129,0.15)',
    border: 'rgba(16,185,129,0.25)',
    metricKeywords: ['processed encash', 'paid encash', 'lifetime payout'],
  },
  {
    label: 'Weekly Activations',
    sub: 'Last 7 days',
    icon: KeyRound,
    color: '#8b5cf6',
    bg: 'rgba(139,92,246,0.12)',
    glow: '0 4px 24px 0 rgba(139,92,246,0.15)',
    border: 'rgba(139,92,246,0.25)',
    metricKeywords: ['weekly activation', 'activation this week', 'last 7'],
  },
  {
    label: 'Pending Encashments',
    sub: 'Awaiting processing',
    icon: AlertCircle,
    color: '#f97316',
    bg: 'rgba(249,115,22,0.12)',
    glow: '0 4px 24px 0 rgba(249,115,22,0.15)',
    border: 'rgba(249,115,22,0.25)',
    metricKeywords: ['pending encash', 'encash queue', 'awaiting'],
  },
  {
    label: 'Active CD Accounts',
    sub: 'Still paying CD',
    icon: FileText,
    color: '#06b6d4',
    bg: 'rgba(6,182,212,0.12)',
    glow: '0 4px 24px 0 rgba(6,182,212,0.15)',
    border: 'rgba(6,182,212,0.25)',
    metricKeywords: ['cd account', 'active cd', 'paying cd'],
  },
  {
    label: 'Monthly Registrations',
    sub: 'This calendar month',
    icon: Eye,
    color: '#ec4899',
    bg: 'rgba(236,72,153,0.12)',
    glow: '0 4px 24px 0 rgba(236,72,153,0.15)',
    border: 'rgba(236,72,153,0.25)',
    metricKeywords: ['monthly reg', 'registration this month', 'new account'],
  },
];

function resolveAdminStatValue(cardCfg: AdminStatCard, metrics: AdminOfficeData['metrics']): string {
  const lower = (s: string) => s.toLowerCase();
  for (const metric of metrics) {
    if (cardCfg.metricKeywords.some((kw) => lower(metric.label).includes(kw))) {
      return metric.value;
    }
  }
  return '—';
}

function AdminDashboardView({ office, mvpDashboard, user }: Omit<AdminDashboardViewProps, 'quickLinks'>) {
  const metrics = office?.metrics ?? [];
  const displayName = user?.name ?? office?.profile.officeTitle ?? 'Admin';

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="admin-dash-welcome rounded-2xl border border-[var(--border)] bg-gradient-to-r from-[var(--card)] to-[var(--background)] px-6 py-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--muted-foreground)]">
            {office?.profile.officeTitle ?? 'Admin Office'}
          </p>
          <h2 className="mt-1 text-xl font-semibold text-[var(--foreground)]">
            Welcome back, {displayName}
          </h2>
        </div>
      </div>

      {/* 7-card Nogatu-style stat grid */}
      <section>
        <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--muted-foreground)]">Overview</p>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {ADMIN_STAT_CARDS.map((card) => {
            const Icon = card.icon;
            const value = resolveAdminStatValue(card, metrics);
            return (
              <div
                key={card.label}
                className="admin-stat-card group relative overflow-hidden flex items-center gap-4 rounded-2xl border bg-[var(--card)] px-5 py-4 transition-all hover:scale-[1.015] hover:shadow-xl"
                style={{ borderColor: card.border, boxShadow: `0 2px 12px 0 ${card.glow.split('0 4px')[1]?.trim() ?? 'transparent'}` }}
              >
                {/* Top glow line */}
                <div className="absolute inset-x-0 top-0 h-px opacity-60" style={{ background: `linear-gradient(to right, transparent, ${card.color}, transparent)` }} />
                <span
                  className="flex size-12 shrink-0 items-center justify-center rounded-xl shadow-sm"
                  style={{ background: card.bg }}
                >
                  <Icon className="size-5" style={{ color: card.color }} />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--muted-foreground)]">
                    {card.label}
                  </p>
                  <p className="mt-0.5 truncate text-xl font-bold" style={{ color: card.color }}>
                    {value}
                  </p>
                  <p className="mt-0.5 truncate text-[10px] text-[var(--muted-foreground)]">{card.sub}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
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

// ─── Shared helpers for new module views ──────────────────────────────────────

type ModuleViewProps = { activeModule: OperationalModule | null };

function getMetric(metrics: OperationalModule['metrics'], keywordParts: string[]): string {
  const lower = keywordParts.map((k) => k.toLowerCase());
  const match = metrics.find((m) => lower.every((k) => m.label.toLowerCase().includes(k)));
  return match?.value ?? '—';
}

const SELECT_CLASS =
  'flex h-10 w-full rounded-md border border-[var(--input)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]';

function ModuleEmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-dashed border-[var(--border)] bg-[var(--background)] px-6 py-10 text-center text-sm text-[var(--muted-foreground)]">
      {message}
    </div>
  );
}

// ─── 1. Finance Accounting View ───────────────────────────────────────────────

function FinanceAccountingView({ activeModule }: ModuleViewProps) {
  const [yearInput, setYearInput] = useState(String(new Date().getFullYear()));
  const metrics = activeModule?.metrics ?? [];
  const rows = activeModule?.table?.rows ?? [];

  const summaryStats = [
    { label: 'Gross Sales', keys: ['gross', 'sales'] },
    { label: 'Expense Reserve', keys: ['expense', 'reserve'] },
    { label: 'Service + Maintenance', keys: ['service', 'maintenance'] },
    { label: 'Encashment Requested', keys: ['encashment', 'requested'] },
    { label: 'CD Recovery Wallet', keys: ['cd', 'recovery'] },
    { label: 'Projected Margin', keys: ['projected', 'margin'] },
  ];

  return (
    <section className="space-y-5">
      <Card className="border-[var(--border)] bg-[var(--card)]">
        <CardHeader>
          <CardTitle>Annual Accounting Workspace</CardTitle>
          <CardDescription>
            {activeModule?.description ?? 'Review yearly financial summaries, package sales breakdown, and wallet allocations for the selected fiscal year.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="flex flex-wrap items-end gap-3">
            <label className="grid gap-1.5 text-sm">
              <span className="font-medium text-[var(--muted-foreground)]">Fiscal Year</span>
              <Input
                type="number"
                className="w-36"
                value={yearInput}
                onChange={(e) => setYearInput(e.target.value)}
                min={2020}
                max={2099}
              />
            </label>
            <Button type="button" variant="outline">Load Year</Button>
            <Button type="button" variant="outline" disabled>Export CSV</Button>
          </div>

          <div>
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--muted-foreground)]">Year Summary — {yearInput}</p>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {summaryStats.map((stat) => (
                <div key={stat.label} className="rounded-2xl border border-[var(--border)] bg-[var(--background)] px-4 py-3">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--muted-foreground)]">{stat.label}</p>
                  <p className="mt-1.5 text-lg font-semibold text-[var(--foreground)]">
                    {getMetric(metrics, stat.keys)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-[var(--border)] bg-[var(--card)]">
        <CardHeader>
          <CardTitle className="text-sm">Wallet Ledger</CardTitle>
          <CardDescription className="text-xs">Append-only wallet movement log for all members.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-xl border border-[var(--border)]">
            <table className="w-full min-w-[800px] text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] bg-[var(--background)] text-left text-xs uppercase tracking-[0.16em] text-[var(--muted-foreground)]">
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Source</th>
                  <th className="px-4 py-3">Credit</th>
                  <th className="px-4 py-3">Debit</th>
                  <th className="px-4 py-3">Balance</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {rows.length > 0 ? rows.map((row, i) => (
                  <tr key={i} className="border-b border-[var(--border)] transition hover:bg-[var(--muted)]/30">
                    <td className="px-4 py-3 text-[var(--muted-foreground)]">{String(row['date'] ?? '—')}</td>
                    <td className="px-4 py-3">{String(row['type'] ?? '—')}</td>
                    <td className="px-4 py-3 text-[var(--foreground)]">{String(row['source'] ?? '—')}</td>
                    <td className="px-4 py-3 text-emerald-400">{String(row['credit'] ?? '—')}</td>
                    <td className="px-4 py-3 text-red-400">{String(row['debit'] ?? '—')}</td>
                    <td className="px-4 py-3 font-semibold text-amber-400">{String(row['balance'] ?? '—')}</td>
                    <td className="px-4 py-3">
                      <Badge variant="outline" className="text-[10px]">{String(row['status'] ?? '—')}</Badge>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={7} className="px-4 py-6 text-center text-sm text-[var(--muted-foreground)]">No wallet entries for selected year.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-xs text-[var(--muted-foreground)]">Showing {rows.length} {rows.length === 1 ? 'entry' : 'entries'}</p>
        </CardContent>
      </Card>
    </section>
  );
}

// ─── 2. Get Five Redeem View ──────────────────────────────────────────────────

function GetFiveRedeemView({ activeModule }: ModuleViewProps) {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const rows = activeModule?.table?.rows ?? [];

  return (
    <section className="space-y-5">
      <Card className="border-[var(--border)] bg-[var(--card)]">
        <CardHeader>
          <CardTitle>Get Yor Five — Bonus Report</CardTitle>
          <CardDescription>
            Qualification bonuses are posted automatically when the system detects 5 same-package direct referrals. No manual action required.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 rounded-xl border border-emerald-500/20 bg-emerald-500/8 px-4 py-3 text-sm text-emerald-600 dark:text-emerald-400">
            Payouts are system-automated — qualifying groups are credited to the member wallet without admin intervention.
          </div>
          <div className="flex flex-wrap items-end gap-3">
            <label className="grid gap-1.5 text-sm">
              <span className="font-medium text-[var(--muted-foreground)]">Start Date</span>
              <Input type="date" className="w-44" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </label>
            <label className="grid gap-1.5 text-sm">
              <span className="font-medium text-[var(--muted-foreground)]">End Date</span>
              <Input type="date" className="w-44" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </label>
            <Button type="button" variant="outline">Filter</Button>
            <Button type="button" variant="outline" onClick={() => { setStartDate(''); setEndDate(''); }}>Clear</Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-[var(--border)] bg-[var(--card)]">
        <CardHeader>
          <CardTitle>Bonus Records</CardTitle>
          <CardDescription className="text-xs">Read-only log of all automatically credited Get Yor Five bonuses.</CardDescription>
        </CardHeader>
        <CardContent>
          {rows.length === 0 ? (
            <ModuleEmptyState message="No bonus records yet." />
          ) : (
            <div className="overflow-x-auto rounded-xl border border-[var(--border)]">
              <table className="w-full min-w-[760px] text-sm">
                <thead>
                  <tr className="border-b border-[var(--border)] bg-[var(--background)] text-left text-xs uppercase tracking-[0.16em] text-[var(--muted-foreground)]">
                    <th className="px-4 py-3">Name</th>
                    <th className="px-4 py-3">Username</th>
                    <th className="px-4 py-3">Package</th>
                    <th className="px-4 py-3">Bonus</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, i) => {
                    const status = String(row['status'] ?? row['Status'] ?? '');
                    const isPosted = /posted|credited|auto/i.test(status);
                    return (
                      <tr key={i} className="border-b border-[var(--border)] transition hover:bg-[var(--muted)]/30">
                        <td className="px-4 py-3 text-[var(--foreground)]">{String(row['name'] ?? row['Name'] ?? '—')}</td>
                        <td className="px-4 py-3 font-mono text-[var(--muted-foreground)]">{String(row['username'] ?? row['Username'] ?? '—')}</td>
                        <td className="px-4 py-3">{String(row['product'] ?? row['Product'] ?? row['package'] ?? row['Package'] ?? '—')}</td>
                        <td className="px-4 py-3 font-semibold text-amber-600 dark:text-amber-400">{String(row['bonus'] ?? row['Bonus'] ?? row['total'] ?? '—')}</td>
                        <td className="px-4 py-3">
                          <Badge
                            variant="outline"
                            className={isPosted ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'border-[var(--border)]'}
                          >
                            {status || 'auto-credited'}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-[var(--muted-foreground)]">{String(row['date'] ?? row['Date'] ?? '—')}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}

// ─── 4. Rankings View ────────────────────────────────────────────────────────

const PACKAGE_TIER_BADGE: Record<string, string> = {
  bronze: 'border-amber-700/40 bg-amber-700/10 text-amber-600',
  gold: 'border-yellow-500/40 bg-yellow-500/10 text-yellow-400',
  diamond: 'border-blue-500/40 bg-blue-500/10 text-blue-400',
  silver: 'border-gray-400/40 bg-gray-400/10 text-gray-400',
};

function resolvePackageBadgeClass(packageTier: string): string {
  const lower = packageTier.toLowerCase();
  for (const [key, cls] of Object.entries(PACKAGE_TIER_BADGE)) {
    if (lower.includes(key)) return cls;
  }
  return 'border-[var(--border)] text-[var(--muted-foreground)]';
}

function RankingsView({ activeModule }: ModuleViewProps) {
  const rows = activeModule?.table?.rows ?? [];

  return (
    <section className="space-y-5">
      <Card className="border-[var(--border)] bg-[var(--card)]">
        <CardHeader>
          <CardTitle>Rankings &amp; Network Volume</CardTitle>
          <CardDescription>
            {activeModule?.description ?? 'Rank and volume progress report based on direct referral, binary point, and package-level signals.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-xl border border-[var(--border)]">
            <table className="w-full min-w-[800px] text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] bg-[var(--background)] text-left text-xs uppercase tracking-[0.16em] text-[var(--muted-foreground)]">
                  <th className="px-4 py-3">#</th>
                  <th className="px-4 py-3">Username</th>
                  <th className="px-4 py-3">Package</th>
                  <th className="px-4 py-3">Direct Referrals</th>
                  <th className="px-4 py-3">Left BP</th>
                  <th className="px-4 py-3">Right BP</th>
                  <th className="px-4 py-3">Current Rank</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => {
                  const pkg = String(row['package'] ?? '—');
                  return (
                    <tr key={i} className="border-b border-[var(--border)] transition hover:bg-[var(--muted)]/30">
                      <td className="px-4 py-3 text-[var(--muted-foreground)]">{i + 1}</td>
                      <td className="px-4 py-3 font-mono font-medium text-[var(--foreground)]">{String(row['username'] ?? '—')}</td>
                      <td className="px-4 py-3">
                        <Badge variant="outline" className={resolvePackageBadgeClass(pkg)}>{pkg}</Badge>
                      </td>
                      <td className="px-4 py-3 text-blue-400">{String(row['directReferrals'] ?? '—')}</td>
                      <td className="px-4 py-3 text-amber-400">{String(row['leftPoints'] ?? '—')}</td>
                      <td className="px-4 py-3 text-violet-400">{String(row['rightPoints'] ?? '—')}</td>
                      <td className="px-4 py-3">
                        <Badge variant="outline" className={String(row['currentRank'] ?? '').toLowerCase().includes('vip') ? 'border-amber-500/40 bg-amber-500/10 text-amber-400' : 'border-[var(--border)] text-[var(--muted-foreground)]'}>
                          {String(row['currentRank'] ?? '—')}
                        </Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-xs text-[var(--muted-foreground)]">
            Showing {rows.length} {rows.length === 1 ? 'member' : 'members'}
          </p>
        </CardContent>
      </Card>
    </section>
  );
}

// ─── 5. Global Bonus View ────────────────────────────────────────────────────

const STOCKIST_LEVEL_OPTIONS: { value: StockistLevel; label: string }[] = [
  { value: 'none', label: 'No designation' },
  { value: 'mobile_kiosk', label: 'Mobile Kiosk' },
  { value: 'city_center', label: 'City Center' },
  { value: 'mega_center', label: 'Mega Center' }
];

function GlobalBonusView({ activeModule }: ModuleViewProps) {
  const { notify } = useFeedback();
  const [data, setData] = useState<GlobalBonusData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [taggingUsername, setTaggingUsername] = useState<string | null>(null);
  const [searchFilter, setSearchFilter] = useState('');

  useEffect(() => {
    setIsLoading(true);
    fetchAdminGlobalBonus()
      .then(setData)
      .catch(() => notify({ title: 'Load failed', description: 'Unable to load global bonus data.', tone: 'destructive' }))
      .finally(() => setIsLoading(false));
  }, [notify]);

  async function handleSetLevel(entry: GlobalBonusEntry, level: StockistLevel) {
    setTaggingUsername(entry.username);
    try {
      await tagStockistLevel(entry.username, level);
      setData((prev) =>
        prev
          ? {
              ...prev,
              entries: prev.entries.map((e) =>
                e.username === entry.username
                  ? { ...e, stockistLevel: level, stockistLabel: STOCKIST_LEVEL_OPTIONS.find((o) => o.value === level)?.label ?? '—', portions: level !== 'none' ? 1 : 0 }
                  : e
              ),
              totalPortions: prev.entries.reduce((sum, e) => sum + (e.username === entry.username ? (level !== 'none' ? 1 : 0) : e.portions), 0)
            }
          : prev
      );
      notify({ title: 'Stockist updated', description: `${entry.username} → ${level === 'none' ? 'removed' : STOCKIST_LEVEL_OPTIONS.find((o) => o.value === level)?.label}`, tone: 'success' });
    } catch (error) {
      notify({ title: 'Update failed', description: error instanceof Error ? error.message : 'Unable to update.', tone: 'destructive' });
    } finally {
      setTaggingUsername(null);
    }
  }

  const filteredEntries = useMemo(() => {
    if (!data) return [];
    const q = searchFilter.trim().toUpperCase();
    return q
      ? data.entries.filter((e) => e.username.toUpperCase().includes(q) || e.fullName.toUpperCase().includes(q))
      : data.entries;
  }, [data, searchFilter]);

  const stockistEntries = useMemo(() => (data?.entries ?? []).filter((e) => e.stockistLevel !== 'none'), [data]);

  return (
    <section className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: 'Total Members', value: data ? String(data.entries.length) : '—' },
          { label: 'Tagged Stockists', value: data ? String(stockistEntries.length) : '—' },
          { label: 'Total Portions', value: data ? String(data.totalPortions) : '—' }
        ].map((stat) => (
          <div key={stat.label} className="rounded-2xl border border-[var(--border)] bg-[var(--card)] px-4 py-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--muted-foreground)]">{stat.label}</p>
            <p className="mt-1.5 text-lg font-semibold text-[var(--foreground)]">{stat.value}</p>
          </div>
        ))}
      </div>

      <Card className="border-[var(--border)] bg-[var(--card)]">
        <CardHeader>
          <CardTitle>Stockist Designations</CardTitle>
          <CardDescription>
            Tag members as Mobile Kiosk, City Center, or Mega Center. Each designation qualifies them for 1 portion of the annual global bonus pool.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input
            placeholder="Search by username or name…"
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            className="max-w-xs"
          />
          {isLoading ? (
            <p className="py-6 text-center text-sm text-[var(--muted-foreground)]">Loading…</p>
          ) : filteredEntries.length === 0 ? (
            <ModuleEmptyState message="No members found." />
          ) : (
            <div className="overflow-x-auto rounded-xl border border-[var(--border)]">
              <table className="w-full min-w-[760px] text-sm">
                <thead>
                  <tr className="border-b border-[var(--border)] bg-[var(--background)] text-left text-xs uppercase tracking-[0.16em] text-[var(--muted-foreground)]">
                    <th className="px-4 py-3">Username</th>
                    <th className="px-4 py-3">Full Name</th>
                    <th className="px-4 py-3">Package</th>
                    <th className="px-4 py-3">Current Level</th>
                    <th className="px-4 py-3">Change</th>
                    <th className="px-4 py-3 text-center">Portions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEntries.map((entry) => (
                    <tr key={entry.userId} className="border-b border-[var(--border)] transition hover:bg-[var(--muted)]/30">
                      <td className="px-4 py-3 font-mono font-medium text-[var(--foreground)]">{entry.username}</td>
                      <td className="px-4 py-3 text-[var(--muted-foreground)]">{entry.fullName}</td>
                      <td className="px-4 py-3">{entry.packageTier}</td>
                      <td className="px-4 py-3">
                        {entry.stockistLevel !== 'none' ? (
                          <Badge className="bg-violet-500/15 text-violet-400 border-violet-500/30">{entry.stockistLabel}</Badge>
                        ) : (
                          <span className="text-[var(--muted-foreground)]">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <select
                          className="rounded border border-[var(--border)] bg-[var(--background)] px-2 py-1 text-xs text-[var(--foreground)] disabled:opacity-50"
                          value={entry.stockistLevel}
                          disabled={taggingUsername === entry.username}
                          onChange={(e) => handleSetLevel(entry, e.target.value as StockistLevel)}
                        >
                          {STOCKIST_LEVEL_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-3 text-center font-semibold text-amber-500">{entry.portions}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {(data?.notes ?? []).map((note, i) => (
            <p key={i} className="text-xs text-[var(--muted-foreground)]">{note}</p>
          ))}
        </CardContent>
      </Card>
    </section>
  );
}

// ─── 6. CD Accounts View ──────────────────────────────────────────────────────

function CdAccountsView({ activeModule }: ModuleViewProps) {
  const [searchText, setSearchText] = useState('');
  const [cdStatus, setCdStatus] = useState('all');
  const [packageFilter, setPackageFilter] = useState('all');
  const metrics = activeModule?.metrics ?? [];
  const rows = activeModule?.table?.rows ?? [];

  const miniStats = [
    { label: 'Total CD Accounts', keys: ['total', 'cd', 'account'] },
    { label: 'Fully Paid', keys: ['fully', 'paid'] },
    { label: 'Still Paying', keys: ['still', 'paying'] },
    { label: 'Total CD Amount', keys: ['total', 'cd', 'amount'] },
    { label: 'Total Paid So Far', keys: ['total', 'paid', 'far'] },
    { label: 'CD Deductions', keys: ['cd', 'deduction'] },
    { label: 'Net Encashment', keys: ['net', 'encashment'] },
  ];

  return (
    <section className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
        {miniStats.map((stat) => (
          <div key={stat.label} className="flex flex-col justify-between rounded-xl border border-[var(--border)] bg-[var(--card)] px-3 py-2.5">
            <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-[var(--muted-foreground)] leading-snug">{stat.label}</p>
            <p className="mt-1.5 text-base font-semibold text-[var(--foreground)]">{getMetric(metrics, stat.keys)}</p>
          </div>
        ))}
      </div>

      <Card className="border-[var(--border)] bg-[var(--card)]">
        <CardHeader>
          <CardTitle>CD Account Management</CardTitle>
          <CardDescription>
            {activeModule?.description ?? 'View and filter member CD accounts by status, package, and payment progress.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-end gap-3">
            <label className="grid gap-1.5 text-sm">
              <span className="font-medium text-[var(--muted-foreground)]">Search</span>
              <Input
                className="w-56"
                placeholder="Name or username"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
              />
            </label>
            <label className="grid gap-1.5 text-sm">
              <span className="font-medium text-[var(--muted-foreground)]">CD Status</span>
              <select className={SELECT_CLASS + ' w-44'} value={cdStatus} onChange={(e) => setCdStatus(e.target.value)}>
                <option value="all">All CD Status</option>
                <option value="fully-paid">Fully Paid</option>
                <option value="paying">Still Paying</option>
              </select>
            </label>
            <label className="grid gap-1.5 text-sm">
              <span className="font-medium text-[var(--muted-foreground)]">Package</span>
              <select className={SELECT_CLASS + ' w-44'} value={packageFilter} onChange={(e) => setPackageFilter(e.target.value)}>
                <option value="all">All Packages</option>
                <option value="basic">Basic</option>
                <option value="classic">Classic</option>
                <option value="standard">Standard</option>
                <option value="business">Business</option>
                <option value="vip">VIP</option>
              </select>
            </label>
            <Button type="button" variant="outline">Search</Button>
            <Button type="button" variant="outline" onClick={() => { setSearchText(''); setCdStatus('all'); setPackageFilter('all'); }}>Clear</Button>
            <Button type="button" variant="outline" disabled>Export CSV</Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-[var(--border)] bg-[var(--card)]">
        <CardHeader>
          <CardTitle>CD Package Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          {rows.length === 0 ? (
            <ModuleEmptyState message="No CD account records found." />
          ) : (
            <div className="overflow-x-auto rounded-xl border border-[var(--border)]">
              <table className="w-full min-w-[1000px] text-sm">
                <thead>
                  <tr className="border-b border-[var(--border)] bg-[var(--background)] text-left text-xs uppercase tracking-[0.16em] text-[var(--muted-foreground)]">
                    <th className="px-4 py-3">Package</th>
                    <th className="px-4 py-3">Accounts</th>
                    <th className="px-4 py-3">Fully Paid</th>
                    <th className="px-4 py-3">Paying</th>
                    <th className="px-4 py-3">CD Amount</th>
                    <th className="px-4 py-3">Paid</th>
                    <th className="px-4 py-3">Remaining</th>
                    <th className="px-4 py-3">Net Encashment</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, i) => (
                    <tr key={i} className="border-b border-[var(--border)] transition hover:bg-[var(--muted)]/30">
                      <td className="px-4 py-3 font-medium text-[var(--foreground)]">{String(row['package'] ?? row['Package'] ?? '—')}</td>
                      <td className="px-4 py-3">{String(row['accounts'] ?? row['Accounts'] ?? '—')}</td>
                      <td className="px-4 py-3 text-emerald-500">{String(row['fullyPaid'] ?? row['fully_paid'] ?? row['FullyPaid'] ?? '—')}</td>
                      <td className="px-4 py-3 text-amber-500">{String(row['paying'] ?? row['Paying'] ?? '—')}</td>
                      <td className="px-4 py-3">{String(row['cdAmount'] ?? row['cd_amount'] ?? row['CdAmount'] ?? '—')}</td>
                      <td className="px-4 py-3 text-emerald-500">{String(row['paid'] ?? row['Paid'] ?? '—')}</td>
                      <td className="px-4 py-3 text-amber-500">{String(row['remaining'] ?? row['Remaining'] ?? '—')}</td>
                      <td className="px-4 py-3 text-[var(--foreground)]">{String(row['netEncashment'] ?? row['net_encashment'] ?? row['NetEncashment'] ?? '—')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}

// ─── 7. Voucher Management View ───────────────────────────────────────────────

const VOUCHER_STAT_TILES = [
  { label: 'Total Vouchers', icon: Tag,        color: '#3b82f6', bg: 'rgba(59,130,246,0.12)',  statusKey: null },
  { label: 'Active',         icon: Eye,        color: '#10b981', bg: 'rgba(16,185,129,0.12)',  statusKey: 'active' },
  { label: 'Expired',        icon: AlertCircle, color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', statusKey: 'expired' },
  { label: 'Suspended',      icon: Lock,       color: '#ef4444', bg: 'rgba(239,68,68,0.12)',   statusKey: 'suspended' },
  { label: 'Fully Used',     icon: KeyRound,   color: '#8b5cf6', bg: 'rgba(139,92,246,0.12)',  statusKey: 'used' },
] as const;

type VoucherStatusFilter = 'all' | 'active' | 'expired' | 'suspended' | 'used';

function resolveVoucherStatusClass(status: string): string {
  if (/active/i.test(status)) return 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400';
  if (/expired/i.test(status)) return 'border-red-500/40 bg-red-500/10 text-red-400';
  if (/suspend/i.test(status)) return 'border-amber-500/40 bg-amber-500/10 text-amber-400';
  if (/used/i.test(status)) return 'border-purple-500/40 bg-purple-500/10 text-purple-400';
  return 'border-[var(--border)] text-[var(--muted-foreground)]';
}

function VoucherManagementView({ activeModule }: ModuleViewProps) {
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<VoucherStatusFilter>('all');
  const rows = activeModule?.table?.rows ?? [];

  const countByStatus = (statusKey: string | null) => {
    if (!statusKey) return rows.length;
    return rows.filter((row) => {
      const s = String(row['status'] ?? row['Status'] ?? '').toLowerCase();
      return s.includes(statusKey);
    }).length;
  };

  const filteredRows = rows.filter((row) => {
    const s = String(row['status'] ?? row['Status'] ?? '').toLowerCase();
    const q = searchText.trim().toLowerCase();
    const statusMatch = statusFilter === 'all' || s.includes(statusFilter);
    const searchMatch =
      !q ||
      String(row['id'] ?? row['Id'] ?? '').toLowerCase().includes(q) ||
      String(row['username'] ?? row['Username'] ?? '').toLowerCase().includes(q) ||
      String(row['fullName'] ?? row['full_name'] ?? row['FullName'] ?? '').toLowerCase().includes(q) ||
      String(row['code'] ?? row['Code'] ?? '').toLowerCase().includes(q);
    return statusMatch && searchMatch;
  });

  return (
    <section className="space-y-5">
      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--muted-foreground)]">Admin</p>
          <h2 className="mt-0.5 text-xl font-semibold text-[var(--foreground)]">Voucher Management</h2>
        </div>
        <Button type="button" className="ops-admin-primary-action gap-2">
          <Plus className="size-4" />
          Grant Voucher
        </Button>
      </div>

      {/* Stat Tiles */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {VOUCHER_STAT_TILES.map((tile) => {
          const TileIcon = tile.icon;
          const count = countByStatus(tile.statusKey);
          return (
            <button
              key={tile.label}
              type="button"
              onClick={() => setStatusFilter((tile.statusKey ?? 'all') as VoucherStatusFilter)}
              className={cn(
                'flex items-center gap-3 rounded-2xl border px-4 py-3 text-left transition-shadow hover:shadow-md',
                statusFilter === (tile.statusKey ?? 'all')
                  ? 'border-[var(--yor-copper)] bg-[var(--yor-copper)]/5'
                  : 'border-[var(--border)] bg-[var(--card)]'
              )}
            >
              <span
                className="flex size-10 shrink-0 items-center justify-center rounded-xl"
                style={{ background: tile.bg }}
              >
                <TileIcon className="size-5" style={{ color: tile.color }} />
              </span>
              <div className="min-w-0">
                <p className="truncate text-[10px] font-medium uppercase tracking-[0.14em] text-[var(--muted-foreground)]">{tile.label}</p>
                <p className="mt-0.5 text-lg font-semibold text-[var(--foreground)]">{count}</p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Search + Filter Chips */}
      <Card className="border-[var(--border)] bg-[var(--card)]">
        <CardContent className="pt-5">
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex flex-1 gap-2">
              <Input
                className="max-w-sm"
                placeholder="Search by username or voucher ID..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
              />
              <Button type="button" className="ops-admin-primary-action shrink-0">Search</Button>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {(['all', 'active', 'expired', 'used', 'suspended'] as const).map((chip) => (
              <button
                key={chip}
                type="button"
                onClick={() => setStatusFilter(chip)}
                className={cn(
                  'rounded-full border px-3.5 py-1 text-xs font-semibold capitalize transition',
                  statusFilter === chip
                    ? 'border-[var(--yor-copper)] bg-[var(--yor-copper)] text-white'
                    : 'border-[var(--border)] bg-transparent text-[var(--muted-foreground)] hover:border-[var(--yor-copper)] hover:text-[var(--foreground)]'
                )}
              >
                {chip === 'all' ? 'All' : chip === 'used' ? 'Fully Used' : chip.charAt(0).toUpperCase() + chip.slice(1)}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="border-[var(--border)] bg-[var(--card)]">
        <CardContent className="pt-5">
          {filteredRows.length === 0 ? (
            <ModuleEmptyState message="No vouchers found." />
          ) : (
            <div className="overflow-x-auto rounded-xl border border-[var(--border)]">
              <table className="w-full min-w-[1060px] text-sm">
                <thead>
                  <tr className="border-b border-[var(--border)] bg-[var(--background)] text-left text-xs uppercase tracking-[0.16em] text-[var(--muted-foreground)]">
                    <th className="px-4 py-3">ID</th>
                    <th className="px-4 py-3">Username</th>
                    <th className="px-4 py-3">Full Name</th>
                    <th className="px-4 py-3">Package</th>
                    <th className="px-4 py-3">Amount</th>
                    <th className="px-4 py-3">Remaining</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Issued</th>
                    <th className="px-4 py-3">Expiry</th>
                    <th className="px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRows.map((row, i) => {
                    const status = String(row['status'] ?? row['Status'] ?? '');
                    return (
                      <tr key={i} className="border-b border-[var(--border)] transition hover:bg-[var(--muted)]/30">
                        <td className="px-4 py-3 font-mono text-[var(--muted-foreground)]">{String(row['id'] ?? row['Id'] ?? i + 1)}</td>
                        <td className="px-4 py-3 font-medium text-[var(--foreground)]">{String(row['username'] ?? row['Username'] ?? '—')}</td>
                        <td className="px-4 py-3">{String(row['fullName'] ?? row['full_name'] ?? row['FullName'] ?? row['name'] ?? row['Name'] ?? '—')}</td>
                        <td className="px-4 py-3">{String(row['package'] ?? row['Package'] ?? row['type'] ?? row['Type'] ?? '—')}</td>
                        <td className="px-4 py-3 font-mono font-semibold text-[var(--foreground)]">{String(row['amount'] ?? row['Amount'] ?? row['value'] ?? row['Value'] ?? '—')}</td>
                        <td className="px-4 py-3 font-mono">{String(row['remaining'] ?? row['Remaining'] ?? row['amount'] ?? '—')}</td>
                        <td className="px-4 py-3">
                          <Badge variant="outline" className={resolveVoucherStatusClass(status)}>
                            {status || '—'}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-[var(--muted-foreground)]">{String(row['issued'] ?? row['Issued'] ?? row['issuedAt'] ?? row['createdAt'] ?? '—')}</td>
                        <td className="px-4 py-3 text-[var(--muted-foreground)]">{String(row['expiry'] ?? row['Expiry'] ?? row['expiresAt'] ?? '—')}</td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
                            <Button
                              type="button"
                              size="sm"
                              className="gap-1.5 border-amber-500/40 bg-amber-500/10 text-amber-500 hover:bg-amber-500/20"
                              variant="outline"
                            >
                              <Eye className="size-3" />
                              View
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              className="gap-1.5 border-red-500/40 bg-red-500/10 text-red-400 hover:bg-red-500/20"
                              variant="outline"
                            >
                              <Lock className="size-3" />
                              Suspend
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          <p className="mt-3 text-xs text-[var(--muted-foreground)]">Showing {filteredRows.length} voucher(s)</p>
        </CardContent>
      </Card>
    </section>
  );
}

// ─── 8. Contact Messages View ─────────────────────────────────────────────────

type ContactTab = 'all' | 'unread' | 'read' | 'done' | 'blocked';

const CONTACT_TABS: Array<{ key: ContactTab; label: string }> = [
  { key: 'all',     label: 'All' },
  { key: 'unread',  label: 'Unread' },
  { key: 'read',    label: 'Read' },
  { key: 'done',    label: 'Done' },
  { key: 'blocked', label: 'Blocked' },
];

function resolveContactStatusClass(status: string): string {
  if (/unread/i.test(status)) return 'border-blue-500/40 bg-blue-500/10 text-blue-400';
  if (/done/i.test(status))   return 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400';
  if (/block/i.test(status))  return 'border-red-500/40 bg-red-500/10 text-red-400';
  return 'border-[var(--border)] text-[var(--muted-foreground)]';
}

// ── Admin Unilevel View ────────────────────────────────────────────────────────

const UNILEVEL_PERCENTAGES_ADMIN = [10, 8, 5, 5, 3, 3, 2, 1, 1, 1];

function AdminUnilevelView() {
  const { notify } = useFeedback();
  const [memberSearch, setMemberSearch] = useState('');
  const [selectedUsername, setSelectedUsername] = useState<string | null>(null);
  const [data, setData] = useState<UnilevelData | null>(null);
  const [tree, setTree] = useState<SponsorTreeCenter | null>(null);
  const [loading, setLoading] = useState(false);
  const [treeNavStack, setTreeNavStack] = useState<string[]>([]);
  const [treeNavLoading, setTreeNavLoading] = useState(false);
  function loadMemberUnilevel(username: string, treeRoot?: string) {
    setSelectedUsername(username);
    setLoading(true);
    Promise.all([
      fetchAdminMemberUnilevelData(username),
      fetchAdminSponsorTree(treeRoot ?? username)
    ]).then(([uniData, treeData]) => {
      setData(uniData);
      setTree(treeData);
      setTreeNavStack([]);
    }).catch(() => {
      notify({ title: 'Error', description: 'Unable to load unilevel data.', tone: 'destructive' });
    }).finally(() => setLoading(false));
  }

  function handleTreeNavigate(username: string) {
    if (!tree || username === tree.root.username || !selectedUsername) return;
    setTreeNavLoading(true);
    fetchAdminSponsorTree(username).then((treeData) => {
      setTreeNavStack((prev) => [...prev, tree.root.username]);
      setTree(treeData);
    }).finally(() => setTreeNavLoading(false));
  }

  function handleTreeBack() {
    if (!treeNavStack.length) return;
    const prev = treeNavStack[treeNavStack.length - 1];
    setTreeNavLoading(true);
    fetchAdminSponsorTree(prev).then((treeData) => {
      setTreeNavStack((s) => s.slice(0, -1));
      setTree(treeData);
    }).finally(() => setTreeNavLoading(false));
  }

  return (
    <section className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-[var(--muted-foreground)]">Reporting</p>
        <h2 className="mt-0.5 text-xl font-bold text-[var(--foreground)]">Uni-Level Bonus Report</h2>
        <p className="mt-1 text-sm text-[var(--muted-foreground)]">
          Look up any member to view their unilevel earnings breakdown and sponsor downline tree.
        </p>
      </div>

      {/* Member lookup */}
      <Card className="border-[var(--border)] bg-[var(--card)]">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Member Lookup</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <input
              className="flex h-9 flex-1 rounded-md border border-[var(--input)] bg-[var(--background)] px-3 py-1 text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
              placeholder="Enter member username to look up unilevel data"
              value={memberSearch}
              onChange={(e) => setMemberSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && memberSearch.trim()) {
                  loadMemberUnilevel(memberSearch.trim());
                }
              }}
            />
            <button
              type="button"
              onClick={() => { if (memberSearch.trim()) loadMemberUnilevel(memberSearch.trim()); }}
              disabled={loading || !memberSearch.trim()}
              className="inline-flex h-9 items-center gap-2 rounded-md border border-[var(--border)] bg-[var(--card)] px-4 text-sm font-medium text-[var(--foreground)] transition hover:bg-[var(--accent)] disabled:opacity-50"
            >
              {loading ? 'Loading…' : 'Look Up'}
            </button>
          </div>
          {selectedUsername && (
            <p className="mt-2 text-xs text-[var(--muted-foreground)]">
              Showing data for: <strong className="text-[var(--foreground)]">{selectedUsername}</strong>
            </p>
          )}
        </CardContent>
      </Card>

      {/* Results */}
      {data && (
        <>
          {/* Summary */}
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              { label: 'Total Earned', value: `PHP ${data.totalEarned.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`, sub: 'Lifetime unilevel' },
              { label: 'Active Levels', value: `${data.byLevel.filter(l => l.amount > 0).length} / 10`, sub: 'Levels with credits' },
              { label: 'Credit Events', value: String(data.entries.length), sub: 'Repurchase events' }
            ].map((card) => (
              <Card key={card.label} className="border-[var(--border)] bg-[var(--card)]">
                <CardContent className="pt-5">
                  <p className="text-xs font-semibold uppercase tracking-widest text-[var(--muted-foreground)]">{card.label}</p>
                  <p className="mt-1 text-2xl font-bold text-[var(--foreground)]">{card.value}</p>
                  <p className="mt-1 text-xs text-[var(--muted-foreground)]">{card.sub}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Level breakdown */}
          <Card className="border-[var(--border)] bg-[var(--card)]">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Per-Level Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {UNILEVEL_PERCENTAGES_ADMIN.map((pct, idx) => {
                  const level = idx + 1;
                  const row = data.byLevel.find(l => l.level === level);
                  const amount = row?.amount ?? 0;
                  const count = row?.count ?? 0;
                  const maxAmt = Math.max(1, ...data.byLevel.map(l => l.amount));
                  const barW = amount > 0 ? Math.max(4, Math.round((amount / maxAmt) * 100)) : 0;
                  return (
                    <div key={level} className="flex items-center gap-3">
                      <span className="shrink-0 w-8 text-right text-[10px] font-bold text-[var(--muted-foreground)]">L{level}</span>
                      <span className="shrink-0 w-7 text-[10px] text-[var(--muted-foreground)]">{pct}%</span>
                      <div className="flex-1 overflow-hidden">
                        <div className="h-1.5 rounded-full bg-[var(--muted)]">
                          <div className="h-full rounded-full bg-gradient-to-r from-amber-500 to-amber-300 transition-all" style={{ width: `${barW}%` }} />
                        </div>
                      </div>
                      <span className="w-28 shrink-0 text-right text-xs font-medium text-[var(--foreground)]">
                        {amount > 0 ? `PHP ${amount.toLocaleString('en-PH', { minimumFractionDigits: 2 })}` : '—'}
                      </span>
                      <span className="w-16 shrink-0 text-right text-[10px] text-[var(--muted-foreground)]">
                        {count > 0 ? `${count}x` : ''}
                      </span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Sponsor tree */}
          {tree && (
            <Card className="border-[var(--border)] bg-[var(--card)] overflow-hidden">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <CardTitle className="text-base">Sponsor Downline Tree</CardTitle>
                    <p className="mt-0.5 text-xs text-[var(--muted-foreground)]">Up to 20 levels · click any node to navigate</p>
                  </div>
                  {treeNavStack.length > 0 && (
                    <button
                      type="button"
                      onClick={handleTreeBack}
                      disabled={treeNavLoading}
                      className="inline-flex h-7 items-center gap-1.5 rounded-md border border-[var(--border)] bg-[var(--card)] px-3 text-xs font-medium text-[var(--foreground)] transition hover:bg-[var(--accent)] disabled:opacity-50"
                    >
                      ← {treeNavStack[treeNavStack.length - 1]}
                    </button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="px-0 pb-0">
                {treeNavLoading ? (
                  <div className="flex h-[400px] items-center justify-center">
                    <p className="text-sm text-[var(--muted-foreground)]">Loading sponsor tree…</p>
                  </div>
                ) : (
                  <SponsorTreeCanvas root={tree.root} onNavigate={handleTreeNavigate} />
                )}
              </CardContent>
            </Card>
          )}
        </>
      )}

      {!data && !loading && (
        <div className="flex min-h-[200px] items-center justify-center rounded-2xl border border-dashed border-[var(--border)]">
          <p className="text-sm text-[var(--muted-foreground)]">Enter a username above to view their unilevel report.</p>
        </div>
      )}
    </section>
  );
}

function ContactMessagesView({ activeModule }: ModuleViewProps) {
  const { notify } = useFeedback();
  const [activeTab, setActiveTab] = useState<ContactTab>('all');
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchAdminContactMessages()
      .then((data) => { if (!cancelled) setMessages(data.messages); })
      .catch(() => { if (!cancelled) setMessages([]); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  async function handleStatusUpdate(id: string, status: SupportMessageStatus) {
    setUpdatingId(id);
    try {
      await updateAdminContactMessageStatus(id, status);
      setMessages((prev) => prev.map((m) => m.id === id ? { ...m, status } : m));
      if (selectedMessage?.id === id) setSelectedMessage((prev) => prev ? { ...prev, status } : prev);
      notify({ title: 'Status updated', tone: 'success' });
    } catch {
      notify({ title: 'Unable to update status', tone: 'destructive' });
    } finally {
      setUpdatingId(null);
    }
  }

  const countForTab = (key: ContactTab) => {
    if (key === 'all') return messages.length;
    return messages.filter((m) => m.status === key).length;
  };

  const filteredMessages = messages.filter((m) => activeTab === 'all' || m.status === activeTab);

  return (
    <section className="space-y-5">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--muted-foreground)]">Admin</p>
        <h2 className="mt-0.5 text-xl font-semibold text-[var(--foreground)]">Contact Messages</h2>
        <p className="mt-1 text-sm text-[var(--muted-foreground)]">
          {activeModule?.description ?? 'Review and manage inbound member support inquiries.'}
        </p>
      </div>

      {selectedMessage ? (
        <Card className="border-[var(--border)] bg-[var(--card)]">
          <CardContent className="pt-5 space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-widest text-[var(--muted-foreground)]">Message Detail</p>
                <h3 className="text-base font-semibold text-[var(--foreground)]">{selectedMessage.subject}</h3>
                <p className="text-xs text-[var(--muted-foreground)]">
                  From <span className="font-medium text-[var(--foreground)]">{selectedMessage.displayName}</span>
                  {' '}({selectedMessage.username}) · {selectedMessage.email} · {new Date(selectedMessage.createdAt).toLocaleString('en-PH', { timeZone: 'Asia/Manila' })}
                </p>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={() => setSelectedMessage(null)}>Close</Button>
            </div>
            <div className="rounded-xl border border-[var(--border)] bg-[var(--background)] p-4">
              <p className="whitespace-pre-wrap text-sm leading-6 text-[var(--foreground)]">{selectedMessage.message}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="text-xs capitalize">{selectedMessage.category}</Badge>
              <Badge variant="outline" className={cn('text-xs', resolveContactStatusClass(selectedMessage.status))}>
                {selectedMessage.status}
              </Badge>
              <div className="ml-auto flex gap-2">
                {selectedMessage.status !== 'read' && (
                  <Button type="button" size="sm" variant="outline" disabled={updatingId === selectedMessage.id}
                    onClick={() => void handleStatusUpdate(selectedMessage.id, 'read')}>
                    Mark Read
                  </Button>
                )}
                {selectedMessage.status !== 'done' && (
                  <Button type="button" size="sm" variant="outline" disabled={updatingId === selectedMessage.id}
                    onClick={() => void handleStatusUpdate(selectedMessage.id, 'done')}>
                    Mark Done
                  </Button>
                )}
                {selectedMessage.status !== 'blocked' && (
                  <Button type="button" size="sm" variant="outline"
                    className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                    disabled={updatingId === selectedMessage.id}
                    onClick={() => void handleStatusUpdate(selectedMessage.id, 'blocked')}>
                    Block
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ) : null}

      <Card className="border-[var(--border)] bg-[var(--card)]">
        <div className="flex flex-wrap gap-1 border-b border-[var(--border)] px-5 pt-4">
          {CONTACT_TABS.map((tab) => {
            const count = countForTab(tab.key);
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  'rounded-t-lg border-b-2 px-4 py-2 text-sm font-medium transition',
                  isActive
                    ? 'border-[var(--yor-copper)] text-[var(--yor-copper)]'
                    : 'border-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
                )}
              >
                {tab.label} ({count})
              </button>
            );
          })}
        </div>

        <CardContent className="pt-5">
          {loading ? (
            <div className="flex flex-col items-center gap-3 py-12 text-center">
              <p className="text-sm text-[var(--muted-foreground)]">Loading messages…</p>
            </div>
          ) : filteredMessages.length === 0 ? (
            <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-[var(--border)] bg-[var(--background)] py-12 text-center">
              <span className="flex size-12 items-center justify-center rounded-full bg-[var(--muted)]">
                <MessageSquare className="size-5 text-[var(--muted-foreground)]" />
              </span>
              <p className="text-sm text-[var(--muted-foreground)]">No messages found.</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-[var(--border)]">
              <table className="w-full min-w-[860px] text-sm">
                <thead>
                  <tr className="border-b border-[var(--border)] bg-[var(--background)] text-left text-xs uppercase tracking-[0.16em] text-[var(--muted-foreground)]">
                    <th className="px-4 py-3">Member</th>
                    <th className="px-4 py-3">Category</th>
                    <th className="px-4 py-3">Subject</th>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMessages.map((msg) => (
                    <tr key={msg.id} className="border-b border-[var(--border)] transition last:border-0 hover:bg-[var(--muted)]/30">
                      <td className="px-4 py-3">
                        <p className="font-medium text-[var(--foreground)]">{msg.displayName}</p>
                        <p className="text-xs text-[var(--muted-foreground)]">{msg.username}</p>
                      </td>
                      <td className="px-4 py-3 capitalize text-[var(--muted-foreground)]">{msg.category}</td>
                      <td className="max-w-[220px] px-4 py-3 truncate text-[var(--foreground)]">{msg.subject}</td>
                      <td className="px-4 py-3 text-[var(--muted-foreground)]">{new Date(msg.createdAt).toLocaleDateString('en-PH', { timeZone: 'Asia/Manila' })}</td>
                      <td className="px-4 py-3">
                        <Badge variant="outline" className={resolveContactStatusClass(msg.status)}>
                          {msg.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <Button type="button" size="sm" variant="outline"
                            onClick={() => setSelectedMessage(msg)}>
                            View
                          </Button>
                          <Button type="button" size="sm" variant="outline"
                            className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                            disabled={updatingId === msg.id || msg.status === 'blocked'}
                            onClick={() => void handleStatusUpdate(msg.id, 'blocked')}>
                            Block
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}

// ─── 9. News & Posts View ─────────────────────────────────────────────────────

function NewsPostsView({ activeModule }: ModuleViewProps) {
  const rows = activeModule?.table?.rows ?? [];

  function resolvePostStatusClass(status: string): string {
    if (/publish/i.test(status)) return 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400';
    if (/draft/i.test(status))   return 'border-amber-500/40 bg-amber-500/10 text-amber-400';
    return 'border-[var(--border)] text-[var(--muted-foreground)]';
  }

  return (
    <section className="space-y-5">
      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--muted-foreground)]">Admin</p>
          <h2 className="mt-0.5 text-xl font-semibold text-[var(--foreground)]">News &amp; Announcements</h2>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">
            {activeModule?.description ?? 'Manage news, announcements, memos, and promotions visible on the public site.'}
          </p>
        </div>
        <Button type="button" className="ops-admin-primary-action gap-2">
          <Plus className="size-4" />
          New Post
        </Button>
      </div>

      <Card className="border-[var(--border)] bg-[var(--card)]">
        <CardContent className="pt-5">
          {rows.length === 0 ? (
            <div className="flex flex-col items-center gap-4 rounded-xl border border-dashed border-[var(--border)] bg-[var(--background)] py-16 text-center">
              <span className="flex size-14 items-center justify-center rounded-2xl bg-[var(--muted)]">
                <Newspaper className="size-7 text-[var(--muted-foreground)]" />
              </span>
              <div>
                <p className="font-medium text-[var(--foreground)]">No posts yet.</p>
                <p className="mt-1 text-sm text-[var(--muted-foreground)]">Create your first one!</p>
              </div>
              <Button type="button" className="ops-admin-primary-action gap-2 mt-1">
                <Plus className="size-4" />
                New Post
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {rows.map((row, i) => {
                const status = String(row['status'] ?? row['Status'] ?? '');
                return (
                  <div key={i} className="flex items-center justify-between gap-4 rounded-2xl border border-[var(--border)] bg-[var(--background)] px-5 py-4">
                    <div className="flex items-center gap-4">
                      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/10">
                        <FileText className="size-5 text-amber-500" />
                      </span>
                      <div className="min-w-0">
                        <p className="truncate font-medium text-[var(--foreground)]">{String(row['title'] ?? row['Title'] ?? '—')}</p>
                        <p className="mt-0.5 text-xs text-[var(--muted-foreground)]">
                          {String(row['type'] ?? row['Type'] ?? row['category'] ?? 'Post')} · {String(row['date'] ?? row['Date'] ?? row['publishedAt'] ?? '—')}
                        </p>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-3">
                      <Badge variant="outline" className={resolvePostStatusClass(status)}>{status || 'Draft'}</Badge>
                      <Button type="button" size="sm" variant="outline">Edit</Button>
                      <Button type="button" size="sm" variant="outline" className="border-red-500/30 text-red-400 hover:bg-red-500/10">Delete</Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}

// ─── 10. Change Password View ────────────────────────────────────────────────

function ChangePasswordView() {
  const [selectedAccount, setSelectedAccount] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const { notify } = useFeedback();

  function handleSubmit() {
    if (!selectedAccount || !currentPassword || !newPassword) {
      void notify({ title: 'Fill in all fields', description: 'Select an account and enter both password fields.', tone: 'warning' });
      return;
    }
    void notify({ title: 'Password update submitted', description: 'Use the admin API to commit this change.', tone: 'warning' });
  }

  return (
    <section className="space-y-5">
      {/* Page Header */}
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--muted-foreground)]">Settings</p>
        <h2 className="mt-0.5 text-xl font-semibold text-[var(--foreground)]">Change Password</h2>
      </div>

      <div className="max-w-lg">
        <Card className="border-[var(--border)] bg-[var(--card)]">
          <CardContent className="space-y-5 pt-6">
            {/* Account selector */}
            <label className="grid gap-2 text-sm">
              <span className="font-medium text-[var(--muted-foreground)]">Administrator Account</span>
              <select
                className={SELECT_CLASS}
                value={selectedAccount}
                onChange={(e) => setSelectedAccount(e.target.value)}
              >
                <option value="">Select account...</option>
                <option value="admin">Admin</option>
                <option value="superadmin">Super Admin</option>
                <option value="cashier">Cashier</option>
                <option value="bod">Board</option>
              </select>
            </label>

            {/* Current Password */}
            <label className="grid gap-2 text-sm">
              <span className="font-medium text-[var(--muted-foreground)]">Current Password</span>
              <div className="relative">
                <Input
                  type={showCurrent ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="pr-10"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)] transition hover:text-[var(--foreground)]"
                  onClick={() => setShowCurrent((v) => !v)}
                  aria-label={showCurrent ? 'Hide password' : 'Show password'}
                >
                  <Eye className="size-4" />
                </button>
              </div>
            </label>

            {/* New Password */}
            <label className="grid gap-2 text-sm">
              <span className="font-medium text-[var(--muted-foreground)]">New Password</span>
              <div className="relative">
                <Input
                  type={showNew ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="pr-10"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)] transition hover:text-[var(--foreground)]"
                  onClick={() => setShowNew((v) => !v)}
                  aria-label={showNew ? 'Hide password' : 'Show password'}
                >
                  <Eye className="size-4" />
                </button>
              </div>
            </label>

            <Button type="button" className="w-full bg-emerald-600 text-white hover:bg-emerald-700" onClick={handleSubmit}>
              Change Password
            </Button>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
