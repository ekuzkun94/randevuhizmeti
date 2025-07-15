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
    const isActive = searchParams.get('isActive')
    const isPremium = searchParams.get('isPremium')

    const where: any = {}
    if (isActive !== null) where.isActive = isActive === 'true'
    if (isPremium !== null) where.isPremium = isPremium === 'true'

    const modules = await prisma.module.findMany({
      where,
      include: {
        licenses: {
          include: {
            tenant: true,
            user: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json({ modules })
  } catch (error) {
    console.error('Modules API error:', error)
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
    const { name, displayName, description, version, isActive, isPremium, price, features } = body

    if (!name || !displayName) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const module = await prisma.module.create({
      data: {
        name,
        displayName,
        description,
        version: version || '1.0.0',
        isActive: isActive !== false,
        isPremium: isPremium || false,
        price: price || null,
        features: features ? JSON.stringify(features) : null,
      },
    })

    return NextResponse.json({ module })
  } catch (error) {
    console.error('Modules API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 