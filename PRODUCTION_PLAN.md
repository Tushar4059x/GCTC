# GCTC Production Plan

Goal: convert the single-file React POC into a deployable, traffic-ready full-stack
application while preserving the existing buyer / seller / admin product experience.

**Decision — where the work happens:** in this repository (converted to an npm-workspaces
monorepo), so git history, docs, and the GitHub remote stay intact.

**Target shape**

```
GCTC/
├── apps/
│   ├── api/          Fastify + Prisma + PostgreSQL API (stateless, horizontally scalable)
│   └── web/          Existing Vite React PWA, refactored to consume the API
├── packages/
│   └── shared/       Domain types, corridor rule pack, pricing engine (one source of truth)
├── deploy/           nginx config
├── docker-compose.yml
└── .github/workflows/ci.yml
```

---

## Phase 0 — Repo restructure

- [x] Convert root `package.json` to npm workspaces (`apps/*`, `packages/*`)
- [x] Move the Vite app into `apps/web` (git mv, preserve history)
- [x] Extract `src/data/trade.ts` into `packages/shared` (types, corridor rule pack, cost tables, pricing engine, money formatting)
- [x] Root scripts: `dev`, `build`, `lint`, `test` fan out to workspaces

## Phase 1 — Shared domain package (`packages/shared`)

- [x] Domain types: corridors, products, quotes, invoices, orders, sales, partners, roles
- [x] Pricing engine: `calculateInvoice` + lot scaling as pure functions (used by API for authoritative totals, by web for instant previews)
- [x] Corridor rule pack + freight/mover cost tables + document packs as versioned config (`RULE_PACK_VERSION`)
- [x] Unit tests for the pricing engine (turnkey vs sourcing-only, escrow threshold, lot scaling, GST)

## Phase 2 — API service (`apps/api`)

**Foundation**
- [x] Fastify 5 + TypeScript, pino structured logging with request IDs
- [x] Env validation at boot (fail fast on missing `DATABASE_URL`, `SESSION_SECRET`)
- [x] Prisma + PostgreSQL: `User`, `Session`, `Product`, `PriceRevision`, `Quote`, `Order`, `SellerSale`, `LogisticsPartner`
- [x] Migration + seed script (demo users with hashed passwords, catalogue, sales, partners)

**Auth & RBAC**
- [x] `POST /api/auth/login` (email + password, bcrypt), DB-backed session token in httpOnly SameSite cookie
- [x] `GET /api/auth/me`, `POST /api/auth/logout`
- [x] Role guards (buyer / seller / admin); actor + tenant always derived from the server session

**Domain endpoints (server computes everything money-related)**
- [x] `GET /api/catalogue` — buyer-masked listings (no seller identity), delivered-price included
- [x] `POST /api/quotes` — server-priced, expiring quote snapshot (product, lots, tiers, fulfilment)
- [x] `POST /api/orders` — accepts a quote ID only, never client totals; immutable invoice snapshot; simulated payment → `secured`
- [x] `GET /api/orders` — buyer sees own; seller sees own products' orders (buyer anonymised); admin sees all
- [x] Seller: `GET /api/seller/products`, `PATCH /api/seller/products/:id/price` (ownership check, required reason, optimistic-lock version, audit row), `GET /api/seller/price-audits`, `GET /api/seller/sales` + `GET /api/seller/sales.csv` (server-generated, injection-safe)
- [x] Admin: `GET /api/admin/logistics-partners`, `GET /api/admin/sales-exceptions`, `GET /api/admin/price-audits`

**Traffic management**
- [x] `@fastify/helmet` security headers, `@fastify/cors` locked to configured origin
- [x] `@fastify/rate-limit` — global per-IP limit + stricter bucket on `/api/auth/login`
- [x] `@fastify/under-pressure` load shedding + `/healthz` (liveness) and `/readyz` (DB-checked readiness)
- [x] Stateless process (sessions in DB) so replicas scale horizontally
- [x] Graceful shutdown (drain in-flight requests, close DB pool)
- [x] Integration tests against real Postgres (auth, RBAC, quote→order flow, seller pricing rules)

## Phase 3 — Web app refactor (`apps/web`)

- [x] Split `App.tsx` monolith into `pages/`, `components/`, `api/`, `auth/` modules
- [x] Typed API client (cookie credentials, error normalisation)
- [x] Real login page posting credentials (demo one-click buttons kept, now with real seeded accounts); session restored via `/api/auth/me`
- [x] Catalogue, orders, seller centre, admin console read from the API instead of static data / localStorage
- [x] Buy box: instant previews via shared pricing engine; cart→checkout locks a server quote; “Buy through GCTC” submits the quote ID and lands on real orders
- [x] Seller price update calls the API (reason + optimistic lock), audit list from API, CSV export via server endpoint
- [x] Remove localStorage catalogue store and client-side role switching as an authority source

## Phase 4 — Deployment & traffic

- [x] `apps/api/Dockerfile` — multi-stage build, non-root user, `prisma migrate deploy` on start
- [x] `apps/web/Dockerfile` — Vite build → nginx: gzip, immutable asset caching, SPA fallback, `/api` reverse proxy
- [x] `docker-compose.yml` — postgres (healthchecked volume), api, web; `--scale api=N` round-robins via nginx
- [x] `.env.example` + config documentation
- [x] CI (GitHub Actions): lint, typecheck, shared tests, API integration tests with a Postgres service, builds
- [x] Update `README.md` / `ARCHITECTURE.md`; retire stale `vercel.json` static-only instructions

## Phase 5 — Verification

- [x] `npm run test` green (9 pricing tests + 16 API integration tests)
- [x] `npm run build` green across workspaces
- [x] Browser walkthrough on the dev stack: login as all three roles, browse, quote, checkout (order `GCTC-A2B661`), seller price change with audit, admin console
- [x] `docker compose --profile app up` verified through nginx with curl: seed on boot, login → quote → order (`GCTC-BB3615`), quote replay blocked (409), login rate limit (429 on 11th attempt), `/healthz` + `/readyz`, CSP/security headers
- [x] Horizontal scale: `--scale api=3` → requests distributed across all replicas (7/13/11 of 30), DB-backed session honoured on 12/12 requests across replicas

---

### Deliberately deferred (documented, not built now)

Real payment provider (Razorpay/Stripe) integration, object storage for trade documents,
queue workers, OpenSearch, multi-region — the API is structured so these bolt on without
reshaping the domain model (see ARCHITECTURE.md).
