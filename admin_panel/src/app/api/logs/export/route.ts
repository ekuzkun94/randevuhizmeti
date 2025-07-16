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
    const format = searchParams.get('format') || 'json'
    const level = searchParams.get('level') || ''
    const type = searchParams.get('type') || ''
    const startDate = searchParams.get('startDate') || ''
    const endDate = searchParams.get('endDate') || ''

    const where: any = {
      ...(level && { level }),
      ...(type && { type }),
      ...(startDate && endDate && {
        createdAt: {
          gte: new Date(startDate),
          lte: new Date(endDate)
        }
      })
    }

    const logs = await prisma.log.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    if (format === 'csv') {
      const csvHeaders = ['Tarih', 'Seviye', 'Tip', 'Mesaj', 'Kullanıcı', 'IP']
      const csvRows = logs.map(log => [
        new Date(log.createdAt).toLocaleString('tr-TR'),
        log.level,
        log.type,
        log.message,
        log.user?.name || 'Sistem',
        log.metadata ? (() => { try { return JSON.parse(log.metadata).ip || '' } catch { return '' } })() : ''
      ])

      const csvContent = [csvHeaders, ...csvRows]
        .map(row => row.map(cell => `"${cell}"`).join(','))
        .join('\n')

      return new NextResponse(csvContent, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="logs-${new Date().toISOString().split('T')[0]}.csv"`
        }
      })
    }

    // JSON format (default)
    return NextResponse.json(logs)
  } catch (error) {
    console.error('Error exporting logs:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 