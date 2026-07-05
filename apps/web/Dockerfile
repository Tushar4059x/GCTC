# Build context is the repository root: docker build -f apps/web/Dockerfile .
FROM node:20-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
COPY apps/web/package.json apps/web/
COPY packages/shared/package.json packages/shared/
RUN npm ci -w @gctc/web

COPY packages/shared packages/shared
COPY apps/web apps/web
RUN npm run build -w @gctc/web

FROM nginx:1.27-alpine
COPY deploy/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/apps/web/dist /usr/share/nginx/html
EXPOSE 80
