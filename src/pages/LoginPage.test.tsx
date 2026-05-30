import { describe, expect, it } from 'vitest';
import { getDefaultDashboardPath, getPostLoginPath } from './LoginPage';

describe('getDefaultDashboardPath', () => {
  it.each([
    ['member', '/member'],
    ['admin', '/admin'],
    ['cashier', '/cashier'],
    ['bod', '/bod'],
    ['superadmin', '/admin']
  ] as const)('routes %s users to %s after login', (role, path) => {
    expect(getDefaultDashboardPath(role)).toBe(path);
  });
});

describe('getPostLoginPath', () => {
  it('keeps member users out of stale admin redirects', () => {
    expect(getPostLoginPath('member', '/admin/encashment-reports')).toBe('/member');
  });

  it('keeps admin-side users out of stale member redirects', () => {
    expect(getPostLoginPath('superadmin', '/member/binary-genealogy')).toBe('/admin');
  });

  it('keeps cashier users inside cashier routes when admin pages are requested', () => {
    expect(getPostLoginPath('cashier', '/admin/encashment-reports')).toBe('/cashier');
  });

  it('keeps bod users inside board routes when cashier pages are requested', () => {
    expect(getPostLoginPath('bod', '/cashier/activation-codes')).toBe('/bod');
  });

  it('preserves a valid same-side redirect', () => {
    expect(getPostLoginPath('member', '/member/wallet')).toBe('/member/wallet');
  });
});
