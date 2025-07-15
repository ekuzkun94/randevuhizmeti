import { PrismaClient } from '@prisma/client'
import { createAuditMiddleware } from './audit'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient()

// Add audit middleware
prisma.$use(createAuditMiddleware())

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma 