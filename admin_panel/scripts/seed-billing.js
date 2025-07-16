const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function seedBilling() {
  try {
    console.log('🌱 Seeding billing data...')

    // Create subscription plans
    const plans = [
      {
        name: 'Başlangıç',
        description: 'Küçük ekipler için temel özellikler',
        price: 29.99,
        currency: 'USD',
        interval: 'MONTH',
        features: JSON.stringify([
          '5 kullanıcı',
          'Temel raporlar',
          'E-posta desteği',
          '1GB depolama'
        ]),
        isActive: true
      },
      {
        name: 'Profesyonel',
        description: 'Büyüyen işletmeler için gelişmiş özellikler',
        price: 79.99,
        currency: 'USD',
        interval: 'MONTH',
        features: JSON.stringify([
          '25 kullanıcı',
          'Gelişmiş analitik',
          'Öncelikli destek',
          '10GB depolama',
          'API erişimi',
          'Özel entegrasyonlar'
        ]),
        isActive: true
      },
      {
        name: 'Kurumsal',
        description: 'Büyük organizasyonlar için tam özellikler',
        price: 199.99,
        currency: 'USD',
        interval: 'MONTH',
        features: JSON.stringify([
          'Sınırsız kullanıcı',
          'Özel raporlar',
          '7/24 destek',
          'Sınırsız depolama',
          'Tam API erişimi',
          'Özel geliştirme',
          'SSO entegrasyonu',
          'Gelişmiş güvenlik'
        ]),
        isActive: true
      },
      {
        name: 'Yıllık Başlangıç',
        description: 'Yıllık plan - %20 indirim',
        price: 287.90,
        currency: 'USD',
        interval: 'YEAR',
        features: JSON.stringify([
          '5 kullanıcı',
          'Temel raporlar',
          'E-posta desteği',
          '1GB depolama',
          'Yıllık %20 indirim'
        ]),
        isActive: true
      }
    ]

    const createdPlans = []
    for (const planData of plans) {
      const plan = await prisma.subscriptionPlan.create({
        data: planData
      })
      createdPlans.push(plan)
      console.log(`✅ Created plan: ${plan.name}`)
    }

    // Get existing users for subscriptions
    const users = await prisma.user.findMany({
      take: 3,
      select: { id: true, name: true }
    })

    if (users.length === 0) {
      console.log('❌ No users found. Please seed users first.')
      return
    }

    // Create sample subscriptions
    const subscriptions = [
      {
        planId: createdPlans[0].id,
        status: 'ACTIVE',
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        cancelAtPeriodEnd: false
      },
      {
        planId: createdPlans[1].id,
        status: 'ACTIVE',
        currentPeriodStart: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
        currentPeriodEnd: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
        cancelAtPeriodEnd: false
      },
      {
        planId: createdPlans[2].id,
        status: 'PAST_DUE',
        currentPeriodStart: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000),
        currentPeriodEnd: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
        cancelAtPeriodEnd: true
      }
    ]

    for (let i = 0; i < subscriptions.length; i++) {
      const subscription = await prisma.subscription.create({
        data: subscriptions[i]
      })
      console.log(`✅ Created subscription: ${subscription.id}`)

      // Create payments for each subscription
      const paymentAmounts = [29.99, 79.99, 199.99]
      const paymentStatuses = ['SUCCEEDED', 'SUCCEEDED', 'FAILED']
      
      for (let j = 0; j < 3; j++) {
        await prisma.payment.create({
          data: {
            subscriptionId: subscription.id,
            amount: paymentAmounts[i],
            currency: 'USD',
            status: paymentStatuses[i],
            paymentMethod: 'CARD',
            failureReason: paymentStatuses[i] === 'FAILED' ? 'Yetersiz bakiye' : null,
            createdAt: new Date(Date.now() - j * 30 * 24 * 60 * 60 * 1000)
          }
        })
      }
    }

    console.log('✅ Billing data seeded successfully!')
  } catch (error) {
    console.error('❌ Error seeding billing data:', error)
  } finally {
    await prisma.$disconnect()
  }
}

seedBilling() 