import type { ReactElement } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { canAccessRole, useAuth } from '../../auth/AuthContext';
import type { AppRole } from '../../types/auth';

type ProtectedRouteProps = {
  allowedRoles: AppRole[];
  children: ReactElement;
};

export function getLoginPathForRoute(pathname: string) {
  return pathname.startsWith('/admin') || pathname.startsWith('/cashier') || pathname.startsWith('/bod')
    ? '/admin/login'
    : '/login';
}

export function ProtectedRoute({
  allowedRoles,
  children
}: ProtectedRouteProps) {
  const location = useLocation();
  const { authenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return (
      <section className="page-template">
        <div className="page-container">
          <div className="glass-panel content-card">
            <span className="eyebrow">Authorizing</span>
            <h1 className="display-heading">Checking access</h1>
          </div>
        </div>
      </section>
    );
  }

  if (!authenticated) {
    return <Navigate replace state={{ from: location.pathname }} to={getLoginPathForRoute(location.pathname)} />;
  }

  if (!canAccessRole(user?.role, allowedRoles)) {
    return <Navigate replace to="/unauthorized" />;
  }

  return children;
}
