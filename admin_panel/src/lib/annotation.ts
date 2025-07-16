import { prisma } from './prisma'

export interface AnnotationData {
  id: string
  entityType: string
  entityId: string
  content: string
  type: 'NOTE' | 'WARNING' | 'INFO' | 'TODO'
  isPrivate: boolean
  authorId: string
  createdAt: Date
  updatedAt: Date
  author?: {
    id: string
    name: string
    email: string
  }
  tags?: Array<{
    id: string
    name: string
    color: string
  }>
}

export class AnnotationService {
  /**
   * Create a new annotation
   */
  static async createAnnotation(data: {
    entityType: string
    entityId: string
    content: string
    type?: 'NOTE' | 'WARNING' | 'INFO' | 'TODO'
    isPrivate?: boolean
    authorId: string
    tagIds?: string[]
  }): Promise<AnnotationData> {
    try {
      const annotation = await prisma.annotation.create({
        data: {
          entityType: data.entityType,
          entityId: data.entityId,
          content: data.content,
          type: data.type || 'NOTE',
          isPrivate: data.isPrivate || false,
          authorId: data.authorId,
          tags: data.tagIds ? {
            connect: data.tagIds.map(id => ({ id }))
          } : undefined
        },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          tags: {
            select: {
              id: true,
              name: true,
              color: true,
            },
          },
        },
      })

      return annotation as AnnotationData
    } catch (error) {
      console.error('Create annotation error:', error)
      throw error
    }
  }

  /**
   * Get annotations for an entity
   */
  static async getEntityAnnotations(
    entityType: string,
    entityId: string,
    userId: string,
    userRole: string
  ): Promise<AnnotationData[]> {
    try {
      const where: any = {
        entityType,
        entityId,
      }

      // Only show private annotations to the author or admins
      if (userRole !== 'ADMIN') {
        where.OR = [
          { isPrivate: false },
          { authorId: userId }
        ]
      }

      const annotations = await prisma.annotation.findMany({
        where,
        include: {
          author: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          tags: {
            select: {
              id: true,
              name: true,
              color: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      })

      return annotations as AnnotationData[]
    } catch (error) {
      console.error('Get entity annotations error:', error)
      throw error
    }
  }

  /**
   * Update an annotation
   */
  static async updateAnnotation(
    id: string,
    data: {
      content?: string
      type?: 'NOTE' | 'WARNING' | 'INFO' | 'TODO'
      isPrivate?: boolean
      tagIds?: string[]
    },
    authorId: string
  ): Promise<AnnotationData> {
    try {
      // Check if user can edit this annotation
      const annotation = await prisma.annotation.findUnique({
        where: { id },
        select: { authorId: true }
      })

      if (!annotation) {
        throw new Error('Annotation not found')
      }

      if (annotation.authorId !== authorId) {
        throw new Error('Unauthorized to edit this annotation')
      }

      const updatedAnnotation = await prisma.annotation.update({
        where: { id },
        data: {
          ...data,
          tags: data.tagIds ? {
            set: data.tagIds.map(id => ({ id }))
          } : undefined
        },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          tags: {
            select: {
              id: true,
              name: true,
              color: true,
            },
          },
        },
      })

      return updatedAnnotation as AnnotationData
    } catch (error) {
      console.error('Update annotation error:', error)
      throw error
    }
  }

  /**
   * Delete an annotation
   */
  static async deleteAnnotation(id: string, authorId: string): Promise<void> {
    try {
      // Check if user can delete this annotation
      const annotation = await prisma.annotation.findUnique({
        where: { id },
        select: { authorId: true }
      })

      if (!annotation) {
        throw new Error('Annotation not found')
      }

      if (annotation.authorId !== authorId) {
        throw new Error('Unauthorized to delete this annotation')
      }

      await prisma.annotation.delete({
        where: { id }
      })
    } catch (error) {
      console.error('Delete annotation error:', error)
      throw error
    }
  }

  /**
   * Get annotation statistics
   */
  static async getAnnotationStats(): Promise<{
    totalAnnotations: number
    annotationsByType: Record<string, number>
    annotationsByEntityType: Record<string, number>
    recentAnnotations: AnnotationData[]
  }> {
    try {
      const [totalAnnotations, annotationsByType, annotationsByEntityType, recentAnnotations] = await Promise.all([
        prisma.annotation.count(),
        prisma.annotation.groupBy({
          by: ['type'],
          _count: { id: true },
        }),
        prisma.annotation.groupBy({
          by: ['entityType'],
          _count: { id: true },
        }),
        prisma.annotation.findMany({
          take: 10,
          include: {
            author: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            tags: {
              select: {
                id: true,
                name: true,
                color: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        }),
      ])

      const annotationsByTypeMap = annotationsByType.reduce((acc, item) => {
        acc[item.type] = item._count.id
        return acc
      }, {} as Record<string, number>)

      const annotationsByEntityTypeMap = annotationsByEntityType.reduce((acc, item) => {
        acc[item.entityType] = item._count.id
        return acc
      }, {} as Record<string, number>)

      return {
        totalAnnotations,
        annotationsByType: annotationsByTypeMap,
        annotationsByEntityType: annotationsByEntityTypeMap,
        recentAnnotations: recentAnnotations as AnnotationData[],
      }
    } catch (error) {
      console.error('Get annotation stats error:', error)
      throw error
    }
  }
} 