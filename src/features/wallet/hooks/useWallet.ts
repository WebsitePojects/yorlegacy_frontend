// Phase 2: Extract wallet state from MemberDashboardPage (wallet module view) into this hook.

import type { MemberWalletDetail, MemberTransactionSummary } from '../types';

export interface UseWalletReturn {
  walletDetail: MemberWalletDetail | null;
  transactions: MemberTransactionSummary[];
  isLoading: boolean;
  error: string | null;
}

// TODO Phase 2: implement and replace inline state in MemberDashboardPage wallet module
