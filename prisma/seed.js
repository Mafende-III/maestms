const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function main() {
  console.log('Starting database seed...')

  // Check if admin user already exists
  const existingAdmin = await prisma.user.findFirst({
    where: { email: 'admin@mafende.com' }
  })

  if (existingAdmin) {
    console.log('Admin user already exists, skipping seed.')
    return
  }

  // Create admin user with default password
  const hashedPassword = await bcrypt.hash('Admin123!', 10)

  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@mafende.com',
      username: 'admin',
      password: hashedPassword,
      name: 'System Administrator',
      role: 'ADMIN',
      isActive: true,
    },
  })

  console.log('Created admin user:', {
    email: adminUser.email,
    username: adminUser.username,
    role: adminUser.role
  })

  console.log('\n=================================')
  console.log('Default Login Credentials:')
  console.log('Email: admin@mafende.com')
  console.log('Password: Admin123!')
  console.log('=================================\n')
  console.log('⚠️  Please change the admin password after first login!')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error('Error seeding database:', e)
    await prisma.$disconnect()
    process.exit(1)
  })