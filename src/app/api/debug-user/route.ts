import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // Check if admin user exists
    const adminUser = await prisma.user.findUnique({
      where: { email: 'admin@mafende.com' },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true
      }
    })

    // Count total users
    const userCount = await prisma.user.count()

    return NextResponse.json({
      adminExists: !!adminUser,
      adminUser: adminUser || null,
      totalUsers: userCount,
      databaseConnected: true
    })
  } catch (error) {
    return NextResponse.json({
      error: 'Database connection failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      databaseConnected: false
    }, { status: 500 })
  }
}