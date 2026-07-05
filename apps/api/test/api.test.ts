import type { FastifyInstance } from 'fastify'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { DEMO_PASSWORD, calculateInvoice } from '@gctc/shared'
import { buildApp } from '../src/app.ts'
import { loadEnv } from '../src/env.ts'
import { seedDatabase } from '../prisma/seedDatabase.ts'
import { TEST_DATABASE_URL } from './globalSetup.ts'

let app: FastifyInstance

// Each helper login comes from a distinct client IP so suite-wide logins
// don't trip the per-IP login rate limit that a dedicated test exercises.
let loginCounter = 0

async function login(email: string, password = DEMO_PASSWORD): Promise<string> {
  loginCounter += 1
  const response = await app.inject({
    method: 'POST',
    url: '/api/auth/login',
    remoteAddress: `10.1.0.${loginCounter}`,
    payload: { email, password },
  })
  expect(response.statusCode).toBe(200)
  const setCookie = response.headers['set-cookie']
  const header = Array.isArray(setCookie) ? setCookie[0] : setCookie
  return header!.split(';')[0]
}

beforeAll(async () => {
  app = await buildApp(
    loadEnv({
      NODE_ENV: 'test',
      DATABASE_URL: TEST_DATABASE_URL,
      SESSION_SECRET: 'integration-test-secret-with-32-plus-characters',
      LOG_LEVEL: 'error',
    }),
  )
  const tables = [
    'sessions',
    'price_revisions',
    'orders',
    'quotes',
    'seller_sales',
    'products',
    'users',
    'logistics_partners',
  ]
  await app.prisma.$executeRawUnsafe(`TRUNCATE TABLE ${tables.map((t) => `"${t}"`).join(', ')} CASCADE`)
  await seedDatabase(app.prisma)
})

afterAll(async () => {
  await app.close()
})

describe('health', () => {
  it('reports liveness and readiness', async () => {
    const live = await app.inject({ method: 'GET', url: '/healthz' })
    expect(live.statusCode).toBe(200)
    const ready = await app.inject({ method: 'GET', url: '/readyz' })
    expect(ready.statusCode).toBe(200)
    expect(ready.json()).toEqual({ status: 'ready' })
  })
})

describe('catalogue', () => {
  it('is public, masked, and priced server-side', async () => {
    const response = await app.inject({ method: 'GET', url: '/api/catalogue' })
    expect(response.statusCode).toBe(200)
    const { items } = response.json()
    expect(items).toHaveLength(7)
    for (const item of items) {
      expect(item).not.toHaveProperty('sellerId')
      expect(item.deliveredPrice).toBeGreaterThan(item.basePrice)
    }
  })

  it('supports multi-term search', async () => {
    const response = await app.inject({ method: 'GET', url: '/api/catalogue?query=turmeric%20telangana' })
    const { items } = response.json()
    expect(items).toHaveLength(1)
    expect(items[0].id).toBe('turmeric-telangana')
  })
})

describe('auth', () => {
  it('rejects wrong credentials', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: { email: 'buyer@gctc.demo', password: 'wrong' },
    })
    expect(response.statusCode).toBe(401)
  })

  it('logs in and resolves the session', async () => {
    const cookie = await login('buyer@gctc.demo')
    const me = await app.inject({ method: 'GET', url: '/api/auth/me', headers: { cookie } })
    expect(me.json().user).toMatchObject({ id: 'buyer-1', role: 'buyer' })
  })

  it('logs out and invalidates the session', async () => {
    const cookie = await login('buyer@gctc.demo')
    await app.inject({ method: 'POST', url: '/api/auth/logout', headers: { cookie } })
    const me = await app.inject({ method: 'GET', url: '/api/auth/me', headers: { cookie } })
    expect(me.json().user).toBeNull()
  })
})

describe('quotes and orders', () => {
  it('requires authentication to quote', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/quotes',
      payload: { productId: 'cashew-maharashtra', lots: 1, freightTier: 'normal', moverTier: 'normal', fulfilment: 'turnkey' },
    })
    expect(response.statusCode).toBe(401)
  })

  it('prices quotes with the shared engine and checks out by quote id only', async () => {
    const cookie = await login('buyer@gctc.demo')
    const quoteResponse = await app.inject({
      method: 'POST',
      url: '/api/quotes',
      headers: { cookie },
      payload: { productId: 'cashew-maharashtra', lots: 2, freightTier: 'urgent', moverTier: 'normal', fulfilment: 'turnkey' },
    })
    expect(quoteResponse.statusCode).toBe(200)
    const { quote } = quoteResponse.json()
    const expected = calculateInvoice({
      corridorId: 'maharashtra-india',
      basePrice: 462000,
      lots: 2,
      freightTier: 'urgent',
      moverTier: 'normal',
      fulfilment: 'turnkey',
    })
    expect(quote.totals.total).toBeCloseTo(expected.total)

    const orderResponse = await app.inject({
      method: 'POST',
      url: '/api/orders',
      headers: { cookie },
      payload: { quoteId: quote.id },
    })
    expect(orderResponse.statusCode).toBe(201)
    const { order } = orderResponse.json()
    expect(order.totalAmount).toBeCloseTo(expected.total)
    expect(order.status).toBe('Payment received')
    expect(order.paymentStatus).toBe('secured')

    // A quote is single-use.
    const replay = await app.inject({
      method: 'POST',
      url: '/api/orders',
      headers: { cookie },
      payload: { quoteId: quote.id },
    })
    expect(replay.statusCode).toBe(409)

    const list = await app.inject({ method: 'GET', url: '/api/orders', headers: { cookie } })
    expect(list.json().orders.some((candidate: { id: string }) => candidate.id === order.id)).toBe(true)
  })

  it('anonymises the buyer on the seller order view', async () => {
    const sellerCookie = await login('seller@gctc.demo')
    const list = await app.inject({ method: 'GET', url: '/api/orders', headers: { cookie: sellerCookie } })
    expect(list.statusCode).toBe(200)
    for (const order of list.json().orders) {
      expect(order.buyerLabel).toMatch(/^Buyer account /)
    }
  })
})

describe('seller pricing', () => {
  it('lists only owned products', async () => {
    const cookie = await login('seller@gctc.demo')
    const response = await app.inject({ method: 'GET', url: '/api/seller/products', headers: { cookie } })
    const { products } = response.json()
    expect(products).toHaveLength(3)
    expect(products.every((product: { sellerId: string }) => product.sellerId === 'seller-1')).toBe(true)
  })

  it('rejects updates to another seller\'s product', async () => {
    const cookie = await login('seller@gctc.demo')
    const response = await app.inject({
      method: 'PATCH',
      url: '/api/seller/products/turmeric-telangana/price',
      headers: { cookie },
      payload: { newPrice: 190000, reason: 'Market adjustment', expectedVersion: 1 },
    })
    expect(response.statusCode).toBe(404)
  })

  it('applies optimistic locking, writes an audit row, and expires open quotes', async () => {
    const buyerCookie = await login('buyer@gctc.demo')
    const quoteResponse = await app.inject({
      method: 'POST',
      url: '/api/quotes',
      headers: { cookie: buyerCookie },
      payload: { productId: 'cocoa-andhra', lots: 1, freightTier: 'normal', moverTier: 'normal', fulfilment: 'turnkey' },
    })
    const quoteId = quoteResponse.json().quote.id

    const sellerCookie = await login('seller@gctc.demo')
    const stale = await app.inject({
      method: 'PATCH',
      url: '/api/seller/products/cocoa-andhra/price',
      headers: { cookie: sellerCookie },
      payload: { newPrice: 325000, reason: 'Cocoa futures moved', expectedVersion: 99 },
    })
    expect(stale.statusCode).toBe(409)

    const ok = await app.inject({
      method: 'PATCH',
      url: '/api/seller/products/cocoa-andhra/price',
      headers: { cookie: sellerCookie },
      payload: { newPrice: 325000, reason: 'Cocoa futures moved', expectedVersion: 1 },
    })
    expect(ok.statusCode).toBe(200)
    expect(ok.json().product).toMatchObject({ basePrice: 325000, priceVersion: 2 })

    const audits = await app.inject({ method: 'GET', url: '/api/seller/price-audits', headers: { cookie: sellerCookie } })
    expect(audits.json().audits[0]).toMatchObject({ previousPrice: 318000, newPrice: 325000 })

    // The buyer's earlier quote must no longer be checkout-able.
    const checkout = await app.inject({
      method: 'POST',
      url: '/api/orders',
      headers: { cookie: buyerCookie },
      payload: { quoteId },
    })
    expect(checkout.statusCode).toBe(409)
  })

  it('exports an injection-safe CSV report', async () => {
    const cookie = await login('seller@gctc.demo')
    const response = await app.inject({ method: 'GET', url: '/api/seller/sales.csv', headers: { cookie } })
    expect(response.statusCode).toBe(200)
    expect(response.headers['content-type']).toContain('text/csv')
    expect(response.body).toContain('SALE-2048')
  })
})

describe('rbac', () => {
  it('blocks buyers from seller and admin surfaces', async () => {
    const cookie = await login('buyer@gctc.demo')
    const seller = await app.inject({ method: 'GET', url: '/api/seller/products', headers: { cookie } })
    expect(seller.statusCode).toBe(403)
    const admin = await app.inject({ method: 'GET', url: '/api/admin/logistics-partners', headers: { cookie } })
    expect(admin.statusCode).toBe(403)
  })

  it('exposes the private logistics directory to admins only', async () => {
    const sellerCookie = await login('seller@gctc.demo')
    const denied = await app.inject({ method: 'GET', url: '/api/admin/logistics-partners', headers: { cookie: sellerCookie } })
    expect(denied.statusCode).toBe(403)

    const adminCookie = await login('admin@gctc.demo')
    const allowed = await app.inject({ method: 'GET', url: '/api/admin/logistics-partners', headers: { cookie: adminCookie } })
    expect(allowed.json().partners).toHaveLength(5)

    const exceptions = await app.inject({ method: 'GET', url: '/api/admin/sales-exceptions', headers: { cookie: adminCookie } })
    expect(exceptions.json().exceptions.map((sale: { id: string }) => sale.id)).toContain('SALE-2019')

    const metrics = await app.inject({ method: 'GET', url: '/api/admin/metrics', headers: { cookie: adminCookie } })
    expect(metrics.json().metrics.gmvPipeline).toBeGreaterThan(0)
  })
})

describe('traffic controls', () => {
  it('rate limits repeated login attempts', async () => {
    let lastStatus = 0
    for (let attempt = 0; attempt < 11; attempt += 1) {
      const response = await app.inject({
        method: 'POST',
        url: '/api/auth/login',
        remoteAddress: '10.99.0.42',
        payload: { email: 'buyer@gctc.demo', password: 'definitely-wrong' },
      })
      lastStatus = response.statusCode
    }
    expect(lastStatus).toBe(429)
  })
})
