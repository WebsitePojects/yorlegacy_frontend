// Phase 2: Extract cashier-specific module state. Currently cashier uses AdminDashboardPage.

export interface UseCashierDashboardReturn {
  isLoading: boolean;
  error: string | null;
}

// TODO Phase 2: implement cashier-specific views when the cashier feature is separated from admin
