import uuid

from django.contrib.auth.base_user import AbstractBaseUser, BaseUserManager
from django.db import models


class UserManager(BaseUserManager):
    use_in_migrations = True

    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError('Email is required')
        user = self.model(email=self.normalize_email(email), **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user


class User(AbstractBaseUser):
    class Role(models.TextChoices):
        BUYER = 'buyer'
        SELLER = 'seller'
        ADMIN = 'admin'

    id = models.CharField(primary_key=True, max_length=40)
    email = models.EmailField(unique=True)
    name = models.CharField(max_length=120)
    role = models.CharField(max_length=10, choices=Role.choices)
    organization = models.CharField(max_length=160)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    USERNAME_FIELD = 'email'
    objects = UserManager()


class Product(models.Model):
    id = models.CharField(primary_key=True, max_length=60)
    seller = models.ForeignKey(User, on_delete=models.PROTECT, related_name='products')
    corridor_id = models.CharField(max_length=40)
    product_class = models.CharField(max_length=10)
    name = models.CharField(max_length=160)
    category = models.CharField(max_length=80)
    state = models.CharField(max_length=60)
    origin = models.CharField(max_length=160)
    image_url = models.CharField(max_length=200)
    unit = models.CharField(max_length=80)
    base_price = models.IntegerField()
    price_version = models.IntegerField(default=1)
    price_updated_at = models.DateField()
    procurement_frequency = models.CharField(max_length=40)
    available_qty = models.CharField(max_length=60)
    specs = models.JSONField(default=list)
    certifications = models.JSONField(default=list)
    decision_factors = models.JSONField(default=list)
    note = models.TextField()

    class Meta:
        indexes = [
            models.Index(fields=['seller']),
            models.Index(fields=['category']),
            models.Index(fields=['state']),
        ]


class PriceRevision(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='price_revisions')
    seller_id = models.CharField(max_length=40)
    previous_price = models.IntegerField()
    new_price = models.IntegerField()
    reason = models.CharField(max_length=120)
    effective_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [models.Index(fields=['seller_id', '-effective_at'])]


class Quote(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    buyer = models.ForeignKey(User, on_delete=models.CASCADE, related_name='quotes')
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='quotes')
    lots = models.IntegerField()
    freight_tier = models.CharField(max_length=10)
    mover_tier = models.CharField(max_length=10)
    fulfilment = models.CharField(max_length=20)
    currency = models.CharField(max_length=8)
    totals = models.JSONField()
    total_amount = models.FloatField()
    rule_pack_version = models.IntegerField()
    price_version = models.IntegerField()
    status = models.CharField(max_length=12, default='active')
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()

    class Meta:
        indexes = [
            models.Index(fields=['buyer', '-created_at']),
            models.Index(fields=['product', 'status']),
        ]


class Order(models.Model):
    id = models.CharField(primary_key=True, max_length=20)
    buyer = models.ForeignKey(User, on_delete=models.PROTECT, related_name='orders')
    product = models.ForeignKey(Product, on_delete=models.PROTECT, related_name='orders')
    seller_id = models.CharField(max_length=40)
    quote = models.OneToOneField(Quote, on_delete=models.PROTECT, related_name='order')
    lots = models.IntegerField()
    fulfilment = models.CharField(max_length=20)
    freight_tier = models.CharField(max_length=10)
    mover_tier = models.CharField(max_length=10)
    currency = models.CharField(max_length=8)
    totals = models.JSONField()
    total_amount = models.FloatField()
    status = models.CharField(max_length=60)
    payment_status = models.CharField(max_length=20)
    corridor_label = models.CharField(max_length=160)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [
            models.Index(fields=['buyer', '-created_at']),
            models.Index(fields=['seller_id', '-created_at']),
        ]


class SellerSale(models.Model):
    id = models.CharField(primary_key=True, max_length=20)
    seller_id = models.CharField(max_length=40)
    product = models.ForeignKey(Product, on_delete=models.PROTECT, related_name='sales')
    buyer_alias = models.CharField(max_length=80)
    sold_at = models.DateField()
    lots = models.IntegerField()
    quantity_tons = models.FloatField()
    amount = models.IntegerField()
    fulfilment = models.CharField(max_length=20)
    quality_status = models.CharField(max_length=12)
    dispute_count = models.IntegerField()

    class Meta:
        indexes = [models.Index(fields=['seller_id', '-sold_at'])]


class LogisticsPartner(models.Model):
    id = models.CharField(primary_key=True, max_length=20)
    type = models.CharField(max_length=40)
    legal_name = models.CharField(max_length=120)
    corridor = models.CharField(max_length=120)
    base_rate_per_ton = models.IntegerField()
    distance_rate_per_ton_km = models.FloatField()
    capacity = models.CharField(max_length=60)
    status = models.CharField(max_length=20)
    last_audit = models.DateField()
