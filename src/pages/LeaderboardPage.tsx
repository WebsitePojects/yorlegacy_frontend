import React, { useEffect, useState } from 'react';
import { Crown, Medal, Trophy, ArrowUpRight, Sparkles } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import type { LeaderboardData, MemberRankData } from '../types/auth';

const PLAYFAIR = '"Playfair Display", Georgia, serif';

const peso = (value: number): string =>
  `₱${value.toLocaleString('en-PH', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

const pesoFull = (value: number): string =>
  `PHP ${value.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

// Distinct treatment for the podium positions; everyone else is a clean list row.
const PODIUM: Record<number, { ring: string; chip: string; glow: string; icon: React.ReactNode; label: string }> = {
  1: { ring: 'ring-amber-400/40', chip: 'bg-amber-400/15 text-amber-300 border-amber-400/30', glow: 'shadow-[0_0_30px_-12px_rgba(251,191,36,0.6)]', icon: <Crown className="size-4" />, label: 'Gold' },
  2: { ring: 'ring-slate-300/30', chip: 'bg-slate-300/10 text-slate-200 border-slate-300/25', glow: 'shadow-[0_0_24px_-14px_rgba(203,213,225,0.5)]', icon: <Trophy className="size-4" />, label: 'Silver' },
  3: { ring: 'ring-orange-500/30', chip: 'bg-orange-500/10 text-orange-300 border-orange-500/25', glow: 'shadow-[0_0_24px_-14px_rgba(249,115,22,0.5)]', icon: <Medal className="size-4" />, label: 'Bronze' }
};

function Initials({ name, username }: { name: string; username: string }) {
  const source = (name || username || '?').trim();
  const initials = source.split(/\s+/).slice(0, 2).map((p) => p[0]?.toUpperCase() ?? '').join('') || username.slice(0, 2).toUpperCase();
  return (
    <span
      className="flex size-9 shrink-0 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--background)] text-[11px] font-semibold tracking-wide text-[var(--muted-foreground)]"
      aria-hidden
    >
      {initials}
    </span>
  );
}

// ── Your standing — one editorial banner, not a grid of cards ──
function StandingBanner({ rank, position, isLoading }: { rank: MemberRankData | null; position: number | null; isLoading: boolean }) {
  const ranked = (rank?.level ?? 0) > 0;
  const total = rank?.totalIncome ?? 0;
  const nextThreshold = rank?.nextThreshold ?? null;
  const remaining = rank?.remainingToNext ?? null;
  const pct = nextThreshold
    ? Math.min(100, Math.max(2, ((total - (rank?.currentThreshold ?? 0)) / (nextThreshold - (rank?.currentThreshold ?? 0))) * 100))
    : 100;

  return (
    <div className="relative overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--card)]">
      {/* ambient decoration */}
      <div className="pointer-events-none absolute -right-16 -top-20 size-64 rounded-full bg-amber-500/10 blur-3xl" aria-hidden />
      <div className="pointer-events-none absolute inset-0 opacity-[0.04] [background-image:radial-gradient(circle_at_1px_1px,currentColor_1px,transparent_0)] [background-size:22px_22px]" aria-hidden />

      <div className="relative flex flex-col gap-6 p-6 sm:flex-row sm:items-end sm:justify-between sm:p-8">
        <div className="min-w-0">
          <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.28em] text-amber-400/80">
            <Sparkles className="size-3.5" /> Your Standing
          </p>
          <h2
            className="mt-2 truncate text-4xl font-bold leading-none text-[var(--foreground)] sm:text-5xl"
            style={{ fontFamily: PLAYFAIR }}
          >
            {isLoading ? '—' : ranked ? rank!.rankName : 'Unranked'}
          </h2>
          <p className="mt-3 text-sm text-[var(--muted-foreground)]">
            Lifetime total income{' '}
            <span className="font-semibold text-[var(--foreground)]">{isLoading ? '—' : pesoFull(total)}</span>
            {position ? <> · Rank <span className="font-semibold text-amber-400">#{position}</span> on the board</> : null}
          </p>
        </div>

        {/* progress toward next rank — a slim rail, no extra card */}
        <div className="w-full sm:max-w-xs">
          {ranked && nextThreshold ? (
            <>
              <div className="mb-1.5 flex items-baseline justify-between text-xs">
                <span className="text-[var(--muted-foreground)]">Next: <span className="font-medium text-[var(--foreground)]">{rank!.nextRankName}</span></span>
                <span className="font-mono text-[var(--muted-foreground)]">{peso(nextThreshold)}</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--background)]">
                <div className="h-full rounded-full bg-gradient-to-r from-amber-500 to-amber-300 transition-[width] duration-700" style={{ width: `${pct}%` }} />
              </div>
              <p className="mt-1.5 text-[11px] text-[var(--muted-foreground)]">
                {remaining != null ? <>{pesoFull(remaining)} more to advance</> : null}
              </p>
            </>
          ) : !ranked && !isLoading ? (
            <div className="rounded-2xl border border-dashed border-[var(--border)] px-4 py-3 text-xs text-[var(--muted-foreground)]">
              Reach <span className="font-semibold text-amber-400">{peso(50000)}</span> total income to enter the ranks as <span className="font-medium text-[var(--foreground)]">Manager</span>.
            </div>
          ) : (
            <div className="h-12 animate-pulse rounded-2xl bg-[var(--accent)]/40" />
          )}
        </div>
      </div>
    </div>
  );
}

// ── Shared content — used in-frame and standalone ──
export function LeaderboardContent({
  rank,
  leaderboard,
  isLoading,
  currentUserId,
  showStanding = true,
  showTableHeader = true
}: {
  rank: MemberRankData | null;
  leaderboard: LeaderboardData | null;
  isLoading: boolean;
  currentUserId?: string;
  showStanding?: boolean;
  showTableHeader?: boolean;
}) {
  const entries = leaderboard?.entries ?? [];
  const myPosition = currentUserId
    ? entries.find((e) => e.userId === currentUserId)?.position ?? null
    : null;

  return (
    <div className="space-y-6">
      {showStanding ? <StandingBanner rank={rank} position={myPosition} isLoading={isLoading} /> : null}

      <div className="overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--card)]">
        {showTableHeader ? (
          <div className="flex items-center justify-between border-b border-[var(--border)] px-5 py-4 sm:px-6">
            <div>
              <h3 className="text-base font-semibold text-[var(--foreground)]" style={{ fontFamily: PLAYFAIR }}>Top Earners</h3>
              <p className="text-xs text-[var(--muted-foreground)]">Ranked by lifetime total income · company accounts excluded</p>
            </div>
            <span className="hidden shrink-0 rounded-full border border-[var(--border)] px-3 py-1 text-[11px] text-[var(--muted-foreground)] sm:inline">
              {isLoading ? '—' : `${entries.length} members`}
            </span>
          </div>
        ) : null}

        {isLoading ? (
          <ul className="divide-y divide-[var(--border)]">
            {[1, 2, 3, 4, 5].map((i) => (
              <li key={i} className="h-16 animate-pulse bg-[var(--accent)]/20" />
            ))}
          </ul>
        ) : entries.length === 0 ? (
          <div className="px-6 py-14 text-center">
            <Trophy className="mx-auto mb-3 size-8 text-[var(--muted-foreground)]/40" />
            <p className="text-sm font-medium text-[var(--foreground)]">No ranked members yet</p>
            <p className="mt-1 text-xs text-[var(--muted-foreground)]">Earnings will appear here as members start building income.</p>
          </div>
        ) : (
          <ul className="divide-y divide-[var(--border)]">
            {entries.map((entry) => {
              const podium = PODIUM[entry.position];
              const isMe = Boolean(currentUserId) && entry.userId === currentUserId;
              return (
                <li
                  key={entry.userId}
                  className={`relative flex flex-col gap-2 px-4 py-3.5 transition-colors sm:grid sm:grid-cols-[auto_1fr_auto] sm:items-center sm:gap-4 sm:px-6 ${
                    isMe ? 'bg-amber-400/[0.06]' : 'hover:bg-[var(--accent)]/30'
                  }`}
                >
                  {isMe ? <span className="absolute inset-y-0 left-0 w-0.5 bg-amber-400" aria-hidden /> : null}

                  {/* position + identity */}
                  <div className="flex items-center gap-3">
                    {podium ? (
                      <span className={`flex size-9 shrink-0 items-center justify-center rounded-full border ${podium.chip} ${podium.glow} ring-1 ${podium.ring}`} title={podium.label}>
                        {podium.icon}
                      </span>
                    ) : (
                      <span className="flex size-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-[var(--muted-foreground)]">
                        {entry.position}
                      </span>
                    )}
                    <Initials name={entry.fullName} username={entry.username} />
                  </div>

                  <div className="min-w-0 pl-12 sm:pl-0">
                    <p className="flex items-center gap-2 truncate text-sm font-semibold text-[var(--foreground)]">
                      {entry.fullName || entry.username}
                      {isMe ? <span className="rounded-full bg-amber-400/15 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-amber-300">You</span> : null}
                    </p>
                    <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-[var(--muted-foreground)]">
                      <span className="font-mono">@{entry.username}</span>
                      <span aria-hidden>·</span>
                      <span>{entry.packageTier}</span>
                      <span aria-hidden>·</span>
                      <span className="text-amber-400/90">{entry.rankName}</span>
                    </p>
                  </div>

                  <div className="pl-12 text-left sm:pl-0 sm:text-right">
                    <p className="text-sm font-bold tabular-nums text-[var(--foreground)]" style={{ fontFamily: PLAYFAIR }}>
                      {pesoFull(entry.totalIncome)}
                    </p>
                    <p className="text-[10px] uppercase tracking-wider text-[var(--muted-foreground)]">total income</p>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <p className="flex items-center gap-1.5 px-1 text-[11px] text-[var(--muted-foreground)]">
        <ArrowUpRight className="size-3.5" />
        Rank is determined solely by lifetime total income — Manager at {peso(50000)} up to Hall of Famer at {peso(50000000)}.
      </p>
    </div>
  );
}

// ── In-frame version (rendered inside the member office) ──
export function LeaderboardInFrame({ showStanding = true, showTableHeader = true }: { showStanding?: boolean; showTableHeader?: boolean } = {}) {
  const { getMemberRank, getLeaderboard, user } = useAuth();
  const [rank, setRank] = useState<MemberRankData | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        setIsLoading(true);
        setError(null);
        const [r, lb] = await Promise.all([getMemberRank(), getLeaderboard()]);
        if (!cancelled) {
          setRank(r);
          setLeaderboard(lb);
        }
      } catch (cause) {
        if (!cancelled) setError(cause instanceof Error ? cause.message : 'Unable to load leaderboard data.');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [getMemberRank, getLeaderboard]);

  if (error) {
    return (
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] px-6 py-8 text-sm text-[var(--muted-foreground)]">
        {error}
      </div>
    );
  }

  return (
    <LeaderboardContent
      rank={rank}
      leaderboard={leaderboard}
      isLoading={isLoading}
      currentUserId={user?.id}
      showStanding={showStanding}
      showTableHeader={showTableHeader}
    />
  );
}
