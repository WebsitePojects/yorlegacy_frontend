import { fallbackContent } from '../data/fallbackContent';
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
  MemberOfficeData,
  MemberMvpDashboardData,
  ShadowAccountCenter,
  MemberTransactionDetail,
  MemberTransactionSummary,
  MemberWalletDetail,
  OperationalModule
} from '../types/auth';
import type { RegistrationReadiness } from '../types/auth';
import type { PageContent } from '../types/content';
import type { RegistrationPreview, RegistrationSubmitResponse } from '../types/registration';

export const DEFAULT_API_BASE_URL = '';

const requestedApiBaseUrl = (import.meta.env.VITE_API_BASE_URL || DEFAULT_API_BASE_URL).trim();
const isYorPublicHost =
  typeof window !== 'undefined' &&
  ['yorinternational.net', 'www.yorinternational.net'].includes(window.location.hostname);
const API_BASE_URL = (
  isYorPublicHost && requestedApiBaseUrl.includes('asse.devtunnels.ms')
    ? ''
    : requestedApiBaseUrl
).replace(/\/+$/, '');
const CSRF_COOKIE_NAME = 'yor_csrf';

function readCookie(name: string): string | null {
  if (typeof document === 'undefined') {
    return null;
  }

  const cookies = document.cookie.split(';');
  for (const part of cookies) {
    const [key, ...rest] = part.trim().split('=');
    if (key === name) {
      return rest.join('=');
    }
  }

  return null;
}

async function fetchJson<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers ?? {});
  const method = (init?.method ?? 'GET').toUpperCase();
  const isProtectedOfficeRequest =
    path.startsWith('/api/auth/') ||
    path.startsWith('/api/member/') ||
    path.startsWith('/api/admin/') ||
    path.startsWith('/api/registration/');

  // Avoid forcing CORS preflights on simple GET/HEAD requests.
  if (init?.body != null && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  if (!['GET', 'HEAD', 'OPTIONS'].includes(method) && !headers.has('x-yor-csrf-token')) {
    const csrfToken = readCookie(CSRF_COOKIE_NAME);
    if (csrfToken) {
      headers.set('x-yor-csrf-token', csrfToken);
    }
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    credentials: 'include',
    headers,
    cache: isProtectedOfficeRequest ? 'no-store' : init?.cache,
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

export function loginUser(username: string, password: string, rememberMe?: boolean, scope?: 'member' | 'office'): Promise<AuthState> {
  return fetchJson<AuthState>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password, rememberMe, scope })
  });
}

export function logoutUser(): Promise<{ authenticated: boolean }> {
  return fetchJson<{ authenticated: boolean }>('/api/auth/logout', {
    method: 'POST'
  });
}

export function fetchDemoCredentials(): Promise<
  Record<AppRole, { username: string; password: string }>
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

export function searchMemberProfile(username: string): Promise<{ username: string; fullName: string; packageTier: string }> {
  return fetchJson(`/api/member/search-profile?username=${encodeURIComponent(username)}`, {
    method: 'GET'
  });
}

export function searchMemberTransferTargets(query: string): Promise<{
  results: Array<{ username: string; displayName: string; packageTier: string }>;
}> {
  return fetchJson(`/api/member/members/search?q=${encodeURIComponent(query)}`, {
    method: 'GET'
  });
}

export function searchAdminTransferTargets(query: string): Promise<{
  results: Array<{ username: string; displayName: string; packageTier: string }>;
}> {
  return fetchJson(`/api/admin/members/search?q=${encodeURIComponent(query)}`, {
    method: 'GET'
  });
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

export function updateMemberPayoutSettings(
  payoutOption: string,
  payoutDetails: string
): Promise<GatedActionResponse> {
  return fetchJson('/api/member/profile/payout', {
    method: 'POST',
    body: JSON.stringify({ payoutOption, payoutDetails })
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

export function createMemberPlacementReservation(payload: {
  placementParentUsername: string;
  placementSide: 'left' | 'right';
  expiresInHours?: number;
}): Promise<{
  moneyMode: 'production';
  status: 'completed';
  reservation: {
    id: string;
    placementUsername: string;
    placementSide: 'left' | 'right';
    expiresAt: string;
    shareToken: string;
    shareLink: string;
  };
}> {
  return fetchJson('/api/member/placement-reservations', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export function fetchMemberBinaryTree(rootUsername?: string): Promise<GenealogyCenter> {
  const suffix = rootUsername ? `?rootUsername=${encodeURIComponent(rootUsername)}` : '';
  return fetchJson(`/api/member/genealogy/binary-tree${suffix}`, { method: 'GET' });
}

export function fetchMemberShadowAccounts(ownerUsername?: string): Promise<ShadowAccountCenter> {
  const suffix = ownerUsername ? `?ownerUsername=${encodeURIComponent(ownerUsername)}` : '';
  return fetchJson(`/api/member/shadow-accounts${suffix}`, { method: 'GET' });
}

export function fetchAdminActivationCodes(): Promise<AdminActivationCodeCenter> {
  return fetchJson('/api/admin/activation-codes', { method: 'GET' });
}

export function generateAdminActivationCodes(
  quantity: number,
  packageTier?: string,
  codeFamily?: string,
  assignedTo?: string,
  accountType?: string,
  remarks?: string
): Promise<GatedActionResponse> {
  return fetchJson('/api/admin/activation-codes/generate', {
    method: 'POST',
    body: JSON.stringify({ quantity, packageTier, codeFamily, assignedTo, accountType, remarks })
  });
}

export function releaseAdminActivationCodes(codes: string[]): Promise<GatedActionResponse> {
  return fetchJson('/api/admin/activation-codes/release', {
    method: 'POST',
    body: JSON.stringify({ codes })
  });
}

export function transferAdminActivationCodes(payload: {
  targetUsername: string;
  codes: string[];
}): Promise<GatedActionResponse> {
  return fetchJson('/api/admin/activation-codes/transfer', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export function reviewAdminActivationCodes(payload: {
  codes: string[];
  action: 'mark-paid' | 'mark-external-paid' | 'mark-lost' | 'restore';
  remarks?: string;
}): Promise<GatedActionResponse> {
  return fetchJson('/api/admin/activation-codes/review', {
    method: 'POST',
    body: JSON.stringify(payload)
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

export function reviewAdminEncashment(
  encashmentId: string,
  payload: {
    action: 'queue' | 'mark-paid' | 'cancel' | 'edit';
    method?: string;
    fee?: number;
    tax?: number;
    cdDeduction?: number;
    remarks?: string;
  }
): Promise<GatedActionResponse> {
  return fetchJson(`/api/admin/encashments/${encodeURIComponent(encashmentId)}/review`, {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export function fetchAdminMemberManagement(payload?: {
  query?: string;
  username?: string;
  page?: number;
  pageSize?: number;
}): Promise<AdminMemberManagementCenter> {
  const params = new URLSearchParams();

  if (payload?.query?.trim()) {
    params.set('query', payload.query.trim());
  }

  if (payload?.username?.trim()) {
    params.set('username', payload.username.trim());
  }

  if (payload?.page) {
    params.set('page', String(payload.page));
  }

  if (payload?.pageSize) {
    params.set('pageSize', String(payload.pageSize));
  }

  const suffix = params.size ? `?${params.toString()}` : '';
  return fetchJson(`/api/admin/members${suffix}`, { method: 'GET' });
}

export function resetAdminSandbox(): Promise<GatedActionResponse> {
  return fetchJson('/api/admin/sandbox/reset', {
    method: 'POST'
  });
}

export function updateAdminMemberName(username: string, fullName: string): Promise<GatedActionResponse> {
  return fetchJson(`/api/admin/members/${encodeURIComponent(username)}/change-name`, {
    method: 'POST',
    body: JSON.stringify({ fullName })
  });
}

export function updateAdminMemberProfile(
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
): Promise<GatedActionResponse> {
  return fetchJson(`/api/admin/members/${encodeURIComponent(username)}/profile`, {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export function updateAdminMemberStatus(
  username: string,
  status: 'active' | 'pending' | 'frozen' | 'suspended'
): Promise<GatedActionResponse> {
  return fetchJson(`/api/admin/members/${encodeURIComponent(username)}/status`, {
    method: 'POST',
    body: JSON.stringify({ status })
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
  origin: 'referral-link' | 'genealogy-slot';
  fullName: string;
  username: string;
  email?: string;
  phone: string;
  password: string;
  activationCode: string;
  referralCode?: string;
  sponsorReferralCode?: string;
  placementContext?: {
    parentUsername: string;
    side: 'left' | 'right';
  };
  placementToken?: string;
  placementReservationId?: string;
  payoutOption?: string;
  payoutDetails?: string;
}): Promise<RegistrationPreview> {
  return fetchJson('/api/registration/preview', {
    method: 'POST',
    body: JSON.stringify({
      ...payload,
      placementParentUsername: payload.placementContext?.parentUsername,
      placementSide: payload.placementContext?.side
    })
  });
}

export function submitRegistration(payload: {
  origin: 'referral-link' | 'genealogy-slot';
  fullName: string;
  username: string;
  email?: string;
  phone: string;
  password: string;
  activationCode: string;
  referralCode?: string;
  sponsorReferralCode?: string;
  placementContext?: {
    parentUsername: string;
    side: 'left' | 'right';
  };
  placementToken?: string;
  placementReservationId?: string;
  payoutOption?: string;
  payoutDetails?: string;
}): Promise<RegistrationSubmitResponse> {
  return fetchJson('/api/registration/submit', {
    method: 'POST',
    body: JSON.stringify({
      ...payload,
      placementParentUsername: payload.placementContext?.parentUsername,
      placementSide: payload.placementContext?.side
    })
  });
}
