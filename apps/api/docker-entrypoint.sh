#!/bin/sh
set -e

echo "Applying database migrations..."
npx prisma migrate deploy --schema apps/api/prisma/schema.prisma

if [ "$SEED_ON_BOOT" = "true" ]; then
  echo "Seeding database..."
  node apps/api/dist/seed.js
fi

exec node apps/api/dist/server.js
