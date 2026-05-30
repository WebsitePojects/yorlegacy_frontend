import { fallbackContent } from '../data/fallbackContent';
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
import type { PageContent } from '../types/content';
import type { RegistrationPreview, RegistrationSubmitResponse } from '../types/registration';

export const DEFAULT_API_BASE_URL = '';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? DEFAULT_API_BASE_URL;

async function fetchJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {})
    },
    ...init
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as
      | { message?: string; reason?: string; detail?: string; error?: string; moneyMode?: string; status?: string }
      | null;

    if (response.status === 423 && payload?.moneyMode === 'playground' && payload?.status === 'applied') {
      return payload as T;
    }

    throw new Error(payload?.message ?? payload?.reason ?? payload?.detail ?? payload?.error ?? `Request failed for ${path}`);
  }

  return (await response.json()) as T;
}

export async function fetchPageContent(slug: string): Promise<PageContent> {
  try {
    return await fetchJson<PageContent>(`/api/pages/${encodeURIComponent(slug)}`, {
      method: 'GET'
    });
  } catch {
    const fallback = fallbackContent[slug];

    if (!fallback) {
      throw new Error(`No content available for ${slug}`);
    }

    return fallback;
  }
}

export function fetchAuthState(): Promise<AuthState> {
  return fetchJson<AuthState>('/api/auth/me', { method: 'GET' });
}

export function loginUser(email: string, password: string): Promise<AuthState> {
  return fetchJson<AuthState>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password })
  });
}

export function logoutUser(): Promise<{ authenticated: boolean }> {
  return fetchJson<{ authenticated: boolean }>('/api/auth/logout', {
    method: 'POST'
  });
}

export function fetchDemoCredentials(): Promise<
  Record<AppRole, { email: string; password: string }>
> {
  return fetchJson('/api/auth/demo-credentials', { method: 'GET' });
}

export function fetchMemberSummary(): Promise<DashboardSummary> {
  return fetchJson('/api/member/summary', { method: 'GET' });
}

export function fetchAdminSummary(): Promise<DashboardSummary> {
  return fetchJson('/api/admin/summary', { method: 'GET' });
}

export function fetchMemberOffice(): Promise<MemberOfficeData> {
  return fetchJson('/api/member/office', { method: 'GET' });
}

export function fetchAdminOffice(): Promise<AdminOfficeData> {
  return fetchJson('/api/admin/office', { method: 'GET' });
}

export function fetchMemberMvpDashboard(): Promise<MemberMvpDashboardData> {
  return fetchJson('/api/member/dashboard', { method: 'GET' });
}

export function fetchAdminMvpDashboard(): Promise<AdminMvpDashboardData> {
  return fetchJson('/api/admin/dashboard', { method: 'GET' });
}

export function fetchMemberModule(moduleId: string): Promise<OperationalModule> {
  return fetchJson(`/api/member/modules/${encodeURIComponent(moduleId)}`, {
    method: 'GET'
  });
}

export function fetchAdminModule(moduleId: string): Promise<OperationalModule> {
  return fetchJson(`/api/admin/modules/${encodeURIComponent(moduleId)}`, {
    method: 'GET'
  });
}

export function fetchMemberActivationCodes(): Promise<MemberActivationCodeCenter> {
  return fetchJson('/api/member/activation-codes', { method: 'GET' });
}

export function transferMemberActivationCodes(payload: {
  targetUsername: string;
  codes: string[];
}): Promise<GatedActionResponse> {
  return fetchJson('/api/member/activation-codes/transfer', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export function upgradeMemberActivationCode(payload: { code: string }): Promise<GatedActionResponse> {
  return fetchJson('/api/member/activation-codes/upgrade', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export function useMaintenanceCode(payload: { code: string; transType: number }): Promise<GatedActionResponse> {
  return fetchJson('/api/member/activation-codes/maintenance', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export function fetchMemberWalletDetail(): Promise<MemberWalletDetail> {
  return fetchJson('/api/member/wallet-detail', { method: 'GET' });
}

export function previewMemberEncashment(amount: number): Promise<{
  moneyMode: 'playground' | 'sandbox';
  preview: MemberWalletDetail['preview'];
  requestedAmount: number;
}> {
  return fetchJson('/api/member/wallet/preview-encash', {
    method: 'POST',
    body: JSON.stringify({ amount })
  });
}

export function submitMemberEncashment(amount: number): Promise<GatedActionResponse> {
  return fetchJson('/api/member/wallet/encash', {
    method: 'POST',
    body: JSON.stringify({ amount })
  });
}

export function fetchMemberTransactions(): Promise<{
  moneyMode: 'playground' | 'sandbox';
  transactions: MemberTransactionSummary[];
}> {
  return fetchJson('/api/member/transactions', { method: 'GET' });
}

export function fetchMemberTransactionDetail(transactionId: string): Promise<MemberTransactionDetail> {
  return fetchJson(`/api/member/transactions/${encodeURIComponent(transactionId)}`, {
    method: 'GET'
  });
}

export function fetchMemberRegistrationReadiness(): Promise<RegistrationReadiness> {
  return fetchJson('/api/member/registration-readiness', { method: 'GET' });
}

export function fetchMemberBinaryTree(): Promise<GenealogyCenter> {
  return fetchJson('/api/member/genealogy/binary-tree', { method: 'GET' });
}

export function fetchAdminActivationCodes(): Promise<AdminActivationCodeCenter> {
  return fetchJson('/api/admin/activation-codes', { method: 'GET' });
}

export function generateAdminActivationCodes(
  quantity: number,
  packageTier?: string,
  assignedTo?: string
): Promise<GatedActionResponse> {
  return fetchJson('/api/admin/activation-codes/generate', {
    method: 'POST',
    body: JSON.stringify({ quantity, packageTier, assignedTo })
  });
}

export function fetchAdminEncashments(): Promise<AdminEncashmentCenter> {
  return fetchJson('/api/admin/encashments', { method: 'GET' });
}

export function approveAdminEncashment(encashmentId: string): Promise<GatedActionResponse> {
  return fetchJson(`/api/admin/encashments/${encodeURIComponent(encashmentId)}/approve`, {
    method: 'POST'
  });
}

export function resetAdminSandbox(): Promise<GatedActionResponse> {
  return fetchJson('/api/admin/sandbox/reset', {
    method: 'POST'
  });
}

export function fetchAdminBinaryTree(rootUsername?: string): Promise<GenealogyCenter> {
  const suffix = rootUsername ? `?rootUsername=${encodeURIComponent(rootUsername)}` : '';
  return fetchJson(`/api/admin/genealogy/binary-tree${suffix}`, { method: 'GET' });
}

export function fetchAdminSponsorTree(rootUsername?: string): Promise<GenealogyCenter> {
  const suffix = rootUsername ? `?rootUsername=${encodeURIComponent(rootUsername)}` : '';
  return fetchJson(`/api/admin/genealogy/sponsor-tree${suffix}`, { method: 'GET' });
}

export function fetchRegistrationPreview(payload: {
  fullName: string;
  email: string;
  phone: string;
  password: string;
  sponsorCode: string;
  packageTier: string;
  preferredSide: 'left' | 'right';
}): Promise<RegistrationPreview> {
  return fetchJson('/api/registration/preview', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export function submitRegistration(payload: {
  fullName: string;
  email: string;
  phone: string;
  password: string;
  sponsorCode: string;
  packageTier: string;
  preferredSide: 'left' | 'right';
}): Promise<RegistrationSubmitResponse> {
  return fetchJson('/api/registration/submit', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}
