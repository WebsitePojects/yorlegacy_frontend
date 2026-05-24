import { motion } from 'framer-motion';
import type { PageContent } from '../../types/content';

export function SpotlightPage({ content }: { content: PageContent }) {
  return (
    <section className="spotlight-page">
      <div className="page-container">
        <motion.div animate={{ opacity: 1, y: 0 }} className="spotlight-header" initial={{ opacity: 0, y: 24 }} transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1] }}>
          <span className="eyebrow">{content.eyebrow}</span>
          <h1 className="display-heading">{content.title}</h1>
        </motion.div>
        <motion.article animate={{ opacity: 1, y: 0 }} className="glass-panel spotlight-card" initial={{ opacity: 0, y: 30 }} transition={{ delay: 0.1, duration: 0.85, ease: [0.22, 1, 0.36, 1] }}>
          <p className="spotlight-copy">{content.summary}</p>
          {content.highlights?.length ? (
            <div className="spotlight-nodes">
              {content.highlights.map((highlight) => (
                <div key={highlight.title} className="spotlight-node">
                  <div className="spotlight-node-icon" />
                  <span>{highlight.title}</span>
                </div>
              ))}
            </div>
          ) : null}
        </motion.article>
      </div>
    </section>
  );
}
