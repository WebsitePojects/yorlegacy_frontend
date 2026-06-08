import { describe, expect, it } from 'vitest';
import { buildSeoConfig } from './seo';

describe('buildSeoConfig', () => {
  it('builds the homepage as the canonical indexable brand hub', () => {
    const seo = buildSeoConfig({ slug: 'home', pathname: '/' });

    expect(seo.title).toMatch(/yor international/i);
    expect(seo.canonicalUrl).toBe('https://yorinternational.net/');
    expect(seo.robots).toBe('index,follow');
    expect(seo.jsonLd.some((entry) => entry['@type'] === 'Organization')).toBe(true);
    expect(seo.jsonLd.some((entry) => entry['@type'] === 'FAQPage')).toBe(true);
  });

  it('marks login as a noindex utility route', () => {
    const seo = buildSeoConfig({ slug: 'login', pathname: '/login' });

    expect(seo.canonicalUrl).toBe('https://yorinternational.net/login');
    expect(seo.robots).toBe('noindex,follow');
    expect(seo.title).toMatch(/login/i);
  });

  it('keeps ways of wealth detail pages indexable with their own canonical URLs', () => {
    const seo = buildSeoConfig({ slug: 'earn/direct-selling', pathname: '/earn/direct-selling' });

    expect(seo.canonicalUrl).toBe('https://yorinternational.net/earn/direct-selling');
    expect(seo.robots).toBe('index,follow');
    expect(seo.title).toMatch(/direct selling/i);
  });
});
