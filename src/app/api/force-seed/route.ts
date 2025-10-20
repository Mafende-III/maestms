import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import * as bcrypt from 'bcryptjs'

export async function POST() {
  // Only allow during initial setup or development
  const userCount = await prisma.user.count()
  if (userCount > 0 && process.env.NODE_ENV === 'production') {
    return NextResponse.json({
      error: 'Force seed disabled - users already exist'
    }, { status: 403 })
  }

  try {
    // First, clear all users to start fresh
    await prisma.user.deleteMany({})

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

    // Verify user was created
    const userCount = await prisma.user.count()
    const createdUser = await prisma.user.findUnique({
      where: { email: 'admin@mafende.com' }
    })

    return NextResponse.json({
      message: 'Admin user force-created successfully',
      userCount: userCount,
      user: {
        id: createdUser?.id,
        email: createdUser?.email,
        name: createdUser?.name,
        role: createdUser?.role,
        isActive: createdUser?.isActive
      }
    })
  } catch (error) {
    console.error('Force seed error:', error)
    return NextResponse.json({
      error: 'Failed to force-create admin user',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}