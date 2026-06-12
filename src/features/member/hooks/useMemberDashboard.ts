// Phase 2: Extract member dashboard state and fetch logic from MemberDashboardPage into this hook.
// This shell documents the intended contract; implementation lives in the page until Phase 2.

import type { DashboardSummary, MemberOfficeData, MemberMvpDashboardData, OperationalModule } from '../types';

export interface UseMemberDashboardReturn {
  summary: DashboardSummary | null;
  officeData: MemberOfficeData | null;
  mvpData: MemberMvpDashboardData | null;
  activeModule: OperationalModule | null;
  isLoading: boolean;
  error: string | null;
}

// TODO Phase 2: implement and replace inline state in MemberDashboardPage
