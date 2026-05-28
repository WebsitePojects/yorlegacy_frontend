export type AppRole = 'member' | 'admin';

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

export type MemberOfficeData = {
  user: AuthUser;
  wallet: {
    availableBalance: string;
    pendingBalance: string;
    payoutSchedule: string;
  };
  profile: {
    packageTier: string;
    referralCode: string;
    sponsorCode: string;
    accountStatus: string;
  };
  actions: string[];
  alerts: string[];
};

export type AdminOfficeData = {
  user: AuthUser;
  metrics: Array<{
    label: string;
    value: string;
  }>;
  queues: string[];
  controls: string[];
  notices: string[];
};
