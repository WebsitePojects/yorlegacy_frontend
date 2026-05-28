import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

type LocationState = {
  from?: string;
};

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, getDemoCredentials } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [demoInfo, setDemoInfo] = useState<Record<string, { email: string; password: string }> | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      await login({ email, password });
      const nextPath = (location.state as LocationState | null)?.from;
      navigate(nextPath || '/member', { replace: true });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to sign in');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function showDemoCredentials() {
    const credentials = await getDemoCredentials();
    setDemoInfo(credentials);
  }

  return (
    <section className="auth-page">
      <div className="page-container auth-grid">
        <article className="glass-panel auth-info-card">
          <span className="eyebrow">Secure Access</span>
          <h1 className="display-heading">Sign in to Yor Access</h1>
          <p className="hero-summary">
            Role-based routes are protected now. Members and admins land on different
            dashboards, and protected API calls require a signed session cookie.
          </p>
          <button className="site-cta auth-demo-button" onClick={() => void showDemoCredentials()} type="button">
            Show Demo Credentials
          </button>
          {demoInfo ? (
            <div className="auth-demo-credentials">
              <p><strong>Member:</strong> {demoInfo.member.email} / {demoInfo.member.password}</p>
              <p><strong>Admin:</strong> {demoInfo.admin.email} / {demoInfo.admin.password}</p>
            </div>
          ) : null}
        </article>
        <form className="glass-panel auth-form-card" onSubmit={handleSubmit}>
          <span className="eyebrow">Role Login</span>
          <label className="auth-field">
            <span>Email</span>
            <input
              autoComplete="username"
              onChange={(event) => setEmail(event.target.value)}
              placeholder="member@yor.local"
              type="email"
              value={email}
            />
          </label>
          <label className="auth-field">
            <span>Password</span>
            <input
              autoComplete="current-password"
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Enter password"
              type="password"
              value={password}
            />
          </label>
          {error ? <p className="auth-error">{error}</p> : null}
          <button className="site-cta auth-submit" disabled={isSubmitting} type="submit">
            {isSubmitting ? 'Signing In...' : 'Sign In'}
          </button>
        </form>
      </div>
    </section>
  );
}
