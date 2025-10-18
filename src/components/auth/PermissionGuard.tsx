'use client'

import { useSession } from 'next-auth/react'
import { hasPermission, hasAnyPermission, hasAllPermissions } from '@/lib/permissions'
import type { UserRole, Permission } from '@/lib/permissions'

interface PermissionGuardProps {
  children: React.ReactNode
  permission?: Permission
  permissions?: Permission[]
  requireAll?: boolean
  fallback?: React.ReactNode
}

export function PermissionGuard({
  children,
  permission,
  permissions = [],
  requireAll = false,
  fallback = null,
}: PermissionGuardProps) {
  const { data: session } = useSession()

  if (!session?.user?.role) {
    return <>{fallback}</>
  }

  const userRole = session.user.role as UserRole

  let hasAccess = false

  if (permission) {
    hasAccess = hasPermission(userRole, permission)
  } else if (permissions.length > 0) {
    hasAccess = requireAll
      ? hasAllPermissions(userRole, permissions)
      : hasAnyPermission(userRole, permissions)
  } else {
    hasAccess = true
  }

  return hasAccess ? <>{children}</> : <>{fallback}</>
}