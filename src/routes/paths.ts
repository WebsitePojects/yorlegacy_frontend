export const PATHS = {
  HOME: '/',
  LOGIN: '/login',
  ADMIN_LOGIN: '/admin/login',
  REGISTER: '/register',
  JOIN: (referralCode: string) => `/join/${referralCode}`,
  UNAUTHORIZED: '/unauthorized',
  NOT_FOUND: '*',

  MEMBER: {
    ROOT: '/member',
    MODULE: (moduleId: string) => `/member/${moduleId}`
  },

  ADMIN: {
    ROOT: '/admin',
    MODULE: (moduleId: string) => `/admin/${moduleId}`
  },

  BOD: {
    ROOT: '/bod',
    MODULE: (moduleId: string) => `/bod/${moduleId}`
  },

  CONTENT: {
    VISION: '/vision',
    MISSION: '/mission',
    PRODUCTS: '/products',
    PACKAGES: '/packages',
    THANK_YOU: '/thank-you',
    EARN: '/earn',
    EARN_DIRECT_SELLING: '/earn/direct-selling',
    EARN_DIRECT_REFERRAL: '/earn/direct-referral',
    EARN_SALESMATCH: '/earn/salesmatch',
    EARN_BINARY_CYCLE: '/earn/binary-cycle',
    EARN_GET_FIVE: '/earn/get-five',
    EARN_LIFESTYLE: '/earn/lifestyle-rewards',
    EARN_UNILEVEL: '/earn/unilevel-rank',
    EARN_GLOBAL: '/earn/global',
    RANK_INCENTIVES: '/rank-incentives'
  }
} as const;
