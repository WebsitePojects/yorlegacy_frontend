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
  LeaderboardData,
  MemberActivationCodeCenter,
  MemberGetYorFiveData,
  MemberRankData,
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

// Same base as fetchJson — used for the live-updates EventSource.
export function apiUrl(path: string): string {
  return `${API_BASE_URL}${path}`;
}

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

function isTechnicalErrorMessage(message: string): boolean {
  return [
    /\/api\//i,
    /supabase/i,
    /postgres|postgrest|sql/i,
    /constraint|violates|duplicate key/i,
    /json|syntaxerror|typeerror/i,
    /undefined|null/i,
    /failed to fetch|networkerror/i,
    /request failed/i,
    /stack trace/i
  ].some((pattern) => pattern.test(message));
}

function friendlyApiErrorMessage(status: number, path: string, rawMessage: string): string {
  const trimmed = rawMessage.trim();

  if (trimmed && !isTechnicalErrorMessage(trimmed)) {
    return trimmed;
  }

  if (status === 401) {
    return 'Please sign in again to continue.';
  }

  if (status === 403) {
    return 'This account does not have permission to do that.';
  }

  if (status === 404) {
    return path.includes('/members/')
      ? 'We could not find that member. Please check the username and try again.'
      : 'We could not find the record you are looking for.';
  }

  if (status === 409) {
    return 'That change conflicts with an existing record. Please review the details and try again.';
  }

  if (status === 423) {
    return 'This action is not available for this account right now.';
  }

  if (status >= 500) {
    return 'Something went wrong while saving. Please try again in a moment.';
  }

  return 'The request could not be completed. Please check the details and try again.';
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

    const rawMsg = payload?.message ?? payload?.reason ?? payload?.detail ?? payload?.error ?? `Request failed for ${path}`;
    const rawMessage = typeof rawMsg === 'string' ? rawMsg : JSON.stringify(rawMsg);
    throw new Error(friendlyApiErrorMessage(response.status, path, rawMessage));
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

export function upgradeMemberActivationCode(payload: { code: string; shadowCode?: string }): Promise<GatedActionResponse> {
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

export function fetchMemberGetYorFive(): Promise<MemberGetYorFiveData> {
  return fetchJson('/api/member/get-yor-five', { method: 'GET' });
}

export function fetchMemberRank(): Promise<MemberRankData> {
  return fetchJson('/api/member/rank', { method: 'GET' });
}

export function fetchLeaderboard(): Promise<LeaderboardData> {
  return fetchJson('/api/member/leaderboard', { method: 'GET' });
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

export function updateMemberCredentials(payload: {
  username?: string;
  email?: string;
  password?: string;
}): Promise<GatedActionResponse> {
  return fetchJson('/api/member/profile/credentials', {
    method: 'POST',
    body: JSON.stringify(payload)
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

export function fetchMemberBinaryTree(rootUsername?: string, depth?: number): Promise<GenealogyCenter> {
  const params = new URLSearchParams();
  if (rootUsername) params.set('rootUsername', rootUsername);
  if (depth && Number.isFinite(depth)) params.set('depth', String(depth));
  const suffix = params.toString() ? `?${params.toString()}` : '';
  return fetchJson(`/api/member/genealogy/binary-tree${suffix}`, { method: 'GET' });
}

export function fetchMemberDirectReferrals(): Promise<{ rows: Array<{ username: string; name: string; package: string; status: string; placement: string }> }> {
  return fetchJson('/api/member/direct-referrals', { method: 'GET' });
}

export function fetchMemberPairingEvents(): Promise<{
  events: Array<{
    occurredAt: string; source: string; leftVolume: number; rightVolume: number;
    matchedPoints: number; leftRemaining: number; rightRemaining: number; salesmatchAmount: number;
  }>;
}> {
  return fetchJson('/api/member/salesmatch/pairing-events', { method: 'GET' });
}

export function triggerMemberCompensation(): Promise<{ credited: number; processed: number }> {
  return fetchJson('/api/member/trigger-compensation', { method: 'POST' });
}

export function fetchMemberShadowAccounts(ownerUsername?: string): Promise<ShadowAccountCenter> {
  const suffix = ownerUsername ? `?ownerUsername=${encodeURIComponent(ownerUsername)}` : '';
  return fetchJson(`/api/member/shadow-accounts${suffix}`, { method: 'GET' });
}

export function fetchAdminShadowAccounts(ownerUsername: string): Promise<ShadowAccountCenter> {
  const suffix = `?ownerUsername=${encodeURIComponent(ownerUsername)}`;
  return fetchJson(`/api/admin/shadow-accounts${suffix}`, { method: 'GET' });
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
  remarks?: string,
  assignedToUserId?: string
): Promise<GatedActionResponse> {
  return fetchJson('/api/admin/activation-codes/generate', {
    method: 'POST',
    body: JSON.stringify({ quantity, packageTier, codeFamily, assignedTo, accountType, remarks, assignedToUserId })
  });
}

export function fetchAdminCashiers(): Promise<Array<{ id: string; displayName: string; email: string }>> {
  return fetchJson('/api/admin/cashiers');
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

// GATE-VOUCHER-B1T1-20260615: admin Buy-1-Take-1 voucher inventory.
export type VoucherStatus = 'available' | 'used' | 'suspended' | 'expired';
export type VoucherRecord = {
  id: string;
  voucherCode: string;
  beneficiaryUsername: string;
  beneficiaryFullName: string | null;
  packageTier: string;
  quantity: number;
  remaining: number;
  status: VoucherStatus;
  grantedByLabel: string | null;
  remarks: string | null;
  issuedAt: string;
  expiresAt: string | null;
};
export type VoucherCenter = {
  stats: { total: number; active: number; expired: number; suspended: number; fullyUsed: number };
  vouchers: VoucherRecord[];
};

export function fetchAdminVouchers(): Promise<VoucherCenter> {
  return fetchJson('/api/admin/vouchers', { method: 'GET' });
}

// News / Announcements (admin-authored, public bulletin).
export type NewsCategory = 'announcement' | 'news' | 'promo' | 'memo';
export type NewsStatus = 'draft' | 'published' | 'archived';
export type NewsAttachmentKind = 'image' | 'video' | 'document';
export type NewsAttachment = {
  name: string;
  mimeType: string;
  sizeBytes: number;
  dataUrl: string;
  kind: NewsAttachmentKind;
};
export type NewsPost = {
  id: string;
  title: string;
  body: string;
  category: NewsCategory;
  status: NewsStatus;
  pinned: boolean;
  attachments: NewsAttachment[];
  createdByLabel: string | null;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export function fetchAdminNewsPosts(): Promise<{ posts: NewsPost[] }> {
  return fetchJson('/api/admin/news-posts', { method: 'GET' });
}
export function createAdminNewsPost(payload: { title: string; body: string; category: NewsCategory; status: NewsStatus; pinned?: boolean; attachments?: NewsAttachment[] }): Promise<{ post: NewsPost }> {
  return fetchJson('/api/admin/news-posts', { method: 'POST', body: JSON.stringify(payload) });
}
export function updateAdminNewsPost(id: string, patch: Partial<{ title: string; body: string; category: NewsCategory; status: NewsStatus; pinned: boolean; attachments: NewsAttachment[] }>): Promise<{ post: NewsPost }> {
  return fetchJson(`/api/admin/news-posts/${encodeURIComponent(id)}`, { method: 'PATCH', body: JSON.stringify(patch) });
}
export function deleteAdminNewsPost(id: string): Promise<{ ok: boolean }> {
  return fetchJson(`/api/admin/news-posts/${encodeURIComponent(id)}`, { method: 'DELETE' });
}

// Public (no auth)
export function fetchPublicAnnouncements(): Promise<{ posts: NewsPost[] }> {
  return fetchJson('/api/public/announcements', { method: 'GET' });
}
export function submitPublicContact(payload: { name: string; email: string; subject: string; message: string }): Promise<{ status: string; id: string }> {
  return fetchJson('/api/public/contact', { method: 'POST', body: JSON.stringify(payload) });
}

// Shadow-account overview (admin monitoring).
export type ShadowOverviewRow = {
  id: string;
  shadowCode: string;
  ownerUsername: string;
  ownerFullName: string;
  placement: 'left' | 'right';
  state: string;
  accountType: string | null;
  leftVolume: number;
  rightVolume: number;
  matchedPoints: number;
  unmatchedSurplus: number;
  totalEarned: number;
};
export type ShadowOverview = {
  stats: {
    totalShadows: number;
    activated: number;
    reserved: number;
    earning: number;
    totalMatchedPoints: number;
    totalTransferred: number;
  } | null;
  shadows: ShadowOverviewRow[];
};

export function fetchAdminShadowOverview(): Promise<ShadowOverview> {
  return fetchJson('/api/admin/shadow-overview', { method: 'GET' });
}

// CD (Credit-Deduction) account center.
export type CdAccountRow = {
  userId: string;
  username: string;
  fullName: string;
  packageTier: string;
  cdAmount: number;
  cdPaid: number;
  cdRemaining: number;
  status: 'fully-paid' | 'paying';
  cdDeductions: number;
  netEncashment: number;
};
export type CdAccountCenter = {
  stats: {
    totalAccounts: number;
    fullyPaid: number;
    paying: number;
    totalCdAmount: number;
    totalPaid: number;
    totalRemaining: number;
    cdDeductions: number;
    netEncashment: number;
  } | null;
  packageBreakdown: Array<{
    package: string;
    accounts: number;
    fullyPaid: number;
    paying: number;
    cdAmount: number;
    paid: number;
    remaining: number;
    netEncashment: number;
  }>;
  accounts: CdAccountRow[];
};

export function fetchAdminCdAccounts(): Promise<CdAccountCenter> {
  return fetchJson('/api/admin/cd-accounts', { method: 'GET' });
}

export type CodeEventPage = {
  events: Array<{ actor: string; action: string; target: string; occurredAt: string }>;
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export function fetchAdminCodeEvents(page: number, pageSize = 50): Promise<CodeEventPage> {
  return fetchJson(`/api/admin/activation-code-events?page=${page}&pageSize=${pageSize}`, { method: 'GET' });
}

// GATE-ADMIN-PWD-20260615: staff-account directory + privileged password reset.
export type StaffAccount = { id: string; email: string; displayName: string; role: AppRole };

export function fetchAdminStaffAccounts(): Promise<{ accounts: StaffAccount[] }> {
  return fetchJson('/api/admin/staff-accounts', { method: 'GET' });
}

export function changeStaffPassword(id: string, newPassword: string): Promise<{ ok: boolean }> {
  return fetchJson(`/api/admin/staff-accounts/${encodeURIComponent(id)}/password`, {
    method: 'POST',
    body: JSON.stringify({ newPassword })
  });
}

export function grantAdminVoucher(payload: {
  beneficiaryUsername: string;
  packageTier: string;
  quantity: number;
  expiresAt?: string | null;
  remarks?: string | null;
}): Promise<{ voucher: VoucherRecord }> {
  return fetchJson('/api/admin/vouchers/grant', { method: 'POST', body: JSON.stringify(payload) });
}

export function suspendAdminVoucher(id: string): Promise<{ voucher: VoucherRecord }> {
  return fetchJson(`/api/admin/vouchers/${encodeURIComponent(id)}/suspend`, { method: 'POST' });
}

export function reactivateAdminVoucher(id: string): Promise<{ voucher: VoucherRecord }> {
  return fetchJson(`/api/admin/vouchers/${encodeURIComponent(id)}/reactivate`, { method: 'POST' });
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
    email?: string;
    newUsername?: string;
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

export function fetchAdminSponsorTree(rootUsername?: string): Promise<SponsorTreeCenter> {
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

export type SupportMessageCategory = 'general' | 'account' | 'technical' | 'encashment';
export type SupportMessageStatus = 'unread' | 'read' | 'done' | 'blocked';

export type ContactMessage = {
  id: string;
  username: string;
  displayName: string;
  email: string;
  category: SupportMessageCategory;
  subject: string;
  message: string;
  status: SupportMessageStatus;
  createdAt: string;
};

export function submitSupportMessage(payload: {
  category: SupportMessageCategory;
  subject: string;
  message: string;
}): Promise<{ status: string; id: string }> {
  return fetchJson('/api/member/support/message', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export function fetchAdminContactMessages(): Promise<{ messages: ContactMessage[] }> {
  return fetchJson('/api/admin/contact-messages', { method: 'GET' });
}

export function updateAdminContactMessageStatus(
  id: string,
  status: SupportMessageStatus
): Promise<{ status: string }> {
  return fetchJson(`/api/admin/contact-messages/${encodeURIComponent(id)}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status })
  });
}

// ── Unilevel ──────────────────────────────────────────────────────────────────

export type SponsorTreeApiNode = {
  nodeId: string;
  username: string;
  fullName: string;
  packageTier: string;
  accountStateLabel: 'PD' | 'FS' | 'CD - Paid' | 'CD - Unpaid';
  status: 'active' | 'pending' | 'disabled';
  depth: number;
  directReferrals: number;
  children: SponsorTreeApiNode[];
};

export type SponsorTreeCenter = {
  moneyMode: string;
  treeType: 'sponsor';
  root: SponsorTreeApiNode;
};

export type UnilevelData = {
  moneyMode: string;
  levelPercentages: number[];
  totalEarned: number;
  byLevel: Array<{ level: number; percent: number; amount: number; count: number }>;
  entries: Array<{ id: string; level: number; sourceReference: string; creditAmount: number; occurredAt: string; status: string }>;
};

export function fetchMemberSponsorTree(rootUsername?: string): Promise<SponsorTreeCenter> {
  const suffix = rootUsername ? `?rootUsername=${encodeURIComponent(rootUsername)}` : '';
  return fetchJson(`/api/member/genealogy/sponsor-tree${suffix}`, { method: 'GET' });
}

export function fetchMemberUnilevelData(): Promise<UnilevelData> {
  return fetchJson('/api/member/unilevel', { method: 'GET' });
}

export function fetchAdminMemberUnilevelData(username: string): Promise<UnilevelData> {
  return fetchJson(`/api/admin/unilevel?username=${encodeURIComponent(username)}`, { method: 'GET' });
}

// ── Global Bonus ───────────────────────────────────────────────────────────────

export type StockistLevel = 'none' | 'mobile_kiosk' | 'city_center' | 'mega_center';

export type GlobalBonusEntry = {
  userId: string;
  username: string;
  fullName: string;
  packageTier: string;
  stockistLevel: StockistLevel;
  stockistLabel: string;
  portions: number;
};

export type GlobalBonusData = {
  moneyMode: string;
  entries: GlobalBonusEntry[];
  totalPortions: number;
  notes: string[];
};

export function fetchAdminGlobalBonus(): Promise<GlobalBonusData> {
  return fetchJson('/api/admin/global-bonus', { method: 'GET' });
}

export function tagStockistLevel(username: string, level: StockistLevel): Promise<{ username: string; stockistLevel: StockistLevel }> {
  return fetchJson('/api/admin/global-bonus/tag-stockist', {
    method: 'POST',
    body: JSON.stringify({ username, level })
  });
}
