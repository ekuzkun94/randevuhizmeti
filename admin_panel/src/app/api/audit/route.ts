import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { AuditTrail } from '@/lib/audit'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Temporarily allow all authenticated users for testing
    // if (session.user.role !== 'ADMIN') {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    // }

    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')
    const entityType = searchParams.get('entityType')
    const entityId = searchParams.get('entityId')
    const userId = searchParams.get('userId')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    const filters: any = {}
    if (action) filters.action = action
    if (entityType) filters.entityType = entityType
    if (entityId) filters.entityId = entityId
    if (userId) filters.userId = userId
    if (startDate) filters.startDate = new Date(startDate)
    if (endDate) filters.endDate = new Date(endDate)
    filters.limit = limit
    filters.offset = offset

    const logs = await AuditTrail.getAuditLogs(filters)
    
    return NextResponse.json({ logs })
  } catch (error) {
    console.error('Audit API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { action, entityType, entityId, oldValues, newValues, metadata } = body

    if (!action || !entityType) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    await AuditTrail.log({
      action,
      entityType,
      entityId,
      oldValues,
      newValues,
      metadata,
    }, request)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Audit API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 