import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { RULE_PACK_VERSION, calculateInvoice, getCorridor } from '@gctc/shared'
import { badRequest, notFound } from '../lib/errors.ts'

const quoteSchema = z.object({
  productId: z.string().min(1),
  lots: z.number().int().min(1).max(10),
  freightTier: z.enum(['normal', 'urgent']),
  moverTier: z.enum(['normal', 'urgent']),
  fulfilment: z.enum(['sourcing-only', 'turnkey']),
})

export async function quoteRoutes(app: FastifyInstance) {
  app.post('/quotes', { preHandler: [app.authenticate] }, async (request) => {
    const parsed = quoteSchema.safeParse(request.body)
    if (!parsed.success) throw badRequest(parsed.error.issues[0]?.message ?? 'Invalid quote request')
    const { productId, lots, freightTier, moverTier, fulfilment } = parsed.data

    const product = await app.prisma.product.findUnique({ where: { id: productId } })
    if (!product) throw notFound('Product not found')

    const corridor = getCorridor(product.corridorId)
    const totals = calculateInvoice({
      corridorId: product.corridorId,
      basePrice: product.basePrice,
      lots,
      freightTier,
      moverTier,
      fulfilment,
    })

    const quote = await app.prisma.quote.create({
      data: {
        buyerId: request.currentUser!.id,
        productId,
        lots,
        freightTier,
        moverTier,
        fulfilment,
        currency: corridor.currency,
        totals: totals as unknown as Record<string, number>,
        totalAmount: totals.total,
        rulePackVersion: RULE_PACK_VERSION,
        priceVersion: product.priceVersion,
        expiresAt: new Date(Date.now() + app.config.QUOTE_TTL_MINUTES * 60 * 1000),
      },
    })

    return {
      quote: {
        id: quote.id,
        productId,
        productName: product.name,
        lots,
        freightTier,
        moverTier,
        fulfilment,
        currency: quote.currency,
        totals,
        rulePackVersion: quote.rulePackVersion,
        priceVersion: quote.priceVersion,
        expiresAt: quote.expiresAt.toISOString(),
      },
    }
  })
}
