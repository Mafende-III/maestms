import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import * as fs from 'fs'
import * as path from 'path'

export async function GET() {
  // Temporarily enable in production for debugging
  // if (process.env.NODE_ENV === 'production') {
  //   return NextResponse.json({
  //     error: 'Diagnostics disabled in production'
  //   }, { status: 403 })
  // }

  try {
    // Test database connection
    let dbTest = null
    let userCount = 0

    try {
      // Test raw query
      const result = await prisma.$queryRaw`SELECT name FROM sqlite_master WHERE type='table'`
      dbTest = { success: true, tables: result }

      // Count users
      userCount = await prisma.user.count()

      // List users for debugging
      const users = await prisma.user.findMany({
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          isActive: true,
          createdAt: true
        }
      })

      return NextResponse.json({
        database: {
          connectionTest: dbTest,
          userCount,
          users
        },
        timestamp: new Date().toISOString()
      })
    } catch (error) {
      dbTest = { success: false, error: error instanceof Error ? error.message : 'Unknown error' }

      return NextResponse.json({
        database: {
          connectionTest: dbTest,
          userCount: 0
        },
        timestamp: new Date().toISOString()
      })
    }
  } catch (error) {
    return NextResponse.json({
      error: 'Diagnostics failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}