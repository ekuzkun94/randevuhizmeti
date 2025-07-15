import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { VersioningService } from '@/lib/versioning'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const entityType = searchParams.get('entityType')
    const entityId = searchParams.get('entityId')

    if (entityType && entityId) {
      // Get versions for specific entity
      const versions = await VersioningService.getVersions(entityType, entityId)
      return NextResponse.json({ versions })
    } else {
      // Get version statistics
      const stats = await VersioningService.getVersionStats()
      return NextResponse.json(stats)
    }
  } catch (error) {
    console.error('Versions API error:', error)
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
    const { entityType, entityId, data, changeType, changeReason } = body

    if (!entityType || !entityId || !data || !changeType) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const version = await VersioningService.createVersion({
      entityType,
      entityId,
      data,
      authorId: session.user.id,
      changeType,
      changeReason,
    })

    return NextResponse.json({ version })
  } catch (error) {
    console.error('Versions API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 