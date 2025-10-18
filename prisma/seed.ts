import { PrismaClient } from '@prisma/client'
import * as bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seed...')

  // Create admin user
  const hashedPassword = await bcrypt.hash('Admin@123', 12)

  const admin = await prisma.user.upsert({
    where: { email: 'admin@mafende.com' },
    update: {},
    create: {
      email: 'admin@mafende.com',
      name: 'System Administrator',
      password: hashedPassword,
      role: 'ADMIN',
      isActive: true,
    },
  })

  console.log('✅ Created admin user:', admin.email)

  // Create manager user
  const managerPassword = await bcrypt.hash('Manager@123', 12)

  const manager = await prisma.user.upsert({
    where: { email: 'manager@mafende.com' },
    update: {},
    create: {
      email: 'manager@mafende.com',
      name: 'Estate Manager',
      password: managerPassword,
      role: 'MANAGER',
      isActive: true,
    },
  })

  console.log('✅ Created manager user:', manager.email)

  // Create accountant user
  const accountantPassword = await bcrypt.hash('Accountant@123', 12)

  const accountant = await prisma.user.upsert({
    where: { email: 'accountant@mafende.com' },
    update: {},
    create: {
      email: 'accountant@mafende.com',
      name: 'Chief Accountant',
      password: accountantPassword,
      role: 'ACCOUNTANT',
      isActive: true,
    },
  })

  console.log('✅ Created accountant user:', accountant.email)

  // Create sample tenant
  const tenant = await prisma.tenant.upsert({
    where: { phoneNumber: '+254700000001' },
    update: {},
    create: {
      firstName: 'John',
      lastName: 'Kamau',
      phoneNumber: '+254700000001',
      email: 'john.kamau@example.com',
      idNumber: '12345678',
      status: 'ACTIVE',
      location: 'Mafende Estate',
      notes: 'Demo tenant for testing purposes',
    },
  })

  console.log('✅ Created tenant:', `${tenant.firstName} ${tenant.lastName}`)

  // Log default credentials for reference
  console.log('\n🔐 Default Login Credentials:')
  console.log('─'.repeat(50))
  console.log('Admin: admin@mafende.com / Admin@123')
  console.log('Manager: manager@mafende.com / Manager@123')
  console.log('Accountant: accountant@mafende.com / Accountant@123')
  console.log('─'.repeat(50))

  console.log('🎉 Database seeding completed successfully!')
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })