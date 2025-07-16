import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding appointment data...')

  // Örnek hizmet sağlayıcıları oluştur
  const providers = await Promise.all([
    prisma.provider.upsert({
      where: { email: 'dr.ahmet@example.com' },
      update: {},
      create: {
        name: 'Dr. Ahmet Yılmaz',
        email: 'dr.ahmet@example.com',
        phone: '+90 555 123 45 67'
      }
    }),
    prisma.provider.upsert({
      where: { email: 'dr.ayse@example.com' },
      update: {},
      create: {
        name: 'Dr. Ayşe Demir',
        email: 'dr.ayse@example.com',
        phone: '+90 555 234 56 78'
      }
    }),
    prisma.provider.upsert({
      where: { email: 'dr.mehmet@example.com' },
      update: {},
      create: {
        name: 'Dr. Mehmet Kaya',
        email: 'dr.mehmet@example.com',
        phone: '+90 555 345 67 89'
      }
    })
  ])

  console.log('Providers created:', providers.length)

  // Örnek müşteriler oluştur
  const customers = await Promise.all([
    prisma.customer.upsert({
      where: { email: 'ali.veli@example.com' },
      update: {},
      create: {
        name: 'Ali Veli',
        email: 'ali.veli@example.com',
        phone: '+90 555 456 78 90'
      }
    }),
    prisma.customer.upsert({
      where: { email: 'fatma.nur@example.com' },
      update: {},
      create: {
        name: 'Fatma Nur',
        email: 'fatma.nur@example.com',
        phone: '+90 555 567 89 01'
      }
    }),
    prisma.customer.upsert({
      where: { email: 'can.oz@example.com' },
      update: {},
      create: {
        name: 'Can Öz',
        email: 'can.oz@example.com',
        phone: '+90 555 678 90 12'
      }
    }),
    prisma.customer.upsert({
      where: { email: 'zeynep.kaya@example.com' },
      update: {},
      create: {
        name: 'Zeynep Kaya',
        email: 'zeynep.kaya@example.com',
        phone: '+90 555 789 01 23'
      }
    })
  ])

  console.log('Customers created:', customers.length)

  // Örnek randevular oluştur
  const now = new Date()
  const tomorrow = new Date(now)
  tomorrow.setDate(tomorrow.getDate() + 1)
  
  const nextWeek = new Date(now)
  nextWeek.setDate(nextWeek.getDate() + 7)

  // Önce mevcut randevuları temizle
  await prisma.appointment.deleteMany({})

  const appointments = await Promise.all([
    // Bugün için randevular
    prisma.appointment.create({
      data: {
        providerId: providers[0].id,
        customerId: customers[0].id,
        start: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 10, 0, 0),
        end: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 11, 0, 0),
        status: 'SCHEDULED',
        note: 'Kontrol muayenesi'
      }
    }),
    prisma.appointment.create({
      data: {
        providerId: providers[1].id,
        customerId: customers[1].id,
        start: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 14, 30, 0),
        end: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 15, 30, 0),
        status: 'SCHEDULED',
        note: 'İlk muayene'
      }
    }),
    // Yarın için randevular
    prisma.appointment.create({
      data: {
        providerId: providers[2].id,
        customerId: customers[2].id,
        start: new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate(), 9, 0, 0),
        end: new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate(), 10, 0, 0),
        status: 'SCHEDULED',
        note: 'Rutin kontrol'
      }
    }),
    prisma.appointment.create({
      data: {
        providerId: providers[0].id,
        customerId: customers[3].id,
        start: new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate(), 16, 0, 0),
        end: new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate(), 17, 0, 0),
        status: 'SCHEDULED',
        note: 'Tedavi planlaması'
      }
    }),
    // Geçmiş randevular (tamamlanmış)
    prisma.appointment.create({
      data: {
        providerId: providers[1].id,
        customerId: customers[0].id,
        start: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 11, 0, 0),
        end: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 12, 0, 0),
        status: 'COMPLETED',
        note: 'Muayene tamamlandı'
      }
    }),
    // Gelecek hafta randevuları
    prisma.appointment.create({
      data: {
        providerId: providers[2].id,
        customerId: customers[1].id,
        start: new Date(nextWeek.getFullYear(), nextWeek.getMonth(), nextWeek.getDate(), 13, 0, 0),
        end: new Date(nextWeek.getFullYear(), nextWeek.getMonth(), nextWeek.getDate(), 14, 0, 0),
        status: 'SCHEDULED',
        note: 'Kontrol randevusu'
      }
    })
  ])

  console.log('Appointments created:', appointments.length)
  console.log('✅ Appointment seeding completed!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  }) 