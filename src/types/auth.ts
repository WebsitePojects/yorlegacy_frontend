export type AppRole = 'member' | 'admin' | 'cashier' | 'bod' | 'superadmin';
export type MoneyMode = 'playground' | 'sandbox' | 'production';

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: AppRole;
};

export type AuthState = {
  isLoading: boolean;
  authenticated: boolean;
  user: AuthUser | null;
};

export type DashboardSummary = {
  user: AuthUser;
  modules: string[];
  status: Record<string, string>;
};

export type OperationalMetric = {
  label: string;
  value: string;
  detail?: string;
  tone?: 'neutral' | 'good' | 'warning' | 'danger';
};

export type ReportColumn = {
  key: string;
  label: string;
};

export type ReportRow = Record<string, string | number>;

export type ReportTable = {
  title: string;
  columns: ReportColumn[];
  rows: ReportRow[];
};

export type GatedAction = {
  label: string;
  reason: string;
  requiredEvidence: string;
};

export type OperationalModule = {
  id: string;
  label: string;
  path: string;
  group: string;
  description: string;
  status: 'live-report' | 'read-only' | 'sandbox-write' | 'playground-write';
  legacyReference: string;
  permissions: AppRole[];
  metrics: OperationalMetric[];
  table: ReportTable;
  gatedActions: GatedAction[];
};

export type OperationalQueue = {
  label: string;
  count: number;
  status: 'clear' | 'watch' | 'attention';
};

export type AuditEvent = {
  actor: string;
  action: string;
  target: string;
  occurredAt: string;
};

export type MemberOfficeData = {
  user: AuthUser;
  profile: {
    packageTier: string;
    referralCode: string;
    sponsorCode: string;
    accountStatus: string;
    username: string;
    fullName: string;
    payoutMethod: string;
    payoutDetails: string;
  };
  wallet: {
    availableBalance: string;
    pendingBalance: string;
    payoutSchedule: string;
  };
  metrics: OperationalMetric[];
  modules: OperationalModule[];
  gatedActions: GatedAction[];
  alerts: string[];
};

export type AdminOfficeData = {
  user: AuthUser;
  profile: {
    accessScope: string;
    officeTitle: string;
  };
  metrics: OperationalMetric[];
  modules: OperationalModule[];
  queues: OperationalQueue[];
  auditEvents: AuditEvent[];
  gatedActions: GatedAction[];
  notices: string[];
};

export type MemberAccountStatus = 'active' | 'pending' | 'frozen' | 'suspended';

export type AdminMemberDirectoryRow = {
  username: string;
  fullName: string;
  packageTier: string;
  accountStatus: MemberAccountStatus;
  stockist: boolean;
  sponsorCode: string;
  directReferrals: number;
  walletAvailable: string;
  cdBalance: string;
  lastActivity: string;
  actions: string[];
};

export type AdminMemberProfile = {
  username: string;
  fullName: string;
  firstName: string;
  lastName: string;
  middleName: string;
  packageTier: string;
  accountStatus: MemberAccountStatus;
  stockist: boolean;
  referralCode: string;
  sponsorCode: string;
  email: string;
  phone: string;
  address: string;
  payoutOption: string;
  payoutDetails: string;
  directReferrals: number;
  walletAvailable: string;
  walletPending: string;
  cdBalance: string;
  lastActivity: string;
  actions: string[];
};

export type AdminMemberManagementCenter = {
  moneyMode: MoneyMode;
  query: string;
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  rows: AdminMemberDirectoryRow[];
  selectedMember: AdminMemberProfile | null;
  actionNotes: string[];
};

export type IncomeSimulationSummary = {
  streamId: string;
  label: string;
  writeStatus: MoneyMode;
  simulatedGross: number;
  simulatedNet: number;
  statusLabel: string;
};

export type MemberMvpDashboardData = {
  moneyMode: MoneyMode;
  packageTier: string;
  payoutSchedule: string;
  incomeStreams: IncomeSimulationSummary[];
  notices: string[];
};

export type AdminMvpDashboardData = {
  moneyMode: MoneyMode;
  queues: OperationalQueue[];
  modules: string[];
};

export type GatedActionResponse = {
  moneyMode: MoneyMode;
  action: string;
  status: 'applied' | 'completed';
  reason: string;
  detail?: string;
};

export type MemberActivationCodeCenter = {
  moneyMode: MoneyMode;
  member: {
    username: string;
    packageTier: string;
  };
  inventory: Array<{
    id: string;
    code: string;
    codeFamily: string;
    accountType: string;
    packageTier: string;
    assignedTo: string;
    status: string;
    paymentStatus?: string;
    generatedAt: string;
    transferredAt?: string | null;
    releasedAt?: string | null;
    registrationEligible?: boolean;
    copyEnabled?: boolean;
    transferable: boolean;
    upgradable: boolean;
    visibility: string;
  }>;
  groupedInventory?: {
    registrationCodes: MemberActivationCodeCenter['inventory'];
    maintenanceCodes: MemberActivationCodeCenter['inventory'];
    perfumeCodes: MemberActivationCodeCenter['inventory'];
    visionCodes: MemberActivationCodeCenter['inventory'];
  };
  history: Array<{
    id: string;
    code: string;
    action: string;
    counterparty: string;
    occurredAt: string;
    status: string;
  }>;
  transferTargets: Array<{
    username: string;
    fullName: string;
    packageTier: string;
  }>;
  hints: string[];
};

export type MemberWalletDetail = {
  moneyMode: MoneyMode;
  summary: {
    availableBalance: number;
    pendingBalance: number;
    cdBalance: number;
    payoutMethod: string;
    payoutSchedule: string;
  };
  incomeBreakdown: Array<{
    streamId: string;
    label: string;
    walletType: string;
    amount: number;
  }>;
  preview: {
    requestedAmount: number;
    fee: number;
    processingFee: number;
    maintenanceFee: number;
    systemRetainer: number;
    tax: number;
    cdDeduction: number;
    totalDeductions: number;
    netReceivable: number;
    sufficientBalance: boolean;
    note: string;
  };
  ledger: Array<{
    id: string;
    walletType: string;
    entryType: string;
    sourceReference: string;
    creditAmount: number;
    debitAmount: number;
    balanceAfter: number;
    status: string;
    processId: string;
  }>;
  transactions: MemberTransactionSummary[];
};

export type MemberTransactionSummary = {
  id: string;
  date: string;
  category: string;
  source: string;
  gross: string;
  net: string;
  status: string;
  type: 'wallet' | 'encashment';
};

export type MemberTransactionDetail = {
  moneyMode: MoneyMode;
  transaction: {
    id: string;
    source: string;
    category: string;
    date: string;
    gross: string;
    net: string;
    status: string;
    support: {
      directReferrals: Array<{
        username: string;
        fullName: string;
        packageTier: string;
      }>;
      pairing: Array<Record<string, string | number>>;
      notes: string[];
    };
  };
};

export type MemberGetYorFiveData = {
  moneyMode: MoneyMode;
  memberPackageTier: string;
  tierProgress: Array<{
    tier: string;
    claimValue: number;
    referralCount: number;
    completedGroups: number;
    remainingToNext: number;
    nextThreshold: number;
  }>;
  ledgerEntries: Array<{
    id: string;
    sourceReference: string;
    creditAmount: number;
    balanceAfter: number;
    status: string;
    occurredAt: string;
  }>;
  totalEarned: number;
  completedGroupsTotal: number;
};

export type MemberRankData = {
  moneyMode: MoneyMode;
  level: number;
  rankName: string;
  totalIncome: number;
  currentThreshold: number;
  nextRankName: string | null;
  nextThreshold: number | null;
  remainingToNext: number | null;
};

export type LeaderboardData = {
  moneyMode: MoneyMode;
  entries: Array<{
    position: number;
    userId: string;
    username: string;
    fullName: string;
    packageTier: string;
    totalIncome: number;
    rankName: string;
    rankLevel: number;
  }>;
};

export type RegistrationReadiness = {
  moneyMode: MoneyMode;
  sponsor: {
    username: string;
    fullName: string;
    referralCode: string;
  };
  placementPolicy: {
    mode: string;
    recommendation: {
      placementUsername: string;
      placementSide: string;
      note: string;
    };
  };
  activeReservation?: {
    id: string;
    placementUsername: string;
    placementSide: string;
    shareToken: string;
    expiresAt: string;
    shareLink: string;
  } | null;
  referralLink: string;
  availableCodes: MemberActivationCodeCenter['inventory'];
  checklist: string[];
};

export type GenealogyTreeNode = {
  nodeId: string;
  username: string;
  fullName: string;
  referralCode: string;
  packageTier: string;
  placement: 'root' | 'left' | 'right';
  status: string;
  depth: number;
  tracePath: string;
  binaryPoints: number;
  directReferrals: number;
  leftPoints: number;
  rightPoints: number;
  openSlots: {
    left: boolean;
    right: boolean;
  };
  shadowSlots: {
    left: {
      id: string;
      owner: string;
      placement: 'left';
      state: 'reserved_shadow' | 'activated_shadow';
      shadowCode: string;
      label: string;
      activationStatus: 'inactive' | 'activated';
      registrationEnabled: boolean;
      walletEnabled: boolean;
      unilevelEnabled: boolean;
      binaryCycleEnabled: boolean;
      note: string;
      packageTier: string | null;
      accountType: string | null;
      activationCode: string | null;
      pvValue: number;
      salesmatchValue: number;
      activatedAt: string | null;
      lastUpgradedAt: string | null;
    };
    right: {
      id: string;
      owner: string;
      placement: 'right';
      state: 'reserved_shadow' | 'activated_shadow';
      shadowCode: string;
      label: string;
      activationStatus: 'inactive' | 'activated';
      registrationEnabled: boolean;
      walletEnabled: boolean;
      unilevelEnabled: boolean;
      binaryCycleEnabled: boolean;
      note: string;
      packageTier: string | null;
      accountType: string | null;
      activationCode: string | null;
      pvValue: number;
      salesmatchValue: number;
      activatedAt: string | null;
      lastUpgradedAt: string | null;
    };
  };
  accountStateLabel: 'PD' | 'FS' | 'CD - Paid' | 'CD - Unpaid';
  children: GenealogyTreeNode[];
};

export type GenealogyCenter = {
  moneyMode: MoneyMode;
  treeType: string;
  root: GenealogyTreeNode;
  nodes: Array<Omit<GenealogyTreeNode, 'children'> & { parentNodeId: string | null; level: number }>;
  notes: string[];
};

export type AdminActivationCodeCenter = {
  moneyMode: MoneyMode;
  inventory: Array<{
    id: string;
    code: string;
    codeFamily?: string;
    accountType: string;
    packageTier: string;
    assignedTo: string;
    status: string;
    paymentStatus: 'unpaid' | 'paid' | 'externally-paid';
    remarks: string;
    generatedAt: string;
    registrationEligible?: boolean;
    copyEnabled?: boolean;
    transferable: boolean;
    releasable: boolean;
  }>;
  groupedInventory?: {
    registrationCodes: AdminActivationCodeCenter['inventory'];
    maintenanceCodes: AdminActivationCodeCenter['inventory'];
    perfumeCodes: AdminActivationCodeCenter['inventory'];
    visionCodes: AdminActivationCodeCenter['inventory'];
  };
  metrics: {
    totalCodes: number;
    availableCodes: number;
    unreleasedCodes: number;
    usedCodes: number;
    lostCodes: number;
    paidCodes: number;
  };
  auditTrail: AuditEvent[];
  transferTargets: Array<{
    username: string;
    fullName: string;
    packageTier: string;
  }>;
  hints: string[];
};

export type AdminEncashmentCenter = {
  moneyMode: MoneyMode;
  encashments: Array<{
    id: string;
    queueOrder: number;
    member: string;
    gross: string;
    fee: string;
    tax: string;
    cdDeduction: string;
    net: string;
    method: string;
    status: string;
    remarks: string;
  }>;
  totals: {
    gross: number;
    net: number;
    awaitingReview: number;
  };
  processNotes: string[];
};

export type ShadowAccountCenter = {
  moneyMode: MoneyMode;
  owner: string;
  accounts: Array<{
    id: string;
    owner: string;
    shadowCode: string;
    label: string;
    state: string;
    activationStatus: 'inactive' | 'activated';
    placement: 'left' | 'right';
    walletEnabled: boolean;
    unilevelEnabled: boolean;
    binaryCycleEnabled: boolean;
    packageTier: string | null;
    accountType: string | null;
    activationCode: string | null;
    pvValue: number;
    salesmatchValue: number;
    activatedAt: string | null;
    lastUpgradedAt: string | null;
    note: string;
    canActivate: boolean;
    canUpgrade: boolean;
  }>;
  availableCodes: MemberActivationCodeCenter['inventory'];
  notes: string[];
};
