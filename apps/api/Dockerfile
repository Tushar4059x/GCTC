# Build context is the repository root: docker build -f apps/api/Dockerfile .
FROM node:20-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/
COPY packages/shared/package.json packages/shared/
RUN npm ci -w @gctc/api

COPY packages/shared packages/shared
COPY apps/api apps/api

RUN npx prisma generate --schema apps/api/prisma/schema.prisma \
  && npm run build -w @gctc/api \
  && npm run build:seed -w @gctc/api \
  && npm prune --omit=dev -w @gctc/api

FROM node:20-alpine
RUN apk add --no-cache openssl
WORKDIR /app
ENV NODE_ENV=production

COPY --from=build --chown=node:node /app/node_modules node_modules
COPY --from=build --chown=node:node /app/package.json package.json
COPY --from=build --chown=node:node /app/apps/api/package.json apps/api/package.json
COPY --from=build --chown=node:node /app/apps/api/prisma apps/api/prisma
COPY --from=build --chown=node:node /app/apps/api/dist apps/api/dist
COPY --chown=node:node apps/api/docker-entrypoint.sh docker-entrypoint.sh
RUN chmod +x docker-entrypoint.sh

USER node
EXPOSE 3000
ENTRYPOINT ["./docker-entrypoint.sh"]
