# Architecture

## Implemented shape

The repository is an npm-workspaces monorepo with three deployable/shareable units:

- `apps/api` — Django 5 + Django REST Framework + PostgreSQL. DB-backed cookie sessions,
  role guards, server-priced expiring quotes, orders created only from quote IDs, seller
  price revisions with optimistic locking and audit rows, admin-only logistics directory,
  cluster-wide per-IP rate limits (throttle counters in a Postgres-backed cache shared by
  every gunicorn worker and replica), `/healthz` + `/readyz`. The process is stateless:
  any replica can serve any request.
- `apps/web` — React + Vite PWA served by nginx in production (immutable asset caching,
  gzip, SPA fallback, `/api` reverse proxy with Docker-DNS round-robin across API
  replicas).
- `packages/shared` — domain types, the versioned India corridor rule pack
  (`RULE_PACK_VERSION`), and the TypeScript pricing engine the web app uses for instant
  previews. The API's authoritative totals come from a Python port
  (`apps/api/trade/pricing.py`) held to exact-value parity with the TypeScript engine by
  tests; rule changes must land in both.

Quotes and orders persist the rule-pack version and product price version they were
priced under, so historical invoices stay explainable when rules or prices change. The
current product scope is physical goods sourced across Indian states.

## Service roadmap

The sections below describe the fuller service decomposition this codebase is shaped to
grow into.

### Production Services

1. Identity and access: buyer, supplier, operator, compliance reviewer, and finance roles with MFA for operators.
2. Catalogue service: anonymised buyer view, private supplier view, verification state, certifications, state origin, and physical product lots.
3. State sourcing service: route scores, GST/e-way-bill rules, allowed categories, authority references, and risk controls.
4. Quote service: interstate transport, packing/handling, transit insurance, SLA, normal/urgent tiers, and quote expiry.
5. Invoice service: immutable priced snapshot with GST, platform margin, logistics costs, and payment-protection rules.
6. Payment service: provider payment intent, reconciliation, refunds, settlement, and escrow release workflow.
7. Document service: private trade document storage, scanning, versioning, watermarking, and signed access.
8. AI concierge service: controlled assistant that orchestrates the services above and never receives private supplier contact data unless the user role permits it.
9. Seller reporting service: immutable sales facts, quality outcomes, disputes, fulfilment scope, and export jobs scoped to one seller tenant.
10. Logistics operations service: private partner identities, capacity, service area, per-ton and distance tariffs, contract versions, and audit dates.

## Authorization Matrix

| Resource | Buyer | Seller | Admin/operator |
| --- | --- | --- | --- |
| Buyer catalogue listing | Read masked offer | Read own published offer | Read all |
| Product price | Read current GCTC offer | Update own products only | Review revisions, no seller impersonation |
| Price revision history | No access | Read own | Read all for audit |
| Buyer contact identity | Own account only | No access | Restricted support roles |
| Seller legal identity | No access | Own account only | Restricted KYB roles |
| Seller sales report | No access | Own sales only | Read all for quality review |
| Logistics contractor identity | No access | No access | Logistics/admin roles only |
| Logistics quote | Read GCTC quote | Read order scope only | Create and approve |

Every write must derive the actor and tenant from the server session. Never accept `seller_id`, platform margin, tariff, tax, or final invoice totals as trusted client input.

## Seller Pricing

- Store the current published offer separately from immutable price revisions.
- Accept updates only when `product.seller_id` matches the authenticated seller tenant.
- Require a reason, effective timestamp, currency, and optimistic-lock version.
- Recalculate buyer quotes server-side and expire old quotes when the product price version changes.
- Preserve the price and rule versions used on every order so completed sales remain explainable.

## Fulfilment Options

- `sourcing-only`: GCTC sources the agreed product, quality, quantity, and procurement frequency. Pickup, interstate transport, insurance, and final delivery are buyer responsibilities.
- `turnkey`: GCTC adds interstate transport, transit insurance, delivery coordination, packing/handling, approved logistics tariffs, and a service charge.
- The quote service returns an expiring, signed snapshot. Checkout accepts the quote ID, never client-calculated totals.

## India Trade Rule Pack

The common pack includes purchase order, GST tax invoice, packing list, e-way bill where applicable, quality/test reports, and transit insurance for GCTC delivery. Product rules add FSSAI verification and batch or commodity quality reports.

## Data Boundaries

- Buyer catalogue responses must not include supplier phone, email, address, or direct identity.
- Supplier identity data should live in separate tables with explicit operator-only policy checks.
- Logistics partner legal names and contracts should live in an operator-only schema; buyer APIs return GCTC service descriptions and quote totals only.
- Sales reports should use anonymised buyer references when returned to sellers.
- Invoice snapshots should store computed values, rates used, source version, and audit metadata.
- Compliance rule changes should be versioned so old invoices remain explainable.

## Scale Path

- Start with one Postgres database and modular service boundaries in code.
- Add queue workers for slow integrations: logistics quote refresh, document checks, compliance updates, payment reconciliation.
- Add read replicas/search service when catalogue reads exceed primary DB comfort.
- Introduce country/category rule packs so new regions can be added as data, not new code paths.
- Partition high-volume audit and sales-event tables by time only after measured growth warrants it; retain tenant indexes from day one.
- Generate large CSV reports asynchronously into private storage with short-lived download URLs.
