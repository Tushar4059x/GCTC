# Architecture

## MVP Shape

This repository starts as a React + TypeScript PWA because it gives the fastest path to a working responsive web and mobile-like surface. The domain model is split into typed corridor, catalogue, compliance, logistics, and invoice data so each can become an API-backed module without changing the product workflow.

## Production Services

1. Identity and access: buyer, supplier, operator, compliance reviewer, and finance roles with MFA for operators.
2. Catalogue service: anonymised buyer view, private supplier view, verification state, certifications, product lots, and service scopes.
3. Corridor intelligence service: trade scores, compliance rules, allowed categories, authority references, duty/VAT/GST rates, and risk controls.
4. Quote service: freight, packers/movers, insurance, SLA, normal/urgent tiers, and quote expiry.
5. Invoice service: immutable priced snapshot with taxes, duties, platform margin, and escrow rules.
6. Payment service: provider payment intent, reconciliation, refunds, settlement, and escrow release workflow.
7. Document service: private trade document storage, scanning, versioning, watermarking, and signed access.
8. AI concierge service: controlled assistant that orchestrates the services above and never receives private supplier contact data unless the user role permits it.

## Data Boundaries

- Buyer catalogue responses must not include supplier phone, email, address, or direct identity.
- Supplier identity data should live in separate tables with explicit operator-only policy checks.
- Invoice snapshots should store computed values, rates used, source version, and audit metadata.
- Compliance rule changes should be versioned so old invoices remain explainable.

## Scale Path

- Start with one Postgres database and modular service boundaries in code.
- Add queue workers for slow integrations: logistics quote refresh, document checks, compliance updates, payment reconciliation.
- Add read replicas/search service when catalogue reads exceed primary DB comfort.
- Introduce country/category rule packs so new regions can be added as data, not new code paths.
