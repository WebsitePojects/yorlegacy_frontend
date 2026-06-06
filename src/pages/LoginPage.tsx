import { useEffect, useState } from 'react';
import { Eye, EyeOff, Lock, Mail, Shield } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { useFeedback } from '@/components/feedback/FeedbackProvider';
import { YorBrandMark } from '@/components/branding/YorBrandMark';
import type { AppRole } from '../types/auth';

type LocationState = { from?: string };

const credentialLabels: Record<AppRole, string> = {
  member: 'Member',
  admin: 'Admin',
  cashier: 'Cashier',
  bod: 'BOD',
  superadmin: 'Super Admin',
};

const credentialOrder: AppRole[] = ['member', 'admin', 'cashier', 'bod', 'superadmin'];

const roleIcons: Record<AppRole, typeof Shield> = {
  member: Shield,
  admin: Shield,
  cashier: Shield,
  bod: Shield,
  superadmin: Shield,
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
  const { login, getDemoCredentials } = useAuth();
  const { notify } = useFeedback();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [demoInfo, setDemoInfo] = useState<Record<AppRole, { email: string; password: string }> | null>(null);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [liteVisualMode, setLiteVisualMode] = useState(false);

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

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      const authState = await login({ email, password });
      const nextPath = (location.state as LocationState | null)?.from;
      notify({
        title: 'Signed in',
        description: `Opening ${credentialLabels[authState.user?.role ?? 'member']} office.`,
        tone: 'success',
      });
      navigate(getPostLoginPath(authState.user?.role, nextPath), { replace: true });
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : 'Unable to sign in';
      setError(message);
      notify({ title: 'Unable to sign in', description: message, tone: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function showDemoCredentials() {
    const credentials = await getDemoCredentials();
    setDemoInfo(credentials);
  }

  return (
    <div className={`yor-login-root ${liteVisualMode ? 'is-lite' : ''}`}>
      {/* Ambient Background */}
      {!liteVisualMode ? (
        <div className="yor-login-ambient" aria-hidden="true">
          <div className="yor-login-orb yor-login-orb-1" />
          <div className="yor-login-orb yor-login-orb-2" />
          <div className="yor-login-orb yor-login-orb-3" />
          <div className="yor-login-grid" />
        </div>
      ) : null}

      {/* Main Card */}
      <main className="yor-login-card" role="main">

        {/* ── LEFT PANEL: Branding ── */}
        <aside className="yor-login-brand-panel" aria-label="YOR International branding">
          <div className="yor-login-brand-inner">
            <div className="yor-login-logo-wrap">
              <YorBrandMark className="yor-login-logo" variant="showcase" />
            </div>

            <div className="yor-login-brand-copy">
              <span className="yor-login-eyebrow">Yor International</span>
              <h1 className="yor-login-headline">
                Your Legacy
                <br />
                <span className="yor-login-headline-gold">Starts Here</span>
              </h1>
              <p className="yor-login-tagline">
                A premier global network built on fragrance excellence, ocular wellness, and life-changing financial opportunity.
              </p>
            </div>

            {/* Rank track decoration */}
            <div className="yor-login-rank-strip" aria-label="Rank progression">
              {['Manager', 'Bronze', 'Silver', 'Gold', 'Platinum', 'Legacy'].map((rank, i) => (
                <div key={rank} className={`yor-login-rank-pip yor-login-rank-pip-${i}`}>
                  <span className="yor-login-rank-pip-dot" />
                  <span className="yor-login-rank-pip-label">{rank}</span>
                </div>
              ))}
            </div>

            <div className="yor-login-brand-footer">
              <span>© {new Date().getFullYear()} YOR International</span>
              <span className="yor-login-brand-sep">·</span>
              <span>Protected Portal</span>
            </div>
          </div>
        </aside>

        {/* ── RIGHT PANEL: Form ── */}
        <div className="yor-login-form-panel">
          <div className="yor-login-form-inner">

            {/* Mobile logo */}
            <div className="yor-login-mobile-logo" aria-hidden="true">
              <YorBrandMark className="yor-login-logo-sm" variant="showcase" />
              <span className="yor-login-mobile-brand">Yor International</span>
            </div>

            <header className="yor-login-form-header">
              <div className="yor-login-badge">
                <Lock size={12} aria-hidden="true" />
                <span>Secure Access</span>
              </div>
              <h2 className="yor-login-form-title">Welcome Back</h2>
              <p className="yor-login-form-sub">Sign in to your member or office account.</p>
            </header>

            <form className="yor-login-form" onSubmit={handleSubmit} noValidate>
              {/* Email */}
              <div className={`yor-login-field ${focusedField === 'email' ? 'is-focused' : ''} ${email ? 'has-value' : ''}`}>
                <label className="yor-login-label" htmlFor="login-email">
                  Email Address
                </label>
                <div className="yor-login-input-wrap">
                  <Mail className="yor-login-input-icon" size={16} aria-hidden="true" />
                  <input
                    id="login-email"
                    className="yor-login-input"
                    type="email"
                    autoComplete="username"
                    placeholder="member@yor.local"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onFocus={() => setFocusedField('email')}
                    onBlur={() => setFocusedField(null)}
                    required
                  />
                </div>
              </div>

              {/* Password */}
              <div className={`yor-login-field ${focusedField === 'password' ? 'is-focused' : ''} ${password ? 'has-value' : ''}`}>
                <div className="yor-login-field-header">
                  <label className="yor-login-label" htmlFor="login-password">Password</label>
                </div>
                <div className="yor-login-input-wrap">
                  <Lock className="yor-login-input-icon" size={16} aria-hidden="true" />
                  <input
                    id="login-password"
                    className="yor-login-input yor-login-input-pw"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onFocus={() => setFocusedField('password')}
                    onBlur={() => setFocusedField(null)}
                    required
                  />
                  <button
                    className="yor-login-pw-toggle"
                    type="button"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    onClick={() => setShowPassword((v) => !v)}
                    tabIndex={0}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Remember me */}
              <div className="yor-login-meta">
                <label className="yor-login-check">
                  <input type="checkbox" />
                  <span className="yor-login-check-box" aria-hidden="true" />
                  <span>Remember me</span>
                </label>
                <span className="yor-login-secure-note">
                  <Shield size={11} aria-hidden="true" />
                  256-bit encrypted
                </span>
              </div>

              {/* Error */}
              {error ? (
                <div className="yor-login-error" role="alert" aria-live="assertive">
                  <span className="yor-login-error-dot" aria-hidden="true" />
                  {error}
                </div>
              ) : null}

              {/* Submit */}
              <button
                className="yor-login-submit"
                type="submit"
                disabled={isSubmitting}
                aria-busy={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <span className="yor-login-spinner" aria-hidden="true" />
                    <span>Signing In…</span>
                  </>
                ) : (
                  <span>Sign In to Portal</span>
                )}
              </button>
            </form>

            {/* Demo credentials */}
            <div className="yor-login-demo-row">
              <button
                className="yor-login-demo-btn"
                type="button"
                onClick={() => void showDemoCredentials()}
              >
                View access directory
              </button>
            </div>

            {demoInfo ? (
              <div className="yor-login-demo-panel">
                <p className="yor-login-demo-title">Access Directory</p>
                {credentialOrder.map((role) => {
                  const Icon = roleIcons[role];
                  return (
                    <div className="yor-login-demo-row-item" key={role}>
                      <div className="yor-login-demo-role-chip">
                        <Icon size={10} aria-hidden="true" />
                        <span>{credentialLabels[role]}</span>
                      </div>
                      <div className="yor-login-demo-creds">
                        <button
                          type="button"
                          className="yor-login-demo-autofill"
                          onClick={() => {
                            setEmail(demoInfo[role].email);
                            setPassword(demoInfo[role].password);
                          }}
                          title="Autofill credentials"
                        >
                          {demoInfo[role].email}
                        </button>
                        <span className="yor-login-demo-pw">{demoInfo[role].password}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : null}

            <p className="yor-login-footer-note">
              Not a member yet?{' '}
              <a className="yor-login-footer-link" href="/register">
                Register here
              </a>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
