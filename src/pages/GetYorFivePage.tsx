import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Gift, Users, Clock, TrendingUp } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { MemberGetYorFiveData } from '../types/auth';

const formatCurrency = (value: number): string =>
  `PHP ${value.toLocaleString('en-PH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;

const packageColors: Record<string, { border: string; bg: string; text: string; bar: string }> = {
  Classic:  { border: 'border-[var(--office-tone-amber-border)]',   bg: 'bg-[var(--office-tone-amber-bg)]',   text: 'text-[var(--office-tone-amber-text)]',   bar: 'bg-[var(--office-tone-amber-text)]' },
  Standard: { border: 'border-[var(--office-tone-blue-border)]',    bg: 'bg-[var(--office-tone-blue-bg)]',    text: 'text-[var(--office-tone-blue-text)]',    bar: 'bg-[var(--office-tone-blue-text)]' },
  Business: { border: 'border-[var(--office-tone-emerald-border)]', bg: 'bg-[var(--office-tone-emerald-bg)]', text: 'text-[var(--office-tone-emerald-text)]', bar: 'bg-[var(--office-tone-emerald-text)]' },
  VIP:      { border: 'border-[var(--office-tone-violet-border)]',  bg: 'bg-[var(--office-tone-violet-bg)]',  text: 'text-[var(--office-tone-violet-text)]',  bar: 'bg-[var(--office-tone-violet-text)]' }
};

type StatColor = 'amber' | 'blue' | 'emerald' | 'violet';

const statColorMap: Record<StatColor, { bg: string; text: string; glow: string; border: string }> = {
  amber:   { bg: 'bg-[var(--office-tone-amber-bg)]',   text: 'text-[var(--office-tone-amber-text)]',   glow: 'shadow-[0_16px_34px_var(--office-tone-amber-shadow)]',   border: 'border-[var(--office-tone-amber-border)]' },
  blue:    { bg: 'bg-[var(--office-tone-blue-bg)]',    text: 'text-[var(--office-tone-blue-text)]',    glow: 'shadow-[0_16px_34px_var(--office-tone-blue-shadow)]',    border: 'border-[var(--office-tone-blue-border)]' },
  emerald: { bg: 'bg-[var(--office-tone-emerald-bg)]', text: 'text-[var(--office-tone-emerald-text)]', glow: 'shadow-[0_16px_34px_var(--office-tone-emerald-shadow)]', border: 'border-[var(--office-tone-emerald-border)]' },
  violet:  { bg: 'bg-[var(--office-tone-violet-bg)]',  text: 'text-[var(--office-tone-violet-text)]',  glow: 'shadow-[0_16px_34px_var(--office-tone-violet-shadow)]',  border: 'border-[var(--office-tone-violet-border)]' },
};

function StatCard({ icon, color, label, value, sub }: {
  icon: React.ReactNode; color: StatColor; label: string; value: string; sub?: string;
}) {
  const { bg, text, glow, border } = statColorMap[color];
  return (
    <div className={`flex items-start gap-3 rounded-2xl border ${border} bg-[var(--card)] p-4 shadow-md ${glow}`}>
      <span className={`flex size-9 shrink-0 items-center justify-center rounded-xl ${bg} ${text}`}>{icon}</span>
      <div className="min-w-0">
        <p className="text-xs text-[var(--muted-foreground)]">{label}</p>
        <p className={`mt-0.5 truncate text-base font-semibold ${text}`}>{value}</p>
        {sub ? <p className="mt-0.5 truncate text-xs text-[var(--muted-foreground)]">{sub}</p> : null}
      </div>
    </div>
  );
}

// ── Shareable inner content — used both in standalone page and inside the office frame ──

export function GetYorFiveContent({ data, isLoading }: {
  data: MemberGetYorFiveData | null;
  isLoading: boolean;
}) {
  const tierProgress = data?.tierProgress ?? [];
  const ledgerEntries = data?.ledgerEntries ?? [];

  return (
    <div className="space-y-6">
      {/* Summary stat strip */}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={<Gift className="size-4" />} color="amber"
          label="Total Get Yor Five Earned" value={isLoading ? '—' : formatCurrency(data?.totalEarned ?? 0)}
          sub="lifetime get_five credits" />
        <StatCard icon={<Users className="size-4" />} color="blue"
          label="Completed Groups" value={isLoading ? '—' : String(data?.completedGroupsTotal ?? 0)}
          sub="5-referral groups triggered" />
        <StatCard icon={<TrendingUp className="size-4" />} color="emerald"
          label="Bonus Per Group" value="= Package Price"
          sub="company-funded cash reward" />
        <StatCard icon={<Clock className="size-4" />} color="violet"
          label="Rule" value="5 per tier"
          sub="same-package direct referrals" />
      </div>

      {/* How it works */}
      <Card className="border-[var(--border)] bg-[var(--card)]">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">How Get Yor Five Works</CardTitle>
          <CardDescription className="text-xs">Bonus rule — same package, direct sponsorship only.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {[
            ['Requirement', 'Directly refer 5 eligible members of the same package tier (Classic, Standard, Business, or VIP) — regardless of your own package'],
            ['Eligibility', 'PD accounts and fully-settled CD accounts count. FS accounts and unsettled CD accounts do not count.'],
            ['Bonus Amount', 'One-time cash equal to that package tier\'s price (company-funded) — Classic: PHP 5,998 · Standard: PHP 25,998 · Business: PHP 50,998 · VIP: PHP 159,998'],
            ['Stacking', 'Groups of 5 — every 5th, 10th, 15th eligible referral per tier triggers a new bonus'],
            ['Package Scope', 'Classic, Standard, Business, and VIP each have their own independent counter'],
            ['Tracking', 'Wallet ledger entries with entry type get_five confirm each credit'],
          ].map(([label, desc]) => (
            <div key={label} className="flex items-start gap-3 rounded-lg px-3 py-2.5 text-sm odd:bg-[var(--accent)]/40">
              <span className="shrink-0 font-semibold text-amber-600 dark:text-amber-400 w-28">{label}</span>
              <span className="text-[var(--muted-foreground)]">{desc}</span>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Per-tier progress cards */}
      <Card className="border-[var(--border)] bg-[var(--card)]">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Per-Tier Progress</CardTitle>
          <CardDescription className="text-xs">
            Live referral counts and group completion from the database.
            {data?.memberPackageTier ? ` Your package: ${data.memberPackageTier}.` : ''}
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {isLoading
            ? [1, 2, 3, 4].map((i) => (
                <div key={i} className="h-36 animate-pulse rounded-2xl bg-[var(--accent)]/40" />
              ))
            : tierProgress.map(({ tier, claimValue, referralCount, completedGroups, remainingToNext, nextThreshold }) => {
                const colors = packageColors[tier] ?? packageColors['Classic'];
                const isMyTier = tier === data?.memberPackageTier;
                const progressPct = Math.min(100, ((referralCount % 5 || (completedGroups > 0 ? 5 : 0)) / 5) * 100);
                return (
                  <div key={tier}
                    className={`rounded-2xl border ${colors.border} ${colors.bg} p-4 ${isMyTier ? 'ring-1 ring-inset ring-amber-500/30' : ''}`}
                  >
                    <div className="flex items-center justify-between">
                      <p className={`text-xs font-semibold uppercase tracking-widest ${colors.text}`}>{tier}</p>
                      {isMyTier && <Badge variant="outline" className={`text-[9px] ${colors.text}`}>Your tier</Badge>}
                    </div>
                    <p className="mt-2 text-xl font-bold text-[var(--foreground)]">{formatCurrency(claimValue)}</p>
                    <p className="mt-0.5 text-xs text-[var(--muted-foreground)]">per group of 5</p>
                    <div className="mt-3">
                      <div className="flex items-center justify-between text-xs text-[var(--muted-foreground)] mb-1">
                        <span>{referralCount} directs</span>
                        <span>next at {nextThreshold}</span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-[var(--background)]">
                        <div className={`h-1.5 rounded-full ${colors.bar}`} style={{ width: `${progressPct}%` }} />
                      </div>
                      <p className="mt-1 text-[10px] text-[var(--muted-foreground)]">{remainingToNext} more to next group</p>
                    </div>
                    {completedGroups > 0 ? (
                      <Badge variant="outline" className={`mt-3 text-[10px] ${colors.text}`}>
                        {completedGroups} group{completedGroups !== 1 ? 's' : ''} earned
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="mt-3 text-[10px] text-[var(--muted-foreground)]">No groups yet</Badge>
                    )}
                  </div>
                );
              })}
        </CardContent>
      </Card>

      {/* Wallet ledger entries */}
      <Card className="border-[var(--border)] bg-[var(--card)]">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">Get Yor Five Wallet Entries</CardTitle>
              <CardDescription className="text-xs">
                Ledger entries with entry_type = get_five credited to your main wallet.
              </CardDescription>
            </div>
            <Badge variant="outline">{isLoading ? '—' : `${ledgerEntries.length} records`}</Badge>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-14 animate-pulse rounded-xl bg-[var(--accent)]/40" />
              ))}
            </div>
          ) : ledgerEntries.length === 0 ? (
            <div className="rounded-xl border border-[var(--border)] bg-[var(--background)] px-6 py-8 text-center">
              <Gift className="mx-auto mb-3 size-8 text-[var(--muted-foreground)]/40" />
              <p className="text-sm font-medium text-[var(--foreground)]">No Get Yor Five bonuses yet</p>
              <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                Directly refer 5 members with the same package to earn your first bonus.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-[var(--border)]">
              <table className="w-full min-w-[560px] text-sm">
                <thead>
                  <tr className="border-b border-[var(--border)] bg-[var(--accent)]/40 text-left text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--muted-foreground)]">
                    <th className="px-4 py-3">Source Reference</th>
                    <th className="px-4 py-3">Credit</th>
                    <th className="px-4 py-3">Balance After</th>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {ledgerEntries.map((entry) => (
                    <tr key={entry.id}
                      className="border-b border-[var(--border)] transition last:border-0 hover:bg-[var(--accent)]/30"
                    >
                      <td className="px-4 py-3 text-[var(--muted-foreground)] font-mono text-xs">{entry.sourceReference}</td>
                      <td className="px-4 py-3 font-semibold text-amber-600 dark:text-amber-400">{formatCurrency(entry.creditAmount)}</td>
                      <td className="px-4 py-3 text-[var(--foreground)]">{formatCurrency(entry.balanceAfter)}</td>
                      <td className="px-4 py-3 text-xs text-[var(--muted-foreground)]">
                        {entry.occurredAt ? new Date(entry.occurredAt).toLocaleDateString('en-PH', { timeZone: 'Asia/Manila' }) : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={entry.status === 'posted' ? 'success' : 'outline'} className="text-[10px]">
                          {entry.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Footer nav */}
      <div className="flex flex-wrap gap-3 pt-2">
        <Button asChild variant="outline">
          <Link to="/member/direct-referrals"><Users className="mr-2 size-4" />View Direct Referrals</Link>
        </Button>
        <Button asChild variant="outline">
          <Link to="/member/wallet">View Full Wallet</Link>
        </Button>
        <Button asChild variant="outline">
          <Link to="/earn/get-five">Learn About Get Yor Five</Link>
        </Button>
      </div>
    </div>
  );
}

// ── In-frame version — rendered inside ProtectedOfficeFrame (MemberDashboardPage) ──

export function GetYorFiveInFrame() {
  const { getMemberGetYorFive } = useAuth();
  const [data, setData] = useState<MemberGetYorFiveData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        setIsLoading(true);
        setError(null);
        const result = await getMemberGetYorFive();
        if (!cancelled) setData(result);
      } catch (cause) {
        if (!cancelled) setError(cause instanceof Error ? cause.message : 'Unable to load Get Yor Five data.');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }
    void load();
    return () => { cancelled = true; };
  }, [getMemberGetYorFive]);

  if (error) {
    return (
      <Card className="border-[var(--border)] bg-[var(--card)]">
        <CardHeader>
          <CardDescription>Get Yor Five</CardDescription>
          <CardTitle>Unable to load data</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-[var(--muted-foreground)]">{error}</CardContent>
      </Card>
    );
  }

  return <GetYorFiveContent data={data} isLoading={isLoading} />;
}

// ── Standalone page (used when navigating to /member/get-yor-five directly) ──

export function GetYorFivePage() {
  const { getMemberGetYorFive } = useAuth();
  const [data, setData] = useState<MemberGetYorFiveData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        setIsLoading(true);
        setError(null);
        const result = await getMemberGetYorFive();
        if (!cancelled) setData(result);
      } catch (cause) {
        if (!cancelled) setError(cause instanceof Error ? cause.message : 'Unable to load Get Yor Five data.');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }
    void load();
    return () => { cancelled = true; };
  }, [getMemberGetYorFive]);

  if (error) {
    return (
      <section className="min-h-screen bg-[var(--background)] px-4 py-10 text-[var(--foreground)]">
        <div className="mx-auto max-w-3xl pt-16">
          <Card>
            <CardHeader>
              <CardDescription>Get Yor Five</CardDescription>
              <CardTitle>Unable to load Get Yor Five data</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-[var(--muted-foreground)]">{error}</CardContent>
          </Card>
        </div>
      </section>
    );
  }

  return (
    <section className="min-h-screen bg-[var(--background)] px-4 py-10 text-[var(--foreground)]">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="flex items-center gap-3">
          <Button asChild variant="outline" size="sm">
            <Link to="/member/get-five-bonus">
              <ArrowLeft className="mr-1.5 size-4" />Back to Member Office
            </Link>
          </Button>
        </div>
        <div className="flex items-start gap-4">
          <span className="flex size-14 shrink-0 items-center justify-center rounded-2xl border border-amber-500/25 bg-amber-500/10 shadow-md shadow-amber-500/20">
            <Gift className="size-7 text-amber-600 dark:text-amber-400" />
          </span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-[var(--muted-foreground)]">Compensation</p>
            <h1 className="text-2xl font-bold tracking-tight text-[var(--foreground)]">Get Yor Five</h1>
            <p className="mt-1 text-sm text-[var(--muted-foreground)]">
              Earn a cash bonus equal to your package price for every 5 direct referrals in the same package tier.
            </p>
          </div>
        </div>
        <GetYorFiveContent data={data} isLoading={isLoading} />
      </div>
    </section>
  );
}
