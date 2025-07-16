import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

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

    await prisma.apiKey.delete({
      where: { 
        id: id,
        userId: session.user.id // Sadece kendi API key'lerini silebilir
      }
    })

    return NextResponse.json({ message: 'API key deleted successfully' })
  } catch (error) {
    console.error('Error deleting API key:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 