// packages/engine/rules/accelerator.ts
// Time-bound multiplier — e.g. double commission in Q4
import type { CalculationInput } from '../types'

export function applyAccelerator(base: number, input: CalculationInput): number {
  const acc = input.commissionRule.accelerator
  if (!acc) return base

  const start = new Date(acc.startDate)
  const end   = new Date(acc.endDate)
  const date  = input.transactionDate

  if (date >= start && date <= end) {
    return base * acc.multiplier
  }
  return base
}
