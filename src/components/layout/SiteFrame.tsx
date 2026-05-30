import { useEffect, useState, type ComponentType, type PropsWithChildren } from 'react';
import { BadgeDollarSign, Building2, Home, Menu, Network, UserPlus, X } from 'lucide-react';
import { NavLink, matchPath, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { useFeedback } from '../feedback/FeedbackProvider';
import { earnRoutes, primaryNavigation } from '../../config/navigation';
import { YorBrandMark } from '../branding/YorBrandMark';
import { useTheme } from '../theme-provider';

type MobileNavGroup = {
  id: 'home' | 'company' | 'network' | 'earn' | 'join';
  label: string;
  icon: ComponentType<{ size?: number; className?: string }>;
  href?: string;
  links: Array<{ label: string; href: string }>;
};

const mobileBottomNavGroups: MobileNavGroup[] = [
  {
    id: 'home',
    label: 'Home',
    icon: Home,
    href: '/',
    links: [{ label: 'Return Home', href: '/' }]
  },
  {
    id: 'company',
    label: 'Company',
    icon: Building2,
    links: [
      { label: 'Vision', href: '/vision' },
      { label: 'Mission', href: '/mission' },
      { label: 'Founder', href: '/founder' },
      { label: 'Products', href: '/products' }
    ]
  },
  {
    id: 'network',
    label: 'Network',
    icon: Network,
    links: [
      { label: 'Direct Referrals', href: '/earn/direct-referral' },
      { label: 'Binary Tree', href: '/earn/binary-cycle' },
      { label: 'Unilevel / Rank', href: '/earn/unilevel-rank' },
      { label: 'Rank Incentives', href: '/rank-incentives' }
    ]
  },
  {
    id: 'earn',
    label: 'Earn',
    icon: BadgeDollarSign,
    links: earnRoutes.map((route) => ({
      label: route.label.replace(/^\d+\.\s*/, ''),
      href: route.href
    }))
  },
  {
    id: 'join',
    label: 'Join',
    icon: UserPlus,
    links: [
      { label: 'Packages', href: '/packages' },
      { label: 'Create Account', href: '/register' },
      { label: 'Login', href: '/login' }
    ]
  }
];

export function SiteFrame({ children }: PropsWithChildren) {
  const { authenticated, logout, user } = useAuth();
  const { confirmAction, notify } = useFeedback();
  const { setForcedTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeMobileGroup, setActiveMobileGroup] = useState<MobileNavGroup['id'] | null>(null);
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
    setActiveMobileGroup(null);
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
  const activeBottomGroup =
    mobileBottomNavGroups.find((group) => group.id === activeMobileGroup) ?? null;

  return (
    <div className="public-shell">
      <header className={mobileMenuOpen ? 'site-header is-open' : 'site-header'}>
        <NavLink className="site-logo" to="/">
          <YorBrandMark className="site-logo-mark" />
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
      <nav className="public-mobile-bottom-nav" aria-label="Mobile public navigation">
        {activeBottomGroup ? (
          <div className="public-mobile-nav-popover">
            <div className="public-mobile-nav-popover-head">
              <span>{activeBottomGroup.label}</span>
              <button type="button" onClick={() => setActiveMobileGroup(null)} aria-label="Close mobile section">
                <X size={15} />
              </button>
            </div>
            <div className="public-mobile-nav-popover-links">
              {activeBottomGroup.links.map((link) => (
                <NavLink
                  key={`${activeBottomGroup.id}-${link.href}`}
                  to={link.href}
                  className={({ isActive }) => (isActive ? 'is-active' : '')}
                >
                  {link.label}
                </NavLink>
              ))}
            </div>
          </div>
        ) : null}
        <div className="public-mobile-bottom-nav-shell">
          {mobileBottomNavGroups.map((group, index) => {
            const Icon = group.icon;
            const current =
              group.href === location.pathname ||
              group.links.some((link) => link.href === location.pathname) ||
              activeMobileGroup === group.id;
            const isCenter = index === 2;

            return (
              <button
                key={group.id}
                type="button"
                className={[
                  'public-mobile-bottom-item',
                  isCenter ? 'is-center' : '',
                  current ? 'is-active' : ''
                ]
                  .filter(Boolean)
                  .join(' ')}
                aria-expanded={activeMobileGroup === group.id}
                onClick={() => {
                  if (group.href && !isCenter) {
                    navigate(group.href);
                    return;
                  }

                  setActiveMobileGroup((currentGroup) => (currentGroup === group.id ? null : group.id));
                }}
              >
                <Icon size={isCenter ? 21 : 18} />
                <span>{group.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
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
