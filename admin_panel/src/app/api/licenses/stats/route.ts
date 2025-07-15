import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { LicensingService } from '@/lib/licensing'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const stats = await LicensingService.getLicenseStats()
    
    if (!stats) {
      return NextResponse.json({ error: 'Failed to get stats' }, { status: 500 })
    }

    return NextResponse.json(stats)
  } catch (error) {
    console.error('License stats API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 