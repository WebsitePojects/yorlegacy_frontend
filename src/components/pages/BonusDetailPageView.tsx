import { motion } from 'framer-motion';
import { NavLink } from 'react-router-dom';
import type { PageContent } from '../../types/content';

export function BonusDetailPageView({ content }: { content: PageContent }) {
  return (
    <section className="page-template">
      <div className="page-container bonus-grid">
        <motion.div animate={{ opacity: 1, y: 0 }} className="bonus-intro" initial={{ opacity: 0, y: 24 }} transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1] }}>
          <NavLink className="ghost-link bonus-back" to="/earn">Back to Earnings</NavLink>
          <span className="eyebrow">{content.eyebrow}</span>
          <h1 className="display-heading">{content.title}</h1>
          <p className="hero-summary">{content.summary}</p>
        </motion.div>
        <motion.article animate={{ opacity: 1, y: 0 }} className="glass-panel bonus-visual-card" initial={{ opacity: 0, y: 30 }} transition={{ delay: 0.08, duration: 0.85, ease: [0.22, 1, 0.36, 1] }}>
          <div className="bonus-node bonus-node-main">YOU</div>
          <div className="bonus-node-connector vertical" />
          <div className="bonus-node-row">
            <div className="bonus-node-group">
              <div className="bonus-node-connector vertical short" />
              <div className="bonus-node">LEFT LEG</div>
            </div>
            <div className="bonus-node-connector horizontal" />
            <div className="bonus-node-group">
              <div className="bonus-node-connector vertical short" />
              <div className="bonus-node bonus-node-secondary">RIGHT LEG</div>
            </div>
          </div>
          {content.stats?.length ? (
            <div className="bonus-stats-row">
              {content.stats.map((stat) => (
                <div key={stat.label} className="bonus-stat-pill">
                  <span>{stat.label}</span>
                  <strong>{stat.value}</strong>
                </div>
              ))}
            </div>
          ) : null}
        </motion.article>
        <section className="bonus-sections">
          {content.sections.map((section, index) => (
            <motion.article key={section.key} animate={{ opacity: 1, y: 0 }} className="glass-panel content-card" initial={{ opacity: 0, y: 28 }} transition={{ delay: 0.16 + index * 0.06, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}>
              <h2>{section.heading}</h2>
              <p>{section.body}</p>
            </motion.article>
          ))}
        </section>
      </div>
    </section>
  );
}
