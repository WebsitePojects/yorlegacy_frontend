import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Gift, Users, Clock, TrendingUp } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { MemberWalletDetail } from '../types/auth';

const formatCurrency = (value: number): string =>
  `PHP ${value.toLocaleString('en-PH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;

const packageClaimMap: Record<string, number> = {
  Classic: 5998,
  Standard: 25998,
  Business: 50998,
  VIP: 159998
};

const packageColors: Record<string, { border: string; bg: string; text: string }> = {
  Classic: { border: 'border-amber-500/25', bg: 'bg-amber-500/10', text: 'text-amber-600 dark:text-amber-400' },
  Standard: { border: 'border-blue-500/25', bg: 'bg-blue-500/10', text: 'text-blue-600 dark:text-blue-400' },
  Business: { border: 'border-emerald-500/25', bg: 'bg-emerald-500/10', text: 'text-emerald-600 dark:text-emerald-400' },
  VIP: { border: 'border-violet-500/25', bg: 'bg-violet-500/10', text: 'text-violet-600 dark:text-violet-400' }
};

type GetFiveEntry = {
  id: string;
  sourceReference: string;
  creditAmount: number;
  balanceAfter: number;
  status: string;
};

type PackageProgress = {
  tier: string;
  referralCount: number;
  completedGroups: number;
  remainingToNext: number;
  nextThreshold: number;
  claimValue: number;
};

export function GetYorFivePage() {
  const { getMemberWalletDetail } = useAuth();
  const [walletDetail, setWalletDetail] = useState<MemberWalletDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      try {
        setIsLoading(true);
        setError(null);
        const detail = await getMemberWalletDetail();
        if (!cancelled) {
          setWalletDetail(detail);
        }
      } catch (cause) {
        if (!cancelled) {
          setError(cause instanceof Error ? cause.message : 'Unable to load Get Yor Five data.');
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadData();
    return () => { cancelled = true; };
  }, [getMemberWalletDetail]);

  const getFiveEntries: GetFiveEntry[] = walletDetail
    ? walletDetail.ledger
        .filter((entry) => entry.entryType.toLowerCase().includes('get_five') || entry.entryType.toLowerCase().includes('get-five') || entry.entryType.toLowerCase().includes('getfive') || entry.sourceReference.toLowerCase().includes('get_five') || entry.sourceReference.toLowerCase().includes('get-five'))
        .map((entry) => ({
          id: entry.id,
          sourceReference: entry.sourceReference,
          creditAmount: entry.creditAmount,
          balanceAfter: entry.balanceAfter,
          status: entry.status
        }))
    : [];

  const getFiveIncomeStream = walletDetail?.incomeBreakdown.find(
    (s) =>
      s.streamId === 'get-five' ||
      s.streamId === 'get_five' ||
      s.label.toLowerCase().includes('get yor five') ||
      s.label.toLowerCase().includes('get five')
  );

  const totalGetFiveEarnings = getFiveEntries.reduce((sum, e) => sum + e.creditAmount, 0);
  const displayEarnings = getFiveIncomeStream ? getFiveIncomeStream.amount : totalGetFiveEarnings;

  // Build package-tier progress from income stream hints (best we can do without a dedicated endpoint)
  // We show the referral count per tier from wallet income breakdown entries grouped by source
  const packageProgressList: PackageProgress[] = Object.entries(packageClaimMap).map(([tier, claimValue]) => {
    // Count get_five entries that reference this tier
    const tierEntries = getFiveEntries.filter((e) =>
      e.sourceReference.toLowerCase().includes(tier.toLowerCase())
    );
    const completedGroups = tierEntries.length;
    // Without a dedicated endpoint we display earned groups; referral count is derived
    const referralCount = completedGroups * 5;
    const nextThreshold = (completedGroups + 1) * 5;
    const remainingToNext = 5; // within current group — unknown without a direct-referrals per-tier endpoint

    return {
      tier,
      referralCount,
      completedGroups,
      remainingToNext,
      nextThreshold,
      claimValue
    };
  });

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

        {/* Back navigation */}
        <div className="flex items-center gap-3">
          <Button asChild variant="outline" size="sm">
            <Link to="/member/get-five-bonus">
              <ArrowLeft className="mr-1.5 size-4" />
              Back to Member Office
            </Link>
          </Button>
        </div>

        {/* Page header */}
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

        {/* Summary stat strip */}
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            icon={<Gift className="size-4" />}
            color="amber"
            label="Total Get Yor Five Earned"
            value={isLoading ? '—' : formatCurrency(displayEarnings)}
            sub="lifetime get_five credits"
          />
          <StatCard
            icon={<Users className="size-4" />}
            color="blue"
            label="Completed Groups"
            value={isLoading ? '—' : String(getFiveEntries.length)}
            sub="5-referral groups triggered"
          />
          <StatCard
            icon={<TrendingUp className="size-4" />}
            color="emerald"
            label="Bonus Per Group"
            value="= Package Price"
            sub="company-funded cash reward"
          />
          <StatCard
            icon={<Clock className="size-4" />}
            color="violet"
            label="Rule"
            value="5 per tier"
            sub="same-package direct referrals"
          />
        </div>

        {/* How it works */}
        <Card className="border-[var(--border)] bg-[var(--card)]">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">How Get Yor Five Works</CardTitle>
            <CardDescription className="text-xs">Bonus rule overview — same package, direct sponsorship only.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {[
              ['Requirement', 'Directly refer 5 members who purchase the same package tier as you'],
              ['Bonus Amount', 'One-time cash equal to your package price (company-funded)'],
              ['Stacking', 'Groups of 5 — every 5th, 10th, 15th referral triggers a new bonus'],
              ['Package Scope', 'Classic, Standard, Business, and VIP each have their own counter'],
              ['Tracking', 'Wallet ledger entries with entry type get_five confirm each credit'],
            ].map(([label, desc]) => (
              <div key={label} className="flex items-start gap-3 rounded-lg px-3 py-2.5 text-sm odd:bg-[var(--accent)]/40">
                <span className="shrink-0 font-semibold text-amber-600 dark:text-amber-400 w-28">{label}</span>
                <span className="text-[var(--muted-foreground)]">{desc}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Package claim values */}
        <Card className="border-[var(--border)] bg-[var(--card)]">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Package Claim Values</CardTitle>
            <CardDescription className="text-xs">Bonus amount you earn for every completed group of 5 direct referrals in each tier.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {packageProgressList.map(({ tier, claimValue, completedGroups }) => {
              const colors = packageColors[tier] ?? packageColors['Classic'];
              return (
                <div
                  key={tier}
                  className={`rounded-2xl border ${colors.border} ${colors.bg} p-4`}
                >
                  <p className={`text-xs font-semibold uppercase tracking-widest ${colors.text}`}>{tier}</p>
                  <p className="mt-2 text-xl font-bold text-[var(--foreground)]">{formatCurrency(claimValue)}</p>
                  <p className="mt-1 text-xs text-[var(--muted-foreground)]">per group of 5 same-tier directs</p>
                  {completedGroups > 0 ? (
                    <Badge variant="outline" className={`mt-3 text-[10px] ${colors.text}`}>
                      {completedGroups} group{completedGroups !== 1 ? 's' : ''} earned
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="mt-3 text-[10px] text-[var(--muted-foreground)]">
                      No groups yet
                    </Badge>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Wallet earnings from get_five entries */}
        <Card className="border-[var(--border)] bg-[var(--card)]">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Get Yor Five Wallet Entries</CardTitle>
                <CardDescription className="text-xs">Ledger entries with entry_type = get_five credited to your main wallet.</CardDescription>
              </div>
              <Badge variant="outline">{isLoading ? '—' : `${getFiveEntries.length} records`}</Badge>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-14 animate-pulse rounded-xl bg-[var(--accent)]/40" />
                ))}
              </div>
            ) : getFiveEntries.length === 0 ? (
              <div className="rounded-xl border border-[var(--border)] bg-[var(--background)] px-6 py-8 text-center">
                <Gift className="mx-auto mb-3 size-8 text-[var(--muted-foreground)]/40" />
                <p className="text-sm font-medium text-[var(--foreground)]">No Get Yor Five bonuses yet</p>
                <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                  Directly refer 5 members with the same package to earn your first bonus.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-[var(--border)]">
                <table className="w-full min-w-[500px] text-sm">
                  <thead>
                    <tr className="border-b border-[var(--border)] bg-[var(--accent)]/40 text-left text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--muted-foreground)]">
                      <th className="px-4 py-3">Source Reference</th>
                      <th className="px-4 py-3">Credit</th>
                      <th className="px-4 py-3">Balance After</th>
                      <th className="px-4 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {getFiveEntries.map((entry) => (
                      <tr
                        key={entry.id}
                        className="border-b border-[var(--border)] transition last:border-0 hover:bg-[var(--accent)]/30"
                      >
                        <td className="px-4 py-3 text-[var(--muted-foreground)] font-mono text-xs">
                          {entry.sourceReference}
                        </td>
                        <td className="px-4 py-3 font-semibold text-amber-600 dark:text-amber-400">
                          {formatCurrency(entry.creditAmount)}
                        </td>
                        <td className="px-4 py-3 text-[var(--foreground)]">
                          {formatCurrency(entry.balanceAfter)}
                        </td>
                        <td className="px-4 py-3">
                          <Badge
                            variant={entry.status.toLowerCase() === 'posted' || entry.status.toLowerCase() === 'confirmed' ? 'success' : 'outline'}
                            className="text-[10px]"
                          >
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

        {/* Navigation footer */}
        <div className="flex flex-wrap gap-3 pt-2">
          <Button asChild variant="outline">
            <Link to="/member/direct-referrals">
              <Users className="mr-2 size-4" />
              View Direct Referrals
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/member/wallet">
              View Full Wallet
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/earn/get-five">
              Learn About Get Yor Five
            </Link>
          </Button>
        </div>

      </div>
    </section>
  );
}

// ── Local stat card ────────────────────────────────────────────────────────

type StatColor = 'amber' | 'blue' | 'emerald' | 'violet';

const statColorMap: Record<StatColor, { bg: string; text: string; glow: string; border: string }> = {
  amber:   { bg: 'bg-amber-500/15',   text: 'text-amber-600 dark:text-amber-400',   glow: 'shadow-amber-500/20',   border: 'border-amber-500/25' },
  blue:    { bg: 'bg-blue-500/15',    text: 'text-blue-600 dark:text-blue-400',    glow: 'shadow-blue-500/20',    border: 'border-blue-500/25' },
  emerald: { bg: 'bg-emerald-500/15', text: 'text-emerald-600 dark:text-emerald-400', glow: 'shadow-emerald-500/20', border: 'border-emerald-500/25' },
  violet:  { bg: 'bg-violet-500/15',  text: 'text-violet-600 dark:text-violet-400',  glow: 'shadow-violet-500/20',  border: 'border-violet-500/25' },
};

function StatCard({
  icon,
  color,
  label,
  value,
  sub
}: {
  icon: React.ReactNode;
  color: StatColor;
  label: string;
  value: string;
  sub?: string;
}) {
  const { bg, text, glow, border } = statColorMap[color];
  return (
    <div className={`flex items-start gap-3 rounded-2xl border ${border} bg-[var(--card)] p-4 shadow-md ${glow}`}>
      <span className={`flex size-9 shrink-0 items-center justify-center rounded-xl ${bg} ${text}`}>
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-xs text-[var(--muted-foreground)]">{label}</p>
        <p className={`mt-0.5 truncate text-base font-semibold ${text}`}>{value}</p>
        {sub ? <p className="mt-0.5 truncate text-xs text-[var(--muted-foreground)]">{sub}</p> : null}
      </div>
    </div>
  );
}
