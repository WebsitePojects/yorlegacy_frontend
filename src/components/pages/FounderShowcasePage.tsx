import { motion } from 'framer-motion';
import { founderHighlights, pageAssets } from '../../config/pagePresets';
import type { PageContent } from '../../types/content';

export function FounderShowcasePage({ content }: { content: PageContent }) {
  return (
    <section className="founder-page">
      <div className="page-container founder-grid">
        <motion.div animate={{ opacity: 1, scale: 1, y: 0 }} className="founder-portrait-wrap" initial={{ opacity: 0, scale: 0.95, y: 24 }} transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}>
          <div className="founder-portrait-shell">
            <img alt="" className="founder-portrait" src={pageAssets.founderPortrait} />
          </div>
          <div className="founder-floating-tag">Est. 2024</div>
        </motion.div>
        <motion.article animate={{ opacity: 1, y: 0 }} className="glass-panel founder-card" initial={{ opacity: 0, y: 30 }} transition={{ delay: 0.1, duration: 0.9, ease: [0.22, 1, 0.36, 1] }}>
          <span className="eyebrow">{content.eyebrow}</span>
          <h1 className="display-heading founder-heading">{content.title}</h1>
          <p className="hero-summary founder-summary">{content.summary}</p>
          <div className="founder-badges">
            {founderHighlights.map((item) => (
              <div key={item} className="founder-badge">
                <span className="founder-badge-dot" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </motion.article>
      </div>
    </section>
  );
}
