const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function createAdminUser() {
  try {
    // Önce admin rolünü bul veya oluştur
    let adminRole = await prisma.role.findFirst({
      where: { name: 'ADMIN' }
    })

    if (!adminRole) {
      adminRole = await prisma.role.create({
        data: {
          name: 'ADMIN',
          displayName: 'Administrator',
          description: 'System administrator with full access',
          isSystem: true
        }
      })
      console.log('Admin role created:', adminRole.name)
    }

    const hashedPassword = bcrypt.hashSync('admin123', 10)
    
    const adminUser = await prisma.user.upsert({
      where: { email: 'admin@example.com' },
      update: {
        password: hashedPassword,
        name: 'Admin User',
        roleId: adminRole.id,
        status: 'ACTIVE',
        emailVerified: new Date()
      },
      create: {
        email: 'admin@example.com',
        password: hashedPassword,
        name: 'Admin User',
        roleId: adminRole.id,
        status: 'ACTIVE',
        emailVerified: new Date()
      }
    })

    console.log('Admin user created/updated successfully:', adminUser.email)
  } catch (error) {
    console.error('Error creating admin user:', error)
  } finally {
    await prisma.$disconnect()
  }
}

createAdminUser() 