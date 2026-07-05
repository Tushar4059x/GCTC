import { createHash } from 'node:crypto'
import type { LogisticsPartner, Order, PriceRevision, Product, SellerSale } from '@prisma/client'
import {
  calculateInvoice,
  getCorridor,
  type CatalogueItemDTO,
  type FulfilmentOption,
  type InvoiceTotals,
  type LogisticsPartnerDTO,
  type OrderDTO,
  type PriceRevisionDTO,
  type ProductClass,
  type QualityStatus,
  type SellerProductDTO,
  type SellerSaleDTO,
} from '@gctc/shared'

const isoDate = (value: Date) => value.toISOString().slice(0, 10)

export function toCatalogueItem(product: Product): CatalogueItemDTO {
  const corridor = getCorridor(product.corridorId)
  const delivered = calculateInvoice({
    corridorId: product.corridorId,
    basePrice: product.basePrice,
    lots: 1,
    freightTier: 'normal',
    moverTier: 'normal',
    fulfilment: 'turnkey',
  })
  return {
    id: product.id,
    corridorId: product.corridorId,
    productClass: product.productClass as ProductClass,
    name: product.name,
    category: product.category,
    state: product.state,
    origin: product.origin,
    imageUrl: product.imageUrl,
    unit: product.unit,
    basePrice: product.basePrice,
    priceVersion: product.priceVersion,
    priceUpdatedAt: isoDate(product.priceUpdatedAt),
    procurementFrequency: product.procurementFrequency,
    availableQty: product.availableQty,
    specs: product.specs,
    certifications: product.certifications,
    decisionFactors: product.decisionFactors,
    note: product.note,
    deliveredPrice: Math.round(delivered.total),
    currency: corridor.currency,
  }
}

export function toSellerProduct(product: Product): SellerProductDTO {
  return { ...toCatalogueItem(product), sellerId: product.sellerId }
}

/** Stable anonymised buyer reference so sellers never see buyer identity. */
export function buyerAlias(buyerId: string): string {
  const digest = createHash('sha256').update(buyerId).digest('hex').slice(0, 6).toUpperCase()
  return `Buyer account ${digest}`
}

export function toOrder(
  order: Order & { product: Product },
  viewer: { role: string; id: string },
): OrderDTO {
  const anonymise = viewer.role === 'seller'
  return {
    id: order.id,
    productId: order.productId,
    productName: order.product.name,
    imageUrl: order.product.imageUrl,
    corridorLabel: order.corridorLabel,
    lots: order.lots,
    fulfilment: order.fulfilment as FulfilmentOption,
    totals: order.totals as unknown as InvoiceTotals,
    totalAmount: order.totalAmount,
    currency: order.currency,
    status: order.status,
    paymentStatus: order.paymentStatus,
    protection: order.paymentStatus === 'escrow-secured' ? 'Escrow protection active' : 'Payment hold active',
    buyerLabel: anonymise ? buyerAlias(order.buyerId) : 'Your organisation',
    createdAt: order.createdAt.toISOString(),
  }
}

export function toPriceRevision(revision: PriceRevision & { product: Product }): PriceRevisionDTO {
  return {
    id: revision.id,
    productId: revision.productId,
    productName: revision.product.name,
    previousPrice: revision.previousPrice,
    newPrice: revision.newPrice,
    reason: revision.reason,
    effectiveAt: revision.effectiveAt.toISOString(),
  }
}

export function toSellerSale(sale: SellerSale & { product: Product }): SellerSaleDTO {
  return {
    id: sale.id,
    productId: sale.productId,
    productName: sale.product.name,
    buyerAlias: sale.buyerAlias,
    soldAt: isoDate(sale.soldAt),
    lots: sale.lots,
    quantityTons: sale.quantityTons,
    amount: sale.amount,
    fulfilment: sale.fulfilment as FulfilmentOption,
    qualityStatus: sale.qualityStatus as QualityStatus,
    disputeCount: sale.disputeCount,
  }
}

export function toLogisticsPartner(partner: LogisticsPartner): LogisticsPartnerDTO {
  return {
    id: partner.id,
    type: partner.type,
    legalName: partner.legalName,
    corridor: partner.corridor,
    baseRatePerTon: partner.baseRatePerTon,
    distanceRatePerTonKm: partner.distanceRatePerTonKm,
    capacity: partner.capacity,
    status: partner.status,
    lastAudit: isoDate(partner.lastAudit),
  }
}

export function salesToCsv(sales: SellerSaleDTO[]): string {
  const headers = [
    'Sale ID',
    'Date',
    'Buyer reference',
    'Product',
    'Lots',
    'Quantity tons',
    'Value INR',
    'Fulfilment',
    'Quality',
    'Disputes',
  ]
  const rows = sales.map((sale) => [
    sale.id,
    sale.soldAt,
    sale.buyerAlias,
    sale.productName,
    sale.lots,
    sale.quantityTons,
    sale.amount,
    sale.fulfilment,
    sale.qualityStatus,
    sale.disputeCount,
  ])
  const escapeCell = (value: string | number) => {
    const text = String(value)
    // Prefix spreadsheet formula triggers so exported cells stay inert.
    const spreadsheetSafe = /^[=+\-@]/.test(text) ? `'${text}` : text
    return `"${spreadsheetSafe.replaceAll('"', '""')}"`
  }
  return [headers, ...rows].map((row) => row.map(escapeCell).join(',')).join('\n')
}
