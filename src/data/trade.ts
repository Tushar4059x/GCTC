export type CorridorId = 'west-africa-india' | 'india-singapore' | 'india-uae' | 'vietnam-india'
export type DeliveryTier = 'normal' | 'urgent'
export type PaymentStatus = 'draft' | 'escrow-required' | 'ready' | 'secured'

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
  corridorId: CorridorId
  kind: 'product' | 'service'
  name: string
  category: string
  origin: string
  imageUrl: string
  unit: string
  basePrice: number
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
  platformMargin: number
  gst: number
  duty: number
  vat: number
  escrowFee: number
  total: number
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
    corridorId: 'west-africa-india',
    kind: 'product',
    name: 'Cashew kernels W320',
    category: 'Dry fruits and edible commodities',
    origin: 'West Africa verified supplier cluster',
    imageUrl: '/product-images/cashews.jpg',
    unit: '500 kg import lot',
    basePrice: 462000,
    availableQty: '9 lots available',
    specs: ['W320 grade', 'Vacuum-packed cartons', 'Kernel moisture below 5%'],
    certifications: ['Phytosanitary certificate', 'Origin certificate', 'Third-party inspection'],
    decisionFactors: ['Competitive landed cost', 'Retail-ready grade', 'Platform-managed import paperwork'],
    note: 'Seller identity is protected. Buyer sees origin, quality, price, and documents through GCTC only.',
  },
  {
    id: 'cocoa-africa',
    corridorId: 'west-africa-india',
    kind: 'product',
    name: 'Natural cocoa powder',
    category: 'Food and everyday consumables',
    origin: 'Ghana cocoa processing cluster',
    imageUrl: '/product-images/cocoa.jpg',
    unit: '1,000 kg import lot',
    basePrice: 318000,
    availableQty: '6 lots available',
    specs: ['10-12% fat', 'Fine mesh powder', 'Food-grade paper sacks with liner'],
    certifications: ['Food safety declaration', 'Origin certificate', 'Batch COA'],
    decisionFactors: ['Strong confectionery demand', 'Stable repeat supply', 'Inspection report available'],
    note: 'USP: suitable for bakeries, beverage mixes, and FMCG private-label production.',
  },
  {
    id: 'sesame-africa',
    corridorId: 'west-africa-india',
    kind: 'product',
    name: 'Hulled sesame seeds',
    category: 'Food and everyday consumables',
    origin: 'East Africa aggregation cluster',
    imageUrl: '/product-images/sesame.jpg',
    unit: '2,000 kg import lot',
    basePrice: 286000,
    availableQty: '7 lots available',
    specs: ['99.95% purity', 'Hulled white sesame', '25 kg export bags'],
    certifications: ['Phytosanitary certificate', 'Aflatoxin test', 'Origin certificate'],
    decisionFactors: ['Good oil and bakery demand', 'Bulk supply available', 'Quality screened before dispatch'],
    note: 'Biological benefit: common ingredient for protein-rich foods and bakery toppings.',
  },
  {
    id: 'turmeric-singapore',
    corridorId: 'india-singapore',
    kind: 'product',
    name: 'Single-origin turmeric powder',
    category: 'Food and everyday consumables',
    origin: 'Coimbatore food cluster',
    imageUrl: '/product-images/turmeric.jpg',
    unit: '500 kg export lot',
    basePrice: 185000,
    availableQty: '8 lots this week',
    specs: ['Curcumin 4.8%', 'Moisture below 8%', 'Food-grade laminated bulk packs'],
    certifications: ['FSSAI', 'ISO 22000', 'Lab-tested batch COA'],
    decisionFactors: ['High curcumin density', 'Stable weekly supply', 'ASEAN-ready documentation'],
    note: 'Biological benefit: used as an anti-inflammatory ingredient in everyday cooking.',
  },
  {
    id: 'millet-singapore',
    corridorId: 'india-singapore',
    kind: 'product',
    name: 'Ready-to-cook millet mix',
    category: 'Food and everyday consumables',
    origin: 'Erode and Salem clusters',
    imageUrl: '/product-images/millet.jpg',
    unit: '1,000 retail pouches',
    basePrice: 142000,
    availableQty: '12 lots this week',
    specs: ['Multi-millet blend', '9-month shelf life', 'Private-label packaging ready'],
    certifications: ['FSSAI', 'NABL nutrition panel'],
    decisionFactors: ['Good margins for ethnic retail', 'Low breakage logistics', 'Recurring weekly demand'],
    note: 'Health benefit: high-fiber alternative for breakfast and convenience meals.',
  },
  {
    id: 'cardamom-uae',
    corridorId: 'india-uae',
    kind: 'product',
    name: 'Premium green cardamom',
    category: 'Food and everyday consumables',
    origin: 'Mysuru and Idukki aggregation',
    imageUrl: '/product-images/cardamom.jpg',
    unit: '120 kg carton lot',
    basePrice: 336000,
    availableQty: '5 lots this week',
    specs: ['7-8 mm bold grade', 'Low split percentage', 'Moisture controlled cartons'],
    certifications: ['Spice Board India', 'FSSAI', 'Residue test report'],
    decisionFactors: ['Premium aroma retention', 'High demand in GCC retail', 'Strong quality traceability'],
    note: 'Biological benefit: used in digestive beverages and daily food preparations.',
  },
  {
    id: 'coffee-india',
    corridorId: 'vietnam-india',
    kind: 'product',
    name: 'Robusta coffee beans',
    category: 'Food and everyday consumables',
    origin: 'Vietnamese coffee cooperative cluster',
    imageUrl: '/product-images/coffee.jpg',
    unit: '2,000 kg import lot',
    basePrice: 408000,
    availableQty: '4 lots this week',
    specs: ['Screen 16', 'Moisture 11-12%', 'Jute bags with liner'],
    certifications: ['Phytosanitary certificate', 'Origin certificate', 'Quality inspection report'],
    decisionFactors: ['Competitive landed price', 'Blending-grade consistency', 'Scalable import corridor'],
    note: 'USP: reliable base coffee input for Indian roasters and FMCG blends.',
  },
  {
    id: 'packaging-service',
    corridorId: 'india-singapore',
    kind: 'service',
    name: 'Export packaging compliance support',
    category: 'Business support service',
    origin: 'Platform verified service bench',
    imageUrl: '/product-images/packaging.jpg',
    unit: 'Per shipment',
    basePrice: 24000,
    availableQty: 'On-demand',
    specs: ['Label review', 'Shelf-life and batch coding check', 'Retail carton specification'],
    certifications: ['Platform verified', 'Export packaging specialist'],
    decisionFactors: ['Reduces customs hold risk', 'Improves retail acceptance', 'No external vendor leakage'],
    note: 'Scope: packaging audit and production-ready compliance checklist.',
  },
  {
    id: 'quality-service',
    corridorId: 'west-africa-india',
    kind: 'service',
    name: 'Pre-shipment quality inspection',
    category: 'Business support service',
    origin: 'GCTC verified inspection desk',
    imageUrl: '/product-images/inspection.jpg',
    unit: 'Per shipment',
    basePrice: 38000,
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

export function calculateInvoice(
  corridor: Corridor,
  item: TradeItem,
  freightTier: DeliveryTier,
  moverTier: DeliveryTier,
): InvoiceTotals {
  const costs = tradeCosts[corridor.id]
  const subtotal = item.basePrice
  const freight = costs.freight[freightTier]
  const movers = costs.movers[moverTier]
  const taxableBase = subtotal + freight + movers
  const platformMargin = taxableBase * platformMarginRate
  const duty = subtotal * corridor.dutyRate
  const vat = (taxableBase + duty) * corridor.vatRate
  const gst = (taxableBase + duty + platformMargin) * corridor.gstRate
  const escrowFee = corridor.trustScore < 80 ? taxableBase * escrowFeeRate : 0
  const total = taxableBase + platformMargin + duty + vat + gst + escrowFee

  return {
    subtotal,
    freight,
    movers,
    platformMargin,
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
