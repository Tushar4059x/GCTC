import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { badRequest, unauthorized } from '../lib/errors.ts'
import { verifyPassword } from '../lib/passwords.ts'
import { SESSION_COOKIE, hashToken, newSessionToken } from '../plugins/auth.ts'

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1).max(200),
})

export async function authRoutes(app: FastifyInstance) {
  app.post(
    '/login',
    {
      config: {
        rateLimit: { max: app.config.LOGIN_RATE_LIMIT_MAX, timeWindow: '1 minute' },
      },
    },
    async (request, reply) => {
      const parsed = loginSchema.safeParse(request.body)
      if (!parsed.success) throw badRequest('Provide a valid email and password')
      const { email, password } = parsed.data

      const user = await app.prisma.user.findUnique({ where: { email } })
      const valid = user && (await verifyPassword(password, user.passwordHash))
      if (!user || !valid) throw unauthorized('Incorrect email or password')

      const token = newSessionToken()
      const expiresAt = new Date(Date.now() + app.config.SESSION_TTL_HOURS * 3600 * 1000)
      await app.prisma.$transaction([
        app.prisma.session.deleteMany({ where: { userId: user.id, expiresAt: { lte: new Date() } } }),
        app.prisma.session.create({ data: { tokenHash: hashToken(token), userId: user.id, expiresAt } }),
      ])

      reply.setCookie(SESSION_COOKIE, token, {
        path: '/',
        httpOnly: true,
        sameSite: 'lax',
        secure: app.config.NODE_ENV === 'production',
        signed: true,
        maxAge: app.config.SESSION_TTL_HOURS * 3600,
      })

      return {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          organization: user.organization,
        },
      }
    },
  )

  app.get('/me', async (request) => ({ user: request.currentUser }))

  app.post('/logout', async (request, reply) => {
    const raw = request.cookies[SESSION_COOKIE]
    if (raw) {
      const unsigned = request.unsignCookie(raw)
      if (unsigned.valid && unsigned.value) {
        await app.prisma.session.deleteMany({ where: { tokenHash: hashToken(unsigned.value) } })
      }
    }
    reply.clearCookie(SESSION_COOKIE, { path: '/' })
    return { ok: true }
  })
}
