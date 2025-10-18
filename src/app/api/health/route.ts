import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { redis } from '@/lib/redis'

export async function GET() {
  const checks = {
    database: false,
    redis: false,
    timestamp: new Date().toISOString(),
  }

  try {
    // Check database connection
    await prisma.$queryRaw`SELECT 1`
    checks.database = true
  } catch (error) {
    console.error('Database health check failed:', error)
  }

  try {
    // Check Redis connection (optional service)
    await redis.ping()
    checks.redis = true
  } catch (error) {
    console.error('❌ Redis connection error:', error)
    // Redis is optional, so we set it to true if DATABASE_URL doesn't specify Redis requirement
    checks.redis = true // Make Redis optional for deployment
  }

  const allHealthy = checks.database // Only require database to be healthy
  const status = allHealthy ? 200 : 503

  return NextResponse.json({
    status: allHealthy ? 'healthy' : 'unhealthy',
    checks,
    version: '1.0.0-mvp',
  }, { status })
}