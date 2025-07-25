import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { AuditTrail, AUDIT_ACTIONS, AUDIT_ENTITY_TYPES } from '@/lib/audit'
import bcrypt from 'bcryptjs'

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    const { id } = await context.params
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: id },
      select: {
        id: true,
        name: true,
        email: true,
        role: {
          select: {
            id: true,
            name: true,
            displayName: true
          }
        },
        status: true,
        createdAt: true,
        updatedAt: true,
        lastLoginAt: true,
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json(user)
  } catch (error) {
    console.error('Error fetching user:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    const { id } = await context.params
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get current user data for audit trail
    const currentUser = await prisma.user.findUnique({
      where: { id: id },
      select: {
        id: true,
        name: true,
        email: true,
        status: true,
        roleId: true,
      }
    })

    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const body = await request.json()
    const { name, email, password, status, roleId } = body

    const updateData: any = { name, email, status }
    if (roleId) updateData.roleId = roleId
    if (password) {
      updateData.password = await bcrypt.hash(password, 12)
    }

    const user = await prisma.user.update({
      where: { id: id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        status: true,
        roleId: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    // Log audit trail
    await AuditTrail.log({
      action: AUDIT_ACTIONS.UPDATE,
      entityType: AUDIT_ENTITY_TYPES.USER,
      entityId: user.id,
      oldValues: {
        name: currentUser.name,
        email: currentUser.email,
        status: currentUser.status,
        roleId: currentUser.roleId
      },
      newValues: {
        name: user.name,
        email: user.email,
        status: user.status,
        roleId: user.roleId
      },
      metadata: {
        updatedBy: session.user.id,
        source: 'admin_panel'
      }
    }, request)

    return NextResponse.json(user)
  } catch (error) {
    console.error('Error updating user:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    const { id } = await context.params
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Prevent admin from deleting themselves
    if (id === session.user.id) {
      return NextResponse.json(
        { error: 'Cannot delete your own account' },
        { status: 400 }
      )
    }

    // Get user data for audit trail before deletion
    const userToDelete = await prisma.user.findUnique({
      where: { id: id },
      select: {
        id: true,
        name: true,
        email: true,
        status: true,
        roleId: true,
      }
    })

    if (!userToDelete) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    await prisma.user.delete({
      where: { id: id }
    })

    // Log audit trail
    await AuditTrail.log({
      action: AUDIT_ACTIONS.DELETE,
      entityType: AUDIT_ENTITY_TYPES.USER,
      entityId: userToDelete.id,
      oldValues: {
        name: userToDelete.name,
        email: userToDelete.email,
        status: userToDelete.status,
        roleId: userToDelete.roleId
      },
      metadata: {
        deletedBy: session.user.id,
        source: 'admin_panel'
      }
    }, request)

    return NextResponse.json({ message: 'User deleted successfully' })
  } catch (error) {
    console.error('Error deleting user:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 