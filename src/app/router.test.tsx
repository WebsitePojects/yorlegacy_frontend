import { fireEvent, render, screen, waitFor } from '@testing-library/react';
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

    expect(await screen.findByText(/initializing experience/i)).toBeInTheDocument();
    expect((await screen.findAllByRole('link', { name: /portal login/i })).length).toBeGreaterThan(0);
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
    expect(await screen.findByRole('button', { name: /mark paid/i })).toBeInTheDocument();
    expect(await screen.findByText(/selected request/i)).toBeInTheDocument();
    expect(await screen.findByRole('heading', { name: /encashment queue/i })).toBeInTheDocument();
  });

  it('renders a member side-page module from authenticated API data', async () => {
    const previewRequests: number[] = [];
    vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
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
          incomeBreakdown: [
            { streamId: 'direct-referral', label: 'Direct Referral', walletType: 'main', amount: 5000 },
            { streamId: 'salesmatch', label: 'Salesmatch Bonus', walletType: 'main', amount: 7500 },
            { streamId: 'binary-cycle', label: 'Binary Cycle Bonus', walletType: 'main', amount: 0 },
            { streamId: 'get-five', label: 'Get Yor Five Bonus', walletType: 'main', amount: 0 },
            { streamId: 'lifestyle-rewards', label: 'Lifestyle Rewards', walletType: 'lifestyle', amount: 0 },
            { streamId: 'unilevel', label: 'Unilevel Bonus', walletType: 'main', amount: 0 },
            { streamId: 'global', label: 'Global Bonus', walletType: 'main', amount: 0 }
          ],
          preview: {
            requestedAmount: 0,
            fee: 0,
            processingFee: 0,
            maintenanceFee: 0,
            systemRetainer: 0,
            tax: 0,
            cdDeduction: 0,
            totalDeductions: 0,
            netReceivable: 0,
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

      if (url.includes('/api/member/wallet/preview-encash')) {
        const payload = init?.body ? JSON.parse(String(init.body)) as { amount?: number } : {};
        const requestedAmount = Number(payload.amount ?? 0);
        const processingFee = 50;
        const systemRetainer = requestedAmount * 0.05;
        const fee = processingFee + systemRetainer;
        const tax = requestedAmount * 0.1;
        const totalDeductions = fee + tax;

        previewRequests.push(requestedAmount);

        return okJson({
          moneyMode: 'sandbox',
          requestedAmount,
          preview: {
            requestedAmount,
            fee,
            processingFee,
            maintenanceFee: 0,
            systemRetainer,
            tax,
            cdDeduction: 0,
            totalDeductions,
            netReceivable: requestedAmount - totalDeductions,
            sufficientBalance: true,
            note: 'Preview mirrors the protected encashment breakdown.'
          }
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
    expect((screen.getByLabelText(/requested amount/i) as HTMLInputElement).value).toBe('0');
    expect(screen.queryByText(/System Maintenance Fee/i)).not.toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/requested amount/i), {
      target: { value: '10,000' }
    });

    await waitFor(() => {
      expect(screen.getByText(/PHP 8,450.00/i)).toBeInTheDocument();
    });
    expect(previewRequests).toContain(10000);
  });

  it('opens genealogy-slot registration inside a modal instead of leaving the tree', async () => {
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
          modules: ['Genealogy'],
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
          modules: [memberGenealogyModuleFixture],
          gatedActions: [],
          alerts: ['Tree stays available for placement review.']
        });
      }

      if (url.includes('/api/member/dashboard')) {
        return okJson({
          moneyMode: 'sandbox',
          packageTier: 'Standard',
          payoutSchedule: 'Tuesday encashment / Friday payout',
          incomeStreams: [],
          notices: []
        });
      }

      if (url.includes('/api/member/modules/genealogy')) {
        return okJson(memberGenealogyModuleFixture);
      }

      if (url.includes('/api/member/genealogy/binary-tree')) {
        return okJson(memberGenealogyFixture);
      }

      if (url.includes('/api/member/activation-codes')) {
        return okJson({
          moneyMode: 'sandbox',
          member: {
            username: 'YOR0001',
            packageTier: 'Standard'
          },
          inventory: [
            {
              id: 'code-1',
              code: 'PDSTK7V2LC',
              codeFamily: 'YOR CODES',
              accountType: 'PD',
              packageTier: 'Standard',
              assignedTo: 'YOR0001',
              status: 'available',
              generatedAt: '2026-05-28',
              transferable: true,
              upgradable: false,
              visibility: 'released-by-sponsor'
            }
          ],
          history: [],
          transferTargets: [],
          hints: []
        });
      }

      throw new Error(`Unexpected request ${url}`);
    }) as unknown as typeof fetch);

    const router = createMemoryRouter(routes, {
      initialEntries: ['/member/genealogy']
    });

    render(
      <ThemeProvider defaultTheme="dark">
        <AuthProvider>
          <RouterProvider router={router} />
        </AuthProvider>
      </ThemeProvider>
    );

    expect(await screen.findByRole('heading', { name: /placement network view/i })).toBeInTheDocument();

    fireEvent.click(await screen.findByRole('button', { name: /open slot left under alpha001/i }));

    expect(await screen.findByRole('dialog')).toBeInTheDocument();
    expect(await screen.findByRole('heading', { name: /encode member in open slot/i })).toBeInTheDocument();
    expect(await screen.findByLabelText(/activation code/i)).toBeInTheDocument();
    expect(screen.getByText(/ALPHA001 \/ Left/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /discard registration/i }));

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
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

const memberGenealogyModuleFixture = {
  id: 'genealogy',
  label: 'Genealogy',
  path: '/member/genealogy',
  group: 'Network',
  description: 'Placement tree and binary network visibility.',
  status: 'read-only',
  legacyReference: 'ecom/genealogy.php',
  permissions: ['member', 'admin', 'cashier', 'bod', 'superadmin'],
  metrics: [{ label: 'Visible Nodes', value: '5' }],
  table: {
    title: 'Genealogy',
    columns: [],
    rows: []
  },
  gatedActions: []
};

const memberGenealogyFixture = {
  moneyMode: 'sandbox',
  treeType: 'binary',
  root: {
    nodeId: 'node-root',
    username: 'YOU1',
    fullName: 'Root Member',
    referralCode: 'YOR-MEMBER-001',
    packageTier: 'VIP',
    placement: 'root',
    status: 'active',
    depth: 0,
    tracePath: 'YOU1',
    binaryPoints: 0,
    directReferrals: 2,
    leftPoints: 100,
    rightPoints: 80,
    openSlots: { left: false, right: false },
    shadowSlots: {
      left: {
        id: 'shadow-left',
        owner: 'YOU1',
        placement: 'left',
        state: 'reserved_shadow',
        label: 'YOU 2',
        activationStatus: 'inactive',
        registrationEnabled: false,
        walletEnabled: false,
        unilevelEnabled: false,
        binaryCycleEnabled: false,
        note: 'Binary Function Only'
      },
      right: {
        id: 'shadow-right',
        owner: 'YOU1',
        placement: 'right',
        state: 'reserved_shadow',
        label: 'YOU 3',
        activationStatus: 'inactive',
        registrationEnabled: false,
        walletEnabled: false,
        unilevelEnabled: false,
        binaryCycleEnabled: false,
        note: 'Binary Function Only'
      }
    },
    accountStateLabel: 'PD',
    children: [
      {
        nodeId: 'node-shadow-left',
        username: 'YOU2',
        fullName: 'Left Shadow',
        referralCode: 'YOR-MEMBER-001',
        packageTier: 'VIP',
        placement: 'left',
        status: 'shadow',
        depth: 1,
        tracePath: 'YOU1>YOU2',
        binaryPoints: 0,
        directReferrals: 0,
        leftPoints: 100,
        rightPoints: 0,
        openSlots: { left: true, right: true },
        shadowSlots: {
          left: {
            id: 'shadow-left-2',
            owner: 'YOU2',
            placement: 'left',
            state: 'reserved_shadow',
            label: 'YOU 2L',
            activationStatus: 'inactive',
            registrationEnabled: false,
            walletEnabled: false,
            unilevelEnabled: false,
            binaryCycleEnabled: false,
            note: 'Binary Function Only'
          },
          right: {
            id: 'shadow-left-3',
            owner: 'YOU2',
            placement: 'right',
            state: 'reserved_shadow',
            label: 'YOU 2R',
            activationStatus: 'inactive',
            registrationEnabled: false,
            walletEnabled: false,
            unilevelEnabled: false,
            binaryCycleEnabled: false,
            note: 'Binary Function Only'
          }
        },
        accountStateLabel: 'PD',
        children: [
          {
            nodeId: 'node-alpha',
            username: 'ALPHA001',
            fullName: 'Alice Alpha',
            referralCode: 'YOR-ALPHA-001',
            packageTier: 'Standard',
            placement: 'left',
            status: 'active',
            depth: 2,
            tracePath: 'YOU1>YOU2>ALPHA001',
            binaryPoints: 0,
            directReferrals: 0,
            leftPoints: 0,
            rightPoints: 0,
            openSlots: { left: true, right: true },
            shadowSlots: {
              left: {
                id: 'shadow-alpha-left',
                owner: 'ALPHA001',
                placement: 'left',
                state: 'reserved_shadow',
                label: 'ALPHA L',
                activationStatus: 'inactive',
                registrationEnabled: false,
                walletEnabled: false,
                unilevelEnabled: false,
                binaryCycleEnabled: false,
                note: 'Binary Function Only'
              },
              right: {
                id: 'shadow-alpha-right',
                owner: 'ALPHA001',
                placement: 'right',
                state: 'reserved_shadow',
                label: 'ALPHA R',
                activationStatus: 'inactive',
                registrationEnabled: false,
                walletEnabled: false,
                unilevelEnabled: false,
                binaryCycleEnabled: false,
                note: 'Binary Function Only'
              }
            },
            accountStateLabel: 'PD',
            children: []
          }
        ]
      },
      {
        nodeId: 'node-shadow-right',
        username: 'YOU3',
        fullName: 'Right Shadow',
        referralCode: 'YOR-MEMBER-001',
        packageTier: 'VIP',
        placement: 'right',
        status: 'shadow',
        depth: 1,
        tracePath: 'YOU1>YOU3',
        binaryPoints: 0,
        directReferrals: 0,
        leftPoints: 0,
        rightPoints: 80,
        openSlots: { left: true, right: true },
        shadowSlots: {
          left: {
            id: 'shadow-right-2',
            owner: 'YOU3',
            placement: 'left',
            state: 'reserved_shadow',
            label: 'YOU 3L',
            activationStatus: 'inactive',
            registrationEnabled: false,
            walletEnabled: false,
            unilevelEnabled: false,
            binaryCycleEnabled: false,
            note: 'Binary Function Only'
          },
          right: {
            id: 'shadow-right-3',
            owner: 'YOU3',
            placement: 'right',
            state: 'reserved_shadow',
            label: 'YOU 3R',
            activationStatus: 'inactive',
            registrationEnabled: false,
            walletEnabled: false,
            unilevelEnabled: false,
            binaryCycleEnabled: false,
            note: 'Binary Function Only'
          }
        },
        accountStateLabel: 'PD',
        children: []
      }
    ]
  },
  nodes: [
    {
      nodeId: 'node-root',
      username: 'YOU1',
      fullName: 'Root Member',
      referralCode: 'YOR-MEMBER-001',
      packageTier: 'VIP',
      placement: 'root',
      status: 'active',
      depth: 0,
      tracePath: 'YOU1',
      binaryPoints: 0,
      directReferrals: 2,
      leftPoints: 100,
      rightPoints: 80,
      openSlots: { left: false, right: false },
      shadowSlots: {
        left: {
          id: 'shadow-left',
          owner: 'YOU1',
          placement: 'left',
          state: 'reserved_shadow',
          label: 'YOU 2',
          activationStatus: 'inactive',
          registrationEnabled: false,
          walletEnabled: false,
          unilevelEnabled: false,
          binaryCycleEnabled: false,
          note: 'Binary Function Only'
        },
        right: {
          id: 'shadow-right',
          owner: 'YOU1',
          placement: 'right',
          state: 'reserved_shadow',
          label: 'YOU 3',
          activationStatus: 'inactive',
          registrationEnabled: false,
          walletEnabled: false,
          unilevelEnabled: false,
          binaryCycleEnabled: false,
          note: 'Binary Function Only'
        }
      },
      accountStateLabel: 'PD',
      parentNodeId: null,
      level: 0
    },
    {
      nodeId: 'node-alpha',
      username: 'ALPHA001',
      fullName: 'Alice Alpha',
      referralCode: 'YOR-ALPHA-001',
      packageTier: 'Standard',
      placement: 'left',
      status: 'active',
      depth: 2,
      tracePath: 'YOU1>YOU2>ALPHA001',
      binaryPoints: 0,
      directReferrals: 0,
      leftPoints: 0,
      rightPoints: 0,
      openSlots: { left: true, right: true },
      shadowSlots: {
        left: {
          id: 'shadow-alpha-left',
          owner: 'ALPHA001',
          placement: 'left',
          state: 'reserved_shadow',
          label: 'ALPHA L',
          activationStatus: 'inactive',
          registrationEnabled: false,
          walletEnabled: false,
          unilevelEnabled: false,
          binaryCycleEnabled: false,
          note: 'Binary Function Only'
        },
        right: {
          id: 'shadow-alpha-right',
          owner: 'ALPHA001',
          placement: 'right',
          state: 'reserved_shadow',
          label: 'ALPHA R',
          activationStatus: 'inactive',
          registrationEnabled: false,
          walletEnabled: false,
          unilevelEnabled: false,
          binaryCycleEnabled: false,
          note: 'Binary Function Only'
        }
      },
      accountStateLabel: 'PD',
      parentNodeId: 'node-shadow-left',
      level: 2
    }
  ],
  notes: ['Shadow accounts sit directly under YOU 1.']
};
