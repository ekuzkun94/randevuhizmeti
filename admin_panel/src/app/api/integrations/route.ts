import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const isActive = searchParams.get('isActive')
    const isPremium = searchParams.get('isPremium')

    const where: any = {}
    if (category) where.category = category
    if (isActive !== null) where.isActive = isActive === 'true'
    if (isPremium !== null) where.isPremium = isPremium === 'true'

    const integrations = await prisma.integration.findMany({
      where,
      include: {
        installations: {
          include: {
            tenant: true,
            user: true,
          },
        },
        _count: {
          select: { installations: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ integrations })
  } catch (error) {
    console.error('Integrations API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, description, isActive, isPremium } = body

    if (!name) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const integration = await prisma.integration.create({
      data: {
        name,
        displayName: name,
        description,
        type: 'API',
        config: '',
        isActive: isActive !== false,
        isPremium: isPremium || false
      },
    })

    return NextResponse.json({ integration })
  } catch (error) {
    console.error('Integrations API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 