import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { useAuth } from '../../auth/AuthContext';

export function PublicHeader() {
  const { authenticated, user } = useAuth();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isAdminOffice = user?.role ? user.role !== 'member' : false;

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const navLinks = [
    { label: 'Vision', href: '/vision' },
    { label: 'Mission', href: '/mission' },
    { label: 'Products', href: '/products' },
    { label: 'Packages', href: '/packages' },
    { label: '8 Ways of Wealth', href: '/earn' }
  ];

  return (
    <>
      <header className={`story-header ${mobileMenuOpen ? 'is-open' : ''}`} style={{ pointerEvents: 'auto' }}>
        <NavLink className="story-logo-wrap" to="/">
          <span className="story-brand-name">Yor International</span>
        </NavLink>
        
        <nav className="story-header-nav">
          {navLinks.map((link) => (
            <NavLink 
              key={link.href} 
              className={({ isActive }) => `story-nav-link ${isActive ? 'active' : ''}`} 
              to={link.href}
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="story-header-actions">
          <NavLink className="story-nav-cta" to="/register">
            Join YOR
          </NavLink>
          
          {authenticated ? (
            <NavLink className="story-nav-link story-nav-link-login" to={isAdminOffice ? '/admin' : '/member'}>
              Dashboard
            </NavLink>
          ) : (
            <NavLink className="story-nav-link story-nav-link-login" to="/login">
              Portal Login
            </NavLink>
          )}

          <button
            aria-expanded={mobileMenuOpen}
            aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            className={`story-menu-toggle${mobileMenuOpen ? ' is-open' : ''}`}
            onClick={() => setMobileMenuOpen((current) => !current)}
            type="button"
          >
            <span className="story-menu-toggle-icon story-menu-toggle-hamburger"><Menu size={18} /></span>
            <span className="story-menu-toggle-icon story-menu-toggle-close"><X size={18} /></span>
          </button>
        </div>
      </header>

      <div className={`story-mobile-overlay${mobileMenuOpen ? ' is-open' : ''}`} aria-hidden={!mobileMenuOpen}>
        <nav className="story-mobile-overlay-nav" aria-label="Mobile navigation">
          <NavLink
            to="/"
            className="story-mobile-overlay-link"
            style={{ '--item-index': 0 } as React.CSSProperties}
          >
            Home
          </NavLink>
          
          {navLinks.map((link, index) => (
            <NavLink
              key={link.href}
              to={link.href}
              className="story-mobile-overlay-link"
              style={{ '--item-index': index + 1 } as React.CSSProperties}
            >
              {link.label}
            </NavLink>
          ))}

          <NavLink
            to="/register"
            className="story-mobile-overlay-link is-primary"
            style={{ '--item-index': navLinks.length + 1 } as React.CSSProperties}
          >
            Join YOR
          </NavLink>
          
          <NavLink
            to={authenticated ? (isAdminOffice ? '/admin' : '/member') : '/login'}
            className="story-mobile-overlay-link is-portal"
            style={{ '--item-index': navLinks.length + 2 } as React.CSSProperties}
          >
            <span className="portal-login-icon" aria-hidden="true">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
            </span>
            {authenticated ? 'Dashboard' : 'Portal Login'}
          </NavLink>
        </nav>
      </div>
    </>
  );
}
