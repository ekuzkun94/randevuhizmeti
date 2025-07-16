import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const skip = (page - 1) * limit

    const where = {
      OR: [
        { name: { contains: search } },
        { displayName: { contains: search } },
        { description: { contains: search } },
      ],
    }

    const [roles, total] = await Promise.all([
      prisma.role.findMany({
        where,
        include: {
          _count: {
            select: {
              users: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.role.count({ where }),
    ])

    const rolesWithPermissions = await Promise.all(
      roles.map(async (role) => {
        const rolePermissions = await prisma.rolePermission.findMany({
          where: { roleId: role.id },
          include: { permission: true },
        })

        return {
          ...role,
          permissions: rolePermissions.map(rp => rp.permission.name),
          userCount: role._count.users,
        }
      })
    )

    return NextResponse.json({
      roles: rolesWithPermissions,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Get roles error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, displayName, description, permissions, isSystem = false } = body

    // Validation
    if (!name || !displayName) {
      return NextResponse.json(
        { error: 'Name and displayName are required' },
        { status: 400 }
      )
    }

    // Check if role already exists
    const existingRole = await prisma.role.findUnique({
      where: { name },
    })

    if (existingRole) {
      return NextResponse.json(
        { error: 'Role with this name already exists' },
        { status: 400 }
      )
    }

    // Create role
    const role = await prisma.role.create({
      data: {
        name,
        displayName,
        description,
        isSystem,
      },
    })

    // Create permissions if provided
    if (permissions && permissions.length > 0) {
      // First, ensure all permissions exist
      const permissionRecords = await Promise.all(
        permissions.map(async (permissionName: string) => {
          let permission = await prisma.permission.findUnique({
            where: { name: permissionName },
          })

          if (!permission) {
            permission = await prisma.permission.create({
              data: {
                name: permissionName,
                description: `Permission for ${permissionName}`,
              },
            })
          }

          return permission
        })
      )

      // Create role-permission relationships
      await prisma.rolePermission.createMany({
        data: permissionRecords.map(permission => ({
          roleId: role.id,
          permissionId: permission.id,
        })),
      })
    }

    return NextResponse.json({ role }, { status: 201 })
  } catch (error) {
    console.error('Create role error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 