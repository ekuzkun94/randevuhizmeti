import { prisma } from '../src/lib/prisma'
import bcrypt from 'bcryptjs'

async function main() {
  const email = process.env.ADMIN_EMAIL || 'admin@admin.com'
  const password = process.env.ADMIN_PASSWORD || 'admin1234'
  const hashed = await bcrypt.hash(password, 10)
  const user = await prisma.user.upsert({
    where: { email },
    update: {},
    create: {
      email,
      name: 'Admin',
      password: hashed,
      role: 'SUPER_ADMIN',
      status: 'ACTIVE',
    },
  })
  console.log('Admin user:', user)
}

main().catch((e) => { console.error(e); process.exit(1) }).finally(() => prisma.$disconnect()) 