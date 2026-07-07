import secrets
import uuid
from datetime import timedelta

from django.conf import settings
from django.contrib.auth import authenticate, login as django_login, logout as django_logout
from django.db import IntegrityError, connection, transaction
from django.http import JsonResponse
from django.utils import timezone
from django.views.decorators.csrf import ensure_csrf_cookie
from rest_framework.decorators import api_view, throttle_classes
from rest_framework.response import Response

from .authentication import LoginRateThrottle
from .exceptions import ApiError, bad_request, conflict, not_found, unauthorized
from .models import Order, Product, Quote
from .pricing import RULE_PACK_VERSION, calculate_invoice, get_corridor, requires_escrow
from .serializers import catalogue_item_dto, order_dto, user_dto


def require_user(request):
    if not request.user.is_authenticated:
        raise unauthorized()
    return request.user


# --- health -----------------------------------------------------------------

def healthz(request):
    return JsonResponse({'status': 'ok'})


def readyz(request):
    try:
        with connection.cursor() as cursor:
            cursor.execute('SELECT 1')
        return JsonResponse({'status': 'ready'})
    except Exception:
        return JsonResponse({'status': 'unavailable'}, status=503)


# --- auth -------------------------------------------------------------------

@api_view(['POST'])
@throttle_classes([LoginRateThrottle])
def login_view(request):
    email = str(request.data.get('email', '')).strip().lower()
    password = str(request.data.get('password', ''))
    if not email or not password:
        raise bad_request('Provide a valid email and password')

    user = authenticate(request, username=email, password=password)
    if user is None:
        raise ApiError(401, 'UNAUTHORIZED', 'Incorrect email or password')

    django_login(request, user)
    return Response({'user': user_dto(user)})


@ensure_csrf_cookie
@api_view(['GET'])
def me_view(request):
    # The SPA calls this on load; ensure_csrf_cookie seeds the CSRF token the
    # client then echoes in the X-CSRFToken header on mutating requests.
    user = request.user
    return Response({'user': user_dto(user) if user.is_authenticated else None})


@api_view(['POST'])
def logout_view(request):
    django_logout(request)
    return Response({'ok': True})


# --- catalogue ----------------------------------------------------------------

def _matches_query(product, query):
    if not query:
        return True
    corridor = get_corridor(product.corridor_id)
    haystack = ' '.join(
        [
            product.name,
            product.category,
            product.state,
            product.origin,
            product.unit,
            product.available_qty,
            ' '.join(product.specs),
            ' '.join(product.certifications),
            corridor['from'],
            corridor['to'],
            ' '.join(corridor['search_terms']),
        ]
    ).lower()
    return all(term in haystack for term in query.lower().split())


@api_view(['GET'])
def catalogue_view(request):
    query = str(request.query_params.get('query', ''))[:200]
    products = Product.objects.order_by('name')
    items = [catalogue_item_dto(product) for product in products if _matches_query(product, query)]
    response = Response({'items': items})
    # Short private cache keeps repeat navigation cheap without letting a
    # shared cache serve seller-priced data across users.
    response['Cache-Control'] = 'private, max-age=30'
    return response


# --- quotes -------------------------------------------------------------------

@api_view(['POST'])
def quotes_view(request):
    user = require_user(request)

    product_id = str(request.data.get('productId', ''))
    lots = request.data.get('lots')
    freight_tier = request.data.get('freightTier')
    mover_tier = request.data.get('moverTier')
    fulfilment = request.data.get('fulfilment')

    if not isinstance(lots, int) or not 1 <= lots <= 10:
        raise bad_request('Lots must be between 1 and 10')
    if freight_tier not in ('normal', 'urgent') or mover_tier not in ('normal', 'urgent'):
        raise bad_request('Tiers must be normal or urgent')
    if fulfilment not in ('sourcing-only', 'turnkey'):
        raise bad_request('Fulfilment must be sourcing-only or turnkey')

    product = Product.objects.filter(id=product_id).first()
    if product is None:
        raise not_found('Product not found')

    corridor = get_corridor(product.corridor_id)
    totals = calculate_invoice(product.corridor_id, product.base_price, lots, freight_tier, mover_tier, fulfilment)

    quote = Quote.objects.create(
        buyer=user,
        product=product,
        lots=lots,
        freight_tier=freight_tier,
        mover_tier=mover_tier,
        fulfilment=fulfilment,
        currency=corridor['currency'],
        totals=totals,
        total_amount=totals['total'],
        rule_pack_version=RULE_PACK_VERSION,
        price_version=product.price_version,
        expires_at=timezone.now() + timedelta(minutes=settings.QUOTE_TTL_MINUTES),
    )

    return Response(
        {
            'quote': {
                'id': str(quote.id),
                'productId': product.id,
                'productName': product.name,
                'lots': lots,
                'freightTier': freight_tier,
                'moverTier': mover_tier,
                'fulfilment': fulfilment,
                'currency': quote.currency,
                'totals': totals,
                'rulePackVersion': quote.rule_pack_version,
                'priceVersion': quote.price_version,
                'expiresAt': quote.expires_at.isoformat(),
            }
        }
    )


# --- orders -------------------------------------------------------------------

def _generate_order_id():
    # 48 bits of randomness: not sequentially guessable or enumerable, and
    # collision-safe at volume (the create loop retries on the rare clash).
    return f'GCTC-{secrets.token_hex(6).upper()}'


@api_view(['POST', 'GET'])
def orders_view(request):
    user = require_user(request)
    if request.method == 'GET':
        return _list_orders(request, user)

    # Checkout accepts a quote ID only — totals always come from the
    # server-priced snapshot, never from the client.
    raw_quote_id = str(request.data.get('quoteId', ''))
    try:
        quote_id = uuid.UUID(raw_quote_id)
    except ValueError:
        raise bad_request('Provide the quote to check out')

    with transaction.atomic():
        claimed = Quote.objects.filter(
            id=quote_id,
            buyer=user,
            status='active',
            expires_at__gt=timezone.now(),
        ).update(status='consumed')
        if claimed == 0:
            raise conflict('QUOTE_INVALID', 'This quote has expired or was already used. Request a fresh quote.')

        quote = Quote.objects.select_related('product').get(id=quote_id)
        if quote.product.price_version != quote.price_version:
            raise conflict('QUOTE_STALE', 'The seller price changed after this quote was issued. Request a fresh quote.')

        corridor = get_corridor(quote.product.corridor_id)
        for _ in range(3):
            try:
                order = Order.objects.create(
                    id=_generate_order_id(),
                    buyer=user,
                    product=quote.product,
                    seller_id=quote.product.seller_id,
                    quote=quote,
                    lots=quote.lots,
                    fulfilment=quote.fulfilment,
                    freight_tier=quote.freight_tier,
                    mover_tier=quote.mover_tier,
                    currency=quote.currency,
                    totals=quote.totals,
                    total_amount=quote.total_amount,
                    status='Payment received',
                    payment_status='escrow-secured' if requires_escrow(corridor) else 'secured',
                    corridor_label=f"{corridor['from']} to {corridor['to']}",
                )
                break
            except IntegrityError:
                continue
        else:
            raise ApiError(500, 'INTERNAL', 'Could not allocate an order id')

    return Response({'order': order_dto(order, user)}, status=201)


def _list_orders(request, user):
    orders = Order.objects.select_related('product')
    if user.role == 'seller':
        orders = orders.filter(seller_id=user.id)
    elif user.role != 'admin':
        orders = orders.filter(buyer=user)
    orders = orders.order_by('-created_at')[:100]
    return Response({'orders': [order_dto(order, user) for order in orders]})
