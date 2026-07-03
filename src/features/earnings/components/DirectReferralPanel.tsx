import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { fetchMemberDirectReferrals } from '@/lib/api';
import { readOfficeCache, writeOfficeCache } from '@/lib/office-cache';
import type { OperationalModule } from '@/types/auth';

const DR_PAGE_SIZE = 10;
const DR_CACHE_KEY = 'member:direct-referrals';

type DirectReferralRow = { username: string; name: string; package: string; status: string; placement: string };

type DirectReferralPanelProps = {
  activeModule: OperationalModule;
};

function packageChipClass(packageTier: string) {
  switch (packageTier.trim().toUpperCase()) {
    case 'VIP':
      return 'office-package-chip office-package-chip--vip';
    case 'BUSINESS':
      return 'office-package-chip office-package-chip--business';
    case 'STANDARD':
      return 'office-package-chip office-package-chip--standard';
    case 'CLASSIC':
      return 'office-package-chip office-package-chip--classic';
    default:
      return 'office-package-chip office-package-chip--basic';
  }
}

export function DirectReferralPanel({ activeModule }: DirectReferralPanelProps) {
  const [page, setPage] = useState(1);
  const cachedRows = readOfficeCache<DirectReferralRow[]>(DR_CACHE_KEY)?.data ?? null;
  const [prodRows, setProdRows] = useState<DirectReferralRow[] | null>(cachedRows);
  const [prodResolved, setProdResolved] = useState(cachedRows !== null);
  const [loading, setLoading] = useState(cachedRows === null);

  useEffect(() => {
    let cancelled = false;
    fetchMemberDirectReferrals()
      .then((data) => {
        if (!cancelled) {
          setProdRows(data.rows);
          setProdResolved(true);
          writeOfficeCache(DR_CACHE_KEY, data.rows);
        }
      })
      .catch(() => {
        if (!cancelled && cachedRows === null) {
          setProdRows(null);
          setProdResolved(false);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [cachedRows]);

  const moduleRows = activeModule.table.rows as Array<Record<string, unknown>>;
  const sandboxRows: DirectReferralRow[] = moduleRows.map((row) => ({
    username: String(row.username ?? ''),
    name: String(row.name ?? ''),
    package: String(row.package ?? ''),
    status: String(row.status ?? ''),
    placement: String(row.placement ?? '')
  }));

  const rows: DirectReferralRow[] = prodResolved ? (prodRows ?? []) : sandboxRows;
  const totalPages = Math.max(1, Math.ceil(rows.length / DR_PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const visibleRows = rows.slice((currentPage - 1) * DR_PAGE_SIZE, currentPage * DR_PAGE_SIZE);

  const columns = [
    { key: 'username', label: 'Username' },
    { key: 'name', label: 'Full Name' },
    { key: 'package', label: 'Package' },
    { key: 'status', label: 'Status' },
    { key: 'placement', label: 'Placement' }
  ];

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="flex size-16 shrink-0 items-center justify-center rounded-2xl border border-[var(--office-tone-blue-border)] bg-[var(--office-tone-blue-bg)] shadow-[0_16px_34px_var(--office-tone-blue-shadow)]">
          <span className="text-2xl font-bold text-[var(--office-tone-blue-text)]">{loading ? '…' : rows.length}</span>
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
                  {columns.map((col) => (
                    <th key={col.key} className="px-4 py-3">{col.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={columns.length} className="px-4 py-8 text-center text-sm text-[var(--muted-foreground)]">Loading…</td></tr>
                ) : visibleRows.length ? visibleRows.map((row, index) => (
                  <tr key={`${row.username}-${index}`} className="border-b border-[var(--border)] transition last:border-0 hover:bg-[var(--accent)]/30">
                    <td className="px-4 py-3 font-mono text-[var(--muted-foreground)]">{row.username}</td>
                    <td className="px-4 py-3 text-[var(--foreground)]">{row.name}</td>
                    <td className="px-4 py-3">
                      <span className={packageChipClass(row.package)}>{row.package}</span>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={row.status === 'active' ? 'success' : 'outline'} className="text-[10px]">{row.status}</Badge>
                    </td>
                    <td className="px-4 py-3 capitalize text-[var(--foreground)]">{row.placement}</td>
                  </tr>
                )) : (
                  <tr><td colSpan={columns.length} className="px-4 py-8 text-center text-sm text-[var(--muted-foreground)]">No direct referrals yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
          {rows.length > DR_PAGE_SIZE && (
            <div className="flex items-center justify-between gap-3 text-sm text-[var(--muted-foreground)]">
              <span>Page {currentPage} of {totalPages} · {rows.length} referral(s)</span>
              <div className="flex gap-2">
                <Button type="button" variant="outline" size="sm" disabled={currentPage <= 1} onClick={() => setPage((value) => Math.max(1, value - 1))}>Prev</Button>
                <Button type="button" variant="outline" size="sm" disabled={currentPage >= totalPages} onClick={() => setPage((value) => Math.min(totalPages, value + 1))}>Next</Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
