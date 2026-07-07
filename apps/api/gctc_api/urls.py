from django.urls import path

from trade import admin_views, seller_views, views

urlpatterns = [
    path('healthz', views.healthz),
    path('readyz', views.readyz),

    path('api/auth/login', views.login_view),
    path('api/auth/me', views.me_view),
    path('api/auth/logout', views.logout_view),

    path('api/catalogue', views.catalogue_view),
    path('api/quotes', views.quotes_view),
    path('api/orders', views.orders_view),

    path('api/seller/products', seller_views.products_view),
    path('api/seller/products/<str:product_id>/price', seller_views.price_view),
    path('api/seller/price-audits', seller_views.price_audits_view),
    path('api/seller/sales', seller_views.sales_view),
    path('api/seller/sales.csv', seller_views.sales_csv_view),

    path('api/admin/logistics-partners', admin_views.logistics_partners_view),
    path('api/admin/sales-exceptions', admin_views.sales_exceptions_view),
    path('api/admin/price-audits', admin_views.price_audits_view),
    path('api/admin/metrics', admin_views.metrics_view),
]
