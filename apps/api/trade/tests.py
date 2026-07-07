import json

from django.test import Client, TestCase

from .management.commands.seed_demo import seed_database
from .pricing import calculate_invoice
from .seed_data import DEMO_PASSWORD

# Exact outputs captured from packages/shared/src/pricing.ts (see the note in
# trade/pricing.py). If these fail after a rule change, the TypeScript and
# Python engines have drifted apart.
TS_PARITY_FIXTURES = [
    (
        ('maharashtra-india', 462000, 1, 'normal', 'normal', 'turnkey'),
        {'subtotal': 462000, 'freight': 28000, 'movers': 9000, 'insurance': 1848,
         'clearanceSupport': 8500, 'platformMargin': 17465, 'turnkeyServiceCharge': 2130.66,
         'gst': 979.783, 'escrowFee': 0, 'total': 529923.4430000001},
    ),
    (
        ('maharashtra-india', 462000, 2, 'urgent', 'normal', 'turnkey'),
        {'subtotal': 924000, 'freight': 88000, 'movers': 18000, 'insurance': 3696,
         'clearanceSupport': 17000, 'platformMargin': 36050, 'turnkeyServiceCharge': 5701.32,
         'gst': 2087.5660000000003, 'escrowFee': 0, 'total': 1094534.8860000002},
    ),
    (
        ('telangana-india', 185000, 3, 'normal', 'urgent', 'turnkey'),
        {'subtotal': 555000, 'freight': 90000, 'movers': 48000, 'insurance': 2220,
         'clearanceSupport': 25500, 'platformMargin': 24255.000000000004, 'turnkeyServiceCharge': 7457.4,
         'gst': 1585.6200000000001, 'escrowFee': 0, 'total': 754018.02},
    ),
    (
        ('andhra-pradesh-india', 318000, 1, 'normal', 'normal', 'turnkey'),
        {'subtotal': 318000, 'freight': 36000, 'movers': 11000, 'insurance': 1272,
         'clearanceSupport': 8500, 'platformMargin': 12775.000000000002, 'turnkeyServiceCharge': 2554.74,
         'gst': 766.4870000000001, 'escrowFee': 2920, 'total': 393788.227},
    ),
    (
        ('andhra-pradesh-india', 318000, 2, 'urgent', 'urgent', 'sourcing-only'),
        {'subtotal': 636000, 'freight': 0, 'movers': 0, 'insurance': 0,
         'clearanceSupport': 0, 'platformMargin': 22260.000000000004, 'turnkeyServiceCharge': 0,
         'gst': 1113.0000000000002, 'escrowFee': 5088, 'total': 664461},
    ),
    (
        ('kerala-india', 336000, 5, 'urgent', 'urgent', 'turnkey'),
        {'subtotal': 1680000, 'freight': 295000, 'movers': 100000, 'insurance': 6720,
         'clearanceSupport': 42500, 'platformMargin': 72625, 'turnkeyServiceCharge': 19989.899999999998,
         'gst': 4630.745, 'escrowFee': 0, 'total': 2221465.645},
    ),
    (
        ('rajasthan-india', 142000, 10, 'normal', 'normal', 'sourcing-only'),
        {'subtotal': 1420000, 'freight': 0, 'movers': 0, 'insurance': 0,
         'clearanceSupport': 0, 'platformMargin': 49700.00000000001, 'turnkeyServiceCharge': 0,
         'gst': 2485.0000000000005, 'escrowFee': 11360, 'total': 1483545},
    ),
]


class PricingParityTests(TestCase):
    def test_matches_typescript_engine_exactly(self):
        for args, expected in TS_PARITY_FIXTURES:
            with self.subTest(args=args):
                self.assertEqual(calculate_invoice(*args), expected)

    def test_clamps_lots_to_at_least_one(self):
        invoice = calculate_invoice('maharashtra-india', 462000, 0, 'normal', 'normal', 'turnkey')
        self.assertEqual(invoice['subtotal'], 462000)

    def test_rejects_unknown_corridor(self):
        with self.assertRaisesMessage(ValueError, 'Unknown corridor'):
            calculate_invoice('mars-india', 1000, 1, 'normal', 'normal', 'turnkey')


class ApiTestCase(TestCase):
    _login_counter = 0

    @classmethod
    def setUpTestData(cls):
        seed_database()

    def _json(self, response):
        return json.loads(response.content)

    def login(self, email, password=DEMO_PASSWORD, client=None):
        """Each helper login comes from a distinct client IP so suite-wide
        logins don't trip the per-IP login rate limit that a dedicated test
        exercises."""
        ApiTestCase._login_counter += 1
        client = client or Client()
        response = client.post(
            '/api/auth/login',
            data=json.dumps({'email': email, 'password': password}),
            content_type='application/json',
            REMOTE_ADDR=f'10.1.0.{ApiTestCase._login_counter}',
        )
        self.assertEqual(response.status_code, 200)
        return client


class HealthTests(ApiTestCase):
    def test_liveness_and_readiness(self):
        self.assertEqual(self.client.get('/healthz').status_code, 200)
        ready = self.client.get('/readyz')
        self.assertEqual(ready.status_code, 200)
        self.assertEqual(self._json(ready), {'status': 'ready'})


class CatalogueTests(ApiTestCase):
    def test_public_masked_and_priced_server_side(self):
        response = self.client.get('/api/catalogue')
        self.assertEqual(response.status_code, 200)
        items = self._json(response)['items']
        self.assertEqual(len(items), 7)
        for item in items:
            self.assertNotIn('sellerId', item)
            self.assertGreater(item['deliveredPrice'], item['basePrice'])

    def test_multi_term_search(self):
        response = self.client.get('/api/catalogue', {'query': 'turmeric telangana'})
        items = self._json(response)['items']
        self.assertEqual(len(items), 1)
        self.assertEqual(items[0]['id'], 'turmeric-telangana')


class AuthTests(ApiTestCase):
    def test_rejects_wrong_credentials(self):
        response = self.client.post(
            '/api/auth/login',
            data=json.dumps({'email': 'buyer@gctc.demo', 'password': 'wrong'}),
            content_type='application/json',
            REMOTE_ADDR='10.2.0.1',
        )
        self.assertEqual(response.status_code, 401)

    def test_login_and_session_resolution(self):
        client = self.login('buyer@gctc.demo')
        me = self._json(client.get('/api/auth/me'))
        self.assertEqual(me['user']['id'], 'buyer-1')
        self.assertEqual(me['user']['role'], 'buyer')

    def test_logout_invalidates_session(self):
        client = self.login('buyer@gctc.demo')
        client.post('/api/auth/logout')
        self.assertIsNone(self._json(client.get('/api/auth/me'))['user'])


class QuoteOrderTests(ApiTestCase):
    def quote(self, client, **overrides):
        payload = {
            'productId': 'cashew-maharashtra',
            'lots': 1,
            'freightTier': 'normal',
            'moverTier': 'normal',
            'fulfilment': 'turnkey',
            **overrides,
        }
        return client.post('/api/quotes', data=json.dumps(payload), content_type='application/json')

    def test_quote_requires_authentication(self):
        self.assertEqual(self.quote(self.client).status_code, 401)

    def test_prices_quotes_and_checks_out_by_quote_id_only(self):
        client = self.login('buyer@gctc.demo')
        response = self.quote(client, lots=2, freightTier='urgent')
        self.assertEqual(response.status_code, 200)
        quote = self._json(response)['quote']
        expected = calculate_invoice('maharashtra-india', 462000, 2, 'urgent', 'normal', 'turnkey')
        self.assertEqual(quote['totals']['total'], expected['total'])

        order_response = client.post(
            '/api/orders', data=json.dumps({'quoteId': quote['id']}), content_type='application/json'
        )
        self.assertEqual(order_response.status_code, 201)
        order = self._json(order_response)['order']
        self.assertEqual(order['totalAmount'], expected['total'])
        self.assertEqual(order['status'], 'Payment received')
        self.assertEqual(order['paymentStatus'], 'secured')

        # A quote is single-use.
        replay = client.post(
            '/api/orders', data=json.dumps({'quoteId': quote['id']}), content_type='application/json'
        )
        self.assertEqual(replay.status_code, 409)

        listed = self._json(client.get('/api/orders'))['orders']
        self.assertIn(order['id'], [candidate['id'] for candidate in listed])

    def test_seller_order_view_anonymises_buyer(self):
        buyer = self.login('buyer@gctc.demo')
        quote = self._json(self.quote(buyer, productId='cocoa-andhra'))['quote']
        buyer.post('/api/orders', data=json.dumps({'quoteId': quote['id']}), content_type='application/json')

        seller = self.login('seller@gctc.demo')
        orders = self._json(seller.get('/api/orders'))['orders']
        self.assertGreater(len(orders), 0)
        for order in orders:
            self.assertTrue(order['buyerLabel'].startswith('Buyer account '))


class SellerPricingTests(ApiTestCase):
    def test_lists_only_owned_products(self):
        client = self.login('seller@gctc.demo')
        products = self._json(client.get('/api/seller/products'))['products']
        self.assertEqual(len(products), 3)
        self.assertTrue(all(product['sellerId'] == 'seller-1' for product in products))

    def test_rejects_update_to_another_sellers_product(self):
        client = self.login('seller@gctc.demo')
        response = client.patch(
            '/api/seller/products/turmeric-telangana/price',
            data=json.dumps({'newPrice': 190000, 'reason': 'Market adjustment', 'expectedVersion': 1}),
            content_type='application/json',
        )
        self.assertEqual(response.status_code, 404)

    def test_optimistic_lock_audit_row_and_quote_expiry(self):
        buyer = self.login('buyer@gctc.demo')
        quote_response = buyer.post(
            '/api/quotes',
            data=json.dumps({
                'productId': 'cocoa-andhra', 'lots': 1, 'freightTier': 'normal',
                'moverTier': 'normal', 'fulfilment': 'turnkey',
            }),
            content_type='application/json',
        )
        quote_id = self._json(quote_response)['quote']['id']

        seller = self.login('seller@gctc.demo')
        stale = seller.patch(
            '/api/seller/products/cocoa-andhra/price',
            data=json.dumps({'newPrice': 325000, 'reason': 'Cocoa futures moved', 'expectedVersion': 99}),
            content_type='application/json',
        )
        self.assertEqual(stale.status_code, 409)

        ok = seller.patch(
            '/api/seller/products/cocoa-andhra/price',
            data=json.dumps({'newPrice': 325000, 'reason': 'Cocoa futures moved', 'expectedVersion': 1}),
            content_type='application/json',
        )
        self.assertEqual(ok.status_code, 200)
        product = self._json(ok)['product']
        self.assertEqual(product['basePrice'], 325000)
        self.assertEqual(product['priceVersion'], 2)

        audits = self._json(seller.get('/api/seller/price-audits'))['audits']
        self.assertEqual(audits[0]['previousPrice'], 318000)
        self.assertEqual(audits[0]['newPrice'], 325000)

        # The buyer's earlier quote must no longer be checkout-able.
        checkout = buyer.post(
            '/api/orders', data=json.dumps({'quoteId': quote_id}), content_type='application/json'
        )
        self.assertEqual(checkout.status_code, 409)

    def test_injection_safe_csv_export(self):
        client = self.login('seller@gctc.demo')
        response = client.get('/api/seller/sales.csv')
        self.assertEqual(response.status_code, 200)
        self.assertIn('text/csv', response['Content-Type'])
        self.assertIn('SALE-2048', response.content.decode())


class RbacTests(ApiTestCase):
    def test_blocks_buyers_from_seller_and_admin_surfaces(self):
        client = self.login('buyer@gctc.demo')
        self.assertEqual(client.get('/api/seller/products').status_code, 403)
        self.assertEqual(client.get('/api/admin/logistics-partners').status_code, 403)

    def test_logistics_directory_is_admin_only(self):
        seller = self.login('seller@gctc.demo')
        self.assertEqual(seller.get('/api/admin/logistics-partners').status_code, 403)

        admin = self.login('admin@gctc.demo')
        partners = self._json(admin.get('/api/admin/logistics-partners'))['partners']
        self.assertEqual(len(partners), 5)

        exceptions = self._json(admin.get('/api/admin/sales-exceptions'))['exceptions']
        self.assertIn('SALE-2019', [sale['id'] for sale in exceptions])

        metrics = self._json(admin.get('/api/admin/metrics'))['metrics']
        self.assertGreater(metrics['gmvPipeline'], 0)


class TrafficControlTests(ApiTestCase):
    def test_rate_limits_repeated_login_attempts(self):
        last_status = None
        for _ in range(11):
            response = self.client.post(
                '/api/auth/login',
                data=json.dumps({'email': 'buyer@gctc.demo', 'password': 'definitely-wrong'}),
                content_type='application/json',
                REMOTE_ADDR='10.99.0.42',
            )
            last_status = response.status_code
        self.assertEqual(last_status, 429)


class CsrfTests(ApiTestCase):
    """Uses a CSRF-enforcing client (the default django.test.Client bypasses
    CSRF, which is why the other suites don't need tokens)."""

    def _login(self):
        client = Client(enforce_csrf_checks=True)
        ApiTestCase._login_counter += 1
        # /me issues the CSRF cookie; login (unauthenticated) needs no token.
        client.get('/api/auth/me')
        response = client.post(
            '/api/auth/login',
            data=json.dumps({'email': 'buyer@gctc.demo', 'password': DEMO_PASSWORD}),
            content_type='application/json',
            REMOTE_ADDR=f'10.3.0.{ApiTestCase._login_counter}',
        )
        self.assertEqual(response.status_code, 200)
        return client

    def _quote_payload(self):
        return json.dumps({
            'productId': 'cashew-maharashtra', 'lots': 1, 'freightTier': 'normal',
            'moverTier': 'normal', 'fulfilment': 'turnkey',
        })

    def test_authenticated_mutation_without_token_is_rejected(self):
        client = self._login()
        response = client.post('/api/quotes', data=self._quote_payload(), content_type='application/json')
        self.assertEqual(response.status_code, 403)

    def test_authenticated_mutation_with_token_succeeds(self):
        client = self._login()
        token = client.cookies['gctc_csrftoken'].value
        response = client.post(
            '/api/quotes',
            data=self._quote_payload(),
            content_type='application/json',
            HTTP_X_CSRFTOKEN=token,
        )
        self.assertEqual(response.status_code, 200)
