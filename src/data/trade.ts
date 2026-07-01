export type CorridorId = 'west-africa-india' | 'india-singapore' | 'india-uae' | 'vietnam-india'
export type DeliveryTier = 'normal' | 'urgent'
export type PaymentStatus = 'draft' | 'escrow-required' | 'ready' | 'secured'
export type FulfilmentOption = 'sourcing-only' | 'turnkey'
export type ProductClass = 'food' | 'marine' | 'plant' | 'animal' | 'service'
export type QualityStatus = 'passed' | 'review' | 'rejected'

export interface Corridor {
  id: CorridorId
  from: string
  to: string
  searchTerms: string[]
  currency: string
  fxToInr: number
  trustScore: number
  dataReliability: number
  legalClarity: number
  transactionSecurity: number
  dutyRate: number
  vatRate: number
  gstRate: number
  compliance: string[]
  authority: string
  protection: string
}

export interface TradeItem {
  id: string
  sellerId: string
  corridorId: CorridorId
  kind: 'product' | 'service'
  productClass: ProductClass
  name: string
  category: string
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
  duty: number
  vat: number
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
    id: 'west-africa-india',
    from: 'West Africa supplier network',
    to: 'Mumbai, India',
    searchTerms: ['africa', 'ghana', 'tanzania', 'ivory coast', 'cashews', 'cocoa', 'dry fruits', 'mumbai'],
    currency: 'INR',
    fxToInr: 1,
    trustScore: 74,
    dataReliability: 72,
    legalClarity: 76,
    transactionSecurity: 75,
    dutyRate: 0.12,
    vatRate: 0,
    gstRate: 0.05,
    compliance: [
      'Certificate of origin',
      'Phytosanitary certificate',
      'FSSAI import clearance',
      'Bill of entry',
      'Commercial invoice and packing list',
    ],
    authority: 'Exporter customs authority + CBIC India + FSSAI',
    protection: 'Escrow and enhanced document verification required before supplier settlement.',
  },
  {
    id: 'india-singapore',
    from: 'Coimbatore, India',
    to: 'Singapore',
    searchTerms: ['singapore', 'asean', 'india', 'coimbatore', 'food export'],
    currency: 'INR',
    fxToInr: 1,
    trustScore: 92,
    dataReliability: 95,
    legalClarity: 91,
    transactionSecurity: 90,
    dutyRate: 0.04,
    vatRate: 0.09,
    gstRate: 0,
    compliance: [
      'FSSAI export batch certificate',
      'Certificate of origin',
      'Singapore Food Agency importer declaration',
      'Commercial invoice and packing list',
    ],
    authority: 'DGFT India + Singapore Food Agency',
    protection: 'Standard platform payment hold until dispatch proof is verified.',
  },
  {
    id: 'india-uae',
    from: 'Mysuru, India',
    to: 'Dubai, UAE',
    searchTerms: ['uae', 'dubai', 'gcc', 'mysuru', 'spices'],
    currency: 'INR',
    fxToInr: 1,
    trustScore: 86,
    dataReliability: 88,
    legalClarity: 84,
    transactionSecurity: 86,
    dutyRate: 0.05,
    vatRate: 0.05,
    gstRate: 0,
    compliance: [
      'Halal suitability statement where applicable',
      'Certificate of origin',
      'UAE customs import declaration',
      'Commercial invoice and packing list',
    ],
    authority: 'DGFT India + UAE Federal Customs Authority',
    protection: 'Escrow optional for repeat verified buyers; recommended for first order.',
  },
  {
    id: 'vietnam-india',
    from: 'Ho Chi Minh City, Vietnam',
    to: 'Chennai, India',
    searchTerms: ['vietnam', 'india import', 'chennai', 'coffee', 'asean'],
    currency: 'INR',
    fxToInr: 1,
    trustScore: 78,
    dataReliability: 80,
    legalClarity: 76,
    transactionSecurity: 79,
    dutyRate: 0.1,
    vatRate: 0,
    gstRate: 0.12,
    compliance: [
      'Bill of entry',
      'Plant quarantine clearance where applicable',
      'FSSAI import clearance',
      'Commercial invoice and packing list',
    ],
    authority: 'Vietnam Customs + CBIC India + FSSAI',
    protection: 'Escrow and enhanced document verification required.',
  },
]

export const tradeItems: TradeItem[] = [
  {
    id: 'cashew-africa',
    sellerId: 'seller-1',
    corridorId: 'west-africa-india',
    kind: 'product',
    productClass: 'plant',
    name: 'Cashew kernels W320',
    category: 'Dry fruits and edible commodities',
    origin: 'West Africa verified supplier cluster',
    imageUrl: '/product-images/cashews.jpg',
    unit: '500 kg import lot',
    basePrice: 462000,
    priceUpdatedAt: '2026-06-28',
    procurementFrequency: 'Monthly',
    availableQty: '9 lots available',
    specs: ['W320 grade', 'Vacuum-packed cartons', 'Kernel moisture below 5%'],
    certifications: ['Phytosanitary certificate', 'Origin certificate', 'Third-party inspection'],
    decisionFactors: ['Competitive landed cost', 'Retail-ready grade', 'Platform-managed import paperwork'],
    note: 'Seller identity is protected. Buyer sees origin, quality, price, and documents through GCTC only.',
  },
  {
    id: 'cocoa-africa',
    sellerId: 'seller-1',
    corridorId: 'west-africa-india',
    kind: 'product',
    productClass: 'food',
    name: 'Natural cocoa powder',
    category: 'Food and everyday consumables',
    origin: 'Ghana cocoa processing cluster',
    imageUrl: '/product-images/cocoa.jpg',
    unit: '1,000 kg import lot',
    basePrice: 318000,
    priceUpdatedAt: '2026-06-24',
    procurementFrequency: 'Fortnightly',
    availableQty: '6 lots available',
    specs: ['10-12% fat', 'Fine mesh powder', 'Food-grade paper sacks with liner'],
    certifications: ['Food safety declaration', 'Origin certificate', 'Batch COA'],
    decisionFactors: ['Strong confectionery demand', 'Stable repeat supply', 'Inspection report available'],
    note: 'USP: suitable for bakeries, beverage mixes, and FMCG private-label production.',
  },
  {
    id: 'sesame-africa',
    sellerId: 'seller-1',
    corridorId: 'west-africa-india',
    kind: 'product',
    productClass: 'plant',
    name: 'Hulled sesame seeds',
    category: 'Food and everyday consumables',
    origin: 'East Africa aggregation cluster',
    imageUrl: '/product-images/sesame.jpg',
    unit: '2,000 kg import lot',
    basePrice: 286000,
    priceUpdatedAt: '2026-06-25',
    procurementFrequency: 'Monthly',
    availableQty: '7 lots available',
    specs: ['99.95% purity', 'Hulled white sesame', '25 kg export bags'],
    certifications: ['Phytosanitary certificate', 'Aflatoxin test', 'Origin certificate'],
    decisionFactors: ['Good oil and bakery demand', 'Bulk supply available', 'Quality screened before dispatch'],
    note: 'Biological benefit: common ingredient for protein-rich foods and bakery toppings.',
  },
  {
    id: 'turmeric-singapore',
    sellerId: 'seller-2',
    corridorId: 'india-singapore',
    kind: 'product',
    productClass: 'food',
    name: 'Single-origin turmeric powder',
    category: 'Food and everyday consumables',
    origin: 'Coimbatore food cluster',
    imageUrl: '/product-images/turmeric.jpg',
    unit: '500 kg export lot',
    basePrice: 185000,
    priceUpdatedAt: '2026-06-27',
    procurementFrequency: 'Weekly',
    availableQty: '8 lots this week',
    specs: ['Curcumin 4.8%', 'Moisture below 8%', 'Food-grade laminated bulk packs'],
    certifications: ['FSSAI', 'ISO 22000', 'Lab-tested batch COA'],
    decisionFactors: ['High curcumin density', 'Stable weekly supply', 'ASEAN-ready documentation'],
    note: 'Biological benefit: used as an anti-inflammatory ingredient in everyday cooking.',
  },
  {
    id: 'millet-singapore',
    sellerId: 'seller-2',
    corridorId: 'india-singapore',
    kind: 'product',
    productClass: 'food',
    name: 'Ready-to-cook millet mix',
    category: 'Food and everyday consumables',
    origin: 'Erode and Salem clusters',
    imageUrl: '/product-images/millet.jpg',
    unit: '1,000 retail pouches',
    basePrice: 142000,
    priceUpdatedAt: '2026-06-21',
    procurementFrequency: 'Weekly',
    availableQty: '12 lots this week',
    specs: ['Multi-millet blend', '9-month shelf life', 'Private-label packaging ready'],
    certifications: ['FSSAI', 'NABL nutrition panel'],
    decisionFactors: ['Good margins for ethnic retail', 'Low breakage logistics', 'Recurring weekly demand'],
    note: 'Health benefit: high-fiber alternative for breakfast and convenience meals.',
  },
  {
    id: 'cardamom-uae',
    sellerId: 'seller-3',
    corridorId: 'india-uae',
    kind: 'product',
    productClass: 'plant',
    name: 'Premium green cardamom',
    category: 'Food and everyday consumables',
    origin: 'Mysuru and Idukki aggregation',
    imageUrl: '/product-images/cardamom.jpg',
    unit: '120 kg carton lot',
    basePrice: 336000,
    priceUpdatedAt: '2026-06-26',
    procurementFrequency: 'Fortnightly',
    availableQty: '5 lots this week',
    specs: ['7-8 mm bold grade', 'Low split percentage', 'Moisture controlled cartons'],
    certifications: ['Spice Board India', 'FSSAI', 'Residue test report'],
    decisionFactors: ['Premium aroma retention', 'High demand in GCC retail', 'Strong quality traceability'],
    note: 'Biological benefit: used in digestive beverages and daily food preparations.',
  },
  {
    id: 'coffee-india',
    sellerId: 'seller-4',
    corridorId: 'vietnam-india',
    kind: 'product',
    productClass: 'plant',
    name: 'Robusta coffee beans',
    category: 'Food and everyday consumables',
    origin: 'Vietnamese coffee cooperative cluster',
    imageUrl: '/product-images/coffee.jpg',
    unit: '2,000 kg import lot',
    basePrice: 408000,
    priceUpdatedAt: '2026-06-23',
    procurementFrequency: 'Monthly',
    availableQty: '4 lots this week',
    specs: ['Screen 16', 'Moisture 11-12%', 'Jute bags with liner'],
    certifications: ['Phytosanitary certificate', 'Origin certificate', 'Quality inspection report'],
    decisionFactors: ['Competitive landed price', 'Blending-grade consistency', 'Scalable import corridor'],
    note: 'USP: reliable base coffee input for Indian roasters and FMCG blends.',
  },
  {
    id: 'packaging-service',
    sellerId: 'gctc-services',
    corridorId: 'india-singapore',
    kind: 'service',
    productClass: 'service',
    name: 'Export packaging compliance support',
    category: 'Business support service',
    origin: 'Platform verified service bench',
    imageUrl: '/product-images/packaging.jpg',
    unit: 'Per shipment',
    basePrice: 24000,
    priceUpdatedAt: '2026-06-01',
    procurementFrequency: 'On demand',
    availableQty: 'On-demand',
    specs: ['Label review', 'Shelf-life and batch coding check', 'Retail carton specification'],
    certifications: ['Platform verified', 'Export packaging specialist'],
    decisionFactors: ['Reduces customs hold risk', 'Improves retail acceptance', 'No external vendor leakage'],
    note: 'Scope: packaging audit and production-ready compliance checklist.',
  },
  {
    id: 'quality-service',
    sellerId: 'gctc-services',
    corridorId: 'west-africa-india',
    kind: 'service',
    productClass: 'service',
    name: 'Pre-shipment quality inspection',
    category: 'Business support service',
    origin: 'GCTC verified inspection desk',
    imageUrl: '/product-images/inspection.jpg',
    unit: 'Per shipment',
    basePrice: 38000,
    priceUpdatedAt: '2026-06-01',
    procurementFrequency: 'On demand',
    availableQty: 'On-demand',
    specs: ['Sampling protocol', 'Photo evidence', 'Dispatch approval checklist'],
    certifications: ['Platform verified', 'Third-party inspection partner'],
    decisionFactors: ['Protects buyer before payment release', 'Reduces quality disputes', 'Keeps seller details private'],
    note: 'Scope: buyer-facing inspection result without exposing the supplier contact trail.',
  },
]

export const tradeCosts: Record<CorridorId, TradeCosts> = {
  'west-africa-india': {
    freight: { normal: 84000, urgent: 132000 },
    movers: { normal: 18000, urgent: 32000 },
  },
  'india-singapore': {
    freight: { normal: 32000, urgent: 56000 },
    movers: { normal: 9000, urgent: 16000 },
  },
  'india-uae': {
    freight: { normal: 42000, urgent: 71000 },
    movers: { normal: 12000, urgent: 21000 },
  },
  'vietnam-india': {
    freight: { normal: 68000, urgent: 104000 },
    movers: { normal: 15000, urgent: 27000 },
  },
}

export const platformMarginRate = 0.035
export const escrowFeeRate = 0.012
export const turnkeyServiceRate = 0.045
export const insuranceRate = 0.006

export const commonIndiaImportDocuments = [
  'Purchase order',
  'Commercial invoice',
  'Packing list',
  'Bill of lading',
  'Certificate of origin',
  'Test reports / certificate of inspection',
  'Insurance certificate',
]

export const productClassDocuments: Record<ProductClass, string[]> = {
  food: ['FSSAI import approval', 'Health / sanitary certificate'],
  marine: ['EIA inspection approval', 'Health certificate'],
  plant: ['Phytosanitary certificate', 'Plant quarantine clearance'],
  animal: ['Veterinary / animal health certificate'],
  service: [],
}

export const sellerSales: SellerSale[] = [
  {
    id: 'SALE-2048',
    sellerId: 'seller-1',
    itemId: 'cashew-africa',
    buyerAlias: 'Buyer account IN-184',
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
    itemId: 'cocoa-africa',
    buyerAlias: 'Buyer account IN-092',
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
    itemId: 'sesame-africa',
    buyerAlias: 'Buyer account IN-241',
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
    itemId: 'turmeric-singapore',
    buyerAlias: 'Buyer account SG-033',
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
    corridor: 'Mumbai and Nhava Sheva',
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
    corridor: 'Maharashtra and Gujarat',
    baseRatePerTon: 900,
    distanceRatePerTonKm: 4.2,
    capacity: '18 trucks',
    status: 'Verified',
    lastAudit: '2026-04-22',
  },
  {
    id: 'LOG-CT-009',
    type: 'Container trailer',
    legalName: 'Portspan Trailer Services',
    corridor: 'JNPT to western India',
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
    corridor: 'Mumbai MMR',
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
  const clearanceSupport = fulfilment === 'turnkey' ? 18500 : 0
  const taxableBase = subtotal + freight + movers
  const platformMargin = taxableBase * platformMarginRate
  const turnkeyServiceCharge = fulfilment === 'turnkey'
    ? (freight + movers + insurance + clearanceSupport) * turnkeyServiceRate
    : 0
  const duty = fulfilment === 'turnkey' ? subtotal * corridor.dutyRate : 0
  const vat = fulfilment === 'turnkey' ? (taxableBase + duty) * corridor.vatRate : 0
  const gstBase = fulfilment === 'turnkey' ? taxableBase + duty + platformMargin : platformMargin
  const gst = gstBase * corridor.gstRate
  const escrowFee = corridor.trustScore < 80 ? taxableBase * escrowFeeRate : 0
  const total = taxableBase + insurance + clearanceSupport + platformMargin + turnkeyServiceCharge + duty + vat + gst + escrowFee

  return {
    subtotal,
    freight,
    movers,
    insurance,
    clearanceSupport,
    platformMargin,
    turnkeyServiceCharge,
    gst,
    duty,
    vat,
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
