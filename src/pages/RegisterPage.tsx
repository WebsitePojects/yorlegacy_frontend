import { useEffect, useState } from 'react';
import { Eye, EyeOff, Lock, User, Mail, Phone, KeyRound, ArrowLeft } from 'lucide-react';
import { NavLink, useLocation, useSearchParams } from 'react-router-dom';
import { useFeedback } from '../components/feedback/FeedbackProvider';
import { YorBrandMark } from '../components/branding/YorBrandMark';
import { fetchRegistrationPreview, submitRegistration } from '../lib/api';
import { buildSeoConfig, useSeoDocument } from '../lib/seo';
import '../components/pages/HomeExperiencePage.css';

export function RegisterPage() {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { confirmAction, presentNotice } = useFeedback();

  useSeoDocument(
    buildSeoConfig({
      slug: 'register',
      pathname: location.pathname
    })
  );

  const [showRegPassword, setShowRegPassword] = useState(false);
  const [showRegConfirm, setShowRegConfirm] = useState(false);
  const [regForm, setRegForm] = useState({
    fullName: '',
    username: '',
    email: '',
    phone: '',
    activationCode: '',
    password: '',
    confirmPassword: ''
  });
  const [regPreview, setRegPreview] = useState<any | null>(null);
  const [regLoadingPreview, setRegLoadingPreview] = useState(false);
  const [regSubmitting, setRegSubmitting] = useState(false);
  const regPasswordsMatch = regForm.password.length > 0 && regForm.password === regForm.confirmPassword;

  // Registration Preview Sync Effect
  useEffect(() => {
    if (!regForm.activationCode.trim()) {
      setRegPreview(null);
      return;
    }

    let cancelled = false;
    const timeout = window.setTimeout(() => {
      setRegLoadingPreview(true);
      void fetchRegistrationPreview({
        origin: 'referral-link',
        fullName: regForm.fullName,
        username: regForm.username,
        email: regForm.email,
        phone: regForm.phone,
        password: regForm.password,
        activationCode: regForm.activationCode,
        referralCode: searchParams.get('ref') || ''
      })
        .then((result) => {
          if (!cancelled) {
            setRegPreview(result);
          }
        })
        .catch(() => {
          if (!cancelled) {
            setRegPreview(null);
          }
        })
        .finally(() => {
          if (!cancelled) {
            setRegLoadingPreview(false);
          }
        });
    }, 280);

    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
    };
  }, [
    regForm.activationCode,
    regForm.email,
    regForm.fullName,
    regForm.password,
    regForm.phone,
    regForm.username,
    searchParams
  ]);

  async function handleRegisterSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!regForm.fullName.trim() || !regForm.username.trim() || !regForm.phone.trim() || !regForm.activationCode.trim()) {
      await presentNotice({
        title: 'Registration details incomplete',
        description: 'Fill in full name, username, phone number, and activation code before registering.',
        tone: 'warning'
      });
      return;
    }

    const refVal = searchParams.get('ref') || '';
    if (!refVal.trim()) {
      await presentNotice({
        title: 'Referral link required',
        description: 'Open this registration from a valid sponsor referral link so the sponsor can be resolved automatically.',
        tone: 'warning'
      });
      return;
    }

    if (!regPasswordsMatch) {
      await presentNotice({
        title: 'Passwords do not match',
        description: 'Please confirm the password before creating the account.',
        tone: 'warning'
      });
      return;
    }

    const derivedPackageTier = regPreview?.selectedPackage ?? '';
    const derivedAccountType = regPreview?.resolvedAccountType ?? '';
    const placementSummary = regPreview?.placement
      ? `${regPreview.placement.placementUsername} / ${regPreview.placement.placementSide === 'right' ? 'Right' : 'Left'}`
      : 'Auto-balanced by the system after code validation';

    const confirmed = await confirmAction({
      title: 'Register member?',
      description: [
        derivedPackageTier ? `Package: ${derivedPackageTier}` : null,
        derivedAccountType ? `Account type: ${derivedAccountType}` : null,
        `Placement: ${placementSummary}`
      ]
        .filter(Boolean)
        .join('\n'),
      confirmLabel: 'Register',
      tone: 'warning'
    });

    if (!confirmed) {
      return;
    }

    setRegSubmitting(true);

    try {
      const result = await submitRegistration({
        origin: 'referral-link',
        fullName: regForm.fullName,
        username: regForm.username,
        email: regForm.email,
        phone: regForm.phone,
        password: regForm.password,
        activationCode: regForm.activationCode,
        referralCode: refVal
      });

      await presentNotice({
        title: result.createdMember ? 'Account created' : 'Registration committed',
        description: result.createdMember
          ? [
              `Username: ${result.createdMember.username}`,
              `Package: ${result.createdMember.packageTier}`,
              `Account type: ${result.createdMember.accountType}`,
              `Sponsor: ${result.createdMember.sponsorUsername}`
            ].join('\n')
          : result.detail ?? result.reason,
        tone: 'success'
      });

      setRegForm({
        fullName: '',
        username: '',
        email: '',
        phone: '',
        activationCode: '',
        password: '',
        confirmPassword: ''
      });
      setRegPreview(null);
    } catch (cause) {
      await presentNotice({
        title: 'Unable to submit registration',
        description: cause instanceof Error ? cause.message : 'Please try again.',
        tone: 'destructive'
      });
    } finally {
      setRegSubmitting(false);
    }
  }

  return (
    <div className="story-landing-page is-lite-experience" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Floating Header */}
      <header className="story-header" style={{ position: 'sticky', top: 0, pointerEvents: 'auto', background: 'rgba(3, 3, 3, 0.9)', backdropFilter: 'blur(12px)' }}>
        <NavLink className="story-logo-wrap" to="/">
          <span className="story-brand-name">Yor International</span>
        </NavLink>
        <div className="story-header-actions">
          <NavLink className="story-nav-link" to="/login" style={{ marginRight: '1rem' }}>Portal Login</NavLink>
          <NavLink className="story-nav-link" to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
            <ArrowLeft size={12} />
            Return Home
          </NavLink>
        </div>
      </header>

      {/* Main Registration Content */}
      <main style={{ flex: 1, padding: '6rem 4vw', display: 'flex', alignItems: 'center', background: '#030303' }}>
        <section id="scene-register" className="inline-registration-section" style={{ width: '100%', background: 'transparent' }}>
          <div className="section-container" style={{ width: '100%', maxWidth: '1200px', margin: '0 auto' }}>
            <div className="registration-content-wrap">
              <div className="registration-text-col">
                <span className="eyebrow">Official Registration</span>
                <h2>Create Member Account</h2>
                <p>
                  This page is attached to a sponsor referral link. Paste the activation code your sponsor gave you and the backend will auto-balance placement after final validation.
                </p>
                <div className="registration-info-grid">
                  <div className="glass-panel info-card">
                    <span>Placement</span>
                    <strong>
                      {regPreview?.placement
                        ? `${regPreview.placement.placementUsername} / ${regPreview.placement.placementSide === 'right' ? 'Right' : 'Left'}`
                        : 'Auto-balanced by the system after code validation'}
                    </strong>
                  </div>
                  <div className="glass-panel info-card">
                    <span>Activation Result</span>
                    <strong>{regPreview?.selectedPackage || 'Waiting for activation code'}</strong>
                    {regPreview?.resolvedAccountType ? <p className="sub-text">{regPreview.resolvedAccountType} account type</p> : null}
                  </div>
                </div>
              </div>

              <div className="registration-form-col">
                <form className="inline-registration-form" onSubmit={handleRegisterSubmit}>
                  {/* Step 1: Personal Info */}
                  <div className="form-group-block">
                    <div className="group-header">
                      <span className="step-badge">01</span>
                      <div>
                        <h3>Personal Information</h3>
                        <p>Member identity and contact details</p>
                      </div>
                    </div>
                    <div className="inputs-grid">
                      <label className="input-field-wrap">
                        <span>Full Name</span>
                        <div className="input-inner">
                          <User size={15} className="input-icon" />
                          <input
                            type="text"
                            placeholder="Jonathan Sterling"
                            value={regForm.fullName}
                            onChange={(e) => setRegForm(prev => ({ ...prev, fullName: e.target.value }))}
                            required
                          />
                        </div>
                      </label>
                      <div className="inputs-row">
                        <label className="input-field-wrap">
                          <span>Username</span>
                          <div className="input-inner">
                            <User size={15} className="input-icon" />
                            <input
                              type="text"
                              placeholder="e.g. YOR0002"
                              value={regForm.username}
                              onChange={(e) => setRegForm(prev => ({ ...prev, username: e.target.value.trim().toUpperCase() }))}
                              required
                            />
                          </div>
                        </label>
                        <label className="input-field-wrap">
                          <span>Phone Number</span>
                          <div className="input-inner">
                            <Phone size={15} className="input-icon" />
                            <input
                              type="tel"
                              placeholder="+63 900 000 0000"
                              value={regForm.phone}
                              onChange={(e) => setRegForm(prev => ({ ...prev, phone: e.target.value }))}
                              required
                            />
                          </div>
                        </label>
                      </div>
                      <label className="input-field-wrap">
                        <span>Email Address (Optional)</span>
                        <div className="input-inner">
                          <Mail size={15} className="input-icon" />
                          <input
                            type="email"
                            placeholder="member@yorinternational.com"
                            value={regForm.email}
                            onChange={(e) => setRegForm(prev => ({ ...prev, email: e.target.value }))}
                          />
                        </div>
                      </label>
                    </div>
                  </div>

                  {/* Step 2: Activation Code */}
                  <div className="form-group-block">
                    <div className="group-header">
                      <span className="step-badge">02</span>
                      <div>
                        <h3>Activation Code</h3>
                        <p>Paste the code your sponsor gave you</p>
                      </div>
                    </div>
                    <div className="inputs-grid">
                      <label className="input-field-wrap">
                        <span>Activation Code</span>
                        <div className="input-inner">
                          <KeyRound size={15} className="input-icon" />
                          <input
                            type="text"
                            placeholder="Paste activation code"
                            value={regForm.activationCode}
                            onChange={(e) => setRegForm(prev => ({ ...prev, activationCode: e.target.value.toUpperCase().replace(/\s+/g, '') }))}
                            required
                          />
                        </div>
                        <p className="field-note">
                          Your sponsor should send this code privately. The form does not expose sponsor-owned codes.
                        </p>
                      </label>
                      
                      <div className="inputs-row">
                        <label className="input-field-wrap">
                          <span>Package Tier</span>
                          <div className="input-inner">
                            <KeyRound size={15} className="input-icon" />
                            <input readOnly type="text" value={regPreview?.selectedPackage || 'Waiting for code validation'} />
                          </div>
                        </label>
                        <label className="input-field-wrap">
                          <span>Account Type</span>
                          <div className="input-inner">
                            <KeyRound size={15} className="input-icon" />
                            <input readOnly type="text" value={regPreview?.resolvedAccountType || 'Waiting for code validation'} />
                          </div>
                        </label>
                      </div>

                      {regPreview?.issues.length ? (
                        <div className="form-status-banner is-warning">
                          {regPreview.issues[0]}
                        </div>
                      ) : (
                        <div className={`form-status-banner ${regLoadingPreview ? 'is-pending' : 'is-ready'}`}>
                          {regLoadingPreview ? 'Validating code and sponsor context...' : 'Activation preview is synced.'}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Step 3: Password */}
                  <div className="form-group-block">
                    <div className="group-header">
                      <span className="step-badge">03</span>
                      <div>
                        <h3>Account Security</h3>
                        <p>Set your login password</p>
                      </div>
                    </div>
                    <div className="inputs-grid">
                      <div className="inputs-row">
                        <label className="input-field-wrap">
                          <span>Password</span>
                          <div className="input-inner">
                            <Lock size={15} className="input-icon" />
                            <input
                              type={showRegPassword ? 'text' : 'password'}
                              placeholder="Create password"
                              value={regForm.password}
                              onChange={(e) => setRegForm(prev => ({ ...prev, password: e.target.value }))}
                              required
                            />
                            <button
                              type="button"
                              className="pw-toggle-btn"
                              onClick={() => setShowRegPassword(!showRegPassword)}
                            >
                              {showRegPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                            </button>
                          </div>
                        </label>
                        <label className="input-field-wrap">
                          <span>Confirm Password</span>
                          <div className="input-inner">
                            <Lock size={15} className="input-icon" />
                            <input
                              type={showRegConfirm ? 'text' : 'password'}
                              placeholder="Confirm password"
                              value={regForm.confirmPassword}
                              onChange={(e) => setRegForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                              required
                            />
                            <button
                              type="button"
                              className="pw-toggle-btn"
                              onClick={() => setShowRegConfirm(!showRegConfirm)}
                            >
                              {showRegConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
                            </button>
                          </div>
                        </label>
                      </div>
                    </div>
                  </div>

                  <button className="registration-submit-action-btn" type="submit" disabled={regSubmitting || regLoadingPreview}>
                    {regSubmitting ? 'Registering...' : 'Register'}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Matching Luxury Footer */}
      <footer className="luxury-footer" style={{ borderTop: '1px solid rgba(255,255,255,0.03)', background: '#030303', padding: '4rem 8vw 2rem' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', color: '#666' }}>
          <div>© {new Date().getFullYear()} YOR International. All rights reserved.</div>
          <div>Secure Referral Portal</div>
        </div>
      </footer>
    </div>
  );
}
