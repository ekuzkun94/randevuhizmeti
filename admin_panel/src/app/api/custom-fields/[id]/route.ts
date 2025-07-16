import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

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

    const customField = await prisma.customField.findUnique({
      where: { id: id },
      include: {
        values: {
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
        },
      },
    })

    if (!customField) {
      return NextResponse.json({ error: 'Custom field not found' }, { status: 404 })
    }

    return NextResponse.json({ customField })
  } catch (error) {
    console.error('Custom field API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
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

    const body = await request.json()
    const { name, label, type, entityType, isRequired, isUnique, options } = body

    const customField = await prisma.customField.update({
      where: { id: id },
      data: {
        name,
        label,
        type,
        entityType,
        isRequired,
        isUnique,
        options: options ? JSON.stringify(options) : null,
      },
    })

    return NextResponse.json({ customField })
  } catch (error) {
    console.error('Custom field update error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
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

    const customField = await prisma.customField.findUnique({
      where: { id: id },
    })

    if (!customField) {
      return NextResponse.json({ error: 'Custom field not found' }, { status: 404 })
    }

    await prisma.customField.delete({
      where: { id: id },
    })

    return NextResponse.json({ message: 'Custom field deleted successfully' })
  } catch (error) {
    console.error('Custom field deletion error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 