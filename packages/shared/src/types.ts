export type CorridorId =
  | 'maharashtra-india'
  | 'andhra-pradesh-india'
  | 'gujarat-india'
  | 'telangana-india'
  | 'rajasthan-india'
  | 'kerala-india'
  | 'karnataka-india'

export type DeliveryTier = 'normal' | 'urgent'
export type PaymentStatus = 'draft' | 'escrow-required' | 'ready' | 'secured'
export type FulfilmentOption = 'sourcing-only' | 'turnkey'
export type ProductClass = 'food' | 'plant'
export type QualityStatus = 'passed' | 'review' | 'rejected'
export type Role = 'buyer' | 'seller' | 'admin'

export interface Corridor {
  id: CorridorId
  from: string
  to: string
  searchTerms: string[]
  currency: string
  trustScore: number
  dataReliability: number
  legalClarity: number
  transactionSecurity: number
  gstRate: number
  compliance: string[]
  authority: string
  protection: string
}

export interface TradeCosts {
  freight: Record<DeliveryTier, number>
  movers: Record<DeliveryTier, number>
}

export interface InvoiceTotals {
  subtotal: number
  freight: number
  movers: number
  insurance: number
  clearanceSupport: number
  platformMargin: number
  turnkeyServiceCharge: number
  gst: number
  escrowFee: number
  total: number
}

/** Product fields that price and describe a listing (shared by seed data and API). */
export interface ProductSeed {
  id: string
  sellerId: string
  corridorId: CorridorId
  productClass: ProductClass
  name: string
  category: string
  state: string
  origin: string
  imageUrl: string
  unit: string
  basePrice: number
  priceUpdatedAt: string
  procurementFrequency: string
  availableQty: string
  specs: string[]
  certifications: string[]
  decisionFactors: string[]
  note: string
}

export interface SellerSaleSeed {
  id: string
  sellerId: string
  productId: string
  buyerAlias: string
  soldAt: string
  lots: number
  quantityTons: number
  amount: number
  fulfilment: FulfilmentOption
  qualityStatus: QualityStatus
  disputeCount: number
}

export interface LogisticsPartnerSeed {
  id: string
  type: 'Warehouse' | 'Truck' | 'Container trailer' | 'Packing and movers' | 'Local delivery'
  legalName: string
  corridor: string
  baseRatePerTon: number
  distanceRatePerTonKm: number
  capacity: string
  status: 'Verified' | 'Review due'
  lastAudit: string
}
