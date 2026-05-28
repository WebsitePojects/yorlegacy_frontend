import { fallbackContent } from '../data/fallbackContent';
import type {
  AdminOfficeData,
  AuthState,
  DashboardSummary,
  MemberOfficeData
} from '../types/auth';
import type { PageContent } from '../types/content';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://127.0.0.1:8787';

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
      | { message?: string }
      | null;
    throw new Error(payload?.message ?? `Request failed for ${path}`);
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
  Record<'member' | 'admin', { email: string; password: string }>
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
