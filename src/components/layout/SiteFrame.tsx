import type { PropsWithChildren } from 'react';
import { NavLink } from 'react-router-dom';
import { primaryNavigation } from '../../config/navigation';

export function SiteFrame({ children }: PropsWithChildren) {
  return (
    <>
      <header className="site-header">
        <NavLink className="site-logo" to="/">
          Yor Legacy
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
        <NavLink className="site-cta" to="/packages">
          Join Now
        </NavLink>
      </header>
      {children}
      <footer className="site-footer">
        <div>
          <p className="site-footer-brand">Yor Legacy</p>
          <p className="site-footer-copy">
            Premium direct selling experiences designed for modern legacy builders.
          </p>
        </div>
      </footer>
    </>
  );
}
