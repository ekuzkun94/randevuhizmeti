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
    const status = searchParams.get('status')
    const type = searchParams.get('type')

    const skip = (page - 1) * limit

    const where: any = {}
    if (status) where.status = status
    if (type) where.type = type

    const [integrations, total] = await Promise.all([
      prisma.integrationInstallation.findMany({
        where,
        include: {
          integration: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.integrationInstallation.count({ where }),
    ])

    return NextResponse.json({
      integrations,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('ERP integrations API error:', error)
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
    const { integrationId, config, isActive } = body

    if (!integrationId) {
      return NextResponse.json({ error: 'Integration ID is required' }, { status: 400 })
    }

    const integration = await prisma.integrationInstallation.create({
      data: {
        integrationId,
        userId: session.user.id,
        config: config ? JSON.stringify(config) : '{}',
        isActive: isActive !== false,
      },
      include: {
        integration: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    return NextResponse.json({ integration }, { status: 201 })
  } catch (error) {
    console.error('ERP integration creation error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 