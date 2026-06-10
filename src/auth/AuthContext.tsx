import {
  createContext,
  startTransition,
  useContext,
  useEffect,
  useState,
  type PropsWithChildren
} from 'react';
import {
  approveAdminEncashment,
  fetchAdminActivationCodes,
  fetchAdminBinaryTree,
  fetchAdminEncashments,
  fetchAdminMemberManagement,
  fetchAdminSummary,
  fetchAdminOffice,
  fetchAdminMvpDashboard,
  fetchAdminModule,
  fetchAdminSponsorTree,
  fetchAuthState,
  fetchDemoCredentials,
  fetchMemberActivationCodes,
  fetchMemberBinaryTree,
  fetchMemberGetYorFive,
  fetchMemberModule,
  fetchMemberMvpDashboard,
  fetchMemberOffice,
  fetchMemberRegistrationReadiness,
  fetchMemberShadowAccounts,
  fetchMemberSummary,
  fetchMemberTransactionDetail,
  fetchMemberTransactions,
  fetchMemberWalletDetail,
  generateAdminActivationCodes,
  loginUser,
  logoutUser,
  previewMemberEncashment,
  releaseAdminActivationCodes,
  reviewAdminActivationCodes,
  reviewAdminEncashment,
  resetAdminSandbox,
  searchMemberProfile,
  submitMemberEncashment,
  updateMemberPayoutSettings,
  transferAdminActivationCodes,
  transferMemberActivationCodes,
  updateAdminMemberProfile,
  updateAdminMemberStatus,
  updateAdminMemberName,
  upgradeMemberActivationCode,
  useMaintenanceCode
} from '../lib/api';
import { clearAllOfficeCache } from '../lib/office-cache';
import type {
  AdminActivationCodeCenter,
  AdminEncashmentCenter,
  AdminMemberManagementCenter,
  AdminOfficeData,
  AdminMvpDashboardData,
  AppRole,
  AuthState,
  DashboardSummary,
  GatedActionResponse,
  GenealogyCenter,
  MemberActivationCodeCenter,
  MemberGetYorFiveData,
  MemberOfficeData,
  MemberMvpDashboardData,
  ShadowAccountCenter,
  MemberTransactionDetail,
  MemberTransactionSummary,
  MemberWalletDetail,
  OperationalModule
} from '../types/auth';
import type { RegistrationReadiness } from '../types/auth';

type LoginPayload = {
  username: string;
  password: string;
  rememberMe?: boolean;
  scope: 'member' | 'office';
};

type AuthContextValue = AuthState & {
  login: (payload: LoginPayload) => Promise<AuthState>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
  getDemoCredentials: typeof fetchDemoCredentials;
  getMemberSummary: () => Promise<DashboardSummary>;
  getMemberOffice: () => Promise<MemberOfficeData>;
  getMemberMvpDashboard: () => Promise<MemberMvpDashboardData>;
  getAdminSummary: () => Promise<DashboardSummary>;
  getAdminOffice: () => Promise<AdminOfficeData>;
  getAdminMvpDashboard: () => Promise<AdminMvpDashboardData>;
  getMemberModule: (moduleId: string) => Promise<OperationalModule>;
  getAdminModule: (moduleId: string) => Promise<OperationalModule>;
  getMemberActivationCodes: () => Promise<MemberActivationCodeCenter>;
  transferActivationCodes: (payload: { targetUsername: string; codes: string[] }) => Promise<GatedActionResponse>;
  upgradeActivationCode: (payload: { code: string }) => Promise<GatedActionResponse>;
  useMaintenanceCode: (payload: { code: string; transType: number }) => Promise<GatedActionResponse>;
  getMemberWalletDetail: () => Promise<MemberWalletDetail>;
  getMemberGetYorFive: () => Promise<MemberGetYorFiveData>;
  previewEncashment: (amount: number) => Promise<{
    moneyMode: 'playground' | 'sandbox';
    preview: MemberWalletDetail['preview'];
    requestedAmount: number;
  }>;
  submitEncashment: (amount: number) => Promise<GatedActionResponse>;
  updatePayoutSettings: (payoutOption: string, payoutDetails: string) => Promise<GatedActionResponse>;
  getMemberTransactions: () => Promise<{ moneyMode: 'playground' | 'sandbox'; transactions: MemberTransactionSummary[] }>;
  getMemberTransactionDetail: (transactionId: string) => Promise<MemberTransactionDetail>;
  getMemberRegistrationReadiness: () => Promise<RegistrationReadiness>;
  getMemberBinaryTree: (rootUsername?: string) => Promise<GenealogyCenter>;
  getMemberShadowAccounts: (ownerUsername?: string) => Promise<ShadowAccountCenter>;
  getAdminActivationCodes: () => Promise<AdminActivationCodeCenter>;
  generateActivationCodes: (payload: {
    quantity: number;
    packageTier?: string;
    codeFamily?: string;
    assignedTo?: string;
    accountType?: string;
    remarks?: string;
  }) => Promise<GatedActionResponse>;
  releaseActivationCodes: (codes: string[]) => Promise<GatedActionResponse>;
  transferAdminCodes: (payload: { targetUsername: string; codes: string[] }) => Promise<GatedActionResponse>;
  reviewActivationCodes: (payload: {
    codes: string[];
    action: 'mark-paid' | 'mark-external-paid' | 'mark-lost' | 'restore';
    remarks?: string;
  }) => Promise<GatedActionResponse>;
  getAdminEncashments: () => Promise<AdminEncashmentCenter>;
  approveEncashment: (encashmentId: string) => Promise<GatedActionResponse>;
  reviewEncashment: (
    encashmentId: string,
    payload: {
      action: 'queue' | 'mark-paid' | 'cancel' | 'edit';
      method?: string;
      fee?: number;
      tax?: number;
      cdDeduction?: number;
      remarks?: string;
    }
  ) => Promise<GatedActionResponse>;
  getAdminMemberManagement: (payload?: {
    query?: string;
    username?: string;
    page?: number;
    pageSize?: number;
  }) => Promise<AdminMemberManagementCenter>;
  updateMemberName: (username: string, fullName: string) => Promise<GatedActionResponse>;
  updateMemberProfile: (
    username: string,
    payload: {
      firstName: string;
      lastName: string;
      middleName?: string;
      password?: string;
      payoutOption?: string;
      payoutDetails?: string;
      address?: string;
      contactNumber?: string;
    }
  ) => Promise<GatedActionResponse>;
  updateMemberStatus: (
    username: string,
    status: 'active' | 'pending' | 'frozen' | 'suspended'
  ) => Promise<GatedActionResponse>;
  resetSandbox: () => Promise<GatedActionResponse>;
  getAdminBinaryTree: (rootUsername?: string) => Promise<GenealogyCenter>;
  getAdminSponsorTree: (rootUsername?: string) => Promise<GenealogyCenter>;
  searchMemberProfile: (username: string) => Promise<{ username: string; fullName: string; packageTier: string }>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

const initialState: AuthState = {
  isLoading: true,
  authenticated: false,
  user: null
};

export function AuthProvider({ children }: PropsWithChildren) {
  const [state, setState] = useState<AuthState>(initialState);

  async function refresh(): Promise<void> {
    try {
      const authState = await fetchAuthState();
      clearAllOfficeCache();

      startTransition(() => {
        setState({
          isLoading: false,
          authenticated: authState.authenticated,
          user: authState.user
        });
      });
    } catch {
      clearAllOfficeCache();
      startTransition(() => {
        setState({
          isLoading: false,
          authenticated: false,
          user: null
        });
      });
    }
  }

  useEffect(() => {
    void refresh();
  }, []);

  async function login(payload: LoginPayload): Promise<AuthState> {
    const authState = await loginUser(payload.username, payload.password, payload.rememberMe, payload.scope);
    clearAllOfficeCache();

    setState({
      isLoading: false,
      authenticated: authState.authenticated,
      user: authState.user
    });

    return authState;
  }

  async function logout(): Promise<void> {
    await logoutUser();
    clearAllOfficeCache();
    setState({
      isLoading: false,
      authenticated: false,
      user: null
    });
  }

  const value: AuthContextValue = {
    ...state,
    login,
    logout,
    refresh,
    getDemoCredentials: fetchDemoCredentials,
    getMemberSummary: fetchMemberSummary,
    getMemberOffice: fetchMemberOffice,
    getMemberMvpDashboard: fetchMemberMvpDashboard,
    getAdminSummary: fetchAdminSummary,
    getAdminOffice: fetchAdminOffice,
    getAdminMvpDashboard: fetchAdminMvpDashboard,
    getMemberModule: fetchMemberModule,
    getAdminModule: fetchAdminModule,
    getMemberActivationCodes: fetchMemberActivationCodes,
    transferActivationCodes: transferMemberActivationCodes,
    upgradeActivationCode: upgradeMemberActivationCode,
    useMaintenanceCode,
    getMemberWalletDetail: fetchMemberWalletDetail,
    getMemberGetYorFive: fetchMemberGetYorFive,
    previewEncashment: previewMemberEncashment,
    submitEncashment: submitMemberEncashment,
    updatePayoutSettings: updateMemberPayoutSettings,
    getMemberTransactions: fetchMemberTransactions,
    getMemberTransactionDetail: fetchMemberTransactionDetail,
    getMemberRegistrationReadiness: fetchMemberRegistrationReadiness,
    getMemberBinaryTree: fetchMemberBinaryTree,
    getMemberShadowAccounts: fetchMemberShadowAccounts,
    getAdminActivationCodes: fetchAdminActivationCodes,
    generateActivationCodes: ({ quantity, packageTier, codeFamily, assignedTo, accountType, remarks }) =>
      generateAdminActivationCodes(quantity, packageTier, codeFamily, assignedTo, accountType, remarks),
    releaseActivationCodes: releaseAdminActivationCodes,
    transferAdminCodes: transferAdminActivationCodes,
    reviewActivationCodes: reviewAdminActivationCodes,
    getAdminEncashments: fetchAdminEncashments,
    approveEncashment: approveAdminEncashment,
    reviewEncashment: reviewAdminEncashment,
    getAdminMemberManagement: fetchAdminMemberManagement,
    updateMemberName: updateAdminMemberName,
    updateMemberProfile: updateAdminMemberProfile,
    updateMemberStatus: updateAdminMemberStatus,
    resetSandbox: resetAdminSandbox,
    getAdminBinaryTree: fetchAdminBinaryTree,
    getAdminSponsorTree: fetchAdminSponsorTree,
    searchMemberProfile
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }

  return context;
}

export function canAccessRole(
  userRole: AppRole | undefined,
  allowedRoles: AppRole[]
): boolean {
  if (!userRole) {
    return false;
  }

  return allowedRoles.includes(userRole);
}
