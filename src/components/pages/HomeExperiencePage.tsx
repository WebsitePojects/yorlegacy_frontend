import { useLayoutEffect, useRef } from 'react';
import {
  ArrowRight,
  BriefcaseBusiness,
  ChevronDown,
  GraduationCap,
  HeartHandshake,
  Trophy,
  UserRoundCheck,
  Users
} from 'lucide-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { NavLink } from 'react-router-dom';
import { founderHighlights, founderProfile, homePreviewRoutes, pageAssets } from '../../config/pagePresets';
import type { PageContent } from '../../types/content';
import { YorBrandMark } from '../branding/YorBrandMark';
import { AmbientEmbers } from '../layout/AmbientEmbers';
import { OrnateCorners } from '../layout/OrnateCorners';

if (!import.meta.env.TEST) {
  gsap.registerPlugin(ScrollTrigger);
}

const founderIcons = [
  BriefcaseBusiness,
  UserRoundCheck,
  Users,
  HeartHandshake,
  Trophy,
  Trophy,
  GraduationCap
] as const;

export function HomeExperiencePage({ content }: { content: PageContent }) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const heroSummary = content.summary.toLowerCase().includes('legacy')
    ? 'Founder-led fragrance opportunity, premium product trust, and a direct path into the Yor International business system.'
    : content.summary;

  function scrollToFounder() {
    document.getElementById('home-founder')?.scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    });
  }

  useLayoutEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) {
      return;
    }

    const ctx = gsap.context(() => {
      gsap.fromTo(
        '.home-hero-panel',
        { opacity: 0, y: 42 },
        {
          opacity: 1,
          y: 0,
          duration: 0.92,
          stagger: 0.12,
          ease: 'power3.out'
        }
      );

      gsap.to('.home-cover-media img', {
        scale: 1.08,
        yPercent: 6,
        ease: 'none',
        scrollTrigger: {
          trigger: '.home-cover-stage',
          start: 'top top',
          end: 'bottom top',
          scrub: 1
        }
      });

      gsap.fromTo(
        '.home-founder-reveal',
        { opacity: 0, y: 44 },
        {
          opacity: 1,
          y: 0,
          duration: 0.84,
          stagger: 0.1,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: '#home-founder',
            start: 'top 74%'
          }
        }
      );

      gsap.fromTo(
        '.home-preview-card-wrap',
        { opacity: 0, y: 32 },
        {
          opacity: 1,
          y: 0,
          duration: 0.75,
          stagger: 0.08,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: '.home-preview-stage',
            start: 'top 78%'
          }
        }
      );

      gsap.fromTo(
        '.home-finale-shell',
        { opacity: 0, y: 48, scale: 0.98 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.95,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: '.home-finale-stage',
            start: 'top 78%'
          }
        }
      );
    }, rootRef);

    return () => ctx.revert();
  }, []);

  return (
    <div className="home-scroll-page" ref={rootRef}>
      <section className="home-cover-stage home-cover-stage--international">
        <div className="home-cover-media">
          <img alt="" src={pageAssets.coverSkyline} />
          <div className="home-cover-overlay" />
        </div>
        <AmbientEmbers />
        <OrnateCorners />
        <div className="page-container home-hero-shell">
          <div className="home-hero-center">
            <span className="home-cover-kicker home-hero-panel">Founder-Led Fragrance Opportunity</span>
            <div className="home-hero-logo-lockup home-hero-panel">
              <YorBrandMark alt="Yor International hero logo" className="home-hero-showcase-logo" variant="showcase" />
            </div>
            <p className="home-hero-subtitle home-hero-panel">Premium fragrance. Ethical leadership. Global entrepreneurial momentum.</p>
            <p className="home-cover-summary home-hero-panel">{heroSummary}</p>
            <div className="home-cover-actions home-hero-panel">
              <NavLink className="site-cta home-cover-cta" to="/register">
                Get Started
                <ArrowRight size={16} />
              </NavLink>
              <button className="ghost-link home-cover-link" onClick={scrollToFounder} type="button">
                Discover Yor
              </button>
            </div>
            <p className="home-hero-domain home-hero-panel">yorinternational.net</p>
          </div>
        </div>
        <button
          aria-label="Open founder section"
          className="home-scroll-indicator"
          onClick={scrollToFounder}
          type="button"
        >
          <span>Explore</span>
          <ChevronDown size={18} />
        </button>
      </section>

      <section className="home-founder-stage" id="home-founder">
        <div className="page-container">
          <div className="home-section-heading home-founder-reveal">
            <span>{founderProfile.eyebrow}</span>
            <div className="home-section-rule" />
          </div>

          <div className="founder-home-grid">
            <figure className="founder-home-portrait-wrap home-founder-reveal">
              <div className="founder-home-portrait-shell">
                <img alt={founderProfile.name} className="founder-home-portrait" src={pageAssets.founderPortrait} />
              </div>
              <div className="founder-home-tag">Founder / CEO</div>
            </figure>

            <article className="glass-panel founder-home-card home-founder-reveal">
              <div className="founder-home-accent" />
              <span className="founder-home-pill">{founderProfile.badge}</span>
              <h2 className="founder-home-name">{founderProfile.name}</h2>
              <p className="founder-home-summary">{founderProfile.summary}</p>
              <div className="founder-home-features">
                {founderHighlights.map((item, index) => {
                  const Icon = founderIcons[index] ?? BriefcaseBusiness;

                  return (
                    <div key={item} className="founder-home-feature">
                      <Icon size={16} />
                      <span>{item}</span>
                    </div>
                  );
                })}
              </div>
              <NavLink className="founder-home-story-link" to={founderProfile.ctaHref}>
                {founderProfile.ctaLabel}
                <ArrowRight size={16} />
              </NavLink>
            </article>
          </div>
        </div>
      </section>

      <section className="home-preview-stage">
        <div className="page-container">
          <div className="home-preview-heading">
            <span className="eyebrow">The Yor International Path</span>
            <h2 className="display-heading">From first impression to confident enrollment.</h2>
            <p className="hero-summary">
              Every public page now carries the same dark luxury rhythm, guiding people from company trust and product credibility into packages, earnings, and registration.
            </p>
          </div>

          <div className="home-preview-grid">
            {homePreviewRoutes.map((route) => (
              <div key={route.href} className="home-preview-card-wrap">
                <NavLink className="glass-panel home-preview-card" to={route.href}>
                  <span className="home-preview-label">{route.title}</span>
                  <p>{route.body}</p>
                  <span className="home-preview-action">
                    Open Page
                    <ArrowRight size={15} />
                  </span>
                </NavLink>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="home-finale-stage">
        <div className="page-container">
          <div className="glass-panel home-finale-shell">
            <div className="home-finale-rings" />
            <div className="home-finale-copy">
              <span className="eyebrow">The Yor International Mark</span>
              <h2 className="display-heading home-finale-title">A mark built for recognition, trust, and momentum.</h2>
              <p className="hero-summary">
                Yor International closes with a strong brand seal, a refined invitation to join, and a clear next move into registration or package review.
              </p>
              <div className="home-cover-actions home-cover-actions--left">
                <NavLink className="site-cta home-cover-cta" to="/register">
                  Begin Registration
                  <ArrowRight size={16} />
                </NavLink>
                <NavLink className="ghost-link home-cover-link" to="/packages">
                  Review Packages
                </NavLink>
              </div>
            </div>
            <div className="home-finale-logo-wrap">
              <YorBrandMark alt="Yor International showcase logo" className="home-finale-logo" variant="showcase" />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
