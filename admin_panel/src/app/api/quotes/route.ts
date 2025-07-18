import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { AuditTrail, AUDIT_ACTIONS, AUDIT_ENTITY_TYPES } from '@/lib/audit'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || ''
    const startDate = searchParams.get('startDate') || ''
    const endDate = searchParams.get('endDate') || ''

    const skip = (page - 1) * limit

    const where: any = {
      createdBy: session.user.id
    }

    if (search) {
      where.OR = [
        { quoteNumber: { contains: search } },
        { title: { contains: search } },
        { customerName: { contains: search } },
        { customerEmail: { contains: search } }
      ]
    }

    if (status && status !== 'all') {
      where.status = status
    }

    if (startDate || endDate) {
      where.createdAt = {}
      if (startDate) where.createdAt.gte = new Date(startDate)
      if (endDate) where.createdAt.lte = new Date(endDate)
    }

    const [quotes, total] = await Promise.all([
      prisma.quote.findMany({
        where,
        include: {
          items: {
            orderBy: { order: 'asc' }
          }
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.quote.count({ where })
    ])

    return NextResponse.json({
      quotes,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching quotes:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      title,
      description,
      customerId,
      customerName,
      customerEmail,
      customerPhone,
      customerAddress,
      taxRate,
      discountRate,
      validUntil,
      notes,
      terms,
      subtotal,
      taxAmount,
      discountAmount,
      total,
      items
    } = body

    if (!title || !customerName || !customerEmail) {
      return NextResponse.json(
        { error: 'Title, customer name and email are required' },
        { status: 400 }
      )
    }

    // Generate quote number
    const quoteCount = await prisma.quote.count()
    const quoteNumber = `TKF-${String(quoteCount + 1).padStart(6, '0')}`

    // Create quote
    const quote = await prisma.quote.create({
      data: {
        quoteNumber,
        title,
        description,
        customerId,
        customerName,
        customerEmail,
        customerPhone,
        customerAddress,
        taxRate: taxRate || 0,
        taxAmount: taxAmount || 0,
        discountRate: discountRate || 0,
        discountAmount: discountAmount || 0,
        total: total || 0,
        validUntil: validUntil ? new Date(validUntil) : null,
        notes,
        terms,
        createdBy: session.user.id,
        items: {
          create: items.map((item: any, index: number) => ({
            name: item.name,
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            total: item.total,
            order: index
          }))
        }
      },
      include: {
        items: true
      }
    })

    // Log audit trail
    await AuditTrail.log({
      action: AUDIT_ACTIONS.CREATE,
      entityType: 'Quote',
      entityId: quote.id,
      newValues: {
        quoteNumber: quote.quoteNumber,
        title: quote.title,
        customerName: quote.customerName,
        total: quote.total
      },
      metadata: {
        createdBy: session.user.id,
        source: 'admin_panel'
      }
    }, request)

    return NextResponse.json(quote, { status: 201 })
  } catch (error) {
    console.error('Error creating quote:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 