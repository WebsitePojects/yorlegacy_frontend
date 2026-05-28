import { useEffect, useEffectEvent, useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import type { AdminOfficeData, DashboardSummary } from '../types/auth';

export function AdminDashboardPage() {
  const { getAdminOffice, getAdminSummary } = useAuth();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [office, setOffice] = useState<AdminOfficeData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const loadSummary = useEffectEvent(async () => {
    try {
      const [nextSummary, nextOffice] = await Promise.all([
        getAdminSummary(),
        getAdminOffice()
      ]);
      setSummary(nextSummary);
      setOffice(nextOffice);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to load admin dashboard');
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
            <span className="eyebrow">Admin Access</span>
            <h1 className="display-heading">Unable to load admin dashboard</h1>
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
          <span className="eyebrow">Admin Dashboard</span>
          <h1 className="display-heading">Operational access control</h1>
          <p className="hero-summary">
            This route is restricted to admin sessions and represents the secure entry point
            for future Yor operational tooling.
          </p>
        </div>
        {summary ? (
          <div className="dashboard-grid">
            <article className="glass-panel dashboard-card">
              <h2>Admin Modules</h2>
              <ul>
                {summary.modules.map((module) => (
                  <li key={module}>{module}</li>
                ))}
              </ul>
            </article>
            {office ? (
              <article className="glass-panel dashboard-card">
                <h2>Operational Metrics</h2>
                <ul>
                  {office.metrics.map((metric) => (
                    <li key={metric.label}>
                      <strong>{metric.label}:</strong> {metric.value}
                    </li>
                  ))}
                </ul>
              </article>
            ) : null}
            <article className="glass-panel dashboard-card">
              <h2>Security Status</h2>
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
                <h2>Queues And Notices</h2>
                <ul>
                  {office.queues.map((queue) => (
                    <li key={queue}>{queue}</li>
                  ))}
                </ul>
                <ul>
                  {office.notices.map((notice) => (
                    <li key={notice}><strong>Notice:</strong> {notice}</li>
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
