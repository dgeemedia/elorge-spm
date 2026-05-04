// packages/engine/calculate.ts
// Main commission calculation entry point
// Pure TypeScript — no database calls, no HTTP — fully unit testable
//
// simulationMode: when true, the engine runs the full calculation but returns
// isSimulated: true. The CALLER must not persist a Commission record.
// Used by SALARY_ONLY orgs to show officers their projected earnings.

import { calculateFlat }       from './rules/flat'
import { calculateTiered }     from './rules/tiered'
import { calculateSplit }      from './rules/split'
import { applyAccelerator }    from './rules/accelerator'
import { applyCrossSellBonus } from './rules/crosssell'
import type { CalculationInput, CalculationResult } from './types'

export function calculateCommission(input: CalculationInput): CalculationResult {
  const breakdown: string[] = []
  const isSimulated = input.simulationMode ?? false

  if (isSimulated) {
    breakdown.push('⚡ SIMULATION MODE — result is projected only, no commission record will be created')
  }

  // ── STEP 1: Staff exit check ───────────────────────────────────────────────
  if (!input.isOfficerActive) {
    if (input.remappingType === 'FREEZE') {
      return {
        amount: 0,
        officerEarns: false,
        ruleApplied: 'FREEZE — portfolio frozen on officer exit',
        breakdown: ['No commission: client portfolio is frozen. Revenue goes to organisation.'],
        isSimulated,
      }
    }

    if (input.remappingType === 'HYBRID' && !input.isNewProductForClient) {
      return {
        amount: 0,
        officerEarns: false,
        ruleApplied: 'HYBRID — repeat product from exited officer portfolio',
        breakdown: [
          'No commission: this is a repeat purchase of a product the exited officer originally sold.',
          'Commission only paid when servicing officer introduces a NEW product type to this client.',
        ],
        isSimulated,
      }
    }
    // FULL remapping or HYBRID with new product → fall through to normal calculation
    breakdown.push(`Remapping type: ${input.remappingType} — proceeding with calculation for servicing officer`)
  }

  // ── STEP 2: Base commission ────────────────────────────────────────────────
  let base: number
  let ruleDesc: string

  switch (input.commissionRule.type) {
    case 'FLAT':
      base = calculateFlat(input)
      ruleDesc = `FLAT: ${(input.commissionRule.rate! * 100).toFixed(2)}% × ₦${input.transactionValue.toLocaleString()} = ₦${Math.round(base).toLocaleString()}`
      break
    case 'TIERED':
      base = calculateTiered(input)
      ruleDesc = `TIERED: volume ${input.officerVolumeThisMonth} this month × ₦${input.transactionValue.toLocaleString()} = ₦${Math.round(base).toLocaleString()}`
      break
    case 'SPLIT':
      base = calculateSplit(input)
      ruleDesc = `SPLIT: officer share × ₦${input.transactionValue.toLocaleString()} = ₦${Math.round(base).toLocaleString()}`
      break
    default:
      throw new Error(`Unknown commission rule type: ${(input.commissionRule as any).type}`)
  }

  breakdown.push(`Base commission: ${ruleDesc}`)

  // ── STEP 3: Accelerator ────────────────────────────────────────────────────
  const accelerated = applyAccelerator(base, input)
  if (accelerated !== base) {
    breakdown.push(`Accelerator applied: ₦${Math.round(base).toLocaleString()} × ${input.commissionRule.accelerator!.multiplier} = ₦${Math.round(accelerated).toLocaleString()}`)
  }

  // ── STEP 4: Cross-sell bonus ───────────────────────────────────────────────
  const withBonus = applyCrossSellBonus(accelerated, input)
  if (withBonus !== accelerated) {
    breakdown.push(`Cross-sell bonus: +₦${(withBonus - accelerated).toLocaleString()} (existing client, new product)`)
  }

  // ── STEP 5: Round to whole naira ───────────────────────────────────────────
  const final = Math.round(withBonus)
  breakdown.push(`${isSimulated ? 'Projected' : 'Final'} commission: ₦${final.toLocaleString()}`)

  return {
    amount: final,
    officerEarns: true,
    ruleApplied: ruleDesc,
    breakdown,
    isSimulated,
  }
}

export type { CalculationInput, CalculationResult }
