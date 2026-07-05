import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { badRequest, conflict, notFound } from '../lib/errors.ts'
import { salesToCsv, toPriceRevision, toSellerProduct, toSellerSale } from '../lib/serializers.ts'

const priceUpdateSchema = z.object({
  newPrice: z.number().int().min(1).max(100_000_000),
  reason: z.string().trim().min(3, 'A reason is required').max(120),
  expectedVersion: z.number().int().min(1),
})

export async function sellerRoutes(app: FastifyInstance) {
  const sellerOnly = { preHandler: app.requireRole('seller') }

  app.get('/products', sellerOnly, async (request) => {
    const products = await app.prisma.product.findMany({
      where: { sellerId: request.currentUser!.id },
      orderBy: { name: 'asc' },
    })
    return { products: products.map(toSellerProduct) }
  })

  app.patch<{ Params: { id: string } }>('/products/:id/price', sellerOnly, async (request) => {
    const parsed = priceUpdateSchema.safeParse(request.body)
    if (!parsed.success) throw badRequest(parsed.error.issues[0]?.message ?? 'Invalid price update')
    const { newPrice, reason, expectedVersion } = parsed.data
    const sellerId = request.currentUser!.id
    const productId = request.params.id

    const updated = await app.prisma.$transaction(async (tx) => {
      const product = await tx.product.findFirst({ where: { id: productId, sellerId } })
      if (!product) throw notFound('This product is not in your listings')

      const result = await tx.product.updateMany({
        where: { id: productId, sellerId, priceVersion: expectedVersion },
        data: {
          basePrice: newPrice,
          priceVersion: { increment: 1 },
          priceUpdatedAt: new Date(),
        },
      })
      if (result.count === 0) {
        throw conflict('VERSION_CONFLICT', 'This listing was updated elsewhere. Refresh and try again.')
      }

      await tx.priceRevision.create({
        data: {
          productId,
          sellerId,
          previousPrice: product.basePrice,
          newPrice,
          reason,
        },
      })

      // A price change invalidates any open quotes so buyers can never
      // check out against a superseded offer.
      await tx.quote.updateMany({
        where: { productId, status: 'active' },
        data: { status: 'expired' },
      })

      return tx.product.findUniqueOrThrow({ where: { id: productId } })
    })

    return { product: toSellerProduct(updated) }
  })

  app.get('/price-audits', sellerOnly, async (request) => {
    const revisions = await app.prisma.priceRevision.findMany({
      where: { sellerId: request.currentUser!.id },
      include: { product: true },
      orderBy: { effectiveAt: 'desc' },
      take: 100,
    })
    return { audits: revisions.map(toPriceRevision) }
  })

  app.get('/sales', sellerOnly, async (request) => {
    const sales = await app.prisma.sellerSale.findMany({
      where: { sellerId: request.currentUser!.id },
      include: { product: true },
      orderBy: { soldAt: 'desc' },
    })
    return { sales: sales.map(toSellerSale) }
  })

  app.get('/sales.csv', sellerOnly, async (request, reply) => {
    const sales = await app.prisma.sellerSale.findMany({
      where: { sellerId: request.currentUser!.id },
      include: { product: true },
      orderBy: { soldAt: 'desc' },
    })
    const filename = `gctc-seller-sales-${new Date().toISOString().slice(0, 10)}.csv`
    reply
      .header('content-type', 'text/csv; charset=utf-8')
      .header('content-disposition', `attachment; filename="${filename}"`)
    return salesToCsv(sales.map(toSellerSale))
  })
}
