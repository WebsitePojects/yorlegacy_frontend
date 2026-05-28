import { useEffect, useEffectEvent, useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import type { DashboardSummary, MemberOfficeData } from '../types/auth';

export function MemberDashboardPage() {
  const { getMemberOffice, getMemberSummary } = useAuth();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [office, setOffice] = useState<MemberOfficeData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const loadSummary = useEffectEvent(async () => {
    try {
      const [nextSummary, nextOffice] = await Promise.all([
        getMemberSummary(),
        getMemberOffice()
      ]);
      setSummary(nextSummary);
      setOffice(nextOffice);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to load member dashboard');
    }
  });

  useEffect(() => {
    void loadSummary();
  }, [loadSummary]);

  if (error) {
    return (
      <section className="page-template">
        <div className="page-container">
          <div className="glass-panel content-card">
            <span className="eyebrow">Member Access</span>
            <h1 className="display-heading">Unable to load member dashboard</h1>
            <p className="hero-summary">{error}</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="page-template dashboard-page">
      <div className="page-container">
        <div className="glass-panel content-card">
          <span className="eyebrow">Member Dashboard</span>
          <h1 className="display-heading">Protected member area</h1>
          <p className="hero-summary">
            This route is now role-gated and backed by authenticated API access instead of
            living as a public page.
          </p>
        </div>
        {summary ? (
          <div className="dashboard-grid">
            <article className="glass-panel dashboard-card">
              <h2>Accessible Modules</h2>
              <ul>
                {summary.modules.map((module) => (
                  <li key={module}>{module}</li>
                ))}
              </ul>
            </article>
            {office ? (
              <article className="glass-panel dashboard-card">
                <h2>Member Office Snapshot</h2>
                <ul>
                  <li><strong>Package Tier:</strong> {office.profile.packageTier}</li>
                  <li><strong>Referral Code:</strong> {office.profile.referralCode}</li>
                  <li><strong>Sponsor Code:</strong> {office.profile.sponsorCode}</li>
                  <li><strong>Available Balance:</strong> {office.wallet.availableBalance}</li>
                  <li><strong>Pending Balance:</strong> {office.wallet.pendingBalance}</li>
                  <li><strong>Payout Schedule:</strong> {office.wallet.payoutSchedule}</li>
                </ul>
              </article>
            ) : null}
            <article className="glass-panel dashboard-card">
              <h2>Current Status</h2>
              <ul>
                {Object.entries(summary.status).map(([key, value]) => (
                  <li key={key}>
                    <strong>{key}:</strong> {value}
                  </li>
                ))}
              </ul>
            </article>
            {office ? (
              <article className="glass-panel dashboard-card">
                <h2>Actions And Alerts</h2>
                <ul>
                  {office.actions.map((action) => (
                    <li key={action}>{action}</li>
                  ))}
                </ul>
                <ul>
                  {office.alerts.map((alert) => (
                    <li key={alert}><strong>Alert:</strong> {alert}</li>
                  ))}
                </ul>
              </article>
            ) : null}
          </div>
        ) : null}
      </div>
    </section>
  );
}
