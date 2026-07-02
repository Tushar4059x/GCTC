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

export interface TradeItem {
  id: string
  sellerId: string
  corridorId: CorridorId
  kind: 'product'
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

export interface SellerSale {
  id: string
  sellerId: string
  itemId: string
  buyerAlias: string
  soldAt: string
  lots: number
  quantityTons: number
  amount: number
  fulfilment: FulfilmentOption
  qualityStatus: QualityStatus
  disputeCount: number
}

export interface LogisticsPartner {
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

export interface PriceAuditEntry {
  id: string
  sellerId: string
  itemId: string
  previousPrice: number
  newPrice: number
  reason: string
  effectiveAt: string
}

export const corridors: Corridor[] = [
  {
    id: 'maharashtra-india',
    from: 'Ratnagiri, Maharashtra',
    to: 'Pan-India delivery',
    searchTerms: ['maharashtra', 'ratnagiri', 'mumbai', 'cashew', 'dry fruits'],
    currency: 'INR',
    trustScore: 88,
    dataReliability: 90,
    legalClarity: 92,
    transactionSecurity: 89,
    gstRate: 0.05,
    compliance: ['GST tax invoice', 'E-way bill for applicable movement', 'Batch quality report'],
    authority: 'GSTN + FSSAI + applicable state authorities',
    protection: 'GCTC quality verification and payment hold apply until dispatch evidence is approved.',
  },
  {
    id: 'andhra-pradesh-india',
    from: 'West Godavari, Andhra Pradesh',
    to: 'Pan-India delivery',
    searchTerms: ['andhra pradesh', 'west godavari', 'cocoa', 'food processing'],
    currency: 'INR',
    trustScore: 84,
    dataReliability: 86,
    legalClarity: 91,
    transactionSecurity: 87,
    gstRate: 0.05,
    compliance: ['GST tax invoice', 'E-way bill for applicable movement', 'Food batch test report'],
    authority: 'GSTN + FSSAI + Andhra Pradesh authorities',
    protection: 'GCTC verifies batch documents before seller settlement.',
  },
  {
    id: 'gujarat-india',
    from: 'Unjha, Gujarat',
    to: 'Pan-India delivery',
    searchTerms: ['gujarat', 'unjha', 'sesame', 'seeds', 'agri commodity'],
    currency: 'INR',
    trustScore: 91,
    dataReliability: 93,
    legalClarity: 92,
    transactionSecurity: 91,
    gstRate: 0.05,
    compliance: ['GST tax invoice', 'E-way bill for applicable movement', 'Purity and residue report'],
    authority: 'GSTN + FSSAI + Gujarat authorities',
    protection: 'Standard GCTC payment hold until quantity and dispatch proof are verified.',
  },
  {
    id: 'telangana-india',
    from: 'Nizamabad, Telangana',
    to: 'Pan-India delivery',
    searchTerms: ['telangana', 'nizamabad', 'turmeric', 'spices'],
    currency: 'INR',
    trustScore: 90,
    dataReliability: 92,
    legalClarity: 92,
    transactionSecurity: 90,
    gstRate: 0.05,
    compliance: ['GST tax invoice', 'E-way bill for applicable movement', 'Curcumin test report'],
    authority: 'GSTN + FSSAI + Telangana authorities',
    protection: 'GCTC validates quality and packing evidence before payment release.',
  },
  {
    id: 'rajasthan-india',
    from: 'Jodhpur, Rajasthan',
    to: 'Pan-India delivery',
    searchTerms: ['rajasthan', 'jodhpur', 'millet', 'bajra', 'grains'],
    currency: 'INR',
    trustScore: 87,
    dataReliability: 89,
    legalClarity: 92,
    transactionSecurity: 88,
    gstRate: 0.05,
    compliance: ['GST tax invoice', 'E-way bill for applicable movement', 'Moisture and grain quality report'],
    authority: 'GSTN + FSSAI + Rajasthan authorities',
    protection: 'GCTC records lot quality and delivery exceptions for seller scoring.',
  },
  {
    id: 'kerala-india',
    from: 'Idukki, Kerala',
    to: 'Pan-India delivery',
    searchTerms: ['kerala', 'idukki', 'cardamom', 'spices'],
    currency: 'INR',
    trustScore: 93,
    dataReliability: 94,
    legalClarity: 92,
    transactionSecurity: 93,
    gstRate: 0.05,
    compliance: ['GST tax invoice', 'E-way bill for applicable movement', 'Spice quality report'],
    authority: 'GSTN + FSSAI + Spices Board India',
    protection: 'Verified grade and dispatch weight are locked into the GCTC order record.',
  },
  {
    id: 'karnataka-india',
    from: 'Chikkamagaluru, Karnataka',
    to: 'Pan-India delivery',
    searchTerms: ['karnataka', 'chikkamagaluru', 'coffee', 'robusta', 'beans'],
    currency: 'INR',
    trustScore: 92,
    dataReliability: 93,
    legalClarity: 92,
    transactionSecurity: 92,
    gstRate: 0.05,
    compliance: ['GST tax invoice', 'E-way bill for applicable movement', 'Coffee grade and moisture report'],
    authority: 'GSTN + FSSAI + Coffee Board of India',
    protection: 'GCTC verifies grade, moisture, and dispatch evidence before settlement.',
  },
]

export const tradeItems: TradeItem[] = [
  {
    id: 'cashew-maharashtra',
    sellerId: 'seller-1',
    corridorId: 'maharashtra-india',
    kind: 'product',
    productClass: 'food',
    name: 'Premium cashew kernels W320',
    category: 'Dry fruits',
    state: 'Maharashtra',
    origin: 'Ratnagiri verified processor cluster',
    imageUrl: '/product-images/cashews.jpg',
    unit: '500 kg wholesale lot',
    basePrice: 462000,
    priceUpdatedAt: '2026-06-28',
    procurementFrequency: 'Monthly',
    availableQty: '9 lots available',
    specs: ['W320 grade', 'Vacuum-packed cartons', 'Kernel moisture below 5%'],
    certifications: ['FSSAI licence verified', 'Batch quality report', 'GCTC supplier verification'],
    decisionFactors: ['Consistent wholesale grade', 'Retail-ready packing', 'Pan-India delivery available'],
    note: 'Seller identity is protected. Buyers see verified origin, quality, availability, and the current GCTC offer.',
  },
  {
    id: 'cocoa-andhra',
    sellerId: 'seller-1',
    corridorId: 'andhra-pradesh-india',
    kind: 'product',
    productClass: 'food',
    name: 'Natural cocoa powder',
    category: 'Food ingredients',
    state: 'Andhra Pradesh',
    origin: 'West Godavari processing cluster',
    imageUrl: '/product-images/cocoa.jpg',
    unit: '1,000 kg wholesale lot',
    basePrice: 318000,
    priceUpdatedAt: '2026-06-24',
    procurementFrequency: 'Fortnightly',
    availableQty: '6 lots available',
    specs: ['10-12% fat', 'Fine mesh powder', 'Food-grade paper sacks with liner'],
    certifications: ['FSSAI licence verified', 'Batch COA', 'Food safety declaration'],
    decisionFactors: ['Suitable for bakeries and beverages', 'Stable repeat supply', 'Inspection report available'],
    note: 'Suitable for bakeries, beverage mixes, institutional buyers, and private-label food production.',
  },
  {
    id: 'sesame-gujarat',
    sellerId: 'seller-1',
    corridorId: 'gujarat-india',
    kind: 'product',
    productClass: 'plant',
    name: 'Hulled sesame seeds',
    category: 'Seeds and grains',
    state: 'Gujarat',
    origin: 'Unjha aggregation and processing cluster',
    imageUrl: '/product-images/sesame.jpg',
    unit: '2,000 kg wholesale lot',
    basePrice: 286000,
    priceUpdatedAt: '2026-06-25',
    procurementFrequency: 'Monthly',
    availableQty: '7 lots available',
    specs: ['99.95% purity', 'Hulled white sesame', '25 kg food-grade bags'],
    certifications: ['FSSAI licence verified', 'Aflatoxin test', 'Purity report'],
    decisionFactors: ['Bulk supply available', 'Quality screened before dispatch', 'Oil and bakery grade'],
    note: 'A verified bulk sesame listing for food processors, oil mills, bakeries, and institutional buyers.',
  },
  {
    id: 'turmeric-telangana',
    sellerId: 'seller-2',
    corridorId: 'telangana-india',
    kind: 'product',
    productClass: 'food',
    name: 'Single-origin turmeric powder',
    category: 'Spices',
    state: 'Telangana',
    origin: 'Nizamabad spice processing cluster',
    imageUrl: '/product-images/turmeric.jpg',
    unit: '500 kg wholesale lot',
    basePrice: 185000,
    priceUpdatedAt: '2026-06-27',
    procurementFrequency: 'Weekly',
    availableQty: '8 lots this week',
    specs: ['Curcumin 4.8%', 'Moisture below 8%', 'Food-grade laminated bulk packs'],
    certifications: ['FSSAI licence verified', 'ISO 22000', 'Lab-tested batch COA'],
    decisionFactors: ['High curcumin density', 'Stable weekly supply', 'Traceable state origin'],
    note: 'A lab-tested wholesale spice listing for food manufacturers, distributors, and retailers.',
  },
  {
    id: 'millet-rajasthan',
    sellerId: 'seller-2',
    corridorId: 'rajasthan-india',
    kind: 'product',
    productClass: 'plant',
    name: 'Pearl millet grain',
    category: 'Grains',
    state: 'Rajasthan',
    origin: 'Jodhpur farmer aggregation cluster',
    imageUrl: '/product-images/millet.jpg',
    unit: '2,000 kg wholesale lot',
    basePrice: 142000,
    priceUpdatedAt: '2026-06-21',
    procurementFrequency: 'Weekly',
    availableQty: '12 lots this week',
    specs: ['Machine-cleaned grain', 'Moisture below 12%', '50 kg food-grade bags'],
    certifications: ['FSSAI licence verified', 'Moisture report', 'GCTC lot inspection'],
    decisionFactors: ['Reliable bulk availability', 'Food-processing grade', 'Competitive interstate supply'],
    note: 'Bulk pearl millet for food processors, flour mills, institutional kitchens, and distributors.',
  },
  {
    id: 'cardamom-kerala',
    sellerId: 'seller-3',
    corridorId: 'kerala-india',
    kind: 'product',
    productClass: 'plant',
    name: 'Premium green cardamom',
    category: 'Spices',
    state: 'Kerala',
    origin: 'Idukki verified grower aggregation',
    imageUrl: '/product-images/cardamom.jpg',
    unit: '120 kg wholesale lot',
    basePrice: 336000,
    priceUpdatedAt: '2026-06-26',
    procurementFrequency: 'Fortnightly',
    availableQty: '5 lots this week',
    specs: ['7-8 mm bold grade', 'Low split percentage', 'Moisture-controlled cartons'],
    certifications: ['Spices Board registration', 'FSSAI licence verified', 'Residue test report'],
    decisionFactors: ['Premium aroma retention', 'Strong quality traceability', 'Verified Idukki origin'],
    note: 'Premium spice lots with verified grade, state origin, and quality documents.',
  },
  {
    id: 'coffee-karnataka',
    sellerId: 'seller-4',
    corridorId: 'karnataka-india',
    kind: 'product',
    productClass: 'plant',
    name: 'Robusta coffee beans',
    category: 'Coffee',
    state: 'Karnataka',
    origin: 'Chikkamagaluru coffee grower cluster',
    imageUrl: '/product-images/coffee.jpg',
    unit: '2,000 kg wholesale lot',
    basePrice: 408000,
    priceUpdatedAt: '2026-06-23',
    procurementFrequency: 'Monthly',
    availableQty: '4 lots this week',
    specs: ['Screen 16', 'Moisture 11-12%', 'Jute bags with food-grade liner'],
    certifications: ['Coffee Board registration', 'Quality inspection report', 'GCTC supplier verification'],
    decisionFactors: ['Consistent blending grade', 'Scalable domestic supply', 'Traceable Karnataka origin'],
    note: 'Reliable bulk coffee input for roasters, beverage manufacturers, and institutional buyers.',
  },
]

export const tradeCosts: Record<CorridorId, TradeCosts> = {
  'maharashtra-india': { freight: { normal: 28000, urgent: 44000 }, movers: { normal: 9000, urgent: 15000 } },
  'andhra-pradesh-india': { freight: { normal: 36000, urgent: 54000 }, movers: { normal: 11000, urgent: 18000 } },
  'gujarat-india': { freight: { normal: 32000, urgent: 49000 }, movers: { normal: 10000, urgent: 17000 } },
  'telangana-india': { freight: { normal: 30000, urgent: 47000 }, movers: { normal: 9000, urgent: 16000 } },
  'rajasthan-india': { freight: { normal: 34000, urgent: 52000 }, movers: { normal: 11000, urgent: 18000 } },
  'kerala-india': { freight: { normal: 39000, urgent: 59000 }, movers: { normal: 12000, urgent: 20000 } },
  'karnataka-india': { freight: { normal: 35000, urgent: 54000 }, movers: { normal: 11000, urgent: 19000 } },
}

export const platformMarginRate = 0.035
export const escrowFeeRate = 0.008
export const turnkeyServiceRate = 0.045
export const insuranceRate = 0.004

export const commonIndiaTradeDocuments = [
  'Purchase order',
  'GST tax invoice',
  'Packing list',
  'E-way bill where applicable',
  'Quality / test report',
  'Insurance certificate for GCTC delivery',
]

export const productClassDocuments: Record<ProductClass, string[]> = {
  food: ['FSSAI licence verification', 'Batch health / safety report'],
  plant: ['FSSAI licence verification', 'Commodity quality report'],
}

export const sellerSales: SellerSale[] = [
  {
    id: 'SALE-2048',
    sellerId: 'seller-1',
    itemId: 'cashew-maharashtra',
    buyerAlias: 'Buyer account DL-184',
    soldAt: '2026-06-24',
    lots: 3,
    quantityTons: 1.5,
    amount: 1386000,
    fulfilment: 'turnkey',
    qualityStatus: 'passed',
    disputeCount: 0,
  },
  {
    id: 'SALE-2036',
    sellerId: 'seller-1',
    itemId: 'cocoa-andhra',
    buyerAlias: 'Buyer account MH-092',
    soldAt: '2026-06-17',
    lots: 2,
    quantityTons: 2,
    amount: 636000,
    fulfilment: 'sourcing-only',
    qualityStatus: 'passed',
    disputeCount: 0,
  },
  {
    id: 'SALE-2019',
    sellerId: 'seller-1',
    itemId: 'sesame-gujarat',
    buyerAlias: 'Buyer account KA-241',
    soldAt: '2026-06-05',
    lots: 1,
    quantityTons: 2,
    amount: 286000,
    fulfilment: 'turnkey',
    qualityStatus: 'review',
    disputeCount: 1,
  },
  {
    id: 'SALE-1998',
    sellerId: 'seller-2',
    itemId: 'turmeric-telangana',
    buyerAlias: 'Buyer account TN-033',
    soldAt: '2026-05-28',
    lots: 4,
    quantityTons: 2,
    amount: 740000,
    fulfilment: 'turnkey',
    qualityStatus: 'passed',
    disputeCount: 0,
  },
]

export const logisticsPartners: LogisticsPartner[] = [
  {
    id: 'LOG-WH-014',
    type: 'Warehouse',
    legalName: 'Harbourline Storage Private Limited',
    corridor: 'Mumbai, Maharashtra',
    baseRatePerTon: 1450,
    distanceRatePerTonKm: 0,
    capacity: '2,400 tons',
    status: 'Verified',
    lastAudit: '2026-05-12',
  },
  {
    id: 'LOG-TR-027',
    type: 'Truck',
    legalName: 'Western Freight Carriers',
    corridor: 'Maharashtra, Gujarat, and Rajasthan',
    baseRatePerTon: 900,
    distanceRatePerTonKm: 4.2,
    capacity: '18 trucks',
    status: 'Verified',
    lastAudit: '2026-04-22',
  },
  {
    id: 'LOG-CT-009',
    type: 'Container trailer',
    legalName: 'Interstate Trailer Services',
    corridor: 'West and South India',
    baseRatePerTon: 1250,
    distanceRatePerTonKm: 5.1,
    capacity: '12 trailers',
    status: 'Review due',
    lastAudit: '2025-12-18',
  },
  {
    id: 'LOG-PM-031',
    type: 'Packing and movers',
    legalName: 'CargoCare Handling LLP',
    corridor: 'Pan India',
    baseRatePerTon: 2200,
    distanceRatePerTonKm: 1.3,
    capacity: '32 crews',
    status: 'Verified',
    lastAudit: '2026-05-30',
  },
  {
    id: 'LOG-LD-044',
    type: 'Local delivery',
    legalName: 'CityDock Delivery Network',
    corridor: 'Delhi NCR, Mumbai MMR, Bengaluru, and Chennai',
    baseRatePerTon: 700,
    distanceRatePerTonKm: 3.8,
    capacity: 'Same-day under 8 tons',
    status: 'Verified',
    lastAudit: '2026-06-03',
  },
]

export function calculateInvoice(
  corridor: Corridor,
  item: TradeItem,
  freightTier: DeliveryTier,
  moverTier: DeliveryTier,
  fulfilment: FulfilmentOption = 'turnkey',
): InvoiceTotals {
  const costs = tradeCosts[corridor.id]
  const subtotal = item.basePrice
  const freight = fulfilment === 'turnkey' ? costs.freight[freightTier] : 0
  const movers = fulfilment === 'turnkey' ? costs.movers[moverTier] : 0
  const insurance = fulfilment === 'turnkey' ? subtotal * insuranceRate : 0
  const clearanceSupport = fulfilment === 'turnkey' ? 8500 : 0
  const taxableBase = subtotal + freight + movers
  const platformMargin = taxableBase * platformMarginRate
  const turnkeyServiceCharge = fulfilment === 'turnkey'
    ? (freight + movers + insurance + clearanceSupport) * turnkeyServiceRate
    : 0
  const gst = (platformMargin + turnkeyServiceCharge) * corridor.gstRate
  const escrowFee = corridor.trustScore < 88 ? taxableBase * escrowFeeRate : 0
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

export function formatMoney(value: number, currency = 'INR') {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(value)
}
