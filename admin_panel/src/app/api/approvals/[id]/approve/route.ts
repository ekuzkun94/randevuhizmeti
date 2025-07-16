import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    const { id } = await context.params
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { action, comment, data } = body // action: 'approve' | 'reject'

    if (!['approve', 'reject'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    const requestId = id

    // Get the approval request with workflow and steps
    const approvalRequest = await prisma.approvalRequest.findUnique({
      where: { id: requestId },
      include: {
        workflow: {
          include: {
            steps: {
              orderBy: { order: 'asc' },
            },
          },
        },
        approvals: {
          include: {
            step: true,
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    })

    if (!approvalRequest) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 })
    }

    // Check if request is still pending
    if (approvalRequest.status !== 'PENDING') {
      return NextResponse.json({ error: 'Request is not pending' }, { status: 400 })
    }

    const currentStep = approvalRequest.workflow.steps.find(
      step => step.order === approvalRequest.currentStep
    )

    if (!currentStep) {
      return NextResponse.json({ error: 'Current step not found' }, { status: 400 })
    }

    // Check if user can approve this step
    const canApprove = 
      (currentStep.approverRole && session.user.role === currentStep.approverRole) ||
      (currentStep.approverUserId && currentStep.approverUserId === session.user.id)

    if (!canApprove) {
      return NextResponse.json({ error: 'Not authorized to approve this step' }, { status: 403 })
    }

    // Check if user has already approved this step
    const existingApproval = approvalRequest.approvals.find(
      approval => approval.stepId === currentStep.id && approval.approverId === session.user.id
    )

    if (existingApproval) {
      return NextResponse.json({ error: 'Already approved this step' }, { status: 400 })
    }

    // Create approval record
    const approval = await prisma.approval.create({
      data: {
        requestId,
        stepId: currentStep.id,
        approverId: session.user.id,
        status: action === 'approve' ? 'APPROVED' : 'REJECTED',
        comment,
        data: data ? JSON.stringify(data) : null,
      },
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
    })

    // If rejected, update request status
    if (action === 'reject') {
      await prisma.approvalRequest.update({
        where: { id: requestId },
        data: { status: 'REJECTED' },
      })

      return NextResponse.json({ 
        approval,
        requestStatus: 'REJECTED',
        message: 'Request rejected successfully'
      })
    }

    // Check if all required steps are approved
    const requiredSteps = approvalRequest.workflow.steps.filter(step => step.isRequired)
    const approvedSteps = approvalRequest.approvals.filter(approval => approval.status === 'APPROVED')
    
    const allRequiredApproved = requiredSteps.every(step =>
      approvedSteps.some(approval => approval.stepId === step.id)
    )

    if (allRequiredApproved) {
      // All required steps approved, mark request as approved
      await prisma.approvalRequest.update({
        where: { id: requestId },
        data: { status: 'APPROVED' },
      })

      return NextResponse.json({ 
        approval,
        requestStatus: 'APPROVED',
        message: 'Request approved successfully'
      })
    } else {
      // Move to next step
      const nextStep = approvalRequest.workflow.steps.find(
        step => step.order === approvalRequest.currentStep + 1
      )

      if (nextStep) {
        await prisma.approvalRequest.update({
          where: { id: requestId },
          data: { currentStep: approvalRequest.currentStep + 1 },
        })

        return NextResponse.json({ 
          approval,
          requestStatus: 'PENDING',
          currentStep: approvalRequest.currentStep + 1,
          message: 'Step approved, moved to next step'
        })
      } else {
        // No more steps, mark as approved
        await prisma.approvalRequest.update({
          where: { id: requestId },
          data: { status: 'APPROVED' },
        })

        return NextResponse.json({ 
          approval,
          requestStatus: 'APPROVED',
          message: 'Request approved successfully'
        })
      }
    }
  } catch (error) {
    console.error('Approval API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 