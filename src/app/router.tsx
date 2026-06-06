import { createBrowserRouter } from 'react-router-dom';
import App from './App';
import { ProtectedRoute } from '../components/layout/ProtectedRoute';
import { AdminDashboardPage } from '../pages/AdminDashboardPage';
import { HomePage } from '../pages/HomePage';
import { ContentPage } from '../pages/ContentPage';
import { LoginPage } from '../pages/LoginPage';
import { MemberDashboardPage } from '../pages/MemberDashboardPage';
import { UnauthorizedPage } from '../pages/UnauthorizedPage';

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
        path: 'products',
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
        path: 'earn/binary-cycle',
        element: <ContentPage slug="earn/binary-cycle" />
      },
      {
        path: 'earn/leadership',
        element: <ContentPage slug="earn/binary-cycle" />
      },
      {
        path: 'login',
        element: <HomePage />
      },
      {
        path: 'member',
        element: (
          <ProtectedRoute allowedRoles={['member', 'admin', 'cashier', 'bod', 'superadmin']}>
            <MemberDashboardPage />
          </ProtectedRoute>
        )
      },
      {
        path: 'member/:moduleId',
        element: (
          <ProtectedRoute allowedRoles={['member', 'admin', 'cashier', 'bod', 'superadmin']}>
            <MemberDashboardPage />
          </ProtectedRoute>
        )
      },
      {
        path: 'admin',
        element: (
          <ProtectedRoute allowedRoles={['admin', 'cashier', 'bod', 'superadmin']}>
            <AdminDashboardPage />
          </ProtectedRoute>
        )
      },
      {
        path: 'admin/:moduleId',
        element: (
          <ProtectedRoute allowedRoles={['admin', 'cashier', 'bod', 'superadmin']}>
            <AdminDashboardPage />
          </ProtectedRoute>
        )
      },
      {
        path: 'cashier',
        element: (
          <ProtectedRoute allowedRoles={['cashier', 'admin', 'superadmin']}>
            <AdminDashboardPage />
          </ProtectedRoute>
        )
      },
      {
        path: 'cashier/:moduleId',
        element: (
          <ProtectedRoute allowedRoles={['cashier', 'admin', 'superadmin']}>
            <AdminDashboardPage />
          </ProtectedRoute>
        )
      },
      {
        path: 'bod',
        element: (
          <ProtectedRoute allowedRoles={['bod', 'admin', 'superadmin']}>
            <AdminDashboardPage />
          </ProtectedRoute>
        )
      },
      {
        path: 'bod/:moduleId',
        element: (
          <ProtectedRoute allowedRoles={['bod', 'admin', 'superadmin']}>
            <AdminDashboardPage />
          </ProtectedRoute>
        )
      },
      {
        path: 'unauthorized',
        element: <UnauthorizedPage />
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
        path: 'earn/unilevel',
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
