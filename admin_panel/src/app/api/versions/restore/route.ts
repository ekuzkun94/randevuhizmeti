import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { VersioningService } from '@/lib/versioning'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { entityType, entityId, version, changeReason } = body

    if (!entityType || !entityId || !version) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const restoredVersion = await VersioningService.restoreVersion(
      entityType,
      entityId,
      version,
      session.user.id,
      changeReason
    )

    return NextResponse.json({ 
      version: restoredVersion,
      message: `Successfully restored to version ${version}`
    })
  } catch (error) {
    console.error('Version restore API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 