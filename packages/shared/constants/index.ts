// packages/shared/constants/index.ts

export const ROLES = ['OFFICER', 'MANAGER', 'DIRECTOR', 'FINANCE', 'ADMIN'] as const

export const LEAD_STATUSES = ['NEW', 'CONTACTED', 'NEGOTIATING', 'CONVERTED', 'LOST'] as const

export const COMMISSION_STATUSES = ['PENDING', 'APPROVED', 'PAID', 'DISPUTED', 'CLAWED_BACK'] as const

export const PRODUCT_CATEGORIES = ['LOAN', 'DEPOSIT', 'INVESTMENT', 'INSURANCE', 'CARD', 'OTHER'] as const

export const INDUSTRIES = ['BANKING', 'INSURANCE', 'MANUFACTURING', 'FMCG', 'REAL_ESTATE', 'TELECOMS'] as const

export const SUBSCRIPTION_TIERS = ['STARTER', 'GROWTH', 'PROFESSIONAL', 'ENTERPRISE'] as const

export const REMAP_TYPES = ['HYBRID', 'FULL', 'FREEZE'] as const

export const EXIT_REASONS = ['RESIGNATION', 'TERMINATION', 'TRANSFER'] as const

export const NAIRA_SYMBOL = '₦'

export const DEFAULT_PAGE_SIZE = 20
