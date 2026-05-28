import { render, screen } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { vi } from 'vitest';
import { AuthProvider } from '../auth/AuthContext';
import { routes } from './router';

describe('routes', () => {
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
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>
    );

    expect(
      await screen.findByRole('heading', { name: /8 ways to earn overview/i })
    ).toBeInTheDocument();
  });
});
