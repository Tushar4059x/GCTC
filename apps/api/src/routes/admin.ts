import type { FastifyInstance } from 'fastify'
import { toLogisticsPartner, toPriceRevision, toSellerSale } from '../lib/serializers.ts'

export async function adminRoutes(app: FastifyInstance) {
  const adminOnly = { preHandler: app.requireRole('admin') }

  app.get('/logistics-partners', adminOnly, async () => {
    const partners = await app.prisma.logisticsPartner.findMany({ orderBy: { id: 'asc' } })
    return { partners: partners.map(toLogisticsPartner) }
  })

  app.get('/sales-exceptions', adminOnly, async () => {
    const sales = await app.prisma.sellerSale.findMany({
      where: { OR: [{ qualityStatus: { not: 'passed' } }, { disputeCount: { gt: 0 } }] },
      include: { product: true },
      orderBy: { soldAt: 'desc' },
    })
    return {
      exceptions: sales.map((sale) => ({ ...toSellerSale(sale), sellerId: sale.sellerId })),
    }
  })

  app.get('/price-audits', adminOnly, async () => {
    const revisions = await app.prisma.priceRevision.findMany({
      include: { product: true },
      orderBy: { effectiveAt: 'desc' },
      take: 200,
    })
    return { audits: revisions.map(toPriceRevision) }
  })

  app.get('/metrics', adminOnly, async () => {
    const [salesSum, ordersSum, exceptionCount, partnerCount] = await Promise.all([
      app.prisma.sellerSale.aggregate({ _sum: { amount: true } }),
      app.prisma.order.aggregate({ _sum: { totalAmount: true } }),
      app.prisma.sellerSale.count({
        where: { OR: [{ qualityStatus: { not: 'passed' } }, { disputeCount: { gt: 0 } }] },
      }),
      app.prisma.logisticsPartner.count(),
    ])
    return {
      metrics: {
        gmvPipeline: (salesSum._sum.amount ?? 0) + (ordersSum._sum.totalAmount ?? 0),
        exceptionCount,
        partnerCount,
      },
    }
  })
}
