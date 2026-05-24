import { motion } from 'framer-motion';
import { NavLink } from 'react-router-dom';
import { pageAssets } from '../../config/pagePresets';
import type { PageContent } from '../../types/content';
import { AmbientEmbers } from '../layout/AmbientEmbers';
import { OrnateCorners } from '../layout/OrnateCorners';

export function HomeExperiencePage({ content }: { content: PageContent }) {
  return (
    <section className="hero-immersion">
      <div className="hero-media">
        <img alt="" src={pageAssets.coverSkyline} />
        <div className="hero-overlay" />
      </div>
      <AmbientEmbers />
      <OrnateCorners />
      <div className="hero-glow-orb" />
      <div className="hero-inner">
        <motion.div animate={{ opacity: 1, y: 0 }} className="yor-mark" initial={{ opacity: 0, y: 36 }} transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}>
          <div className="yor-mark-word">
            Y<span className="yor-mark-fire">O</span>R
          </div>
          <div className="yor-mark-subtitle">{content.strapline ?? 'Legacy'}</div>
        </motion.div>
        <motion.div animate={{ opacity: 1, y: 0 }} className="hero-home-copy" initial={{ opacity: 0, y: 36 }} transition={{ delay: 0.12, duration: 0.9, ease: [0.22, 1, 0.36, 1] }}>
          <span className="eyebrow">{content.eyebrow}</span>
          <h1 className="hero-home-heading">{content.title}</h1>
          <p className="hero-summary">{content.summary}</p>
          <div className="hero-home-actions">
            <NavLink className="site-cta" to={content.ctaHref ?? '/packages'}>{content.ctaLabel ?? 'Join Now'}</NavLink>
            <NavLink className="ghost-link" to="/earn">Explore the opportunity</NavLink>
          </div>
        </motion.div>
        {content.stats?.length ? (
          <motion.section animate={{ opacity: 1, y: 0 }} className="hero-home-stats" initial={{ opacity: 0, y: 36 }} transition={{ delay: 0.22, duration: 0.9, ease: [0.22, 1, 0.36, 1] }}>
            {content.stats.map((stat) => (
              <article key={stat.label} className="glass-panel stat-card">
                <span className="stat-label">{stat.label}</span>
                <strong className="stat-value">{stat.value}</strong>
              </article>
            ))}
          </motion.section>
        ) : null}
      </div>
      <div className="scroll-indicator">Scroll</div>
    </section>
  );
}
