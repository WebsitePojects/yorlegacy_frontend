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
  fetchAdminSummary,
  fetchAdminOffice,
  fetchAdminMvpDashboard,
  fetchAdminModule,
  fetchAdminSponsorTree,
  fetchAuthState,
  fetchDemoCredentials,
  fetchMemberActivationCodes,
  fetchMemberBinaryTree,
  fetchMemberModule,
  fetchMemberMvpDashboard,
  fetchMemberOffice,
  fetchMemberRegistrationReadiness,
  fetchMemberSummary,
  fetchMemberTransactionDetail,
  fetchMemberTransactions,
  fetchMemberWalletDetail,
  generateAdminActivationCodes,
  loginUser,
  logoutUser,
  previewMemberEncashment,
  resetAdminSandbox,
  submitMemberEncashment,
  transferMemberActivationCodes,
  upgradeMemberActivationCode,
  useMaintenanceCode
} from '../lib/api';
import type {
  AdminActivationCodeCenter,
  AdminEncashmentCenter,
  AdminOfficeData,
  AdminMvpDashboardData,
  AppRole,
  AuthState,
  DashboardSummary,
  GatedActionResponse,
  GenealogyCenter,
  MemberActivationCodeCenter,
  MemberOfficeData,
  MemberMvpDashboardData,
  MemberTransactionDetail,
  MemberTransactionSummary,
  MemberWalletDetail,
  OperationalModule
} from '../types/auth';
import type { RegistrationReadiness } from '../types/auth';

type LoginPayload = {
  email: string;
  password: string;
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
  previewEncashment: (amount: number) => Promise<{
    moneyMode: 'playground' | 'sandbox';
    preview: MemberWalletDetail['preview'];
    requestedAmount: number;
  }>;
  submitEncashment: (amount: number) => Promise<GatedActionResponse>;
  getMemberTransactions: () => Promise<{ moneyMode: 'playground' | 'sandbox'; transactions: MemberTransactionSummary[] }>;
  getMemberTransactionDetail: (transactionId: string) => Promise<MemberTransactionDetail>;
  getMemberRegistrationReadiness: () => Promise<RegistrationReadiness>;
  getMemberBinaryTree: () => Promise<GenealogyCenter>;
  getAdminActivationCodes: () => Promise<AdminActivationCodeCenter>;
  generateActivationCodes: (payload: { quantity: number; packageTier?: string; assignedTo?: string }) => Promise<GatedActionResponse>;
  getAdminEncashments: () => Promise<AdminEncashmentCenter>;
  approveEncashment: (encashmentId: string) => Promise<GatedActionResponse>;
  resetSandbox: () => Promise<GatedActionResponse>;
  getAdminBinaryTree: (rootUsername?: string) => Promise<GenealogyCenter>;
  getAdminSponsorTree: (rootUsername?: string) => Promise<GenealogyCenter>;
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

      startTransition(() => {
        setState({
          isLoading: false,
          authenticated: authState.authenticated,
          user: authState.user
        });
      });
    } catch {
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
    const authState = await loginUser(payload.email, payload.password);

    setState({
      isLoading: false,
      authenticated: authState.authenticated,
      user: authState.user
    });

    return authState;
  }

  async function logout(): Promise<void> {
    await logoutUser();
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
    previewEncashment: previewMemberEncashment,
    submitEncashment: submitMemberEncashment,
    getMemberTransactions: fetchMemberTransactions,
    getMemberTransactionDetail: fetchMemberTransactionDetail,
    getMemberRegistrationReadiness: fetchMemberRegistrationReadiness,
    getMemberBinaryTree: fetchMemberBinaryTree,
    getAdminActivationCodes: fetchAdminActivationCodes,
    generateActivationCodes: ({ quantity, packageTier, assignedTo }) =>
      generateAdminActivationCodes(quantity, packageTier, assignedTo),
    getAdminEncashments: fetchAdminEncashments,
    approveEncashment: approveAdminEncashment,
    resetSandbox: resetAdminSandbox,
    getAdminBinaryTree: fetchAdminBinaryTree,
    getAdminSponsorTree: fetchAdminSponsorTree
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
