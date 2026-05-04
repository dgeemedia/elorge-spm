// packages/engine/rules/tiered.ts
import type { CalculationInput } from '../types'

export function calculateTiered(input: CalculationInput): number {
  const tiers = input.commissionRule.tiers ?? []
  const volume = input.officerVolumeThisMonth

  const tier = tiers.find(
    (t) =>
      volume >= t.minVolume &&
      (t.maxVolume === null || volume <= t.maxVolume)
  )

  if (!tier) {
    throw new Error(
      `No matching tier for volume ${volume}. Check product commission rule configuration.`
    )
  }

  return input.transactionValue * tier.rate
}
