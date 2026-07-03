import { useState } from 'react';
import { Eye, EyeOff, Lock, User, Shield, ArrowLeft } from 'lucide-react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { useFeedback } from '../components/feedback/FeedbackProvider';
import { YorBrandMark } from '../components/branding/YorBrandMark';
import type { AppRole } from '../types/auth';
import { buildSeoConfig, useSeoDocument } from '../lib/seo';
import '../components/pages/HomeExperiencePage.css';

type LocationState = { from?: string };

const credentialLabels: Record<AppRole, string> = {
  member: 'Member',
  admin: 'Admin',
  cashier: 'Cashier',
  bod: 'BOD',
  superadmin: 'Super Admin'
};

export function getDefaultDashboardPath(role: AppRole | undefined): '/admin' | '/member' | '/bod' {
  if (role === 'bod') return '/bod';
  return role && role !== 'member' ? '/admin' : '/member';
}

export function getPostLoginPath(
  role: AppRole | undefined,
  requestedPath: string | undefined
): '/admin' | '/member' | '/bod' | string {
  const defaultPath = getDefaultDashboardPath(role);
  if (!requestedPath) return defaultPath;
  if (role === 'member' && (requestedPath.startsWith('/admin') || requestedPath.startsWith('/bod'))) return defaultPath;
  if (role === 'cashier' && requestedPath.startsWith('/bod')) return defaultPath;
  if (role === 'bod' && requestedPath.startsWith('/admin')) return defaultPath;
  if ((role === 'admin' || role === 'superadmin') && requestedPath.startsWith('/member')) return defaultPath;
  return requestedPath;
}

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const { notify } = useFeedback();

  useSeoDocument(
    buildSeoConfig({
      slug: 'login',
      pathname: location.pathname
    })
  );

  const scope: 'member' | 'office' = location.pathname.startsWith('/admin') ? 'office' : 'member';
  const portalLabel = scope === 'office' ? 'Office Login' : 'Member Login';

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rememberMe, setRememberMe] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const authState = await login({ username, password, rememberMe, scope });
      const nextPath = (location.state as LocationState | null)?.from;
      notify({
        title: 'Signed in',
        description: `Opening ${credentialLabels[authState.user?.role ?? 'member']} office.`,
        tone: 'success'
      });
      navigate(getPostLoginPath(authState.user?.role, nextPath), { replace: true });
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : 'Unable to sign in';
      const portalError = message.toLowerCase().includes('office-only')
        ? 'This portal is for members only.'
        : message.toLowerCase().includes('members-only')
          ? 'This portal is for office staff only.'
          : message.toLowerCase().includes('invalid')
            ? 'Invalid username or password.'
            : message;
      setError(portalError);
      notify({ title: 'Unable to sign in', description: portalError, tone: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleBack() {
    if (window.history.length > 1) {
      navigate(-1);
      return;
    }

    navigate('/');
  }

  return (
    <div className="story-landing-page is-lite-experience login-page-shell">
      <main className="login-page-main">
        <section id="scene-login" className="inline-login-section login-page-section">
          <div className="login-pattern-bg" />
          <div className="section-container login-page-section-container">
            <div className="login-content-wrap">
              <div className="login-brand-col">
                <div className="login-logo-wrap">
                  <YorBrandMark className="login-logo-svg" variant="round" />
                </div>
                <div className="login-brand-copy-text">
                  <span className="eyebrow">Yor International</span>
                  <h1>
                    Your Legacy
                    <br />
                    <span className="gold-text">Starts Here</span>
                  </h1>
                  <p>
                    A premier global network built on fragrance excellence, ocular wellness, and life-changing
                    financial opportunity.
                  </p>
                </div>
                <div className="login-rank-strip">
                  {['Manager', 'Bronze', 'Silver', 'Gold', 'Platinum', 'Legacy'].map((rank, index) => (
                    <div key={rank} className={`rank-pip rank-pip-${index}`}>
                      <span className="pip-dot" />
                      <span className="pip-label">{rank}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="login-form-col">
                <button type="button" className="footer-link-btn login-back-btn" onClick={handleBack}>
                  <ArrowLeft size={14} />
                  Back
                </button>

                <div className="login-mobile-brand">
                  <YorBrandMark className="login-mobile-logo" variant="round" />
                  <p>Yor International</p>
                </div>

                <div className="login-form-header">
                  <div className="secure-badge">
                    <Lock size={12} />
                    <span>Secure Access</span>
                  </div>
                  <h2>{portalLabel}</h2>
                  <p>
                    {scope === 'office'
                      ? 'Sign in to your admin office account.'
                      : 'Sign in to your Yor member account.'}
                  </p>
                </div>

                <form className="login-form-element" onSubmit={handleSubmit}>
                  <label className="login-field-wrap">
                    <span>Username</span>
                    <div className="login-input-inner">
                      <User size={16} className="login-input-icon" />
                      <input
                        type="text"
                        placeholder={scope === 'office' ? 'yoradmin' : 'yor01'}
                        value={username}
                        onChange={(event) => setUsername(event.target.value)}
                        required
                      />
                    </div>
                  </label>

                  <label className="login-field-wrap">
                    <span>Password</span>
                    <div className="login-input-inner">
                      <Lock size={16} className="login-input-icon" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Enter your password"
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        required
                      />
                      <button type="button" className="login-pw-toggle-btn" onClick={() => setShowPassword((value) => !value)}>
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </label>

                  <div className="login-meta-row">
                    <label className="login-remember-checkbox">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(event) => setRememberMe(event.target.checked)}
                      />
                      <span>Remember me</span>
                    </label>
                    <span className="login-secure-tag">
                      <Shield size={11} />
                      256-bit encrypted
                    </span>
                  </div>

                  {error ? <div className="login-error-banner">{error}</div> : null}

                  <button className="login-submit-action-btn" type="submit" disabled={isSubmitting}>
                    {isSubmitting ? 'Signing In...' : 'Sign In'}
                  </button>
                </form>

                {scope === 'member' ? (
                  <p className="login-helper-links">
                    Not a member yet? <NavLink to="/register">Register here</NavLink>
                    <span>
                      Office user? <NavLink to="/admin/login">Office Login</NavLink>
                    </span>
                  </p>
                ) : (
                  <p className="login-helper-links">
                    Member user? <NavLink to="/login">Member Login</NavLink>
                  </p>
                )}
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="luxury-footer login-footer-shell">
        <div className="login-footer-inner">
          <div>© {new Date().getFullYear()} YOR International. All rights reserved.</div>
          <div className="login-footer-caption">Secure Portal Gateway</div>
        </div>
      </footer>
    </div>
  );
}
