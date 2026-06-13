import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import {
  AlertCircle,
  ArrowRight,
  Banknote,
  Bell,
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
  type ContactMessage,
  type SupportMessageStatus
} from '@/lib/api';
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
  codeFamily: 'YOR CODES' | 'YOR PERFUME' | 'YOR REFILL' | 'YOR VISION';
  kind: 'package' | 'product';
};

const CODE_GENERATION_OPTIONS: CodeGenerationOption[] = [
  { value: 'pkg-basic', label: 'Basic Package', packageTier: 'Basic', codeFamily: 'YOR CODES', kind: 'package' },
  { value: 'pkg-classic', label: 'Classic Package', packageTier: 'Classic', codeFamily: 'YOR CODES', kind: 'package' },
  { value: 'pkg-standard', label: 'Standard Package', packageTier: 'Standard', codeFamily: 'YOR CODES', kind: 'package' },
  { value: 'pkg-business', label: 'Business Package', packageTier: 'Business', codeFamily: 'YOR CODES', kind: 'package' },
  { value: 'pkg-vip', label: 'VIP Package', packageTier: 'VIP', codeFamily: 'YOR CODES', kind: 'package' },
  {
    value: 'product-yor-perfume-hugo-boss',
    label: 'Yor Perfume - Hugo Boss',
    packageTier: 'Yor Perfume - Hugo Boss',
    codeFamily: 'YOR PERFUME',
    kind: 'product'
  },
  {
    value: 'product-yor-perfume-swiss-army',
    label: 'Yor Perfume - Swiss Army',
    packageTier: 'Yor Perfume - Swiss Army',
    codeFamily: 'YOR PERFUME',
    kind: 'product'
  },
  {
    value: 'product-yor-perfume-chanel-bleu',
    label: 'Yor Perfume - Chanel Bleu',
    packageTier: 'Yor Perfume - Chanel Bleu',
    codeFamily: 'YOR PERFUME',
    kind: 'product'
  },
  {
    value: 'product-yor-perfume-paris-hilton',
    label: 'Yor Perfume - Paris Hilton',
    packageTier: 'Yor Perfume - Paris Hilton',
    codeFamily: 'YOR PERFUME',
    kind: 'product'
  },
  {
    value: 'product-yor-perfume-bvlgari-amethyste',
    label: 'Yor Perfume - Bvlgari Amethyste',
    packageTier: 'Yor Perfume - Bvlgari Amethyste',
    codeFamily: 'YOR PERFUME',
    kind: 'product'
  },
  {
    value: 'product-yor-perfume-vs-bombshell',
    label: 'Yor Perfume - VS Bombshell',
    packageTier: 'Yor Perfume - VS Bombshell',
    codeFamily: 'YOR PERFUME',
    kind: 'product'
  },
  {
    value: 'product-yor-vision-mineral-drops',
    label: 'Yor Vision Mineral Drops 15ml',
    packageTier: 'Yor Vision Mineral Drops 15ml',
    codeFamily: 'YOR VISION',
    kind: 'product'
  }
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
  'change-password'
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
  const [codeBatchRemarks, setCodeBatchRemarks] = useState('');
  const [codeSearchQuery, setCodeSearchQuery] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isContentLoading, setIsContentLoading] = useState(true);
  const [reloadNonce, setReloadNonce] = useState(0);
  const [selectedAdminCodes, setSelectedAdminCodes] = useState<string[]>([]);
  const [adminTransferTarget, setAdminTransferTarget] = useState('');
  const [codeTransferSearchQuery, setCodeTransferSearchQuery] = useState('');
  const [codeTransferSearchResults, setCodeTransferSearchResults] = useState<TransferSearchResult[]>([]);
  const [codeTransferSearchLoading, setCodeTransferSearchLoading] = useState(false);
  const [codeTransferSearchError, setCodeTransferSearchError] = useState<string | null>(null);
  const [selectedEncashmentId, setSelectedEncashmentId] = useState('');
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
        [genealogyTree, shadowAccounts] = await Promise.all([
          getAdminBinaryTree(options.rootUsername.trim()),
          getAdminShadowAccounts(options.rootUsername.trim())
        ]);
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
      getAdminSummary
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
    const confirmed = await confirmAction({
      title: 'Generate activation code batch?',
      description: codeBatchAssignedTo.trim()
        ? `Generate ${qty} ${codeBatchAccountType} ${selectedCodeBatchOption.label} code(s) for ${codeBatchAssignedTo}.`
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
        assignedTo: codeBatchAssignedTo.trim() || undefined,
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

  function handleEncashmentDraftField<Key extends keyof EncashmentDraft>(key: Key, value: EncashmentDraft[Key]) {
    setEncashmentDraft((current) => ({
      ...current,
      [key]: value
    }));
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
  const filteredActivationInventory = activationCodes?.inventory.filter((item) => {
    const query = codeSearchQuery.trim().toUpperCase();

    if (!query) {
      return true;
    }

    return (
      item.code.toUpperCase().includes(query) ||
      item.assignedTo.toUpperCase().includes(query) ||
      item.packageTier.toUpperCase().includes(query) ||
      item.remarks.toUpperCase().includes(query)
    );
  }) ?? [];
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
                  <CardHeader>
                    <CardTitle>Code Generation</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {canGenerateCodes ? (
                      <>
                        <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
                          <label className="grid gap-2 text-sm">
                            <span className="font-medium text-[var(--muted-foreground)]">Quantity</span>
                            <Input
                              type="number"
                              min={1}
                              placeholder="e.g. 10"
                              value={codeBatchQuantity}
                              onChange={(event) => setCodeBatchQuantity(event.target.value)}
                            />
                          </label>
                          <label className="grid gap-2 text-sm">
                            <span className="font-medium text-[var(--muted-foreground)]">Package / Product</span>
                            <select
                              className="flex h-10 w-full rounded-xl border border-[var(--input)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
                              value={codeBatchSelection}
                              onChange={(event) => setCodeBatchSelection(event.target.value)}
                            >
                              <option value="" disabled>Select package / product…</option>
                              {CODE_GENERATION_OPTIONS.map((option) => (
                                <option key={option.value} value={option.value}>
                                  {option.label}
                                </option>
                              ))}
                            </select>
                          </label>
                          <label className="grid gap-2 text-sm">
                            <span className="font-medium text-[var(--muted-foreground)]">Account Type</span>
                            <select
                              className="flex h-10 w-full rounded-md border border-[var(--input)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
                              value={codeBatchAccountType}
                              onChange={(event) => setCodeBatchAccountType(event.target.value)}
                            >
                              <option value="PD">PD</option>
                              <option value="CD">CD</option>
                              <option value="FS">FS</option>
                            </select>
                          </label>
                        <label className="grid gap-2 text-sm">
                          <span className="font-medium text-[var(--muted-foreground)]">Optional Tagged User</span>
                          <Input
                            value={codeBatchAssignedTo}
                            onChange={(event) => setCodeBatchAssignedTo(event.target.value)}
                            placeholder="Leave blank for general pool"
                          />
                        </label>
                        <label className="grid gap-2 text-sm sm:col-span-2 lg:col-span-4">
                          <span className="font-medium text-[var(--muted-foreground)]">Remarks (optional)</span>
                          <textarea
                            maxLength={200}
                            value={codeBatchRemarks}
                            onChange={(event) => setCodeBatchRemarks(event.target.value)}
                            placeholder="Internal note for generation batch, audit, or follow-up"
                            className="min-h-[96px] w-full rounded-md border border-[var(--input)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
                          />
                          <span className="text-xs text-[var(--muted-foreground)]">{codeBatchRemarks.length}/200</span>
                        </label>
                      </div>
                        <div className="flex flex-wrap gap-3">
                          <Button className="ops-admin-primary-action" type="button" onClick={handleGenerateCodes}>
                            Generate General Codes
                          </Button>
                        </div>
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

                    {/* Transfer target search */}
                    <div className="rounded-xl border border-[var(--border)] bg-[var(--background)] p-4 space-y-3">
                      <p className="text-xs font-semibold uppercase tracking-widest text-[var(--muted-foreground)]">Transfer Target</p>
                      <div className="flex gap-2">
                        <Input
                          value={codeTransferSearchQuery}
                          onChange={(event) => setCodeTransferSearchQuery(event.target.value)}
                          placeholder="Search recipient username…"
                          onKeyDown={(event) => {
                            if (event.key === 'Enter') {
                              event.preventDefault();
                              void handleSearchCodeTransferTargets();
                            }
                          }}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => void handleSearchCodeTransferTargets()}
                          disabled={codeTransferSearchLoading}
                        >
                          {codeTransferSearchLoading ? '…' : 'Search'}
                        </Button>
                      </div>
                      {codeTransferSearchError ? (
                        <p className="text-sm text-amber-400">{codeTransferSearchError}</p>
                      ) : null}
                      {codeTransferSearchResults.length > 0 ? (
                        <div className="grid gap-1.5">
                          {codeTransferSearchResults.map((result) => {
                            const isSelected = selectedCodeTransferTarget?.username === result.username;
                            return (
                              <button
                                key={result.username}
                                type="button"
                                className={`flex w-full items-center justify-between gap-3 rounded-xl border px-3 py-2.5 text-left text-sm transition ${
                                  isSelected
                                    ? 'border-[var(--yor-copper)] bg-[var(--muted)]/40'
                                    : 'border-[var(--border)] bg-[var(--card)] hover:bg-[var(--muted)]/20'
                                }`}
                                onClick={() => {
                                  setSelectedCodeTransferTarget(result);
                                  setAdminTransferTarget(result.username);
                                }}
                              >
                                <span className="font-medium text-[var(--foreground)]">{result.username}</span>
                                <span className="text-xs text-[var(--muted-foreground)]">
                                  {result.displayName} · {result.packageTier}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      ) : codeTransferSearchQuery.trim().length >= 3 && !codeTransferSearchLoading && !codeTransferSearchError ? (
                        <p className="text-sm text-[var(--muted-foreground)]">No results found. Try a different username.</p>
                      ) : null}
                      {selectedCodeTransferTarget ? (
                        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-[var(--yor-copper)]/40 bg-[var(--yor-copper)]/5 px-3 py-2 text-sm">
                          <Badge variant="outline">{selectedCodeTransferTarget.username}</Badge>
                          <span className="text-[var(--foreground)]">{selectedCodeTransferTarget.displayName}</span>
                          <span className="text-[var(--muted-foreground)]">· {selectedCodeTransferTarget.packageTier}</span>
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
                  </CardContent>
                </Card>
              </div>
              <Card className="ops-admin-table-card border-[var(--border)] bg-[var(--card)]">
                <CardHeader>
                  <CardTitle>Code Inventory</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="ops-code-table overflow-hidden rounded-xl border border-[var(--border)]">
                    <div className="ops-code-table-actions flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border)] bg-[var(--background)] px-4 py-3">
                      <p className="text-sm font-medium text-[var(--foreground)]">Select codes from the table</p>
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
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[1220px] text-sm">
                        <thead>
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
                          {filteredActivationInventory.map((item) => {
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
                  </div>
                </CardContent>
              </Card>

              <Card className="ops-admin-table-card border-[var(--border)] bg-[var(--card)]">
                <CardHeader>
                  <CardTitle>Code History</CardTitle>
                  <CardDescription>Latest activation-code events from the office ledger.</CardDescription>
                </CardHeader>
                <CardContent>
                  {activationCodes.auditTrail.length ? (
                    <div className="overflow-hidden rounded-xl border border-[var(--border)]">
                      <div className="overflow-x-auto">
                        <table className="w-full min-w-[920px] text-sm">
                          <thead>
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

          {moduleId === 'encashment-reports' && encashments ? (
            <section className="ops-admin-encashment-grid grid gap-4 xl:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)]">
              <Card className="ops-admin-table-card border-[var(--border)] bg-[var(--card)]">
                <CardHeader>
                  <CardTitle>Encashment Queue</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid gap-3 sm:grid-cols-3">
                    <DataPoint label="Gross Total" value={formatCurrency(encashments.totals.gross)} />
                    <DataPoint label="Net Total" value={formatCurrency(encashments.totals.net)} />
                    <DataPoint label="Awaiting Review" value={encashments.totals.awaitingReview} />
                  </div>
                  <div className="overflow-hidden rounded-xl border border-[var(--border)]">
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[900px] text-sm">
                        <thead>
                          <tr className="border-b border-[var(--border)] bg-[var(--background)] text-left text-xs uppercase tracking-[0.16em] text-[var(--muted-foreground)]">
                            <th className="px-4 py-3">Member</th>
                            <th className="px-4 py-3">Reference</th>
                            <th className="px-4 py-3">Method</th>
                            <th className="px-4 py-3">Gross</th>
                            <th className="px-4 py-3">Net</th>
                            <th className="px-4 py-3">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {encashments.encashments.map((item) => {
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
                                <td className="px-4 py-3 font-medium text-[var(--foreground)]">{item.member}</td>
                                <td className="px-4 py-3 font-mono text-[var(--yor-copper-soft)]">{item.id}</td>
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
                  </div>
                </CardContent>
              </Card>
              <Card className="ops-admin-process-card border-[var(--border)] bg-[var(--card)]">
                <CardHeader>
                  <CardTitle>Selected Request</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {selectedEncashment ? (
                    <>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <DataPoint label="Member" value={selectedEncashment.member} />
                        <DataPoint label="Status" value={selectedEncashment.status} />
                        <DataPoint label="Gross" value={selectedEncashment.gross} />
                        <DataPoint label="Net" value={selectedEncashment.net} />
                      </div>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <label className="grid gap-2 text-sm">
                          <span className="font-medium text-[var(--muted-foreground)]">Payout Method</span>
                          <Input
                            value={encashmentDraft.method}
                            onChange={(event) => handleEncashmentDraftField('method', event.target.value)}
                          />
                        </label>
                        <label className="grid gap-2 text-sm">
                          <span className="font-medium text-[var(--muted-foreground)]">Fee</span>
                          <Input
                            value={encashmentDraft.fee}
                            onChange={(event) => handleEncashmentDraftField('fee', event.target.value)}
                          />
                        </label>
                        <label className="grid gap-2 text-sm">
                          <span className="font-medium text-[var(--muted-foreground)]">Tax</span>
                          <Input
                            value={encashmentDraft.tax}
                            onChange={(event) => handleEncashmentDraftField('tax', event.target.value)}
                          />
                        </label>
                        <label className="grid gap-2 text-sm">
                          <span className="font-medium text-[var(--muted-foreground)]">CD Deduction</span>
                          <Input
                            value={encashmentDraft.cdDeduction}
                            onChange={(event) => handleEncashmentDraftField('cdDeduction', event.target.value)}
                          />
                        </label>
                      </div>
                      <label className="grid gap-2 text-sm">
                        <span className="font-medium text-[var(--muted-foreground)]">Remarks</span>
                        <Input
                          value={encashmentDraft.remarks}
                          onChange={(event) => handleEncashmentDraftField('remarks', event.target.value)}
                          placeholder="Reason for hold, payout note, correction reference"
                        />
                      </label>
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
                            <span>Computed Net</span>
                            <strong className="text-[var(--foreground)]">
                              {formatCurrency(
                                Math.max(
                                  0,
                                  parseMoneyValue(selectedEncashment.gross) -
                                    parseMoneyValue(encashmentDraft.fee) -
                                    parseMoneyValue(encashmentDraft.tax) -
                                    parseMoneyValue(encashmentDraft.cdDeduction)
                                )
                              )}
                            </strong>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button type="button" variant="outline" disabled={!canApproveEncashment} onClick={() => void handleReviewEncashment('edit')}>
                          Save Changes
                        </Button>
                        <Button type="button" variant="outline" disabled={!canApproveEncashment} onClick={() => void handleReviewEncashment('queue')}>
                          Queue
                        </Button>
                        <Button type="button" variant="outline" disabled={!canApproveEncashment} onClick={() => void handleReviewEncashment('cancel')}>
                          Cancel
                        </Button>
                        <Button type="button" disabled={!canApproveEncashment} onClick={() => void handleReviewEncashment('mark-paid')}>
                          Mark Paid
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
          ) : null}

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
                        <div className="grid gap-4 xl:grid-cols-2">
                          {shadowAccounts.accounts.map((account) => (
                            <div key={account.shadowCode} className="rounded-2xl border border-[var(--border)] bg-[var(--background)] p-4">
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <p className="text-sm font-semibold text-[var(--foreground)]">{account.label}</p>
                                  <p className="text-xs text-[var(--muted-foreground)]">{account.shadowCode}</p>
                                </div>
                                <Badge variant={account.state.includes('reserved') ? 'warning' : 'success'} className="text-[10px]">
                                  {formatShadowStateLabel(account.state)}
                                </Badge>
                              </div>
                              <div className="mt-4 grid gap-3 md:grid-cols-2">
                                <DataPoint label="Placement" value={account.placement} />
                                <DataPoint label="Package" value={account.packageTier ?? 'Not activated'} />
                                <DataPoint label="Account Type" value={account.accountType ? formatAccountTypeLabel(account.accountType) : 'Pending'} />
                                <DataPoint label="Activation Code" value={account.activationCode ?? 'Not yet assigned'} />
                                <DataPoint label="PV" value={account.pvValue} />
                                <DataPoint label="Salesmatch" value={formatCurrency(account.salesmatchValue)} />
                              </div>
                              <div className="mt-3 space-y-1 text-xs text-[var(--muted-foreground)]">
                                <p>Activated: {formatDateTime(account.activatedAt)}</p>
                                <p>Last upgrade: {formatDateTime(account.lastUpgradedAt)}</p>
                                <p>{account.note}</p>
                              </div>
                            </div>
                          ))}
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

function GlobalBonusView({ activeModule }: ModuleViewProps) {
  const [completedYear, setCompletedYear] = useState(String(new Date().getFullYear() - 1));
  const metrics = activeModule?.metrics ?? [];
  const rows = activeModule?.table?.rows ?? [];

  const statsConfig = [
    { label: 'Annual Net Sales', keys: ['annual', 'net', 'sales'] },
    { label: 'Bonus Pool (2%)', keys: ['bonus', 'pool'] },
    { label: 'Total Portions', keys: ['total', 'portion'] },
    { label: 'Per Portion Value', keys: ['per', 'portion'] },
  ];

  return (
    <section className="space-y-5">
      <Card className="border-[var(--border)] bg-[var(--card)]">
        <CardHeader>
          <CardTitle>Global Bonus</CardTitle>
          <CardDescription>
            {activeModule?.description ?? 'Annual PPT pool distribution — load the completed year to review and distribute the global bonus pool.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-end gap-3">
            <label className="grid gap-1.5 text-sm">
              <span className="font-medium text-[var(--muted-foreground)]">Completed Year</span>
              <Input
                type="number"
                className="w-32"
                value={completedYear}
                onChange={(e) => setCompletedYear(e.target.value)}
                min={2020}
                max={2099}
              />
            </label>
            <Button type="button" variant="outline">Load Annual Report</Button>
            <Button type="button" variant="outline" disabled>Latest Distributed</Button>
            <Button type="button" className="bg-emerald-600 text-white hover:bg-emerald-700">Distribute Annual Pool</Button>
          </div>
          <p className="text-xs text-[var(--muted-foreground)]">
            The PPT rule is annual. The current year cannot be distributed until the year is complete.
          </p>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {statsConfig.map((stat) => (
              <div key={stat.label} className="rounded-2xl border border-[var(--border)] bg-[var(--background)] px-4 py-3">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--muted-foreground)]">{stat.label}</p>
                <p className="mt-1.5 text-lg font-semibold text-[var(--foreground)]">
                  {getMetric(metrics, stat.keys)}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="border-[var(--border)] bg-[var(--card)]">
        <CardHeader>
          <CardTitle>Distributed Recipients</CardTitle>
        </CardHeader>
        <CardContent>
          {rows.length === 0 ? (
            <ModuleEmptyState message="No distribution records found for this year." />
          ) : (
            <div className="overflow-x-auto rounded-xl border border-[var(--border)]">
              <table className="w-full min-w-[860px] text-sm">
                <thead>
                  <tr className="border-b border-[var(--border)] bg-[var(--background)] text-left text-xs uppercase tracking-[0.16em] text-[var(--muted-foreground)]">
                    <th className="px-4 py-3">Member</th>
                    <th className="px-4 py-3">Username</th>
                    <th className="px-4 py-3">Member Type</th>
                    <th className="px-4 py-3">Portions</th>
                    <th className="px-4 py-3">Share Amount</th>
                    <th className="px-4 py-3">Distributed Date</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, i) => (
                    <tr key={i} className="border-b border-[var(--border)] transition hover:bg-[var(--muted)]/30">
                      <td className="px-4 py-3 font-medium text-[var(--foreground)]">{String(row['member'] ?? row['Member'] ?? '—')}</td>
                      <td className="px-4 py-3 font-mono text-[var(--muted-foreground)]">{String(row['username'] ?? row['Username'] ?? '—')}</td>
                      <td className="px-4 py-3">{String(row['memberType'] ?? row['member_type'] ?? row['MemberType'] ?? '—')}</td>
                      <td className="px-4 py-3 text-amber-500">{String(row['portions'] ?? row['Portions'] ?? '—')}</td>
                      <td className="px-4 py-3 text-emerald-500">{String(row['shareAmount'] ?? row['share_amount'] ?? row['ShareAmount'] ?? '—')}</td>
                      <td className="px-4 py-3 text-[var(--muted-foreground)]">{String(row['distributedDate'] ?? row['distributed_date'] ?? row['DistributedDate'] ?? '—')}</td>
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
                  {' '}({selectedMessage.username}) · {selectedMessage.email} · {new Date(selectedMessage.createdAt).toLocaleString('en-PH')}
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
                      <td className="px-4 py-3 text-[var(--muted-foreground)]">{new Date(msg.createdAt).toLocaleDateString('en-PH')}</td>
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
