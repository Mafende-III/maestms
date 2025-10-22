import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Starting database seed...')

  // Check if admin user already exists
  const existingAdmin = await prisma.user.findFirst({
    where: { email: 'admin@mafende.com' }
  })

  let adminUser = existingAdmin

  if (existingAdmin) {
    console.log('Admin user already exists, using existing user.')
  } else {
    console.log('Creating admin user...')
    // Create admin user with default password
    const hashedPassword = await bcrypt.hash('Admin123!', 10)

    adminUser = await prisma.user.create({
      data: {
        email: 'admin@mafende.com',
        username: 'admin',
        password: hashedPassword,
        name: 'System Administrator',
        role: 'ADMIN',
        isActive: true,
      },
    })
  }

  console.log('Admin user info:', {
    email: adminUser.email,
    username: adminUser.username,
    role: adminUser.role
  })

  // Check if assets already exist
  const existingNgoma = await prisma.asset.findUnique({
    where: { id: 'cmh2iqi9y0000ttaxuvz4ynaj' }
  })

  const existingNakasongola = await prisma.asset.findUnique({
    where: { id: 'cmh2iqia00001ttaxe2o8g4f8' }
  })

  let ngomaBusinessCenter = existingNgoma
  let nakasongolaRanch = existingNakasongola

  if (!existingNgoma) {
    console.log('Creating Ngoma Business Center asset...')
    ngomaBusinessCenter = await prisma.asset.create({
      data: {
        id: 'cmh2iqi9y0000ttaxuvz4ynaj',
        name: 'Ngoma Business Center',
        description: 'Main business center housing shop, salon, cinema, and mobile money services',
        category: 'PROPERTY',
        location: 'Ngoma District, Rwanda',
        status: 'ACTIVE',
        condition: 'GOOD',
        purchasePrice: 50000000, // 50M UGX
        currentValue: 60000000,  // 60M UGX
        purchaseDate: new Date('2020-01-01'),
        notes: 'Multi-purpose business facility generating revenue from various services',
        recordedBy: adminUser.id
      }
    })
  } else {
    console.log('Ngoma Business Center asset already exists.')
  }

  if (!existingNakasongola) {
    console.log('Creating Nakasongola Ranch asset...')
    nakasongolaRanch = await prisma.asset.create({
      data: {
        id: 'cmh2iqia00001ttaxe2o8g4f8',
        name: 'Nakasongola Ranch',
        description: 'Agricultural ranch for livestock and property development',
        category: 'PROPERTY',
        location: 'Nakasongola District, Uganda',
        status: 'ACTIVE',
        condition: 'EXCELLENT',
        purchasePrice: 2000000000, // 2B UGX
        currentValue: 2500000000,  // 2.5B UGX
        purchaseDate: new Date('2018-06-15'),
        notes: 'Large ranch for livestock farming and land development projects',
        recordedBy: adminUser.id
      }
    })
  } else {
    console.log('Nakasongola Ranch asset already exists.')
  }

  console.log('Business assets ready:', {
    ngomaBusinessCenter: ngomaBusinessCenter.name,
    nakasongolaRanch: nakasongolaRanch.name
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