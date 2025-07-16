const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function seedCustomFields() {
  try {
    console.log('🌱 Seeding custom fields...')

    // Get first user for createdByUser field
    const user = await prisma.user.findFirst({
      select: { id: true }
    })

    if (!user) {
      console.log('❌ No users found. Please seed users first.')
      return
    }

    const customFields = [
      {
        name: 'phone_number',
        label: 'Telefon Numarası',
        type: 'PHONE',
        entityType: 'USER',
        isRequired: true,
        isUnique: false,
        options: null
      },
      {
        name: 'department',
        label: 'Departman',
        type: 'SELECT',
        entityType: 'USER',
        isRequired: false,
        isUnique: false,
        options: JSON.stringify(['IT', 'Satış', 'Pazarlama', 'İnsan Kaynakları', 'Finans', 'Operasyon'])
      },
      {
        name: 'skills',
        label: 'Yetenekler',
        type: 'MULTISELECT',
        entityType: 'USER',
        isRequired: false,
        isUnique: false,
        options: JSON.stringify(['JavaScript', 'Python', 'React', 'Node.js', 'SQL', 'AWS', 'Docker', 'Kubernetes'])
      },
      {
        name: 'hire_date',
        label: 'İşe Başlama Tarihi',
        type: 'DATE',
        entityType: 'USER',
        isRequired: true,
        isUnique: false,
        options: null
      },
      {
        name: 'salary',
        label: 'Maaş',
        type: 'NUMBER',
        entityType: 'USER',
        isRequired: false,
        isUnique: false,
        options: null
      },
      {
        name: 'content_category',
        label: 'İçerik Kategorisi',
        type: 'SELECT',
        entityType: 'CONTENT',
        isRequired: true,
        isUnique: false,
        options: JSON.stringify(['Blog', 'Haber', 'Eğitim', 'Dokümantasyon', 'Ürün', 'Kampanya'])
      },
      {
        name: 'content_tags',
        label: 'İçerik Etiketleri',
        type: 'MULTISELECT',
        entityType: 'CONTENT',
        isRequired: false,
        isUnique: false,
        options: JSON.stringify(['Teknoloji', 'İş', 'Eğitim', 'Sağlık', 'Spor', 'Sanat', 'Bilim'])
      },
      {
        name: 'content_priority',
        label: 'İçerik Önceliği',
        type: 'SELECT',
        entityType: 'CONTENT',
        isRequired: false,
        isUnique: false,
        options: JSON.stringify(['Düşük', 'Normal', 'Yüksek', 'Acil'])
      },
      {
        name: 'task_priority',
        label: 'Görev Önceliği',
        type: 'SELECT',
        entityType: 'TASK',
        isRequired: true,
        isUnique: false,
        options: JSON.stringify(['Düşük', 'Normal', 'Yüksek', 'Acil'])
      },
      {
        name: 'task_estimated_hours',
        label: 'Tahmini Süre (Saat)',
        type: 'NUMBER',
        entityType: 'TASK',
        isRequired: false,
        isUnique: false,
        options: null
      },
      {
        name: 'task_difficulty',
        label: 'Görev Zorluğu',
        type: 'SELECT',
        entityType: 'TASK',
        isRequired: false,
        isUnique: false,
        options: JSON.stringify(['Kolay', 'Orta', 'Zor', 'Çok Zor'])
      },
      {
        name: 'task_requires_approval',
        label: 'Onay Gerekli',
        type: 'BOOLEAN',
        entityType: 'TASK',
        isRequired: false,
        isUnique: false,
        options: null
      }
    ]

    for (const fieldData of customFields) {
      const customField = await prisma.customField.create({
        data: {
          ...fieldData,
          createdByUser: { connect: { id: user.id } }
        }
      })
      console.log(`✅ Created custom field: ${customField.label}`)
    }

    console.log('✅ Custom fields seeded successfully!')
  } catch (error) {
    console.error('❌ Error seeding custom fields:', error)
  } finally {
    await prisma.$disconnect()
  }
}

seedCustomFields() 