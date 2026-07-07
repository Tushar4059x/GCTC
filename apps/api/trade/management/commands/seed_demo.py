import secrets

from django.core.management.base import BaseCommand

from trade.models import LogisticsPartner, Product, SellerSale, User
from trade.seed_data import DEMO_USERS, LOGISTICS_PARTNER_SEEDS, PRODUCT_SEEDS, SELLER_SALE_SEEDS


class Command(BaseCommand):
    help = 'Seed demo users, catalogue, sales, and logistics partners (idempotent)'

    def handle(self, *args, **options):
        seed_database()
        self.stdout.write(
            f'Seeded {len(DEMO_USERS)} users, {len(PRODUCT_SEEDS)} products, '
            f'{len(SELLER_SALE_SEEDS)} sales, {len(LOGISTICS_PARTNER_SEEDS)} logistics partners'
        )


def seed_database():
    for spec in DEMO_USERS:
        defaults = {
            'email': spec['email'],
            'name': spec['name'],
            'role': spec['role'],
            'organization': spec['organization'],
        }
        user, created = User.objects.update_or_create(id=spec['id'], defaults=defaults)
        if created:
            # Internal seller tenants get an unguessable password: they exist
            # for ownership records, not for logging in.
            user.set_password(spec.get('demo_password') or secrets.token_hex(24))
            user.save(update_fields=['password'])

    for spec in PRODUCT_SEEDS:
        Product.objects.get_or_create(id=spec['id'], defaults={**spec})

    for spec in SELLER_SALE_SEEDS:
        SellerSale.objects.get_or_create(id=spec['id'], defaults={**spec})

    for spec in LOGISTICS_PARTNER_SEEDS:
        LogisticsPartner.objects.get_or_create(id=spec['id'], defaults={**spec})
