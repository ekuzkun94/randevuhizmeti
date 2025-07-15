import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import speakeasy from 'speakeasy'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { token, backupCode } = body

    if (!token && !backupCode) {
      return NextResponse.json(
        { error: 'Token or backup code is required' },
        { status: 400 }
      )
    }

    // Kullanıcının 2FA bilgilerini al
    const twoFactorAuth = await prisma.twoFactorAuth.findUnique({
      where: { userId: session.user.id }
    })

    if (!twoFactorAuth || !twoFactorAuth.isEnabled) {
      return NextResponse.json(
        { error: '2FA is not enabled' },
        { status: 400 }
      )
    }

    let verified = false

    if (backupCode) {
      // Yedek kod kontrolü
      const backupCodes = JSON.parse(twoFactorAuth.backupCodes || '[]')
      const codeIndex = backupCodes.indexOf(backupCode)
      
      if (codeIndex !== -1) {
        // Kullanılan kodu listeden çıkar
        backupCodes.splice(codeIndex, 1)
        await prisma.twoFactorAuth.update({
          where: { userId: session.user.id },
          data: { backupCodes: JSON.stringify(backupCodes) }
        })
        verified = true
      }
    } else if (token) {
      // TOTP token kontrolü
      verified = speakeasy.totp.verify({
        secret: twoFactorAuth.secret,
        encoding: 'base32',
        token: token,
        window: 2
      })
    }

    if (!verified) {
      return NextResponse.json(
        { error: 'Invalid token or backup code' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      message: '2FA verification successful'
    })
  } catch (error) {
    console.error('Error verifying 2FA:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 