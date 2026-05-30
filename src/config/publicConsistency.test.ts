import { describe, expect, it } from 'vitest';
import { packageTiers } from './pagePresets';
import { fallbackContent } from '../data/fallbackContent';
import { bonusRouteContent } from '../components/pages/BonusDetailPageView';

describe('public consistency', () => {
  it('keeps the public package ladder aligned to the documented Yor order', () => {
    expect(packageTiers.map((tier) => `${tier.name}:${tier.price}:${tier.pv}`)).toEqual([
      'Classic:PHP 1,998:PV-5',
      'Basic:PHP 5,998:PV-10',
      'Standard:PHP 25,998:PV-50',
      'Business:PHP 50,998:PV-100',
      'VIP:PHP 159,998:PV-300'
    ]);
    expect(fallbackContent.packages.summary).toContain('Classic through VIP');
    expect(fallbackContent.packages.sections[0]?.body).toContain('Classic, Basic, Standard, Business, and VIP');
  });

  it('keeps direct referral values mapped to the corrected Classic and Basic tiers', () => {
    expect(bonusRouteContent['earn/direct-referral'].metrics).toEqual([
      { label: 'Classic', value: 'PHP 200', accent: 'muted' },
      { label: 'Basic', value: 'PHP 1,000', accent: 'primary' },
      { label: 'Standard', value: 'PHP 5,000', accent: 'primary' },
      { label: 'Business', value: 'PHP 7,000', accent: 'primary' },
      { label: 'VIP', value: 'PHP 15,000', accent: 'tertiary' }
    ]);
  });
});
