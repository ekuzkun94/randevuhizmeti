const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function seedAuditLogs() {
  try {
    console.log('🌱 Seeding audit logs...')

    // Get a user to associate with audit logs
    const user = await prisma.user.findFirst()
    
    if (!user) {
      console.log('❌ No user found. Please create a user first.')
      return
    }

    // Sample audit log data
    const auditLogs = [
      {
        action: 'CREATE',
        entityType: 'User',
        entityId: user.id,
        userId: user.id,
        oldValues: null,
        newValues: JSON.stringify({ name: user.name, email: user.email }),
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        metadata: JSON.stringify({ source: 'admin_panel' })
      },
      {
        action: 'UPDATE',
        entityType: 'User',
        entityId: user.id,
        userId: user.id,
        oldValues: JSON.stringify({ name: 'Old Name' }),
        newValues: JSON.stringify({ name: user.name }),
        ipAddress: '192.168.1.101',
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        metadata: JSON.stringify({ source: 'admin_panel' })
      },
      {
        action: 'LOGIN',
        entityType: 'User',
        entityId: user.id,
        userId: user.id,
        oldValues: null,
        newValues: null,
        ipAddress: '192.168.1.102',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        metadata: JSON.stringify({ source: 'admin_panel', method: 'credentials' })
      },
      {
        action: 'CREATE',
        entityType: 'File',
        entityId: 'file_123',
        userId: user.id,
        oldValues: null,
        newValues: JSON.stringify({ name: 'document.pdf', size: 1024000 }),
        ipAddress: '192.168.1.103',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        metadata: JSON.stringify({ source: 'admin_panel', fileType: 'pdf' })
      },
      {
        action: 'DELETE',
        entityType: 'File',
        entityId: 'file_456',
        userId: user.id,
        oldValues: JSON.stringify({ name: 'old_document.pdf', size: 512000 }),
        newValues: null,
        ipAddress: '192.168.1.104',
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        metadata: JSON.stringify({ source: 'admin_panel', reason: 'cleanup' })
      },
      {
        action: 'CREATE',
        entityType: 'ApiKey',
        entityId: 'key_789',
        userId: user.id,
        oldValues: null,
        newValues: JSON.stringify({ name: 'Test API Key', permissions: ['read', 'write'] }),
        ipAddress: '192.168.1.105',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        metadata: JSON.stringify({ source: 'admin_panel' })
      },
      {
        action: 'UPDATE',
        entityType: 'SystemSetting',
        entityId: 'setting_1',
        userId: user.id,
        oldValues: JSON.stringify({ theme: 'light' }),
        newValues: JSON.stringify({ theme: 'dark' }),
        ipAddress: '192.168.1.106',
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        metadata: JSON.stringify({ source: 'admin_panel' })
      },
      {
        action: 'LOGOUT',
        entityType: 'User',
        entityId: user.id,
        userId: user.id,
        oldValues: null,
        newValues: null,
        ipAddress: '192.168.1.107',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        metadata: JSON.stringify({ source: 'admin_panel' })
      }
    ]

    // Create audit logs with different timestamps
    for (let i = 0; i < auditLogs.length; i++) {
      const log = auditLogs[i]
      const createdAt = new Date()
      createdAt.setHours(createdAt.getHours() - i) // Each log is 1 hour apart
      
      await prisma.auditLog.create({
        data: {
          ...log,
          createdAt
        }
      })
    }

    console.log('✅ Audit logs seeded successfully!')
    console.log(`📊 Created ${auditLogs.length} audit log entries`)

  } catch (error) {
    console.error('❌ Error seeding audit logs:', error)
  } finally {
    await prisma.$disconnect()
  }
}

seedAuditLogs() 