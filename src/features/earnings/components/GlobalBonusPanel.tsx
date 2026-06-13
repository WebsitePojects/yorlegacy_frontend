import { Globe } from 'lucide-react';
import { ReportTableView } from '@/components/ops/office-ui';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { MemberOfficeData, OperationalModule } from '@/types/auth';

type GlobalBonusPanelProps = {
  activeModule: OperationalModule;
  office: MemberOfficeData | null;
};

export function GlobalBonusPanel({ activeModule, office }: GlobalBonusPanelProps) {
  const firstRow = activeModule.table.rows[0];
  const gateRows: Array<[string, string]> = [
    ['Package', String(firstRow?.package ?? office?.profile.packageTier ?? '-')],
    ['Qualification', String(firstRow?.qualification ?? '-')],
    ['Pool', String(firstRow?.pool ?? '-')],
    ['Status', String(firstRow?.status ?? '-')]
  ];

  return (
    <section className="grid gap-4 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
      <Card className="border-[var(--border)] bg-[var(--card)]">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-xl bg-violet-500/15">
              <Globe className="size-5 text-violet-400" />
            </span>
            <div>
              <CardTitle className="text-base">Global Bonus Gate</CardTitle>
              <CardDescription className="text-xs">VIP-exclusive yearly global pool program.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {gateRows.map(([label, value]) => (
            <div key={label} className="flex items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-sm odd:bg-[var(--accent)]/40">
              <span className="text-[var(--muted-foreground)]">{label}</span>
              <strong className="font-medium text-[var(--foreground)]">{value}</strong>
            </div>
          ))}
        </CardContent>
      </Card>
      <Card className="border-[var(--border)] bg-[var(--card)]">
        <CardHeader className="pb-3"><CardTitle className="text-base">Maintenance Window</CardTitle></CardHeader>
        <CardContent><ReportTableView table={activeModule.table} /></CardContent>
      </Card>
    </section>
  );
}
