import { ReportTableView } from '@/components/ops/office-ui';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { MemberOfficeData, OperationalModule } from '@/types/auth';

type LifestylePanelProps = {
  activeModule: OperationalModule;
  office: MemberOfficeData | null;
};

export function LifestylePanel({ activeModule, office }: LifestylePanelProps) {
  const firstRow = activeModule.table.rows[0];
  const monitorRows: Array<[string, string]> = [
    ['Package', String(firstRow?.package ?? office?.profile.packageTier ?? '-')],
    ['Repeat Purchase Target', String(firstRow?.repeatPurchaseTarget ?? '-')],
    ['Current Repeat Purchase', String(firstRow?.currentRepeatPurchase ?? '-')],
    ['Progress', String(firstRow?.progressPercent ?? '-')],
    ['Projected Reward', String(firstRow?.projectedReward ?? '-')],
    ['Threshold Status', String(firstRow?.thresholdStatus ?? '-')]
  ];

  return (
    <section className="grid gap-4 xl:grid-cols-2">
      <Card className="border-[var(--border)] bg-[var(--card)]">
        <CardHeader className="pb-3"><CardTitle className="text-base">Lifestyle Reward Monitor</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {monitorRows.map(([label, value]) => (
            <div key={label} className="flex items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-sm odd:bg-[var(--accent)]/40">
              <span className="text-[var(--muted-foreground)]">{label}</span>
              <strong className="font-medium text-[var(--foreground)]">{value}</strong>
            </div>
          ))}
        </CardContent>
      </Card>
      <Card className="border-[var(--border)] bg-[var(--card)]">
        <CardHeader className="pb-3"><CardTitle className="text-base">Reward Status</CardTitle></CardHeader>
        <CardContent><ReportTableView table={activeModule.table} /></CardContent>
      </Card>
    </section>
  );
}
