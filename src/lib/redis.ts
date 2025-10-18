import Redis from 'ioredis'

const getRedisUrl = () => {
  if (process.env.REDIS_URL) {
    return process.env.REDIS_URL
  }

  // Default to localhost for development
  return 'redis://localhost:6379'
}

// Create Redis instance
export const redis = new Redis(getRedisUrl(), {
  maxRetriesPerRequest: 3,
  // retryDelayOnFailover: 100, // Temporarily disabled for compatibility
  enableReadyCheck: false,
  lazyConnect: true,
})

// Handle Redis connection events
redis.on('connect', () => {
  console.log('✅ Redis connected successfully')
})

redis.on('error', (error) => {
  console.error('❌ Redis connection error:', error)
})

redis.on('ready', () => {
  console.log('🚀 Redis is ready to accept commands')
})

// Cache helper functions
export const cache = {
  /**
   * Get a value from cache
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      const data = await redis.get(key)
      return data ? JSON.parse(data) : null
    } catch (error) {
      console.error('Redis GET error:', error)
      return null
    }
  },

  /**
   * Set a value in cache with optional expiry
   */
  async set(key: string, value: any, expirySeconds = 300): Promise<boolean> {
    try {
      await redis.set(key, JSON.stringify(value), 'EX', expirySeconds)
      return true
    } catch (error) {
      console.error('Redis SET error:', error)
      return false
    }
  },

  /**
   * Delete a key from cache
   */
  async del(key: string): Promise<boolean> {
    try {
      await redis.del(key)
      return true
    } catch (error) {
      console.error('Redis DEL error:', error)
      return false
    }
  },

  /**
   * Clear all keys matching a pattern
   */
  async clearPattern(pattern: string): Promise<void> {
    try {
      const keys = await redis.keys(pattern)
      if (keys.length > 0) {
        await redis.del(...keys)
      }
    } catch (error) {
      console.error('Redis CLEAR PATTERN error:', error)
    }
  },

  /**
   * Check if a key exists
   */
  async exists(key: string): Promise<boolean> {
    try {
      const result = await redis.exists(key)
      return result === 1
    } catch (error) {
      console.error('Redis EXISTS error:', error)
      return false
    }
  },

  /**
   * Set expiry for an existing key
   */
  async expire(key: string, seconds: number): Promise<boolean> {
    try {
      const result = await redis.expire(key, seconds)
      return result === 1
    } catch (error) {
      console.error('Redis EXPIRE error:', error)
      return false
    }
  },

  /**
   * Get remaining TTL for a key
   */
  async ttl(key: string): Promise<number> {
    try {
      return await redis.ttl(key)
    } catch (error) {
      console.error('Redis TTL error:', error)
      return -1
    }
  },

  /**
   * Increment a numeric value
   */
  async incr(key: string): Promise<number> {
    try {
      return await redis.incr(key)
    } catch (error) {
      console.error('Redis INCR error:', error)
      return 0
    }
  },

  /**
   * Set multiple key-value pairs
   */
  async mset(keyValuePairs: Record<string, any>): Promise<boolean> {
    try {
      const serializedPairs = Object.entries(keyValuePairs).flat().map((value, index) =>
        index % 2 === 1 ? JSON.stringify(value) : value
      )
      await redis.mset(...serializedPairs)
      return true
    } catch (error) {
      console.error('Redis MSET error:', error)
      return false
    }
  },

  /**
   * Get multiple values by keys
   */
  async mget<T>(keys: string[]): Promise<(T | null)[]> {
    try {
      const values = await redis.mget(...keys)
      return values.map(value => value ? JSON.parse(value) : null)
    } catch (error) {
      console.error('Redis MGET error:', error)
      return new Array(keys.length).fill(null)
    }
  }
}

// Specific cache functions for the application
export const cacheKeys = {
  // Tenant caching
  tenant: (id: string) => `tenant:${id}`,
  tenantList: (page: number, limit: number, search: string, status: string) =>
    `tenants:${page}:${limit}:${search}:${status}`,

  // Lease caching
  lease: (id: string) => `lease:${id}`,
  leaseList: (page: number, limit: number, filters: string) =>
    `leases:${page}:${limit}:${filters}`,
  leaseExpiring: (days: number) => `leases:expiring:${days}`,

  // Payment caching
  payment: (id: string) => `payment:${id}`,
  paymentHistory: (leaseId: string) => `payments:lease:${leaseId}`,

  // Dashboard data
  dashboard: (userId: string) => `dashboard:${userId}`,
  kpis: () => 'kpis:current',

  // User session
  session: (userId: string) => `session:${userId}`,

  // Application stats
  stats: (type: string) => `stats:${type}`,
}

// Cache invalidation helpers
export const invalidateCache = {
  tenant: async (tenantId?: string) => {
    if (tenantId) {
      await cache.del(cacheKeys.tenant(tenantId))
    }
    await cache.clearPattern('tenants:*')
    await cache.clearPattern('dashboard:*')
    await cache.del(cacheKeys.kpis())
  },

  lease: async (leaseId?: string) => {
    if (leaseId) {
      await cache.del(cacheKeys.lease(leaseId))
    }
    await cache.clearPattern('leases:*')
    await cache.clearPattern('dashboard:*')
    await cache.del(cacheKeys.kpis())
  },

  payment: async (paymentId?: string, leaseId?: string) => {
    if (paymentId) {
      await cache.del(cacheKeys.payment(paymentId))
    }
    if (leaseId) {
      await cache.del(cacheKeys.paymentHistory(leaseId))
    }
    await cache.clearPattern('payments:*')
    await cache.clearPattern('dashboard:*')
    await cache.del(cacheKeys.kpis())
  },

  dashboard: async (userId?: string) => {
    if (userId) {
      await cache.del(cacheKeys.dashboard(userId))
    } else {
      await cache.clearPattern('dashboard:*')
    }
    await cache.del(cacheKeys.kpis())
  },

  all: async () => {
    await redis.flushdb()
  }
}

// Utility for caching API responses
export async function withCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl: number = 300
): Promise<T> {
  // Try to get from cache first
  const cached = await cache.get<T>(key)
  if (cached !== null) {
    return cached
  }

  // If not in cache, fetch data
  const data = await fetcher()

  // Cache the result
  await cache.set(key, data, ttl)

  return data
}