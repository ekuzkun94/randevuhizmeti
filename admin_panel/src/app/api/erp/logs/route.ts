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
    const level = searchParams.get('level')
    const type = searchParams.get('type')

    const skip = (page - 1) * limit

    const where: any = {
      type: 'ERP',
    }
    if (level) where.level = level

    const [logs, total] = await Promise.all([
      prisma.log.findMany({
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
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.log.count({ where }),
    ])

    return NextResponse.json({
      logs,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('ERP logs API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { level, message, metadata } = body

    if (!level || !message) {
      return NextResponse.json({ error: 'Level and message are required' }, { status: 400 })
    }

    const log = await prisma.log.create({
      data: {
        level,
        message,
        type: 'ERP',
        metadata: metadata ? JSON.stringify(metadata) : null,
        userId: session.user.id,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    return NextResponse.json({ log }, { status: 201 })
  } catch (error) {
    console.error('ERP log creation error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 