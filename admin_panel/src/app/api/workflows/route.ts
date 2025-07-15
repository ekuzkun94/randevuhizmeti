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
    const entityType = searchParams.get('entityType')
    const isActive = searchParams.get('isActive')

    const where: any = {}
    if (entityType) where.entityType = entityType
    if (isActive !== null) where.isActive = isActive === 'true'

    const workflows = await prisma.approvalWorkflow.findMany({
      where,
      include: {
        steps: {
          orderBy: { order: 'asc' },
        },
        _count: {
          select: { requests: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ workflows })
  } catch (error) {
    console.error('Workflows API error:', error)
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
    const { name, description, entityType, isActive, steps } = body

    if (!name || !entityType) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const workflow = await prisma.approvalWorkflow.create({
      data: {
        name,
        description,
        entityType,
        isActive: isActive !== false,
        steps: {
          create: steps?.map((step: any, index: number) => ({
            name: step.name,
            description: step.description,
            order: index + 1,
            approverRole: step.approverRole,
            approverUserId: step.approverUserId,
            isRequired: step.isRequired !== false,
            canReject: step.canReject !== false,
            canEdit: step.canEdit || false,
            autoApprove: step.autoApprove || false,
            timeoutHours: step.timeoutHours,
          })) || [],
        },
      },
      include: {
        steps: {
          orderBy: { order: 'asc' },
        },
      },
    })

    return NextResponse.json({ workflow })
  } catch (error) {
    console.error('Workflows API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 