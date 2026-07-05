import {
  clearanceSupportFee,
  escrowFeeRate,
  escrowTrustThreshold,
  getCorridor,
  insuranceRate,
  platformMarginRate,
  tradeCosts,
  turnkeyServiceRate,
} from './rulePack.ts'
import type { Corridor, DeliveryTier, FulfilmentOption, InvoiceTotals } from './types.ts'

export interface PricingInput {
  corridorId: string
  basePrice: number
  lots: number
  freightTier: DeliveryTier
  moverTier: DeliveryTier
  fulfilment: FulfilmentOption
}

/**
 * Single source of truth for delivered-cost pricing. The API uses it to
 * produce authoritative quote snapshots; the web app uses the same function
 * for instant on-screen previews before a quote is locked.
 */
export function calculateInvoice(input: PricingInput): InvoiceTotals {
  const corridor = getCorridor(input.corridorId)
  const costs = tradeCosts[corridor.id]
  const lots = Math.max(1, Math.floor(input.lots))
  const turnkey = input.fulfilment === 'turnkey'

  const subtotal = input.basePrice * lots
  const freight = turnkey ? costs.freight[input.freightTier] * lots : 0
  const movers = turnkey ? costs.movers[input.moverTier] * lots : 0
  const insurance = turnkey ? subtotal * insuranceRate : 0
  const clearanceSupport = turnkey ? clearanceSupportFee * lots : 0
  const taxableBase = subtotal + freight + movers
  const platformMargin = taxableBase * platformMarginRate
  const turnkeyServiceCharge = turnkey
    ? (freight + movers + insurance + clearanceSupport) * turnkeyServiceRate
    : 0
  const gst = (platformMargin + turnkeyServiceCharge) * corridor.gstRate
  const escrowFee = corridor.trustScore < escrowTrustThreshold ? taxableBase * escrowFeeRate : 0
  const total = taxableBase + insurance + clearanceSupport + platformMargin + turnkeyServiceCharge + gst + escrowFee

  return {
    subtotal,
    freight,
    movers,
    insurance,
    clearanceSupport,
    platformMargin,
    turnkeyServiceCharge,
    gst,
    escrowFee,
    total,
  }
}

export function requiresEscrow(corridor: Corridor): boolean {
  return corridor.trustScore < escrowTrustThreshold
}

export function formatMoney(value: number, currency = 'INR'): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(value)
}
