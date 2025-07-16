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
    const provider = searchParams.get('provider')
    const status = searchParams.get('status')

    const skip = (page - 1) * limit

    const where: any = {}
    if (provider) where.provider = provider
    if (status) where.status = status

    const [integrations, total] = await Promise.all([
      prisma.oAuthProvider.findMany({
        where,
        include: {
          _count: {
            select: { connections: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.oAuthProvider.count({ where }),
    ])

    return NextResponse.json({
      integrations,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('SSO API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, provider, clientId, clientSecret, redirectUri, scopes, isActive } = body

    if (!name || !provider || !clientId || !clientSecret) {
      return NextResponse.json({ error: 'Name, provider, clientId, and clientSecret are required' }, { status: 400 })
    }

    const integration = await prisma.oAuthProvider.create({
      data: {
        name,
        provider,
        clientId,
        clientSecret,
        redirectUri,
        scopes: scopes ? JSON.stringify(scopes) : '[]',
        isActive: isActive || false,
      },
    })

    return NextResponse.json({ integration }, { status: 201 })
  } catch (error) {
    console.error('SSO integration creation error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 