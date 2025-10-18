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
    // Check Redis connection
    await redis.ping()
    checks.redis = true
  } catch (error) {
    console.error('Redis health check failed:', error)
  }

  const allHealthy = checks.database && checks.redis
  const status = allHealthy ? 200 : 503

  return NextResponse.json({
    status: allHealthy ? 'healthy' : 'unhealthy',
    checks,
    version: '1.0.0-mvp',
  }, { status })
}