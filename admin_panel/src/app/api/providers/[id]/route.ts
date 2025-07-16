import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    const { id } = await context.params
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const provider = await prisma.provider.findUnique({
      where: { id }
    })

    if (!provider) {
      return NextResponse.json({ error: 'Provider not found' }, { status: 404 })
    }

    return NextResponse.json(provider)
  } catch (error) {
    console.error('Error fetching provider:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    const { id } = await context.params
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, email, phone } = body

    // Check if provider exists
    const existingProvider = await prisma.provider.findUnique({
      where: { id }
    })

    if (!existingProvider) {
      return NextResponse.json({ error: 'Provider not found' }, { status: 404 })
    }

    // Check if email already exists (excluding current provider)
    if (email && email !== existingProvider.email) {
      const emailExists = await prisma.provider.findUnique({
        where: { email }
      })

      if (emailExists) {
        return NextResponse.json({ error: 'Email already exists' }, { status: 400 })
      }
    }

    const updatedProvider = await prisma.provider.update({
      where: { id },
      data: {
        name,
        email,
        phone
      }
    })

    return NextResponse.json(updatedProvider)
  } catch (error) {
    console.error('Error updating provider:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    const { id } = await context.params
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if provider exists
    const provider = await prisma.provider.findUnique({
      where: { id }
    })

    if (!provider) {
      return NextResponse.json({ error: 'Provider not found' }, { status: 404 })
    }

    // Check if provider has appointments
    const appointmentCount = await prisma.appointment.count({
      where: { providerId: id }
    })

    if (appointmentCount > 0) {
      return NextResponse.json({ 
        error: 'Cannot delete provider with existing appointments' 
      }, { status: 400 })
    }

    await prisma.provider.delete({
      where: { id }
    })

    return NextResponse.json({ message: 'Provider deleted successfully' })
  } catch (error) {
    console.error('Error deleting provider:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 