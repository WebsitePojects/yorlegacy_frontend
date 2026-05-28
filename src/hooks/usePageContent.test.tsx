import { renderHook, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { usePageContent } from './usePageContent';

describe('usePageContent', () => {
  it('loads page content from the backend client', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        json: async () => ({
          slug: 'home',
          title: 'Yor International',
          eyebrow: 'Prestige in Motion',
          summary: 'Premium brand experience',
          sections: []
        })
      })) as unknown as typeof fetch
    );

    const { result } = renderHook(() => usePageContent('home'));

    await waitFor(() => {
      expect(result.current.data?.slug).toBe('home');
    });

    expect(result.current.error).toBeNull();
  });
});
