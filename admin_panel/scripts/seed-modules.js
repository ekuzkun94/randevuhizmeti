const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function seedModules() {
  try {
    // Create sample modules
    const modules = [
      {
        name: 'audit-trail',
        displayName: 'Audit Trail',
        description: 'Sistem aktivitelerini takip etme ve loglama',
        version: '1.0.0',
        isActive: true,
        isPremium: false,
        price: 0,
        features: JSON.stringify([
          'Otomatik log tutma',
          'Filtreleme ve arama',
          'Dışa aktarma',
          'İstatistikler'
        ])
      },
      {
        name: 'advanced-analytics',
        displayName: 'Gelişmiş Analitik',
        description: 'Detaylı raporlama ve analitik araçları',
        version: '1.0.0',
        isActive: true,
        isPremium: true,
        price: 29.99,
        features: JSON.stringify([
          'Gerçek zamanlı grafikler',
          'Özel raporlar',
          'Veri dışa aktarma',
          'E-posta raporları'
        ])
      },
      {
        name: 'workflow-approval',
        displayName: 'İş Akışı Onayları',
        description: 'Çok seviyeli onay sistemi',
        version: '1.0.0',
        isActive: true,
        isPremium: true,
        price: 19.99,
        features: JSON.stringify([
          'Çok seviyeli onay',
          'Otomatik bildirimler',
          'Onay geçmişi',
          'Şablon yönetimi'
        ])
      },
      {
        name: 'scheduler',
        displayName: 'Zamanlayıcı',
        description: 'Otomatik görev zamanlama',
        version: '1.0.0',
        isActive: true,
        isPremium: false,
        price: 0,
        features: JSON.stringify([
          'Cron job yönetimi',
          'E-posta kampanyaları',
          'Raporlama otomasyonu',
          'Görev geçmişi'
        ])
      },
      {
        name: 'integrations',
        displayName: 'Entegrasyonlar',
        description: 'Üçüncü parti servis entegrasyonları',
        version: '1.0.0',
        isActive: true,
        isPremium: true,
        price: 39.99,
        features: JSON.stringify([
          'Slack entegrasyonu',
          'Discord entegrasyonu',
          'Webhook desteği',
          'API entegrasyonları'
        ])
      }
    ]

    for (const module of modules) {
      await prisma.module.upsert({
        where: { name: module.name },
        update: module,
        create: module
      })
    }

    console.log('✅ Modules seeded successfully!')
  } catch (error) {
    console.error('❌ Error seeding modules:', error)
  } finally {
    await prisma.$disconnect()
  }
}

seedModules() 