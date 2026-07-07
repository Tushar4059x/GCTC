# GCTC

GCTC, the Global Chamber of Trade and Commerce, is a full-stack B2B marketplace for
wholesale products sourced across Indian states: buyer marketplace, seller centre, and
admin console with server-enforced roles, server-priced quotes, and persisted orders.

## Architecture

npm-workspaces monorepo:

| Workspace | What it is |
| --- | --- |
| `apps/api` | Django 5 + Django REST Framework + PostgreSQL API. DB-backed sessions, RBAC, quotes, orders, seller pricing, admin operations, rate limiting, health checks. Stateless — scale it horizontally (gunicorn workers × container replicas). |
| `apps/web` | React 19 + Vite PWA. All data comes from the API; the TypeScript pricing engine renders instant previews before a server quote is locked. |
| `packages/shared` | Domain types, the versioned India corridor rule pack, and the TypeScript pricing engine used by the web app. The API carries a Python port (`trade/pricing.py`) pinned to it by exact-value parity tests. |

Key production behaviours:

- **Server-priced money.** The client never submits totals. Checkout accepts a quote ID;
  quotes are server-priced snapshots that expire (default 30 min) and are invalidated when
  a seller changes the price (optimistic-lock version + audit row).
- **Data boundaries.** Buyer catalogue responses exclude seller identity; sellers see
  anonymised buyer references; the logistics partner directory is admin-only.
- **Traffic management.** Per-IP rate limits (stricter on login), load shedding under
  pressure, `/healthz` + `/readyz` probes, DB-backed sessions so any replica can serve any
  request, graceful shutdown, nginx serving static assets with immutable caching and
  round-robin proxying to API replicas.

See [ARCHITECTURE.md](ARCHITECTURE.md), [SECURITY.md](SECURITY.md), and
[PRODUCTION_PLAN.md](PRODUCTION_PLAN.md) for the conversion checklist.

## Run locally (development)

Requires Node 20+, Python 3.12+, and PostgreSQL (either local, or `docker compose up -d postgres`).

```bash
npm install
npm run setup -w @gctc/api               # python venv + pip install
cp .env.example apps/api/.env            # adjust DATABASE_URL if needed
npm run db:migrate -w @gctc/api          # create schema
npm run db:seed -w @gctc/api             # demo users + catalogue
npm run dev                              # Django on :3000, web on :5173 (proxied /api)
```

`apps/api/.env` holds the API's development environment (see `.env.example`).

## Demo logins

All demo accounts use the password `gctc-demo`:

- Buyer: `buyer@gctc.demo`
- Seller: `seller@gctc.demo`
- Admin: `admin@gctc.demo`

Roles and every write are enforced by the API from the server session — switching roles
is a real login, not a client toggle.

## Deploy (Docker Compose)

```bash
cp .env.example .env    # set a strong SESSION_SECRET and POSTGRES_PASSWORD
docker compose --profile app up -d --build
```

- Web (nginx): http://localhost:8080 — serves the SPA, proxies `/api` to the API service.
- Seed demo data on first boot: set `SEED_ON_BOOT=true` in `.env` (or run
  `docker compose exec api python manage.py seed_demo`).
- Scale the API horizontally: `docker compose --profile app up -d --scale api=3` —
  nginx round-robins across replicas via Docker DNS; sessions live in Postgres so any
  replica can serve any request.
- Health probes: `GET /healthz` (liveness) and `GET /readyz` (readiness, checks the DB)
  on the API service.

The same images run on any container platform (Fly.io, Railway, Render, ECS, Cloud Run);
the API container applies `prisma migrate deploy` on start. For managed hosting of the
frontend alone, `vercel.json` builds `apps/web` — point `/api` at a hosted API via a
Vercel rewrite in that case.

## Tests & CI

```bash
npm run test        # TS pricing tests + Django API tests (needs Postgres + venv setup)
npm run typecheck
npm run lint
npm run build
```

Django tests create/destroy a `test_<db>` database automatically (the DB role needs
`CREATEDB`). The Python pricing port is pinned to the TypeScript engine by exact-value
parity tests — a rule-pack change that isn't mirrored in both fails the suite. GitHub
Actions runs the Node job (lint, typecheck, shared tests, builds), the Django job against
a Postgres service, and both Docker image builds ([ci.yml](.github/workflows/ci.yml)).

## API surface

| Method & path | Access | Purpose |
| --- | --- | --- |
| `POST /api/auth/login` · `/logout` · `GET /api/auth/me` | public / session | Cookie sessions (httpOnly, signed) |
| `GET /api/catalogue?query=` | public | Masked listings with server-computed delivered price |
| `POST /api/quotes` | signed in | Expiring server-priced quote snapshot |
| `POST /api/orders` | signed in | Checkout by quote ID; immutable invoice snapshot |
| `GET /api/orders` | role-scoped | Buyer: own · seller: own products, buyer anonymised · admin: all |
| `GET /api/seller/products` · `PATCH /api/seller/products/:id/price` | seller | Own listings; price change needs reason + version, writes audit, expires open quotes |
| `GET /api/seller/sales` · `/sales.csv` · `/price-audits` | seller | Reports (CSV generated server-side, injection-safe) |
| `GET /api/admin/logistics-partners` · `/sales-exceptions` · `/price-audits` · `/metrics` | admin | Private operations desk |

## Prototype image sources

Product photos are local assets under `apps/web/public/product-images`, sourced from
Wikimedia Commons file pages (cashews, cocoa, sesame, turmeric, millet, cardamom, coffee).

## Deliberately deferred

Payment provider integration (Razorpay/Stripe), document object storage, queue workers,
search service, multi-region. The domain model and API boundaries are shaped so these
bolt on without restructuring — see ARCHITECTURE.md.
