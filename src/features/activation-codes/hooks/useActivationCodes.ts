// Phase 2: Extract activation code state from MemberDashboardPage and AdminDashboardPage.

import type { MemberActivationCodeCenter, AdminActivationCodeCenter } from '../types';

export interface UseMemberActivationCodesReturn {
  center: MemberActivationCodeCenter | null;
  isLoading: boolean;
  error: string | null;
}

export interface UseAdminActivationCodesReturn {
  center: AdminActivationCodeCenter | null;
  isLoading: boolean;
  error: string | null;
}

// TODO Phase 2: implement and replace inline state in dashboard pages
