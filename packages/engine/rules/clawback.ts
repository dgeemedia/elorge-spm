// packages/engine/rules/clawback.ts
// Reverses commission when a loan defaults or product is cancelled
// Called from the API when a clawback event is received

export function calculateClawback(originalAmount: number): number {
  // Full reversal — return negative of original
  return -originalAmount
}

export function isWithinClawbackWindow(
  transactionDate: Date,
  windowDays: number = 90
): boolean {
  const now = new Date()
  const diff = (now.getTime() - transactionDate.getTime()) / (1000 * 60 * 60 * 24)
  return diff <= windowDays
}
