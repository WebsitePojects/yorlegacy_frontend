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
import { useEffect, useRef } from 'react';
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
  const stripRef = useRef<HTMLElement | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const touchYRef = useRef<number | null>(null);

  useEffect(() => {
    const strip = stripRef.current;
    const rail = scrollRef.current;

    if (!strip || !rail) {
      return;
    }

    function canTranslate(deltaY: number) {
      if (!rail) {
        return false;
      }

      const maxScroll = rail.scrollWidth - rail.clientWidth;
      const atStart = rail.scrollLeft <= 0;
      const atEnd = rail.scrollLeft >= maxScroll - 1;

      return (deltaY > 0 && !atEnd) || (deltaY < 0 && !atStart);
    }

    function stageIsLocked() {
      if (!strip) {
        return false;
      }

      const rect = strip.getBoundingClientRect();
      const viewportMid = window.innerHeight * 0.52;

      return rect.top <= viewportMid && rect.bottom >= viewportMid;
    }

    function translateRankRail(deltaY: number, event: WheelEvent | TouchEvent) {
      if (!rail || Math.abs(deltaY) < 1 || !stageIsLocked() || !canTranslate(deltaY)) {
        return false;
      }

      if (event.cancelable) {
        event.preventDefault();
      }

      rail.scrollLeft += deltaY;
      return true;
    }

    function handleWheel(event: WheelEvent) {
      if (!rail || Math.abs(event.deltaY) <= Math.abs(event.deltaX)) {
        return;
      }

      translateRankRail(event.deltaY, event);
    }

    function handleTouchStart(event: TouchEvent) {
      touchYRef.current = event.touches[0]?.clientY ?? null;
    }

    function handleTouchMove(event: TouchEvent) {
      if (!rail || touchYRef.current === null) {
        return;
      }

      const nextY = event.touches[0]?.clientY ?? touchYRef.current;
      const deltaY = touchYRef.current - nextY;

      translateRankRail(deltaY, event);
      touchYRef.current = nextY;
    }

    window.addEventListener('wheel', handleWheel, { passive: false });
    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: false });

    return () => {
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
    };
  }, []);

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
          ref={stripRef}
          animate={{ opacity: 1, y: 0 }}
          className="rank-roadmap-strip"
          initial={{ opacity: 0, y: 28 }}
          transition={{ ...revealTransition, delay: 0.08 }}
        >
          <div className="rank-roadmap-line" />
          <div ref={scrollRef} className="rank-roadmap-scroll">
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
