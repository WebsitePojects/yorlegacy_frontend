import {
  createContext,
  startTransition,
  useContext,
  useEffect,
  useState,
  type PropsWithChildren
} from 'react';
import {
  fetchAdminSummary,
  fetchAdminOffice,
  fetchAuthState,
  fetchDemoCredentials,
  fetchMemberOffice,
  fetchMemberSummary,
  loginUser,
  logoutUser
} from '../lib/api';
import type {
  AdminOfficeData,
  AppRole,
  AuthState,
  DashboardSummary,
  MemberOfficeData
} from '../types/auth';

type LoginPayload = {
  email: string;
  password: string;
};

type AuthContextValue = AuthState & {
  login: (payload: LoginPayload) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
  getDemoCredentials: typeof fetchDemoCredentials;
  getMemberSummary: () => Promise<DashboardSummary>;
  getMemberOffice: () => Promise<MemberOfficeData>;
  getAdminSummary: () => Promise<DashboardSummary>;
  getAdminOffice: () => Promise<AdminOfficeData>;
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

  async function login(payload: LoginPayload): Promise<void> {
    const authState = await loginUser(payload.email, payload.password);

    setState({
      isLoading: false,
      authenticated: authState.authenticated,
      user: authState.user
    });
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
    getAdminSummary: fetchAdminSummary,
    getAdminOffice: fetchAdminOffice
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
