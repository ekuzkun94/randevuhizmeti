import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

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
    const providerId = searchParams.get('providerId') || ''
    const skip = (page - 1) * limit
    const where: any = {}
    if (search) {
      where.name = { contains: search }
    }
    if (providerId) {
      where.providerId = providerId
    }
    const [employees, total] = await Promise.all([
      prisma.employee.findMany({
        where,
        include: { provider: { select: { id: true, name: true } } },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.employee.count({ where })
    ])
    return NextResponse.json({
      employees,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching employees:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const body = await request.json()
    const { name, email, phone, position, providerId, isActive } = body
    if (!name || !providerId) {
      return NextResponse.json({ error: 'Çalışan adı ve işletme zorunlu' }, { status: 400 })
    }
    const employee = await prisma.employee.create({
      data: {
        name,
        email,
        phone,
        position,
        providerId,
        isActive: isActive !== undefined ? isActive : true
      }
    })
    return NextResponse.json(employee, { status: 201 })
  } catch (error) {
    console.error('Error creating employee:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 