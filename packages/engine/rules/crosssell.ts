// packages/engine/rules/crosssell.ts
// Extra bonus when an existing client buys a new product
import type { CalculationInput } from '../types'

export function applyCrossSellBonus(amount: number, input: CalculationInput): number {
  if (!input.isExistingClient) return amount
  if (!input.isNewProductForClient) return amount
  const bonus = input.commissionRule.crossSellBonus ?? 0
  return amount + bonus
}
