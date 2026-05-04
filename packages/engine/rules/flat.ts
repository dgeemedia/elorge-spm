// packages/engine/rules/flat.ts
import type { CalculationInput } from '../types'

export function calculateFlat(input: CalculationInput): number {
  const rate = input.commissionRule.rate ?? 0
  return input.transactionValue * rate
}
