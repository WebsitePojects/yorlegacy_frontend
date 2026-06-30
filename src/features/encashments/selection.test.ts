import { describe, expect, it } from 'vitest';

import { resolveEncashmentSelection } from './selection';

describe('resolveEncashmentSelection', () => {
  it('preserves the selected request when refreshed rows still contain it', () => {
    const rows = [{ id: 'first' }, { id: 'pending-request' }];

    expect(resolveEncashmentSelection(rows, 'pending-request')).toBe('pending-request');
  });

  it('falls back to the first request when the selection is unavailable', () => {
    const rows = [{ id: 'first' }, { id: 'second' }];

    expect(resolveEncashmentSelection(rows, 'missing')).toBe('first');
  });
});
