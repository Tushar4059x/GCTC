import { PrismaClient } from '@prisma/client'
import { demoUsers, logisticsPartnerSeeds, productSeeds, sellerSaleSeeds } from '@gctc/shared'
import { seedDatabase } from './seedDatabase.ts'

const prisma = new PrismaClient()

try {
  await seedDatabase(prisma)
  console.log(
    `Seeded ${demoUsers.length} users, ${productSeeds.length} products, ` +
      `${sellerSaleSeeds.length} sales, ${logisticsPartnerSeeds.length} logistics partners`,
  )
} finally {
  await prisma.$disconnect()
}
