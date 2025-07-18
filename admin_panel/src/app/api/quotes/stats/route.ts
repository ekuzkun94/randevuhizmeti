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

    const where = {
      createdBy: session.user.id
    }

    const [
      total,
      draft,
      sent,
      accepted,
      rejected,
      totalValue,
      thisMonth
    ] = await Promise.all([
      prisma.quote.count({ where }),
      prisma.quote.count({ where: { ...where, status: 'DRAFT' } }),
      prisma.quote.count({ where: { ...where, status: 'SENT' } }),
      prisma.quote.count({ where: { ...where, status: 'ACCEPTED' } }),
      prisma.quote.count({ where: { ...where, status: 'REJECTED' } }),
      prisma.quote.aggregate({
        where: { ...where, status: 'ACCEPTED' },
        _sum: { total: true }
      }),
      prisma.quote.count({
        where: {
          ...where,
          createdAt: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
          }
        }
      })
    ])

    return NextResponse.json({
      total,
      draft,
      sent,
      accepted,
      rejected,
      totalValue: totalValue._sum.total || 0,
      thisMonth
    })
  } catch (error) {
    console.error('Error fetching quote stats:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 