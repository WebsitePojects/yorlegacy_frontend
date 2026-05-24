import { motion } from 'framer-motion';
import { NavLink } from 'react-router-dom';
import { earnCards } from '../../config/pagePresets';
import type { PageContent } from '../../types/content';

export function EarnOverviewPageView({ content }: { content: PageContent }) {
  return (
    <section className="page-template">
      <div className="page-container">
        <motion.div animate={{ opacity: 1, y: 0 }} className="earn-header" initial={{ opacity: 0, y: 24 }} transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1] }}>
          <h1 className="display-heading">{content.title}</h1>
          <p className="hero-summary">{content.summary}</p>
        </motion.div>
        <section className="earn-grid">
          {earnCards.map((card, index) => (
            <motion.div key={card.href} animate={{ opacity: 1, y: 0 }} initial={{ opacity: 0, y: 28 }} transition={{ delay: index * 0.05, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}>
              <NavLink className="glass-panel earn-card" to={card.href}>
                <div className="earn-card-number">{card.number}</div>
                <div>
                  <h2>{card.title}</h2>
                  <p>{card.body}</p>
                  <span className="earn-card-link">Learn more</span>
                </div>
              </NavLink>
            </motion.div>
          ))}
        </section>
      </div>
    </section>
  );
}
