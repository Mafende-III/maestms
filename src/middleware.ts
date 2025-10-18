import { withAuth } from "next-auth/middleware"
import { hasPermission, type UserRole } from "@/lib/permissions"

export default withAuth(
  function middleware(req) {
    // Additional middleware logic can go here
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // Allow access to login page without authentication
        if (req.nextUrl.pathname === '/login') {
          return true
        }

        // Allow access to home page without authentication
        if (req.nextUrl.pathname === '/') {
          return true
        }

        // Allow API routes (they handle their own auth)
        if (req.nextUrl.pathname.startsWith('/api/')) {
          return true
        }

        // Require authentication for all other routes
        if (!token) {
          return false
        }

        // Role-based access control for specific routes
        const userRole = token.role as UserRole

        // Dashboard routes require dashboard.read permission
        if (req.nextUrl.pathname.startsWith('/dashboard')) {
          return hasPermission(userRole, 'dashboard.read')
        }

        // Tenant routes require tenants.read permission
        if (req.nextUrl.pathname.startsWith('/tenants')) {
          return hasPermission(userRole, 'tenants.read')
        }

        // Lease routes require leases.read permission
        if (req.nextUrl.pathname.startsWith('/leases')) {
          return hasPermission(userRole, 'leases.read')
        }

        // Payment routes require payments.read permission
        if (req.nextUrl.pathname.startsWith('/payments')) {
          return hasPermission(userRole, 'payments.read')
        }

        // Audit routes require audits.read permission
        if (req.nextUrl.pathname.startsWith('/audits')) {
          return hasPermission(userRole, 'audits.read')
        }

        // Report routes require reports.read permission
        if (req.nextUrl.pathname.startsWith('/reports')) {
          return hasPermission(userRole, 'reports.read')
        }

        // Admin routes require system.admin permission
        if (req.nextUrl.pathname.startsWith('/admin')) {
          return hasPermission(userRole, 'system.admin')
        }

        // Default: allow access if authenticated
        return true
      },
    },
  }
)

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
}