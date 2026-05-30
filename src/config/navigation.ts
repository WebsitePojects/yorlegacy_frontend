export type PrimaryNavigationItem = {
  label: string;
  href: string;
  matchPatterns: string[];
};

export const primaryNavigation: PrimaryNavigationItem[] = [
  {
    label: 'Home',
    href: '/',
    matchPatterns: ['/', '/founder']
  },
  {
    label: 'Vision',
    href: '/vision',
    matchPatterns: ['/vision']
  },
  {
    label: 'Mission',
    href: '/mission',
    matchPatterns: ['/mission']
  },
  {
    label: 'Products',
    href: '/products',
    matchPatterns: ['/products', '/perfume-collection']
  },
  {
    label: 'Earn',
    href: '/earn',
    matchPatterns: ['/earn', '/earn/*', '/rank-incentives']
  },
  {
    label: 'Packages',
    href: '/packages',
    matchPatterns: ['/packages', '/register', '/thank-you']
  }
];

export const earnRoutes = [
  { label: '1. Direct Selling Bonus', href: '/earn/direct-selling' },
  { label: '2. Direct Referral Bonus', href: '/earn/direct-referral' },
  { label: '3. Salesmatch Bonus', href: '/earn/salesmatch' },
  { label: '4. Binary Cycle Bonus', href: '/earn/binary-cycle' },
  { label: '5. Get Yor Five Bonus', href: '/earn/get-five' },
  { label: '6. Lifestyle Rewards', href: '/earn/lifestyle-rewards' },
  { label: '7. Unilevel Bonus', href: '/earn/unilevel' },
  { label: '8. Global Bonus', href: '/earn/global' }
];
