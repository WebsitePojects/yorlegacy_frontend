import { ArrowRight, ArrowUpRight, Handshake, Sparkles, Wrench } from 'lucide-react';
import { motion } from 'framer-motion';
import { NavLink } from 'react-router-dom';
import { pageAssets } from '../../config/pagePresets';
import type { PageContent } from '../../types/content';
import { InteractiveGlowCanvas } from '../layout/InteractiveGlowCanvas';
import { BackToExperienceLink } from './BackToExperienceLink';

const revealTransition = {
  duration: 0.85,
  ease: [0.22, 1, 0.36, 1]
} as const;

export function SpotlightPage({ content }: { content: PageContent }) {
  if (content.slug === 'vision') {
    return (
      <section className="spotlight-vision-stage">
        <InteractiveGlowCanvas className="spotlight-glow-canvas" />
        <div className="spotlight-vision-watermark">YOR INTERNATIONAL</div>
        <div className="spotlight-vision-glow spotlight-vision-glow-left" />
        <div className="spotlight-vision-glow spotlight-vision-glow-right" />
        <div className="page-container spotlight-vision-shell">
          <BackToExperienceLink />
          <motion.div
            className="spotlight-vision-badge"
            initial={{ opacity: 0, y: 20 }}
            transition={revealTransition}
            viewport={{ amount: 0.4, once: true }}
            whileInView={{ opacity: 1, y: 0 }}
          >
            <Sparkles size={16} />
            <span>The North Star</span>
          </motion.div>

          <motion.h1
            className="spotlight-vision-title"
            initial={{ opacity: 0, y: 24 }}
            transition={{ ...revealTransition, delay: 0.05 }}
            viewport={{ amount: 0.4, once: true }}
            whileInView={{ opacity: 1, y: 0 }}
          >
            Vision
          </motion.h1>

          <motion.article
            className="glass-panel spotlight-vision-card"
            initial={{ opacity: 0, y: 28 }}
            transition={{ ...revealTransition, delay: 0.1 }}
            viewport={{ amount: 0.3, once: true }}
            whileInView={{ opacity: 1, y: 0 }}
          >
            <div className="spotlight-vision-accent" />
            <p>{content.summary}</p>
          </motion.article>

          <motion.div
            initial={{ opacity: 0, y: 28 }}
            transition={{ ...revealTransition, delay: 0.14 }}
            viewport={{ amount: 0.3, once: true }}
            whileInView={{ opacity: 1, y: 0 }}
          >
            <NavLink className="spotlight-inline-cta" to={content.ctaHref ?? '/mission'}>
              {content.ctaLabel ?? 'Explore Mission'}
              <ArrowRight size={16} />
            </NavLink>
          </motion.div>
        </div>
      </section>
    );
  }

  if (content.slug === 'mission') {
    const missionNodes = [
      { label: 'Connect', icon: Handshake },
      { label: 'Equip', icon: Wrench },
      { label: 'Empower', icon: Sparkles }
    ];

    return (
      <section className="spotlight-mission-stage">
        <InteractiveGlowCanvas className="spotlight-glow-canvas" />
        <div className="spotlight-mission-overlay" />
        <div className="page-container spotlight-mission-shell">
          <BackToExperienceLink />
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            transition={revealTransition}
            viewport={{ amount: 0.4, once: true }}
            whileInView={{ opacity: 1, y: 0 }}
          >
            <span className="eyebrow">{content.eyebrow}</span>
            <h1 className="spotlight-mission-title">Mission</h1>
          </motion.div>

          <motion.article
            className="glass-panel spotlight-mission-card"
            initial={{ opacity: 0, y: 28 }}
            transition={{ ...revealTransition, delay: 0.08 }}
            viewport={{ amount: 0.3, once: true }}
            whileInView={{ opacity: 1, y: 0 }}
          >
            <div className="spotlight-mission-accent" />
            <p>{content.summary}</p>
            <div className="spotlight-mission-nodes">
              {missionNodes.map(({ label, icon: Icon }) => (
                <div key={label} className="spotlight-mission-node">
                  <div className="spotlight-mission-node-icon">
                    <Icon size={18} />
                  </div>
                  <span>{label}</span>
                </div>
              ))}
            </div>
          </motion.article>
        </div>
      </section>
    );
  }

  if (content.slug === 'thank-you') {
    return (
      <section className="spotlight-thankyou-stage">
        <div className="spotlight-thankyou-backdrop">
          <img alt="" src={pageAssets.coverSkyline} />
        </div>
        <div className="spotlight-thankyou-overlay" />
        <div className="spotlight-thankyou-glow" />
        <div className="page-container spotlight-thankyou-shell">
          <motion.p
            className="spotlight-thankyou-kicker"
            initial={{ opacity: 0, y: 20 }}
            transition={revealTransition}
            viewport={{ amount: 0.5, once: true }}
            whileInView={{ opacity: 1, y: 0 }}
          >
            To God be the glory
          </motion.p>
          <motion.h1
            className="spotlight-thankyou-title"
            initial={{ opacity: 0, y: 24 }}
            transition={{ ...revealTransition, delay: 0.06 }}
            viewport={{ amount: 0.5, once: true }}
            whileInView={{ opacity: 1, y: 0 }}
          >
            Thank You
          </motion.h1>
          <motion.div
            className="spotlight-thankyou-brand"
            initial={{ opacity: 0, y: 24 }}
            transition={{ ...revealTransition, delay: 0.12 }}
            viewport={{ amount: 0.5, once: true }}
            whileInView={{ opacity: 1, y: 0 }}
          >
            <strong>Yor International</strong>
            <div className="spotlight-thankyou-rule" />
            <span>Build your legacy with confidence.</span>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 28 }}
            transition={{ ...revealTransition, delay: 0.18 }}
            viewport={{ amount: 0.4, once: true }}
            whileInView={{ opacity: 1, y: 0 }}
          >
            <NavLink className="site-cta spotlight-thankyou-cta" to={content.ctaHref ?? '/earn'}>
              {content.ctaLabel ?? 'Start Your Legacy Today'}
              <ArrowUpRight size={16} />
            </NavLink>
          </motion.div>
        </div>
      </section>
    );
  }

  return null;
}
