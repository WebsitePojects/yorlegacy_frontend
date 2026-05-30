import { useState } from 'react';
import { Eye, EyeOff, Menu } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { useFeedback } from '@/components/feedback/FeedbackProvider';
import { pageAssets } from '@/config/pagePresets';
import { YorBrandMark } from '@/components/branding/YorBrandMark';
import type { AppRole } from '../types/auth';

type LocationState = {
  from?: string;
};

const credentialLabels: Record<AppRole, string> = {
  member: 'Member',
  admin: 'Admin',
  cashier: 'Cashier',
  bod: 'BOD',
  superadmin: 'Super Admin'
};

const credentialOrder: AppRole[] = ['member', 'admin', 'cashier', 'bod', 'superadmin'];

export function getDefaultDashboardPath(
  role: AppRole | undefined
): '/admin' | '/member' | '/cashier' | '/bod' {
  if (role === 'cashier') {
    return '/cashier';
  }

  if (role === 'bod') {
    return '/bod';
  }

  return role && role !== 'member' ? '/admin' : '/member';
}

export function getPostLoginPath(
  role: AppRole | undefined,
  requestedPath: string | undefined
): '/admin' | '/member' | '/cashier' | '/bod' | string {
  const defaultPath = getDefaultDashboardPath(role);

  if (!requestedPath) {
    return defaultPath;
  }

  if (
    role === 'member' &&
    (requestedPath.startsWith('/admin') ||
      requestedPath.startsWith('/cashier') ||
      requestedPath.startsWith('/bod'))
  ) {
    return defaultPath;
  }

  if (role === 'cashier' && (requestedPath.startsWith('/admin') || requestedPath.startsWith('/bod'))) {
    return defaultPath;
  }

  if (role === 'bod' && (requestedPath.startsWith('/admin') || requestedPath.startsWith('/cashier'))) {
    return defaultPath;
  }

  if ((role === 'admin' || role === 'superadmin') && requestedPath.startsWith('/member')) {
    return defaultPath;
  }

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
        tone: 'success'
      });
      navigate(getPostLoginPath(authState.user?.role, nextPath), { replace: true });
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : 'Unable to sign in';
      setError(message);
      notify({
        title: 'Unable to sign in',
        description: message,
        tone: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function showDemoCredentials() {
    const credentials = await getDemoCredentials();
    setDemoInfo(credentials);
  }

  return (
    <section className="yor-auth-page">
      <div className="yor-auth-backdrop">
        <img alt="" src={pageAssets.authBackdrop} />
        <div className="yor-auth-overlay" />
      </div>

      <div className="page-container yor-auth-shell">
        <article className="yor-auth-story">
          <div className="yor-auth-story-mark">
            <YorBrandMark className="yor-auth-story-logo" />
          </div>
          <span className="yor-auth-kicker">Yor International Access</span>
          <h1 className="yor-auth-title">Welcome Back</h1>
          <p className="yor-auth-copy">
            Enter the protected office with the same premium visual language as the public experience, grounded in the Yor International mark and city-light atmosphere.
          </p>
          <div className="yor-auth-story-footer">
            <span>Founder-led fragrance opportunity</span>
            <button className="yor-auth-demo-link" onClick={() => void showDemoCredentials()} type="button">
              View Access Directory
            </button>
          </div>
        </article>

        <div className="yor-auth-form-shell">
          <div className="yor-auth-form-mask" />
          <div className="yor-auth-form-card">
            <div className="yor-auth-form-topbar">
              <span className="yor-auth-dot" />
              <button className="yor-auth-menu-button" type="button" aria-label="Decorative menu">
                <Menu size={18} />
              </button>
            </div>

            <div className="yor-auth-form-head">
              <span className="eyebrow">Protected Sign In</span>
              <h2>Member and office login</h2>
              <p>Use your assigned Yor International account email and password to continue.</p>
            </div>

            <form className="yor-auth-form" onSubmit={handleSubmit}>
              <label className="yor-auth-field">
                <span>Email</span>
                <input
                  autoComplete="username"
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="member@yor.local"
                  type="email"
                  value={email}
                />
              </label>

              <label className="yor-auth-field">
                <span>Password</span>
                <div className="yor-auth-password-field">
                  <input
                    autoComplete="current-password"
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Enter your password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                  />
                  <button
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className="yor-auth-password-toggle"
                    onClick={() => setShowPassword((value) => !value)}
                    type="button"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </label>

              <div className="yor-auth-form-meta">
                <label className="yor-auth-checkline">
                  <input type="checkbox" />
                  <span>Remember me</span>
                </label>
                <span className="yor-auth-meta-copy">Secure office access</span>
              </div>

              {error ? <p className="auth-error">{error}</p> : null}

              <button className="site-cta yor-auth-submit" disabled={isSubmitting} type="submit">
                {isSubmitting ? 'Signing In...' : 'Sign In'}
              </button>
            </form>

            {demoInfo ? (
              <div className="yor-auth-demo-panel">
                {credentialOrder.map((role) => (
                  <p key={role}>
                    <strong>{credentialLabels[role]}:</strong> {demoInfo[role].email} / {demoInfo[role].password}
                  </p>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
