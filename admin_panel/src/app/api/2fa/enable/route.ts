import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import speakeasy from 'speakeasy'
import crypto from 'crypto'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { token } = body

    if (!token) {
      return NextResponse.json(
        { error: 'Token is required' },
        { status: 400 }
      )
    }

    // Kullanıcının 2FA bilgilerini al
    const twoFactorAuth = await prisma.twoFactorAuth.findUnique({
      where: { userId: session.user.id }
    })

    if (!twoFactorAuth || !twoFactorAuth.secret) {
      return NextResponse.json(
        { error: '2FA not set up. Please set up 2FA first.' },
        { status: 400 }
      )
    }

    // Token'ı doğrula
    const verified = speakeasy.totp.verify({
      secret: twoFactorAuth.secret,
      encoding: 'base32',
      token: token,
      window: 2 // 2 dakikalık tolerans
    })

    if (!verified) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 400 }
      )
    }

    // Yedek kodlar oluştur
    const backupCodes = Array.from({ length: 10 }, () => 
      crypto.randomInt(100000, 999999).toString()
    )

    // 2FA'yı aktif et
    await prisma.twoFactorAuth.update({
      where: { userId: session.user.id },
      data: {
        isEnabled: true,
        backupCodes: JSON.stringify(backupCodes)
      }
    })

    return NextResponse.json({
      message: '2FA enabled successfully',
      backupCodes
    })
  } catch (error) {
    console.error('Error enabling 2FA:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 