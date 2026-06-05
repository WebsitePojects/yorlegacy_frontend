import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  ChevronDown,
  Check,
  Mail,
  Award,
  Globe,
  Menu,
  X
} from 'lucide-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import type { PageContent } from '../../types/content';
import { YorBrandMark } from '../branding/YorBrandMark';
import { usePageContent } from '../../hooks/usePageContent';
import { SpotlightPage } from './SpotlightPage';
import { FounderShowcasePage } from './FounderShowcasePage';
import { CollectionPageView } from './CollectionPageView';
import { PackagesPageView } from './PackagesPageView';
import { RegistrationPageView } from './RegistrationPageView';
import { LoginPage } from '../../pages/LoginPage';
import { earnRoutes } from '../../config/navigation';
import './HomeExperiencePage.css';

if (!import.meta.env.TEST) {
  gsap.registerPlugin(ScrollTrigger);
}

const sceneDefinitions = [{ id: 1, count: 120, path: '/assets/scene1_hero' }] as const;

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
  const location = useLocation();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [activeSection, setActiveSection] = useState(0);
  const [activeOverlay, setActiveOverlay] = useState<string | null>(null);
  const [activeAccordion, setActiveAccordion] = useState<number>(0);
  const [liteExperience, setLiteExperience] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Fetch page contents dynamically for overlay sheets
  const { data: founderData } = usePageContent('founder');
  const { data: visionData } = usePageContent('vision');
  const { data: missionData } = usePageContent('mission');
  const { data: productsData } = usePageContent('perfume-collection');
  const { data: packagesData } = usePageContent('packages');
  const { data: registerData } = usePageContent('register');

  // Cache image refs to prevent garbage collection and allow instant rendering
  const scene1Images = useRef<HTMLImageElement[]>([]);

  // Track currently drawn frame to prevent double rendering
  const lastDrawnScene = useRef<number>(1);
  const lastDrawnFrame = useRef<number>(-1);
  const pendingDraw = useRef<number | null>(null);
  const pendingScene = useRef<number>(1);
  const pendingFrame = useRef<number>(0);

  // Mathematical "object-fit: cover" rendering on 2D canvas context
  const drawFrame = useCallback((sceneId: number, frameIndex: number, force = false) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = scene1Images.current[frameIndex];

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
          resolve(img); // Count it so the loader never hangs
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
      const [s1] = await Promise.all([loadImageBatch(frameUrlGroups[0])]);

      if (cancelled) {
        return;
      }

      scene1Images.current = s1;

      // Small visual delay before showing page to ensure complete layout paint
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

  // Sync route path to overlay state
  useEffect(() => {
    const path = location.pathname;
    if (path === '/login') {
      setActiveOverlay('login');
    } else if (path === '/founder') {
      setActiveOverlay('founder');
    } else if (path === '/vision') {
      setActiveOverlay('vision');
    } else if (path === '/mission') {
      setActiveOverlay('mission');
    } else if (path === '/packages') {
      setActiveOverlay('packages');
    } else if (path === '/products' || path === '/perfume-collection') {
      setActiveOverlay('products');
    } else if (path === '/register') {
      setActiveOverlay('register');
    } else {
      setActiveOverlay(null);
    }
  }, [location.pathname]);

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

  // Scroll Trigger Timelines
  useLayoutEffect(() => {
    if (loading) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const sizeCanvas = () => {
      const pixelRatio = liteExperience ? 1 : Math.min(window.devicePixelRatio || 1, 1.5);
      canvas.width = Math.round(window.innerWidth * pixelRatio);
      canvas.height = Math.round(window.innerHeight * pixelRatio);
    };

    // Set canvas dimensions initially
    sizeCanvas();

    // Draw the initial frame
    drawFrame(1, 0, true);

    if (liteExperience) {
      const ids = ['scene-hero', 'scene-complan', 'scene-networks'];
      const observer = new IntersectionObserver(
        (entries) => {
          const active = entries.find((entry) => entry.isIntersecting);
          if (!active) {
            return;
          }

          const index = ids.indexOf(active.target.id);
          const sceneId = 1;
          const frameIndex =
            index === 0 ? 0 : Math.max(0, Math.floor((scene1Images.current.length - 1) * 0.78));
          setActiveSection(index);
          drawFrame(sceneId, frameIndex, true);
        },
        { threshold: 0.45 }
      );

      ids.forEach((id) => {
        const el = document.getElementById(id);
        if (el) {
          observer.observe(el);
        }
      });

      const handleLiteResize = () => {
        sizeCanvas();
        drawFrame(lastDrawnScene.current, lastDrawnFrame.current, true);
      };

      window.addEventListener('resize', handleLiteResize);

      return () => {
        observer.disconnect();
        window.removeEventListener('resize', handleLiteResize);
      };
    }

    const ctx = gsap.context(() => {
      // ----------------------------------------------------
      // SECTION 1: HERO (Slower scrub via end: +=450% and scrub: 1.5)
      // ----------------------------------------------------
      const heroFrameObj = { frame: 0 };
      const tl1 = gsap.timeline({
        scrollTrigger: {
          trigger: '#scene-hero',
          start: 'top top',
          end: '+=450%',
          pin: true,
          scrub: 1.5,
          onUpdate: () => {
            scheduleDrawFrame(1, Math.floor(heroFrameObj.frame));
          }
        }
      });

      tl1.to(heroFrameObj, {
        frame: Math.max(0, scene1Images.current.length - 1),
        snap: 'frame',
        ease: 'none'
      }, 0);

      // Flanking text horizontal push off-screen
      tl1.to('.split-hero-left', { xPercent: -120, autoAlpha: 0, duration: 1.5 }, 0.1);
      tl1.to('.split-hero-right', { xPercent: 120, autoAlpha: 0, duration: 1.5 }, 0.1);

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
        trigger: '#scene-complan',
        start: 'top 60%',
        end: 'bottom 40%',
        onToggle: (self) => {
          if (self.isActive) setActiveSection(1);
        }
      });

      ScrollTrigger.create({
        trigger: '#scene-networks',
        start: 'top 60%',
        end: 'bottom 40%',
        onToggle: (self) => {
          if (self.isActive) setActiveSection(2);
        }
      });
    }, rootRef);

    // Resize handler
    const handleResize = () => {
      sizeCanvas();
      drawFrame(lastDrawnScene.current, lastDrawnFrame.current, true);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      ctx.revert();
      if (pendingDraw.current !== null) {
        window.cancelAnimationFrame(pendingDraw.current);
        pendingDraw.current = null;
      }
      window.removeEventListener('resize', handleResize);
    };
  }, [loading, drawFrame, liteExperience, scheduleDrawFrame]);

  // Smooth scroll to selected section
  const scrollToSection = (index: number) => {
    const ids = ['scene-hero', 'scene-complan', 'scene-networks'];
    const el = document.getElementById(ids[index]);
    if (el) {
      const top = el.getBoundingClientRect().top + window.scrollY;
      window.scrollTo({ top, behavior: 'smooth' });
    }
  };

  const ranks = [
    {
      tier: 'manager',
      title: 'Manager',
      target: 'PHP 50,000 Group Sales Volume',
      incentive: 'Exclusive iPhone, Recognition Pin, Leadership Training'
    },
    {
      tier: 'bronze',
      title: 'Bronze Director',
      target: 'PHP 100,000 Group Sales Volume',
      incentive: 'PHP 100,000 Car Down Payment (Sedan), Achievement Pin, Monthly Override Bonuses'
    },
    {
      tier: 'silver',
      title: 'Silver Director',
      target: 'PHP 250,000 Group Sales Volume',
      incentive: 'Asian Luxury Cruise & Travel Package, Rank Certificate, Leadership Development Credit'
    },
    {
      tier: 'gold',
      title: 'Gold Director',
      target: 'PHP 500,000 Group Sales Volume',
      incentive: 'SUV Car Down Payment, Elite Gold Ring, Executive Leadership Council Placement'
    },
    {
      tier: 'platinum',
      title: 'Platinum Elite',
      target: 'PHP 1,000,000 Group Sales Volume',
      incentive: 'US / Europe Luxury Travel Package, Presidential Circle Access, Cash overrides'
    },
    {
      tier: 'legacy',
      title: 'Millionaires Circle',
      target: 'PHP 50,000,000+ Lifetime Organizational Volume',
      incentive: 'Luxury Condominium Suite, Hall of Famer permanent status, 2% Global Pool qualifier override'
    }
  ];

  return (
    <div className={`story-landing-page ${liteExperience ? 'is-lite-experience' : ''}`} ref={rootRef}>
      {/* Immersive Loader Screen (Always rendered for smooth CSS opacity transitions) */}
      <div className={`story-loader ${loading ? 'is-loading' : ''}`}>
        <div className="loader-container">
          <YorBrandMark className="loader-logo" variant="showcase" />
          <h1 className="loader-brand">Yor International</h1>
          <div className="loader-progress-wrap">
            <div className="loader-progress-bar" style={{ width: `${progress}%` }} />
          </div>
          <p className="loader-message">INITIALIZING EXPERIENCE {progress}%</p>
        </div>
      </div>

      {/* Fixed Fullscreen Canvas */}
      <div className="canvas-wrapper">
        <canvas ref={canvasRef} className="story-canvas" />
        <div className="canvas-overlay-glow" />
      </div>

      {/* Minimalist Floating Header Overlay (Jesko Jets Style) */}
      <header className={`story-header ${mobileMenuOpen ? 'is-open' : ''}`}>
        <NavLink className="story-logo-wrap" to="/">
          <span className="story-brand-name">Yor International</span>
        </NavLink>
        <nav className="story-header-nav">
          <NavLink className="story-nav-link" to="/vision">Vision</NavLink>
          <NavLink className="story-nav-link" to="/mission">Mission</NavLink>
          <NavLink className="story-nav-link" to="/founder">Founder</NavLink>
          <NavLink className="story-nav-link" to="/products">Products</NavLink>
          <NavLink className="story-nav-link" to="/packages">Packages</NavLink>
        </nav>
        <div className="story-header-actions">
          <NavLink className="story-nav-cta" to="/register">
              Join Yor
          </NavLink>
          <NavLink className="story-nav-link story-nav-link-login" to="/login">Portal Login</NavLink>
          <button
            aria-expanded={mobileMenuOpen}
            aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            className={`story-menu-toggle${mobileMenuOpen ? ' is-open' : ''}`}
            onClick={() => setMobileMenuOpen((current) => !current)}
            type="button"
          >
            <span className="story-menu-toggle-icon story-menu-toggle-hamburger"><Menu size={18} /></span>
            <span className="story-menu-toggle-icon story-menu-toggle-close"><X size={18} /></span>
          </button>
        </div>
      </header>

      <div className={`story-mobile-overlay${mobileMenuOpen ? ' is-open' : ''}`} aria-hidden={!mobileMenuOpen}>
        <nav className="story-mobile-overlay-nav" aria-label="Mobile navigation">
          {[
            { to: '/', label: 'Home' },
            { to: '/vision', label: 'Vision' },
            { to: '/mission', label: 'Mission' },
            { to: '/founder', label: 'Founder' },
            { to: '/products', label: 'Products' },
            { to: '/packages', label: 'Packages' },
          ].map((item, i) => (
            <NavLink
              key={item.to}
              className={({ isActive }) => `story-mobile-overlay-link${isActive ? ' is-active' : ''}`}
              style={{ '--item-index': i } as React.CSSProperties}
              to={item.to}
            >
              {item.label}
            </NavLink>
          ))}
          <NavLink
            className={({ isActive }) => `story-mobile-overlay-link is-portal${isActive ? ' is-active' : ''}`}
            style={{ '--item-index': 6 } as React.CSSProperties}
            to="/login"
          >
            <span className="portal-login-icon" aria-hidden="true">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
            </span>
            Portal Login
          </NavLink>
        </nav>
      </div>

      {/* Floating Join CTA — only after scrolling to final section */}
      {activeSection >= 2 ? (
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
          onClick={() => scrollToSection(0)}
          aria-label="Scroll to Hero Reveal"
        >
          <span className="waypoint-tooltip">Featured Product</span>
        </button>
        <button
          type="button"
          className={`waypoint-node ${activeSection === 1 ? 'is-active' : ''}`}
          onClick={() => scrollToSection(1)}
          aria-label="Scroll to 8 Ways to Wealth"
        >
          <span className="waypoint-tooltip">8 Ways to Earn</span>
        </button>
        <button
          type="button"
          className={`waypoint-node ${activeSection === 2 ? 'is-active' : ''}`}
          onClick={() => scrollToSection(2)}
          aria-label="Scroll to Network Connections"
        >
          <span className="waypoint-tooltip">Global Connections</span>
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
              onClick={() => scrollToSection(1)}
              type="button"
            >
              <span>Scroll Down to Start the Journey</span>
              <ChevronDown size={14} />
            </button>
          </div>
        </section>

        {/* Blocker 1: Company Credentials & Entry Packages */}
        <section className="blocker-section blocker-light">
          <div className="blocker-content">
            <div className="blocker-left-col">
              <span className="blocker-kicker">Visionary Leadership</span>
              <h2 className="blocker-heading">Meet Our Founder</h2>
              
              <div className="founder-profile-showcase">
                <div className="founder-image-container">
                  <div className="founder-circle-glow" />
                  <div className="founder-image-crop">
                    <img 
                      src="/assets/yor/generated/yor-founder-portrait-ai.png" 
                      alt="Mr. Yoren B. Abihay" 
                      className="founder-portrait"
                    />
                  </div>
                </div>
                
                <h3 style={{ fontSize: '1.5rem', fontWeight: 600, margin: '0 0 0.25rem 0', fontFamily: 'Outfit' }}>Mr. Yoren B. Abihay</h3>
                <span style={{ fontSize: '0.85rem', color: '#8a7355', letterSpacing: '0.15em', textTransform: 'uppercase', fontWeight: 700, marginBottom: '1.5rem' }}>
                  President / CEO
                </span>

                <div className="founder-quote">
                  "To inspire, develop, and empower ordinary individuals to become extraordinary leaders, entrepreneurs, and contributors to society."
                  <span className="founder-quote-author">— Yoren B. Abihay</span>
                </div>

                <div className="highlights-grid">
                  <div className="highlight-bullet">
                    <Award size={16} className="highlight-bullet-icon" />
                    <span>Traditional Business Entrepreneur with 8+ Years of Experience</span>
                  </div>
                  <div className="highlight-bullet">
                    <Award size={16} className="highlight-bullet-icon" />
                    <span>Trainer and Mentor in Network Marketing & Leadership Development</span>
                  </div>
                  <div className="highlight-bullet">
                    <Award size={16} className="highlight-bullet-icon" />
                    <span>Accomplished Network Builder & 6-Time Top MLM Earner</span>
                  </div>
                  <div className="highlight-bullet">
                    <Award size={16} className="highlight-bullet-icon" />
                    <span>Chairman of a Non-Profit Organization | BS Criminology Graduate</span>
                  </div>
                </div>
              </div>

              <div style={{ marginTop: '3rem', borderTop: '1px solid rgba(0,0,0,0.06)', paddingTop: '2rem' }}>
                <span className="blocker-kicker" style={{ marginBottom: '0.75rem' }}>Corporate Legitimacy</span>
                <p className="blocker-paragraph" style={{ fontSize: '0.9rem', color: '#666666' }}>
                  YOR International is fully registered and compliant under local Securities and Exchange Commission (SEC) guidelines and Bureau of Internal Revenue (BIR) provisions, guaranteeing operational transparency and structural legacy security for network builders globally.
                </p>
              </div>
            </div>

            <div className="blocker-right-col">
              <span className="blocker-kicker">Entry Tier Packages</span>
              <h2 className="blocker-heading">Start Your Enterprise</h2>
              
              <div className="package-table-container">
                <table className="package-table">
                  <thead>
                    <tr>
                      <th>Package Option</th>
                      <th>Points Value</th>
                      <th style={{ textAlign: 'right' }}>Direct Referral</th>
                    </tr>
                  </thead>
                  <tbody>
                    {packageRows.map((row) => (
                      <tr key={row.label} className={`package-row package-tier-${row.tier}`}>
                        <td className="package-row-name">
                          {row.label}
                          <div className="package-entry-price">{row.price}</div>
                        </td>
                        <td className="package-row-price">{row.pv}</td>
                        <td className="package-row-referral" style={{ textAlign: 'right' }}>{row.referral}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div style={{ marginTop: '2.5rem', background: '#ffffff', padding: '2rem', borderRadius: '12px', border: '1px solid rgba(0,0,0,0.04)' }}>
                <h4 style={{ margin: '0 0 0.5rem 0', fontFamily: 'Outfit', fontWeight: 600 }}>Lifetime Reseller Advantage</h4>
                <p style={{ margin: 0, fontSize: '0.85rem', color: '#666', lineHeight: 1.5 }}>
                  Every entry package automatically awards a lifetime reseller discount of up to 40% on all fragrance lines and repeat purchase wellness products, ensuring rapid retail margin recovery from day one.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section id="scene-complan" className="story-section premium-story-section">
          <div className="premium-story-shell premium-story-shell--earn">
            <div className="premium-story-heading">
              <span className="premium-story-kicker">Compensation Experience</span>
              <h2>8 Ways to Earn</h2>
              <p>
                A lighter premium showcase that keeps the opportunity clear, fast, and polished without the heavy frame-by-frame scene rendering.
              </p>
            </div>

            <div className="premium-story-spotlight">
              <article className="premium-story-intro-card">
                <span className="premium-story-label">Built for momentum</span>
                <h3>Structured around product movement, direct referrals, and leadership depth</h3>
                <p>
                  The public plan stays easy to scan: start with retail and referral income, then grow into matching, repeat purchase, and global pool participation.
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
                <NavLink key={card.title} to={card.href} className="premium-earn-card">
                  <span className="premium-earn-number">{card.number}</span>
                  <h3>{card.title}</h3>
                  <p>{card.body}</p>
                  <span className="premium-earn-link">
                    Explore detail
                    <ArrowRight size={14} />
                  </span>
                </NavLink>
              ))}
            </div>
          </div>
        </section>

        {/* Blocker 2: Unilevel & Ranking Accordion */}
        <section className="blocker-section blocker-light">
          <div className="blocker-content ranking-blocker">
            <div className="blocker-left-col">
              <span className="blocker-kicker">Leadership Advancement</span>
              <h2 className="blocker-heading">Unilevel Ranking Accordion</h2>
              
              <div className="ranking-accordion">
                {ranks.map((rank, i) => (
                  <div 
                    key={i} 
                    className={`accordion-item rank-tier-${rank.tier} ${activeAccordion === i ? 'is-active' : ''}`}
                  >
                    <button 
                      type="button" 
                      className="accordion-header"
                      onClick={() => setActiveAccordion(activeAccordion === i ? -1 : i)}
                    >
                      <span>{rank.title}</span>
                      <span className="accordion-icon">+</span>
                    </button>
                    <div className="accordion-panel">
                      <p><strong>Required Milestone:</strong> {rank.target}</p>
                      <p><strong>Luxury Incentives:</strong> {rank.incentive}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="blocker-right-col product-showcase-wrap">
              <span className="blocker-kicker">Featured Product Variant</span>
              
              <div className="product-high-fidelity-card">
                <div className="product-badge-row">
                  <span className="product-badge">FDA APPROVED</span>
                  <span className="product-badge">HALAL CERTIFIED</span>
                  <span className="product-badge">100% NATURAL</span>
                </div>
                
                <h3 className="product-showcase-title">YOR Vision Mineral Drops</h3>
                
                <div className="product-showcase-meta">
                  <span className="product-showcase-capacity">15ml Ocular Wellness Drops</span>
                  <span className="product-showcase-price">PHP 500 SRP</span>
                </div>

                <div className="product-showcase-image-frame">
                  <img 
                    src="/assets/yor/generated/yor_vision_productpic.jpg" 
                    alt="YOR Vision Drops" 
                    className="product-showcase-image"
                  />
                </div>

                <div className="product-showcase-split">
                  <div className="product-showcase-bullets">
                    <div className="product-bullet-item">
                      <Check size={14} style={{ marginTop: '0.15rem' }} />
                      <span><strong>Immediate Relief:</strong> Formulated to provide instant structural relief and antioxidant cell support for all kinds of eye discomfort.</span>
                    </div>
                    <div className="product-bullet-item">
                      <Check size={14} style={{ marginTop: '0.15rem' }} />
                      <span><strong>Key Indication Support:</strong> Helps manage symptoms of cataracts, low vision, eye floaters, glaucoma, lazy eyes, and uveitis.</span>
                    </div>
                  </div>
                </div>

                <div style={{ marginTop: '1.5rem' }}>
                  <span style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#8a7355', display: 'block', marginBottom: '0.5rem' }}>
                    Eye Supplement Benefits Covered:
                  </span>
                  <div className="product-benefits-grid">
                    <div className="benefit-tag"><span className="benefit-tag-dot"/>Cataracts</div>
                    <div className="benefit-tag"><span className="benefit-tag-dot"/>Glaucoma</div>
                    <div className="benefit-tag"><span className="benefit-tag-dot"/>Low Vision</div>
                    <div className="benefit-tag"><span className="benefit-tag-dot"/>Lazy Eyes</div>
                    <div className="benefit-tag"><span className="benefit-tag-dot"/>Eye Floaters</div>
                    <div className="benefit-tag"><span className="benefit-tag-dot"/>CMV Renitis</div>
                    <div className="benefit-tag"><span className="benefit-tag-dot"/>Uveitis</div>
                    <div className="benefit-tag"><span className="benefit-tag-dot"/>Keratoconus</div>
                    <div className="benefit-tag"><span className="benefit-tag-dot"/>Eye Flashes</div>
                    <div className="benefit-tag"><span className="benefit-tag-dot"/>Cross Eyes</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="scene-networks" className="story-section premium-story-section premium-story-section--network">
          <div className="premium-story-shell premium-story-shell--network">
            <div className="premium-network-copy">
              <span className="premium-story-kicker">Leadership Network</span>
              <h2>Premium growth without the visual noise</h2>
              <p>
                Instead of another animated scene, this section keeps the focus on how members actually build: sponsor clearly, place with intention, and develop lasting leaders across the organization.
              </p>

              <div className="premium-network-pillars">
                <article className="premium-network-pillar">
                  <span className="panel-kicker">Placement Tree</span>
                  <h3>Binary structure</h3>
                  <p>Scale left and right team volume to support balanced growth and stronger matching momentum.</p>
                </article>
                <article className="premium-network-pillar">
                  <span className="panel-kicker">Unilevel Depth</span>
                  <h3>10-generation visibility</h3>
                  <p>Follow direct referral lineages deeper with a cleaner, more executive presentation.</p>
                </article>
                <article className="premium-network-pillar">
                  <span className="panel-kicker">Legacy Leadership</span>
                  <h3>Hall of Famer path</h3>
                  <p>Move from starter earnings into rank, prestige, and long-term global qualification.</p>
                </article>
              </div>
            </div>

            <div className="premium-network-cta-card">
              <span className="premium-story-label">Generational Opportunity</span>
              <h3>Build your legacy with a cleaner, faster experience</h3>
              <p>
                Step into a premium partner journey anchored in compliant products, polished brand presentation, and a clear public compensation map.
              </p>
              <div className="story-actions-row premium-story-actions-row">
                <NavLink className="story-primary-cta" to="/register">
                  Register Now
                  <ArrowRight size={15} />
                </NavLink>
                <NavLink className="story-secondary-cta" to="/packages">
                  Packages
                </NavLink>
                <NavLink className="story-secondary-cta" to="/login">
                  Portal Login
                </NavLink>
              </div>
            </div>
          </div>
        </section>

        {/* Luxury Dark Footer with minimalist rotating wireframe globe */}
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
                  <NavLink className="footer-link" to="/vision">Our Vision</NavLink>
                  <NavLink className="footer-link" to="/mission">Our Mission</NavLink>
                  <NavLink className="footer-link" to="/founder">Meet Mr. Yoren Abihay</NavLink>
                </div>
                <div className="footer-link-group">
                  <span className="footer-link-group-title">Partnership</span>
                  <NavLink className="footer-link" to="/packages">Entry Packages</NavLink>
                  <NavLink className="footer-link" to="/register">Member Registration</NavLink>
                  <NavLink className="footer-link" to="/login">Office Portal Login</NavLink>
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

      {/* Fullscreen Overlay Sheets */}
      <div className={`story-overlay-panel ${activeOverlay ? 'is-active' : ''}`}>
        <div className="story-overlay-header">
          <button className="story-overlay-close" onClick={closeOverlay} type="button">
            <ArrowLeft size={18} />
            <span>Back to Experience</span>
          </button>
        </div>
        <div className="story-overlay-body">
          {activeOverlay === 'founder' && founderData && <FounderShowcasePage content={founderData} />}
          {activeOverlay === 'vision' && visionData && <SpotlightPage content={visionData} />}
          {activeOverlay === 'mission' && missionData && <SpotlightPage content={missionData} />}
          {activeOverlay === 'products' && productsData && <CollectionPageView content={productsData} />}
          {activeOverlay === 'packages' && packagesData && <PackagesPageView content={packagesData} />}
          {activeOverlay === 'register' && registerData && <RegistrationPageView content={registerData} />}
          {activeOverlay === 'login' && <LoginPage />}
        </div>
      </div>
    </div>
  );
}
