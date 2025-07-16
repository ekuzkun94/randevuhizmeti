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
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const entityType = searchParams.get('entityType')
    const type = searchParams.get('type')

    const skip = (page - 1) * limit

    const where: any = {}
    if (entityType) where.entityType = entityType
    if (type) where.type = type

    const [customFields, total] = await Promise.all([
      prisma.customField.findMany({
        where,
        include: {
          _count: {
            select: { values: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.customField.count({ where }),
    ])

    return NextResponse.json({
      customFields,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Custom fields API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, label, type, entityType, isRequired, isUnique, options } = body

    if (!name || !label || !type || !entityType) {
      return NextResponse.json({ error: 'Name, label, type, and entityType are required' }, { status: 400 })
    }

    const customField = await prisma.customField.create({
      data: {
        name,
        label,
        type,
        entityType,
        isRequired: isRequired || false,
        isUnique: isUnique || false,
        options: options ? JSON.stringify(options) : null,
      },
    })

    return NextResponse.json({ customField }, { status: 201 })
  } catch (error) {
    console.error('Custom field creation error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 