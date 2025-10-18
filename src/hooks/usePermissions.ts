'use client'

import { useSession } from 'next-auth/react'
import {
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  getRolePermissions,
  canAccessModule,
  hasHigherOrEqualRole
} from '@/lib/permissions'
import type { UserRole, Permission } from '@/lib/permissions'

export function usePermissions(module?: string) {
  const { data: session } = useSession()
  const userRole = session?.user?.role as UserRole | undefined

  const baseReturn = {
    userRole,
    permissions: userRole ? getRolePermissions(userRole) : [],

    hasPermission: (permission: Permission) =>
      userRole ? hasPermission(userRole, permission) : false,

    hasAnyPermission: (permissions: Permission[]) =>
      userRole ? hasAnyPermission(userRole, permissions) : false,

    hasAllPermissions: (permissions: Permission[]) =>
      userRole ? hasAllPermissions(userRole, permissions) : false,

    canAccessModule: (moduleName: string) =>
      userRole ? canAccessModule(userRole, moduleName) : false,

    hasHigherOrEqualRole: (requiredRole: UserRole) =>
      userRole ? hasHigherOrEqualRole(userRole, requiredRole) : false,
  }

  // If a module is specified, add convenient helper methods
  if (module) {
    return {
      ...baseReturn,
      canCreate: userRole ? hasPermission(userRole, `${module}.create` as Permission) : false,
      canRead: userRole ? hasPermission(userRole, `${module}.read` as Permission) : false,
      canUpdate: userRole ? hasPermission(userRole, `${module}.update` as Permission) : false,
      canDelete: userRole ? hasPermission(userRole, `${module}.delete` as Permission) : false,
    }
  }

  return baseReturn
}