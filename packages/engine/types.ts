// packages/engine/types.ts

import type { CommissionRule, RemappingType } from '@elorge/shared/types'

export interface CalculationInput {
  transactionValue:       number
  commissionRule:         CommissionRule
  officerVolumeThisMonth: number   // how many of this product the officer sold this month
  isExistingClient:       boolean  // true = client already has at least one product
  isNewProductForClient:  boolean  // true = client has never bought this product type before
  transactionDate:        Date
  isOfficerActive:        boolean  // false = original officer has exited
  remappingType:          RemappingType | null
  // ── Simulation mode ───────────────────────────────────────────────────────
  // When true: full commission calculation runs but NO Commission record is
  // created in the database. Used for SALARY_ONLY orgs to show officers their
  // "projected earnings" — what they would earn if incentives were activated.
  simulationMode?:        boolean
}

export interface CalculationResult {
  amount:      number   // final commission in NGN — always whole naira
  ruleApplied: string   // human-readable description
  breakdown:   string[] // step-by-step for dispute transparency
  officerEarns: boolean // false = commission goes to org (freeze / repeat product)
  // ── Simulation flag ───────────────────────────────────────────────────────
  // true = this result was calculated in simulation mode and was NOT persisted.
  // Callers must NOT create a Commission record when this is true.
  isSimulated: boolean
}
