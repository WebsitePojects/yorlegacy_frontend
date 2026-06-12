// Phase 2: Extract admin dashboard state and fetch logic from AdminDashboardPage into this hook.

import type {
  DashboardSummary,
  AdminOfficeData,
  AdminMvpDashboardData,
  AdminMemberManagementCenter,
  AdminEncashmentCenter,
  OperationalModule
} from '../types';

export interface UseAdminDashboardReturn {
  summary: DashboardSummary | null;
  officeData: AdminOfficeData | null;
  mvpData: AdminMvpDashboardData | null;
  memberManagement: AdminMemberManagementCenter | null;
  encashments: AdminEncashmentCenter | null;
  activeModule: OperationalModule | null;
  isLoading: boolean;
  error: string | null;
}

// TODO Phase 2: implement and replace inline state in AdminDashboardPage
