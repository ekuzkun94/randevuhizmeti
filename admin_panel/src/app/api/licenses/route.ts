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
    const moduleId = searchParams.get('moduleId')
    const tenantId = searchParams.get('tenantId')
    const userId = searchParams.get('userId')
    const isActive = searchParams.get('isActive')

    const where: any = {}
    if (moduleId) where.moduleId = moduleId
    if (tenantId) where.tenantId = tenantId
    if (userId) where.userId = userId
    if (isActive !== null) where.isActive = isActive === 'true'

    const licenses = await prisma.moduleLicense.findMany({
      where,
      include: {
        module: true,
        tenant: true,
        user: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json({ licenses })
  } catch (error) {
    console.error('Licenses API error:', error)
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
    const { moduleId, tenantId, userId, isActive, expiresAt, features } = body

    if (!moduleId) {
      return NextResponse.json({ error: 'Module ID is required' }, { status: 400 })
    }

    // Check if license already exists
    const existingLicense = await prisma.moduleLicense.findFirst({
      where: {
        moduleId,
        tenantId: tenantId || null,
        userId: userId || null,
      },
    })

    if (existingLicense) {
      return NextResponse.json({ error: 'License already exists' }, { status: 400 })
    }

    const license = await prisma.moduleLicense.create({
      data: {
        moduleId,
        tenantId: tenantId || null,
        userId: userId || null,
        isActive: isActive !== false,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        features: features ? JSON.stringify(features) : null,
      },
      include: {
        module: true,
        tenant: true,
        user: true,
      },
    })

    return NextResponse.json({ license })
  } catch (error) {
    console.error('Licenses API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 