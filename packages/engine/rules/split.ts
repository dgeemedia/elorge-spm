// packages/engine/rules/split.ts
// Split commissions: e.g. 70% to officer, 30% to manager
import type { CalculationInput } from '../types'

export function calculateSplit(input: CalculationInput): number {
  const shares = input.commissionRule.shares ?? []
  // Find the officer's share (ORIGINAL officerType)
  const officerShare = shares.find((s) => s.officerType === 'ORIGINAL')
  const pct = officerShare?.pct ?? 1.0
  const base = input.transactionValue * (input.commissionRule.rate ?? 0)
  return base * pct
}
