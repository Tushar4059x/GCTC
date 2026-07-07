#!/bin/sh
set -e

echo "Applying database migrations..."
python manage.py migrate --no-input
python manage.py createcachetable

if [ "$SEED_ON_BOOT" = "true" ]; then
  echo "Seeding database..."
  python manage.py seed_demo
fi

exec gunicorn gctc_api.wsgi:application \
  --bind 0.0.0.0:3000 \
  --workers "${WEB_CONCURRENCY:-4}" \
  --timeout 30 \
  --graceful-timeout 10 \
  --max-requests 5000 \
  --max-requests-jitter 500 \
  --access-logfile -
