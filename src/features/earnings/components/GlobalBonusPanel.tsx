import { Globe, Store } from 'lucide-react';
import { ReportTableView } from '@/components/ops/office-ui';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { MemberOfficeData, OperationalModule } from '@/types/auth';

type GlobalBonusPanelProps = {
  activeModule: OperationalModule;
  office: MemberOfficeData | null;
};

const STOCKIST_LABEL: Record<string, string> = {
  none: 'Not designated',
  mobile_kiosk: 'Mobile Kiosk',
  city_center: 'City Center',
  mega_center: 'Mega Center'
};

export function GlobalBonusPanel({ activeModule, office }: GlobalBonusPanelProps) {
  const firstRow = activeModule.table.rows[0];
  const stockistLevel = String(firstRow?.stockist_level ?? 'none');
  const isStockist = stockistLevel !== 'none';

  const gateRows: Array<[string, string]> = [
    ['Package', String(firstRow?.package ?? office?.profile.packageTier ?? '-')],
    ['Qualification', String(firstRow?.qualification ?? '-')],
    ['Pool', String(firstRow?.pool ?? '-')],
    ['Status', String(firstRow?.status ?? '-')]
  ];

  return (
    <section className="grid gap-4 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
      <div className="flex flex-col gap-4">
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
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-xl bg-amber-500/15">
                <Store className="size-5 text-amber-400" />
              </span>
              <div>
                <CardTitle className="text-base">Stockist Level</CardTitle>
                <CardDescription className="text-xs">Your designation in the global bonus pool.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              {isStockist ? (
                <Badge className="bg-violet-500/15 text-violet-400 border-violet-500/30 text-sm px-3 py-1">
                  {STOCKIST_LABEL[stockistLevel] ?? stockistLevel}
                </Badge>
              ) : (
                <span className="text-sm text-[var(--muted-foreground)]">Not designated as a stockist</span>
              )}
            </div>
            {isStockist && (
              <p className="mt-2 text-xs text-[var(--muted-foreground)]">
                You qualify for <strong className="text-amber-400">1 portion</strong> of the annual global bonus pool.
              </p>
            )}
            {!isStockist && (
              <p className="mt-2 text-xs text-[var(--muted-foreground)]">
                Contact your upline or admin to be designated as Mobile Kiosk, City Center, or Mega Center to qualify for the global bonus pool.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="border-[var(--border)] bg-[var(--card)]">
        <CardHeader className="pb-3"><CardTitle className="text-base">Maintenance Window</CardTitle></CardHeader>
        <CardContent><ReportTableView table={activeModule.table} /></CardContent>
      </Card>
    </section>
  );
}
