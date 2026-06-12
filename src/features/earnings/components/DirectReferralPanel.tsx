import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { OperationalModule } from '@/types/auth';

const DR_PAGE_SIZE = 10;

type DirectReferralPanelProps = {
  activeModule: OperationalModule;
};

export function DirectReferralPanel({ activeModule }: DirectReferralPanelProps) {
  const [page, setPage] = useState(1);
  const rows = activeModule.table.rows;
  const totalPages = Math.max(1, Math.ceil(rows.length / DR_PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const visibleRows = rows.slice((currentPage - 1) * DR_PAGE_SIZE, currentPage * DR_PAGE_SIZE);

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="flex size-16 shrink-0 items-center justify-center rounded-2xl border border-blue-500/25 bg-blue-500/10 shadow-md shadow-blue-500/20">
          <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">{rows.length}</span>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-[var(--muted-foreground)]">Direct Referrals</p>
          <p className="text-lg font-bold text-[var(--foreground)]">Direct sponsorship list</p>
          <p className="text-xs text-[var(--muted-foreground)]">Kept separate from the binary placement tree</p>
        </div>
      </div>
      <Card className="border-[var(--border)] bg-[var(--card)]">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div>
            <CardTitle className="text-base">Direct Referrals</CardTitle>
            <CardDescription className="text-xs">Direct sponsorship list kept separate from the binary placement tree.</CardDescription>
          </div>
          <Badge variant="outline">Direct Referrals: {rows.length}</Badge>
        </CardHeader>
        <CardContent className="space-y-4 pt-0">
          <div className="overflow-x-auto rounded-xl border border-[var(--border)]">
            <table className="w-full min-w-[540px] text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] bg-[var(--accent)]/40 text-left text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--muted-foreground)]">
                  {activeModule.table.columns.map((col) => (
                    <th key={col.key} className="px-4 py-3">{col.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {visibleRows.length ? visibleRows.map((row, i) => (
                  <tr key={i} className="border-b border-[var(--border)] transition last:border-0 hover:bg-[var(--accent)]/30">
                    {activeModule.table.columns.map((col) => (
                      <td key={col.key} className="px-4 py-3 text-[var(--foreground)]">
                        {col.key === 'accountStatus' || col.key === 'status' ? (
                          <Badge variant={String(row[col.key]) === 'active' ? 'success' : 'outline'} className="text-[10px]">{String(row[col.key] ?? '—')}</Badge>
                        ) : (
                          <span className={col.key === 'username' ? 'font-mono text-[var(--muted-foreground)]' : ''}>{String(row[col.key] ?? '—')}</span>
                        )}
                      </td>
                    ))}
                  </tr>
                )) : (
                  <tr><td colSpan={activeModule.table.columns.length} className="px-4 py-8 text-center text-sm text-[var(--muted-foreground)]">No direct referrals yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
          {rows.length > DR_PAGE_SIZE && (
            <div className="flex items-center justify-between gap-3 text-sm text-[var(--muted-foreground)]">
              <span>Page {currentPage} of {totalPages} · {rows.length} referral(s)</span>
              <div className="flex gap-2">
                <Button type="button" variant="outline" size="sm" disabled={currentPage <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>Prev</Button>
                <Button type="button" variant="outline" size="sm" disabled={currentPage >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>Next</Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
