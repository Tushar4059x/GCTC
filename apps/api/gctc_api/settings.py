import os
from pathlib import Path

import dj_database_url
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent
# Loads apps/api/.env in development; a no-op in containers where the
# environment is injected by the orchestrator.
load_dotenv(BASE_DIR / '.env')

SECRET_KEY = os.environ.get('SECRET_KEY') or os.environ.get('SESSION_SECRET') or ''
if len(SECRET_KEY) < 32:
    raise RuntimeError('SECRET_KEY (or SESSION_SECRET) must be set and at least 32 characters')

DEBUG = os.environ.get('DEBUG', 'false').lower() == 'true'

ALLOWED_HOSTS = [
    host.strip()
    for host in os.environ.get('ALLOWED_HOSTS', 'localhost,127.0.0.1').split(',')
    if host.strip()
]

INSTALLED_APPS = [
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'rest_framework',
    'trade',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
]

ROOT_URLCONF = 'gctc_api.urls'
WSGI_APPLICATION = 'gctc_api.wsgi.application'

DATABASES = {
    'default': dj_database_url.config(
        default='postgresql://gctc:gctc@localhost:5432/gctc',
        conn_max_age=60,
    )
}

# Rate-limit counters live in the cache. In production the cache must be
# shared across gunicorn workers and container replicas or per-IP limits
# dilute to nothing — the database backend keeps limits cluster-wide without
# adding infrastructure (swap for Redis when traffic outgrows it).
if os.environ.get('CACHE_BACKEND', 'locmem') == 'database':
    CACHES = {
        'default': {
            'BACKEND': 'django.core.cache.backends.db.DatabaseCache',
            'LOCATION': 'gctc_cache',
        }
    }
else:
    CACHES = {
        'default': {
            'BACKEND': 'django.core.cache.backends.locmem.LocMemCache',
        }
    }

AUTH_USER_MODEL = 'trade.User'

SESSION_COOKIE_NAME = 'gctc_session'
SESSION_COOKIE_HTTPONLY = True
SESSION_COOKIE_SAMESITE = 'Lax'
SESSION_COOKIE_SECURE = not DEBUG
SESSION_COOKIE_AGE = int(os.environ.get('SESSION_TTL_HOURS', '168')) * 3600

# Double-submit CSRF: the token cookie is readable by the SPA (not HttpOnly)
# and echoed back in the X-CSRFToken header on mutating requests. Enforced by
# DRF's SessionAuthentication + CsrfViewMiddleware. SameSite is a second,
# independent control, not the only one.
CSRF_COOKIE_NAME = 'gctc_csrftoken'
CSRF_COOKIE_SAMESITE = 'Lax'
CSRF_COOKIE_SECURE = not DEBUG
CSRF_HEADER_NAME = 'HTTP_X_CSRFTOKEN'
# On HTTPS, Django checks the Origin against these. Same-origin requests match
# the request host automatically; set this to the public origin(s) when the
# API is reached through a proxy that rewrites Host.
CSRF_TRUSTED_ORIGINS = [
    origin.strip()
    for origin in os.environ.get('CSRF_TRUSTED_ORIGINS', '').split(',')
    if origin.strip()
]

TRUST_PROXY = os.environ.get('TRUST_PROXY', 'false').lower() == 'true'
if TRUST_PROXY:
    SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
    USE_X_FORWARDED_HOST = True

# Number of trusted reverse proxies in front of the app. DRF uses this to take
# the correct hop from X-Forwarded-For when identifying a client for rate
# limiting. Behind nginx there is exactly one; when the app is directly exposed
# (dev) it is 0 so DRF ignores any client-supplied X-Forwarded-For and keys on
# REMOTE_ADDR. Without this, a client can rotate X-Forwarded-For to mint a fresh
# throttle bucket per request and bypass the login brute-force limit.
NUM_PROXIES = int(os.environ.get('NUM_PROXIES', '1' if TRUST_PROXY else '0'))

SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS = 'DENY'

RATE_LIMIT_MAX = int(os.environ.get('RATE_LIMIT_MAX', '300'))
LOGIN_RATE_LIMIT_MAX = int(os.environ.get('LOGIN_RATE_LIMIT_MAX', '10'))
QUOTE_TTL_MINUTES = int(os.environ.get('QUOTE_TTL_MINUTES', '30'))

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': ['rest_framework.authentication.SessionAuthentication'],
    'DEFAULT_PERMISSION_CLASSES': ['rest_framework.permissions.AllowAny'],
    'DEFAULT_RENDERER_CLASSES': ['rest_framework.renderers.JSONRenderer'],
    'DEFAULT_THROTTLE_CLASSES': [
        'rest_framework.throttling.AnonRateThrottle',
        'rest_framework.throttling.UserRateThrottle',
    ],
    'DEFAULT_THROTTLE_RATES': {
        'anon': f'{RATE_LIMIT_MAX}/min',
        'user': f'{RATE_LIMIT_MAX}/min',
        'login': f'{LOGIN_RATE_LIMIT_MAX}/min',
    },
    'NUM_PROXIES': NUM_PROXIES,
    'EXCEPTION_HANDLER': 'trade.exceptions.api_exception_handler',
}

TIME_ZONE = 'UTC'
USE_TZ = True

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'handlers': {'console': {'class': 'logging.StreamHandler'}},
    'root': {'handlers': ['console'], 'level': os.environ.get('LOG_LEVEL', 'INFO').upper()},
}
