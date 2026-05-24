import { render, screen } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import App from './App';

describe('App', () => {
  it('renders the Yor Legacy shell heading', () => {
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
                  <h1>Yor Legacy</h1>
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
      <RouterProvider router={router} />
    );

    expect(
      screen.getByRole('heading', { name: /yor legacy/i })
    ).toBeInTheDocument();
  });
});
