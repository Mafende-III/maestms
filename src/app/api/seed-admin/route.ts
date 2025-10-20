import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import * as bcrypt from 'bcryptjs'

export async function POST(request: Request) {
  try {
    // Check if admin already exists
    const existingAdmin = await prisma.user.findUnique({
      where: { email: 'admin@mafende.com' }
    })

    if (existingAdmin) {
      return NextResponse.json({
        message: 'Admin user already exists',
        user: existingAdmin
      })
    }

    // Create admin user
    const hashedPassword = await bcrypt.hash('Admin123!', 10)

    const adminUser = await prisma.user.create({
      data: {
        email: 'admin@mafende.com',
        username: 'admin',
        name: 'System Administrator',
        password: hashedPassword,
        role: 'ADMIN',
        isActive: true,
      },
    })

    return NextResponse.json({
      message: 'Admin user created successfully',
      user: {
        id: adminUser.id,
        email: adminUser.email,
        name: adminUser.name,
        role: adminUser.role
      }
    })
  } catch (error) {
    console.error('Seed error:', error)
    return NextResponse.json({
      error: 'Failed to create admin user',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}