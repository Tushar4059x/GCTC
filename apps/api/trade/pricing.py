"""Python port of the pricing engine in packages/shared/src/pricing.ts.

The web app still uses the TypeScript engine for instant on-screen previews,
so any change to the rates, cost tables, or formula below MUST be mirrored in
packages/shared (rulePack.ts / pricing.ts). trade/tests.py pins exact outputs
from the TypeScript engine to guarantee the two stay in lockstep.
"""

import math

RULE_PACK_VERSION = 1

PLATFORM_MARGIN_RATE = 0.035
ESCROW_FEE_RATE = 0.008
TURNKEY_SERVICE_RATE = 0.045
INSURANCE_RATE = 0.004
CLEARANCE_SUPPORT_FEE = 8500
ESCROW_TRUST_THRESHOLD = 88

CORRIDORS = {
    'maharashtra-india': {
        'from': 'Ratnagiri, Maharashtra',
        'to': 'Pan-India delivery',
        'search_terms': ['maharashtra', 'ratnagiri', 'mumbai', 'cashew', 'dry fruits'],
        'currency': 'INR',
        'trust_score': 88,
        'gst_rate': 0.05,
    },
    'andhra-pradesh-india': {
        'from': 'West Godavari, Andhra Pradesh',
        'to': 'Pan-India delivery',
        'search_terms': ['andhra pradesh', 'west godavari', 'cocoa', 'food processing'],
        'currency': 'INR',
        'trust_score': 84,
        'gst_rate': 0.05,
    },
    'gujarat-india': {
        'from': 'Unjha, Gujarat',
        'to': 'Pan-India delivery',
        'search_terms': ['gujarat', 'unjha', 'sesame', 'seeds', 'agri commodity'],
        'currency': 'INR',
        'trust_score': 91,
        'gst_rate': 0.05,
    },
    'telangana-india': {
        'from': 'Nizamabad, Telangana',
        'to': 'Pan-India delivery',
        'search_terms': ['telangana', 'nizamabad', 'turmeric', 'spices'],
        'currency': 'INR',
        'trust_score': 90,
        'gst_rate': 0.05,
    },
    'rajasthan-india': {
        'from': 'Jodhpur, Rajasthan',
        'to': 'Pan-India delivery',
        'search_terms': ['rajasthan', 'jodhpur', 'millet', 'bajra', 'grains'],
        'currency': 'INR',
        'trust_score': 87,
        'gst_rate': 0.05,
    },
    'kerala-india': {
        'from': 'Idukki, Kerala',
        'to': 'Pan-India delivery',
        'search_terms': ['kerala', 'idukki', 'cardamom', 'spices'],
        'currency': 'INR',
        'trust_score': 93,
        'gst_rate': 0.05,
    },
    'karnataka-india': {
        'from': 'Chikkamagaluru, Karnataka',
        'to': 'Pan-India delivery',
        'search_terms': ['karnataka', 'chikkamagaluru', 'coffee', 'robusta', 'beans'],
        'currency': 'INR',
        'trust_score': 92,
        'gst_rate': 0.05,
    },
}

TRADE_COSTS = {
    'maharashtra-india': {'freight': {'normal': 28000, 'urgent': 44000}, 'movers': {'normal': 9000, 'urgent': 15000}},
    'andhra-pradesh-india': {'freight': {'normal': 36000, 'urgent': 54000}, 'movers': {'normal': 11000, 'urgent': 18000}},
    'gujarat-india': {'freight': {'normal': 32000, 'urgent': 49000}, 'movers': {'normal': 10000, 'urgent': 17000}},
    'telangana-india': {'freight': {'normal': 30000, 'urgent': 47000}, 'movers': {'normal': 9000, 'urgent': 16000}},
    'rajasthan-india': {'freight': {'normal': 34000, 'urgent': 52000}, 'movers': {'normal': 11000, 'urgent': 18000}},
    'kerala-india': {'freight': {'normal': 39000, 'urgent': 59000}, 'movers': {'normal': 12000, 'urgent': 20000}},
    'karnataka-india': {'freight': {'normal': 35000, 'urgent': 54000}, 'movers': {'normal': 11000, 'urgent': 19000}},
}


def get_corridor(corridor_id):
    corridor = CORRIDORS.get(corridor_id)
    if corridor is None:
        raise ValueError(f'Unknown corridor: {corridor_id}')
    return corridor


def requires_escrow(corridor):
    return corridor['trust_score'] < ESCROW_TRUST_THRESHOLD


def calculate_invoice(corridor_id, base_price, lots, freight_tier, mover_tier, fulfilment):
    """Mirrors calculateInvoice() in packages/shared exactly, including the
    order of floating-point operations, so totals are bit-identical to the
    previews the web app renders."""
    corridor = get_corridor(corridor_id)
    costs = TRADE_COSTS[corridor_id]
    lots = max(1, math.floor(lots))
    turnkey = fulfilment == 'turnkey'

    subtotal = base_price * lots
    freight = costs['freight'][freight_tier] * lots if turnkey else 0
    movers = costs['movers'][mover_tier] * lots if turnkey else 0
    insurance = subtotal * INSURANCE_RATE if turnkey else 0
    clearance_support = CLEARANCE_SUPPORT_FEE * lots if turnkey else 0
    taxable_base = subtotal + freight + movers
    platform_margin = taxable_base * PLATFORM_MARGIN_RATE
    turnkey_service_charge = (
        (freight + movers + insurance + clearance_support) * TURNKEY_SERVICE_RATE if turnkey else 0
    )
    gst = (platform_margin + turnkey_service_charge) * corridor['gst_rate']
    escrow_fee = taxable_base * ESCROW_FEE_RATE if corridor['trust_score'] < ESCROW_TRUST_THRESHOLD else 0
    total = taxable_base + insurance + clearance_support + platform_margin + turnkey_service_charge + gst + escrow_fee

    return {
        'subtotal': subtotal,
        'freight': freight,
        'movers': movers,
        'insurance': insurance,
        'clearanceSupport': clearance_support,
        'platformMargin': platform_margin,
        'turnkeyServiceCharge': turnkey_service_charge,
        'gst': gst,
        'escrowFee': escrow_fee,
        'total': total,
    }
