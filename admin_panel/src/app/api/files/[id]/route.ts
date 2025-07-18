import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { AuditTrail, AUDIT_ACTIONS, AUDIT_ENTITY_TYPES } from '@/lib/audit'
import { unlink } from 'fs/promises'
import { join } from 'path'

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

    // Dosyayı veritabanından al
    const file = await prisma.file.findUnique({
      where: { 
        id: id,
        userId: session.user.id // Sadece kendi dosyalarını silebilir
      }
    })

    if (!file) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }

    // Fiziksel dosyayı sil
    try {
      const filePath = join(process.cwd(), 'public', 'uploads', file.path)
      await unlink(filePath)
    } catch (error) {
      console.error('Error deleting physical file:', error)
      // Fiziksel dosya silinmese bile veritabanından sil
    }

    // Veritabanından sil
    await prisma.file.delete({
      where: { id: id }
    })

    // Log audit trail
    await AuditTrail.log({
      action: AUDIT_ACTIONS.FILE_DELETE,
      entityType: AUDIT_ENTITY_TYPES.FILE,
      entityId: file.id,
      oldValues: {
        name: file.name,
        originalName: file.originalName,
        type: file.type,
        size: file.size,
        isPublic: file.isPublic
      },
      metadata: {
        deletedBy: session.user.id,
        source: 'admin_panel',
        filePath: file.path
      }
    }, request)

    return NextResponse.json({ message: 'File deleted successfully' })
  } catch (error) {
    console.error('Error deleting file:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    const { id } = await context.params
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get current file data for audit trail
    const currentFile = await prisma.file.findUnique({
      where: { 
        id: id,
        userId: session.user.id
      }
    })

    if (!currentFile) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }

    const body = await request.json()
    const { name, isPublic } = body

    const updateData: any = {}
    
    if (name !== undefined) updateData.name = name
    if (isPublic !== undefined) updateData.isPublic = isPublic

    const file = await prisma.file.update({
      where: { 
        id: id,
        userId: session.user.id // Sadece kendi dosyalarını güncelleyebilir
      },
      data: updateData
    })

    // Log audit trail
    await AuditTrail.log({
      action: AUDIT_ACTIONS.UPDATE,
      entityType: AUDIT_ENTITY_TYPES.FILE,
      entityId: file.id,
      oldValues: {
        name: currentFile.name,
        isPublic: currentFile.isPublic
      },
      newValues: {
        name: file.name,
        isPublic: file.isPublic
      },
      metadata: {
        updatedBy: session.user.id,
        source: 'admin_panel'
      }
    }, request)

    return NextResponse.json(file)
  } catch (error) {
    console.error('Error updating file:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 