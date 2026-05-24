import { motion } from 'framer-motion';
import { packageTiers } from '../../config/pagePresets';
import type { PageContent } from '../../types/content';

export function PackagesPageView({ content }: { content: PageContent }) {
  return (
    <section className="page-template">
      <div className="page-container">
        <motion.div animate={{ opacity: 1, y: 0 }} className="packages-header" initial={{ opacity: 0, y: 24 }} transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1] }}>
          <span className="eyebrow">{content.eyebrow}</span>
          <h1 className="display-heading">{content.title}</h1>
          <p className="hero-summary">{content.summary}</p>
        </motion.div>
        <section className="packages-grid">
          {packageTiers.map((tier, index) => (
            <motion.article key={tier.name} animate={{ opacity: 1, y: 0 }} className={tier.vip ? 'glass-panel package-card package-card-vip' : tier.featured ? 'glass-panel package-card package-card-featured' : 'glass-panel package-card'} initial={{ opacity: 0, y: 28 }} transition={{ delay: index * 0.06, duration: 0.82, ease: [0.22, 1, 0.36, 1] }}>
              <span className="package-label">{tier.label}</span>
              <span className="package-pv">{tier.pv}</span>
              <h2>{tier.name}</h2>
              <strong className="package-price">{tier.price}</strong>
              <ul>
                {tier.features.map((feature) => (
                  <li key={feature}>{feature}</li>
                ))}
              </ul>
              <button className="site-cta package-button" type="button">Join Now</button>
            </motion.article>
          ))}
        </section>
      </div>
    </section>
  );
}
