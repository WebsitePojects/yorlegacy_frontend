import { useEffect, useState } from 'react';
import { ArrowLeft, Award, ChevronRight, TrendingUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { fetchMemberRank, fetchMemberSponsorTree, fetchMemberUnilevelData, type SponsorTreeCenter, type UnilevelData } from '@/lib/api';
import type { MemberRankData } from '@/types/auth';
import { SponsorTreeCanvas } from './SponsorTreeCanvas';

// ── Constants ──────────────────────────────────────────────────────────────────

const LEVEL_PERCENTAGES = [10, 8, 5, 5, 3, 3, 2, 1, 1, 1];
const MAINTENANCE_TARGET = 200;

// ── Helpers ────────────────────────────────────────────────────────────────────

function money(v: number) {
  return `PHP ${v.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function levelBadgeColor(level: number): string {
  if (level === 1) return 'border-amber-500/50 bg-amber-500/10 text-amber-400';
  if (level === 2) return 'border-orange-500/50 bg-orange-500/10 text-orange-400';
  if (level <= 4) return 'border-emerald-500/50 bg-emerald-500/10 text-emerald-400';
  if (level <= 6) return 'border-blue-500/50 bg-blue-500/10 text-blue-400';
  return 'border-violet-500/50 bg-violet-500/10 text-violet-400';
}

// ── Loading skeleton ───────────────────────────────────────────────────────────

function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-[var(--muted)]/40 ${className ?? ''}`} />;
}

// ── Main component ─────────────────────────────────────────────────────────────

export function UnilevelView() {
  const [unilevel, setUnilevel] = useState<UnilevelData | null>(null);
  const [tree, setTree] = useState<SponsorTreeCenter | null>(null);
  const [treeLoading, setTreeLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(true);
  const [rankData, setRankData] = useState<MemberRankData | null>(null);
  const [rankLoading, setRankLoading] = useState(true);
  const [navStack, setNavStack] = useState<string[]>([]);
  const [navLoading, setNavLoading] = useState(false);

  useEffect(() => {
    fetchMemberRank()
      .then(setRankData)
      .catch(() => {/* non-fatal */})
      .finally(() => setRankLoading(false));
  }, []);

  useEffect(() => {
    setDataLoading(true);
    fetchMemberUnilevelData()
      .then(setUnilevel)
      .finally(() => setDataLoading(false));
  }, []);

  useEffect(() => {
    setTreeLoading(true);
    fetchMemberSponsorTree()
      .then(setTree)
      .finally(() => setTreeLoading(false));
  }, []);

  function handleNavigate(username: string) {
    if (!tree || username === tree.root.username) return;
    setNavLoading(true);
    fetchMemberSponsorTree(username)
      .then((data) => {
        setNavStack((prev) => [...prev, tree.root.username]);
        setTree(data);
      })
      .finally(() => setNavLoading(false));
  }

  function handleBack() {
    if (!navStack.length) return;
    const prev = navStack[navStack.length - 1];
    setNavLoading(true);
    fetchMemberSponsorTree(prev)
      .then((data) => {
        setNavStack((s) => s.slice(0, -1));
        setTree(data);
      })
      .finally(() => setNavLoading(false));
  }

  const totalEarned = unilevel?.totalEarned ?? 0;
  const byLevel = unilevel?.byLevel ?? [];
  const activeLevel = byLevel.filter((l) => l.amount > 0);

  return (
    <section className="space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-[var(--muted-foreground)]">Compensation</p>
          <h2 className="mt-0.5 text-xl font-bold text-[var(--foreground)]">Uni-Level Bonus</h2>
        </div>
        <Badge variant="outline" className="text-xs">10 Sponsor Levels · 10%–1%</Badge>
      </div>

      {/* ── Personal rank progress ── */}
      <Card className="border-[var(--border)] bg-[var(--card)] overflow-hidden">
        <CardContent className="pt-5">
          <div className="flex items-center gap-2 mb-3">
            <span className="flex size-8 items-center justify-center rounded-lg bg-amber-500/15">
              <Award className="size-4 text-amber-500" />
            </span>
            <p className="text-xs font-semibold uppercase tracking-widest text-[var(--muted-foreground)]">Your Rank Progress</p>
          </div>
          {rankLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-8 w-40" />
              <Skeleton className="h-2 w-full" />
              <Skeleton className="h-4 w-56" />
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                  <p className="text-3xl font-bold text-[var(--foreground)]">
                    {(rankData?.level ?? 0) === 0 ? 'Unranked' : (rankData?.rankName ?? '—')}
                  </p>
                  <p className="mt-0.5 text-xs text-[var(--muted-foreground)]">
                    Lifetime income: <span className="font-semibold text-[var(--foreground)]">{money(rankData?.totalIncome ?? 0)}</span>
                  </p>
                </div>
                {rankData?.nextRankName && (
                  <div className="text-right">
                    <p className="text-xs font-semibold text-[var(--foreground)]">{rankData.nextRankName}</p>
                    <p className="text-[10px] text-[var(--muted-foreground)]">{money(rankData.nextThreshold ?? 0)} threshold</p>
                  </div>
                )}
              </div>
              {rankData?.nextThreshold ? (
                <div className="space-y-1.5">
                  <div className="h-2 overflow-hidden rounded-full bg-[var(--muted)]">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-amber-500 to-amber-300 transition-all duration-700"
                      style={{
                        width: `${Math.min(100, Math.max(2,
                          ((rankData.totalIncome - rankData.currentThreshold) /
                           (rankData.nextThreshold - rankData.currentThreshold)) * 100
                        ))}%`
                      }}
                    />
                  </div>
                  <p className="text-[10px] text-[var(--muted-foreground)]">
                    {money(rankData.remainingToNext ?? 0)} more to reach{' '}
                    <span className="font-medium text-[var(--foreground)]">{rankData.nextRankName}</span>
                  </p>
                </div>
              ) : (rankData?.level ?? 0) === 0 ? (
                <div className="rounded-xl border border-dashed border-[var(--border)] px-4 py-3 text-xs text-[var(--muted-foreground)]">
                  Earn <span className="font-semibold text-amber-400">PHP 50,000</span> in lifetime income to achieve{' '}
                  <span className="font-medium text-[var(--foreground)]">Manager</span> rank.
                </div>
              ) : (
                <p className="text-xs text-amber-400 font-medium">Hall of Famer — top rank achieved.</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Maintenance progress ── */}
      <Card className="border-[var(--border)] bg-[var(--card)]">
        <CardContent className="pt-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-[var(--muted-foreground)]">Monthly Maintenance</p>
              <p className="mt-1 text-sm font-medium text-[var(--foreground)]">200 PV / month from product repurchases</p>
            </div>
            <Badge variant="outline" className="border-amber-500/40 bg-amber-500/8 text-amber-400 text-[10px]">
              Requirement not yet active
            </Badge>
          </div>
          <div className="mt-4 space-y-1.5">
            <div className="flex justify-between text-[10px] text-[var(--muted-foreground)]">
              <span>0 PV repurchased this month</span>
              <span>{MAINTENANCE_TARGET} PV target</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-[var(--muted)]">
              <div
                className="h-full rounded-full bg-gradient-to-r from-amber-500/60 to-amber-300/40 transition-all"
                style={{ width: '0%' }}
              />
            </div>
            <p className="text-[10px] text-[var(--muted-foreground)]">
              Unilevel credits are earned now regardless — maintenance gating will be announced when activated.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* ── Stats row ── */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="border-[var(--border)] bg-[var(--card)]">
          <CardContent className="pt-5">
            <p className="text-xs font-semibold uppercase tracking-widest text-[var(--muted-foreground)]">Total Earned</p>
            {dataLoading ? (
              <Skeleton className="mt-2 h-7 w-32" />
            ) : (
              <p className="mt-1 text-2xl font-bold text-[var(--foreground)]">{money(totalEarned)}</p>
            )}
            <p className="mt-1 text-xs text-[var(--muted-foreground)]">Lifetime unilevel credits</p>
          </CardContent>
        </Card>
        <Card className="border-[var(--border)] bg-[var(--card)]">
          <CardContent className="pt-5">
            <p className="text-xs font-semibold uppercase tracking-widest text-[var(--muted-foreground)]">Active Levels</p>
            {dataLoading ? (
              <Skeleton className="mt-2 h-7 w-16" />
            ) : (
              <p className="mt-1 text-2xl font-bold text-[var(--foreground)]">{activeLevel.length} / 10</p>
            )}
            <p className="mt-1 text-xs text-[var(--muted-foreground)]">Levels with at least one credit</p>
          </CardContent>
        </Card>
        <Card className="border-[var(--border)] bg-[var(--card)]">
          <CardContent className="pt-5">
            <p className="text-xs font-semibold uppercase tracking-widest text-[var(--muted-foreground)]">Total Events</p>
            {dataLoading ? (
              <Skeleton className="mt-2 h-7 w-16" />
            ) : (
              <p className="mt-1 text-2xl font-bold text-[var(--foreground)]">{unilevel?.entries.length ?? 0}</p>
            )}
            <p className="mt-1 text-xs text-[var(--muted-foreground)]">Repurchase events credited</p>
          </CardContent>
        </Card>
      </div>

      {/* ── Per-level breakdown ── */}
      <Card className="border-[var(--border)] bg-[var(--card)]">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Earnings by Level</CardTitle>
        </CardHeader>
        <CardContent>
          {dataLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }, (_, i) => <Skeleton key={i} className="h-8 w-full" />)}
            </div>
          ) : (
            <div className="space-y-2">
              {LEVEL_PERCENTAGES.map((pct, idx) => {
                const levelNum = idx + 1;
                const row = byLevel.find((l) => l.level === levelNum);
                const amount = row?.amount ?? 0;
                const count = row?.count ?? 0;
                const maxAmount = Math.max(1, ...byLevel.map((l) => l.amount));
                const barWidth = amount > 0 ? Math.max(4, Math.round((amount / maxAmount) * 100)) : 0;
                return (
                  <div key={levelNum} className="flex items-center gap-3">
                    <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-bold ${levelBadgeColor(levelNum)}`}>
                      L{levelNum}
                    </span>
                    <span className="w-8 shrink-0 text-right text-[10px] font-medium text-[var(--muted-foreground)]">{pct}%</span>
                    <div className="flex-1 overflow-hidden">
                      <div className="h-1.5 overflow-hidden rounded-full bg-[var(--muted)]">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-amber-500 to-amber-300 transition-all"
                          style={{ width: `${barWidth}%` }}
                        />
                      </div>
                    </div>
                    <span className="w-28 shrink-0 text-right text-xs font-medium text-[var(--foreground)]">
                      {amount > 0 ? money(amount) : <span className="text-[var(--muted-foreground)]">—</span>}
                    </span>
                    <span className="w-16 shrink-0 text-right text-[10px] text-[var(--muted-foreground)]">
                      {count > 0 ? `${count} event${count !== 1 ? 's' : ''}` : ''}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Recent entries ── */}
      {!dataLoading && (unilevel?.entries.length ?? 0) > 0 && (
        <Card className="border-[var(--border)] bg-[var(--card)]">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Recent Credits</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--border)]">
                    <th className="pb-2 text-left text-[10px] font-semibold uppercase tracking-widest text-[var(--muted-foreground)]">Level</th>
                    <th className="pb-2 text-left text-[10px] font-semibold uppercase tracking-widest text-[var(--muted-foreground)]">Source</th>
                    <th className="pb-2 text-right text-[10px] font-semibold uppercase tracking-widest text-[var(--muted-foreground)]">Amount</th>
                    <th className="pb-2 text-right text-[10px] font-semibold uppercase tracking-widest text-[var(--muted-foreground)]">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {(unilevel?.entries ?? []).slice(-20).reverse().map((entry) => (
                    <tr key={entry.id} className="border-b border-[var(--border)]/50 last:border-0">
                      <td className="py-2">
                        <span className={`rounded-full border px-1.5 py-0.5 text-[9px] font-bold ${levelBadgeColor(entry.level)}`}>L{entry.level}</span>
                      </td>
                      <td className="py-2 text-xs text-[var(--muted-foreground)] max-w-[200px] truncate">{entry.sourceReference}</td>
                      <td className="py-2 text-right text-xs font-medium text-[var(--foreground)]">{money(entry.creditAmount)}</td>
                      <td className="py-2 text-right text-[10px] text-[var(--muted-foreground)]">
                        {new Date(entry.occurredAt).toLocaleDateString('en-PH', { timeZone: 'Asia/Manila', month: 'short', day: 'numeric', year: 'numeric' })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Sponsor tree canvas ── */}
      <Card className="border-[var(--border)] bg-[var(--card)] overflow-hidden">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between gap-3">
            <div>
              <CardTitle className="text-base">Sponsor Downline Tree</CardTitle>
              <p className="mt-0.5 text-xs text-[var(--muted-foreground)]">
                Up to 20 levels · click any node to navigate into its downline
              </p>
            </div>
            <div className="flex items-center gap-2">
              {navStack.length > 0 && (
                <Button variant="outline" size="sm" onClick={handleBack} disabled={navLoading} className="gap-1.5 text-xs h-7">
                  <ArrowLeft className="size-3" />
                  {navStack[navStack.length - 1]}
                </Button>
              )}
              {navStack.length > 0 && (
                <div className="flex items-center gap-1 text-xs text-[var(--muted-foreground)]">
                  {navStack.map((u, i) => (
                    <span key={i} className="flex items-center gap-1">
                      <span>{u}</span>
                      <ChevronRight className="size-3" />
                    </span>
                  ))}
                  <span className="font-medium text-[var(--foreground)]">{tree?.root.username}</span>
                </div>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-0 pb-0">
          {treeLoading || navLoading ? (
            <div className="flex h-[400px] items-center justify-center">
              <div className="flex flex-col items-center gap-3">
                <TrendingUp className="size-8 animate-pulse text-[var(--muted-foreground)]" />
                <p className="text-sm text-[var(--muted-foreground)]">
                  {navLoading ? 'Loading sponsor tree…' : 'Building sponsor tree…'}
                </p>
              </div>
            </div>
          ) : tree ? (
            <SponsorTreeCanvas root={tree.root} onNavigate={handleNavigate} />
          ) : (
            <div className="flex h-[300px] items-center justify-center">
              <p className="text-sm text-[var(--muted-foreground)]">Sponsor tree unavailable.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
