import { useEffect, useState } from 'react';
import { Eye, EyeOff, Lock, User, Shield, ArrowLeft } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { useFeedback } from '../components/feedback/FeedbackProvider';
import { YorBrandMark } from '../components/branding/YorBrandMark';
import type { AppRole } from '../types/auth';
import { buildSeoConfig, useSeoDocument } from '../lib/seo';
import { NavLink } from 'react-router-dom';
import '../components/pages/HomeExperiencePage.css';

type LocationState = { from?: string };

const credentialLabels: Record<AppRole, string> = {
  member: 'Member',
  admin: 'Admin',
  cashier: 'Cashier',
  bod: 'BOD',
  superadmin: 'Super Admin',
};

export function getDefaultDashboardPath(
  role: AppRole | undefined
): '/admin' | '/member' | '/cashier' | '/bod' {
  if (role === 'cashier') return '/cashier';
  if (role === 'bod') return '/bod';
  return role && role !== 'member' ? '/admin' : '/member';
}

export function getPostLoginPath(
  role: AppRole | undefined,
  requestedPath: string | undefined
): '/admin' | '/member' | '/cashier' | '/bod' | string {
  const defaultPath = getDefaultDashboardPath(role);
  if (!requestedPath) return defaultPath;
  if (
    role === 'member' &&
    (requestedPath.startsWith('/admin') ||
      requestedPath.startsWith('/cashier') ||
      requestedPath.startsWith('/bod'))
  ) return defaultPath;
  if (role === 'cashier' && (requestedPath.startsWith('/admin') || requestedPath.startsWith('/bod')))
    return defaultPath;
  if (role === 'bod' && (requestedPath.startsWith('/admin') || requestedPath.startsWith('/cashier')))
    return defaultPath;
  if ((role === 'admin' || role === 'superadmin') && requestedPath.startsWith('/member'))
    return defaultPath;
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

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rememberMe, setRememberMe] = useState(false);
  const portalLabel = scope === 'office' ? 'Office Login' : 'Member Login';

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
        tone: 'success',
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
    <div className="story-landing-page is-lite-experience" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>


      {/* Main Login Content */}
      <main style={{ flex: 1, padding: '6rem 4vw', display: 'flex', alignItems: 'center', background: '#030303', position: 'relative' }}>
        <section id="scene-login" className="inline-login-section" style={{ width: '100%', background: 'transparent', padding: 0 }}>
          <div className="login-pattern-bg" />
          <div className="section-container" style={{ width: '100%', maxWidth: '1200px', margin: '0 auto' }}>
            <div className="login-content-wrap">
              {/* Branding Panel */}
              <div className="login-brand-col">
                <div className="login-logo-wrap">
                  <YorBrandMark className="login-logo-svg" variant="showcase" />
                </div>
                <div className="login-brand-copy-text">
                  <span className="eyebrow">Yor International</span>
                  <h1>
                    Your Legacy
                    <br />
                    <span className="gold-text">Starts Here</span>
                  </h1>
                  <p>
                    A premier global network built on fragrance excellence, ocular wellness, and life-changing financial opportunity.
                  </p>
                </div>
                {/* Rank strip */}
                <div className="login-rank-strip">
                  {['Manager', 'Bronze', 'Silver', 'Gold', 'Platinum', 'Legacy'].map((rank, i) => (
                    <div key={rank} className={`rank-pip rank-pip-${i}`}>
                      <span className="pip-dot" />
                      <span className="pip-label">{rank}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Form Panel */}
              <div className="login-form-col">
                <button
                  type="button"
                  className="footer-link-btn"
                  onClick={handleBack}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', color: '#c5a880', marginBottom: '1.25rem' }}
                >
                  <ArrowLeft size={14} />
                  Back
                </button>
                <div className="login-form-header">
                  <div className="secure-badge">
                    <Lock size={12} />
                    <span>Secure Access</span>
                  </div>
                  <h2>{portalLabel}</h2>
                  <p>
                    {scope === 'office'
                      ? 'Sign in to your admin, cashier, or board office account.'
                      : 'Sign in to your Yor member account.'}
                  </p>
                </div>

                <form className="login-form-element" onSubmit={handleSubmit}>
                  {/* Username */}
                  <label className="login-field-wrap">
                    <span>Username</span>
                    <div className="login-input-inner">
                      <User size={16} className="login-input-icon" />
                      <input
                        type="text"
                        placeholder={scope === 'office' ? 'yoradmin' : 'YOR0001'}
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                      />
                    </div>
                  </label>

                  {/* Password */}
                  <label className="login-field-wrap">
                    <span>Password</span>
                    <div className="login-input-inner">
                      <Lock size={16} className="login-input-icon" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                      />
                      <button
                        type="button"
                        className="login-pw-toggle-btn"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </label>

                  {/* Remember me */}
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

                  {/* Error */}
                  {error ? (
                    <div className="login-error-banner" style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', color: '#f87171', padding: '0.75rem 1rem', borderRadius: '8px', marginBottom: '1.5rem', fontSize: '0.85rem' }}>
                      {error}
                    </div>
                  ) : null}

                  {/* Submit */}
                  <button className="login-submit-action-btn" type="submit" disabled={isSubmitting}>
                    {isSubmitting ? 'Signing In...' : 'Sign In'}
                  </button>
                </form>

                {scope === 'member' ? (
                  <p style={{ marginTop: '2rem', textAlign: 'center', fontSize: '0.85rem', color: 'rgba(255,255,255,0.4)' }}>
                    Not a member yet?{' '}
                    <NavLink to="/register" style={{ color: '#c5a880', textDecoration: 'underline' }}>
                      Register here
                    </NavLink>
                    <span style={{ display: 'block', marginTop: '0.5rem' }}>
                      Office user?{' '}
                      <NavLink to="/admin/login" style={{ color: '#c5a880', textDecoration: 'underline' }}>
                        Office Login
                      </NavLink>
                    </span>
                  </p>
                ) : (
                  <p style={{ marginTop: '2rem', textAlign: 'center', fontSize: '0.85rem', color: 'rgba(255,255,255,0.4)' }}>
                    Member user?{' '}
                    <NavLink to="/login" style={{ color: '#c5a880', textDecoration: 'underline' }}>
                      Member Login
                    </NavLink>
                  </p>
                )}
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Matching Luxury Footer */}
      <footer className="luxury-footer" style={{ borderTop: '1px solid rgba(255,255,255,0.03)', background: '#030303', padding: '4rem 8vw 2rem' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', color: '#666' }}>
          <div>© {new Date().getFullYear()} YOR International. All rights reserved.</div>
          <div>Secure Portal Gateway</div>
        </div>
      </footer>
    </div>
  );
}
