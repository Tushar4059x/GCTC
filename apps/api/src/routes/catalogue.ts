import type { FastifyInstance } from 'fastify'
import type { Product } from '@prisma/client'
import { getCorridor } from '@gctc/shared'
import { toCatalogueItem } from '../lib/serializers.ts'

function matchesQuery(product: Product, query: string): boolean {
  if (!query) return true
  const corridor = getCorridor(product.corridorId)
  const haystack = [
    product.name,
    product.category,
    product.state,
    product.origin,
    product.unit,
    product.availableQty,
    product.specs.join(' '),
    product.certifications.join(' '),
    corridor.from,
    corridor.to,
    corridor.searchTerms.join(' '),
  ]
    .join(' ')
    .toLowerCase()

  return query
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .every((term) => haystack.includes(term))
}

export async function catalogueRoutes(app: FastifyInstance) {
  app.get<{ Querystring: { query?: string } }>('/catalogue', async (request, reply) => {
    const query = (request.query.query ?? '').slice(0, 200)
    const products = await app.prisma.product.findMany({ orderBy: { name: 'asc' } })
    const items = products.filter((product) => matchesQuery(product, query)).map(toCatalogueItem)
    // Short private cache keeps repeat navigation cheap without letting a
    // shared cache serve seller-priced data across users.
    reply.header('cache-control', 'private, max-age=30')
    return { items }
  })
}
