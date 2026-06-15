import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { fetchMemberDirectReferrals } from '@/lib/api';
import type { OperationalModule } from '@/types/auth';

const DR_PAGE_SIZE = 10;

type DirectReferralRow = { username: string; name: string; package: string; status: string; placement: string };

type DirectReferralPanelProps = {
  activeModule: OperationalModule;
};

export function DirectReferralPanel({ activeModule }: DirectReferralPanelProps) {
  const [page, setPage] = useState(1);
  const [prodRows, setProdRows] = useState<DirectReferralRow[] | null>(null);
  // Tracks whether the production endpoint answered. A successful response of zero
  // rows is authoritative (the member genuinely has no directs) and must NOT fall
  // back to the static sandbox catalog, which previously showed a phantom "5".
  const [prodResolved, setProdResolved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchMemberDirectReferrals()
      .then((data) => {
        if (!cancelled) {
          setProdRows(data.rows);
          setProdResolved(true);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setProdRows(null);
          setProdResolved(false);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  const moduleRows = activeModule.table.rows as Array<Record<string, unknown>>;
  const sandboxRows: DirectReferralRow[] = moduleRows.map((r) => ({
    username: String(r.username ?? ''),
    name: String(r.name ?? ''),
    package: String(r.package ?? ''),
    status: String(r.status ?? ''),
    placement: String(r.placement ?? '')
  }));

  // Prefer the production list whenever it resolved (even if empty); only fall back
  // to the sandbox catalog when the production call actually failed.
  const rows: DirectReferralRow[] = prodResolved ? (prodRows ?? []) : sandboxRows;
  const totalPages = Math.max(1, Math.ceil(rows.length / DR_PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const visibleRows = rows.slice((currentPage - 1) * DR_PAGE_SIZE, currentPage * DR_PAGE_SIZE);

  const COLS = [
    { key: 'username', label: 'Username' },
    { key: 'name', label: 'Full Name' },
    { key: 'package', label: 'Package' },
    { key: 'status', label: 'Status' },
    { key: 'placement', label: 'Placement' }
  ];

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="flex size-16 shrink-0 items-center justify-center rounded-2xl border border-blue-500/25 bg-blue-500/10 shadow-md shadow-blue-500/20">
          <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">{loading ? '…' : rows.length}</span>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-[var(--muted-foreground)]">Direct Referrals</p>
          <p className="text-lg font-bold text-[var(--foreground)]">Direct sponsorship list</p>
          <p className="text-xs text-[var(--muted-foreground)]">Members you personally sponsored</p>
        </div>
      </div>
      <Card className="border-[var(--border)] bg-[var(--card)]">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div>
            <CardTitle className="text-base">Direct Referrals</CardTitle>
            <CardDescription className="text-xs">Direct sponsorship list kept separate from the binary placement tree.</CardDescription>
          </div>
          <Badge variant="outline">Direct Referrals: {loading ? '…' : rows.length}</Badge>
        </CardHeader>
        <CardContent className="space-y-4 pt-0">
          <div className="overflow-x-auto rounded-xl border border-[var(--border)]">
            <table className="w-full min-w-[540px] text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] bg-[var(--accent)]/40 text-left text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--muted-foreground)]">
                  {COLS.map((col) => (
                    <th key={col.key} className="px-4 py-3">{col.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={COLS.length} className="px-4 py-8 text-center text-sm text-[var(--muted-foreground)]">Loading…</td></tr>
                ) : visibleRows.length ? visibleRows.map((row, i) => (
                  <tr key={i} className="border-b border-[var(--border)] transition last:border-0 hover:bg-[var(--accent)]/30">
                    <td className="px-4 py-3 font-mono text-[var(--muted-foreground)]">{row.username}</td>
                    <td className="px-4 py-3 text-[var(--foreground)]">{row.name}</td>
                    <td className="px-4 py-3 text-[var(--foreground)]">{row.package}</td>
                    <td className="px-4 py-3">
                      <Badge variant={row.status === 'active' ? 'success' : 'outline'} className="text-[10px]">{row.status}</Badge>
                    </td>
                    <td className="px-4 py-3 capitalize text-[var(--foreground)]">{row.placement}</td>
                  </tr>
                )) : (
                  <tr><td colSpan={COLS.length} className="px-4 py-8 text-center text-sm text-[var(--muted-foreground)]">No direct referrals yet.</td></tr>
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
