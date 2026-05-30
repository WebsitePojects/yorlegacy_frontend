import {
  Activity,
  ArrowLeft,
  Award,
  BadgeCheck,
  Building2,
  CarFront,
  CircleDollarSign,
  Gem,
  Plane,
  Shield,
  Smartphone,
  Star,
  Trophy,
  Wallet
} from 'lucide-react';
import { motion } from 'framer-motion';
import { NavLink } from 'react-router-dom';
import { rankIncentiveBenefits, rankIncentiveRoadmap } from '../../config/pagePresets';
import type { PageContent } from '../../types/content';
import { AmbientEmbers } from '../layout/AmbientEmbers';
import { OrnateCorners } from '../layout/OrnateCorners';

const revealTransition = {
  duration: 0.85,
  ease: [0.22, 1, 0.36, 1]
} as const;

const rankIcons = [Award, Shield, Gem, Star, BadgeCheck, Trophy] as const;
const rewardIcons = [Smartphone, CarFront, Plane, CarFront, CircleDollarSign, Building2] as const;
const benefitIcons = [Activity, Wallet, Building2] as const;

export function RankIncentivePageView({ content }: { content: PageContent }) {
  return (
    <section className="rank-roadmap-stage">
      <AmbientEmbers />
      <OrnateCorners />
      <div className="page-gradient" />
      <div className="page-container">
        <motion.div
          animate={{ opacity: 1, y: 0 }}
          className="rank-roadmap-head"
          initial={{ opacity: 0, y: 24 }}
          transition={revealTransition}
        >
          <NavLink className="rank-roadmap-back" to="/earn">
            <ArrowLeft size={16} />
            Back to Earnings
          </NavLink>

          <div className="rank-roadmap-heading">
            <span className="rank-roadmap-kicker">{content.eyebrow}</span>
            <h1 className="display-heading">{content.title}</h1>
            <p className="hero-summary">{content.summary}</p>
          </div>
        </motion.div>

        <motion.section
          animate={{ opacity: 1, y: 0 }}
          className="rank-roadmap-strip"
          initial={{ opacity: 0, y: 28 }}
          transition={{ ...revealTransition, delay: 0.08 }}
        >
          <div className="rank-roadmap-line" />
          <div className="rank-roadmap-scroll">
            {rankIncentiveRoadmap.map((item, index) => {
              const RankIcon = rankIcons[index] ?? Award;
              const RewardIcon = rewardIcons[index] ?? Trophy;

              return (
                <motion.article
                  key={item.rank}
                  animate={{ opacity: 1, y: 0 }}
                  className={`glass-panel rank-roadmap-card rank-roadmap-card--${item.accent}`}
                  initial={{ opacity: 0, y: 28 }}
                  transition={{ ...revealTransition, delay: 0.12 + index * 0.05 }}
                >
                  <div className="rank-roadmap-card-icon">
                    <RankIcon size={22} />
                  </div>
                  <span className="rank-roadmap-rank">{item.rank}</span>
                  <strong className="rank-roadmap-target">{item.target}</strong>
                  <div className="rank-roadmap-divider" />
                  <div className="rank-roadmap-reward">
                    <RewardIcon size={18} />
                    <span>{item.reward}</span>
                  </div>
                </motion.article>
              );
            })}
          </div>
        </motion.section>

        <motion.section
          animate={{ opacity: 1, y: 0 }}
          className="glass-panel rank-roadmap-benefits"
          initial={{ opacity: 0, y: 28 }}
          transition={{ ...revealTransition, delay: 0.22 }}
        >
          {rankIncentiveBenefits.map((benefit, index) => {
            const BenefitIcon = benefitIcons[index] ?? Activity;

            return (
              <article key={benefit.title} className="rank-roadmap-benefit">
                <div className="rank-roadmap-benefit-icon">
                  <BenefitIcon size={18} />
                </div>
                <h2>{benefit.title}</h2>
                <p>{benefit.body}</p>
              </article>
            );
          })}
        </motion.section>
      </div>
    </section>
  );
}
