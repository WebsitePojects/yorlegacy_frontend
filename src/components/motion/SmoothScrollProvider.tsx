import { useEffect, useRef, type PropsWithChildren } from 'react';
import { useLocation } from 'react-router-dom';
import Lenis from 'lenis';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

const protectedPrefixes = ['/member', '/admin', '/cashier', '/bod'];
const utilityRoutes = ['/login', '/register', '/thank-you'];

export function SmoothScrollProvider({ children }: PropsWithChildren) {
  const location = useLocation();
  const lenisRef = useRef<Lenis | null>(null);
  const refreshRef = useRef<(() => void) | null>(null);
  const isProtectedOffice = protectedPrefixes.some((prefix) => location.pathname.startsWith(prefix));
  const isUtilityRoute = utilityRoutes.some((route) => location.pathname.startsWith(route));

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion || isProtectedOffice || isUtilityRoute) {
      lenisRef.current?.destroy();
      lenisRef.current = null;
      refreshRef.current = null;
      document.documentElement.classList.remove('has-lenis-scroll');
      return;
    }

    document.documentElement.classList.add('has-lenis-scroll');
    gsap.registerPlugin(ScrollTrigger);

    const lenis = new Lenis({
      autoRaf: false,
      anchors: {
        offset: 110
      },
      duration: 1.15,
      lerp: 0.08,
      syncTouch: false,
      wheelMultiplier: 0.92
    });

    const update = (time: number) => {
      lenis.raf(time * 1000);
    };

    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(update);
    gsap.ticker.lagSmoothing(0);
    lenisRef.current = lenis;
    (window as any).lenis = lenis;
    refreshRef.current = () => ScrollTrigger.refresh();

    const refreshId = window.requestAnimationFrame(() => {
      ScrollTrigger.refresh();
    });

    return () => {
      window.cancelAnimationFrame(refreshId);
      lenis.off('scroll', ScrollTrigger.update);
      gsap.ticker.remove(update);
      lenis.destroy();
      lenisRef.current = null;
      (window as any).lenis = null;
      refreshRef.current = null;
      document.documentElement.classList.remove('has-lenis-scroll');
      ScrollTrigger.refresh();
    };
  }, [isProtectedOffice, isUtilityRoute]);

  useEffect(() => {
    if (
      isProtectedOffice ||
      isUtilityRoute ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      return;
    }

    const refreshId = window.requestAnimationFrame(() => {
      lenisRef.current?.resize();
      refreshRef.current?.();
    });

    return () => {
      window.cancelAnimationFrame(refreshId);
    };
  }, [isProtectedOffice, isUtilityRoute, location.pathname]);

  return children;
}
