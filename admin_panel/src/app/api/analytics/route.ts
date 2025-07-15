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

    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || '7d' // 7d, 30d, 90d, 1y

    // Tarih aralığını hesapla
    const now = new Date()
    let startDate = new Date()
    
    switch (period) {
      case '7d':
        startDate.setDate(now.getDate() - 7)
        break
      case '30d':
        startDate.setDate(now.getDate() - 30)
        break
      case '90d':
        startDate.setDate(now.getDate() - 90)
        break
      case '1y':
        startDate.setFullYear(now.getFullYear() - 1)
        break
      default:
        startDate.setDate(now.getDate() - 7)
    }

    // Kullanıcı istatistikleri
    const [totalUsers, activeUsers, newUsers, userGrowth] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({
        where: {
          status: 'ACTIVE',
          lastLoginAt: {
            gte: startDate
          }
        }
      }),
      prisma.user.count({
        where: {
          createdAt: {
            gte: startDate
          }
        }
      }),
      prisma.user.groupBy({
        by: ['role'],
        _count: {
          id: true
        }
      })
    ])

    // Günlük kullanıcı aktivitesi
    const dailyActivity = await prisma.user.findMany({
      where: {
        lastLoginAt: {
          gte: startDate
        }
      },
      select: {
        lastLoginAt: true
      }
    })

    // Rol dağılımı
    const roleDistribution = userGrowth.reduce((acc, item) => {
      acc[item.role] = item._count.id
      return acc
    }, {} as Record<string, number>)

    // Günlük aktivite grafiği için veri
    const activityByDay = dailyActivity.reduce((acc, user) => {
      if (user.lastLoginAt) {
        const date = user.lastLoginAt.toISOString().split('T')[0]
        acc[date] = (acc[date] || 0) + 1
      }
      return acc
    }, {} as Record<string, number>)

    // Performans metrikleri
    const performanceMetrics = {
      totalUsers,
      activeUsers,
      newUsers,
      userGrowthRate: totalUsers > 0 ? ((newUsers / totalUsers) * 100).toFixed(2) : '0',
      activeUserRate: totalUsers > 0 ? ((activeUsers / totalUsers) * 100).toFixed(2) : '0'
    }

    return NextResponse.json({
      performanceMetrics,
      roleDistribution,
      activityByDay,
      period
    })
  } catch (error) {
    console.error('Error fetching analytics:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 