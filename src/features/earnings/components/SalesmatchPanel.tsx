import { useEffect, useState } from 'react';
import { BarChart3, TrendingUp, Trophy } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { NogaStatCard } from '@/features/office/components/stat-cards';
import { fetchMemberPairingEvents, triggerMemberCompensation } from '@/lib/api';
import { formatManilaDate } from '@/lib/utils';
import type { GenealogyCenter, MemberOfficeData, OperationalModule } from '@/types/auth';

type PairingEvent = {
  occurredAt: string;
  source: string;
  leftVolume: number;
  rightVolume: number;
  matchedPoints: number;
  leftRemaining: number;
  rightRemaining: number;
  salesmatchAmount: number;
};

type SalesmatchPanelProps = {
  activeModule: OperationalModule;
  office: MemberOfficeData | null;
  binaryTree: GenealogyCenter | null;
  matchedPoints: number;
  leftRemaining: number;
  rightRemaining: number;
  strongLegCarry: number;
};

const PAIRING_PAGE_SIZE = 100;

const peso = (value: number): string =>
  `PHP ${value.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export function SalesmatchPanel({
  activeModule,
  office,
  binaryTree,
  matchedPoints,
  leftRemaining,
  rightRemaining,
  strongLegCarry
}: SalesmatchPanelProps) {
  const firstRow = activeModule.table.rows[0];
  const [events, setEvents] = useState<PairingEvent[]>([]);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [page, setPage] = useState(1);

  useEffect(() => {
    let cancelled = false;
    triggerMemberCompensation()
      .catch(() => undefined)
      .finally(() => {
        if (cancelled) return;
        fetchMemberPairingEvents()
          .then((data) => {
            if (!cancelled) setEvents(data.events ?? []);
          })
          .catch(() => {
            if (!cancelled) setEvents([]);
          })
          .finally(() => {
            if (!cancelled) setEventsLoading(false);
          });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const totalSalesmatch = events.reduce((sum, event) => sum + event.salesmatchAmount, 0);
  const totalPages = Math.max(1, Math.ceil(events.length / PAIRING_PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageRows = events.slice((safePage - 1) * PAIRING_PAGE_SIZE, safePage * PAIRING_PAGE_SIZE);

  return (
    <section className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <NogaStatCard icon={<BarChart3 className="size-4" />} color="amber" label="Left Remaining" value={String(leftRemaining)} sub="left leg carry forward (pts)" />
        <NogaStatCard icon={<BarChart3 className="size-4" />} color="blue" label="Right Remaining" value={String(rightRemaining)} sub="right leg carry forward (pts)" />
        <NogaStatCard icon={<TrendingUp className="size-4" />} color="emerald" label="Matched Points" value={String(matchedPoints)} sub="paired points this cycle" />
        <NogaStatCard icon={<Trophy className="size-4" />} color="violet" label="Strong Leg Carry" value={String(strongLegCarry)} sub="carry forward to next cycle (pts)" />
      </div>

      <Card className="border-[var(--border)] bg-[var(--card)]">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-xl bg-[var(--office-tone-amber-bg)]">
              <BarChart3 className="size-5 text-[var(--office-tone-amber-text)]" />
            </span>
            <div>
              <CardTitle className="text-base">Sales Match Pairing</CardTitle>
              <CardDescription className="text-xs">Binary placement pairs your weaker leg against your stronger leg each cycle. Unmatched volume carries forward.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            <SummaryStat label="Salesmatch Total" value={String(firstRow?.salesmatch ?? peso(totalSalesmatch))} highlight />
            <SummaryStat label="Gross Left Points" value={String(binaryTree?.root.leftPoints ?? '—')} />
            <SummaryStat label="Gross Right Points" value={String(binaryTree?.root.rightPoints ?? '—')} />
            <SummaryStat label="Matched (Paired)" value={String(matchedPoints)} highlight />
            <SummaryStat label="Left Remaining (pts)" value={String(leftRemaining)} />
            <SummaryStat label="Right Remaining (pts)" value={String(rightRemaining)} />
          </div>
        </CardContent>
      </Card>

      <Card className="border-[var(--border)] bg-[var(--card)]">
        <CardHeader className="gap-2 pb-3 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle className="text-base">Pairing Traceability</CardTitle>
            <CardDescription className="text-xs">
              Auto accredited row by row: trigger source, PV cash on each leg, matched points, cash bonus, and carry forward.
            </CardDescription>
          </div>
          <span className="w-fit rounded-lg border border-[var(--office-tone-emerald-border)] bg-[var(--office-tone-emerald-bg)] px-3 py-1 text-xs font-medium text-[var(--office-tone-emerald-text)]">
            {events.length} event{events.length === 1 ? '' : 's'} · {peso(totalSalesmatch)} total
          </span>
        </CardHeader>
        <CardContent className="p-0">
          <div className="flex h-[440px] flex-col overflow-hidden border-t border-[var(--border)]">
            <div className="flex-1 overflow-x-auto overflow-y-auto">
              <table className="w-full min-w-[860px] text-sm">
                <thead className="sticky top-0 z-10">
                  <tr className="border-b border-[var(--border)] bg-[var(--card)] text-left text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--muted-foreground)]">
                    <th className="px-4 py-3">When</th>
                    <th className="px-4 py-3">Triggered By</th>
                    <th className="px-4 py-3 text-right">Left Leg (PV cash)</th>
                    <th className="px-4 py-3 text-right">Right Leg (PV cash)</th>
                    <th className="px-4 py-3 text-center">Matched Pts</th>
                    <th className="px-4 py-3 text-right">Salesmatch</th>
                    <th className="px-4 py-3 text-right">Left Carry</th>
                    <th className="px-4 py-3 text-right">Right Carry</th>
                  </tr>
                </thead>
                <tbody>
                  {eventsLoading ? (
                    <tr><td colSpan={8} className="px-4 py-10 text-center text-xs text-[var(--muted-foreground)]">Loading pairing events…</td></tr>
                  ) : pageRows.length ? pageRows.map((event, index) => (
                    <tr key={`${event.occurredAt}-${index}`} className="border-b border-[var(--border)] hover:bg-[var(--muted)]/20">
                      <td className="px-4 py-3 text-xs text-[var(--muted-foreground)]">{formatManilaDate(event.occurredAt)}</td>
                      <td className="px-4 py-3 font-mono text-xs text-[var(--yor-copper-soft)]">{event.source}</td>
                      <td className="px-4 py-3 text-right tabular-nums">{peso(event.leftVolume)}</td>
                      <td className="px-4 py-3 text-right tabular-nums">{peso(event.rightVolume)}</td>
                      <td className="px-4 py-3 text-center font-semibold text-[var(--office-tone-emerald-text)]">{event.matchedPoints}</td>
                      <td className="px-4 py-3 text-right font-semibold tabular-nums text-[var(--office-tone-amber-text)]">{peso(event.salesmatchAmount)}</td>
                      <td className="px-4 py-3 text-right text-xs tabular-nums text-[var(--muted-foreground)]">{peso(event.leftRemaining)}</td>
                      <td className="px-4 py-3 text-right text-xs tabular-nums text-[var(--muted-foreground)]">{peso(event.rightRemaining)}</td>
                    </tr>
                  )) : (
                    <tr><td colSpan={8} className="px-4 py-10 text-center text-xs text-[var(--muted-foreground)]">No pairing events yet. Each left-right match in your network will appear here once encoded.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
            {totalPages > 1 ? (
              <div className="flex items-center justify-between gap-3 border-t border-[var(--border)] px-4 py-2 text-xs text-[var(--muted-foreground)]">
                <button
                  type="button"
                  disabled={safePage <= 1}
                  onClick={() => setPage((value) => Math.max(1, value - 1))}
                  className="rounded px-2 py-1 hover:bg-[var(--muted)]/40 disabled:opacity-40"
                >
                  ← Prev
                </button>
                <span>Page {safePage} of {totalPages} · {events.length} events</span>
                <button
                  type="button"
                  disabled={safePage >= totalPages}
                  onClick={() => setPage((value) => Math.min(totalPages, value + 1))}
                  className="rounded px-2 py-1 hover:bg-[var(--muted)]/40 disabled:opacity-40"
                >
                  Next →
                </button>
              </div>
            ) : null}
          </div>
        </CardContent>
      </Card>

      <p className="text-[10px] text-[var(--muted-foreground)]">
        Package {String(firstRow?.package ?? office?.profile.packageTier ?? '—')} · pairings extend to your full eligible network depth · PV cash is the SMB value of the volume on each leg.
      </p>
    </section>
  );
}

function SummaryStat({ label, value, highlight = false }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 py-2.5">
      <p className="text-[10px] font-medium uppercase tracking-widest text-[var(--muted-foreground)]">{label}</p>
      <p className={`mt-1 text-sm font-semibold ${highlight ? 'text-[var(--office-tone-amber-text)]' : 'text-[var(--foreground)]'}`}>{value}</p>
    </div>
  );
}
