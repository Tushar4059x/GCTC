import Fastify, { type FastifyError, type FastifyInstance } from 'fastify'
import cookie from '@fastify/cookie'
import cors from '@fastify/cors'
import helmet from '@fastify/helmet'
import rateLimit from '@fastify/rate-limit'
import underPressure from '@fastify/under-pressure'
import { PrismaClient } from '@prisma/client'
import type { Env } from './env.ts'
import { AppError } from './lib/errors.ts'
import { registerAuth } from './plugins/auth.ts'
import { adminRoutes } from './routes/admin.ts'
import { authRoutes } from './routes/auth.ts'
import { catalogueRoutes } from './routes/catalogue.ts'
import { healthRoutes } from './routes/health.ts'
import { orderRoutes } from './routes/orders.ts'
import { quoteRoutes } from './routes/quotes.ts'
import { sellerRoutes } from './routes/seller.ts'

declare module 'fastify' {
  interface FastifyInstance {
    prisma: PrismaClient
    config: Env
  }
}

export async function buildApp(env: Env): Promise<FastifyInstance> {
  const app = Fastify({
    logger: {
      level: env.LOG_LEVEL,
      redact: ['req.headers.cookie', 'req.headers.authorization'],
    },
    trustProxy: env.TRUST_PROXY,
    requestIdHeader: 'x-request-id',
    disableRequestLogging: env.NODE_ENV === 'test',
  })

  const prisma = new PrismaClient({ datasourceUrl: env.DATABASE_URL })
  app.decorate('prisma', prisma)
  app.decorate('config', env)
  app.addHook('onClose', async () => {
    await prisma.$disconnect()
  })

  await app.register(helmet, { contentSecurityPolicy: false })
  if (env.CORS_ORIGIN) {
    await app.register(cors, {
      origin: env.CORS_ORIGIN.split(',').map((origin) => origin.trim()),
      credentials: true,
    })
  }
  await app.register(cookie, { secret: env.SESSION_SECRET })
  await app.register(rateLimit, {
    max: env.RATE_LIMIT_MAX,
    timeWindow: '1 minute',
    hook: 'onRequest',
  })
  if (env.NODE_ENV === 'production') {
    // Shed load instead of queueing unbounded work when a replica saturates.
    await app.register(underPressure, {
      maxEventLoopDelay: 1000,
      maxHeapUsedBytes: 1_500_000_000,
      message: 'Service under heavy load, please retry shortly',
      retryAfter: 10,
    })
  }

  registerAuth(app)

  app.setErrorHandler((error: FastifyError | AppError, request, reply) => {
    if (error instanceof AppError) {
      return reply
        .code(error.statusCode)
        .send({ statusCode: error.statusCode, error: error.code, message: error.message })
    }
    const statusCode = typeof error.statusCode === 'number' ? error.statusCode : 500
    if (statusCode >= 500) {
      request.log.error({ err: error }, 'unhandled error')
      return reply
        .code(500)
        .send({ statusCode: 500, error: 'INTERNAL', message: 'Something went wrong on our side' })
    }
    return reply
      .code(statusCode)
      .send({ statusCode, error: error.name ?? 'ERROR', message: error.message })
  })

  await app.register(healthRoutes)
  await app.register(authRoutes, { prefix: '/api/auth' })
  await app.register(catalogueRoutes, { prefix: '/api' })
  await app.register(quoteRoutes, { prefix: '/api' })
  await app.register(orderRoutes, { prefix: '/api' })
  await app.register(sellerRoutes, { prefix: '/api/seller' })
  await app.register(adminRoutes, { prefix: '/api/admin' })

  return app
}
