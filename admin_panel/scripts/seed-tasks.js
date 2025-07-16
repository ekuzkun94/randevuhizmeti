const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function seedTasks() {
  try {
    console.log('🌱 Seeding tasks...')

    // Get existing users for assignment
    const users = await prisma.user.findMany({
      take: 5,
      select: { id: true, name: true }
    })

    if (users.length === 0) {
      console.log('❌ No users found. Please seed users first.')
      return
    }

    // Get existing tags
    const tags = await prisma.tag.findMany({
      take: 10,
      select: { id: true, name: true }
    })

    const sampleTasks = [
      {
        title: 'Admin Panel Tasarımını Güncelle',
        description: 'Kullanıcı arayüzünü modern tasarım prensiplerine göre yeniden tasarla',
        status: 'IN_PROGRESS',
        priority: 'HIGH',
        type: 'FEATURE',
        assigneeId: users[0]?.id,
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        estimatedHours: 16,
        tagIds: tags.slice(0, 2).map(tag => tag.id)
      },
      {
        title: 'API Güvenlik Açığını Düzelt',
        description: 'Rate limiting ve authentication kontrollerini güçlendir',
        status: 'TODO',
        priority: 'URGENT',
        type: 'BUG',
        assigneeId: users[1]?.id,
        dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
        estimatedHours: 8,
        tagIds: tags.slice(2, 4).map(tag => tag.id)
      },
      {
        title: 'Veritabanı Performansını Optimize Et',
        description: 'Slow query\'leri tespit et ve index\'leri optimize et',
        status: 'REVIEW',
        priority: 'MEDIUM',
        type: 'TASK',
        assigneeId: users[2]?.id,
        dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
        estimatedHours: 12,
        tagIds: tags.slice(4, 6).map(tag => tag.id)
      },
      {
        title: 'Kullanıcı Eğitim Dokümantasyonu Hazırla',
        description: 'Yeni özellikler için kullanıcı kılavuzu oluştur',
        status: 'TODO',
        priority: 'LOW',
        type: 'TASK',
        assigneeId: users[3]?.id,
        dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // 10 days from now
        estimatedHours: 20,
        tagIds: tags.slice(6, 8).map(tag => tag.id)
      },
      {
        title: 'Mobil Uygulama Entegrasyonu',
        description: 'Admin panel ile mobil uygulama arasında veri senkronizasyonu',
        status: 'DONE',
        priority: 'HIGH',
        type: 'FEATURE',
        assigneeId: users[0]?.id,
        dueDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
        estimatedHours: 24,
        actualHours: 22,
        tagIds: tags.slice(8, 10).map(tag => tag.id)
      },
      {
        title: 'Backup Sistemi Kurulumu',
        description: 'Otomatik yedekleme sistemi kur ve test et',
        status: 'IN_PROGRESS',
        priority: 'MEDIUM',
        type: 'TASK',
        assigneeId: users[1]?.id,
        dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
        estimatedHours: 10,
        tagIds: tags.slice(0, 3).map(tag => tag.id)
      },
      {
        title: 'Raporlama Modülü Geliştirme',
        description: 'Detaylı analitik raporlar için yeni modül geliştir',
        status: 'TODO',
        priority: 'HIGH',
        type: 'FEATURE',
        assigneeId: users[2]?.id,
        dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
        estimatedHours: 32,
        tagIds: tags.slice(3, 6).map(tag => tag.id)
      },
      {
        title: 'E-posta Şablonlarını Güncelle',
        description: 'Tüm e-posta şablonlarını yeni marka kimliğine göre güncelle',
        status: 'REVIEW',
        priority: 'LOW',
        type: 'TASK',
        assigneeId: users[3]?.id,
        dueDate: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000), // 6 days from now
        estimatedHours: 6,
        tagIds: tags.slice(6, 9).map(tag => tag.id)
      }
    ]

    for (const taskData of sampleTasks) {
      const { tagIds, ...taskFields } = taskData
      
      const task = await prisma.task.create({
        data: {
          ...taskFields,
          reporterId: users[0].id, // First user as reporter
          tags: {
            create: tagIds.map(tagId => ({
              tagId
            }))
          }
        }
      })

      console.log(`✅ Created task: ${task.title}`)

      // Add some comments to tasks
      const comments = [
        'Bu görev öncelikli olarak ele alınmalı.',
        'Geliştirme sürecinde dikkatli olunmalı.',
        'Test aşamasında kapsamlı kontrol yapılmalı.',
        'Dokümantasyon güncellenmeli.'
      ]

      for (let i = 0; i < Math.floor(Math.random() * 3) + 1; i++) {
        await prisma.taskComment.create({
          data: {
            taskId: task.id,
            content: comments[Math.floor(Math.random() * comments.length)],
            authorId: users[Math.floor(Math.random() * users.length)].id,
            isInternal: Math.random() > 0.5
          }
        })
      }
    }

    console.log('✅ Tasks seeded successfully!')
  } catch (error) {
    console.error('❌ Error seeding tasks:', error)
  } finally {
    await prisma.$disconnect()
  }
}

seedTasks() 