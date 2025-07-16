import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')

    if (!query || query.length < 2) {
      return NextResponse.json({ results: [] })
    }

    // Farklı tablolarda arama yap
    const [users, files, notifications] = await Promise.all([
      // Kullanıcı arama
      prisma.user.findMany({
        where: {
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { email: { contains: query, mode: 'insensitive' } }
          ]
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true
        },
        take: 5
      }),
      
      // Dosya arama
      prisma.file.findMany({
        where: {
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { originalName: { contains: query, mode: 'insensitive' } }
          ]
        },
        select: {
          id: true,
          name: true,
          originalName: true,
          size: true,
          mimeType: true
        },
        take: 5
      }),
      
      // Bildirim arama
      prisma.notification.findMany({
        where: {
          userId: session.user.id,
          OR: [
            { title: { contains: query, mode: 'insensitive' } },
            { message: { contains: query, mode: 'insensitive' } }
          ]
        },
        select: {
          id: true,
          title: true,
          message: true,
          type: true,
          createdAt: true
        },
        take: 5
      })
    ])

    const results = {
      users: users.map(user => ({
        ...user,
        type: 'user',
        url: `/dashboard/users/${user.id}`
      })),
      files: files.map(file => ({
        ...file,
        type: 'file',
        url: `/dashboard/files/${file.id}`
      })),
      notifications: notifications.map(notification => ({
        ...notification,
        type: 'notification',
        url: `/dashboard/notifications`
      }))
    }

    return NextResponse.json({ results })
  } catch (error) {
    console.error('Arama hatası:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 