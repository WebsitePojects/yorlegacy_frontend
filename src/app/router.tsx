import { createBrowserRouter } from 'react-router-dom';
import App from './App';
import { HomePage } from '../pages/HomePage';
import { ContentPage } from '../pages/ContentPage';

export const routes = [
  {
    path: '/',
    element: <App />,
    children: [
      {
        index: true,
        element: <HomePage />
      },
      {
        path: 'vision',
        element: <ContentPage slug="vision" />
      },
      {
        path: 'mission',
        element: <ContentPage slug="mission" />
      },
      {
        path: 'founder',
        element: <ContentPage slug="founder" />
      },
      {
        path: 'perfume-collection',
        element: <ContentPage slug="perfume-collection" />
      },
      {
        path: 'packages',
        element: <ContentPage slug="packages" />
      },
      {
        path: 'register',
        element: <ContentPage slug="register" />
      },
      {
        path: 'thank-you',
        element: <ContentPage slug="thank-you" />
      },
      {
        path: 'earn',
        element: <ContentPage slug="earn" />
      },
      {
        path: 'earn/direct-selling',
        element: <ContentPage slug="earn/direct-selling" />
      },
      {
        path: 'earn/direct-referral',
        element: <ContentPage slug="earn/direct-referral" />
      },
      {
        path: 'earn/salesmatch',
        element: <ContentPage slug="earn/salesmatch" />
      },
      {
        path: 'earn/leadership',
        element: <ContentPage slug="earn/leadership" />
      },
      {
        path: 'earn/get-five',
        element: <ContentPage slug="earn/get-five" />
      },
      {
        path: 'earn/lifestyle-rewards',
        element: <ContentPage slug="earn/lifestyle-rewards" />
      },
      {
        path: 'earn/unilevel-rank',
        element: <ContentPage slug="earn/unilevel-rank" />
      },
      {
        path: 'earn/global',
        element: <ContentPage slug="earn/global" />
      },
      {
        path: 'rank-incentives',
        element: <ContentPage slug="rank-incentives" />
      }
    ]
  }
];

export const router = createBrowserRouter(routes);
