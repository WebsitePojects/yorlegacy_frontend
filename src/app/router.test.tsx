import { render, screen } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { routes } from './router';

describe('routes', () => {
  it('renders the earn overview route', async () => {
    const router = createMemoryRouter(routes, {
      initialEntries: ['/earn']
    });

    render(<RouterProvider router={router} />);

    expect(
      await screen.findByRole('heading', { name: /8 ways to earn overview/i })
    ).toBeInTheDocument();
  });
});
