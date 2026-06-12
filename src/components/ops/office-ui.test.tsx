import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { MobileOfficeNav, OfficeSidebar } from './office-ui';
import { ThemeProvider } from '@/components/theme-provider';
import type { OperationalModule } from '@/types/auth';

const modules: OperationalModule[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    path: '/admin',
    group: 'Overview',
    description: 'Overview module',
    status: 'read-only',
    legacyReference: 'dashboard.php',
    permissions: ['admin'],
    metrics: [],
    table: { title: 'Overview', columns: [], rows: [] },
    gatedActions: []
  },
  {
    id: 'activation-codes',
    label: 'Activation Codes',
    path: '/admin/activation-codes',
    group: 'Codes',
    description: 'Code center',
    status: 'read-only',
    legacyReference: 'codes.php',
    permissions: ['admin'],
    metrics: [],
    table: { title: 'Codes', columns: [], rows: [] },
    gatedActions: []
  },
  {
    id: 'member-management',
    label: 'Member Management',
    path: '/admin/member-management',
    group: 'Account',
    description: 'Member management',
    status: 'read-only',
    legacyReference: 'members.php',
    permissions: ['admin'],
    metrics: [],
    table: { title: 'Members', columns: [], rows: [] },
    gatedActions: []
  }
];

describe('MobileOfficeNav', () => {
  it('opens a hamburger drawer instead of rendering a bottom navigation bar', async () => {
    render(
      <ThemeProvider>
        <MemoryRouter>
          <MobileOfficeNav
            basePath="/admin"
            currentModuleId="dashboard"
            heading="yoradmin"
            subheading="Admin Office"
            modules={modules}
          />
        </MemoryRouter>
      </ThemeProvider>
    );

    expect(screen.getByRole('button', { name: /open office navigation/i })).toBeInTheDocument();
    expect(screen.queryByLabelText(/mobile office navigation/i)).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /open office navigation/i }));

    expect(screen.getByRole('dialog', { name: /admin office navigation/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /activation codes/i })).toBeInTheDocument();

    fireEvent.click(screen.getAllByRole('button', { name: /close office navigation/i })[1]);

    await waitFor(() => {
      expect(screen.queryByRole('dialog', { name: /admin office navigation/i })).not.toBeInTheDocument();
    });
  });
});

describe('OfficeSidebar', () => {
  it('uses module catalog paths for sidebar links', () => {
    render(
      <ThemeProvider>
        <MemoryRouter>
          <OfficeSidebar
            basePath="/member"
            currentModuleId="dashboard"
            heading="yor01"
            subheading="Member Office"
            expanded
            modules={[
              {
                id: 'binary-cycle-bonus',
                label: 'Binary Cycle Bonus',
                path: '/member/binary-cycle-bonus',
                group: 'Compensation',
                description: 'Cycle page',
                status: 'read-only',
                legacyReference: 'cycle.php',
                permissions: ['member'],
                metrics: [],
                table: { title: 'Cycle', columns: [], rows: [] },
                gatedActions: []
              }
            ]}
          />
        </MemoryRouter>
      </ThemeProvider>
    );

    expect(screen.getByRole('link', { name: /binary cycle bonus/i })).toHaveAttribute(
      'href',
      '/member/binary-cycle-bonus'
    );
  });
});
