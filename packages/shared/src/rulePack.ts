import type { Corridor, CorridorId, ProductClass, TradeCosts } from './types.ts'

/**
 * Versioned India trade rule pack. Quotes and orders record the version they
 * were priced under so historical invoices stay explainable after rule changes.
 */
export const RULE_PACK_VERSION = 1

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
export const clearanceSupportFee = 8500
export const escrowTrustThreshold = 88

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

export function getCorridor(corridorId: string): Corridor {
  const corridor = corridors.find((candidate) => candidate.id === corridorId)
  if (!corridor) throw new Error(`Unknown corridor: ${corridorId}`)
  return corridor
}
