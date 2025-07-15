const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function seedAnnotations() {
  try {
    console.log('🌱 Seeding annotations and tags...')

    // Create sample tags
    const tags = await Promise.all([
      prisma.tag.create({
        data: {
          name: 'VIP',
          color: '#FF6B6B',
          description: 'VIP müşteriler',
          isSystem: true,
        },
      }),
      prisma.tag.create({
        data: {
          name: 'Yeni Kullanıcı',
          color: '#4ECDC4',
          description: 'Yeni kayıt olan kullanıcılar',
          isSystem: true,
        },
      }),
      prisma.tag.create({
        data: {
          name: 'Aktif',
          color: '#45B7D1',
          description: 'Aktif kullanıcılar',
          isSystem: true,
        },
      }),
      prisma.tag.create({
        data: {
          name: 'Beklemede',
          color: '#FFA07A',
          description: 'Onay bekleyen işlemler',
          isSystem: true,
        },
      }),
      prisma.tag.create({
        data: {
          name: 'Önemli',
          color: '#FFD93D',
          description: 'Önemli notlar',
          isSystem: false,
        },
      }),
    ])

    console.log(`✅ Created ${tags.length} tags`)

    // Get first user for annotations
    const user = await prisma.user.findFirst()
    if (!user) {
      console.log('❌ No user found, skipping annotations')
      return
    }

    // Create sample annotations
    const annotations = await Promise.all([
      prisma.annotation.create({
        data: {
          entityType: 'USER',
          entityId: user.id,
          content: 'Bu kullanıcı VIP müşteri statüsünde. Özel hizmet verilmeli.',
          type: 'NOTE',
          isPrivate: false,
          authorId: user.id,
          tags: {
            connect: [{ id: tags[0].id }, { id: tags[4].id }] // VIP, Önemli
          }
        },
      }),
      prisma.annotation.create({
        data: {
          entityType: 'USER',
          entityId: user.id,
          content: 'Kullanıcı hesabı 2FA ile korunuyor.',
          type: 'INFO',
          isPrivate: false,
          authorId: user.id,
          tags: {
            connect: [{ id: tags[2].id }] // Aktif
          }
        },
      }),
      prisma.annotation.create({
        data: {
          entityType: 'CONTENT',
          entityId: 'sample-content-1',
          content: 'Bu içerik gözden geçirilmeli ve güncellenmeli.',
          type: 'TODO',
          isPrivate: true,
          authorId: user.id,
          tags: {
            connect: [{ id: tags[3].id }] // Beklemede
          }
        },
      }),
      prisma.annotation.create({
        data: {
          entityType: 'TASK',
          entityId: 'sample-task-1',
          content: 'Bu görev yüksek öncelikli. Hızlıca tamamlanmalı.',
          type: 'WARNING',
          isPrivate: false,
          authorId: user.id,
          tags: {
            connect: [{ id: tags[4].id }] // Önemli
          }
        },
      }),
    ])

    console.log(`✅ Created ${annotations.length} annotations`)

    console.log('🎉 Annotation seeding completed!')
  } catch (error) {
    console.error('❌ Error seeding annotations:', error)
  } finally {
    await prisma.$disconnect()
  }
}

seedAnnotations() 