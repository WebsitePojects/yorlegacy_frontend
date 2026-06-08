import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import {
  ArrowRight,
  ChevronDown,
  Check,
  Mail,
  Award,
  Globe,
  Menu,
  X,
  Sparkles,
  Handshake,
  Wrench,
  Mars,
  Venus,
  BriefcaseBusiness,
  GraduationCap,
  HeartHandshake,
  Trophy,
  UserRoundCheck,
  Users
} from 'lucide-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import type { PageContent } from '../../types/content';
import { YorBrandMark } from '../branding/YorBrandMark';
import { earnRoutes } from '../../config/navigation';
import { founderProfile, founderHighlights, collectionProducts, featuredCollectionShowcase } from '../../config/pagePresets';
import './HomeExperiencePage.css';

if (!import.meta.env.TEST) {
  gsap.registerPlugin(ScrollTrigger);
}

const sceneDefinitions = [
  { id: 2, count: 105, path: '/assets/scene2_perfume' }
] as const;

const packageDetails = [
  {
    tier: 'basic',
    label: 'Basic Package',
    price: 'PHP 1,998',
    pv: 'PV-5',
    referral: 'PHP 200 Referral',
    desc: 'Perfect for starters. Grants lifetime reseller privilege with up to 40% margin on all fragrance lines and ocular wellness drops.',
    img: '/assets/yor/generated/yor_vision_productpic.jpg'
  },
  {
    tier: 'classic',
    label: 'Classic Package',
    price: 'PHP 5,998',
    pv: 'PV-10',
    referral: 'PHP 1,000 Referral',
    desc: 'Grants enhanced volume options and standard network matching eligibility, with immediate personal usage products.',
    img: '/assets/yor/generated/yor_vision_productpic.jpg'
  },
  {
    tier: 'standard',
    label: 'Standard Package',
    price: 'PHP 25,998',
    pv: 'PV-50',
    referral: 'PHP 5,000 Referral',
    desc: 'The professional choice. Substantial product packages for rapid local retailing and deeper salesmatch bonus overrides.',
    img: '/assets/yor/generated/yor_vision_productpic.jpg'
  },
  {
    tier: 'business',
    label: 'Business Package',
    price: 'PHP 50,998',
    pv: 'PV-100',
    referral: 'PHP 7,000 Referral',
    desc: 'Unlocks higher weekly salesmatch caps and accelerated team leadership rank qualification streams.',
    img: '/assets/yor/generated/yor_vision_productpic.jpg'
  },
  {
    tier: 'vip',
    label: 'VIP Legacy Package',
    price: 'PHP 159,998',
    pv: 'PV-300',
    referral: 'PHP 15,000 Referral',
    desc: 'The ultimate enterprise tier. Maximum salesmatch caps, elite Lifestyle Rewards multipliers, and direct Millionaires Circle pathways.',
    img: '/assets/yor/generated/yor_vision_productpic.jpg'
  }
] as const;

const packageRows = [
  { tier: 'basic', label: 'Basic', price: 'PHP 1,998', pv: 'PV-5', referral: 'PHP 200' },
  { tier: 'classic', label: 'Classic', price: 'PHP 5,998', pv: 'PV-10', referral: 'PHP 1,000' },
  { tier: 'standard', label: 'Standard', price: 'PHP 25,998', pv: 'PV-50', referral: 'PHP 5,000' },
  { tier: 'business', label: 'Business', price: 'PHP 50,998', pv: 'PV-100', referral: 'PHP 7,000' },
  { tier: 'vip', label: 'VIP Legacy', price: 'PHP 159,998', pv: 'PV-300', referral: 'PHP 15,000' }
] as const;

const earningCards = [
  {
    className: 'card-item-1',
    number: '01',
    href: earnRoutes[0].href,
    title: 'Direct Selling',
    body: 'Earn immediate retail margins up to 25% by sharing YOR Fragrances.'
  },
  {
    className: 'card-item-2',
    number: '02',
    href: earnRoutes[1].href,
    title: 'Direct Referral',
    body: 'Receive immediate sponsor bonuses from PHP 200 up to PHP 15,000 per slot.'
  },
  {
    className: 'card-item-3',
    number: '03',
    href: earnRoutes[2].href,
    title: 'Salesmatch Bonus',
    body: 'Gain overrides on balanced leg volume. Tuesday encashment, Friday payouts.'
  },
  {
    className: 'card-item-4',
    number: '04',
    href: earnRoutes[3].href,
    title: 'Binary Cycle Bonus',
    body: 'Earn recurring cycle percentage points down to infinity as placement volume grows.'
  },
  {
    className: 'card-item-5',
    number: '05',
    href: earnRoutes[4].href,
    title: 'Get Yor Five Bonus',
    body: 'Special bonuses unlocked for every 5 personal enrollments on the same package tier.'
  },
  {
    className: 'card-item-6',
    number: '06',
    href: earnRoutes[5].href,
    title: 'Lifestyle Rewards',
    body: 'Gain credits for luxury vehicles, gadget upgrades, and dream travel incentives.'
  },
  {
    className: 'card-item-7',
    number: '07',
    href: earnRoutes[6].href,
    title: 'Unilevel Bonus',
    body: 'Residual percentage overrides on monthly repeat product orders up to 10 levels deep.'
  },
  {
    className: 'card-item-8',
    number: '08',
    href: earnRoutes[7].href,
    title: 'Global Bonus',
    body: 'Elite share of a 2% yearly global pool representing worldwide company sales.'
  }
] as const;

function getExperienceProfile() {
  if (typeof window === 'undefined') {
    return { frameStep: 2, isLite: false };
  }

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isCoarsePointer = window.matchMedia('(pointer: coarse)').matches;
  const isSmallViewport = window.matchMedia('(max-width: 768px)').matches;
  const isLite = reducedMotion || isCoarsePointer || isSmallViewport;

  if (reducedMotion) {
    return { frameStep: 12, isLite };
  }

  return { frameStep: isLite ? 6 : 2, isLite };
}

function createSceneFrameUrls(scene: (typeof sceneDefinitions)[number], frameStep: number) {
  const urls: string[] = [];

  for (let frame = 1; frame <= scene.count; frame += frameStep) {
    urls.push(`${scene.path}/ezgif-frame-${String(frame).padStart(3, '0')}.png`);
  }

  if (!urls.includes(`${scene.path}/ezgif-frame-${String(scene.count).padStart(3, '0')}.png`)) {
    urls.push(`${scene.path}/ezgif-frame-${String(scene.count).padStart(3, '0')}.png`);
  }

  return urls;
}

export function HomeExperiencePage({ content }: { content: PageContent }) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const location = useLocation();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [activeSection, setActiveSection] = useState(0);
  const [activeOverlay, setActiveOverlay] = useState<string | null>(null);
  const [accordionTab, setAccordionTab] = useState<'packages' | 'ranks'>('packages');
  const [activeAccordionIndex, setActiveAccordionIndex] = useState<number>(0);
  const [liteExperience, setLiteExperience] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showPerfumeCanvas, setShowPerfumeCanvas] = useState(false);

  // Scroll hijack and auto-scroll control references
  const transitionTriggered = useRef(false);
  const isTransitioning = useRef(false);
  const triggerTransitionRef = useRef<(() => void) | null>(null);




  // Cache image refs to prevent garbage collection and allow instant rendering
  const scene2Images = useRef<HTMLImageElement[]>([]);

  // Track currently drawn frame to prevent double rendering
  const lastDrawnScene = useRef<number>(2);
  const lastDrawnFrame = useRef<number>(-1);
  const pendingDraw = useRef<number | null>(null);
  const pendingScene = useRef<number>(2);
  const pendingFrame = useRef<number>(0);

  // Mathematical "object-fit: cover" rendering on 2D canvas context
  const drawFrame = useCallback((sceneId: number, frameIndex: number, force = false) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = scene2Images.current[frameIndex];

    if (!img || !img.complete) return;

    if (!force && lastDrawnScene.current === sceneId && lastDrawnFrame.current === frameIndex) {
      return;
    }

    lastDrawnScene.current = sceneId;
    lastDrawnFrame.current = frameIndex;

    const imgWidth = img.width;
    const imgHeight = img.height;
    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;

    const imgRatio = imgWidth / imgHeight;
    const canvasRatio = canvasWidth / canvasHeight;

    let drawWidth = canvasWidth;
    let drawHeight = canvasHeight;
    let drawX = 0;
    let drawY = 0;

    if (canvasRatio > imgRatio) {
      drawHeight = canvasWidth / imgRatio;
      drawY = (canvasHeight - drawHeight) / 2;
    } else {
      drawWidth = canvasHeight * imgRatio;
      drawX = (canvasWidth - drawWidth) / 2;
    }

    ctx.clearRect(0, 0, canvasWidth, canvasHeight);
    ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);
  }, []);

  const scheduleDrawFrame = useCallback((sceneId: number, frameIndex: number) => {
    pendingScene.current = sceneId;
    pendingFrame.current = frameIndex;

    if (pendingDraw.current !== null) {
      return;
    }

    pendingDraw.current = window.requestAnimationFrame(() => {
      pendingDraw.current = null;
      drawFrame(pendingScene.current, pendingFrame.current);
    });
  }, [drawFrame]);

  // Preloader Engine
  useEffect(() => {
    const { frameStep, isLite } = getExperienceProfile();
    setLiteExperience(isLite);

    let cancelled = false;
    let loadedCount = 0;
    let progressFrame: number | null = null;
    const frameUrlGroups = sceneDefinitions.map((scene) => createSceneFrameUrls(scene, frameStep));
    const totalFrames = frameUrlGroups.reduce((total, urls) => total + urls.length, 0);

    const queueProgressUpdate = () => {
      if (progressFrame !== null) {
        return;
      }

      progressFrame = window.requestAnimationFrame(() => {
        progressFrame = null;
        setProgress(Math.round((loadedCount / totalFrames) * 100));
      });
    };

    const preloadImage = (src: string): Promise<HTMLImageElement> => {
      return new Promise((resolve) => {
        const img = new Image();
        img.decoding = 'async';
        img.src = src;
        img.onload = () => {
          loadedCount++;
          queueProgressUpdate();
          resolve(img);
        };
        img.onerror = () => {
          loadedCount++;
          queueProgressUpdate();
          resolve(img);
        };
      });
    };

    const loadImageBatch = async (urls: string[], concurrency = 8) => {
      const images = new Array<HTMLImageElement>(urls.length);
      let cursor = 0;

      async function worker() {
        while (!cancelled && cursor < urls.length) {
          const index = cursor;
          cursor++;
          images[index] = await preloadImage(urls[index]);
        }
      }

      await Promise.all(Array.from({ length: Math.min(concurrency, urls.length) }, worker));
      return images;
    };

    const loadAllAssets = async () => {
      const [s2] = await Promise.all([
        loadImageBatch(frameUrlGroups[0])
      ]);

      if (cancelled) {
        return;
      }

      scene2Images.current = s2;

      // Small delay before showing page
      setTimeout(() => {
        setLoading(false);
      }, 180);
    };

    loadAllAssets();

    return () => {
      cancelled = true;
      if (progressFrame !== null) {
        window.cancelAnimationFrame(progressFrame);
      }
    };
  }, []);



  // Sync route path to scroll position for single-page experience
  useEffect(() => {
    if (loading) return;

    const path = location.pathname;
    
    // Reset active overlay state to null
    setActiveOverlay(null);

    // Map path to section selector
    let selector = '';
    if (path === '/founder') {
      selector = '#scene-founder';
    } else if (path === '/vision' || path === '/mission') {
      selector = '#scene-vision-mission';
    } else if (path === '/packages') {
      selector = '#scene-packages-accordion';
    } else if (path === '/products' || path === '/perfume-collection') {
      selector = '#scene-products-showcase';
    }

    if (selector) {
      // Delay slightly to allow Lenis/layout to settle
      const timeout = setTimeout(() => {
        scrollToAnchor(selector);
      }, 300);
      return () => clearTimeout(timeout);
    }
  }, [location.pathname, loading]);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    document.body.style.overflow = mobileMenuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileMenuOpen]);

  useEffect(() => {
    const { body } = document;
    const html = document.documentElement;

    if (!activeOverlay) {
      body.style.overflow = '';
      html.style.overflow = '';
      return;
    }

    body.style.overflow = 'hidden';
    html.style.overflow = 'hidden';

    return () => {
      body.style.overflow = '';
      html.style.overflow = '';
    };
  }, [activeOverlay]);

  const closeOverlay = () => {
    navigate('/');
  };

  // Scroll Trigger Timelines & Video Hijack
  useLayoutEffect(() => {
    if (loading) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const sizeCanvas = () => {
      const pixelRatio = liteExperience ? 1 : Math.min(window.devicePixelRatio || 1, 1.5);
      canvas.width = Math.round(window.innerWidth * pixelRatio);
      canvas.height = Math.round(window.innerHeight * pixelRatio);
    };

    sizeCanvas();

    // Draw initial perfume canvas frame (Scene 2)
    drawFrame(2, 0, true);

    let startTouchY = 0;

    const handleTouchStart = (e: TouchEvent) => {
      startTouchY = e.touches[0].clientY;
    };

    // Block all scrolling (wheel, touch, keys) while transitioning
    const blockScroll = (e: Event) => {
      if (isTransitioning.current) {
        if (e.cancelable) {
          e.preventDefault();
        }
      }
    };

    let triggerTransition: () => void;

    const ctx = gsap.context(() => {});

    triggerTransition = () => {
      if (transitionTriggered.current || isTransitioning.current) return;

      isTransitioning.current = true;
      transitionTriggered.current = true;

      // Lock scrolling via Lenis
      const lenis = (window as any).lenis;
      if (lenis) {
        lenis.stop();
        lenis.scrollTo(0, { immediate: true });
      }

      // Immediately reset and lock document scroll to top
      window.scrollTo(0, 0);
      document.body.classList.add('story-scroll-locked');
      document.documentElement.classList.add('story-scroll-locked');

      // Add active scroll blockers
      window.addEventListener('wheel', blockScroll, { passive: false });
      window.addEventListener('touchmove', blockScroll, { passive: false });
      window.addEventListener('keydown', blockScroll, { passive: false });

      // Immersive brief delay (0.3s) before video play and split animations
      gsap.delayedCall(0.3, () => {
        // Double check scroll is locked at top
        window.scrollTo(0, 0);

        const video = videoRef.current;
        if (video) {
          video.currentTime = 0;
          video.playbackRate = 1.5; // Make the video 1.5x faster
          video.play().catch((err) => {
            console.warn("Video playback blocked or failed:", err);
          });
        }

        const playDuration = video ? (video.duration / 1.5) : 2.6;

        ctx.add(() => {
          const tl = gsap.timeline({
            onComplete: () => {
              isTransitioning.current = false;
              window.removeEventListener('wheel', blockScroll);
              window.removeEventListener('touchmove', blockScroll);
              window.removeEventListener('keydown', blockScroll);
              
              // Remove scroll lock classes
              document.body.classList.remove('story-scroll-locked');
              document.documentElement.classList.remove('story-scroll-locked');

              // Release Lenis starting exactly at 0, 0 without jump
              if (lenis) {
                lenis.scrollTo(0, { immediate: true });
                lenis.start();
              }

              // Refresh ScrollTrigger to recalculate offsets after body layout unlocks
              setTimeout(() => {
                ScrollTrigger.refresh();
              }, 50);
            }
          });

          // Smoothly move the split hero texts out and hide indicator
          tl.to('.split-hero-left', { xPercent: -120, autoAlpha: 0, duration: 1.2, ease: 'power2.inOut' }, 0);
          tl.to('.split-hero-right', { xPercent: 120, autoAlpha: 0, duration: 1.2, ease: 'power2.inOut' }, 0);
          tl.to('.home-scroll-indicator', { autoAlpha: 0, duration: 0.4, ease: 'power2.inOut' }, 0);
          
          // Spacer block to keep the screen locked in-place until the video finishes
          tl.to({}, { duration: playDuration }, 0);
        });
      });
    };

    triggerTransitionRef.current = triggerTransition;

    const handleScrollHijack = (e: Event) => {
      if (transitionTriggered.current || isTransitioning.current) return;

      // Check if we are at the top of the page
      if (window.scrollY > 50) return;

      let shouldTrigger = false;

      if (e.type === 'wheel') {
        const wheelEvent = e as WheelEvent;
        if (wheelEvent.deltaY > 0) {
          shouldTrigger = true;
        }
      } else if (e.type === 'touchmove') {
        const touchEvent = e as TouchEvent;
        const currentY = touchEvent.touches[0].clientY;
        if (startTouchY - currentY > 10) { // swipe up (scroll down)
          shouldTrigger = true;
        }
      } else if (e.type === 'keydown') {
        const keyEvent = e as KeyboardEvent;
        const keys = ['Space', 'ArrowDown', 'PageDown', 'End'];
        if (keys.includes(keyEvent.code)) {
          shouldTrigger = true;
        }
      }

      if (shouldTrigger) {
        if (e.cancelable) {
          e.preventDefault();
        }
        triggerTransition();
      }
    };

    // Add detection listeners
    window.addEventListener('wheel', handleScrollHijack, { passive: false });
    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleScrollHijack, { passive: false });
    window.addEventListener('keydown', handleScrollHijack, { passive: false });

    ctx.add(() => {
      // ----------------------------------------------------
      // SECTION 1: HERO VIDEO TRANSITION ON SCROLL
      // ----------------------------------------------------
      // Handle page refresh or loaded scrolled past hero
      if (window.scrollY > 200) {
        transitionTriggered.current = true;
        const video = videoRef.current;
        if (video) {
          video.currentTime = video.duration || 4;
        }
        gsap.set('.split-hero-left', { xPercent: -120, autoAlpha: 0 });
        gsap.set('.split-hero-right', { xPercent: 120, autoAlpha: 0 });
        gsap.set('.home-scroll-indicator', { autoAlpha: 0 });
      }

      // Reset when scrolling back to the top
      ScrollTrigger.create({
        trigger: '#scene-hero',
        start: 'top top',
        end: 'bottom top',
        onLeaveBack: () => {
          if (transitionTriggered.current) {
            transitionTriggered.current = false;
            const video = videoRef.current;
            if (video) {
              video.pause();
              video.currentTime = 0;
            }
            gsap.set('.split-hero-left', { xPercent: 0, autoAlpha: 1 });
            gsap.set('.split-hero-right', { xPercent: 0, autoAlpha: 1 });
            gsap.set('.home-scroll-indicator', { autoAlpha: 1 });

            // Re-attach detection listeners
            window.removeEventListener('wheel', handleScrollHijack);
            window.removeEventListener('touchmove', handleScrollHijack);
            window.removeEventListener('keydown', handleScrollHijack);
            
            window.addEventListener('wheel', handleScrollHijack, { passive: false });
            window.addEventListener('touchstart', handleTouchStart, { passive: true });
            window.addEventListener('touchmove', handleScrollHijack, { passive: false });
            window.addEventListener('keydown', handleScrollHijack, { passive: false });
          }
        }
      });

      // ----------------------------------------------------
      // SECTION 2: STATEMENT TEXT REVEAL
      // ----------------------------------------------------
      const words = gsap.utils.toArray('.reveal-word');
      gsap.fromTo(words, 
        { opacity: 0.15 },
        {
          opacity: 1,
          stagger: 0.1,
          scrollTrigger: {
            trigger: '#scene-statement',
            start: 'top 80%',
            end: 'top 50%', // fully highlighted in the middle of the screen
            scrub: 0.3
          }
        }
      );

      // ----------------------------------------------------
      // SECTION 3: 8 WAYS TO EARN STAGGER & CARDS
      // ----------------------------------------------------
      gsap.fromTo('.premium-earn-card', 
        { y: 50, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          stagger: 0.08,
          duration: 0.8,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: '#scene-complan',
            start: 'top 75%',
            toggleActions: 'play none none reverse'
          }
        }
      );

      gsap.fromTo('.premium-story-heading, .premium-story-intro-card, .premium-story-metric-card',
        { y: 30, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          stagger: 0.1,
          duration: 0.8,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: '#scene-complan',
            start: 'top 80%',
            toggleActions: 'play none none reverse'
          }
        }
      );

      // ----------------------------------------------------
      // SECTION 4: SCENE 2 PERFUME (Smooth scrub with 0.8s inertial catch-up)
      // ----------------------------------------------------
      const perfumeFrameObj = { frame: 0 };
      const tl2 = gsap.timeline({
        scrollTrigger: {
          trigger: '#scene2-perfume',
          start: 'top top',
          end: '+=350%',
          pin: true,
          scrub: 0.8,
          onUpdate: () => {
            scheduleDrawFrame(2, Math.floor(perfumeFrameObj.frame));
          }
        }
      });

      tl2.to(perfumeFrameObj, {
        frame: Math.max(0, scene2Images.current.length - 1),
        snap: 'frame',
        ease: 'none'
      }, 0);

      tl2.to('.split-perfume-left', { xPercent: -120, autoAlpha: 0, ease: 'power1.inOut' }, 0);
      tl2.to('.split-perfume-right', { xPercent: 120, autoAlpha: 0, ease: 'power1.inOut' }, 0);

      // ----------------------------------------------------
      // SECTION 6: GLOBAL STATS COUNTERS
      // ----------------------------------------------------
      const statsObj = { members: 0, cities: 0, ways: 0 };
      gsap.to(statsObj, {
        members: 10000,
        cities: 25,
        ways: 8,
        duration: 2,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: '#scene-build-global',
          start: 'top 80%',
          toggleActions: 'play none none none'
        },
        onUpdate: () => {
          const membersEl = document.getElementById('stat-members');
          const citiesEl = document.getElementById('stat-cities');
          const waysEl = document.getElementById('stat-bonus');
          if (membersEl) membersEl.innerText = Math.floor(statsObj.members).toLocaleString() + '+';
          if (citiesEl) citiesEl.innerText = Math.floor(statsObj.cities).toString() + '+';
          if (waysEl) waysEl.innerText = Math.floor(statsObj.ways).toString();
        }
      });

      // ----------------------------------------------------
      // WAYPOINTS (GOLD THREAD NAV) STATE TOGGLES
      // ----------------------------------------------------
      ScrollTrigger.create({
        trigger: '#scene-hero',
        start: 'top center',
        end: 'bottom center',
        onToggle: (self) => {
          if (self.isActive) setActiveSection(0);
        }
      });

      ScrollTrigger.create({
        trigger: '#scene-vision-mission',
        start: 'top center',
        end: 'bottom center',
        onToggle: (self) => {
          if (self.isActive) setActiveSection(1);
        }
      });

      ScrollTrigger.create({
        trigger: '#scene-founder',
        start: 'top center',
        end: 'bottom center',
        onToggle: (self) => {
          if (self.isActive) setActiveSection(2);
        }
      });

      ScrollTrigger.create({
        trigger: '#scene-complan',
        start: 'top center',
        end: 'bottom center',
        onToggle: (self) => {
          if (self.isActive) setActiveSection(3);
        }
      });

      ScrollTrigger.create({
        trigger: '#scene-complan',
        start: 'top top',
        end: 'bottom bottom',
        onUpdate: (self) => {
          if (self.progress >= 0.5) {
            setShowPerfumeCanvas(true);
          } else {
            setShowPerfumeCanvas(false);
          }
        },
        onLeaveBack: () => {
          setShowPerfumeCanvas(false);
        },
        onLeave: () => {
          setShowPerfumeCanvas(true);
        }
      });

      ScrollTrigger.create({
        trigger: '#scene2-perfume',
        start: 'top center',
        end: 'bottom center',
        onToggle: (self) => {
          if (self.isActive) setActiveSection(4);
        }
      });

      ScrollTrigger.create({
        trigger: '#scene-packages-accordion',
        start: 'top center',
        end: 'bottom center',
        onToggle: (self) => {
          if (self.isActive) setActiveSection(5);
        }
      });

    });

    const handleResize = () => {
      sizeCanvas();
      drawFrame(2, lastDrawnFrame.current, true);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      ctx.revert();
      if (pendingDraw.current !== null) {
        window.cancelAnimationFrame(pendingDraw.current);
        pendingDraw.current = null;
      }
      window.removeEventListener('resize', handleResize);
      
      // Clean up hijack & block event listeners
      window.removeEventListener('wheel', handleScrollHijack);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleScrollHijack);
      window.removeEventListener('keydown', handleScrollHijack);
      window.removeEventListener('wheel', blockScroll);
      window.removeEventListener('touchmove', blockScroll);
      window.removeEventListener('keydown', blockScroll);
      
      triggerTransitionRef.current = null;
    };
  }, [loading, drawFrame, liteExperience, scheduleDrawFrame]);

  // Anchor navigation scrolls using Lenis or standard element scrolling
  const scrollToAnchor = (selector: string) => {
    setMobileMenuOpen(false);
    
    // Release any scroll lock constraints during explicit navigation clicks
    document.body.classList.remove('story-scroll-locked');
    document.documentElement.classList.remove('story-scroll-locked');
    isTransitioning.current = false;
    const lenis = (window as any).lenis;
    if (lenis) {
      lenis.start();
    }

    const videoSelectors = ['#scene-hero', '#scene-vision-mission', '#scene-founder', '#scene-complan', '#scene-statement'];
    if (videoSelectors.includes(selector)) {
      setShowPerfumeCanvas(false);
    } else {
      setShowPerfumeCanvas(true);
    }
    
    // If scrolling past hero, mark transition triggered
    if (selector !== '#scene-hero') {
      transitionTriggered.current = true;
      const video = videoRef.current;
      if (video) {
        video.currentTime = video.duration || 4;
      }
      gsap.set('.split-hero-left', { xPercent: -120, autoAlpha: 0 });
      gsap.set('.split-hero-right', { xPercent: 120, autoAlpha: 0 });
      gsap.set('.home-scroll-indicator', { autoAlpha: 0 });
    } else {
      // Reset when scrolling back to top
      transitionTriggered.current = false;
      const video = videoRef.current;
      if (video) {
        video.pause();
        video.currentTime = 0;
      }
      gsap.set('.split-hero-left', { xPercent: 0, autoAlpha: 1 });
      gsap.set('.split-hero-right', { xPercent: 0, autoAlpha: 1 });
      gsap.set('.home-scroll-indicator', { autoAlpha: 1 });
    }

    if (lenis) {
      lenis.scrollTo(selector, { duration: 1.5 });
    } else {
      const el = document.querySelector(selector);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    }

    // Refresh ScrollTrigger after a layout settle delay
    setTimeout(() => {
      ScrollTrigger.refresh();
    }, 100);
  };



  // Smooth scroll to selected section
  const scrollToSection = (index: number) => {
    // Release any scroll lock constraints
    document.body.classList.remove('story-scroll-locked');
    document.documentElement.classList.remove('story-scroll-locked');
    isTransitioning.current = false;
    const lenis = (window as any).lenis;
    if (lenis) {
      lenis.start();
    }

    const ids = ['scene-hero', 'scene-complan', 'scene2-perfume', 'scene-build-global'];
    const targetId = ids[index];
    if (targetId === 'scene-hero' || targetId === 'scene-complan') {
      setShowPerfumeCanvas(false);
    } else {
      setShowPerfumeCanvas(true);
    }

    const el = document.getElementById(targetId);
    if (el) {
      if (index > 0) {
        transitionTriggered.current = true;
        const video = videoRef.current;
        if (video) {
          video.currentTime = video.duration || 4;
        }
        gsap.set('.split-hero-left', { xPercent: -120, autoAlpha: 0 });
        gsap.set('.split-hero-right', { xPercent: 120, autoAlpha: 0 });
        gsap.set('.home-scroll-indicator', { autoAlpha: 0 });
      } else {
        // Reset when scrolling back to hero
        transitionTriggered.current = false;
        const video = videoRef.current;
        if (video) {
          video.pause();
          video.currentTime = 0;
        }
        gsap.set('.split-hero-left', { xPercent: 0, autoAlpha: 1 });
        gsap.set('.split-hero-right', { xPercent: 0, autoAlpha: 1 });
        gsap.set('.home-scroll-indicator', { autoAlpha: 1 });
      }

      const top = el.getBoundingClientRect().top + window.scrollY;
      window.scrollTo({ top, behavior: 'smooth' });
    }

    // Refresh ScrollTrigger after a layout settle delay
    setTimeout(() => {
      ScrollTrigger.refresh();
    }, 100);
  };

  const ranks = [
    {
      tier: 'manager',
      title: 'Manager',
      target: 'PHP 50,000 Group Sales Volume',
      incentive: 'Exclusive iPhone, Recognition Pin, Leadership Training',
      img: '/assets/yor/generated/yor_vision_productpic.jpg'
    },
    {
      tier: 'bronze',
      title: 'Bronze Director',
      target: 'PHP 100,000 Group Sales Volume',
      incentive: 'PHP 100,000 Car Down Payment (Sedan), Achievement Pin, Monthly Override Bonuses',
      img: '/assets/yor/generated/yor_perfume_product.png'
    },
    {
      tier: 'silver',
      title: 'Silver Director',
      target: 'PHP 250,000 Group Sales Volume',
      incentive: 'Asian Luxury Cruise & Travel Package, Rank Certificate, Leadership Development Credit',
      img: '/assets/yor/generated/yor_vision_productpic.jpg'
    },
    {
      tier: 'gold',
      title: 'Gold Director',
      target: 'PHP 500,000 Group Sales Volume',
      incentive: 'SUV Car Down Payment, Elite Gold Ring, Executive Leadership Council Placement',
      img: '/assets/yor/generated/yor_perfume_product.png'
    },
    {
      tier: 'platinum',
      title: 'Platinum Elite',
      target: 'PHP 1,000,000 Group Sales Volume',
      incentive: 'US / Europe Luxury Travel Package, Presidential Circle Access, Cash overrides',
      img: '/assets/yor/generated/yor_vision_productpic.jpg'
    },
    {
      tier: 'legacy',
      title: 'Millionaires Circle',
      target: 'PHP 50,000,000+ Lifetime Organizational Volume',
      incentive: 'Luxury Condominium Suite, Hall of Famer permanent status, 2% Global Pool qualifier override',
      img: '/assets/yor/generated/yor-founder-portrait-ai.png'
    }
  ];

  return (
    <div className={`story-landing-page ${liteExperience ? 'is-lite-experience' : ''}`} ref={rootRef}>
      {/* Immersive Loader Screen */}
      <div className={`story-loader ${loading ? 'is-loading' : ''}`}>
        <div className="loader-container">
          <div className="luxury-loader-visual">
            <svg className="luxury-loader-svg" viewBox="0 0 100 100">
              <defs>
                <linearGradient id="gold-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#bf953f" />
                  <stop offset="25%" stopColor="#fcf6ba" />
                  <stop offset="50%" stopColor="#b38728" />
                  <stop offset="75%" stopColor="#fbf5b7" />
                  <stop offset="100%" stopColor="#aa771c" />
                </linearGradient>
              </defs>
              <circle className="loader-ring loader-ring-outer" cx="50" cy="50" r="45" stroke="url(#gold-gradient)" strokeWidth="1.5" fill="none" strokeDasharray="283" strokeDashoffset="70" />
              <circle className="loader-ring loader-ring-middle" cx="50" cy="50" r="36" stroke="url(#gold-gradient)" strokeWidth="1.2" fill="none" strokeDasharray="180 50" />
              <circle className="loader-ring loader-ring-inner" cx="50" cy="50" r="27" stroke="url(#gold-gradient)" strokeWidth="1" fill="none" strokeDasharray="170" strokeDashoffset="42" />
            </svg>
            <div className="loader-logo-center">
              <YorBrandMark className="loader-logo" variant="showcase" />
            </div>
          </div>
          <h1 className="loader-brand gold-text-shimmer">Yor International</h1>
          <div className="loader-progress-text">{progress}%</div>
          <p className="loader-message">INITIALIZING DIGITAL EXPERIENCE</p>
        </div>
      </div>

      {/* Fixed Fullscreen Canvas / Video Wrapper */}
      <div className="canvas-wrapper">
        <video
          ref={videoRef}
          src="/assets/scene1_hero/scene1_video/scene1_video.mp4"
          muted
          playsInline
          preload="auto"
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            opacity: showPerfumeCanvas ? 0 : 1,
            pointerEvents: 'none',
            zIndex: 1,
            transition: 'opacity 0.6s ease'
          }}
        />
        <canvas
          ref={canvasRef}
          className="story-canvas"
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            opacity: showPerfumeCanvas ? 1 : 0,
            pointerEvents: 'none',
            zIndex: 2,
            transition: 'opacity 0.6s ease'
          }}
        />
        <div className="canvas-overlay-glow" style={{ zIndex: 3 }} />
      </div>



      {/* Floating Join CTA */}
      {activeSection >= 3 ? (
        <div className="pinned-pill-container">
          <NavLink to="/register" className="pinned-pill-button">
            <span>Join YOR</span>
            <span className="pill-icon-circle">
              <ArrowRight size={16} />
            </span>
          </NavLink>
        </div>
      ) : null}

      {/* Golden Thread Navigation (Waypoints) */}
      <nav className="waypoint-nav">
        <div className="waypoint-thread" />
        <button
          type="button"
          className={`waypoint-node ${activeSection === 0 ? 'is-active' : ''}`}
          onClick={() => scrollToAnchor('#scene-hero')}
          aria-label="Scroll to Home"
        >
          <span className="waypoint-tooltip">Home</span>
        </button>
        <button
          type="button"
          className={`waypoint-node ${activeSection === 1 ? 'is-active' : ''}`}
          onClick={() => scrollToAnchor('#scene-vision-mission')}
          aria-label="Scroll to Vision & Mission"
        >
          <span className="waypoint-tooltip">Vision & Mission</span>
        </button>
        <button
          type="button"
          className={`waypoint-node ${activeSection === 2 ? 'is-active' : ''}`}
          onClick={() => scrollToAnchor('#scene-founder')}
          aria-label="Scroll to Founder"
        >
          <span className="waypoint-tooltip">Founder</span>
        </button>
        <button
          type="button"
          className={`waypoint-node ${activeSection === 3 ? 'is-active' : ''}`}
          onClick={() => scrollToAnchor('#scene-complan')}
          aria-label="Scroll to 8 Ways to Earn"
        >
          <span className="waypoint-tooltip">8 Ways to Earn</span>
        </button>
        <button
          type="button"
          className={`waypoint-node ${activeSection === 4 ? 'is-active' : ''}`}
          onClick={() => scrollToAnchor('#scene2-perfume')}
          aria-label="Scroll to Scent & Collection"
        >
          <span className="waypoint-tooltip">Signature Scent</span>
        </button>
        <button
          type="button"
          className={`waypoint-node ${activeSection === 5 ? 'is-active' : ''}`}
          onClick={() => scrollToAnchor('#scene-packages-accordion')}
          aria-label="Scroll to Packages"
        >
          <span className="waypoint-tooltip">Packages & Ranks</span>
        </button>
      </nav>

      {/* Continuous Scroll Wrapper */}
      <div className="story-scroll-container">
        
        {/* Scene 1: Hero - The Visionary Reveal */}
        <section id="scene-hero" className="story-section">
          <div className="scene-pin-wrapper">
            <div className="split-hero-container">
              <div className="split-hero-left">
                <span className="split-kicker">Ocular Wellness</span>
                <h2>We are</h2>
                <h1 className="split-display">movement</h1>
              </div>
              <div className="split-hero-right">
              <span className="split-kicker split-kicker-highlight">YOR Vision</span>
                <h2>We are</h2>
                <h1 className="split-display-outline">distinction</h1>
              </div>
            </div>
            
            <button
              aria-label="Explore complan section"
              className="home-scroll-indicator"
              onClick={() => {
                if (triggerTransitionRef.current) {
                  triggerTransitionRef.current();
                } else {
                  scrollToAnchor('#scene-vision-mission');
                }
              }}
              type="button"
            >
              <span>Scroll Down to Start the Journey</span>
              <ChevronDown size={14} />
            </button>
          </div>
        </section>

        {/* Section B: Statement Text Reveal */}
        <section id="scene-statement" className="statement-section">
          <div className="statement-content">
            <p className="statement-paragraph">
              {"YOR International® is a global wellness and legacy enterprise empowering entrepreneurs across the Philippines to build financial freedom through premium scent creations, ocular wellness drops, and a modern network compensation structure.".split(' ').map((word, i) => (
                <span key={i} className="reveal-word">
                  {word}
                </span>
              ))}
            </p>
          </div>
        </section>

        {/* Section: Vision & Mission */}
        <section id="scene-vision-mission" className="vision-mission-section">
          <div className="section-container">
            <div className="vision-mission-grid">
              {/* Vision Card */}
              <div className="glass-panel vision-card">
                <div className="card-accent" />
                <div className="card-badge">
                  <Sparkles size={16} />
                  <span>The North Star</span>
                </div>
                <h2>Vision</h2>
                <p>
                  To build a global community of empowered entrepreneurs who create a legacy of financial freedom, personal growth, and shared success.
                </p>
              </div>

              {/* Mission Card */}
              <div className="glass-panel mission-card">
                <div className="card-accent" />
                <div className="card-badge">
                  <Award size={16} />
                  <span>Our Purpose</span>
                </div>
                <h2>Mission</h2>
                <p>
                  To equip aspiring entrepreneurs with quality products, business tools, ethical leadership, and a supportive network.
                </p>
                <div className="mission-nodes">
                  <div className="mission-node">
                    <div className="mission-node-icon"><Handshake size={18} /></div>
                    <span>Connect</span>
                  </div>
                  <div className="mission-node">
                    <div className="mission-node-icon"><Wrench size={18} /></div>
                    <span>Equip</span>
                  </div>
                  <div className="mission-node">
                    <div className="mission-node-icon"><Sparkles size={18} /></div>
                    <span>Empower</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section: Founder Showcase */}
        <section id="scene-founder" className="founder-section-inline">
          <div className="section-container">
            <div className="founder-grid">
              <div className="founder-portrait-col">
                <div className="founder-portrait-shell">
                  <img
                    src="/assets/yor/generated/yor-founder-portrait-ai.png"
                    alt="Mr. Yoren B. Abihay"
                    className="founder-portrait"
                  />
                  <div className="founder-tag">Est. 2024</div>
                </div>
              </div>
              <div className="glass-panel founder-details-card">
                <div className="card-accent" />
                <span className="founder-badge">{founderProfile.badge}</span>
                <h1 className="founder-name">{founderProfile.name}</h1>
                <p className="founder-summary">
                  {founderProfile.summary}
                </p>
                
                <div className="founder-highlights">
                  {founderHighlights.map((item, index) => {
                    const Icon = [
                      BriefcaseBusiness,
                      UserRoundCheck,
                      Users,
                      HeartHandshake,
                      Trophy,
                      Trophy,
                      GraduationCap
                    ][index] ?? BriefcaseBusiness;

                    return (
                      <div key={item} className="founder-highlight-item">
                        <Icon size={16} />
                        <span>{item}</span>
                      </div>
                    );
                  })}
                </div>

                <div className="founder-quote-block">
                  <p className="founder-quote">
                    "To inspire, develop, and empower ordinary individuals to become extraordinary leaders, entrepreneurs, and contributors to society."
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section C: 8 Ways to Earn Grid */}
        <section id="scene-complan" className="story-section premium-story-section">
          <div className="premium-story-shell premium-story-shell--earn">
            <div className="premium-story-heading">
              <span className="premium-story-kicker">Compensation Experience</span>
              <h2>8 Ways to Earn</h2>
              <p>
                A cinematic public plan designed for rapid retail margin recovery, matching volume leverage, unilevel repeat purchase residuals, and yearly global pool participation.
              </p>
            </div>

            <div className="premium-story-spotlight">
              <article className="premium-story-intro-card">
                <span className="premium-story-label">Built for momentum</span>
                <h3>Structured around product movement, direct referrals, and leadership depth</h3>
                <p>
                  Start with immediate retail margins and Direct Referral bonuses, then expand into salesmatch overrides, Get Yor Five bonuses, and long-term unilevel repeat purchase residuals.
                </p>
              </article>

              <div className="premium-story-metrics">
                <div className="premium-story-metric-card">
                  <span>Direct Referral Range</span>
                  <strong>PHP 200 to PHP 15,000</strong>
                </div>
                <div className="premium-story-metric-card">
                  <span>Repeat Purchase Layer</span>
                  <strong>Up to 10 levels</strong>
                </div>
                <div className="premium-story-metric-card">
                  <span>Global Pool Access</span>
                  <strong>2% yearly share</strong>
                </div>
              </div>
            </div>

            <div className="premium-earn-grid">
              {earningCards.map((card) => (
                <button
                  key={card.title}
                  onClick={() => scrollToAnchor('#scene-packages-accordion')}
                  className="premium-earn-card text-left-btn"
                >
                  <span className="premium-earn-number">{card.number}</span>
                  <h3>{card.title}</h3>
                  <p>{card.body}</p>
                  <span className="premium-earn-link">
                    Explore detail
                    <ArrowRight size={14} />
                  </span>
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Section D: Scene 2 Perfume Canvas */}
        <section id="scene2-perfume" className="story-section">
          <div className="scene-pin-wrapper">
            <div className="split-hero-container">
              <div className="split-perfume-left" style={{ display: 'flex', flexDirection: 'column', textAlign: 'right', alignItems: 'flex-end' }}>
                <span className="split-kicker">Signature Scent</span>
                <h2>We are</h2>
                <h1 className="split-display">Earn in</h1>
              </div>
              <div className="split-perfume-right" style={{ display: 'flex', flexDirection: 'column', textAlign: 'left', alignItems: 'flex-start' }}>
                <span className="split-kicker split-kicker-highlight">YOR Fragrances</span>
                <h2>We are</h2>
                <h1 className="split-display-outline">Legacy</h1>
              </div>
            </div>
          </div>
        </section>

        {/* Section: Products Showcase */}
        <section id="scene-products-showcase" className="products-showcase-section">
          <div className="section-container">
            <header className="showcase-header">
              <span className="build-global-kicker">Signature Collection</span>
              <h2>Product Catalog</h2>
              <div className="header-rule" />
            </header>

            {/* Featured Product Card: Yor Vision Mineral Drops */}
            <div className="featured-product-card">
              <div className="product-copy-col">
                <span className="product-badge">Featured Product</span>
                <h2>{featuredCollectionShowcase.title}</h2>
                <p>{featuredCollectionShowcase.summary}</p>
                <div className="product-lead">
                  <strong>{featuredCollectionShowcase.featureHeading}</strong>
                  <p>{featuredCollectionShowcase.featureLead}</p>
                </div>
                <ul className="product-points">
                  {featuredCollectionShowcase.points.map((point) => (
                    <li key={point}>
                      <Check size={16} />
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
                <p className="product-disclaimer">{featuredCollectionShowcase.disclaimer}</p>
              </div>
              <div className="product-visual-col">
                <div className="product-visual-panel">
                  <div className="product-halo" />
                  <div className="product-visual-copy">
                    <span>Mineral Drops</span>
                    <strong>Hydration wellness support</strong>
                  </div>
                  <img src="/assets/yor/generated/yor_vision_productpic.jpg" alt="Yor Vision mineral drops bottle" />
                </div>
              </div>
            </div>

            {/* Fragrance Grid */}
            <div className="fragrance-columns-grid">
              {/* For Men */}
              <div className="fragrance-column">
                <div className="column-header">
                  <Mars size={18} />
                  <h2>Fragrances For Men</h2>
                  <div className="column-line" />
                </div>
                <div className="fragrance-list">
                  {collectionProducts.filter(p => p.accent === 'For Men').map((prod) => (
                    <div className="glass-panel fragrance-item" key={prod.code}>
                      <div className="item-details">
                        <code>{prod.code}</code>
                        <span>{prod.title}</span>
                        <small>{prod.note}</small>
                      </div>
                      <ArrowRight size={14} />
                    </div>
                  ))}
                </div>
              </div>

              {/* For Women */}
              <div className="fragrance-column">
                <div className="column-header column-header-secondary">
                  <Venus size={18} />
                  <h2>Fragrances For Women</h2>
                  <div className="column-line" />
                </div>
                <div className="fragrance-list">
                  {collectionProducts.filter(p => p.accent === 'For Women').map((prod) => (
                    <div className="glass-panel fragrance-item fragrance-item-secondary" key={prod.code}>
                      <div className="item-details">
                        <code>{prod.code}</code>
                        <span>{prod.title}</span>
                        <small>{prod.note}</small>
                      </div>
                      <ArrowRight size={14} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section E: Accordion + Photo Gallery */}
        <section id="scene-packages-accordion" className="packages-accordion-section">
          <div className="packages-accordion-container">
            <div className="blocker-left-col">
              <span className="build-global-kicker">Enterprise & Legacy</span>
              <h2 className="blocker-heading" style={{ color: '#ffffff', marginBottom: '1rem' }}>Enterprise Options</h2>
              
              {/* Tab Switcher */}
              <div className="accordion-tab-switcher">
                <button
                  type="button"
                  onClick={() => {
                    setAccordionTab('packages');
                    setActiveAccordionIndex(0);
                  }}
                  className={`tab-switch-btn ${accordionTab === 'packages' ? 'is-active' : ''}`}
                >
                  Entry Tiers
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAccordionTab('ranks');
                    setActiveAccordionIndex(0);
                  }}
                  className={`tab-switch-btn ${accordionTab === 'ranks' ? 'is-active' : ''}`}
                >
                  Leadership Ranks
                </button>
              </div>

              {/* Founder Mini Intro Card (shows above accordion) */}
              <div className="accordion-intro-founder">
                <div className="founder-mini-portrait-crop">
                  <img
                    src="/assets/yor/generated/yor-founder-portrait-ai.png"
                    alt="Mr. Yoren B. Abihay"
                    className="founder-mini-portrait"
                  />
                </div>
                <div className="founder-intro-text">
                  <h3>Mr. Yoren B. Abihay</h3>
                  <span>President / CEO</span>
                  <p className="founder-intro-quote">
                    "To inspire, develop, and empower ordinary individuals to become extraordinary leaders, entrepreneurs, and contributors to society."
                  </p>
                </div>
              </div>

              {/* Collapsible Accordion Content */}
              <div className="ranking-accordion">
                {accordionTab === 'packages' ? (
                  packageDetails.map((pkg, idx) => (
                    <div
                      key={pkg.tier}
                      className={`accordion-item package-tier-${pkg.tier} ${activeAccordionIndex === idx ? 'is-active' : ''}`}
                    >
                      <button
                        type="button"
                        className="accordion-header"
                        onClick={() => setActiveAccordionIndex(idx)}
                      >
                        <span>{pkg.label}</span>
                        <span className="accordion-icon">+</span>
                      </button>
                      <div className="accordion-panel" style={{ maxHeight: activeAccordionIndex === idx ? '220px' : '0' }}>
                        <p><strong>Pricing:</strong> {pkg.price} | {pkg.pv}</p>
                        <p><strong>Direct Referral:</strong> {pkg.referral}</p>
                        <p>{pkg.desc}</p>
                        <div className="package-entry-price" style={{ marginTop: '0.75rem' }}>{pkg.price}</div>
                      </div>
                    </div>
                  ))
                ) : (
                  ranks.map((rank, idx) => (
                    <div
                      key={rank.tier}
                      className={`accordion-item rank-tier-${rank.tier} ${activeAccordionIndex === idx ? 'is-active' : ''}`}
                    >
                      <button
                        type="button"
                        className="accordion-header"
                        onClick={() => setActiveAccordionIndex(idx)}
                      >
                        <span>{rank.title}</span>
                        <span className="accordion-icon">+</span>
                      </button>
                      <div className="accordion-panel" style={{ maxHeight: activeAccordionIndex === idx ? '220px' : '0' }}>
                        <p><strong>Required Milestone:</strong> {rank.target}</p>
                        <p><strong>Incentives:</strong> {rank.incentive}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Legitimacy Tag */}
              <div style={{ marginTop: '3rem', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '2rem' }}>
                <span className="build-global-kicker" style={{ fontSize: '0.65rem', marginBottom: '0.5rem', display: 'block' }}>Corporate Legitimacy</span>
                <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)', lineHeight: 1.6, margin: 0 }}>
                  YOR International is fully registered and compliant under local Securities and Exchange Commission (SEC) guidelines and Bureau of Internal Revenue (BIR) provisions, guaranteeing operational transparency and structural legacy security for network builders globally.
                </p>
              </div>
            </div>

            {/* Sticky Photo Frame */}
            <div className="sticky-photo-frame-wrapper">
              <div className="sticky-photo-frame">
                {packageDetails.map((pkg, idx) => (
                  <img
                    key={`pkg-${pkg.tier}`}
                    src={pkg.img}
                    alt={pkg.label}
                    className={`sticky-photo-img ${accordionTab === 'packages' && activeAccordionIndex === idx ? 'is-active' : ''}`}
                  />
                ))}
                {ranks.map((rnk, idx) => (
                  <img
                    key={`rnk-${rnk.tier}`}
                    src={rnk.img}
                    alt={rnk.title}
                    className={`sticky-photo-img ${accordionTab === 'ranks' && activeAccordionIndex === idx ? 'is-active' : ''}`}
                  />
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Section F: Build Global Dark Section */}
        <section id="scene-build-global" className="build-global-section">
          <div className="build-global-backdrop-text">GLOBAL</div>
          <div className="build-global-content">
            <span className="build-global-kicker">Expanding Horizons</span>
            <h2 className="build-global-heading">Build Your Legacy Globally</h2>
            <p className="build-global-paragraph">
              Connect with aspiring entrepreneurs, establish local sales teams, and scale your business across borders. Under the leadership of Yoren B. Abihay, YOR International is expanding its footprint across the major economic hubs of the Philippines and beyond.
            </p>
            
            {/* Stats Counter Row */}
            <div className="global-stats-row">
              <div className="global-stat-card">
                <span className="stat-value" id="stat-members">10,000+</span>
                <span className="stat-label">Active Members</span>
              </div>
              <div className="global-stat-card">
                <span className="stat-value" id="stat-cities">25+</span>
                <span className="stat-label">Cities Covered</span>
              </div>
              <div className="global-stat-card">
                <span className="stat-value" id="stat-bonus">8</span>
                <span className="stat-label">Ways to Wealth</span>
              </div>
            </div>

            {/* Scrolling City Ticker */}
            <div className="city-ticker-wrap">
              <div className="city-ticker-track">
                {[
                  'Manila', 'Cebu', 'Davao', 'Iloilo', 'Cagayan de Oro', 'Zamboanga', 'Quezon City',
                  'Manila', 'Cebu', 'Davao', 'Iloilo', 'Cagayan de Oro', 'Zamboanga', 'Quezon City'
                ].map((city, idx) => (
                  <span key={idx} className="city-ticker-item">
                    <Globe size={12} className="city-ticker-icon" />
                    {city}
                  </span>
                ))}
              </div>
            </div>

            <div className="global-cta-row">
              <button type="button" className="global-primary-cta" onClick={() => navigate('/register')}>
                Start Building Now
                <ArrowRight size={16} />
              </button>
              <button type="button" className="global-secondary-cta" onClick={() => navigate('/login')}>
                Portal Login
              </button>
            </div>
          </div>
        </section>



        {/* Luxury Dark Footer */}
        <footer className="luxury-footer">
          <div className="footer-content">
            <div className="footer-left">
              <div className="footer-logo-row">
                <img 
                  src="/assets/yor/branding/yor-logo-round.png" 
                  alt="Yor International Logo" 
                  className="footer-logo-icon"
                />
                <span className="footer-brand">Yor International</span>
              </div>
              <p className="footer-description">
                A premier global platform built on high-fidelity scent creations, FDA-compliant ocular wellness drops, and a modern compensation network designed to secure your family's financial legacy.
              </p>
              
              <div className="footer-links-grid">
                <div className="footer-link-group">
                  <span className="footer-link-group-title">Corporate</span>
                  <button type="button" className="footer-link-btn" onClick={() => scrollToAnchor('#scene-vision-mission')}>Our Vision</button>
                  <button type="button" className="footer-link-btn" onClick={() => scrollToAnchor('#scene-vision-mission')}>Our Mission</button>
                  <button type="button" className="footer-link-btn" onClick={() => scrollToAnchor('#scene-founder')}>Meet Mr. Yoren Abihay</button>
                </div>
                <div className="footer-link-group">
                  <span className="footer-link-group-title">Partnership</span>
                  <button type="button" className="footer-link-btn" onClick={() => scrollToAnchor('#scene-packages-accordion')}>Entry Packages</button>
                  <NavLink className="footer-link-btn" to="/register">Member Registration</NavLink>
                  <NavLink className="footer-link-btn" to="/login">Office Portal Login</NavLink>
                </div>
              </div>
            </div>

            <div className="footer-right">
              <div className="footer-honest-grid">
                <article className="stats-card">
                  <div className="stats-number">8</div>
                  <div className="stats-label">Ways to Earn</div>
                </article>
                <article className="stats-card">
                  <div className="stats-number">Premium</div>
                  <div className="stats-label">Wellness Products</div>
                </article>
                <article className="stats-card" style={{ marginBottom: 0 }}>
                  <div className="stats-number">Community</div>
                  <div className="stats-label">Driven Growth</div>
                </article>
              </div>

              {/* Rotating abstract globe wireframe */}
              <div className="globe-animation-wrapper">
                <div className="globe-circle" />
                <div className="globe-meridian-1" />
                <div className="globe-meridian-2" />
                <div className="globe-meridian-3" />
                <div className="globe-parallel-1" />
                <div className="globe-parallel-2" />
                <div className="globe-parallel-equator" />
              </div>
            </div>
          </div>

          <div className="footer-bottom-row">
            <div>
              &copy; {new Date().getFullYear()} YOR International. All Rights Reserved. Fully Compliant under SEC and BIR Provisions.
            </div>
            <div className="footer-bottom-links">
              <a href="mailto:info@yorinternational.net" className="footer-bottom-link">
                <Mail size={12} style={{ marginRight: '0.25rem', display: 'inline', verticalAlign: 'middle' }} />
                info@yorinternational.net
              </a>
            </div>
          </div>
        </footer>

      </div>
    </div>
  );
}

