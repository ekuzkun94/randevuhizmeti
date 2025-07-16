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

    // Kullanıcının 2FA bilgilerini al
    const twoFactorAuth = await prisma.twoFactorAuth.findUnique({
      where: { userId: session.user.id }
    })

    if (!twoFactorAuth) {
      return NextResponse.json({
        isEnabled: false,
        isSetUp: false
      })
    }

    const backupCodes = twoFactorAuth.backupCodes 
      ? JSON.parse(twoFactorAuth.backupCodes)
      : []

    return NextResponse.json({
      isEnabled: twoFactorAuth.isEnabled,
      isSetUp: !!twoFactorAuth.secret,
      backupCodesCount: backupCodes.length
    })
  } catch (error) {
    console.error('Error fetching 2FA status:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 