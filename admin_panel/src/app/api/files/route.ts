import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { AuditTrail, AUDIT_ACTIONS, AUDIT_ENTITY_TYPES } from '@/lib/audit'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import crypto from 'crypto'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''

    const skip = (page - 1) * limit

    const where = {
      userId: session.user.id,
      ...(search && {
        OR: [
          { name: { contains: search } },
          { originalName: { contains: search } },
        ]
      })
    }

    const [files, total] = await Promise.all([
      prisma.file.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.file.count({ where })
    ])

    return NextResponse.json({
      files,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching files:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('File upload request received')
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      console.log('Unauthorized file upload attempt')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('User authenticated:', session.user.id)
    const formData = await request.formData()
    const file = formData.get('file') as File
    const isPublic = formData.get('isPublic') === 'true'

    console.log('File received:', file?.name, 'Size:', file?.size, 'Type:', file?.type)

    if (!file) {
      console.log('No file provided')
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    // Dosya boyutu kontrolü (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File size too large. Maximum 10MB allowed.' },
        { status: 400 }
      )
    }

    // Güvenli dosya adı oluştur
    const fileId = crypto.randomBytes(16).toString('hex')
    const extension = file.name.split('.').pop()
    const fileName = `${fileId}.${extension}`

    // Uploads klasörünü oluştur
    const uploadsDir = join(process.cwd(), 'public', 'uploads')
    await mkdir(uploadsDir, { recursive: true })

    // Dosyayı kaydet
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const filePath = join(uploadsDir, fileName)
    await writeFile(filePath, buffer)

    // Veritabanına kaydet
    console.log('Saving file to database...')
    const savedFile = await prisma.file.create({
      data: {
        userId: session.user.id,
        name: file.name,
        originalName: file.name,
        type: file.type || 'unknown',
        mimeType: file.type,
        size: file.size,
        path: fileName,
        url: `/uploads/${fileName}`,
        isPublic: false // Varsayılan olarak private
      }
    })

    // Log audit trail
    await AuditTrail.log({
      action: AUDIT_ACTIONS.FILE_UPLOAD,
      entityType: AUDIT_ENTITY_TYPES.FILE,
      entityId: savedFile.id,
      newValues: {
        name: savedFile.name,
        originalName: savedFile.originalName,
        type: savedFile.type,
        size: savedFile.size,
        isPublic: savedFile.isPublic
      },
      metadata: {
        uploadedBy: session.user.id,
        source: 'admin_panel',
        fileType: file.type,
        fileSize: file.size
      }
    }, request)

    console.log('File saved successfully:', savedFile.id)
    return NextResponse.json(savedFile, { status: 201 })
  } catch (error) {
    console.error('Error uploading file:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 