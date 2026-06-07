import { ArrowLeft, ArrowRight } from 'lucide-react';
import { NavLink } from 'react-router-dom';

type EarnExperienceChromeProps = {
  title: string;
  subtitle: string;
  backHref?: string;
  backLabel?: string;
};

export function EarnExperienceHeader({
  title,
  subtitle,
  backHref = '/#scene-complan',
  backLabel = 'Back to Ways of Wealth'
}: EarnExperienceChromeProps) {
  return (
    <header className="earn-experience-header">
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
