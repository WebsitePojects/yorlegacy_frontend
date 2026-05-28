import { render, screen } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { AuthProvider } from '../auth/AuthContext';
import App from './App';
import { vi } from 'vitest';

describe('App', () => {
  it('renders the Yor International shell heading', async () => {
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

    const router = createMemoryRouter(
      [
        {
          path: '/',
          element: <App />,
          children: [
            {
              index: true,
              element: (
                <section>
                  <h1>Yor International</h1>
                </section>
              )
            }
          ]
        }
      ],
      {
        initialEntries: ['/']
      }
    );

    render(
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>
    );

    expect(
      await screen.findByRole('heading', { name: /yor international/i })
    ).toBeInTheDocument();
  });
});
