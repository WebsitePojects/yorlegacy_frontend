import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { MobileOfficeNav } from './office-ui';
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
