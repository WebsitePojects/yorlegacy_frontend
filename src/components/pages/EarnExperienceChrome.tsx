import { ArrowLeft, ArrowRight, Menu, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { YorBrandMark } from '../branding/YorBrandMark';

type EarnExperienceChromeProps = {
  title: string;
  subtitle: string;
  backHref?: string;
  backLabel?: string;
};

const earnExperienceLinks = [
  { label: 'Home', href: '/' },
  { label: 'Vision', href: '/vision' },
  { label: 'Mission', href: '/mission' },
  { label: 'Founder', href: '/founder' },
  { label: 'Products', href: '/products' },
  { label: 'Packages', href: '/packages' },
  { label: 'Join Yor', href: '/register', tone: 'primary' as const },
  { label: 'Portal Login', href: '/login', tone: 'secondary' as const }
];

export function EarnExperienceHeader({
  title,
  subtitle,
  backHref = '/earn',
  backLabel = 'Back to Earnings'
}: EarnExperienceChromeProps) {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  return (
    <header className="earn-experience-header">
      <div className={`earn-experience-topbar ${mobileMenuOpen ? 'is-open' : ''}`}>
        <NavLink className="earn-experience-brand" to="/">
          <YorBrandMark className="earn-experience-brand-mark" />
          <span>
            <strong>Yor International</strong>
            <small>Premium earnings experience</small>
          </span>
        </NavLink>

        <div className="earn-experience-actions">
          <NavLink className="earn-experience-pill" to="/register">
            Join Yor
          </NavLink>
          <NavLink className="earn-experience-pill is-muted earn-experience-login-pill" to="/login">
            Portal Login
          </NavLink>
          <button
            aria-expanded={mobileMenuOpen}
            aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            className="earn-experience-menu-toggle"
            onClick={() => setMobileMenuOpen((current) => !current)}
            type="button"
          >
            {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {mobileMenuOpen ? (
        <div className="earn-experience-mobile-menu">
          <div className="earn-experience-mobile-menu-card">
            {earnExperienceLinks.map((link) => (
              <NavLink
                key={link.href}
                className={({ isActive }) =>
                  [
                    'earn-experience-mobile-link',
                    isActive ? 'is-active' : '',
                    link.tone === 'primary' ? 'is-primary' : '',
                    link.tone === 'secondary' ? 'is-secondary' : ''
                  ]
                    .filter(Boolean)
                    .join(' ')
                }
                to={link.href}
              >
                {link.label}
              </NavLink>
            ))}
          </div>
        </div>
      ) : null}

      <div className="earn-experience-hero">
        <NavLink className="earn-experience-back" to={backHref}>
          <ArrowLeft size={16} />
          <span>{backLabel}</span>
        </NavLink>
        <div className="earn-experience-copy">
          <span className="earn-experience-kicker">Yor Opportunity</span>
          <h1>{title}</h1>
          <p>{subtitle}</p>
        </div>
      </div>
    </header>
  );
}

export function EarnExperienceFooter() {
  return (
    <footer className="earn-experience-footer">
      <div className="earn-experience-footer-copy">
        <span className="earn-experience-kicker">Ready To Build</span>
        <h2>Move from product confidence to structured growth</h2>
        <p>
          Explore the public plan, choose your entry package, and step into the Yor pathway with a cleaner premium experience.
        </p>
      </div>

      <div className="earn-experience-footer-actions">
        <NavLink className="earn-experience-footer-cta" to="/register">
          Register Now
          <ArrowRight size={15} />
        </NavLink>
        <NavLink className="earn-experience-footer-link" to="/packages">
          View Packages
        </NavLink>
      </div>
    </footer>
  );
}
