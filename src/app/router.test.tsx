import { render, screen } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { vi } from 'vitest';
import { AuthProvider } from '../auth/AuthContext';
import { ThemeProvider } from '../components/theme-provider';
import { routes } from './router';

describe('routes', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('renders the founder-led home route with a Home tab', async () => {
    vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);

      if (url.includes('/api/auth/me')) {
        return {
          ok: true,
          json: async () => ({
            authenticated: false,
            user: null
          })
        };
      }

      throw new Error('offline test');
    }) as unknown as typeof fetch);

    const router = createMemoryRouter(routes, {
      initialEntries: ['/']
    });

    render(
      <ThemeProvider defaultTheme="dark">
        <AuthProvider>
          <RouterProvider router={router} />
        </AuthProvider>
      </ThemeProvider>
    );

    expect(await screen.findByRole('link', { name: /home/i })).toBeInTheDocument();
    expect(
      await screen.findByRole('heading', { name: /mr\. yoren b\. abihay/i })
    ).toBeInTheDocument();
  });

  it('renders the earn overview route', async () => {
    vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);

      if (url.includes('/api/auth/me')) {
        return {
          ok: true,
          json: async () => ({
            authenticated: false,
            user: null
          })
        };
      }

      throw new Error('offline test');
    }) as unknown as typeof fetch);

    const router = createMemoryRouter(routes, {
      initialEntries: ['/earn']
    });

    render(
      <ThemeProvider defaultTheme="dark">
        <AuthProvider>
          <RouterProvider router={router} />
        </AuthProvider>
      </ThemeProvider>
    );

    expect(
      await screen.findByRole('heading', { name: /8 ways to earn overview/i })
    ).toBeInTheDocument();
  });

  it('renders an admin operational module route from authenticated API data', async () => {
    vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);

      if (url.includes('/api/auth/me')) {
        return okJson({
          authenticated: true,
          user: {
            id: 'yor-superadmin-demo',
            name: 'Yor Super Admin',
            email: 'yoradmin@gmail.com',
            role: 'superadmin'
          }
        });
      }

      if (url.includes('/api/admin/summary')) {
        return okJson({
          user: {
            id: 'yor-superadmin-demo',
            name: 'Yor Super Admin',
            email: 'yoradmin@gmail.com',
            role: 'superadmin'
          },
          modules: ['Encashment Reports'],
          status: {
            authentication: 'active',
            moneyActions: 'branch sandbox writes enabled'
          }
        });
      }

      if (url.includes('/api/admin/office')) {
        return okJson({
          user: {
            id: 'yor-superadmin-demo',
            name: 'Yor Super Admin',
            email: 'yoradmin@gmail.com',
            role: 'superadmin'
          },
          profile: {
            accessScope: 'superadmin',
            officeTitle: 'Super Admin'
          },
          metrics: [
            { label: 'Total Accounts', value: '5' },
            { label: 'Money Writes', value: 'sandbox', tone: 'good' }
          ],
          modules: [adminModuleFixture],
          queues: [{ label: 'Encashment review', count: 1, status: 'attention' }],
          auditEvents: [
            {
              actor: 'System',
              action: 'sandbox_runtime_enabled',
              target: 'encashment',
              occurredAt: '2026-05-28T09:45:00Z'
            }
          ],
          gatedActions: [],
          notices: ['Branch-local sandbox runtime']
        });
      }

      if (url.includes('/api/admin/dashboard')) {
        return okJson({
          moneyMode: 'sandbox',
          queues: [{ label: 'Rule confirmations pending', count: 8, status: 'attention' }],
          modules: ['package-rule-matrix', 'wallet-ledger']
        });
      }

      if (url.includes('/api/admin/modules/encashment-reports')) {
        return okJson(adminModuleFixture);
      }

      if (url.includes('/api/admin/encashments')) {
        return okJson({
          moneyMode: 'sandbox',
          encashments: [
            {
              id: 'ENC-20260524-001',
              queueOrder: 1,
              member: 'YOR0001',
              gross: 'PHP 8,000.00',
              fee: 'PHP 100.00',
              cdDeduction: 'PHP 0.00',
              net: 'PHP 7,900.00',
              method: 'GCash',
              status: 'for verification'
            }
          ],
          totals: {
            gross: 8000,
            net: 7900,
            awaitingReview: 1
          },
          processNotes: ['Queue follows Tuesday encashment / Friday release language.']
        });
      }

      throw new Error(`Unexpected request ${url}`);
    }) as unknown as typeof fetch);

    const router = createMemoryRouter(routes, {
      initialEntries: ['/admin/encashment-reports']
    });

    render(
      <ThemeProvider defaultTheme="dark">
        <AuthProvider>
          <RouterProvider router={router} />
        </AuthProvider>
      </ThemeProvider>
    );

    expect(
      await screen.findByRole('heading', { name: /encashment reports/i })
    ).toBeInTheDocument();
    expect(await screen.findByRole('button', { name: /^approve$/i })).toBeInTheDocument();
    expect(await screen.findByText(/process notes/i)).toBeInTheDocument();
    expect(await screen.findByRole('heading', { name: /encashment queue/i })).toBeInTheDocument();
  });

  it('renders a member side-page module from authenticated API data', async () => {
    vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);

      if (url.includes('/api/auth/me')) {
        return okJson({
          authenticated: true,
          user: {
            id: 'yor-member-demo',
            name: 'Yor Member',
            email: 'member@yor.local',
            role: 'member'
          }
        });
      }

      if (url.includes('/api/member/summary')) {
        return okJson({
          user: {
            id: 'yor-member-demo',
            name: 'Yor Member',
            email: 'member@yor.local',
            role: 'member'
          },
          modules: ['E-Wallet'],
          status: {
            authentication: 'active',
            payouts: 'branch sandbox writes'
          }
        });
      }

      if (url.includes('/api/member/office')) {
        return okJson({
          user: {
            id: 'yor-member-demo',
            name: 'Yor Member',
            email: 'member@yor.local',
            role: 'member'
          },
          profile: {
            packageTier: 'Standard',
            referralCode: 'YOR-MEMBER-001',
            sponsorCode: 'YOR-SPONSOR-001',
            accountStatus: 'active',
            username: 'YOR0001',
            fullName: 'Yor Member',
            payoutMethod: 'GCash'
          },
          wallet: {
            availableBalance: 'PHP 15,200.75',
            pendingBalance: 'PHP 4,300.00',
            payoutSchedule: 'Tuesday encashment / Friday payout'
          },
          metrics: [{ label: 'Direct Referrals', value: '5' }],
          modules: [memberModuleFixture],
          gatedActions: [],
          alerts: ['Wallet reports are visible for verification.']
        });
      }

      if (url.includes('/api/member/dashboard')) {
        return okJson({
          moneyMode: 'sandbox',
          packageTier: 'Standard',
          payoutSchedule: 'Tuesday encashment / Friday payout',
          incomeStreams: [
            {
              streamId: 'salesmatch',
              label: 'Salesmatch Bonus',
              writeStatus: 'sandbox',
              simulatedGross: 15000,
              simulatedNet: 15000,
              statusLabel: 'Matched binary volume preview'
            }
          ],
          notices: ['Income simulations stay visible while operational sandbox writes persist in this branch.']
        });
      }

      if (url.includes('/api/member/modules/wallet')) {
        return okJson(memberModuleFixture);
      }

      if (url.includes('/api/member/wallet-detail')) {
        return okJson({
          moneyMode: 'sandbox',
          summary: {
            availableBalance: 15200.75,
            pendingBalance: 4300,
            cdBalance: 0,
            payoutMethod: 'GCash',
            payoutSchedule: 'Tuesday encashment / Friday payout'
          },
          preview: {
            requestedAmount: 5000,
            fee: 100,
            cdDeduction: 0,
            netReceivable: 4900,
            sufficientBalance: true,
            note: 'Preview mirrors the protected encashment breakdown.'
          },
          ledger: [
            {
              id: 'WL-001',
              walletType: 'main',
              entryType: 'direct_referral',
              sourceReference: 'YOR-ALYSSA',
              creditAmount: 5000,
              debitAmount: 0,
              balanceAfter: 15200.75,
              status: 'simulated-posted',
              processId: 'mvp-wl-001'
            }
          ],
          transactions: [
            {
              id: 'WALLET-001',
              date: '2026-05-28',
              category: 'direct_referral',
              source: 'YOR-ALYSSA',
              gross: 'PHP 5,000.00',
              net: 'PHP 15,200.75',
              status: 'posted',
              type: 'wallet'
            }
          ]
        });
      }

      throw new Error(`Unexpected request ${url}`);
    }) as unknown as typeof fetch);

    const router = createMemoryRouter(routes, {
      initialEntries: ['/member/wallet']
    });

    render(
      <ThemeProvider defaultTheme="dark">
        <AuthProvider>
          <RouterProvider router={router} />
        </AuthProvider>
      </ThemeProvider>
    );

    expect(await screen.findByRole('heading', { name: /e-wallet/i })).toBeInTheDocument();
    expect(await screen.findByRole('heading', { name: /wallet ledger/i })).toBeInTheDocument();
    expect(await screen.findByText(/submit request/i)).toBeInTheDocument();
    expect((await screen.findAllByText(/PHP 15,200.75/i)).length).toBeGreaterThan(0);
    expect(await screen.findByRole('heading', { name: /wallet summary/i })).toBeInTheDocument();
  });
});

function okJson(payload: unknown) {
  return Promise.resolve({
    ok: true,
    json: async () => payload
  });
}

const adminModuleFixture = {
  id: 'encashment-reports',
  label: 'Encashment Reports',
  path: '/admin/encashment-reports',
  group: 'Finance',
  description: 'Tuesday encashment / Friday payout report.',
  status: 'sandbox-write',
  legacyReference: 'adminpanel/accounts-encashment.php',
  permissions: ['admin', 'cashier', 'superadmin'],
  metrics: [{ label: 'Encashment Requests', value: '2' }],
  table: {
    title: 'Encashments',
    columns: [
      { key: 'reference', label: 'Reference' },
      { key: 'net', label: 'Net' }
    ],
    rows: [{ reference: 'ENC-20260524-001', net: 'PHP 7,900.00' }]
  },
  gatedActions: []
};

const memberModuleFixture = {
  id: 'wallet',
  label: 'E-Wallet',
  path: '/member/wallet',
  group: 'Finance',
  description: 'Wallet ledger with credits and deductions.',
  status: 'read-only',
  legacyReference: 'ecom/ewallet.php',
  permissions: ['member', 'admin', 'cashier', 'bod', 'superadmin'],
  metrics: [{ label: 'Available', value: 'PHP 15,200.75' }],
  table: {
    title: 'Wallet ledger',
    columns: [
      { key: 'date', label: 'Date' },
      { key: 'balance', label: 'Balance' }
    ],
    rows: [{ date: '2026-05-28', balance: 'PHP 15,200.75' }]
  },
  gatedActions: []
};
