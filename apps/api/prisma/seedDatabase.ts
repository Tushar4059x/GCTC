import { randomBytes } from 'node:crypto'
import type { PrismaClient } from '@prisma/client'
import {
  demoUsers,
  logisticsPartnerSeeds,
  productSeeds,
  sellerSaleSeeds,
} from '@gctc/shared'
import { hashPassword } from '../src/lib/passwords.ts'

export async function seedDatabase(prisma: PrismaClient) {
  for (const user of demoUsers) {
    // Internal seller tenants get an unguessable password: they exist for
    // ownership records, not for logging in.
    const password = user.demoPassword ?? randomBytes(24).toString('hex')
    const passwordHash = await hashPassword(password)
    await prisma.user.upsert({
      where: { id: user.id },
      update: { name: user.name, email: user.email, role: user.role, organization: user.organization },
      create: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        organization: user.organization,
        passwordHash,
      },
    })
  }

  for (const product of productSeeds) {
    const { priceUpdatedAt, ...rest } = product
    await prisma.product.upsert({
      where: { id: product.id },
      update: {},
      create: { ...rest, priceUpdatedAt: new Date(priceUpdatedAt) },
    })
  }

  for (const sale of sellerSaleSeeds) {
    const { soldAt, ...rest } = sale
    await prisma.sellerSale.upsert({
      where: { id: sale.id },
      update: {},
      create: { ...rest, soldAt: new Date(soldAt) },
    })
  }

  for (const partner of logisticsPartnerSeeds) {
    const { lastAudit, ...rest } = partner
    await prisma.logisticsPartner.upsert({
      where: { id: partner.id },
      update: {},
      create: { ...rest, lastAudit: new Date(lastAudit) },
    })
  }
}
