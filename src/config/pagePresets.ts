export const pageAssets = {
  coverSkyline: '/assets/yor/vision-banner.jpg',
  founderPortrait: '/assets/yor/vision-banner-portrait.jpg',
  registrationBackdrop: '/assets/yor/vision-new-image.jpg'
} as const;

export const founderHighlights = [
  'Traditional Business Man',
  'Trainer / Mentor of MLM',
  'Network Builder',
  'Chairman of Non-Profit Organization',
  '8 Years Experience in Corporate World',
  '6x Top Earner',
  'BS Criminology Graduate'
];

export const packageTiers = [
  {
    name: 'Basic',
    label: 'Entry Package',
    price: 'PHP 1,998',
    pv: 'PV-5',
    features: ['40% lifetime discount', 'Direct selling access', 'Value-for-money starter entry']
  },
  {
    name: 'Classic',
    label: 'Growth Package',
    price: 'PHP 5,998',
    pv: 'PV-10',
    features: ['Direct referral bonus', 'Get Yor Five qualification', 'Repeat purchase rewards']
  },
  {
    name: 'Standard',
    label: 'Momentum Package',
    price: 'PHP 25,998',
    pv: 'PV-50',
    featured: true,
    features: ['Higher salesmatch value', 'Binary cycle participation', 'Expanded unilevel potential']
  },
  {
    name: 'Business',
    label: 'Leadership Package',
    price: 'PHP 50,998',
    pv: 'PV-100',
    features: ['Stronger weekly earning ceiling', 'Lifestyle reward upside', 'Rank and incentive momentum']
  },
  {
    name: 'VIP',
    label: 'Legacy Package',
    price: 'PHP 159,998',
    pv: 'PV-300',
    vip: true,
    features: ['Top public match value', 'Global bonus eligibility path', 'Highest public package positioning']
  }
];

export const earnCards = [
  {
    href: '/earn/direct-selling',
    number: '1',
    title: 'Direct Selling',
    body: 'Earn retail profit from fragrance sales while preserving the premium feel of the product line.'
  },
  {
    href: '/earn/direct-referral',
    number: '2',
    title: 'Direct Referral',
    body: 'Receive package-based referral rewards for every personally sponsored member.'
  },
  {
    href: '/earn/salesmatch',
    number: '3',
    title: 'Salesmatch Bonus',
    body: 'Unlock binary matching income with strong-leg retention, no daily flush-out, and weekly payout rhythm.'
  },
  {
    href: '/earn/binary-cycle',
    number: '4',
    title: 'Binary Cycle Bonus',
    body: 'Earn a public percentage-based cycle bonus from the broader network movement around qualified volume.'
  },
  {
    href: '/earn/get-five',
    number: '5',
    title: 'Get Yor Five Bonus',
    body: 'Every five direct signups on the same package tier unlock a milestone bonus.'
  },
  {
    href: '/earn/lifestyle-rewards',
    number: '6',
    title: 'Lifestyle Rewards',
    body: 'Repeat purchase volume feeds lifestyle-oriented bonuses and longer-term prestige rewards.'
  },
  {
    href: '/earn/unilevel-rank',
    number: '7',
    title: 'Unilevel Bonus',
    body: 'Move through up to ten levels of public unilevel percentages as your organization expands.'
  },
  {
    href: '/earn/global',
    number: '8',
    title: 'Global Bonus',
    body: 'Qualified hall-of-fame leaders participate in the yearly global sales pool.'
  }
];

export const collectionProducts = [
  {
    title: 'Hugo Boss',
    code: 'YM1',
    note: 'Part of the Yor Perfume men\'s line presented in the business deck.',
    accent: 'For Men'
  },
  {
    title: 'Swiss Army',
    code: 'YM2',
    note: 'A men\'s fragrance entry designed for broad premium appeal.',
    accent: 'For Men'
  },
  {
    title: 'Chanel Bleu',
    code: 'YM3',
    note: 'Luxury-positioned men\'s scent in the public Yor lineup.',
    accent: 'For Men'
  },
  {
    title: 'Paris Hilton',
    code: 'YF1',
    note: 'A women\'s fragrance entry from the Yor public deck.',
    accent: 'For Women'
  },
  {
    title: 'Bvlgari Amethyste',
    code: 'YF4',
    note: 'A feminine prestige variant showcased in the collection.',
    accent: 'For Women'
  },
  {
    title: 'VS Bombshell',
    code: 'YF6',
    note: 'A recognizable women\'s fragrance entry in the Yor set.',
    accent: 'For Women'
  }
];
