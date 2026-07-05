import { describe, expect, it } from 'vitest'
import { calculateInvoice, formatMoney } from '../src/pricing.ts'
import { escrowTrustThreshold, corridors } from '../src/rulePack.ts'

const base = {
  corridorId: 'maharashtra-india',
  basePrice: 462000,
  lots: 1,
  freightTier: 'normal' as const,
  moverTier: 'normal' as const,
  fulfilment: 'turnkey' as const,
}

describe('calculateInvoice', () => {
  it('prices a turnkey lot with all delivered components', () => {
    const invoice = calculateInvoice(base)
    expect(invoice.subtotal).toBe(462000)
    expect(invoice.freight).toBe(28000)
    expect(invoice.movers).toBe(9000)
    expect(invoice.insurance).toBeCloseTo(462000 * 0.004)
    expect(invoice.clearanceSupport).toBe(8500)
    expect(invoice.platformMargin).toBeCloseTo((462000 + 28000 + 9000) * 0.035)
    expect(invoice.total).toBeGreaterThan(invoice.subtotal)
  })

  it('zeroes logistics components for sourcing-only fulfilment', () => {
    const invoice = calculateInvoice({ ...base, fulfilment: 'sourcing-only' })
    expect(invoice.freight).toBe(0)
    expect(invoice.movers).toBe(0)
    expect(invoice.insurance).toBe(0)
    expect(invoice.clearanceSupport).toBe(0)
    expect(invoice.turnkeyServiceCharge).toBe(0)
    expect(invoice.total).toBeCloseTo(
      invoice.subtotal + invoice.platformMargin + invoice.gst + invoice.escrowFee,
    )
  })

  it('scales linearly with lots', () => {
    const single = calculateInvoice(base)
    const triple = calculateInvoice({ ...base, lots: 3 })
    expect(triple.subtotal).toBe(single.subtotal * 3)
    expect(triple.freight).toBe(single.freight * 3)
    expect(triple.clearanceSupport).toBe(single.clearanceSupport * 3)
    expect(triple.total).toBeCloseTo(single.total * 3)
  })

  it('charges urgent tiers above normal tiers', () => {
    const normal = calculateInvoice(base)
    const urgent = calculateInvoice({ ...base, freightTier: 'urgent', moverTier: 'urgent' })
    expect(urgent.freight).toBeGreaterThan(normal.freight)
    expect(urgent.movers).toBeGreaterThan(normal.movers)
    expect(urgent.total).toBeGreaterThan(normal.total)
  })

  it('adds the escrow fee only below the trust threshold', () => {
    for (const corridor of corridors) {
      const invoice = calculateInvoice({ ...base, corridorId: corridor.id })
      if (corridor.trustScore < escrowTrustThreshold) {
        expect(invoice.escrowFee).toBeGreaterThan(0)
      } else {
        expect(invoice.escrowFee).toBe(0)
      }
    }
  })

  it('applies GST only to platform charges, not the product subtotal', () => {
    const invoice = calculateInvoice(base)
    expect(invoice.gst).toBeCloseTo((invoice.platformMargin + invoice.turnkeyServiceCharge) * 0.05)
  })

  it('clamps lots to at least one', () => {
    const invoice = calculateInvoice({ ...base, lots: 0 })
    expect(invoice.subtotal).toBe(462000)
  })

  it('rejects unknown corridors', () => {
    expect(() => calculateInvoice({ ...base, corridorId: 'mars-india' })).toThrow(/Unknown corridor/)
  })
})

describe('formatMoney', () => {
  it('formats INR with Indian digit grouping and no decimals', () => {
    expect(formatMoney(462000)).toBe('₹4,62,000')
  })
})
