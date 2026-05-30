import { ArrowRight, Mars, Venus } from 'lucide-react';
import { motion } from 'framer-motion';
import { NavLink } from 'react-router-dom';
import { collectionProducts } from '../../config/pagePresets';
import type { PageContent } from '../../types/content';

const revealTransition = {
  duration: 0.85,
  ease: [0.22, 1, 0.36, 1]
} as const;

export function CollectionPageView({ content }: { content: PageContent }) {
  const menProducts = collectionProducts.filter((product) => product.accent === 'For Men');
  const womenProducts = collectionProducts.filter((product) => product.accent === 'For Women');

  return (
    <section className="collection-page-stage">
      <div className="collection-page-glow collection-page-glow-left" />
      <div className="collection-page-glow collection-page-glow-right" />
      <div className="page-container">
        <motion.header
          className="collection-page-header"
          initial={{ opacity: 0, y: 24 }}
          transition={revealTransition}
          viewport={{ amount: 0.4, once: true }}
          whileInView={{ opacity: 1, y: 0 }}
        >
          <h1 className="collection-page-title">Yor Perfume</h1>
          <p className="collection-page-subtitle">The scent of legacy</p>
          <div className="collection-page-rule" />
        </motion.header>

        <div className="collection-page-grid">
          <motion.section
            className="collection-column"
            initial={{ opacity: 0, y: 28 }}
            transition={revealTransition}
            viewport={{ amount: 0.2, once: true }}
            whileInView={{ opacity: 1, y: 0 }}
          >
            <div className="collection-column-header">
              <Mars size={18} />
              <h2>For Men</h2>
              <div className="collection-column-line" />
            </div>
            <div className="collection-list">
              {menProducts.map((product) => (
                <article className="glass-panel collection-list-card" key={product.code}>
                  <div className="collection-list-copy">
                    <code>{product.code}</code>
                    <span>{product.title}</span>
                  </div>
                  <ArrowRight size={16} />
                </article>
              ))}
            </div>
          </motion.section>

          <motion.section
            className="collection-column"
            initial={{ opacity: 0, y: 28 }}
            transition={{ ...revealTransition, delay: 0.06 }}
            viewport={{ amount: 0.2, once: true }}
            whileInView={{ opacity: 1, y: 0 }}
          >
            <div className="collection-column-header collection-column-header-secondary">
              <Venus size={18} />
              <h2>For Women</h2>
              <div className="collection-column-line" />
            </div>
            <div className="collection-list">
              {womenProducts.map((product) => (
                <article className="glass-panel collection-list-card collection-list-card-secondary" key={product.code}>
                  <div className="collection-list-copy">
                    <code>{product.code}</code>
                    <span>{product.title}</span>
                  </div>
                  <ArrowRight size={16} />
                </article>
              ))}
            </div>
          </motion.section>
        </div>

        <motion.section
          className="glass-panel collection-cta-panel"
          initial={{ opacity: 0, y: 28 }}
          transition={{ ...revealTransition, delay: 0.1 }}
          viewport={{ amount: 0.2, once: true }}
          whileInView={{ opacity: 1, y: 0 }}
        >
          <h3>{content.title}</h3>
          <p>{content.summary}</p>
          <div className="collection-cta-actions">
            <NavLink className="site-cta" to="/packages">
              Order Catalogue
            </NavLink>
            <NavLink className="ghost-link" to={content.ctaHref ?? '/packages'}>
              Become a distributor
            </NavLink>
          </div>
        </motion.section>
      </div>
    </section>
  );
}
