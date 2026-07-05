import type {
  DeliveryTier,
  FulfilmentOption,
  InvoiceTotals,
  ProductClass,
  QualityStatus,
  Role,
} from './types.ts'

/** Buyer-facing listing. Deliberately excludes seller identity fields. */
export interface CatalogueItemDTO {
  id: string
  corridorId: string
  productClass: ProductClass
  name: string
  category: string
  state: string
  origin: string
  imageUrl: string
  unit: string
  basePrice: number
  priceVersion: number
  priceUpdatedAt: string
  procurementFrequency: string
  availableQty: string
  specs: string[]
  certifications: string[]
  decisionFactors: string[]
  note: string
  /** Server-computed delivered price for the default turnkey/normal configuration. */
  deliveredPrice: number
  currency: string
}

export interface SessionUserDTO {
  id: string
  name: string
  email: string
  role: Role
  organization: string
}

export interface QuoteDTO {
  id: string
  productId: string
  productName: string
  lots: number
  freightTier: DeliveryTier
  moverTier: DeliveryTier
  fulfilment: FulfilmentOption
  currency: string
  totals: InvoiceTotals
  rulePackVersion: number
  priceVersion: number
  expiresAt: string
}

export interface OrderDTO {
  id: string
  productId: string
  productName: string
  imageUrl: string
  corridorLabel: string
  lots: number
  fulfilment: FulfilmentOption
  totals: InvoiceTotals
  totalAmount: number
  currency: string
  status: string
  paymentStatus: string
  protection: string
  buyerLabel: string
  createdAt: string
}

/** Seller view of an owned product (includes pricing controls). */
export interface SellerProductDTO extends CatalogueItemDTO {
  sellerId: string
}

export interface PriceRevisionDTO {
  id: string
  productId: string
  productName: string
  previousPrice: number
  newPrice: number
  reason: string
  effectiveAt: string
}

export interface SellerSaleDTO {
  id: string
  productId: string
  productName: string
  buyerAlias: string
  soldAt: string
  lots: number
  quantityTons: number
  amount: number
  fulfilment: FulfilmentOption
  qualityStatus: QualityStatus
  disputeCount: number
}

export interface AdminSaleExceptionDTO extends SellerSaleDTO {
  sellerId: string
}

export interface LogisticsPartnerDTO {
  id: string
  type: string
  legalName: string
  corridor: string
  baseRatePerTon: number
  distanceRatePerTonKm: number
  capacity: string
  status: string
  lastAudit: string
}

export interface ApiErrorBody {
  statusCode: number
  error: string
  message: string
}
