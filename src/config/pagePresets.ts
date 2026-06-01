export const pageAssets = {
  roundLogo: '/assets/yor/branding/yor-logo-round.png',
  showcaseLogo: '/assets/yor/branding/yor-logo-showcase.jpg',
  coverSkyline: '/assets/yor/branding/login-bg.png',
  founderPortrait: '/assets/yor/generated/yor-founder-portrait-ai.png',
  founderBackdrop: '/assets/yor/generated/yor-founder-generated.png',
  registrationBackdrop: '/assets/yor/branding/login-bg.png',
  authBackdrop: '/assets/yor/branding/login-bg.png',
  visionBanner: '/assets/yor/vision-banner.jpg',
  visionBannerPortrait: '/assets/yor/vision-banner-portrait.jpg',
  visionNew: '/assets/yor/vision-new.jpg',
  visionNewImage: '/assets/yor/vision-new-image.jpg',
  visionPoster: '/assets/yor/vision-poster.jpg',
  visionBox: '/assets/yor/vision-new-image.jpg',
  bag: '/assets/yor/bag.jpg'
} as const;

export const founderProfile = {
  eyebrow: 'The Visionary',
  badge: 'President / CEO',
  name: 'Mr. Yoren B. Abihay',
  summary:
    'A visionary leader dedicated to building a sustainable financial legacy for families across the globe through strategic innovation, ethical leadership, and direct-selling excellence.',
  ctaLabel: 'Discover the Story',
  ctaHref: '/mission'
} as const;

export const founderHighlights = [
  'Traditional Businessman',
  'Trainer and Mentor of MLM',
  'Network Builder',
  'Chairman of a Non-Profit Organization',
  '8 Years in the Corporate World',
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
    body: 'Every five direct signups on the same package tier unlock a same-package Get Yor Five claim.'
  },
  {
    href: '/earn/lifestyle-rewards',
    number: '6',
    title: 'Lifestyle Rewards',
    body: 'Repeat purchase volume feeds lifestyle-oriented bonuses and longer-term prestige rewards.'
  },
  {
    href: '/earn/unilevel',
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
    note: 'Flagship men\'s scent showcased in the legacy deck.',
    accent: 'For Men'
  },
  {
    title: 'Swiss Army',
    code: 'YM2',
    note: 'A broad-appeal men\'s fragrance entry in the lineup.',
    accent: 'For Men'
  },
  {
    title: 'Chanel Bleu',
    code: 'YM3',
    note: 'Luxury-positioned men\'s scent in the public lineup.',
    accent: 'For Men'
  },
  {
    title: 'Drakkar Noir',
    code: 'YM4',
    note: 'A heritage-styled men\'s signature with classic depth.',
    accent: 'For Men'
  },
  {
    title: 'Lacoste Red',
    code: 'YM5',
    note: 'A crisp men\'s fragrance with youthful energy.',
    accent: 'For Men'
  },
  {
    title: 'Acqua Invictus',
    code: 'YM6',
    note: 'A bright men\'s profile positioned as a confident daily wear.',
    accent: 'For Men'
  },
  {
    title: 'Clinique Happy',
    code: 'YM7',
    note: 'A fresh men\'s option with broad mass-market familiarity.',
    accent: 'For Men'
  },
  {
    title: 'One Million',
    code: 'YM8',
    note: 'A prestige men\'s scent highlighted for aspirational appeal.',
    accent: 'For Men'
  },
  {
    title: 'Polo Sport',
    code: 'YM9',
    note: 'An active men\'s variant with sporty positioning.',
    accent: 'For Men'
  },
  {
    title: 'Acqua Di Gio',
    code: 'YM10',
    note: 'A globally recognized men\'s fragrance anchor.',
    accent: 'For Men'
  },
  {
    title: 'Paris Hilton',
    code: 'YF1',
    note: 'A women\'s fragrance entry from the public deck.',
    accent: 'For Women'
  },
  {
    title: 'Britney Spears',
    code: 'YF2',
    note: 'A playful women\'s scent included in the public catalog.',
    accent: 'For Women'
  },
  {
    title: 'Meow',
    code: 'YF3',
    note: 'A feminine selection with youthful presentation.',
    accent: 'For Women'
  },
  {
    title: 'Bvlgari Amethyste',
    code: 'YF4',
    note: 'A feminine prestige variant showcased in the collection.',
    accent: 'For Women'
  },
  {
    title: 'D&G Light Blue',
    code: 'YF5',
    note: 'A bright women\'s fragrance with premium recognition.',
    accent: 'For Women'
  },
  {
    title: 'VS Bombshell',
    code: 'YF6',
    note: 'A recognizable women\'s fragrance entry in the Yor set.',
    accent: 'For Women'
  },
  {
    title: 'Jo Malone',
    code: 'YF7',
    note: 'A refined women\'s luxury option for prestige framing.',
    accent: 'For Women'
  },
  {
    title: 'Sweet Pea',
    code: 'YF8',
    note: 'A softer women\'s profile for broader gift appeal.',
    accent: 'For Women'
  },
  {
    title: 'Eclat',
    code: 'YF9',
    note: 'A polished women\'s entry for modern signature wear.',
    accent: 'For Women'
  },
  {
    title: 'Lacoste Pink',
    code: 'YF10',
    note: 'A lively women\'s scent with familiar prestige branding.',
    accent: 'For Women'
  }
];

export const featuredCollectionShowcase = {
  eyebrow: 'Featured Product',
  title: 'Yor Vision Ocular Wellness Feature',
  summary:
    'A dedicated feature block for Yor Vision as its own product story, separate from the fragrance collection and positioned as a branded wellness presentation piece.',
  points: [
    'Uses the approved Yor Vision banner, poster, and box imagery without mislabeling them as perfume assets.',
    'Keeps the fragrance lineup clean while still giving Yor Vision a premium visual stage of its own.',
    'Lets the products page present both the public perfume lineup and a distinct featured product story.'
  ],
  primaryImage: pageAssets.visionBanner,
  secondaryImage: pageAssets.visionPoster,
  tertiaryImage: pageAssets.visionNewImage
} as const;

export const homePreviewRoutes = [
  {
    href: '/vision',
    title: 'Vision',
    body: 'A global community of empowered entrepreneurs with shared success at the center.'
  },
  {
    href: '/mission',
    title: 'Mission',
    body: 'Ethical leadership, quality products, and business tools that help members build durable momentum.'
  },
  {
    href: '/products',
    title: 'Products',
    body: 'A perfume collection positioned as the premium retail anchor for the Yor legacy story.'
  },
  {
    href: '/earn',
    title: '8 Ways To Earn',
    body: 'Direct selling, referral, team growth, and global bonus pathways presented with premium clarity.'
  },
  {
    href: '/packages',
    title: 'Entry Packages',
    body: 'A five-tier ladder from Classic to VIP designed to move admiration into confident action.'
  }
] as const;

export const rankIncentiveRoadmap = [
  {
    rank: 'Manager',
    target: 'PHP 50k',
    reward: 'Exclusive iPhone',
    accent: 'standard' as const
  },
  {
    rank: 'Bronze Director',
    target: 'PHP 100k',
    reward: 'PHP 100k Car DP (Sedan)',
    accent: 'standard' as const
  },
  {
    rank: 'Silver Director',
    target: 'PHP 250k',
    reward: 'Asian Travel Package',
    accent: 'standard' as const
  },
  {
    rank: 'Gold Director',
    target: 'PHP 500k',
    reward: 'SUV Downpayment',
    accent: 'featured' as const
  },
  {
    rank: 'Platinum Elite',
    target: 'PHP 1M',
    reward: 'US / Europe Travel',
    accent: 'standard' as const
  },
  {
    rank: 'Hall of Famer',
    target: 'PHP 50M+',
    reward: 'Luxury Condo and Elite Rewards',
    accent: 'prestige' as const
  }
] as const;

export const rankIncentiveBenefits = [
  {
    title: 'Growth Metrics',
    body: 'Track real-time network expansion and cumulative earnings volume.'
  },
  {
    title: 'Instant Redemptions',
    body: 'Travel and gadget incentives are released within 30 days of qualification.'
  },
  {
    title: 'Heritage Legacy',
    body: 'Condo and high-value assets are transferable to your next of kin.'
  }
] as const;
