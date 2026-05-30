import { Check, Crown } from 'lucide-react';
import { motion } from 'framer-motion';
import { NavLink } from 'react-router-dom';
import { packageTiers } from '../../config/pagePresets';
import type { PageContent } from '../../types/content';

const revealTransition = {
  duration: 0.85,
  ease: [0.22, 1, 0.36, 1]
} as const;

export function PackagesPageView({ content }: { content: PageContent }) {
  return (
    <section className="packages-page-stage">
      <div className="page-container">
        <motion.header
          className="packages-page-header"
          initial={{ opacity: 0, y: 24 }}
          transition={revealTransition}
          viewport={{ amount: 0.4, once: true }}
          whileInView={{ opacity: 1, y: 0 }}
        >
          <h1 className="packages-page-title">Entry Packages</h1>
          <p className="packages-page-summary">{content.summary}</p>
        </motion.header>

        <div className="packages-tier-grid">
          {packageTiers.map((tier, index) => (
            <motion.article
              className={[
                'glass-panel package-tier-card',
                tier.featured ? 'is-featured' : '',
                tier.vip ? 'is-vip' : ''
              ].filter(Boolean).join(' ')}
              initial={{ opacity: 0, y: 28 }}
              key={tier.name}
              transition={{ ...revealTransition, delay: index * 0.05 }}
              viewport={{ amount: 0.2, once: true }}
              whileInView={{ opacity: 1, y: 0 }}
            >
              {tier.vip ? (
                <div className="package-tier-crown">
                  <Crown size={16} />
                </div>
              ) : null}
              {tier.featured ? <span className="package-tier-ribbon">Popular Choice</span> : null}
              <span className="package-tier-label">{tier.label}</span>
              <span className="package-tier-pv">{tier.pv}</span>
              <h2>{tier.name}</h2>
              <strong className="package-tier-price">{tier.price}</strong>
              <ul className="package-tier-features">
                {tier.features.map((feature) => (
                  <li key={feature}>
                    <Check size={15} />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <NavLink className={tier.featured || tier.vip ? 'site-cta package-tier-cta' : 'ghost-link package-tier-cta'} to={content.ctaHref ?? '/register'}>
                Join Now
              </NavLink>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}
