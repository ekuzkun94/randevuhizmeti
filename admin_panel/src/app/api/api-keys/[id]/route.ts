import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { AuditTrail, AUDIT_ACTIONS, AUDIT_ENTITY_TYPES } from '@/lib/audit'

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    const { id } = await context.params
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get current API key data for audit trail
    const currentApiKey = await prisma.apiKey.findUnique({
      where: { 
        id: id,
        userId: session.user.id
      }
    })

    if (!currentApiKey) {
      return NextResponse.json({ error: 'API key not found' }, { status: 404 })
    }

    const body = await request.json()
    const { name, permissions, isActive, expiresAt } = body

    const updateData: any = {}
    
    if (name !== undefined) updateData.name = name
    if (permissions !== undefined) updateData.permissions = JSON.stringify(permissions)
    if (isActive !== undefined) updateData.isActive = isActive
    if (expiresAt !== undefined) {
      updateData.expiresAt = expiresAt ? new Date(expiresAt) : null
    }

    const apiKey = await prisma.apiKey.update({
      where: { 
        id: id,
        userId: session.user.id // Sadece kendi API key'lerini güncelleyebilir
      },
      data: updateData,
      select: {
        id: true,
        name: true,
        key: true,
        permissions: true,
        expiresAt: true,
        isActive: true,
        createdAt: true
      }
    })

    // Log audit trail
    await AuditTrail.log({
      action: AUDIT_ACTIONS.UPDATE,
      entityType: AUDIT_ENTITY_TYPES.API_KEY,
      entityId: apiKey.id,
      oldValues: {
        name: currentApiKey.name,
        permissions: JSON.parse(currentApiKey.permissions || '[]'),
        isActive: currentApiKey.isActive,
        expiresAt: currentApiKey.expiresAt
      },
      newValues: {
        name: apiKey.name,
        permissions: JSON.parse(apiKey.permissions || '[]'),
        isActive: apiKey.isActive,
        expiresAt: apiKey.expiresAt
      },
      metadata: {
        updatedBy: session.user.id,
        source: 'admin_panel'
      }
    }, request)

    // API key'i maskele
    const maskedApiKey = {
      ...apiKey,
      key: apiKey.key.substring(0, 8) + '...' + apiKey.key.substring(apiKey.key.length - 4)
    }

    return NextResponse.json(maskedApiKey)
  } catch (error) {
    console.error('Error updating API key:', error)
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
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get API key data for audit trail before deletion
    const apiKeyToDelete = await prisma.apiKey.findUnique({
      where: { 
        id: id,
        userId: session.user.id
      }
    })

    if (!apiKeyToDelete) {
      return NextResponse.json({ error: 'API key not found' }, { status: 404 })
    }

    await prisma.apiKey.delete({
      where: { 
        id: id,
        userId: session.user.id // Sadece kendi API key'lerini silebilir
      }
    })

    // Log audit trail
    await AuditTrail.log({
      action: AUDIT_ACTIONS.API_KEY_DELETE,
      entityType: AUDIT_ENTITY_TYPES.API_KEY,
      entityId: apiKeyToDelete.id,
      oldValues: {
        name: apiKeyToDelete.name,
        permissions: JSON.parse(apiKeyToDelete.permissions || '[]'),
        isActive: apiKeyToDelete.isActive,
        expiresAt: apiKeyToDelete.expiresAt
      },
      metadata: {
        deletedBy: session.user.id,
        source: 'admin_panel'
      }
    }, request)

    return NextResponse.json({ message: 'API key deleted successfully' })
  } catch (error) {
    console.error('Error deleting API key:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 