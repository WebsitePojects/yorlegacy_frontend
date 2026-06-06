import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { ArrowRight, BadgeCheck, Eye, EyeOff, KeyRound, Lock, Mail, Phone, ShieldCheck, Sparkles, User, Wallet } from 'lucide-react';
import gsap from 'gsap';
import { NavLink, useSearchParams } from 'react-router-dom';
import { useFeedback } from '../feedback/FeedbackProvider';
import { pageAssets } from '../../config/pagePresets';
import { fetchRegistrationPreview, submitRegistration } from '../../lib/api';
import type { PageContent } from '../../types/content';
import type { RegistrationPreview } from '../../types/registration';
import { YorBrandMark } from '../branding/YorBrandMark';
import { AmbientEmbers } from '../layout/AmbientEmbers';
import { BackToExperienceLink } from './BackToExperienceLink';

const packageNarratives: Record<string, string> = {
  classic: 'Ideal for members entering with product confidence and a clean first step.',
  basic: 'Built for sponsors who want stronger direct-referral momentum.',
  standard: 'The momentum package for members who want broader leverage across the public plan.',
  business: 'Leadership-positioned with stronger optics and higher ambition.',
  vip: 'Top-tier public positioning for members who want maximum prestige.'
};

export function RegistrationPageView({ content: _content }: { content: PageContent }) {
  const { confirmAction, notify } = useFeedback();
  const [searchParams] = useSearchParams();
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [liteVisualMode, setLiteVisualMode] = useState(false);
  const initialPreferredSide = searchParams.get('preferredSide') === 'right' ? 'right' : 'left';
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    sponsorCode: searchParams.get('ref') ?? '',
    packageTier: 'standard',
    preferredSide: initialPreferredSide as 'left' | 'right',
    password: '',
    confirmPassword: '',
    termsAccepted: false
  });
  const [preview, setPreview] = useState<RegistrationPreview | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const passwordsMatch = form.password.length > 0 && form.password === form.confirmPassword;
  const selectedPackage = useMemo(
    () => `${form.packageTier.charAt(0).toUpperCase()}${form.packageTier.slice(1)}`,
    [form.packageTier]
  );

  useEffect(() => {
    if (!form.sponsorCode || !form.password || !passwordsMatch) {
      return;
    }

    void handlePreview();
  }, []);

  useEffect(() => {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const compactViewport = window.matchMedia('(max-width: 820px)');
    const coarsePointer = window.matchMedia('(pointer: coarse)');

    const syncMode = () => {
      setLiteVisualMode(reducedMotion.matches || compactViewport.matches || coarsePointer.matches);
    };

    syncMode();
    reducedMotion.addEventListener('change', syncMode);
    compactViewport.addEventListener('change', syncMode);
    coarsePointer.addEventListener('change', syncMode);

    return () => {
      reducedMotion.removeEventListener('change', syncMode);
      compactViewport.removeEventListener('change', syncMode);
      coarsePointer.removeEventListener('change', syncMode);
    };
  }, []);

  useLayoutEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion || liteVisualMode) {
      return;
    }

    const ctx = gsap.context(() => {
      gsap.fromTo(
        '.registration-hero-panel',
        { opacity: 0, y: 40 },
        {
          opacity: 1,
          y: 0,
          duration: 0.86,
          stagger: 0.1,
          ease: 'power3.out'
        }
      );
    }, rootRef);

    return () => ctx.revert();
  }, [liteVisualMode]);

  async function handlePreview() {
    if (!form.password) {
      notify({
        title: 'Password required',
        description: 'Set the account password before previewing the registration.',
        tone: 'warning'
      });
      return;
    }

    if (!passwordsMatch) {
      notify({
        title: 'Passwords do not match',
        description: 'Confirm the password so the registration preview matches the final account details.',
        tone: 'warning'
      });
      return;
    }

    setLoadingPreview(true);

    try {
      const nextPreview = await fetchRegistrationPreview({
        fullName: form.fullName,
        email: form.email,
        phone: form.phone,
        password: form.password,
        sponsorCode: form.sponsorCode,
        packageTier: form.packageTier,
        preferredSide: form.preferredSide
      });
      setPreview(nextPreview);
      notify({
        title: nextPreview.canProceed ? 'Registration preview ready' : 'Registration needs review',
        description: nextPreview.canProceed
          ? 'Sponsor, placement, and released code were checked.'
          : nextPreview.issues[0] ?? 'Some registration details need attention.',
        tone: nextPreview.canProceed ? 'success' : 'warning'
      });
    } catch (cause) {
      setPreview(null);
      notify({
        title: 'Unable to preview registration',
        description: cause instanceof Error ? cause.message : 'Please check the form and try again.',
        tone: 'destructive'
      });
    } finally {
      setLoadingPreview(false);
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!passwordsMatch) {
      notify({
        title: 'Passwords do not match',
        description: 'Please confirm the password before creating the account.',
        tone: 'warning'
      });
      return;
    }

    if (!form.termsAccepted) {
      notify({
        title: 'Acknowledge the registration terms',
        description: 'Please confirm the registration terms before continuing.',
        tone: 'warning'
      });
      return;
    }

    const confirmed = await confirmAction({
      title: 'Create account?',
      description:
        'This will use the selected sponsor-owned code, create the member, and make the account immediately available in this branch runtime.',
      confirmLabel: 'Create Account',
      tone: 'warning'
    });

    if (!confirmed) {
      return;
    }

    setSubmitting(true);

    try {
      const result = await submitRegistration({
        fullName: form.fullName,
        email: form.email,
        phone: form.phone,
        password: form.password,
        sponsorCode: form.sponsorCode,
        packageTier: form.packageTier,
        preferredSide: form.preferredSide
      });
      notify({
        title: result.createdMember ? 'Account created' : 'Registration committed',
        description: result.createdMember
          ? `${result.createdMember.username} is ready. Login email: ${result.createdMember.loginEmail}.`
          : result.detail ?? result.reason,
        tone: 'success'
      });
    } catch (cause) {
      notify({
        title: 'Unable to submit registration',
        description: cause instanceof Error ? cause.message : 'Please try again.',
        tone: 'destructive'
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className={`registration-page registration-page--refined ${liteVisualMode ? 'is-lite' : ''}`} ref={rootRef}>
      <div className="registration-background">
        <img alt="" src={pageAssets.registrationBackdrop} />
        <div className="registration-overlay" />
      </div>
      {!liteVisualMode ? <AmbientEmbers /> : null}

      <div className="page-container registration-shell registration-shell--single">
        <div className="registration-card registration-hero-panel">
          <BackToExperienceLink />
          <div className="registration-card-logo">
            <YorBrandMark className="registration-form-logo" />
          </div>
          <span className="eyebrow">Official Registration</span>
          <h1>Start Your Yor International Journey</h1>
          <p>
            Complete the details below to create your account, align your sponsor path, and confirm the package and placement required by the system.
          </p>

          <form className="registration-form-core" onSubmit={handleSubmit}>

            {/* Step 1 */}
            <div className="registration-form-group">
              <div className="reg-step-head">
                <span className="reg-step-badge">01</span>
                <div>
                  <div className="registration-form-group-title">Personal Information</div>
                  <div className="reg-step-sub">Your name, contact details</div>
                </div>
              </div>
              <div className="reg-field-stack">
                <label className="reg-field">
                  <span>Full Name</span>
                  <div className="reg-input-wrap">
                    <User className="reg-input-icon" size={15} />
                    <input
                      placeholder="Jonathan Sterling"
                      type="text"
                      value={form.fullName}
                      onChange={(event) => setForm((current) => ({ ...current, fullName: event.target.value }))}
                    />
                  </div>
                </label>
                <div className="reg-field-row">
                  <label className="reg-field">
                    <span>Email Address</span>
                    <div className="reg-input-wrap">
                      <Mail className="reg-input-icon" size={15} />
                      <input
                        placeholder="member@yorinternational.com"
                        type="email"
                        value={form.email}
                        onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                      />
                    </div>
                  </label>
                  <label className="reg-field">
                    <span>Phone Number</span>
                    <div className="reg-input-wrap">
                      <Phone className="reg-input-icon" size={15} />
                      <input
                        placeholder="+63 900 000 0000"
                        type="tel"
                        value={form.phone}
                        onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))}
                      />
                    </div>
                  </label>
                </div>
              </div>
            </div>

            {/* Step 2 */}
            <div className="registration-form-group">
              <div className="reg-step-head">
                <span className="reg-step-badge">02</span>
                <div>
                  <div className="registration-form-group-title">Account Security</div>
                  <div className="reg-step-sub">Set a strong password</div>
                </div>
              </div>
              <div className="reg-field-stack">
                <div className="reg-field-row">
                  <label className="reg-field">
                    <span>Password</span>
                    <div className="reg-input-wrap">
                      <Lock className="reg-input-icon" size={15} />
                      <input
                        placeholder="Create account password"
                        type={showPassword ? 'text' : 'password'}
                        value={form.password}
                        onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
                      />
                      <button
                        type="button"
                        className="reg-pw-toggle"
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                        onClick={() => setShowPassword((v) => !v)}
                      >
                        {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                  </label>
                  <label className="reg-field">
                    <span>Confirm Password</span>
                    <div className="reg-input-wrap">
                      <Lock className="reg-input-icon" size={15} />
                      <input
                        className={form.confirmPassword && !passwordsMatch ? 'is-error' : passwordsMatch ? 'is-ok' : ''}
                        placeholder="Confirm password"
                        type={showConfirm ? 'text' : 'password'}
                        value={form.confirmPassword}
                        onChange={(event) => setForm((current) => ({ ...current, confirmPassword: event.target.value }))}
                      />
                      <button
                        type="button"
                        className="reg-pw-toggle"
                        aria-label={showConfirm ? 'Hide password' : 'Show password'}
                        onClick={() => setShowConfirm((v) => !v)}
                      >
                        {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                  </label>
                </div>
              </div>
              {!passwordsMatch && form.confirmPassword ? (
                <p className="registration-inline-note is-warning">Passwords must match before preview and registration.</p>
              ) : null}
            </div>

            {/* Step 3 */}
            <div className="registration-form-group">
              <div className="reg-step-head">
                <span className="reg-step-badge">03</span>
                <div>
                  <div className="registration-form-group-title">Sponsor &amp; Placement</div>
                  <div className="reg-step-sub">Referral code, package, and position</div>
                </div>
              </div>
              <div className="reg-field-stack">
                <div className="reg-field-row">
                  <label className="reg-field">
                    <span>Sponsor Code</span>
                    <div className="reg-input-wrap">
                      <KeyRound className="reg-input-icon" size={15} />
                      <input
                        placeholder="YL-8839-GOLD"
                        type="text"
                        value={form.sponsorCode}
                        onChange={(event) => setForm((current) => ({ ...current, sponsorCode: event.target.value }))}
                      />
                    </div>
                  </label>
                  <label className="reg-field">
                    <span>Preferred Side</span>
                    <div className="reg-input-wrap reg-input-wrap--select">
                      <select
                        value={form.preferredSide}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            preferredSide: event.target.value as 'left' | 'right'
                          }))
                        }
                      >
                        <option value="left">Left</option>
                        <option value="right">Right</option>
                      </select>
                    </div>
                  </label>
                </div>
                <label className="reg-field">
                  <span>Package Tier</span>
                  <div className="reg-package-grid">
                    {(['basic', 'classic', 'standard', 'business', 'vip'] as const).map((pkg) => (
                      <button
                        key={pkg}
                        type="button"
                        className={`reg-package-chip reg-package-chip--${pkg}${form.packageTier === pkg ? ' is-selected' : ''}`}
                        onClick={() => setForm((current) => ({ ...current, packageTier: pkg }))}
                      >
                        <Wallet size={11} />
                        <span>{pkg === 'vip' ? 'VIP' : pkg.charAt(0).toUpperCase() + pkg.slice(1)}</span>
                      </button>
                    ))}
                  </div>
                </label>
              </div>
            </div>

            <label className="registration-terms-row">
              <span className="registration-terms-check-wrap">
                <input
                  checked={form.termsAccepted}
                  type="checkbox"
                  onChange={(event) => setForm((current) => ({ ...current, termsAccepted: event.target.checked }))}
                />
                <span className="registration-terms-check-box" aria-hidden="true" />
              </span>
              <span className="registration-terms-text">
                I agree to the registration terms and confirm that the sponsor, package, and placement details above are correct.
              </span>
            </label>

            {/* Desktop action row (hidden on mobile — sticky bar takes over) */}
            <div className="registration-form-actions reg-actions-desktop">
              <button className="site-cta" type="button" onClick={() => void handlePreview()}>
                {loadingPreview ? 'Checking…' : 'Preview Registration'}
              </button>
              <button className="site-cta registration-secondary-action" disabled={submitting || !passwordsMatch || !form.termsAccepted} type="submit">
                {submitting ? 'Creating Account…' : 'Register Now'}
              </button>
            </div>
          </form>

          {/* Mobile sticky action bar */}
          <div className="reg-mobile-bar">
            <button className="reg-mobile-preview-btn" type="button" onClick={() => void handlePreview()}>
              {loadingPreview ? 'Checking…' : 'Preview'}
            </button>
            <button
              className="reg-mobile-submit-btn"
              disabled={submitting || !passwordsMatch || !form.termsAccepted}
              type="submit"
              form="reg-form-stub"
              onClick={() => { const el = document.querySelector<HTMLFormElement>('.registration-form-core'); el?.requestSubmit(); }}
            >
              {submitting ? 'Creating…' : 'Register Now →'}
            </button>
          </div>

          <div className="registration-preview-inline">
            <div className="registration-preview-inline-head">
              <div>
                <span className="eyebrow">Selection</span>
                <h2>{selectedPackage} Package</h2>
              </div>
              <p>{packageNarratives[form.packageTier]}</p>
            </div>

            {preview ? (
              <div className="registration-preview-inline-grid">
                <div className="registration-preview-inline-card">
                  <div className="registration-preview-label">
                    <BadgeCheck size={16} />
                    <span>Sponsor</span>
                  </div>
                  <p>
                    {preview.sponsor
                      ? `${preview.sponsor.fullName} (${preview.sponsor.username})`
                      : 'Sponsor not resolved'}
                  </p>
                  <p>{preview.matchingCode ? `Activation code: ${preview.matchingCode.code}` : 'No released code available yet'}</p>
                </div>
                <div className="registration-preview-inline-card">
                  <div className="registration-preview-label">
                    <ShieldCheck size={16} />
                    <span>Placement</span>
                  </div>
                  <p>
                    {preview.placement
                      ? `${preview.placement.placementUsername} / ${preview.placement.placementSide}`
                      : 'Placement not yet available'}
                  </p>
                  <p>{preview.checklist[0] ?? 'Review the final sponsor path before submitting.'}</p>
                </div>
                {preview.issues.length ? (
                  <div className="registration-preview-inline-card is-warning">
                    <div className="registration-preview-label">
                      <Sparkles size={16} />
                      <span>Needs Attention</span>
                    </div>
                    {preview.issues.map((issue) => (
                      <p key={issue}>{issue}</p>
                    ))}
                  </div>
                ) : null}
              </div>
            ) : null}

            <NavLink className="registration-preview-link" to="/packages">
              Review package ladder
              <ArrowRight size={16} />
            </NavLink>
          </div>
        </div>
      </div>
    </section>
  );
}
