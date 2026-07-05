import type { FastifyInstance } from 'fastify'

export async function healthRoutes(app: FastifyInstance) {
  // Liveness: the process is up and the event loop responds.
  app.get('/healthz', { config: { rateLimit: false } }, async () => ({ status: 'ok' }))

  // Readiness: only route traffic here once the database answers.
  app.get('/readyz', { config: { rateLimit: false } }, async (_request, reply) => {
    try {
      await app.prisma.$queryRaw`SELECT 1`
      return { status: 'ready' }
    } catch {
      reply.code(503)
      return { status: 'unavailable' }
    }
  })
}
