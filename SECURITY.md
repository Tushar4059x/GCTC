# Security Model

## Current MVP Controls

- Supplier anonymity is enforced at the data-model level: buyer-facing catalogue items contain origin clusters and verification facts, not direct supplier contacts.
- Invoice numbers are computed from typed corridor data rather than free-form UI strings.
- The service worker caches only static shell assets and avoids invoice/document URL paths.
- Payment is simulated in the client; no card or bank data is collected in this MVP.
- Seller price edits are ownership-checked in the demo state and produce an audit entry, but browser code is not a production authorization boundary.
- Logistics contractor identities appear only on the admin screen; buyer screens receive GCTC-managed service scopes and totals.

## Production Requirements

- Use server-side authorization for every API route and server action.
- Enforce `product.seller_id = session.seller_id` for seller catalogue writes. Admin review access must not silently grant seller impersonation.
- Apply row-level security or equivalent policy checks for tenant, role, and corridor access.
- Encrypt sensitive supplier, payment, tax, and trade-document metadata at rest.
- Store documents in private object storage with short-lived signed URLs and malware scanning.
- Use a PCI-compliant payment provider; never store raw card/bank credentials.
- Sign invoice and payment intents server-side to prevent client-side price tampering.
- Keep immutable audit trails for catalogue verification, compliance decisions, invoice generation, payment events, and escrow release.
- Store append-only price revisions with actor, reason, old/new values, request ID, and effective timestamp.
- Return anonymised buyer references in seller reports and keep logistics legal names out of all buyer-facing payloads.
- Prevent spreadsheet-formula injection when production CSV exports include user-controlled data.
- Add rate limiting, bot protection, structured logging, and alerting for abnormal quote/payment/document access.
- Serve production builds with strict headers:
  - `Content-Security-Policy`
  - `Strict-Transport-Security`
  - `X-Content-Type-Options: nosniff`
  - `Referrer-Policy: strict-origin-when-cross-origin`
  - `Permissions-Policy`

## AI Concierge Safety

- The assistant should call deterministic tools for pricing, duties, compliance, and logistics.
- The assistant should not have access to supplier contact details in buyer sessions.
- All AI-generated recommendations should be traceable to rule versions, quote IDs, and compliance documents.
- Human review should be required before onboarding suppliers, changing compliance rule packs, or releasing escrow on high-risk corridors.

## Deployment Gates

Do not treat the Vite demo as transaction-ready until production authentication, Postgres tenant policies, server-signed quotes, private document storage, payment reconciliation, audit logs, malware scanning, rate limits, backups, monitoring, and incident response are implemented and independently tested.
