import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const entityType = searchParams.get('entityType')
    const entityId = searchParams.get('entityId')
    const type = searchParams.get('type')
    const isPrivate = searchParams.get('isPrivate')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    const skip = (page - 1) * limit

    const where: any = {}
    
    if (entityType) where.entityType = entityType
    if (entityId) where.entityId = entityId
    if (type) where.type = type
    if (isPrivate !== null) where.isPrivate = isPrivate === 'true'
    
    // Only show private annotations to the author or admins
    if (session.user.role !== 'ADMIN') {
      where.OR = [
        { isPrivate: false },
        { authorId: session.user.id }
      ]
    }

    const [annotations, total] = await Promise.all([
      prisma.annotation.findMany({
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
        skip,
        take: limit,
      }),
      prisma.annotation.count({ where })
    ])

    return NextResponse.json({
      annotations,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching annotations:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { entityType, entityId, content, type = 'NOTE', isPrivate = false, tagIds = [] } = body

    if (!entityType || !entityId || !content) {
      return NextResponse.json(
        { error: 'Entity type, entity ID and content are required' },
        { status: 400 }
      )
    }

    const annotation = await prisma.annotation.create({
      data: {
        entityType,
        entityId,
        content,
        type,
        isPrivate,
        authorId: session.user.id,
        tags: {
          connect: tagIds.map((id: string) => ({ id }))
        }
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

    return NextResponse.json(annotation, { status: 201 })
  } catch (error) {
    console.error('Error creating annotation:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 