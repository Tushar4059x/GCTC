import { createHash, randomBytes } from 'node:crypto'
import type { FastifyInstance, FastifyReply, FastifyRequest, preHandlerHookHandler } from 'fastify'
import type { Role, SessionUserDTO } from '@gctc/shared'
import { forbidden, unauthorized } from '../lib/errors.ts'

export const SESSION_COOKIE = 'gctc_session'

export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}

export function newSessionToken(): string {
  return randomBytes(32).toString('hex')
}

declare module 'fastify' {
  interface FastifyRequest {
    currentUser: SessionUserDTO | null
  }
  interface FastifyInstance {
    authenticate: preHandlerHookHandler
    requireRole: (...roles: Role[]) => preHandlerHookHandler[]
  }
}

export function registerAuth(app: FastifyInstance) {
  app.decorateRequest('currentUser', null)

  // Resolve the session on every request so public routes can also
  // personalise responses when a valid cookie is present.
  app.addHook('preHandler', async (request: FastifyRequest) => {
    const raw = request.cookies[SESSION_COOKIE]
    if (!raw) return
    const unsigned = request.unsignCookie(raw)
    if (!unsigned.valid || !unsigned.value) return

    const session = await app.prisma.session.findUnique({
      where: { tokenHash: hashToken(unsigned.value) },
      include: { user: true },
    })
    if (!session || session.expiresAt <= new Date()) return

    request.currentUser = {
      id: session.user.id,
      name: session.user.name,
      email: session.user.email,
      role: session.user.role,
      organization: session.user.organization,
    }
  })

  app.decorate('authenticate', async (request: FastifyRequest) => {
    if (!request.currentUser) throw unauthorized()
  })

  app.decorate('requireRole', (...roles: Role[]) => [
    app.authenticate,
    async (request: FastifyRequest, _reply: FastifyReply) => {
      const user = request.currentUser
      if (!user) throw unauthorized()
      if (!roles.includes(user.role)) {
        throw forbidden(`This action requires ${roles.join(' or ')} permission`)
      }
    },
  ])
}
