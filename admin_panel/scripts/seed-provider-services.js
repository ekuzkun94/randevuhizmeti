const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

// Provider-Service relationships
const providerServices = [
  // Saç Kesimi - Tüm saç uzmanları
  { providerId: 'cmd6i2m9q0019n6ju7qxr8h0o', serviceId: 'default-service' }, // Ayşe Yılmaz
  { providerId: 'cmd6i2m9q0019n6ju7qxr8h0o', serviceId: 'cmd6i2m9q0019n6ju7qxr8h0o' }, // Saç Kesimi
  { providerId: 'cmd6i2m9q0019n6ju7qxr8h0o', serviceId: 'cmd6i2m9q0019n6ju7qxr8h0o' }, // Saç Boyama
  { providerId: 'cmd6i2m9q0019n6ju7qxr8h0o', serviceId: 'cmd6i2m9q0019n6ju7qxr8h0o' }, // Saç Bakımı
  
  // Fatma Demir - Saç ve makyaj uzmanı
  { providerId: 'cmd6i2m9q0019n6ju7qxr8h0o', serviceId: 'default-service' },
  { providerId: 'cmd6i2m9q0019n6ju7qxr8h0o', serviceId: 'cmd6i2m9q0019n6ju7qxr8h0o' }, // Saç Kesimi
  { providerId: 'cmd6i2m9q0019n6ju7qxr8h0o', serviceId: 'cmd6i2m9q0019n6ju7qxr8h0o' }, // Saç Boyama
  { providerId: 'cmd6i2m9q0019n6ju7qxr8h0o', serviceId: 'cmd6i2m9q0019n6ju7qxr8h0o' }, // Makyaj
  
  // Mehmet Kaya - Manikür/Pedikür uzmanı
  { providerId: 'cmd6i2m9q0019n6ju7qxr8h0o', serviceId: 'default-service' },
  { providerId: 'cmd6i2m9q0019n6ju7qxr8h0o', serviceId: 'cmd6i2m9q0019n6ju7qxr8h0o' }, // Manikür
  { providerId: 'cmd6i2m9q0019n6ju7qxr8h0o', serviceId: 'cmd6i2m9q0019n6ju7qxr8h0o' }, // Pedikür
  
  // Zeynep Özkan - Cilt bakım uzmanı
  { providerId: 'cmd6i2m9q0019n6ju7qxr8h0o', serviceId: 'default-service' },
  { providerId: 'cmd6i2m9q0019n6ju7qxr8h0o', serviceId: 'cmd6i2m9q0019n6ju7qxr8h0o' }, // Cilt Bakımı
  { providerId: 'cmd6i2m9q0019n6ju7qxr8h0o', serviceId: 'cmd6i2m9q0019n6ju7qxr8h0o' }, // Kaş Şekillendirme
  
  // Elif Yıldız - Masaj uzmanı
  { providerId: 'cmd6i2m9q0019n6ju7qxr8h0o', serviceId: 'default-service' },
  { providerId: 'cmd6i2m9q0019n6ju7qxr8h0o', serviceId: 'cmd6i2m9q0019n6ju7qxr8h0o' }, // Masaj
]

async function seedProviderServices() {
  try {
    console.log('🌱 Hizmet sağlayıcı-hizmet ilişkileri ekleniyor...')

    // Get actual provider and service IDs
    const providers = await prisma.provider.findMany()
    const services = await prisma.service.findMany()

    console.log('Mevcut hizmet sağlayıcıları:', providers.map(p => `${p.name} (${p.id})`))
    console.log('Mevcut hizmetler:', services.map(s => `${s.name} (${s.id})`))

    // Clear existing provider-service relationships
    await prisma.providerService.deleteMany()

    // Create new relationships based on actual IDs
    const relationships = []

    // Dr. Ayşe Demir - Saç uzmanı
    const ayse = providers.find(p => p.name === 'Dr. Ayşe Demir')
    const sacKesimi = services.find(s => s.name === 'Saç Kesimi')
    const sacBoyama = services.find(s => s.name === 'Saç Boyama')
    const sacBakimi = services.find(s => s.name === 'Saç Bakımı')

    if (ayse && sacKesimi) {
      relationships.push({ providerId: ayse.id, serviceId: sacKesimi.id })
    }
    if (ayse && sacBoyama) {
      relationships.push({ providerId: ayse.id, serviceId: sacBoyama.id })
    }
    if (ayse && sacBakimi) {
      relationships.push({ providerId: ayse.id, serviceId: sacBakimi.id })
    }

    // Dr. Ahmet Yılmaz - Saç ve makyaj uzmanı
    const ahmet = providers.find(p => p.name === 'Dr. Ahmet Yılmaz')
    const makyaj = services.find(s => s.name === 'Makyaj')

    if (ahmet && sacKesimi) {
      relationships.push({ providerId: ahmet.id, serviceId: sacKesimi.id })
    }
    if (ahmet && makyaj) {
      relationships.push({ providerId: ahmet.id, serviceId: makyaj.id })
    }

    // Dr. Mehmet Kaya - Manikür/Pedikür uzmanı
    const mehmet = providers.find(p => p.name === 'Dr. Mehmet Kaya')
    const manikur = services.find(s => s.name === 'Manikür')
    const pedikur = services.find(s => s.name === 'Pedikür')

    if (mehmet && manikur) {
      relationships.push({ providerId: mehmet.id, serviceId: manikur.id })
    }
    if (mehmet && pedikur) {
      relationships.push({ providerId: mehmet.id, serviceId: pedikur.id })
    }

    // h1 - Cilt bakım uzmanı
    const h1 = providers.find(p => p.name === 'h1')
    const ciltBakimi = services.find(s => s.name === 'Cilt Bakımı')
    const kasSekillendirme = services.find(s => s.name === 'Kaş Şekillendirme')

    if (h1 && ciltBakimi) {
      relationships.push({ providerId: h1.id, serviceId: ciltBakimi.id })
    }
    if (h1 && kasSekillendirme) {
      relationships.push({ providerId: h1.id, serviceId: kasSekillendirme.id })
    }

    // Add some general relationships for all providers
    const defaultService = services.find(s => s.name === 'Genel Hizmet')
    if (defaultService) {
      for (const provider of providers) {
        relationships.push({ providerId: provider.id, serviceId: defaultService.id })
      }
    }

    // Create all relationships
    for (const relationship of relationships) {
      await prisma.providerService.create({
        data: relationship
      })
      console.log(`✅ İlişki eklendi: ${relationship.providerId} - ${relationship.serviceId}`)
    }

    console.log('🎉 Tüm hizmet sağlayıcı-hizmet ilişkileri başarıyla eklendi!')
  } catch (error) {
    console.error('❌ Hata:', error)
  } finally {
    await prisma.$disconnect()
  }
}

seedProviderServices() 