import { useEffect, useState, type PropsWithChildren } from 'react';
import { Menu, X } from 'lucide-react';
import { NavLink, matchPath, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { useFeedback } from '../feedback/FeedbackProvider';
import { primaryNavigation } from '../../config/navigation';
import { YorBrandMark } from '../branding/YorBrandMark';
import { useTheme } from '../theme-provider';
import { PublicHeader } from './PublicHeader';

export function SiteFrame({ children }: PropsWithChildren) {
  const { authenticated, logout, user } = useAuth();
  const { confirmAction, notify } = useFeedback();
  const { setForcedTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isAdminOffice = user?.role ? user.role !== 'member' : false;
  const isProtectedOffice =
    location.pathname.startsWith('/member') ||
    location.pathname.startsWith('/admin') ||
    location.pathname.startsWith('/cashier') ||
    location.pathname.startsWith('/bod');

  useEffect(() => {
    setForcedTheme(isProtectedOffice ? null : 'dark');
  }, [isProtectedOffice, setForcedTheme]);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  async function handleSignOut() {
    const confirmed = await confirmAction({
      title: 'Sign out?',
      description: 'You will leave the current Yor session and return to the login page.',
      confirmLabel: 'Sign Out',
      tone: 'warning'
    });

    if (!confirmed) {
      return;
    }

    await logout();
    notify({
      title: 'Signed out',
      description: 'You can sign in again any time.',
      tone: 'success'
    });
    navigate('/login', { replace: true });
  }

  if (isProtectedOffice) {
    return children;
  }

  const isExperiencePage = [
    '/',
    '/vision',
    '/mission',
    '/founder',
    '/products',
    '/perfume-collection',
    '/news-updates',
    '/packages',
    '/register',
    '/thank-you',
    '/login'
  ].includes(location.pathname);
  const isEarnExperiencePage =
    location.pathname === '/earn' || location.pathname.startsWith('/earn/');

  if (isExperiencePage || isEarnExperiencePage) {
    return (
      <div className={`public-shell ${isExperiencePage ? 'is-homepage' : 'is-earn-experience'}`}>
        <PublicHeader />
        {children}
      </div>
    );
  }

  const footerLinks = [
    { label: 'Privacy Policy', href: '/vision' },
    { label: 'Terms of Service', href: '/mission' },
    { label: 'Compliance', href: '/earn' },
    { label: 'Contact Us', href: '/register' }
  ];
  const isNavItemActive = (matchPatterns: string[]) =>
    matchPatterns.some((pattern) =>
      Boolean(
        matchPath(
          {
            path: pattern,
            end: pattern === '/' || !pattern.endsWith('*')
          },
          location.pathname
        )
      )
    );
  return (
    <div className="public-shell">
      <header className={mobileMenuOpen ? 'site-header is-open' : 'site-header'}>
        <NavLink className="site-logo" to="/">
          <img
            alt="Yor International logo"
            className="site-logo-mark"
            src="/assets/yor/branding/yor-logo-round.png"
          />
          <span className="site-logo-copy">
            <strong>Yor International</strong>
            <small>Founder-led fragrance opportunity</small>
          </span>
        </NavLink>
        {authenticated ? (
          <NavLink className="site-mobile-login-link" to={isAdminOffice ? '/admin' : '/member'}>
            {isAdminOffice ? 'Admin' : 'Member'}
          </NavLink>
        ) : (
          <NavLink className="site-mobile-login-link" to="/login">
            Login
          </NavLink>
        )}
        <button
          aria-expanded={mobileMenuOpen}
          aria-label={mobileMenuOpen ? 'Close navigation' : 'Open navigation'}
          className="site-mobile-toggle"
          onClick={() => setMobileMenuOpen((current) => !current)}
          type="button"
        >
          {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
        </button>
        <div className="site-header-panel">
          <nav className="site-nav">
            {primaryNavigation.map((item) => (
              <NavLink
                key={item.href}
                className={isNavItemActive(item.matchPatterns) ? 'site-link is-active' : 'site-link'}
                to={item.href}
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
          <div className="site-header-actions">
            {authenticated ? (
              <NavLink className="site-link site-inline-link" to={isAdminOffice ? '/admin' : '/member'}>
                {isAdminOffice ? 'Admin' : 'Member'}
              </NavLink>
            ) : (
              <NavLink className="site-link site-inline-link" to="/login">
                Login
              </NavLink>
            )}
            {authenticated ? (
              <button className="site-cta" onClick={() => void handleSignOut()} type="button">
                Sign Out
              </button>
            ) : (
              <NavLink className="site-cta" to="/packages">
                Join Now
              </NavLink>
            )}
          </div>
        </div>
      </header>
      <main className="public-shell-main">{children}</main>
      <footer className="site-footer">
        <div className="site-footer-inner page-container">
          <div className="site-footer-brand-block">
            <YorBrandMark className="site-footer-mark" />
            <div>
              <p className="site-footer-brand">Yor International</p>
              <p className="site-footer-copy">Copyright 2024 Yor International. All rights reserved.</p>
            </div>
          </div>
          <nav className="site-footer-links" aria-label="Footer">
            {footerLinks.map((link) => (
              <NavLink key={link.label} className="site-footer-link" to={link.href}>
                {link.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </footer>
    </div>
  );
}
