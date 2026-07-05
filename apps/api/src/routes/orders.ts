import { randomBytes } from 'node:crypto'
import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { getCorridor, requiresEscrow } from '@gctc/shared'
import { badRequest, conflict } from '../lib/errors.ts'
import { toOrder } from '../lib/serializers.ts'

const checkoutSchema = z.object({
  quoteId: z.string().min(1),
})

function generateOrderId(): string {
  return `GCTC-${randomBytes(3).toString('hex').toUpperCase()}`
}

export async function orderRoutes(app: FastifyInstance) {
  // Checkout accepts a quote ID only — totals always come from the
  // server-priced snapshot, never from the client.
  app.post('/orders', { preHandler: [app.authenticate] }, async (request, reply) => {
    const parsed = checkoutSchema.safeParse(request.body)
    if (!parsed.success) throw badRequest('Provide the quote to check out')
    const { quoteId } = parsed.data
    const buyerId = request.currentUser!.id

    const order = await app.prisma.$transaction(async (tx) => {
      const claimed = await tx.quote.updateMany({
        where: { id: quoteId, buyerId, status: 'active', expiresAt: { gt: new Date() } },
        data: { status: 'consumed' },
      })
      if (claimed.count === 0) {
        throw conflict('QUOTE_INVALID', 'This quote has expired or was already used. Request a fresh quote.')
      }

      const quote = await tx.quote.findUniqueOrThrow({
        where: { id: quoteId },
        include: { product: true },
      })
      if (quote.product.priceVersion !== quote.priceVersion) {
        throw conflict('QUOTE_STALE', 'The seller price changed after this quote was issued. Request a fresh quote.')
      }

      const corridor = getCorridor(quote.product.corridorId)
      return tx.order.create({
        data: {
          id: generateOrderId(),
          buyerId,
          productId: quote.productId,
          sellerId: quote.product.sellerId,
          quoteId,
          lots: quote.lots,
          fulfilment: quote.fulfilment,
          freightTier: quote.freightTier,
          moverTier: quote.moverTier,
          currency: quote.currency,
          totals: quote.totals as object,
          totalAmount: quote.totalAmount,
          status: 'Payment received',
          paymentStatus: requiresEscrow(corridor) ? 'escrow-secured' : 'secured',
          corridorLabel: `${corridor.from} to ${corridor.to}`,
        },
        include: { product: true },
      })
    })

    reply.code(201)
    return { order: toOrder(order, request.currentUser!) }
  })

  app.get('/orders', { preHandler: [app.authenticate] }, async (request) => {
    const user = request.currentUser!
    const where =
      user.role === 'admin'
        ? {}
        : user.role === 'seller'
          ? { sellerId: user.id }
          : { buyerId: user.id }

    const orders = await app.prisma.order.findMany({
      where,
      include: { product: true },
      orderBy: { createdAt: 'desc' },
      take: 100,
    })
    return { orders: orders.map((order) => toOrder(order, user)) }
  })
}
