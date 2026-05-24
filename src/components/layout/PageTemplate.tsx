import { motion } from 'framer-motion';
import { NavLink } from 'react-router-dom';
import { AmbientEmbers } from './AmbientEmbers';
import { OrnateCorners } from './OrnateCorners';
import type { PageContent } from '../../types/content';

type PageTemplateProps = {
  content: PageContent;
};

const reveal = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0 }
};

export function PageTemplate({ content }: PageTemplateProps) {
  return (
    <section className="page-template">
      <AmbientEmbers />
      <OrnateCorners />
      <div className="page-gradient" />
      <div className="page-container">
        <motion.div
          animate="visible"
          className="hero-copy"
          initial="hidden"
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          variants={reveal}
        >
          <span className="eyebrow">{content.eyebrow}</span>
          <h1 className="display-heading">{content.title}</h1>
          {content.strapline ? (
            <p className="display-strapline">{content.strapline}</p>
          ) : null}
          <p className="hero-summary">{content.summary}</p>
          {content.ctaLabel && content.ctaHref ? (
            <NavLink className="site-cta hero-cta" to={content.ctaHref}>
              {content.ctaLabel}
            </NavLink>
          ) : null}
        </motion.div>

        {content.stats?.length ? (
          <motion.section
            animate="visible"
            className="stats-grid"
            initial="hidden"
            transition={{ delay: 0.12, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            variants={reveal}
          >
            {content.stats.map((stat) => (
              <article key={stat.label} className="glass-panel stat-card">
                <span className="stat-label">{stat.label}</span>
                <strong className="stat-value">{stat.value}</strong>
              </article>
            ))}
          </motion.section>
        ) : null}

        {content.highlights?.length ? (
          <motion.section
            animate="visible"
            className="highlights-grid"
            initial="hidden"
            transition={{ delay: 0.2, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            variants={reveal}
          >
            {content.highlights.map((highlight) => (
              <article key={highlight.title} className="glass-panel feature-card">
                <h2>{highlight.title}</h2>
                <p>{highlight.body}</p>
              </article>
            ))}
          </motion.section>
        ) : null}

        <section className="sections-stack">
          {content.sections.map((section, index) => (
            <motion.article
              key={section.key}
              animate="visible"
              className="glass-panel content-card"
              initial="hidden"
              transition={{
                delay: 0.28 + index * 0.08,
                duration: 0.8,
                ease: [0.22, 1, 0.36, 1]
              }}
              variants={reveal}
            >
              <h2>{section.heading}</h2>
              <p>{section.body}</p>
            </motion.article>
          ))}
        </section>
      </div>
    </section>
  );
}
