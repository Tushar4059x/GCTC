from django.db.models import Count, Q, Sum
from rest_framework.decorators import api_view
from rest_framework.response import Response

from .exceptions import forbidden, unauthorized
from .models import LogisticsPartner, Order, PriceRevision, SellerSale
from .serializers import logistics_partner_dto, price_revision_dto, seller_sale_dto

EXCEPTION_FILTER = ~Q(quality_status='passed') | Q(dispute_count__gt=0)


def require_admin(request):
    if not request.user.is_authenticated:
        raise unauthorized()
    if request.user.role != 'admin':
        raise forbidden('This action requires admin permission')
    return request.user


@api_view(['GET'])
def logistics_partners_view(request):
    require_admin(request)
    partners = LogisticsPartner.objects.order_by('id')
    return Response({'partners': [logistics_partner_dto(partner) for partner in partners]})


@api_view(['GET'])
def sales_exceptions_view(request):
    require_admin(request)
    sales = SellerSale.objects.filter(EXCEPTION_FILTER).select_related('product').order_by('-sold_at')
    return Response(
        {'exceptions': [{**seller_sale_dto(sale), 'sellerId': sale.seller_id} for sale in sales]}
    )


@api_view(['GET'])
def price_audits_view(request):
    require_admin(request)
    revisions = PriceRevision.objects.select_related('product').order_by('-effective_at')[:200]
    return Response({'audits': [price_revision_dto(revision) for revision in revisions]})


@api_view(['GET'])
def metrics_view(request):
    require_admin(request)
    sales_sum = SellerSale.objects.aggregate(total=Sum('amount'))['total'] or 0
    orders_sum = Order.objects.aggregate(total=Sum('total_amount'))['total'] or 0
    exception_count = SellerSale.objects.filter(EXCEPTION_FILTER).aggregate(n=Count('id'))['n']
    partner_count = LogisticsPartner.objects.count()
    return Response(
        {
            'metrics': {
                'gmvPipeline': sales_sum + orders_sum,
                'exceptionCount': exception_count,
                'partnerCount': partner_count,
            }
        }
    )
