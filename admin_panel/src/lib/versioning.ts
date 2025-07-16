import { prisma } from './prisma'

export interface VersionedData {
  id: string
  entityType: string
  entityId: string
  version: number
  data: any
  authorId: string
  changeType: 'CREATE' | 'UPDATE' | 'DELETE' | 'RESTORE'
  changeReason?: string
  createdAt: Date
  author?: {
    id: string
    name: string
    email: string
  }
}

export class VersioningService {
  /**
   * Create a new version of a record
   */
  static async createVersion(data: {
    entityType: string
    entityId: string
    data: any
    authorId: string
    changeType: 'CREATE' | 'UPDATE' | 'DELETE' | 'RESTORE'
    changeReason?: string
  }): Promise<VersionedData> {
    try {
      // Get the latest version number
      const latestVersion = await prisma.versionedRecord.findFirst({
        where: {
          entityType: data.entityType,
          entityId: data.entityId,
        },
        orderBy: { version: 'desc' },
        select: { version: true },
      })

      const newVersion = (latestVersion?.version || 0) + 1

      const versionedRecord = await prisma.versionedRecord.create({
        data: {
          entityType: data.entityType,
          entityId: data.entityId,
          version: newVersion,
          data: JSON.stringify(data.data),
          authorId: data.authorId,
          changeType: data.changeType,
          changeReason: data.changeReason,
        },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      })

      return {
        ...versionedRecord,
        data: JSON.parse(versionedRecord.data),
        changeType: versionedRecord.changeType as 'CREATE' | 'UPDATE' | 'DELETE' | 'RESTORE',
      } as VersionedData
    } catch (error) {
      console.error('Create version error:', error)
      throw error
    }
  }

  /**
   * Get all versions of a record
   */
  static async getVersions(entityType: string, entityId: string): Promise<VersionedData[]> {
    try {
      const versions = await prisma.versionedRecord.findMany({
        where: {
          entityType,
          entityId,
        },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: { version: 'desc' },
      })

      return versions.map(version => ({
        ...version,
        data: JSON.parse(version.data),
        changeType: version.changeType as 'CREATE' | 'UPDATE' | 'DELETE' | 'RESTORE',
      })) as VersionedData[]
    } catch (error) {
      console.error('Get versions error:', error)
      throw error
    }
  }

  /**
   * Get a specific version of a record
   */
  static async getVersion(entityType: string, entityId: string, version: number): Promise<VersionedData | null> {
    try {
      const versionedRecord = await prisma.versionedRecord.findUnique({
        where: {
          entityType_entityId_version: {
            entityType,
            entityId,
            version,
          },
        },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      })

      if (!versionedRecord) return null

      return {
        ...versionedRecord,
        data: JSON.parse(versionedRecord.data),
        changeType: versionedRecord.changeType as 'CREATE' | 'UPDATE' | 'DELETE' | 'RESTORE',
      } as VersionedData
    } catch (error) {
      console.error('Get version error:', error)
      throw error
    }
  }

  /**
   * Get the latest version of a record
   */
  static async getLatestVersion(entityType: string, entityId: string): Promise<VersionedData | null> {
    try {
      const versionedRecord = await prisma.versionedRecord.findFirst({
        where: {
          entityType,
          entityId,
        },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: { version: 'desc' },
      })

      if (!versionedRecord) return null

      return {
        ...versionedRecord,
        data: JSON.parse(versionedRecord.data),
        changeType: versionedRecord.changeType as 'CREATE' | 'UPDATE' | 'DELETE' | 'RESTORE',
      } as VersionedData
    } catch (error) {
      console.error('Get latest version error:', error)
      throw error
    }
  }

  /**
   * Restore a record to a specific version
   */
  static async restoreVersion(
    entityType: string,
    entityId: string,
    version: number,
    authorId: string,
    changeReason?: string
  ): Promise<VersionedData> {
    try {
      const targetVersion = await this.getVersion(entityType, entityId, version)
      if (!targetVersion) {
        throw new Error('Version not found')
      }

      // Create a new version with the restored data
      return await this.createVersion({
        entityType,
        entityId,
        data: targetVersion.data,
        authorId,
        changeType: 'RESTORE',
        changeReason: changeReason || `Restored to version ${version}`,
      })
    } catch (error) {
      console.error('Restore version error:', error)
      throw error
    }
  }

  /**
   * Compare two versions of a record
   */
  static async compareVersions(
    entityType: string,
    entityId: string,
    version1: number,
    version2: number
  ): Promise<{
    version1: VersionedData
    version2: VersionedData
    differences: any
  }> {
    try {
      const [v1, v2] = await Promise.all([
        this.getVersion(entityType, entityId, version1),
        this.getVersion(entityType, entityId, version2),
      ])

      if (!v1 || !v2) {
        throw new Error('One or both versions not found')
      }

      const differences = this.getDifferences(v1.data, v2.data)

      return {
        version1: v1,
        version2: v2,
        differences,
      }
    } catch (error) {
      console.error('Compare versions error:', error)
      throw error
    }
  }

  /**
   * Get differences between two objects
   */
  private static getDifferences(obj1: any, obj2: any): any {
    const differences: any = {
      added: {},
      removed: {},
      changed: {},
    }

    const allKeys = new Set([...Object.keys(obj1), ...Object.keys(obj2)])

    for (const key of allKeys) {
      if (!(key in obj1)) {
        differences.added[key] = obj2[key]
      } else if (!(key in obj2)) {
        differences.removed[key] = obj1[key]
      } else if (JSON.stringify(obj1[key]) !== JSON.stringify(obj2[key])) {
        differences.changed[key] = {
          from: obj1[key],
          to: obj2[key],
        }
      }
    }

    return differences
  }

  /**
   * Get version statistics
   */
  static async getVersionStats(): Promise<{
    totalVersions: number
    totalEntities: number
    versionsByType: Record<string, number>
    recentChanges: VersionedData[]
  }> {
    try {
      const [totalVersions, totalEntities, versionsByType, recentChanges] = await Promise.all([
        prisma.versionedRecord.count(),
        prisma.versionedRecord.groupBy({
          by: ['entityType', 'entityId'],
          _count: { id: true },
        }),
        prisma.versionedRecord.groupBy({
          by: ['entityType'],
          _count: { id: true },
        }),
        prisma.versionedRecord.findMany({
          take: 10,
          include: {
            author: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        }),
      ])

      const versionsByTypeMap = versionsByType.reduce((acc, item) => {
        acc[item.entityType] = item._count.id
        return acc
      }, {} as Record<string, number>)

      return {
        totalVersions,
        totalEntities: totalEntities.length,
        versionsByType: versionsByTypeMap,
        recentChanges: recentChanges.map(change => ({
          ...change,
          data: JSON.parse(change.data),
          changeType: change.changeType as 'CREATE' | 'UPDATE' | 'DELETE' | 'RESTORE',
        })) as VersionedData[],
      }
    } catch (error) {
      console.error('Get version stats error:', error)
      throw error
    }
  }
}

// Content-specific versioning
export class ContentVersioningService {
  /**
   * Create a new version of content
   */
  static async createContentVersion(data: {
    contentId: string
    title: string
    content: string
    authorId: string
  }): Promise<any> {
    try {
      // Get the latest version number
      const latestVersion = await prisma.contentVersion.findFirst({
        where: { contentId: data.contentId },
        orderBy: { version: 'desc' },
        select: { version: true },
      })

      const newVersion = (latestVersion?.version || 0) + 1

      const contentVersion = await prisma.contentVersion.create({
        data: {
          contentId: data.contentId,
          version: newVersion,
          title: data.title,
          content: data.content,
          authorId: data.authorId,
        },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      })

      return contentVersion
    } catch (error) {
      console.error('Create content version error:', error)
      throw error
    }
  }

  /**
   * Get all versions of content
   */
  static async getContentVersions(contentId: string): Promise<any[]> {
    try {
      const versions = await prisma.contentVersion.findMany({
        where: { contentId },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: { version: 'desc' },
      })

      return versions
    } catch (error) {
      console.error('Get content versions error:', error)
      throw error
    }
  }

  /**
   * Restore content to a specific version
   */
  static async restoreContentVersion(
    contentId: string,
    version: number,
    authorId: string
  ): Promise<any> {
    try {
      const targetVersion = await prisma.contentVersion.findUnique({
        where: {
          contentId_version: {
            contentId,
            version,
          },
        },
      })

      if (!targetVersion) {
        throw new Error('Version not found')
      }

      // Update the content with the restored version
      const updatedContent = await prisma.content.update({
        where: { id: contentId },
        data: {
          title: targetVersion.title,
          content: targetVersion.content,
          updatedAt: new Date(),
        },
      })

      // Create a new version record for the restoration
      await this.createContentVersion({
        contentId,
        title: targetVersion.title,
        content: targetVersion.content,
        authorId,
      })

      return updatedContent
    } catch (error) {
      console.error('Restore content version error:', error)
      throw error
    }
  }
} 