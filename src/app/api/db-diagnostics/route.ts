import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import * as fs from 'fs'
import * as path from 'path'

export async function GET() {
  try {
    // Check environment variables
    const dbUrl = process.env.DATABASE_URL
    const nodeEnv = process.env.NODE_ENV

    // Check file system
    const dataDir = '/app/data'
    const dataDirExists = fs.existsSync(dataDir)
    const dataDirContents = dataDirExists ? fs.readdirSync(dataDir) : []

    // Check database files
    const dbFile = '/app/data/prod.db'
    const dbFileExists = fs.existsSync(dbFile)
    const dbFileStats = dbFileExists ? fs.statSync(dbFile) : null

    // Test database connection
    let dbTest = null
    let userCount = 0
    let users = []

    try {
      // Test raw query
      const result = await prisma.$queryRaw`SELECT name FROM sqlite_master WHERE type='table'`
      dbTest = { success: true, tables: result }

      // Count users
      userCount = await prisma.user.count()

      // List users
      users = await prisma.user.findMany({
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          isActive: true,
          createdAt: true
        }
      })
    } catch (error) {
      dbTest = { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }

    // Check Prisma client configuration
    const prismaConfig = {
      datasourceUrl: dbUrl,
      databaseExists: dbFileExists,
      connectionString: dbUrl
    }

    return NextResponse.json({
      environment: {
        DATABASE_URL: dbUrl,
        NODE_ENV: nodeEnv,
      },
      filesystem: {
        dataDirExists,
        dataDirContents,
        dbFileExists,
        dbFileSize: dbFileStats ? dbFileStats.size : 0,
        dbFileModified: dbFileStats ? dbFileStats.mtime : null,
      },
      database: {
        connectionTest: dbTest,
        userCount,
        users,
        prismaConfig
      },
      diagnostics: {
        timestamp: new Date().toISOString(),
        pid: process.pid,
        cwd: process.cwd()
      }
    })
  } catch (error) {
    return NextResponse.json({
      error: 'Diagnostics failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}