import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const entityType = searchParams.get('entityType')
    const requesterId = searchParams.get('requesterId')
    const approverId = searchParams.get('approverId')

    const where: any = {}
    if (status) where.status = status
    if (entityType) where.entityType = entityType
    if (requesterId) where.userId = requesterId
    if (approverId) {
      where.approvals = {
        some: {
          approverId: approverId,
        },
      }
    }

    const requests = await prisma.approvalRequest.findMany({
      where,
      include: {
        workflow: {
          include: {
            steps: {
              orderBy: { order: 'asc' },
            },
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        approvals: {
          include: {
            approver: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            step: true,
          },
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ requests })
  } catch (error) {
    console.error('Approvals API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { workflowId, entityType, entityId, title, description, data, priority, dueDate } = body

    if (!workflowId || !entityType || !entityId || !title) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Check if workflow exists and is active
    const workflow = await prisma.approvalWorkflow.findUnique({
      where: { id: workflowId },
      include: { steps: { orderBy: { order: 'asc' } } },
    })

    if (!workflow || !workflow.isActive) {
      return NextResponse.json({ error: 'Workflow not found or inactive' }, { status: 400 })
    }

    // Check if there's already a pending request for this entity
    const existingRequest = await prisma.approvalRequest.findFirst({
      where: {
        entityType,
        entityId,
        status: { in: ['PENDING', 'APPROVED'] },
      },
    })

    if (existingRequest) {
      return NextResponse.json({ error: 'Request already exists for this entity' }, { status: 400 })
    }

    const approvalRequest = await prisma.approvalRequest.create({
      data: {
        workflowId,
        entityType,
        entityId,
        userId: session.user.id,
        title,
        description,
        data: data ? JSON.stringify(data) : null,
        priority: priority || 'NORMAL',
        dueDate: dueDate ? new Date(dueDate) : null,
        currentStep: 1,
      },
      include: {
        workflow: {
          include: {
            steps: {
              orderBy: { order: 'asc' },
            },
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    return NextResponse.json({ request: approvalRequest })
  } catch (error) {
    console.error('Approvals API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 