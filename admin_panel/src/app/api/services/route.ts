import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { AuditTrail } from '@/lib/audit'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Debug: Check if prisma is defined
    console.log('Prisma client:', prisma)
    console.log('Prisma service:', prisma?.service)

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const isActive = searchParams.get('isActive')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {}
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ]
    }
    
    if (isActive !== null && isActive !== undefined) {
      where.isActive = isActive === 'true'
    }

    // Get services with pagination
    const [services, total] = await Promise.all([
      prisma.service.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.service.count({ where })
    ])

    return NextResponse.json(services, {
      headers: {
        'X-Total-Count': total.toString(),
        'X-Page': page.toString(),
        'X-Limit': limit.toString(),
      }
    })
  } catch (error) {
    console.error('Error fetching services:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, description, duration, price, isActive = true } = body

    // Validation
    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: 'Hizmet adı gereklidir' },
        { status: 400 }
      )
    }

    if (!duration || duration <= 0) {
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

    // Check if service name already exists
    const existingService = await prisma.service.findFirst({
      where: {
        name: name.trim()
      }
    })

    if (existingService) {
      return NextResponse.json(
        { error: 'Bu isimde bir hizmet zaten mevcut' },
        { status: 409 }
      )
    }

    // Create service
    const service = await prisma.service.create({
      data: {
        name: name.trim(),
        description: description?.trim(),
        duration: parseInt(duration),
        price: price ? parseFloat(price) : null,
        isActive
      }
    })

    // Log audit trail
    await AuditTrail.log({
      action: 'CREATE',
      entityType: 'Service',
      entityId: service.id,
      userId: session.user?.id,
      newValues: service,
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown'
    })

    return NextResponse.json(service, { status: 201 })
  } catch (error) {
    console.error('Error creating service:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 