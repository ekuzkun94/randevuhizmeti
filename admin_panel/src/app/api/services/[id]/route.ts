import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { AuditTrail } from '@/lib/audit'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const service = await prisma.service.findUnique({
      where: { id },
      include: {
        providers: {
          include: {
            provider: true
          }
        },
        appointments: {
          include: {
            employee: true,
            customer: true,
            service: true,
            attachments: true
          }
        }
      }
    })

    if (!service) {
      return NextResponse.json(
        { error: 'Hizmet bulunamadı' },
        { status: 404 }
      )
    }

    return NextResponse.json(service)
  } catch (error) {
    console.error('Error fetching service:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const { name, description, duration, price, isActive } = body

    // Check if service exists
    const existingService = await prisma.service.findUnique({
      where: { id }
    })

    if (!existingService) {
      return NextResponse.json(
        { error: 'Hizmet bulunamadı' },
        { status: 404 }
      )
    }

    // Validation
    if (name !== undefined && (!name || !name.trim())) {
      return NextResponse.json(
        { error: 'Hizmet adı gereklidir' },
        { status: 400 }
      )
    }

    if (duration !== undefined && (!duration || duration <= 0)) {
      return NextResponse.json(
        { error: 'Geçerli bir süre belirtilmelidir' },
        { status: 400 }
      )
    }

    if (price !== undefined && price < 0) {
      return NextResponse.json(
        { error: 'Fiyat negatif olamaz' },
        { status: 400 }
      )
    }

    // Check if service name already exists (if name is being changed)
    if (name && name.trim() !== existingService.name) {
      const duplicateService = await prisma.service.findFirst({
        where: {
          name: { equals: name.trim(), mode: 'insensitive' },
          id: { not: id }
        }
      })

      if (duplicateService) {
        return NextResponse.json(
          { error: 'Bu isimde bir hizmet zaten mevcut' },
          { status: 409 }
        )
      }
    }

    // Update service
    const updatedService = await prisma.service.update({
      where: { id },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(description !== undefined && { description: description?.trim() }),
        ...(duration !== undefined && { duration: parseInt(duration) }),
        ...(price !== undefined && { price: price ? parseFloat(price) : null }),
        ...(isActive !== undefined && { isActive })
      }
    })

    // Log audit trail
    await AuditTrail.log({
      action: 'UPDATE',
      entityType: 'Service',
      entityId: id,
      userId: session.user?.id,
      oldValues: existingService,
      newValues: updatedService,
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown'
    })

    return NextResponse.json(updatedService)
  } catch (error) {
    console.error('Error updating service:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Check if service exists
    const existingService = await prisma.service.findUnique({
      where: { id },
      include: {
        appointments: true,
        providers: true
      }
    })

    if (!existingService) {
      return NextResponse.json(
        { error: 'Hizmet bulunamadı' },
        { status: 404 }
      )
    }

    // Check if service has appointments
    if (existingService.appointments.length > 0) {
      return NextResponse.json(
        { error: 'Bu hizmete ait randevular bulunduğu için silinemez' },
        { status: 409 }
      )
    }

    // Check if service has providers
    if (existingService.providers.length > 0) {
      return NextResponse.json(
        { error: 'Bu hizmete ait hizmet sağlayıcıları bulunduğu için silinemez' },
        { status: 409 }
      )
    }

    // Delete service
    await prisma.service.delete({
      where: { id }
    })

    // Log audit trail
    await AuditTrail.log({
      action: 'DELETE',
      entityType: 'Service',
      entityId: id,
      userId: session.user?.id,
      oldValues: existingService,
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown'
    })

    return NextResponse.json({ message: 'Hizmet başarıyla silindi' })
  } catch (error) {
    console.error('Error deleting service:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 