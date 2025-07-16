import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { integrationId, tenantId, userId, config, isActive } = body

    if (!integrationId) {
      return NextResponse.json({ error: 'Integration ID is required' }, { status: 400 })
    }

    // Check if integration exists and is active
    const integration = await prisma.integration.findUnique({
      where: { id: integrationId },
    })

    if (!integration || !integration.isActive) {
      return NextResponse.json({ error: 'Integration not found or inactive' }, { status: 400 })
    }

    // Check if already installed
    const existingInstallation = await prisma.integrationInstallation.findFirst({
      where: {
        integrationId,
        tenantId: tenantId || null,
        userId: userId || null,
      },
    })

    if (existingInstallation) {
      return NextResponse.json({ error: 'Integration already installed' }, { status: 400 })
    }

    const installation = await prisma.integrationInstallation.create({
      data: {
        integrationId,
        tenantId: tenantId || null,
        userId: userId || null,
        config: config ? JSON.stringify(config) : '',
        isActive: isActive !== false,
      },
      include: {
        integration: true,
        tenant: true,
        user: true,
      },
    })

    return NextResponse.json({ installation })
  } catch (error) {
    console.error('Integration install API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 