import { BarChart3, Clock, Medal, TrendingUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { NogaStatCard } from '@/features/office/components/stat-cards';
import type { OperationalModule } from '@/types/auth';

type UnilevelPanelProps = {
  activeModule: OperationalModule;
};

export function UnilevelPanel({ activeModule }: UnilevelPanelProps) {
  return (
    <section className="grid gap-4">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <NogaStatCard
          icon={<BarChart3 className="size-4" />}
          color="amber"
          label="Gross Rankable Points"
          value={String(activeModule.table.rows[0]?.requiredPV ?? '—')}
          sub="self + full downline repurchases"
        />
        <NogaStatCard icon={<Medal className="size-4" />} color="blue" label="Current Rank" value="Unranked" sub="upgrade required to begin ranking" />
        <NogaStatCard icon={<TrendingUp className="size-4" />} color="emerald" label="Remaining Race Points" value="—" sub="fresh points for next rank" />
        <NogaStatCard icon={<Clock className="size-4" />} color="violet" label="Pending Claims" value="0" sub="cash release stays manual" />
      </div>
      <Card className="border-[var(--border)] bg-[var(--card)]">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Potential Income Ladder</CardTitle>
          <CardDescription className="text-xs">The Yor compensation plan presents potential income scaling across the ten-level ladder.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {activeModule.table.rows.map((row, index) => (
            <div key={`${String(row.level)}-${index}`} className="rounded-2xl border border-[var(--border)] bg-[var(--background)] p-4">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-semibold uppercase tracking-widest text-[var(--muted-foreground)]">Level {String(row.level)}</p>
                <Badge variant="outline" className="text-[10px]">{String(row.percent)}</Badge>
              </div>
              <p className="mt-2 text-lg font-semibold text-[var(--foreground)]">{String(row.potential)}</p>
              <p className="mt-1 text-xs text-[var(--muted-foreground)]">{String(row.requiredPV)}</p>
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[var(--muted)]">
                <div className="h-full rounded-full bg-gradient-to-r from-amber-500 to-amber-300" style={{ width: `${Math.min(100, 18 + index * 12)}%` }} />
              </div>
              <p className="mt-2 text-[10px] uppercase tracking-widest text-[var(--muted-foreground)]">{String(row.status)}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </section>
  );
}
