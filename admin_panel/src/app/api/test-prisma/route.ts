import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    console.log('Testing Prisma client...')
    console.log('Prisma client:', prisma)
    console.log('Prisma service:', prisma?.service)
    
    // Try to count services
    const count = await prisma.service.count()
    console.log('Service count:', count)
    
    return NextResponse.json({ 
      success: true, 
      message: 'Prisma is working',
      serviceCount: count,
      prismaClient: !!prisma,
      serviceModel: !!prisma?.service
    })
  } catch (error) {
    console.error('Prisma test error:', error)
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error',
      prismaClient: !!prisma,
      serviceModel: !!prisma?.service
    }, { status: 500 })
  }
} 