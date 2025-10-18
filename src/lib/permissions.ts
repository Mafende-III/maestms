// Define UserRole as string type since we're using SQLite
export type UserRole = 'ADMIN' | 'MANAGER' | 'ACCOUNTANT' | 'SHOP_MANAGER' | 'FIELD_STAFF' | 'READ_ONLY'

// Define permissions for each role
export const PERMISSIONS = {
  // Admin permissions
  ADMIN: [
    'tenants.create',
    'tenants.read',
    'tenants.update',
    'tenants.delete',
    'leases.create',
    'leases.read',
    'leases.update',
    'leases.delete',
    'payments.create',
    'payments.read',
    'payments.update',
    'payments.delete',
    'expenses.create',
    'expenses.read',
    'expenses.update',
    'expenses.delete',
    'assets.create',
    'assets.read',
    'assets.update',
    'assets.delete',
    'sales.create',
    'sales.read',
    'sales.update',
    'sales.delete',
    'audits.create',
    'audits.read',
    'audits.update',
    'audits.delete',
    'users.create',
    'users.read',
    'users.update',
    'users.delete',
    'dashboard.read',
    'reports.read',
    'system.admin',
  ],

  // Manager permissions
  MANAGER: [
    'tenants.create',
    'tenants.read',
    'tenants.update',
    'leases.create',
    'leases.read',
    'leases.update',
    'payments.create',
    'payments.read',
    'payments.update',
    'expenses.create',
    'expenses.read',
    'expenses.update',
    'assets.create',
    'assets.read',
    'assets.update',
    'sales.create',
    'sales.read',
    'sales.update',
    'audits.create',
    'audits.read',
    'audits.update',
    'dashboard.read',
    'reports.read',
  ],

  // Accountant permissions
  ACCOUNTANT: [
    'tenants.read',
    'leases.read',
    'payments.create',
    'payments.read',
    'payments.update',
    'expenses.create',
    'expenses.read',
    'expenses.update',
    'assets.read',
    'sales.read',
    'dashboard.read',
    'reports.read',
  ],

  // Shop Manager permissions
  SHOP_MANAGER: [
    'tenants.read',
    'leases.read',
    'payments.read',
    'expenses.read',
    'assets.read',
    'sales.read',
    'dashboard.read',
  ],

  // Field Staff permissions
  FIELD_STAFF: [
    'tenants.read',
    'leases.read',
    'audits.create',
    'audits.read',
    'audits.update',
  ],

  // Read Only permissions
  READ_ONLY: [
    'tenants.read',
    'leases.read',
    'payments.read',
    'expenses.read',
    'assets.read',
    'sales.read',
    'audits.read',
    'dashboard.read',
    'reports.read',
  ],
} as const

export type Permission = typeof PERMISSIONS[keyof typeof PERMISSIONS][number]

/**
 * Check if a user role has a specific permission
 */
export function hasPermission(userRole: UserRole, permission: Permission): boolean {
  const rolePermissions = PERMISSIONS[userRole]
  return rolePermissions.includes(permission as any)
}

/**
 * Check if a user role has any of the specified permissions
 */
export function hasAnyPermission(userRole: UserRole, permissions: Permission[]): boolean {
  return permissions.some(permission => hasPermission(userRole, permission))
}

/**
 * Check if a user role has all of the specified permissions
 */
export function hasAllPermissions(userRole: UserRole, permissions: Permission[]): boolean {
  return permissions.every(permission => hasPermission(userRole, permission))
}

/**
 * Get all permissions for a user role
 */
export function getRolePermissions(userRole: UserRole): readonly Permission[] {
  return PERMISSIONS[userRole]
}

/**
 * Check if a role can access a specific module
 */
export function canAccessModule(userRole: UserRole, module: string): boolean {
  const modulePermissions = getRolePermissions(userRole).filter(p => p.startsWith(module))
  return modulePermissions.length > 0
}

/**
 * Role hierarchy for privilege checking
 */
export const ROLE_HIERARCHY: Record<UserRole, number> = {
  READ_ONLY: 0,
  FIELD_STAFF: 1,
  SHOP_MANAGER: 2,
  ACCOUNTANT: 3,
  MANAGER: 4,
  ADMIN: 5,
}

/**
 * Check if a role has higher or equal privileges than another role
 */
export function hasHigherOrEqualRole(userRole: UserRole, requiredRole: UserRole): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole]
}

/**
 * Get user-friendly role name
 */
export function getRoleName(role: UserRole): string {
  const roleNames: Record<UserRole, string> = {
    ADMIN: 'Administrator',
    MANAGER: 'Estate Manager',
    ACCOUNTANT: 'Accountant',
    SHOP_MANAGER: 'Shop Manager',
    FIELD_STAFF: 'Field Staff',
    READ_ONLY: 'Read Only',
  }
  return roleNames[role]
}

/**
 * Get role description
 */
export function getRoleDescription(role: UserRole): string {
  const descriptions: Record<UserRole, string> = {
    ADMIN: 'Full system access including user management',
    MANAGER: 'Estate operations and tenant management',
    ACCOUNTANT: 'Financial transactions and reporting',
    SHOP_MANAGER: 'Shop operations and limited access',
    FIELD_STAFF: 'Livestock audits and field operations',
    READ_ONLY: 'View-only access to data',
  }
  return descriptions[role]
}