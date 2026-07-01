import { describe, expect, it } from 'vitest';

import { formatEncashmentDate, incomeSourceLabel, reconciliationLabel } from './audit';

describe('encashment audit presentation', () => {
  it('formats timestamps in Manila time', () => {
    expect(formatEncashmentDate('2026-06-30T16:30:00.000Z')).toContain('Jul 1, 2026');
  });

  it('labels approved income sources for admins', () => {
    expect(incomeSourceLabel('direct_referral')).toBe('Direct Referral');
    expect(incomeSourceLabel('get_five')).toBe('Get Yor Five');
  });

  it('makes unavailable and mismatched snapshots explicit', () => {
    expect(reconciliationLabel({ snapshotAvailable: false, reconciled: false })).toBe('Ledger snapshot unavailable');
    expect(reconciliationLabel({ snapshotAvailable: true, reconciled: false })).toBe('Needs reconciliation');
    expect(reconciliationLabel({ snapshotAvailable: true, reconciled: true })).toBe('Reconciled');
  });
});
