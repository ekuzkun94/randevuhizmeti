import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { unlink } from 'fs/promises'
import { join } from 'path'

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Dosyayı veritabanından al
    const file = await prisma.file.findUnique({
      where: { 
        id: params.id,
        userId: session.user.id // Sadece kendi dosyalarını silebilir
      }
    })

    if (!file) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }

    // Fiziksel dosyayı sil
    try {
      const filePath = join(process.cwd(), 'public', 'uploads', file.path)
      await unlink(filePath)
    } catch (error) {
      console.error('Error deleting physical file:', error)
      // Fiziksel dosya silinmese bile veritabanından sil
    }

    // Veritabanından sil
    await prisma.file.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ message: 'File deleted successfully' })
  } catch (error) {
    console.error('Error deleting file:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, isPublic } = body

    const updateData: any = {}
    
    if (name !== undefined) updateData.name = name
    if (isPublic !== undefined) updateData.isPublic = isPublic

    const file = await prisma.file.update({
      where: { 
        id: params.id,
        userId: session.user.id // Sadece kendi dosyalarını güncelleyebilir
      },
      data: updateData
    })

    return NextResponse.json(file)
  } catch (error) {
    console.error('Error updating file:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 