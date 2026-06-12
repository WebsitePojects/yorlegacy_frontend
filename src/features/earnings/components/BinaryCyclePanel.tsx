import { BarChart3, Medal, TrendingUp, Trophy } from 'lucide-react';
import { ReportTableView } from '@/components/ops/office-ui';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { InfoRow, NogaStatCard } from '@/features/office/components/stat-cards';
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

const CYCLE_RATES = [
  { tier: 'Classic', rate: '2%' },
  { tier: 'Standard', rate: '3%' },
  { tier: 'Business', rate: '4%' },
  { tier: 'VIP', rate: '5%' }
] as const;

function packageCycleRate(packageTier: string | undefined): string {
  return CYCLE_RATES.find((entry) => entry.tier === packageTier)?.rate ?? '—';
}

export function BinaryCyclePanel({
  activeModule,
  office,
  mvpDashboard,
  binaryTree,
  matchedPoints,
  leftRemaining,
  rightRemaining
}: BinaryCyclePanelProps) {
  const firstRow = activeModule.table.rows[0];
  const estimatedCycleBonus = (() => {
    const stream = mvpDashboard?.incomeStreams.find((entry) => entry.streamId === 'binary-cycle');
    return stream
      ? `PHP ${stream.simulatedNet.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
      : 'PHP 0.00';
  })();

  return (
    <section className="grid gap-4">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <NogaStatCard
          icon={<BarChart3 className="size-4" />}
          color="amber"
          label="Salesmatch Basis"
          value={String(firstRow?.salesmatch ?? 'PHP 0.00')}
          sub="paired volume this cycle"
        />
        <NogaStatCard
          icon={<TrendingUp className="size-4" />}
          color="blue"
          label="Your Cycle Rate"
          value={String(firstRow?.cycleRate ?? packageCycleRate(office?.profile.packageTier))}
          sub="package-based percentage"
        />
        <NogaStatCard
          icon={<Medal className="size-4" />}
          color="emerald"
          label="Weekly Cap"
          value={String(firstRow?.weeklyCap ?? '—')}
          sub="maximum per cycle week"
        />
        <NogaStatCard
          icon={<Trophy className="size-4" />}
          color="violet"
          label="Estimated Cycle Bonus"
          value={estimatedCycleBonus}
          sub="estimated net cycle bonus"
        />
      </div>
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
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
          <CardContent className="space-y-3">
            <p className="text-xs text-[var(--muted-foreground)]">
              Classic, Standard, Business, and VIP members earn a package-based cycle bonus on each Salesmatch movement. Weekly cap applies.
            </p>
            {CYCLE_RATES.map(({ tier, rate }) => {
              const active = office?.profile.packageTier === tier;
              return (
                <div
                  key={tier}
                  className={[
                    'flex items-center justify-between gap-3 rounded-xl border px-4 py-3 transition',
                    active ? 'border-amber-500/40 bg-amber-500/8' : 'border-[var(--border)] bg-[var(--background)]'
                  ].join(' ')}
                >
                  <div className="flex items-center gap-2">
                    {active ? <span className="size-2 rounded-full bg-amber-400" /> : <span className="size-2 rounded-full bg-[var(--muted)]" />}
                    <p className="text-sm font-medium text-[var(--foreground)]">{tier}</p>
                  </div>
                  <strong className={active ? 'text-amber-600 dark:text-amber-400' : 'text-[var(--muted-foreground)]'}>{rate}</strong>
                </div>
              );
            })}
          </CardContent>
        </Card>
        <Card className="border-[var(--border)] bg-[var(--card)]">
          <CardHeader className="pb-3"><CardTitle className="text-base">Cycle Traceability</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <InfoRow label="Package" value={String(firstRow?.package ?? office?.profile.packageTier ?? '—')} />
            <InfoRow label="Gross Left Points" value={String(binaryTree?.root.leftPoints ?? '—')} />
            <InfoRow label="Gross Right Points" value={String(binaryTree?.root.rightPoints ?? '—')} />
            <InfoRow label="Matched Points" value={String(matchedPoints)} highlight />
            <InfoRow label="Left Remaining" value={String(leftRemaining)} />
            <InfoRow label="Right Remaining" value={String(rightRemaining)} />
            <InfoRow label="Status" value={String(firstRow?.status ?? 'Active')} />
            <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3 text-xs text-[var(--muted-foreground)]">
              Binary Cycle follows binary placement — spillover accounts qualify when placed on the left or right side used for pairing.
            </div>
            <ReportTableView table={activeModule.table} />
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
