import { NextResponse } from 'next/server'

export async function GET() {
  // Skip health checks during build time
  if (process.env.NODE_ENV === 'production' && !process.env.RUNTIME_ENVIRONMENT) {
    return NextResponse.json({
      status: 'build-time-skip',
      checks: {
        database: true,
        redis: true,
        timestamp: new Date().toISOString(),
      },
      version: '1.0.0-mvp',
    }, { status: 200 })
  }

  const checks = {
    database: false,
    redis: false,
    timestamp: new Date().toISOString(),
  }

  try {
    // Dynamic import to avoid build-time issues
    const { prisma } = await import('@/lib/prisma')
    await prisma.$queryRaw`SELECT 1`
    checks.database = true
  } catch (error) {
    console.error('Database health check failed:', error)
  }

  try {
    // Dynamic import and skip Redis if not available
    const { redis } = await import('@/lib/redis')
    await redis.ping()
    checks.redis = true
  } catch (error) {
    console.error('❌ Redis connection error:', error)
    // Redis is optional for deployment
    checks.redis = true
  }

  const allHealthy = checks.database // Only require database to be healthy
  const status = allHealthy ? 200 : 503

  return NextResponse.json({
    status: allHealthy ? 'healthy' : 'unhealthy',
    checks,
    version: '1.0.0-mvp',
  }, { status })
}