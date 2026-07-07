from django.db import transaction
from django.http import HttpResponse
from django.utils import timezone
from rest_framework.decorators import api_view
from rest_framework.response import Response

from .exceptions import bad_request, conflict, forbidden, not_found, unauthorized
from .models import PriceRevision, Product, Quote, SellerSale
from .serializers import price_revision_dto, sales_to_csv, seller_product_dto, seller_sale_dto


def require_seller(request):
    if not request.user.is_authenticated:
        raise unauthorized()
    if request.user.role != 'seller':
        raise forbidden('This action requires seller permission')
    return request.user


@api_view(['GET'])
def products_view(request):
    seller = require_seller(request)
    products = Product.objects.filter(seller=seller).order_by('name')
    return Response({'products': [seller_product_dto(product) for product in products]})


@api_view(['PATCH'])
def price_view(request, product_id):
    seller = require_seller(request)

    new_price = request.data.get('newPrice')
    reason = str(request.data.get('reason', '')).strip()
    expected_version = request.data.get('expectedVersion')

    if not isinstance(new_price, int) or not 1 <= new_price <= 100_000_000:
        raise bad_request('Enter a valid price')
    if not 3 <= len(reason) <= 120:
        raise bad_request('A reason is required')
    if not isinstance(expected_version, int) or expected_version < 1:
        raise bad_request('Provide the listing version you are updating')

    with transaction.atomic():
        product = Product.objects.filter(id=product_id, seller=seller).first()
        if product is None:
            raise not_found('This product is not in your listings')

        updated = Product.objects.filter(
            id=product_id, seller=seller, price_version=expected_version
        ).update(
            base_price=new_price,
            price_version=expected_version + 1,
            price_updated_at=timezone.now().date(),
        )
        if updated == 0:
            raise conflict('VERSION_CONFLICT', 'This listing was updated elsewhere. Refresh and try again.')

        PriceRevision.objects.create(
            product=product,
            seller_id=seller.id,
            previous_price=product.base_price,
            new_price=new_price,
            reason=reason,
        )

        # A price change invalidates any open quotes so buyers can never
        # check out against a superseded offer.
        Quote.objects.filter(product=product, status='active').update(status='expired')

        product.refresh_from_db()

    return Response({'product': seller_product_dto(product)})


@api_view(['GET'])
def price_audits_view(request):
    seller = require_seller(request)
    revisions = (
        PriceRevision.objects.filter(seller_id=seller.id)
        .select_related('product')
        .order_by('-effective_at')[:100]
    )
    return Response({'audits': [price_revision_dto(revision) for revision in revisions]})


def _seller_sales(seller):
    return (
        SellerSale.objects.filter(seller_id=seller.id)
        .select_related('product')
        .order_by('-sold_at')
    )


@api_view(['GET'])
def sales_view(request):
    seller = require_seller(request)
    return Response({'sales': [seller_sale_dto(sale) for sale in _seller_sales(seller)]})


@api_view(['GET'])
def sales_csv_view(request):
    seller = require_seller(request)
    csv = sales_to_csv([seller_sale_dto(sale) for sale in _seller_sales(seller)])
    filename = f'gctc-seller-sales-{timezone.now().date().isoformat()}.csv'
    response = HttpResponse(csv, content_type='text/csv; charset=utf-8')
    response['Content-Disposition'] = f'attachment; filename="{filename}"'
    return response
