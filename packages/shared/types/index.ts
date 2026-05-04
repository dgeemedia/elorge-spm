// packages/shared/types/index.ts

export type Role = 'OFFICER' | 'MANAGER' | 'DIRECTOR' | 'FINANCE' | 'ADMIN'

export type LeadStatus = 'NEW' | 'CONTACTED' | 'NEGOTIATING' | 'CONVERTED' | 'LOST'

export type CommissionStatus = 'PENDING' | 'APPROVED' | 'PAID' | 'DISPUTED' | 'CLAWED_BACK'

export type RemappingType = 'HYBRID' | 'FULL' | 'FREEZE'

export type ExitReason = 'RESIGNATION' | 'TERMINATION' | 'TRANSFER'

export type LoginMethod = 'PASSWORD' | 'SSO'

export type RemappingStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'MODIFIED'

export type ProductCategory = 'LOAN' | 'DEPOSIT' | 'INVESTMENT' | 'INSURANCE' | 'CARD' | 'OTHER'

export type CommissionRuleType = 'FLAT' | 'TIERED' | 'SPLIT'

export interface TieredTier {
  minVolume: number
  maxVolume: number | null
  rate: number
}

export interface CommissionRule {
  type: CommissionRuleType
  rate?: number           // for FLAT
  tiers?: TieredTier[]   // for TIERED
  shares?: { officerType: string; pct: number }[] // for SPLIT
  accelerator?: {
    startDate: string
    endDate: string
    multiplier: number
  }
  crossSellBonus?: number // extra fixed amount if existing client
}

export interface ApiResponse<T = unknown> {
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
}
