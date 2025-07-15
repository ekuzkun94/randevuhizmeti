import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Create admin user
  const hashedPassword = await bcrypt.hash('admin123', 12)
  
  const admin = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      name: 'Admin User',
      password: hashedPassword,
      role: 'ADMIN',
      status: 'ACTIVE',
    },
  })

  console.log('✅ Admin user created:', admin.email)

  // Create some sample users
  const users = [
    {
      email: 'user1@example.com',
      name: 'Test User 1',
      password: await bcrypt.hash('password123', 12),
      role: 'USER',
      status: 'ACTIVE',
    },
    {
      email: 'user2@example.com',
      name: 'Test User 2',
      password: await bcrypt.hash('password123', 12),
      role: 'USER',
      status: 'ACTIVE',
    },
  ]

  for (const userData of users) {
    await prisma.user.upsert({
      where: { email: userData.email },
      update: {},
      create: userData,
    })
  }

  console.log('✅ Sample users created')

  // Create some sample notifications
  const notifications = [
    {
      title: 'Hoş geldiniz!',
      message: 'Admin paneline başarıyla giriş yaptınız.',
      type: 'INFO',
      userId: admin.id,
    },
    {
      title: 'Sistem güncellemesi',
      message: 'Sistem 2.0 sürümüne güncellendi.',
      type: 'SUCCESS',
      userId: admin.id,
    },
  ]

  for (const notificationData of notifications) {
    await prisma.notification.create({
      data: notificationData,
    })
  }

  console.log('✅ Sample notifications created')

  console.log('🎉 Database seeding completed!')
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  }) 