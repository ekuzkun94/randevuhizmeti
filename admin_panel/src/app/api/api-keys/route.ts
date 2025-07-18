import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { AuditTrail, AUDIT_ACTIONS, AUDIT_ENTITY_TYPES } from '@/lib/audit'
import crypto from 'crypto'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')

    const skip = (page - 1) * limit

    const where = {
      userId: session.user.id
    }

    const [apiKeys, total] = await Promise.all([
      prisma.apiKey.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        select: {
          id: true,
          name: true,
          key: true,
          permissions: true,
          expiresAt: true,
          isActive: true,
          createdAt: true
        }
      }),
      prisma.apiKey.count({ where })
    ])

    // API key'leri maskeleme (sadece ilk 8 karakteri göster)
    const maskedApiKeys = apiKeys.map(key => ({
      ...key,
      key: key.key.substring(0, 8) + '...' + key.key.substring(key.key.length - 4)
    }))

    return NextResponse.json({
      apiKeys: maskedApiKeys,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching API keys:', error)
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
    const { name, permissions = [], expiresAt } = body

    if (!name) {
      return NextResponse.json(
        { error: 'API key name is required' },
        { status: 400 }
      )
    }

    // API key oluştur
    const apiKey = crypto.randomBytes(32).toString('hex')
    
    // ExpiresAt'i parse et
    let expiresAtDate = null
    if (expiresAt) {
      expiresAtDate = new Date(expiresAt)
    }

    const newApiKey = await prisma.apiKey.create({
      data: {
        userId: session.user.id,
        name,
        key: apiKey,
        permissions: JSON.stringify(permissions),
        expiresAt: expiresAtDate
      },
      select: {
        id: true,
        name: true,
        key: true,
        permissions: true,
        expiresAt: true,
        isActive: true,
        createdAt: true
      }
    })

    // Log audit trail
    await AuditTrail.log({
      action: AUDIT_ACTIONS.API_KEY_CREATE,
      entityType: AUDIT_ENTITY_TYPES.API_KEY,
      entityId: newApiKey.id,
      newValues: {
        name: newApiKey.name,
        permissions: permissions,
        expiresAt: expiresAtDate,
        isActive: newApiKey.isActive
      },
      metadata: {
        createdBy: session.user.id,
        source: 'admin_panel'
      }
    }, request)

    return NextResponse.json(newApiKey, { status: 201 })
  } catch (error) {
    console.error('Error creating API key:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 