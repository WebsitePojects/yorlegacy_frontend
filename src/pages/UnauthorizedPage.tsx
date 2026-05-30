import { NavLink } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

export function UnauthorizedPage() {
  const { user } = useAuth();
  const defaultPath = user?.role && user.role !== 'member' ? '/admin' : '/member';

  return (
    <section className="page-template">
      <div className="page-container">
        <div className="glass-panel content-card">
          <span className="eyebrow">Access Denied</span>
          <h1 className="display-heading">This role cannot open that page</h1>
          <p className="hero-summary">
            The route is protected, but the signed-in role does not have permission to view it.
          </p>
          <NavLink className="site-cta" to={defaultPath}>
            Return to Dashboard
          </NavLink>
        </div>
      </div>
    </section>
  );
}
