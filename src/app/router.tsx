import { createBrowserRouter } from 'react-router-dom';
import App from './App';
import { ProtectedRoute } from '../components/layout/ProtectedRoute';
import { ErrorBoundary } from '../components/feedback/ErrorBoundary';
import { AdminDashboardPage } from '../pages/AdminDashboardPage';
import { HomePage } from '../pages/HomePage';
import { ContentPage } from '../pages/ContentPage';
import { LoginPage } from '../pages/LoginPage';
import { RegisterPage } from '../pages/RegisterPage';
import { MemberDashboardPage } from '../pages/MemberDashboardPage';
import { NewsUpdatesPage } from '../pages/NewsUpdatesPage';
import { UnauthorizedPage } from '../pages/UnauthorizedPage';
import { NotFoundPage } from '../pages/NotFoundPage';

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
        element: <HomePage />
      },
      {
        path: 'perfume-collection',
        element: <HomePage />
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
        path: 'news-updates',
        element: <NewsUpdatesPage />
      },
      {
        path: 'register',
        element: <RegisterPage />
      },
      {
        path: 'join/:referralCode',
        element: <RegisterPage />
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
        element: <LoginPage />
      },
      {
        path: 'admin/login',
        element: <LoginPage />
      },
      {
        path: 'member',
        element: (
          <ProtectedRoute allowedRoles={['member', 'admin', 'cashier', 'bod', 'superadmin']}>
            <ErrorBoundary label="member dashboard">
              <MemberDashboardPage />
            </ErrorBoundary>
          </ProtectedRoute>
        )
      },
      {
        path: 'member/:moduleId',
        element: (
          <ProtectedRoute allowedRoles={['member', 'admin', 'cashier', 'bod', 'superadmin']}>
            <ErrorBoundary label="member dashboard">
              <MemberDashboardPage />
            </ErrorBoundary>
          </ProtectedRoute>
        )
      },
      {
        path: 'admin',
        element: (
          <ProtectedRoute allowedRoles={['admin', 'cashier', 'bod', 'superadmin']}>
            <ErrorBoundary label="admin dashboard">
              <AdminDashboardPage />
            </ErrorBoundary>
          </ProtectedRoute>
        )
      },
      {
        path: 'admin/:moduleId',
        element: (
          <ProtectedRoute allowedRoles={['admin', 'cashier', 'bod', 'superadmin']}>
            <ErrorBoundary label="admin dashboard">
              <AdminDashboardPage />
            </ErrorBoundary>
          </ProtectedRoute>
        )
      },
      {
        path: 'bod',
        element: (
          <ProtectedRoute allowedRoles={['bod', 'admin', 'superadmin']}>
            <ErrorBoundary label="admin dashboard">
              <AdminDashboardPage />
            </ErrorBoundary>
          </ProtectedRoute>
        )
      },
      {
        path: 'bod/:moduleId',
        element: (
          <ProtectedRoute allowedRoles={['bod', 'admin', 'superadmin']}>
            <ErrorBoundary label="admin dashboard">
              <AdminDashboardPage />
            </ErrorBoundary>
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
      },
      {
        path: '*',
        element: <NotFoundPage />
      }
    ]
  }
];

export const router = createBrowserRouter(routes);
