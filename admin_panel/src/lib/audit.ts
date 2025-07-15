import { PrismaClient } from '@prisma/client'
import { getServerSession } from 'next-auth'
import { authOptions } from './auth'

const prisma = new PrismaClient()

export interface AuditLogData {
  action: string
  entityType: string
  entityId?: string
  oldValues?: any
  newValues?: any
  metadata?: any
  ipAddress?: string
  userAgent?: string
}

export class AuditTrail {
  static async log(data: AuditLogData, request?: Request) {
    try {
      const session = await getServerSession(authOptions)
      const userId = session?.user?.id

      // Get IP address and user agent from request
      let ipAddress = data.ipAddress
      let userAgent = data.userAgent

      if (request) {
        const forwarded = request.headers.get('x-forwarded-for')
        const real = request.headers.get('x-real-ip')
        ipAddress = forwarded || real || request.headers.get('x-client-ip') || 'unknown'
        userAgent = request.headers.get('user-agent') || 'unknown'
      }

      await prisma.auditLog.create({
        data: {
          action: data.action,
          entityType: data.entityType,
          entityId: data.entityId,
          userId: userId,
          oldValues: data.oldValues ? JSON.stringify(data.oldValues) : null,
          newValues: data.newValues ? JSON.stringify(data.newValues) : null,
          metadata: data.metadata ? JSON.stringify(data.metadata) : null,
          ipAddress,
          userAgent,
        },
      })
    } catch (error) {
      console.error('Audit log error:', error)
    }
  }

  static async getAuditLogs(filters?: {
    action?: string
    entityType?: string
    entityId?: string
    userId?: string
    startDate?: Date
    endDate?: Date
    limit?: number
    offset?: number
  }) {
    const where: any = {}

    if (filters?.action) where.action = filters.action
    if (filters?.entityType) where.entityType = filters.entityType
    if (filters?.entityId) where.entityId = filters.entityId
    if (filters?.userId) where.userId = filters.userId
    if (filters?.startDate || filters?.endDate) {
      where.createdAt = {}
      if (filters?.startDate) where.createdAt.gte = filters.startDate
      if (filters?.endDate) where.createdAt.lte = filters.endDate
    }

    const logs = await prisma.auditLog.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: filters?.limit || 50,
      skip: filters?.offset || 0,
    })

    return logs.map(log => ({
      ...log,
      oldValues: log.oldValues ? JSON.parse(log.oldValues) : null,
      newValues: log.newValues ? JSON.parse(log.newValues) : null,
      metadata: log.metadata ? JSON.parse(log.metadata) : null,
    }))
  }

  static async getAuditLogsByEntity(entityType: string, entityId: string) {
    return this.getAuditLogs({ entityType, entityId })
  }

  static async getAuditLogsByUser(userId: string) {
    return this.getAuditLogs({ userId })
  }

  static async getAuditLogsByAction(action: string) {
    return this.getAuditLogs({ action })
  }

  static async getAuditLogsByDateRange(startDate: Date, endDate: Date) {
    return this.getAuditLogs({ startDate, endDate })
  }

  static async getAuditStats() {
    const stats = await prisma.auditLog.groupBy({
      by: ['action'],
      _count: {
        action: true,
      },
    })

    const totalLogs = await prisma.auditLog.count()
    const todayLogs = await prisma.auditLog.count({
      where: {
        createdAt: {
          gte: new Date(new Date().setHours(0, 0, 0, 0)),
        },
      },
    })

    return {
      totalLogs,
      todayLogs,
      actionStats: stats.map(stat => ({
        action: stat.action,
        count: stat._count.action,
      })),
    }
  }
}

// Prisma middleware for automatic audit logging
export function createAuditMiddleware() {
  return async (params: any, next: any) => {
    const result = await next(params)

    // Only log for specific operations
    if (['create', 'update', 'delete'].includes(params.action)) {
      const entityType = params.model
      const action = params.action.toUpperCase()
      
      let oldValues = null
      let newValues = null
      let entityId = null

      if (params.action === 'create') {
        newValues = result
        entityId = result?.id
      } else if (params.action === 'update') {
        oldValues = params.args.data
        newValues = result
        entityId = params.args.where?.id || result?.id
      } else if (params.action === 'delete') {
        oldValues = result
        entityId = result?.id
      }

      // Don't log audit logs themselves to avoid infinite loops
      if (entityType !== 'AuditLog') {
        await AuditTrail.log({
          action,
          entityType,
          entityId,
          oldValues,
          newValues,
        })
      }
    }

    return result
  }
}

// Export audit actions constants
export const AUDIT_ACTIONS = {
  CREATE: 'CREATE',
  UPDATE: 'UPDATE',
  DELETE: 'DELETE',
  LOGIN: 'LOGIN',
  LOGOUT: 'LOGOUT',
  PASSWORD_CHANGE: 'PASSWORD_CHANGE',
  TWO_FACTOR_ENABLE: 'TWO_FACTOR_ENABLE',
  TWO_FACTOR_DISABLE: 'TWO_FACTOR_DISABLE',
  API_KEY_CREATE: 'API_KEY_CREATE',
  API_KEY_DELETE: 'API_KEY_DELETE',
  FILE_UPLOAD: 'FILE_UPLOAD',
  FILE_DELETE: 'FILE_DELETE',
  SETTINGS_UPDATE: 'SETTINGS_UPDATE',
  USER_STATUS_CHANGE: 'USER_STATUS_CHANGE',
  ROLE_CHANGE: 'ROLE_CHANGE',
} as const

export const AUDIT_ENTITY_TYPES = {
  USER: 'User',
  FILE: 'File',
  API_KEY: 'ApiKey',
  NOTIFICATION: 'Notification',
  LOG: 'Log',
  SETTING: 'SystemSetting',
  MODULE: 'Module',
  INTEGRATION: 'Integration',
  CONTENT: 'Content',
  TENANT: 'Tenant',
} as const 