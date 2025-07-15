import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const isActive = searchParams.get('isActive')
    const type = searchParams.get('type')

    const where: any = {}
    if (isActive !== null) where.isActive = isActive === 'true'
    if (type) where.type = type

    const tasks = await prisma.scheduledTask.findMany({
      where,
      include: {
        executions: {
          orderBy: { startedAt: 'desc' },
          take: 5,
        },
        _count: {
          select: { executions: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ tasks })
  } catch (error) {
    console.error('Scheduler API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, description, type, schedule, isActive, data, retryCount, timeout } = body

    if (!name || !type || !schedule) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const task = await prisma.scheduledTask.create({
      data: {
        name,
        description,
        type,
        schedule,
        isActive: isActive !== false,
        data: data ? JSON.stringify(data) : null,
        retryCount: retryCount || 3,
        timeout: timeout || 300, // 5 minutes default
      },
      include: {
        executions: {
          orderBy: { startedAt: 'desc' },
          take: 5,
        },
      },
    })

    return NextResponse.json({ task })
  } catch (error) {
    console.error('Scheduler API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 