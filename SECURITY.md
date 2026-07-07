# Security Model

## Implemented Controls

- Authentication is server-side: Django's password hasher (PBKDF2), DB-backed sessions in
  httpOnly SameSite=Lax cookies (Secure in production). Logout revokes the session.
- CSRF: DRF SessionAuthentication + Django's CsrfViewMiddleware enforce a double-submit
  token. The token cookie (`gctc_csrftoken`) is issued on load and echoed in the
  `X-CSRFToken` header on every mutating request; requests without a valid token are
  rejected (403). SameSite=Lax is a second, independent control, not the only one.
- Every route derives actor and tenant from the server session; role guards protect
  seller and admin surfaces. The client never supplies `seller_id` or totals.
- All money is computed server-side: quotes are expiring server-priced snapshots, and
  checkout accepts only a quote ID. A seller price change bumps an optimistic-lock
  version, writes an append-only price revision (actor, reason, old/new, timestamp), and
  expires open quotes for that product.
- Supplier anonymity is enforced in API serialization: buyer catalogue payloads carry no
  seller identity; seller order/report views get anonymised buyer references; the
  logistics partner directory is admin-only.
- Rate limiting is per real client IP (DRF `NUM_PROXIES` takes the trusted proxy hop, so
  `X-Forwarded-For` cannot be spoofed to mint fresh buckets), with a stricter bucket on
  login. Counters live in a Postgres-backed cache so limits hold cluster-wide across
  gunicorn workers and replicas.
- Seller CSV exports are generated server-side with spreadsheet-formula injection
  escaping.
- Security headers are set at nginx for every browser-visible response: CSP, HSTS
  (`max-age=63072000; includeSubDomains; preload`), nosniff, frame denial, referrer and
  permissions policies. Django adds nosniff and frame denial defensively. The service
  worker never caches `/api` responses.
- Deployment hygiene: PostgreSQL is bound to loopback only (never published to external
  interfaces) and `POSTGRES_PASSWORD` is required (no default). Python dependencies are
  installed from a pip-compile lock with pinned versions and hashes (`--require-hashes`).
  Secrets and local env files are kept out of image layers by `.dockerignore`.
- Order IDs carry 48 bits of randomness — not sequentially guessable or enumerable.
- Payment capture is still simulated — no card or bank data is collected. Session
  secrets and database credentials come from the environment, never the repository.

## Production Requirements

- Use server-side authorization for every API route and server action.
- Enforce `product.seller_id = session.seller_id` for seller catalogue writes. Admin review access must not silently grant seller impersonation.
- Apply row-level security or equivalent policy checks for tenant, role, and state-route access.
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
- Human review should be required before onboarding suppliers, changing state compliance rule packs, or releasing protected payments on high-risk routes.

## Deployment Gates

Do not treat the Vite demo as transaction-ready until production authentication, Postgres tenant policies, server-signed quotes, private document storage, payment reconciliation, audit logs, malware scanning, rate limits, backups, monitoring, and incident response are implemented and independently tested.
