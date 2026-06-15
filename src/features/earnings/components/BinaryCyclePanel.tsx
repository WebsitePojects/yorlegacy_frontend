import { BarChart3, TrendingUp, Trophy } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { NogaStatCard } from '@/features/office/components/stat-cards';
import type { GenealogyCenter, MemberMvpDashboardData, MemberOfficeData, OperationalModule } from '@/types/auth';

type BinaryCyclePanelProps = {
  activeModule: OperationalModule;
  office: MemberOfficeData | null;
  mvpDashboard: MemberMvpDashboardData | null;
  binaryTree: GenealogyCenter | null;
  matchedPoints: number;
  leftRemaining: number;
  rightRemaining: number;
};

// 1 matched BP pays PHP 250 of salesmatch; the cycle bonus is a package % on top.
const SMB_PESO_PER_BP = 250;
const CYCLE_RATES = [
  { tier: 'Classic', rate: 2 },
  { tier: 'Standard', rate: 3 },
  { tier: 'Business', rate: 4 },
  { tier: 'VIP', rate: 5 }
] as const;

function cycleRateFor(tier: string | undefined): number {
  return CYCLE_RATES.find((entry) => entry.tier === tier)?.rate ?? 0;
}

const peso = (n: number) => `PHP ${n.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export function BinaryCyclePanel({ office, mvpDashboard, binaryTree, matchedPoints, leftRemaining, rightRemaining }: BinaryCyclePanelProps) {
  const packageTier = office?.profile.packageTier;
  const rate = cycleRateFor(packageTier);
  const grossLeft = binaryTree?.root.leftPoints ?? 0;
  const grossRight = binaryTree?.root.rightPoints ?? 0;
  const salesmatchBasis = matchedPoints * SMB_PESO_PER_BP;
  const estimatedCycleBonus = salesmatchBasis * (rate / 100);
  // Cycle bonus actually credited to date (live income stream).
  const earnedStream = mvpDashboard?.incomeStreams.find((entry) => entry.streamId === 'binary-cycle');
  const earnedCycleBonus = earnedStream ? earnedStream.simulatedNet : 0;
  const status = matchedPoints > 0 ? 'Cycling' : grossLeft + grossRight > 0 ? 'Awaiting pairing' : 'No volume yet';

  const traceColumns: Array<[string, string]> = [
    ['Package', packageTier ?? '—'],
    ['Gross Left', String(grossLeft)],
    ['Gross Right', String(grossRight)],
    ['Matched', String(matchedPoints)],
    ['Left Remaining', String(leftRemaining)],
    ['Right Remaining', String(rightRemaining)],
    ['Cycle Rate', `${rate}%`],
    ['Salesmatch Basis', peso(salesmatchBasis)],
    ['Est. Cycle Bonus', peso(estimatedCycleBonus)],
    ['Status', status]
  ];

  return (
    <section className="space-y-4">
      {/* Summary stat strip */}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <NogaStatCard icon={<BarChart3 className="size-4" />} color="amber" label="Salesmatch Basis" value={peso(salesmatchBasis)} sub="matched paired volume this cycle" />
        <NogaStatCard icon={<TrendingUp className="size-4" />} color="blue" label="Your Cycle Rate" value={`${rate}%`} sub="package-based percentage" />
        <NogaStatCard icon={<Trophy className="size-4" />} color="violet" label="Cycle Bonus Earned" value={peso(earnedCycleBonus)} sub="credited to date" />
      </div>

      {/* Cycle Traceability — full-width table, ABOVE the rate ladder */}
      <Card className="border-[var(--border)] bg-[var(--card)]">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Cycle Traceability</CardTitle>
          <CardDescription className="text-xs">Live binary placement points and the cycle bonus they generate.</CardDescription>
        </CardHeader>
        <CardContent className="p-0 pb-0">
          <div className="overflow-x-auto border-t border-[var(--border)]">
            <table className="w-full min-w-[1040px] text-sm">
              <thead>
                <tr className="bg-[var(--background)] text-left text-[10px] uppercase tracking-[0.16em] text-[var(--muted-foreground)]">
                  {traceColumns.map(([label]) => (
                    <th key={label} className="border-b border-[var(--border)] px-4 py-3 font-semibold">{label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  {traceColumns.map(([label, value]) => (
                    <td
                      key={label}
                      className={[
                        'px-4 py-3',
                        label === 'Matched' ? 'font-semibold text-amber-500' : '',
                        label === 'Est. Cycle Bonus' ? 'font-mono font-semibold text-emerald-500' : '',
                        label === 'Salesmatch Basis' ? 'font-mono' : '',
                        label === 'Status' ? 'text-[var(--foreground)]' : 'text-[var(--foreground)]'
                      ].join(' ')}
                    >
                      {value}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
          <div className="px-4 py-3 text-xs text-[var(--muted-foreground)]">
            Binary Cycle follows binary placement — spillover accounts qualify when placed on the left or right side used for pairing. The cycle bonus is your package rate applied to each matched salesmatch movement.
          </div>
        </CardContent>
      </Card>

      {/* Binary Cycle Bonus — package rate ladder, full width below */}
      <Card className="border-[var(--border)] bg-[var(--card)]">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-xl bg-amber-500/15">
              <TrendingUp className="size-5 text-amber-400" />
            </span>
            <div>
              <CardTitle className="text-base">Binary Cycle Bonus</CardTitle>
              <CardDescription className="text-xs">Percentage earned on top of every qualified Salesmatch pairing.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {CYCLE_RATES.map(({ tier, rate: tierRate }) => {
            const active = packageTier === tier;
            return (
              <div
                key={tier}
                className={[
                  'flex items-center justify-between gap-3 rounded-xl border px-4 py-3 transition',
                  active ? 'border-amber-500/40 bg-amber-500/8' : 'border-[var(--border)] bg-[var(--background)]'
                ].join(' ')}
              >
                <div className="flex items-center gap-2">
                  <span className={active ? 'size-2 rounded-full bg-amber-400' : 'size-2 rounded-full bg-[var(--muted)]'} />
                  <p className="text-sm font-medium text-[var(--foreground)]">{tier}</p>
                </div>
                <strong className={active ? 'text-amber-600 dark:text-amber-400' : 'text-[var(--muted-foreground)]'}>{tierRate}%</strong>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </section>
  );
}
