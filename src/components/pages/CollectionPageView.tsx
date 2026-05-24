import { motion } from 'framer-motion';
import { collectionProducts } from '../../config/pagePresets';
import type { PageContent } from '../../types/content';

export function CollectionPageView({ content }: { content: PageContent }) {
  return (
    <section className="page-template">
      <div className="page-container">
        <motion.div animate={{ opacity: 1, y: 0 }} className="hero-copy" initial={{ opacity: 0, y: 24 }} transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1] }}>
          <span className="eyebrow">{content.eyebrow}</span>
          <h1 className="display-heading">{content.title}</h1>
          <p className="hero-summary">{content.summary}</p>
        </motion.div>
        <section className="collection-grid">
          {collectionProducts.map((product, index) => (
            <motion.article key={product.code} animate={{ opacity: 1, y: 0 }} className="glass-panel collection-card" initial={{ opacity: 0, y: 32 }} transition={{ delay: 0.08 * index, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}>
              <div className="collection-bottle" />
              <span className="eyebrow">{product.accent}</span>
              <h2>{product.title}</h2>
              <p>{product.note}</p>
              <code>{product.code}</code>
            </motion.article>
          ))}
        </section>
      </div>
    </section>
  );
}
