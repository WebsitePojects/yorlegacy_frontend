import type { PropsWithChildren } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { primaryNavigation } from '../../config/navigation';

export function SiteFrame({ children }: PropsWithChildren) {
  const { authenticated, logout, user } = useAuth();

  return (
    <>
      <header className="site-header">
        <NavLink className="site-logo" to="/">
          Yor International
        </NavLink>
        <nav className="site-nav">
          {primaryNavigation.map((item) => (
            <NavLink
              key={item.href}
              className={({ isActive }) =>
                isActive ? 'site-link is-active' : 'site-link'
              }
              to={item.href}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="site-header-actions">
          {authenticated ? (
            <NavLink className="site-link site-inline-link" to={user?.role === 'admin' ? '/admin' : '/member'}>
              {user?.role === 'admin' ? 'Admin' : 'Member'}
            </NavLink>
          ) : (
            <NavLink className="site-link site-inline-link" to="/login">
              Login
            </NavLink>
          )}
          {authenticated ? (
            <button className="site-cta" onClick={() => void logout()} type="button">
              Sign Out
            </button>
          ) : (
            <NavLink className="site-cta" to="/packages">
              Join Now
            </NavLink>
          )}
        </div>
      </header>
      {children}
      <footer className="site-footer">
        <div>
          <p className="site-footer-brand">Yor International</p>
          <p className="site-footer-copy">
            Premium direct selling experiences designed for modern legacy builders.
          </p>
        </div>
      </footer>
    </>
  );
}
