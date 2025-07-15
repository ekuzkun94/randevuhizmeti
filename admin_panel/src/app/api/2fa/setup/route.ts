import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import speakeasy from 'speakeasy'
import QRCode from 'qrcode'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Yeni secret oluştur
    const secret = speakeasy.generateSecret({
      name: `Admin Panel (${session.user.email})`,
      issuer: 'Admin Panel',
      length: 20
    })

    // QR kod oluştur
    const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url!)

    // Kullanıcının 2FA durumunu güncelle (henüz aktif değil)
    await prisma.twoFactorAuth.upsert({
      where: { userId: session.user.id },
      update: {
        secret: secret.base32,
        isEnabled: false,
        backupCodes: null
      },
      create: {
        userId: session.user.id,
        secret: secret.base32,
        isEnabled: false
      }
    })

    return NextResponse.json({
      secret: secret.base32,
      qrCode: qrCodeUrl,
      otpauthUrl: secret.otpauth_url
    })
  } catch (error) {
    console.error('Error setting up 2FA:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 