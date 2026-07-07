"""Manual DTO builders matching the camelCase shapes in packages/shared/src/api.ts."""

import hashlib
import re

from .pricing import calculate_invoice, get_corridor


def user_dto(user):
    return {
        'id': user.id,
        'name': user.name,
        'email': user.email,
        'role': user.role,
        'organization': user.organization,
    }


def catalogue_item_dto(product):
    corridor = get_corridor(product.corridor_id)
    delivered = calculate_invoice(product.corridor_id, product.base_price, 1, 'normal', 'normal', 'turnkey')
    return {
        'id': product.id,
        'corridorId': product.corridor_id,
        'productClass': product.product_class,
        'name': product.name,
        'category': product.category,
        'state': product.state,
        'origin': product.origin,
        'imageUrl': product.image_url,
        'unit': product.unit,
        'basePrice': product.base_price,
        'priceVersion': product.price_version,
        'priceUpdatedAt': product.price_updated_at.isoformat(),
        'procurementFrequency': product.procurement_frequency,
        'availableQty': product.available_qty,
        'specs': product.specs,
        'certifications': product.certifications,
        'decisionFactors': product.decision_factors,
        'note': product.note,
        'deliveredPrice': round(delivered['total']),
        'currency': corridor['currency'],
    }


def seller_product_dto(product):
    return {**catalogue_item_dto(product), 'sellerId': product.seller_id}


def buyer_alias(buyer_id):
    """Stable anonymised buyer reference so sellers never see buyer identity.
    Same sha256-prefix scheme as the previous backend, so aliases persist."""
    digest = hashlib.sha256(buyer_id.encode()).hexdigest()[:6].upper()
    return f'Buyer account {digest}'


def order_dto(order, viewer):
    anonymise = viewer.role == 'seller'
    return {
        'id': order.id,
        'productId': order.product_id,
        'productName': order.product.name,
        'imageUrl': order.product.image_url,
        'corridorLabel': order.corridor_label,
        'lots': order.lots,
        'fulfilment': order.fulfilment,
        'totals': order.totals,
        'totalAmount': order.total_amount,
        'currency': order.currency,
        'status': order.status,
        'paymentStatus': order.payment_status,
        'protection': 'Escrow protection active' if order.payment_status == 'escrow-secured' else 'Payment hold active',
        'buyerLabel': buyer_alias(order.buyer_id) if anonymise else 'Your organisation',
        'createdAt': order.created_at.isoformat(),
    }


def price_revision_dto(revision):
    return {
        'id': str(revision.pk),
        'productId': revision.product_id,
        'productName': revision.product.name,
        'previousPrice': revision.previous_price,
        'newPrice': revision.new_price,
        'reason': revision.reason,
        'effectiveAt': revision.effective_at.isoformat(),
    }


def seller_sale_dto(sale):
    return {
        'id': sale.id,
        'productId': sale.product_id,
        'productName': sale.product.name,
        'buyerAlias': sale.buyer_alias,
        'soldAt': sale.sold_at.isoformat(),
        'lots': sale.lots,
        'quantityTons': sale.quantity_tons,
        'amount': sale.amount,
        'fulfilment': sale.fulfilment,
        'qualityStatus': sale.quality_status,
        'disputeCount': sale.dispute_count,
    }


def logistics_partner_dto(partner):
    return {
        'id': partner.id,
        'type': partner.type,
        'legalName': partner.legal_name,
        'corridor': partner.corridor,
        'baseRatePerTon': partner.base_rate_per_ton,
        'distanceRatePerTonKm': partner.distance_rate_per_ton_km,
        'capacity': partner.capacity,
        'status': partner.status,
        'lastAudit': partner.last_audit.isoformat(),
    }


def sales_to_csv(sales):
    headers = [
        'Sale ID', 'Date', 'Buyer reference', 'Product', 'Lots',
        'Quantity tons', 'Value INR', 'Fulfilment', 'Quality', 'Disputes',
    ]
    rows = [
        [
            sale['id'], sale['soldAt'], sale['buyerAlias'], sale['productName'], sale['lots'],
            sale['quantityTons'], sale['amount'], sale['fulfilment'], sale['qualityStatus'], sale['disputeCount'],
        ]
        for sale in sales
    ]

    def escape_cell(value):
        text = str(value)
        # Prefix spreadsheet formula triggers so exported cells stay inert.
        spreadsheet_safe = f"'{text}" if re.match(r'^[=+\-@]', text) else text
        return '"' + spreadsheet_safe.replace('"', '""') + '"'

    return '\n'.join(','.join(escape_cell(cell) for cell in row) for row in [headers, *rows])
