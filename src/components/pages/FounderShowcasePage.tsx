import { ArrowRight, BriefcaseBusiness, GraduationCap, HeartHandshake, Trophy, UserRoundCheck, Users } from 'lucide-react';
import { motion } from 'framer-motion';
import { NavLink } from 'react-router-dom';
import { founderHighlights, founderProfile, pageAssets } from '../../config/pagePresets';
import type { PageContent } from '../../types/content';

const founderIcons = [
  BriefcaseBusiness,
  UserRoundCheck,
  Users,
  HeartHandshake,
  Trophy,
  Trophy,
  GraduationCap
] as const;

const revealTransition = {
  duration: 0.85,
  ease: [0.22, 1, 0.36, 1]
} as const;

export function FounderShowcasePage({ content }: { content: PageContent }) {
  return (
    <section className="founder-page-stage">
      <div className="page-container">
        <motion.div
          className="founder-page-label"
          initial={{ opacity: 0, y: 20 }}
          transition={revealTransition}
          viewport={{ amount: 0.4, once: true }}
          whileInView={{ opacity: 1, y: 0 }}
        >
          <span>{founderProfile.eyebrow}</span>
          <div className="founder-page-rule" />
        </motion.div>

        <div className="founder-page-grid">
          <motion.figure
            className="founder-page-portrait-wrap"
            initial={{ opacity: 0, y: 28, scale: 0.96 }}
            transition={revealTransition}
            viewport={{ amount: 0.2, once: true }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
          >
            <div className="founder-page-portrait-shell">
              <img alt={content.title} className="founder-page-portrait" src={pageAssets.founderPortrait} />
            </div>
            <div className="founder-page-tag">Est. 2024</div>
          </motion.figure>

          <motion.article
            className="glass-panel founder-page-card"
            initial={{ opacity: 0, y: 28 }}
            transition={{ ...revealTransition, delay: 0.08 }}
            viewport={{ amount: 0.2, once: true }}
            whileInView={{ opacity: 1, y: 0 }}
          >
            <div className="founder-page-accent" />
            <span className="founder-page-pill">{founderProfile.badge}</span>
            <h1 className="founder-page-name">{content.title}</h1>
            <p className="founder-page-summary">{content.summary}</p>
            <div className="founder-page-features">
              {founderHighlights.map((item, index) => {
                const Icon = founderIcons[index] ?? BriefcaseBusiness;

                return (
                  <div key={item} className="founder-page-feature">
                    <Icon size={16} />
                    <span>{item}</span>
                  </div>
                );
              })}
            </div>
            <NavLink className="founder-page-story-link" to={content.ctaHref ?? founderProfile.ctaHref}>
              {content.ctaLabel ?? founderProfile.ctaLabel}
              <ArrowRight size={16} />
            </NavLink>
          </motion.article>
        </div>
      </div>
    </section>
  );
}
