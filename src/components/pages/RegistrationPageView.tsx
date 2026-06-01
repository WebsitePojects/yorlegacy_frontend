import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { ArrowRight, BadgeCheck, ShieldCheck, Sparkles } from 'lucide-react';
import gsap from 'gsap';
import { NavLink, useSearchParams } from 'react-router-dom';
import { useFeedback } from '../feedback/FeedbackProvider';
import { pageAssets } from '../../config/pagePresets';
import { fetchRegistrationPreview, submitRegistration } from '../../lib/api';
import type { PageContent } from '../../types/content';
import type { RegistrationPreview } from '../../types/registration';
import { YorBrandMark } from '../branding/YorBrandMark';
import { AmbientEmbers } from '../layout/AmbientEmbers';

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
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    sponsorCode: searchParams.get('ref') ?? '',
    packageTier: 'standard',
    preferredSide: 'left' as 'left' | 'right',
    password: '',
    confirmPassword: '',
    termsAccepted: false
  });
  const [preview, setPreview] = useState<RegistrationPreview | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const passwordsMatch = form.password.length > 0 && form.password === form.confirmPassword;
  const selectedPackage = useMemo(
    () => `${form.packageTier.charAt(0).toUpperCase()}${form.packageTier.slice(1)}`,
    [form.packageTier]
  );

  useEffect(() => {
    if (!form.sponsorCode) {
      return;
    }

    void handlePreview();
  }, []);

  useLayoutEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) {
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
  }, []);

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
    <section className="registration-page registration-page--refined" ref={rootRef}>
      <div className="registration-background">
        <img alt="" src={pageAssets.registrationBackdrop} />
        <div className="registration-overlay" />
      </div>
      <AmbientEmbers />

      <div className="page-container registration-shell registration-shell--single">
        <div className="registration-card registration-hero-panel">
          <div className="registration-card-logo">
            <YorBrandMark className="registration-form-logo" />
          </div>
          <span className="eyebrow">Official Registration</span>
          <h1>Start Your Yor International Journey</h1>
          <p>
            Complete the details below to create your account, align your sponsor path, and confirm the package and placement required by the system.
          </p>

          <form className="registration-form-core" onSubmit={handleSubmit}>
            <div className="registration-form-group">
              <div className="registration-form-group-title">Personal Information</div>
              <div className="field-grid">
                <label>
                  <span>Full Name</span>
                  <input
                    placeholder="Jonathan Sterling"
                    type="text"
                    value={form.fullName}
                    onChange={(event) => setForm((current) => ({ ...current, fullName: event.target.value }))}
                  />
                </label>
                <label>
                  <span>Email Address</span>
                  <input
                    placeholder="member@yorinternational.com"
                    type="email"
                    value={form.email}
                    onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                  />
                </label>
                <label className="field-grid-span-2">
                  <span>Phone Number</span>
                  <input
                    placeholder="+63 900 000 0000"
                    type="tel"
                    value={form.phone}
                    onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))}
                  />
                </label>
              </div>
            </div>

            <div className="registration-form-group">
              <div className="registration-form-group-title">Account Security</div>
              <div className="field-grid">
                <label className="field-grid-span-2">
                  <span>Password</span>
                  <input
                    placeholder="Create account password"
                    type="password"
                    value={form.password}
                    onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
                  />
                </label>
                <label className="field-grid-span-2">
                  <span>Confirm Password</span>
                  <input
                    placeholder="Confirm password"
                    type="password"
                    value={form.confirmPassword}
                    onChange={(event) => setForm((current) => ({ ...current, confirmPassword: event.target.value }))}
                  />
                </label>
              </div>
              {!passwordsMatch && form.confirmPassword ? (
                <p className="registration-inline-note is-warning">Passwords must match before preview and registration.</p>
              ) : null}
            </div>

            <div className="registration-form-group">
              <div className="registration-form-group-title">Sponsor And Placement</div>
              <div className="field-grid">
                <label>
                  <span>Sponsor Code</span>
                  <input
                    placeholder="YL-8839-GOLD"
                    type="text"
                    value={form.sponsorCode}
                    onChange={(event) => setForm((current) => ({ ...current, sponsorCode: event.target.value }))}
                  />
                </label>
                <label>
                  <span>Package</span>
                  <select
                    value={form.packageTier}
                    onChange={(event) => setForm((current) => ({ ...current, packageTier: event.target.value }))}
                  >
                    <option value="basic">Basic</option>
                    <option value="classic">Classic</option>
                    <option value="standard">Standard</option>
                    <option value="business">Business</option>
                    <option value="vip">VIP</option>
                  </select>
                </label>
                <label className="field-grid-span-2">
                  <span>Preferred Side</span>
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
                </label>
              </div>
            </div>

            <label className="registration-terms-row">
              <input
                checked={form.termsAccepted}
                type="checkbox"
                onChange={(event) => setForm((current) => ({ ...current, termsAccepted: event.target.checked }))}
              />
              <span>
                I agree to the registration terms and confirm that the sponsor, package, and placement details above are correct.
              </span>
            </label>

            <div className="registration-form-actions">
              <button className="site-cta" type="button" onClick={() => void handlePreview()}>
                {loadingPreview ? 'Checking Preview...' : 'Preview Registration'}
              </button>
              <button className="site-cta registration-secondary-action" disabled={submitting || !passwordsMatch || !form.termsAccepted} type="submit">
                {submitting ? 'Creating Account...' : 'Register Now'}
              </button>
            </div>
          </form>

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
