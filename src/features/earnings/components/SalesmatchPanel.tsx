import { BarChart3, TrendingUp, Trophy } from 'lucide-react';
import { ReportTableView } from '@/components/ops/office-ui';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { InfoRow, NogaStatCard } from '@/features/office/components/stat-cards';
import type { GenealogyCenter, MemberOfficeData, OperationalModule } from '@/types/auth';

type SalesmatchPanelProps = {
  activeModule: OperationalModule;
  office: MemberOfficeData | null;
  binaryTree: GenealogyCenter | null;
  matchedPoints: number;
  leftRemaining: number;
  rightRemaining: number;
  strongLegCarry: number;
};

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

  return (
    <section className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <NogaStatCard icon={<BarChart3 className="size-4" />} color="amber" label="Left Remaining" value={String(leftRemaining)} sub="left leg carry forward" />
        <NogaStatCard icon={<BarChart3 className="size-4" />} color="blue" label="Right Remaining" value={String(rightRemaining)} sub="right leg carry forward" />
        <NogaStatCard icon={<TrendingUp className="size-4" />} color="emerald" label="Matched Points" value={String(matchedPoints)} sub="paired volume this cycle" />
        <NogaStatCard icon={<Trophy className="size-4" />} color="violet" label="Strong Leg Carry" value={String(strongLegCarry)} sub="carry forward to next cycle" />
      </div>
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <Card className="border-[var(--border)] bg-[var(--card)]">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-xl bg-amber-500/15">
                <BarChart3 className="size-5 text-amber-600 dark:text-amber-400" />
              </span>
              <div>
                <CardTitle className="text-base">Sales Match Pairing</CardTitle>
                <CardDescription className="text-xs">Binary placement pairs left and right leg volume each cycle.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <InfoRow label="Salesmatch Total" value={String(firstRow?.salesmatch ?? '—')} highlight />
            <InfoRow label="Gross Left Points" value={String(binaryTree?.root.leftPoints ?? '—')} />
            <InfoRow label="Gross Right Points" value={String(binaryTree?.root.rightPoints ?? '—')} />
            <InfoRow label="Matched (Paired)" value={String(matchedPoints)} highlight />
            <InfoRow label="Left Remaining" value={String(leftRemaining)} />
            <InfoRow label="Right Remaining" value={String(rightRemaining)} />
            <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3 text-xs text-[var(--muted-foreground)]">
              Salesmatch pairs your weaker leg against your stronger leg. Unmatched volume carries forward to the next cycle.
            </div>
          </CardContent>
        </Card>
        <Card className="border-[var(--border)] bg-[var(--card)]">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Pairing Traceability</CardTitle>
            <CardDescription className="text-xs">Auto Accredited — no manual submission required.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/8 px-4 py-3 text-xs text-emerald-600 dark:text-emerald-400">
              Salesmatch bonuses are automatically credited when a left-right pair is detected. Check transaction history for timestamped entries.
            </div>
            <InfoRow label="Package" value={String(firstRow?.package ?? office?.profile.packageTier ?? '—')} />
            <InfoRow label="Account Type" value={String(firstRow?.accountType ?? 'PD')} />
            <InfoRow label="Status" value={String(firstRow?.status ?? 'Active')} />
            <ReportTableView table={activeModule.table} />
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
