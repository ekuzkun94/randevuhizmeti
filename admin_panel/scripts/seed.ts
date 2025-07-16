import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Admin rolünü bul veya oluştur
  let adminRole = await prisma.role.findFirst({ where: { name: 'ADMIN' } })
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

  // User rolünü bul veya oluştur
  let userRole = await prisma.role.findFirst({ where: { name: 'USER' } })
  if (!userRole) {
    userRole = await prisma.role.create({
      data: {
        name: 'USER',
        displayName: 'Kullanıcı',
        description: 'Standart kullanıcı',
        isSystem: true
      }
    })
    console.log('User role created:', userRole.name)
  }

  // Create admin user
  const hashedPassword = await bcrypt.hash('admin123', 12)
  const admin = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      name: 'Admin User',
      password: hashedPassword,
      roleId: adminRole.id,
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
      roleId: userRole.id,
      status: 'ACTIVE',
    },
    {
      email: 'user2@example.com',
      name: 'Test User 2',
      password: await bcrypt.hash('password123', 12),
      roleId: userRole.id,
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

  // Create sample providers (businesses)
  const providers = [
    {
      name: 'Ahmet Kuaför',
      email: 'ahmet@kuaför.com',
      phone: '0555 123 4567',
      address: 'Merkez Mahallesi, No: 123',
      description: 'Profesyonel kuaför salonu'
    },
    {
      name: 'Selin Güzellik Salonu',
      email: 'selin@guzellik.com',
      phone: '0555 987 6543',
      address: 'Güzellik Caddesi, No: 45',
      description: 'Kapsamlı güzellik ve bakım hizmetleri'
    },
    {
      name: 'Mehmet Berber',
      email: 'mehmet@berber.com',
      phone: '0555 456 7890',
      address: 'Berber Sokak, No: 67',
      description: 'Geleneksel berber dükkanı'
    }
  ]

  for (const providerData of providers) {
    await prisma.provider.upsert({
      where: { email: providerData.email },
      update: {},
      create: providerData,
    })
  }

  console.log('✅ Sample providers created')

  // Create sample services
  const services = [
    {
      name: 'Saç Kesimi',
      description: 'Profesyonel saç kesimi hizmeti',
      duration: 30,
      price: 50,
      isActive: true
    },
    {
      name: 'Saç Boyama',
      description: 'Kalıcı saç boyama hizmeti',
      duration: 120,
      price: 150,
      isActive: true
    },
    {
      name: 'Manikür',
      description: 'El bakımı ve oje uygulaması',
      duration: 45,
      price: 80,
      isActive: true
    },
    {
      name: 'Pedikür',
      description: 'Ayak bakımı ve oje uygulaması',
      duration: 60,
      price: 100,
      isActive: true
    },
    {
      name: 'Sakal Tıraşı',
      description: 'Geleneksel sakal tıraşı',
      duration: 20,
      price: 30,
      isActive: true
    }
  ]

  for (const serviceData of services) {
    const existing = await prisma.service.findFirst({ where: { name: serviceData.name } })
    if (!existing) {
      await prisma.service.create({ data: serviceData })
    }
  }

  console.log('✅ Sample services created')

  // Create sample employees
  const createdProviders = await prisma.provider.findMany()
  const createdServices = await prisma.service.findMany()

  const employees = [
    {
      name: 'Ahmet Yılmaz',
      email: 'ahmet.yilmaz@kuaför.com',
      phone: '0555 111 1111',
      position: 'Kuaför',
      providerId: createdProviders[0].id, // Ahmet Kuaför
      isActive: true
    },
    {
      name: 'Fatma Demir',
      email: 'fatma.demir@kuaför.com',
      phone: '0555 222 2222',
      position: 'Kuaför',
      providerId: createdProviders[0].id, // Ahmet Kuaför
      isActive: true
    },
    {
      name: 'Selin Özkan',
      email: 'selin.ozkan@guzellik.com',
      phone: '0555 333 3333',
      position: 'Güzellik Uzmanı',
      providerId: createdProviders[1].id, // Selin Güzellik Salonu
      isActive: true
    },
    {
      name: 'Ayşe Kaya',
      email: 'ayse.kaya@guzellik.com',
      phone: '0555 444 4444',
      position: 'Manikür Uzmanı',
      providerId: createdProviders[1].id, // Selin Güzellik Salonu
      isActive: true
    },
    {
      name: 'Mehmet Arslan',
      email: 'mehmet.arslan@berber.com',
      phone: '0555 555 5555',
      position: 'Berber',
      providerId: createdProviders[2].id, // Mehmet Berber
      isActive: true
    }
  ]

  for (const employeeData of employees) {
    const existing = await prisma.employee.findFirst({ where: { email: employeeData.email } })
    if (!existing) {
      await prisma.employee.create({ data: employeeData })
    }
  }

  console.log('✅ Sample employees created')

  // Create provider-service relationships
  const providerServices = [
    // Ahmet Kuaför services
    { providerId: createdProviders[0].id, serviceId: createdServices[0].id, isActive: true }, // Saç Kesimi
    { providerId: createdProviders[0].id, serviceId: createdServices[1].id, isActive: true }, // Saç Boyama
    // Selin Güzellik Salonu services
    { providerId: createdProviders[1].id, serviceId: createdServices[0].id, isActive: true }, // Saç Kesimi
    { providerId: createdProviders[1].id, serviceId: createdServices[1].id, isActive: true }, // Saç Boyama
    { providerId: createdProviders[1].id, serviceId: createdServices[2].id, isActive: true }, // Manikür
    { providerId: createdProviders[1].id, serviceId: createdServices[3].id, isActive: true }, // Pedikür
    // Mehmet Berber services
    { providerId: createdProviders[2].id, serviceId: createdServices[0].id, isActive: true }, // Saç Kesimi
    { providerId: createdProviders[2].id, serviceId: createdServices[4].id, isActive: true }, // Sakal Tıraşı
  ]

  for (const psData of providerServices) {
    await prisma.providerService.upsert({
      where: { 
        providerId_serviceId: {
          providerId: psData.providerId,
          serviceId: psData.serviceId
        }
      },
      update: {},
      create: psData,
    })
  }

  console.log('✅ Sample provider-service relationships created')

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