import { useEffect, useRef, type PropsWithChildren } from 'react';
import { useLocation } from 'react-router-dom';

const protectedPrefixes = ['/member', '/admin', '/cashier', '/bod'];
const nativeScrollRoutes = ['/rank-incentives'];

export function SmoothScrollProvider({ children }: PropsWithChildren) {
  const location = useLocation();
  const lenisRef = useRef<{ destroy: () => void; resize: () => void } | null>(null);
  const refreshRef = useRef<(() => void) | null>(null);
  const isProtectedOffice = protectedPrefixes.some((prefix) => location.pathname.startsWith(prefix));
  const isNativeScrollRoute = nativeScrollRoutes.some((route) => location.pathname.startsWith(route));

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion || isProtectedOffice || isNativeScrollRoute) {
      lenisRef.current?.destroy();
      lenisRef.current = null;
      refreshRef.current = null;
      document.documentElement.classList.remove('has-lenis-scroll');
      return;
    }

    document.documentElement.classList.add('has-lenis-scroll');
    let cancelled = false;
    let teardown = () => {};

    void (async () => {
      const [{ default: Lenis }, { default: gsap }, { ScrollTrigger }] = await Promise.all([
        import('lenis'),
        import('gsap'),
        import('gsap/ScrollTrigger')
      ]);

      if (cancelled) {
        return;
      }

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
      refreshRef.current = () => ScrollTrigger.refresh();

      const refreshId = window.requestAnimationFrame(() => {
        ScrollTrigger.refresh();
      });

      teardown = () => {
        window.cancelAnimationFrame(refreshId);
        lenis.off('scroll', ScrollTrigger.update);
        gsap.ticker.remove(update);
        lenis.destroy();
        lenisRef.current = null;
        refreshRef.current = null;
        document.documentElement.classList.remove('has-lenis-scroll');
        ScrollTrigger.refresh();
      };
    })();

    return () => {
      cancelled = true;
      teardown();
    };
  }, [isNativeScrollRoute, isProtectedOffice]);

  useEffect(() => {
    if (
      isProtectedOffice ||
      isNativeScrollRoute ||
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
  }, [isNativeScrollRoute, isProtectedOffice, location.pathname]);

  return children;
}
