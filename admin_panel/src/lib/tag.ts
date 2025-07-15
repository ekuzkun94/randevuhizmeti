import { prisma } from './prisma'

export interface TagData {
  id: string
  name: string
  color: string
  description?: string
  isSystem: boolean
  createdAt: Date
  updatedAt: Date
  _count?: {
    annotations: number
    users: number
    taskTags: number
  }
}

export class TagService {
  /**
   * Create a new tag
   */
  static async createTag(data: {
    name: string
    color?: string
    description?: string
    isSystem?: boolean
  }): Promise<TagData> {
    try {
      // Check if tag already exists
      const existingTag = await prisma.tag.findUnique({
        where: { name: data.name }
      })

      if (existingTag) {
        throw new Error('Tag with this name already exists')
      }

      const tag = await prisma.tag.create({
        data: {
          name: data.name,
          color: data.color || '#3B82F6',
          description: data.description,
          isSystem: data.isSystem || false,
        },
        include: {
          _count: {
            select: {
              annotations: true,
              users: true,
              taskTags: true,
            },
          },
        },
      })

      return tag
    } catch (error) {
      console.error('Create tag error:', error)
      throw error
    }
  }

  /**
   * Get all tags
   */
  static async getTags(filters?: {
    search?: string
    isSystem?: boolean
  }): Promise<TagData[]> {
    try {
      const where: any = {}
      
      if (filters?.search) {
        where.name = {
          contains: filters.search,
          mode: 'insensitive'
        }
      }
      if (filters?.isSystem !== undefined) {
        where.isSystem = filters.isSystem
      }

      const tags = await prisma.tag.findMany({
        where,
        include: {
          _count: {
            select: {
              annotations: true,
              users: true,
              taskTags: true,
            },
          },
        },
        orderBy: { name: 'asc' },
      })

      return tags
    } catch (error) {
      console.error('Get tags error:', error)
      throw error
    }
  }

  /**
   * Get tag by ID
   */
  static async getTagById(id: string): Promise<TagData | null> {
    try {
      const tag = await prisma.tag.findUnique({
        where: { id },
        include: {
          _count: {
            select: {
              annotations: true,
              users: true,
              taskTags: true,
            },
          },
        },
      })

      return tag
    } catch (error) {
      console.error('Get tag by ID error:', error)
      throw error
    }
  }

  /**
   * Update a tag
   */
  static async updateTag(
    id: string,
    data: {
      name?: string
      color?: string
      description?: string
    }
  ): Promise<TagData> {
    try {
      // Check if tag exists
      const existingTag = await prisma.tag.findUnique({
        where: { id }
      })

      if (!existingTag) {
        throw new Error('Tag not found')
      }

      // If name is being changed, check for conflicts
      if (data.name && data.name !== existingTag.name) {
        const nameConflict = await prisma.tag.findUnique({
          where: { name: data.name }
        })

        if (nameConflict) {
          throw new Error('Tag with this name already exists')
        }
      }

      const updatedTag = await prisma.tag.update({
        where: { id },
        data,
        include: {
          _count: {
            select: {
              annotations: true,
              users: true,
              taskTags: true,
            },
          },
        },
      })

      return updatedTag
    } catch (error) {
      console.error('Update tag error:', error)
      throw error
    }
  }

  /**
   * Delete a tag
   */
  static async deleteTag(id: string): Promise<void> {
    try {
      // Check if tag exists and is not a system tag
      const tag = await prisma.tag.findUnique({
        where: { id },
        select: { isSystem: true }
      })

      if (!tag) {
        throw new Error('Tag not found')
      }

      if (tag.isSystem) {
        throw new Error('Cannot delete system tags')
      }

      await prisma.tag.delete({
        where: { id }
      })
    } catch (error) {
      console.error('Delete tag error:', error)
      throw error
    }
  }

  /**
   * Get tag statistics
   */
  static async getTagStats(): Promise<{
    totalTags: number
    systemTags: number
    customTags: number
    mostUsedTags: Array<{
      id: string
      name: string
      color: string
      usageCount: number
    }>
  }> {
    try {
      const [totalTags, systemTags, customTags, mostUsedTags] = await Promise.all([
        prisma.tag.count(),
        prisma.tag.count({ where: { isSystem: true } }),
        prisma.tag.count({ where: { isSystem: false } }),
        prisma.tag.findMany({
          include: {
            _count: {
              select: {
                annotations: true,
                users: true,
                taskTags: true,
              },
            },
          },
          orderBy: [
            {
              annotations: {
                _count: 'desc'
              }
            },
            {
              taskTags: {
                _count: 'desc'
              }
            }
          ],
          take: 10,
        }),
      ])

      const mostUsedTagsWithCount = mostUsedTags.map(tag => ({
        id: tag.id,
        name: tag.name,
        color: tag.color,
        usageCount: tag._count.annotations + tag._count.users + tag._count.taskTags,
      }))

      return {
        totalTags,
        systemTags,
        customTags,
        mostUsedTags: mostUsedTagsWithCount,
      }
    } catch (error) {
      console.error('Get tag stats error:', error)
      throw error
    }
  }

  /**
   * Assign tags to a user
   */
  static async assignTagsToUser(userId: string, tagIds: string[]): Promise<void> {
    try {
      await prisma.user.update({
        where: { id: userId },
        data: {
          tags: {
            connect: tagIds.map(id => ({ id }))
          }
        }
      })
    } catch (error) {
      console.error('Assign tags to user error:', error)
      throw error
    }
  }

  /**
   * Remove tags from a user
   */
  static async removeTagsFromUser(userId: string, tagIds: string[]): Promise<void> {
    try {
      await prisma.user.update({
        where: { id: userId },
        data: {
          tags: {
            disconnect: tagIds.map(id => ({ id }))
          }
        }
      })
    } catch (error) {
      console.error('Remove tags from user error:', error)
      throw error
    }
  }
} 