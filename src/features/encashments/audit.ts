const SOURCE_LABELS: Record<string, string> = {
  direct_referral: 'Direct Referral',
  salesmatch: 'Salesmatch',
  binary_cycle: 'Binary Cycle',
  get_five: 'Get Yor Five',
  lifestyle_rewards: 'Lifestyle Rewards',
  unilevel: 'Unilevel',
  global_bonus: 'Global Bonus',
  adjustment: 'Adjustments'
};

export function formatEncashmentDate(value: string | null | undefined): string {
  if (!value) return '—';
  return new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Manila',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  }).format(new Date(value));
}

export function incomeSourceLabel(type: string): string {
  return SOURCE_LABELS[type] ?? type.replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function reconciliationLabel(audit: { snapshotAvailable: boolean; reconciled: boolean }): string {
  if (!audit.snapshotAvailable) return 'Ledger snapshot unavailable';
  return audit.reconciled ? 'Reconciled' : 'Needs reconciliation';
}
