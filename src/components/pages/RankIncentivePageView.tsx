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
import gsap from 'gsap';
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
  const touchStateRef = useRef<{ y: number | null; delta: number }>({ y: null, delta: 0 });
  const currentStepRef = useRef(0);
  const maxStepRef = useRef(0);
  const animatingRef = useRef(false);
  const tweenRef = useRef<gsap.core.Tween | null>(null);

  useEffect(() => {
    const strip = stripRef.current;
    const rail = scrollRef.current;

    if (!strip || !rail) {
      return;
    }

    const currentRail = rail;

    function getSnapState() {
      const cards = Array.from(currentRail.children) as HTMLElement[];
      const stride = cards.length > 1 ? cards[1].offsetLeft - cards[0].offsetLeft : currentRail.clientWidth;
      const safeStride = Math.max(1, stride);
      const visibleCount = Math.max(1, Math.floor((currentRail.clientWidth + safeStride * 0.25) / safeStride));
      const maxStep = Math.max(0, cards.length - visibleCount);
      const maxScroll = Math.max(0, currentRail.scrollWidth - currentRail.clientWidth);

      maxStepRef.current = maxStep;

      return {
        safeStride,
        maxStep,
        maxScroll
      };
    }

    function stageIsLocked() {
      if (!strip) {
        return false;
      }

      const rect = strip.getBoundingClientRect();
      const lockTop = window.innerWidth <= 820 ? window.innerHeight * 0.84 : window.innerHeight * 0.74;
      const lockBottom = window.innerHeight * 0.24;

      return maxStepRef.current > 0 && rect.top <= lockTop && rect.bottom >= lockBottom;
    }

    function syncStepFromScroll() {
      const { safeStride, maxStep } = getSnapState();
      currentStepRef.current = Math.max(0, Math.min(maxStep, Math.round(currentRail.scrollLeft / safeStride)));
    }

    function animateToStep(nextStep: number) {
      const { safeStride, maxScroll } = getSnapState();
      const clampedStep = Math.max(0, Math.min(maxStepRef.current, nextStep));
      const target = Math.min(maxScroll, clampedStep * safeStride);

      tweenRef.current?.kill();
      animatingRef.current = true;
      currentStepRef.current = clampedStep;

      tweenRef.current = gsap.to(currentRail, {
        scrollLeft: target,
        duration: window.innerWidth <= 820 ? 0.42 : 0.55,
        ease: 'power2.out',
        overwrite: true,
        onComplete: () => {
          animatingRef.current = false;
          tweenRef.current = null;
          syncStepFromScroll();
        }
      });
    }

    function stepCards(direction: 1 | -1, event: WheelEvent | TouchEvent) {
      if (!stageIsLocked()) {
        return false;
      }

      if (animatingRef.current) {
        if (event.cancelable) {
          event.preventDefault();
        }
        return true;
      }

      syncStepFromScroll();
      const nextStep = currentStepRef.current + direction;

      if (nextStep < 0 || nextStep > maxStepRef.current) {
        return false;
      }

      if (event.cancelable) {
        event.preventDefault();
      }

      animateToStep(nextStep);
      return true;
    }

    function handleWheel(event: WheelEvent) {
      if (Math.abs(event.deltaY) <= Math.abs(event.deltaX) || Math.abs(event.deltaY) < 22) {
        return;
      }

      const direction = event.deltaY > 0 ? 1 : -1;
      const locked = stepCards(direction, event);

      if (!locked && animatingRef.current && event.cancelable) {
        event.preventDefault();
      }
    }

    function handleTouchStart(event: TouchEvent) {
      touchStateRef.current = {
        y: event.touches[0]?.clientY ?? null,
        delta: 0
      };
    }

    function handleTouchMove(event: TouchEvent) {
      if (touchStateRef.current.y === null) {
        return;
      }

      const nextY = event.touches[0]?.clientY ?? touchStateRef.current.y;
      const deltaY = touchStateRef.current.y - nextY;

      touchStateRef.current = {
        y: nextY,
        delta: touchStateRef.current.delta + deltaY
      };

      if (animatingRef.current && stageIsLocked()) {
        if (event.cancelable) {
          event.preventDefault();
        }
        return;
      }

      if (Math.abs(touchStateRef.current.delta) < 30) {
        return;
      }

      const direction = touchStateRef.current.delta > 0 ? 1 : -1;
      const locked = stepCards(direction, event);

      if (locked) {
        touchStateRef.current.delta = 0;
      }
    }

    function handleTouchEnd() {
      touchStateRef.current = { y: null, delta: 0 };
    }

    syncStepFromScroll();
    window.addEventListener('resize', syncStepFromScroll);
    window.addEventListener('wheel', handleWheel, { passive: false });
    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });
    window.addEventListener('touchcancel', handleTouchEnd, { passive: true });

    return () => {
      tweenRef.current?.kill();
      window.removeEventListener('resize', syncStepFromScroll);
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
      window.removeEventListener('touchcancel', handleTouchEnd);
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
