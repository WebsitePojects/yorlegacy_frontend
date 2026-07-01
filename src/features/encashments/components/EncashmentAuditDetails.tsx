import type { AdminEncashmentCenter } from '@/types/auth';
import { formatEncashmentDate, incomeSourceLabel, reconciliationLabel } from '../audit';

type Encashment = AdminEncashmentCenter['encashments'][number];

const peso = (value: number) =>
  `PHP ${value.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

function MoneyRow({ label, value, strong = false }: { label: string; value: number; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span>{label}</span>
      <strong className={strong ? 'text-[var(--yor-copper-soft)]' : 'text-[var(--foreground)]'}>{peso(value)}</strong>
    </div>
  );
}

export function EncashmentAuditDetails({ encashment }: { encashment: Encashment }) {
  const { audit } = encashment;
  if (!audit) {
    return (
      <div className="rounded-xl border border-dashed border-[var(--border)] bg-[var(--background)] p-4 text-sm text-[var(--muted-foreground)]">
        Ledger audit details are unavailable until the backend update is active.
      </div>
    );
  }
  const status = reconciliationLabel(audit);

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-[var(--border)] bg-[var(--background)] p-3">
          <p className="text-xs uppercase tracking-[0.14em] text-[var(--muted-foreground)]">Requested</p>
          <p className="mt-1 text-sm font-medium">{formatEncashmentDate(encashment.requestedAt)}</p>
        </div>
        <div className="rounded-xl border border-[var(--border)] bg-[var(--background)] p-3">
          <p className="text-xs uppercase tracking-[0.14em] text-[var(--muted-foreground)]">Reviewed</p>
          <p className="mt-1 text-sm font-medium">{formatEncashmentDate(encashment.reviewedAt)}</p>
        </div>
        <div className="rounded-xl border border-[var(--border)] bg-[var(--background)] p-3">
          <p className="text-xs uppercase tracking-[0.14em] text-[var(--muted-foreground)]">Paid</p>
          <p className="mt-1 text-sm font-medium">{formatEncashmentDate(encashment.paidAt)}</p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-[var(--border)] bg-[var(--background)] p-4">
          <h3 className="text-sm font-semibold">Income credited before this request</h3>
          <div className="mt-3 grid gap-2 text-sm text-[var(--muted-foreground)]">
            {audit.incomeSources.length > 0 ? audit.incomeSources.map((source) => (
              <MoneyRow key={source.type} label={incomeSourceLabel(source.type)} value={source.amount} />
            )) : <p>No source-level ledger credits were found for this snapshot.</p>}
            <div className="border-t border-[var(--border)] pt-2">
              <MoneyRow label="Total income credits" value={audit.totalIncomeCredits} strong />
            </div>
            <MoneyRow label="Previous wallet debits" value={audit.priorDebits} />
          </div>
        </div>

        <div className="rounded-xl border border-[var(--border)] bg-[var(--background)] p-4">
          <h3 className="text-sm font-semibold">Balance reconciliation</h3>
          <div className="mt-3 grid gap-2 text-sm text-[var(--muted-foreground)]">
            <MoneyRow label="Balance before encashment" value={audit.balanceBefore} />
            <MoneyRow label="Gross encashment" value={audit.grossDebit} />
            <div className="border-t border-[var(--border)] pt-2">
              <MoneyRow label="Balance immediately after" value={audit.balanceAfter} strong />
            </div>
            <MoneyRow label="Current main-wallet balance" value={audit.currentBalance} />
            {audit.laterRestorations > 0 ? <MoneyRow label="Later restored to wallet" value={audit.laterRestorations} /> : null}
            <div className="mt-2 flex items-center justify-between gap-3 rounded-lg border border-[var(--border)] px-3 py-2">
              <span className={audit.reconciled ? 'text-emerald-500' : 'text-amber-500'}>{status}</span>
              <span>Difference: {peso(audit.reconciliationDifference)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
