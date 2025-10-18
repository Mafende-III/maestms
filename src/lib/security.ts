import bcrypt from 'bcryptjs'
import { prisma } from './prisma'

/**
 * Hash a password with salt
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

/**
 * Verify a password against a hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

/**
 * Generate a secure random string
 */
export function generateSecureId(length: number = 32): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

/**
 * Password strength validation
 */
export function validatePasswordStrength(password: string): {
  isValid: boolean
  errors: string[]
} {
  const errors: string[] = []

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long')
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter')
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter')
  }

  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number')
  }

  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\?]/.test(password)) {
    errors.push('Password must contain at least one special character')
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * Rate limiting for login attempts
 */
interface LoginAttempt {
  email: string
  timestamp: number
  success: boolean
}

const loginAttempts = new Map<string, LoginAttempt[]>()
const MAX_ATTEMPTS = 5
const LOCKOUT_DURATION = 15 * 60 * 1000 // 15 minutes

export function checkRateLimit(email: string): {
  allowed: boolean
  remainingAttempts?: number
  lockoutUntil?: Date
} {
  const attempts = loginAttempts.get(email) || []
  const now = Date.now()

  // Clean up old attempts (older than lockout duration)
  const recentAttempts = attempts.filter(attempt =>
    now - attempt.timestamp < LOCKOUT_DURATION
  )

  // Count failed attempts in the recent period
  const failedAttempts = recentAttempts.filter(attempt => !attempt.success)

  if (failedAttempts.length >= MAX_ATTEMPTS) {
    const oldestFailedAttempt = failedAttempts[0]
    const lockoutUntil = new Date(oldestFailedAttempt.timestamp + LOCKOUT_DURATION)

    if (now < lockoutUntil.getTime()) {
      return {
        allowed: false,
        lockoutUntil
      }
    }
  }

  return {
    allowed: true,
    remainingAttempts: MAX_ATTEMPTS - failedAttempts.length
  }
}

export function recordLoginAttempt(email: string, success: boolean): void {
  const attempts = loginAttempts.get(email) || []
  attempts.push({
    email,
    timestamp: Date.now(),
    success
  })

  // Keep only recent attempts
  const recentAttempts = attempts.filter(attempt =>
    Date.now() - attempt.timestamp < LOCKOUT_DURATION
  )

  loginAttempts.set(email, recentAttempts)
}

/**
 * Log security events
 */
export async function logSecurityEvent(
  event: string,
  details: Record<string, any>,
  userId?: string
): Promise<void> {
  try {
    await prisma.systemInfo.create({
      data: {
        key: `security_log_${Date.now()}`,
        value: JSON.stringify({
          event,
          details,
          userId,
          timestamp: new Date().toISOString(),
          userAgent: details.userAgent || 'Unknown',
          ip: details.ip || 'Unknown'
        })
      }
    })
  } catch (error) {
    console.error('Failed to log security event:', error)
  }
}

/**
 * Sanitize user input to prevent XSS
 */
export function sanitizeInput(input: string): string {
  return input
    .replace(/[<>'"]/g, '')
    .trim()
    .substring(0, 1000) // Limit length
}

/**
 * Check if user account is active and not locked
 */
export async function checkUserStatus(userId: string): Promise<{
  active: boolean
  locked: boolean
  reason?: string
}> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { isActive: true }
    })

    if (!user) {
      return { active: false, locked: true, reason: 'User not found' }
    }

    if (!user.isActive) {
      return { active: false, locked: true, reason: 'Account deactivated' }
    }

    return { active: true, locked: false }
  } catch (error) {
    console.error('Error checking user status:', error)
    return { active: false, locked: true, reason: 'System error' }
  }
}