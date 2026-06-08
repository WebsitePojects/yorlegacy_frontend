import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { useFeedback } from '@/components/feedback/FeedbackProvider';
import {
  ProtectedOfficeFrame,
  resolveOfficeBasePath
} from '@/components/layout/ProtectedOfficeFrame';
import { GenealogyTree } from '../components/ops/GenealogyTree';
import { readOfficeCache, warmOfficeCache } from '@/lib/office-cache';
import { cn } from '@/lib/utils';
import {
  DataListCard,
  GatedActionsCard,
  MetricGrid,
  ModuleTableCard,
  QuickLinkGrid
} from '@/components/ops/office-ui';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { searchAdminTransferTargets } from '@/lib/api';
import type {
  AdminActivationCodeCenter,
  AdminEncashmentCenter,
  AdminMemberManagementCenter,
  AdminMemberProfile,
  AdminMvpDashboardData,
  AdminOfficeData,
  DashboardSummary,
  GenealogyCenter,
  MemberAccountStatus,
  OperationalModule
} from '../types/auth';

const formatCurrency = (value: number): string =>
  `PHP ${value.toLocaleString('en-PH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;

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

const customAdminModuleIds = new Set([
  'dashboard',
  'member-management',
  'activation-codes',
  'encashment-reports',
  'account-genealogy'
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

  return 1 + node.children.reduce((total, child) => total + countSubtreeNodes(child), 0);
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
};

type MemberProfileDraft = {
  username: string;
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
    getAdminSummary,
    releaseActivationCodes,
    reviewActivationCodes,
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
  const [selectedTreeNodeId, setSelectedTreeNodeId] = useState<string | null>(null);
  const [treeRootUsername, setTreeRootUsername] = useState('');
  const [treeSearchInput, setTreeSearchInput] = useState('');
  const [memberSearchDraft, setMemberSearchDraft] = useState('');
  const [memberSearchQuery, setMemberSearchQuery] = useState('');
  const [memberPage, setMemberPage] = useState(1);
  const [memberDetailUsername, setMemberDetailUsername] = useState('');
  const [memberProfileDraft, setMemberProfileDraft] = useState<MemberProfileDraft>(EMPTY_MEMBER_PROFILE_DRAFT);
  const [codeBatchQuantity, setCodeBatchQuantity] = useState(5);
  const [codeBatchPackageTier, setCodeBatchPackageTier] = useState('Standard');
  const [codeBatchAccountType, setCodeBatchAccountType] = useState('PD');
  const [codeBatchAssignedTo, setCodeBatchAssignedTo] = useState('');
  const [codeBatchRemarks, setCodeBatchRemarks] = useState('');
  const [codeSearchQuery, setCodeSearchQuery] = useState('');
  const [codeReviewRemarks, setCodeReviewRemarks] = useState('');
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

  const applyAdminBundle = useCallback((bundle: AdminModuleBundle) => {
    setSummary(bundle.summary);
    setOffice(bundle.office);
    setMvpDashboard(bundle.mvpDashboard);
    setActiveModule(bundle.activeModule);
    setActivationCodes(bundle.activationCodes);
    setEncashments(bundle.encashments);
    setMemberCenter(bundle.memberCenter);
    setGenealogyTree(bundle.genealogyTree);
    setSelectedTreeNodeId(bundle.genealogyTree?.root.nodeId ?? null);

    if (bundle.activationCodes) {
      setSelectedAdminCodes([]);
      setAdminTransferTarget('');
      setSelectedCodeTransferTarget(null);
      setCodeTransferSearchQuery('');
      setCodeTransferSearchResults([]);
      setCodeTransferSearchError(null);
      setCodeSearchQuery('');
      setCodeReviewRemarks('');
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

      if (targetModuleId === 'activation-codes') {
        activationCodes = await getAdminActivationCodes();
      }

      if (targetModuleId === 'encashment-reports') {
        encashments = await getAdminEncashments();
      }

      if (targetModuleId === 'member-management') {
        memberCenter = await getAdminMemberManagement({
          query: options.memberQuery,
          username: options.memberUsername,
          page: options.memberPage,
          pageSize: 10
        });
      }

      if (targetModuleId === 'account-genealogy' && options.rootUsername.trim()) {
        genealogyTree = await getAdminBinaryTree(options.rootUsername.trim());
      }

      return {
        summary: nextSummary,
        office: nextOffice,
        mvpDashboard: nextMvpDashboard,
        activeModule: nextModule,
        activationCodes,
        encashments,
        memberCenter,
        genealogyTree
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
    if (user?.role !== 'cashier' || officeBasePath !== '/cashier') {
      return;
    }

    if (moduleId !== 'activation-codes') {
      navigate('/cashier/activation-codes', { replace: true });
    }
  }, [moduleId, navigate, officeBasePath, user?.role]);

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
    const confirmed = await confirmAction({
      title: 'Generate activation code batch?',
      description: codeBatchAssignedTo.trim()
        ? `Generate ${codeBatchQuantity} ${codeBatchAccountType} ${codeBatchPackageTier} code(s) for ${codeBatchAssignedTo}.`
        : `Generate ${codeBatchQuantity} ${codeBatchAccountType} ${codeBatchPackageTier} code(s) into the unassigned code pool.`,
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
        assignedTo: codeBatchAssignedTo.trim() || undefined,
        accountType: codeBatchAccountType,
        remarks: codeBatchRemarks.trim() || undefined
      });
      notify({
        title: 'Code batch generated',
        description: result.detail ?? result.reason,
        tone: 'success'
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
      title: 'Release and transfer selected codes?',
      description: `Release ${selectedAdminCodes.length} selected code(s), then transfer them to ${selectedCodeTransferTarget?.username ?? adminTransferTarget}.`,
      confirmLabel: 'Release + Transfer',
      tone: 'warning'
    });

    if (!confirmed) {
      return;
    }

    try {
      await releaseActivationCodes(selectedAdminCodes);
      const result = await transferAdminCodes({
        targetUsername: adminTransferTarget,
        codes: selectedAdminCodes
      });
      notify({
        title: 'Codes released and transferred',
        description: result.detail ?? result.reason,
        tone: 'success'
      });
      setReloadNonce((value) => value + 1);
    } catch (cause) {
      notify({
        title: 'Unable to release and transfer codes',
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

  async function handleReviewCodes(action: 'mark-paid' | 'mark-external-paid' | 'mark-lost' | 'restore') {
    const labelMap = {
      'mark-paid': 'Mark as paid',
      'mark-external-paid': 'Mark external paid',
      'mark-lost': 'Flag lost code',
      restore: 'Restore lost code'
    } as const;

    const confirmed = await confirmAction({
      title: `${labelMap[action]}?`,
      description: `Apply ${labelMap[action].toLowerCase()} to ${selectedAdminCodes.length} selected code(s).`,
      confirmLabel: labelMap[action],
      tone: 'warning'
    });

    if (!confirmed) {
      return;
    }

    try {
      const result = await reviewActivationCodes({
        codes: selectedAdminCodes,
        action,
        remarks: codeReviewRemarks
      });
      notify({
        title: 'Code review updated',
        description: result.detail ?? result.reason,
        tone: 'success'
      });
      setReloadNonce((value) => value + 1);
    } catch (cause) {
      notify({
        title: 'Unable to update code review state',
        description: cause instanceof Error ? cause.message : 'Please try again.',
        tone: 'destructive'
      });
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
    setMemberSearchQuery(memberSearchDraft.trim().toUpperCase());
  }

  function handleSelectMember(username: string) {
    setMemberDetailUsername(username.toUpperCase());
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
      description: `Update ${memberProfileDraft.username || 'the selected member'} using the current account-details form fields.`,
      confirmLabel: 'Save Profile',
      tone: 'warning'
    });

    if (!confirmed) {
      return;
    }

    try {
      const result = await updateMemberProfile(memberProfileDraft.username, {
        firstName: memberProfileDraft.firstName,
        lastName: memberProfileDraft.lastName,
        middleName: memberProfileDraft.middleName,
        password: memberProfileDraft.password || undefined,
        payoutOption: memberProfileDraft.payoutOption,
        payoutDetails: memberProfileDraft.payoutDetails,
        address: memberProfileDraft.address,
        contactNumber: memberProfileDraft.contactNumber
      });
      notify({
        title: 'Member profile updated',
        description: result.detail ?? result.reason,
        tone: 'success'
      });
      setReloadNonce((value) => value + 1);
    } catch (cause) {
      notify({
        title: 'Unable to update member profile',
        description: cause instanceof Error ? cause.message : 'Please try again.',
        tone: 'destructive'
      });
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
        title: 'Activation Codes',
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
  const canGenerateCodes = currentOpsRole === 'admin' || currentOpsRole === 'superadmin';
  const canReviewCodeStates = currentOpsRole === 'admin' || currentOpsRole === 'superadmin';
  const canApproveEncashment = currentOpsRole === 'admin' || currentOpsRole === 'superadmin';
  const canResetSandbox = currentOpsRole === 'admin' || currentOpsRole === 'superadmin';
  const canChangeMemberStatus = currentOpsRole === 'admin' || currentOpsRole === 'superadmin';
  const showSecurityRail = moduleId === 'dashboard';
  const showDashboardActions = moduleId === 'dashboard' && (mvpDashboard?.moneyMode ?? 'playground') !== 'sandbox' && branchNotes.length > 0;
  const visibleMetrics = office ? getVisibleAdminMetrics(moduleId, office.metrics) : [];
  const filteredActivationInventory = activationCodes?.inventory.filter((item) => {
    const query = codeSearchQuery.trim().toUpperCase();

    if (!query) {
      return true;
    }

    return (
      item.code.toUpperCase().includes(query) ||
      item.assignedTo.toUpperCase().includes(query) ||
      item.packageTier.toUpperCase().includes(query) ||
      item.paymentStatus.toUpperCase().includes(query) ||
      item.remarks.toUpperCase().includes(query)
    );
  }) ?? [];
  const selectableAdminCodes = filteredActivationInventory.filter((item) => item.status !== 'used').map((item) => item.code);
  const allSelectableAdminCodesSelected =
    selectableAdminCodes.length > 0 && selectableAdminCodes.every((code) => selectedAdminCodes.includes(code));
  const financeModulePath = office?.modules.find((module) => module.id === 'finance-accounting')?.path;
  const cdAccountsModulePath = office?.modules.find((module) => module.id === 'cd-accounts')?.path;
  const selectedEncashment =
    encashments?.encashments.find((item) => item.id === selectedEncashmentId) ?? encashments?.encashments[0] ?? null;
  const summaryCard =
    moduleId === 'dashboard'
      ? {
          label: 'Role Scope',
          value: office?.profile.accessScope ?? user?.role ?? 'ops',
          detail: `${office?.modules.length ?? 0} modules available`
        }
      : undefined;

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
          ? 'Operational dashboard.'
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
      footerLinks={[
        { label: 'Open public site', href: '/' },
        { label: 'Open registration page', href: '/register' }
      ]}
    >
      <div className="ops-admin-page space-y-4">
          {visibleMetrics.length ? <MetricGrid metrics={visibleMetrics} /> : null}
          {moduleId === 'dashboard' && quickLinks.length ? <QuickLinkGrid links={quickLinks} /> : null}

          {moduleId === 'dashboard' && office?.queues.length ? (
            <section className="ops-admin-queue-grid grid gap-3 md:grid-cols-3">
              {office.queues.map((queue) => (
                <Card key={queue.label} className="ops-admin-queue-card border-[var(--border)] bg-[var(--card)]">
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
            <section className="ops-admin-activation-grid grid gap-4">
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
                <DataPoint label="Tracked Codes" value={activationCodes.metrics.totalCodes} />
                <DataPoint label="Released" value={activationCodes.metrics.availableCodes} />
                <DataPoint label="Awaiting Release" value={activationCodes.metrics.unreleasedCodes} />
                <DataPoint label="Paid" value={activationCodes.metrics.paidCodes} />
                <DataPoint label="Lost Codes" value={activationCodes.metrics.lostCodes} />
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
                        <div className="grid gap-3 sm:grid-cols-4">
                          <label className="grid gap-2 text-sm">
                            <span className="font-medium text-[var(--muted-foreground)]">Quantity</span>
                            <Input
                              type="number"
                              min={1}
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
                              <option value="Basic">Basic</option>
                              <option value="Classic">Classic</option>
                              <option value="Standard">Standard</option>
                              <option value="Business">Business</option>
                              <option value="VIP">VIP</option>
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
                            onChange={(event) => setCodeBatchAssignedTo(event.target.value.toUpperCase())}
                            placeholder="Leave blank for general pool"
                          />
                        </label>
                        <label className="grid gap-2 text-sm sm:col-span-4">
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
                          <p className="text-sm text-[var(--muted-foreground)]">
                            Admin and superadmin can generate. Cashier stays on release, transfer, and correction workflows only.
                          </p>
                        </div>
                      </>
                    ) : (
                      <div className="rounded-xl border border-dashed border-[var(--border)] bg-[var(--background)] p-4 text-sm text-[var(--muted-foreground)]">
                        This role can review, release, transfer, and correct codes, but general code generation is admin-side only.
                      </div>
                    )}

                    <div className="rounded-2xl border border-[var(--border)] bg-[var(--background)] p-4">
                      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
                        <label className="grid gap-2 text-sm">
                          <span className="font-medium text-[var(--muted-foreground)]">Search codes or owners</span>
                          <Input
                            value={codeSearchQuery}
                            onChange={(event) => setCodeSearchQuery(event.target.value.toUpperCase())}
                            placeholder="Code, username, package, paid state, remarks"
                          />
                        </label>
                        <div className="grid gap-2 text-sm">
                          <span className="font-medium text-[var(--muted-foreground)]">Search by username</span>
                          <div className="flex gap-2">
                            <Input
                              value={codeTransferSearchQuery}
                              onChange={(event) => setCodeTransferSearchQuery(event.target.value.toUpperCase())}
                              placeholder="Search target username"
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
                              {codeTransferSearchLoading ? 'Searching...' : 'Search'}
                            </Button>
                          </div>
                        </div>
                      </div>
                      {codeTransferSearchError ? (
                        <p className="mt-3 text-sm text-amber-200">{codeTransferSearchError}</p>
                      ) : null}
                      {codeTransferSearchResults.length ? (
                        <div className="mt-3 grid gap-2">
                          {codeTransferSearchResults.map((result) => {
                            const isSelected = selectedCodeTransferTarget?.username === result.username;
                            return (
                              <button
                                key={result.username}
                                type="button"
                                className={`flex w-full items-center justify-between gap-3 rounded-xl border px-3 py-2 text-left transition ${
                                  isSelected
                                    ? 'border-[var(--yor-copper)] bg-[var(--muted)]/40'
                                    : 'border-[var(--border)] bg-[var(--background)] hover:bg-[var(--muted)]/20'
                                }`}
                                onClick={() => {
                                  setSelectedCodeTransferTarget(result);
                                  setAdminTransferTarget(result.username);
                                }}
                              >
                                <span className="font-medium text-[var(--foreground)]">{result.username}</span>
                                <span className="text-xs text-[var(--muted-foreground)]">
                                  {result.displayName} / {result.packageTier}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      ) : codeTransferSearchQuery.trim().length >= 3 && !codeTransferSearchLoading && !codeTransferSearchError ? (
                        <p className="mt-3 text-sm text-[var(--muted-foreground)]">Search results will appear here.</p>
                      ) : null}
                      {selectedCodeTransferTarget ? (
                        <div className="mt-3 flex flex-wrap items-center gap-3 rounded-xl border border-[var(--border)] px-3 py-2 text-sm">
                          <Badge variant="outline">{selectedCodeTransferTarget.username}</Badge>
                          <span className="text-[var(--foreground)]">{selectedCodeTransferTarget.displayName}</span>
                          <span className="text-[var(--muted-foreground)]">{selectedCodeTransferTarget.packageTier}</span>
                        </div>
                      ) : null}
                      {canReviewCodeStates ? (
                        <label className="mt-3 grid gap-2 text-sm">
                          <span className="font-medium text-[var(--muted-foreground)]">Review remarks</span>
                          <Input
                            value={codeReviewRemarks}
                            onChange={(event) => setCodeReviewRemarks(event.target.value)}
                            placeholder="Lost-code reason, paid reference, or external settlement note"
                          />
                        </label>
                      ) : null}
                      <div className="mt-4 flex flex-wrap gap-2">
                        <Button type="button" variant="outline" disabled={!selectedAdminCodes.length} onClick={handleReleaseCodes}>
                          Release
                        </Button>
                        <Button type="button" variant="outline" disabled={!selectedAdminCodes.length || !adminTransferTarget} onClick={handleTransferCodes}>
                          Transfer
                        </Button>
                        <Button type="button" variant="outline" disabled={!selectedAdminCodes.length || !adminTransferTarget} onClick={handleReleaseAndTransferCodes}>
                          Release + Transfer
                        </Button>
                        {canReviewCodeStates ? (
                          <>
                            <Button type="button" variant="outline" disabled={!selectedAdminCodes.length} onClick={() => void handleReviewCodes('mark-paid')}>
                              Mark Paid
                            </Button>
                            <Button type="button" variant="outline" disabled={!selectedAdminCodes.length} onClick={() => void handleReviewCodes('mark-external-paid')}>
                              Mark External Paid
                            </Button>
                            <Button type="button" variant="outline" disabled={!selectedAdminCodes.length} onClick={() => void handleReviewCodes('mark-lost')}>
                              Mark Lost
                            </Button>
                            <Button type="button" variant="outline" disabled={!selectedAdminCodes.length} onClick={() => void handleReviewCodes('restore')}>
                              Restore
                            </Button>
                          </>
                        ) : null}
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-[var(--border)] bg-[var(--card)]">
                  <CardHeader>
                    <CardTitle>Audit Trail</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {activationCodes.auditTrail.map((event) => (
                      <div key={`${event.occurredAt}-${event.action}`} className="rounded-xl border border-[var(--border)] bg-[var(--background)] px-4 py-3 text-sm">
                        <div className="flex items-start justify-between gap-4">
                          <span className="text-[var(--foreground)]">{event.action}</span>
                          <span className="text-right text-[var(--muted-foreground)]">{event.actor}</span>
                        </div>
                        <p className="mt-2 text-xs uppercase tracking-[0.16em] text-[var(--muted-foreground)]">{event.occurredAt}</p>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
              <DataListCard
                title="Code Workflow Notes"
                rows={[
                  { label: 'Filtered Rows', value: filteredActivationInventory.length },
                  { label: 'Selected Codes', value: selectedAdminCodes.length },
                  { label: 'Transfer Target', value: selectedCodeTransferTarget?.username ?? adminTransferTarget ?? 'None' },
                  { label: 'Settlement Note', value: codeReviewRemarks || 'No remarks yet' }
                ]}
              />
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
                            <th className="px-4 py-3">Payment</th>
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
                                <td className="px-4 py-3">{item.accountType}</td>
                                <td className="px-4 py-3">{item.packageTier}</td>
                                <td className="px-4 py-3">{item.assignedTo}</td>
                                <td className="px-4 py-3">
                                  <Badge variant={item.status === 'available' ? 'success' : item.status === 'unreleased' || item.status === 'lost' ? 'warning' : 'outline'}>
                                    {item.status}
                                  </Badge>
                                </td>
                                <td className="px-4 py-3">
                                  <Badge variant={item.paymentStatus === 'paid' ? 'success' : item.paymentStatus === 'externally-paid' ? 'warning' : 'outline'}>
                                    {item.paymentStatus}
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
                      onChange={(event) => setMemberSearchDraft(event.target.value.toUpperCase())}
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
                        <label className="grid gap-2 text-sm">
                          <span className="font-medium text-[var(--muted-foreground)]">Username</span>
                          <Input value={memberProfileDraft.username} readOnly />
                        </label>
                        <label className="grid gap-2 text-sm">
                          <span className="font-medium text-[var(--muted-foreground)]">Password</span>
                          <Input
                            type="password"
                            value={memberProfileDraft.password}
                            onChange={(event) => handleMemberProfileField('password', event.target.value)}
                            placeholder="Leave blank to keep current password"
                          />
                        </label>
                        <label className="grid gap-2 text-sm">
                          <span className="font-medium text-[var(--muted-foreground)]">Contact Number</span>
                          <Input value={memberProfileDraft.contactNumber} onChange={(event) => handleMemberProfileField('contactNumber', event.target.value)} />
                        </label>
                        <label className="grid gap-2 text-sm md:col-span-2 xl:col-span-1">
                          <span className="font-medium text-[var(--muted-foreground)]">Payout Option</span>
                          <Input value={memberProfileDraft.payoutOption} onChange={(event) => handleMemberProfileField('payoutOption', event.target.value)} />
                        </label>
                        <label className="grid gap-2 text-sm md:col-span-2">
                          <span className="font-medium text-[var(--muted-foreground)]">Payout Details</span>
                          <Input value={memberProfileDraft.payoutDetails} onChange={(event) => handleMemberProfileField('payoutDetails', event.target.value)} />
                        </label>
                        <label className="grid gap-2 text-sm md:col-span-2 xl:col-span-3">
                          <span className="font-medium text-[var(--muted-foreground)]">Address</span>
                          <Input value={memberProfileDraft.address} onChange={(event) => handleMemberProfileField('address', event.target.value)} />
                        </label>
                      </div>

                      <div className="flex flex-wrap gap-3">
                        <Button type="button" className="ops-admin-primary-action" onClick={handleSaveMemberProfile}>
                          Save Profile
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
                      onChange={(event) => setTreeSearchInput(event.target.value.toUpperCase())}
                      placeholder="Enter username or referral code"
                    />
                    <Button
                      type="button"
                      className="ops-admin-primary-action"
                      disabled={!treeSearchInput.trim()}
                      onClick={() => setTreeRootUsername(treeSearchInput.trim().toUpperCase())}
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
                      Enter a username such as YOR0001, YOR0002, or a referral code to load the tree.
                    </div>
                  )}
                </CardContent>
              </Card>
              {genealogyTree ? (
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
              ) : null}
            </section>
          ) : null}

          {showSecurityRail || showDashboardActions || (moduleId === 'dashboard' && canResetSandbox) ? (
            <section className="ops-admin-footer-grid grid gap-4 xl:grid-cols-2">
              {showDashboardActions ? <GatedActionsCard actions={branchNotes} /> : null}

              {showSecurityRail ? (
                <Card className="ops-admin-security-card border-[var(--border)] bg-[var(--card)]">
                  <CardHeader>
                    <CardTitle>Security Status</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {summary
                      ? Object.entries(summary.status).map(([key, value]) => (
                          <div key={key} className="flex items-start justify-between gap-3 text-sm">
                            <span className="text-[var(--muted-foreground)]">{key}</span>
                            <strong className="text-right text-[var(--foreground)]">
                              {key === 'moneyActions' && value.includes('sandbox')
                                ? value.replace('branch sandbox writes enabled', 'controlled runtime writes enabled')
                                : value}
                            </strong>
                          </div>
                        ))
                      : null}
                    {office?.auditEvents.length ? (
                      <div className="ops-admin-audit-box rounded-xl border border-[var(--border)] bg-[var(--background)] p-4">
                        <p className="mb-2 text-sm font-medium text-[var(--foreground)]">Recent audit events</p>
                        <div className="space-y-2 text-sm text-[var(--muted-foreground)]">
                          {office.auditEvents.slice(0, 4).map((event) => (
                            <p key={`${event.occurredAt}-${event.action}`}>
                              {formatAuditActionLabel(event.action)} / {event.actor}
                            </p>
                          ))}
                        </div>
                      </div>
                    ) : null}
                  </CardContent>
                </Card>
              ) : null}

              {moduleId === 'dashboard' && canResetSandbox ? (
                <Card className="border-[var(--border)] bg-[var(--card)]">
                  <CardHeader>
                    <CardTitle>Runtime Reset Control</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button type="button" variant="outline" onClick={handleResetSandbox}>
                      Reset Runtime Data
                    </Button>
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
