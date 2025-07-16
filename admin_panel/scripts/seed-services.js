const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

const services = [
  {
    name: 'Saç Kesimi',
    description: 'Profesyonel saç kesimi hizmeti',
    duration: 30,
    price: 50.00,
    isActive: true
  },
  {
    name: 'Saç Boyama',
    description: 'Profesyonel saç boyama hizmeti',
    duration: 120,
    price: 150.00,
    isActive: true
  },
  {
    name: 'Saç Bakımı',
    description: 'Kapsamlı saç bakım ve nemlendirme',
    duration: 60,
    price: 80.00,
    isActive: true
  },
  {
    name: 'Manikür',
    description: 'El bakımı ve oje uygulaması',
    duration: 45,
    price: 60.00,
    isActive: true
  },
  {
    name: 'Pedikür',
    description: 'Ayak bakımı ve oje uygulaması',
    duration: 60,
    price: 70.00,
    isActive: true
  },
  {
    name: 'Cilt Bakımı',
    description: 'Profesyonel cilt temizleme ve bakım',
    duration: 90,
    price: 120.00,
    isActive: true
  },
  {
    name: 'Makyaj',
    description: 'Günlük ve özel gün makyajı',
    duration: 60,
    price: 100.00,
    isActive: true
  },
  {
    name: 'Kaş Şekillendirme',
    description: 'Kaş alma ve şekillendirme',
    duration: 30,
    price: 40.00,
    isActive: true
  },
  {
    name: 'Kirpik Uzatma',
    description: 'Profesyonel kirpik uzatma hizmeti',
    duration: 150,
    price: 200.00,
    isActive: true
  },
  {
    name: 'Masaj',
    description: 'Rahatlatıcı vücut masajı',
    duration: 60,
    price: 120.00,
    isActive: true
  }
]

async function seedServices() {
  try {
    console.log('🌱 Hizmetler ekleniyor...')

    // Delete existing services (except default)
    await prisma.service.deleteMany({
      where: {
        id: { not: 'default-service' }
      }
    })

    // Create new services
    for (const service of services) {
      await prisma.service.create({
        data: service
      })
      console.log(`✅ ${service.name} eklendi`)
    }

    console.log('🎉 Tüm hizmetler başarıyla eklendi!')
  } catch (error) {
    console.error('❌ Hata:', error)
  } finally {
    await prisma.$disconnect()
  }
}

seedServices() 