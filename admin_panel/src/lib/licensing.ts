import { prisma } from './prisma'

export interface LicenseCheckResult {
  hasAccess: boolean
  isExpired: boolean
  features: string[]
  expiresAt?: Date
  message?: string
}

export class LicensingService {
  /**
   * Check if a user/tenant has access to a specific module
   */
  static async checkModuleAccess(
    moduleName: string,
    userId?: string,
    tenantId?: string
  ): Promise<LicenseCheckResult> {
    try {
      // Find the module
      const module = await prisma.module.findUnique({
        where: { name: moduleName },
      })

      if (!module) {
        return {
          hasAccess: false,
          isExpired: false,
          features: [],
          message: 'Module not found',
        }
      }

      // If module is not active, no one has access
      if (!module.isActive) {
        return {
          hasAccess: false,
          isExpired: false,
          features: [],
          message: 'Module is not active',
        }
      }

      // If module is not premium, everyone has access
      if (!module.isPremium) {
        return {
          hasAccess: true,
          isExpired: false,
          features: module.features ? JSON.parse(module.features) : [],
        }
      }

      // Check for license
      const license = await prisma.moduleLicense.findFirst({
        where: {
          moduleId: module.id,
          isActive: true,
          OR: [
            { tenantId: tenantId || null },
            { userId: userId || null },
          ],
        },
      })

      if (!license) {
        return {
          hasAccess: false,
          isExpired: false,
          features: [],
          message: 'No active license found',
        }
      }

      // Check if license is expired
      const isExpired = license.expiresAt ? new Date() > license.expiresAt : false

      return {
        hasAccess: !isExpired,
        isExpired,
        features: license.features ? JSON.parse(license.features) : [],
        expiresAt: license.expiresAt || undefined,
        message: isExpired ? 'License has expired' : undefined,
      }
    } catch (error) {
      console.error('License check error:', error)
      return {
        hasAccess: false,
        isExpired: false,
        features: [],
        message: 'Error checking license',
      }
    }
  }

  /**
   * Get all modules with their license status for a user/tenant
   */
  static async getModulesWithLicenseStatus(
    userId?: string,
    tenantId?: string
  ) {
    try {
      const modules = await prisma.module.findMany({
        where: { isActive: true },
        include: {
          licenses: {
            where: {
              isActive: true,
              OR: [
                { tenantId: tenantId || null },
                { userId: userId || null },
              ],
            },
          },
        },
        orderBy: { displayName: 'asc' },
      })

      return modules.map(module => {
        const license = module.licenses[0]
        const isExpired = license?.expiresAt ? new Date() > license.expiresAt : false

        return {
          ...module,
          features: module.features ? JSON.parse(module.features) : [],
          hasLicense: !!license && !isExpired,
          isExpired,
          license,
        }
      })
    } catch (error) {
      console.error('Get modules with license status error:', error)
      return []
    }
  }

  /**
   * Create a license for a module
   */
  static async createLicense(data: {
    moduleId: string
    tenantId?: string
    userId?: string
    isActive?: boolean
    expiresAt?: Date
    features?: string[]
  }) {
    try {
      // Check if license already exists
      const existingLicense = await prisma.moduleLicense.findFirst({
        where: {
          moduleId: data.moduleId,
          tenantId: data.tenantId || null,
          userId: data.userId || null,
        },
      })

      if (existingLicense) {
        throw new Error('License already exists')
      }

      const license = await prisma.moduleLicense.create({
        data: {
          moduleId: data.moduleId,
          tenantId: data.tenantId || null,
          userId: data.userId || null,
          isActive: data.isActive !== false,
          expiresAt: data.expiresAt || null,
          features: data.features ? JSON.stringify(data.features) : null,
        },
        include: {
          module: true,
          tenant: true,
          user: true,
        },
      })

      return license
    } catch (error) {
      console.error('Create license error:', error)
      throw error
    }
  }

  /**
   * Update a license
   */
  static async updateLicense(
    licenseId: string,
    data: {
      isActive?: boolean
      expiresAt?: Date
      features?: string[]
    }
  ) {
    try {
      const license = await prisma.moduleLicense.update({
        where: { id: licenseId },
        data: {
          isActive: data.isActive,
          expiresAt: data.expiresAt,
          features: data.features ? JSON.stringify(data.features) : undefined,
        },
        include: {
          module: true,
          tenant: true,
          user: true,
        },
      })

      return license
    } catch (error) {
      console.error('Update license error:', error)
      throw error
    }
  }

  /**
   * Delete a license
   */
  static async deleteLicense(licenseId: string) {
    try {
      await prisma.moduleLicense.delete({
        where: { id: licenseId },
      })

      return true
    } catch (error) {
      console.error('Delete license error:', error)
      throw error
    }
  }

  /**
   * Get license statistics
   */
  static async getLicenseStats() {
    try {
      const totalLicenses = await prisma.moduleLicense.count()
      const activeLicenses = await prisma.moduleLicense.count({
        where: { isActive: true },
      })
      const expiredLicenses = await prisma.moduleLicense.count({
        where: {
          isActive: true,
          expiresAt: { lt: new Date() },
        },
      })

      const moduleStats = await prisma.module.groupBy({
        by: ['isPremium'],
        _count: {
          id: true,
        },
      })

      return {
        totalLicenses,
        activeLicenses,
        expiredLicenses,
        premiumModules: moduleStats.find(s => s.isPremium)?._count.id || 0,
        freeModules: moduleStats.find(s => !s.isPremium)?._count.id || 0,
      }
    } catch (error) {
      console.error('Get license stats error:', error)
      return null
    }
  }
}

// Export common module names for easy access
export const MODULE_NAMES = {
  AUDIT_TRAIL: 'audit-trail',
  ADVANCED_ANALYTICS: 'advanced-analytics',
  WORKFLOW_APPROVAL: 'workflow-approval',
  SCHEDULER: 'scheduler',
  INTEGRATIONS: 'integrations',
} as const

// Hook for checking module access in components
export function useModuleAccess(moduleName: string) {
  // This would be implemented with React hooks in a client component
  // For now, we'll use it as a server-side utility
  return LicensingService.checkModuleAccess(moduleName)
} 