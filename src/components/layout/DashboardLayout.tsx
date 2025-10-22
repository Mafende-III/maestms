'use client'

import { useState } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { usePermissions } from '@/hooks/usePermissions'
import { getRoleName } from '@/lib/permissions'
import {
  Home,
  Users,
  FileText,
  CreditCard,
  Receipt,
  Package,
  TrendingUp,
  Search,
  BarChart3,
  Settings,
  Menu,
  X,
  LogOut,
  User,
  Upload
} from 'lucide-react'

interface DashboardLayoutProps {
  children: React.ReactNode
}

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: Home, permission: 'dashboard.read' },
  { name: 'Tenants', href: '/tenants', icon: Users, permission: 'tenants.read' },
  { name: 'Leases', href: '/leases', icon: FileText, permission: 'leases.read' },
  { name: 'Payments', href: '/payments', icon: CreditCard, permission: 'payments.read' },
  { name: 'Sales', href: '/sales', icon: TrendingUp, permission: 'sales.read' },
  { name: 'Expenses', href: '/expenses', icon: Receipt, permission: 'expenses.read' },
  { name: 'Assets', href: '/assets', icon: Package, permission: 'assets.read' },
]

const uploadNavigation = [
  { name: 'Upload Assets', href: '/assets/upload', icon: Upload, permission: 'assets.create' },
  { name: 'Upload Sales', href: '/sales/upload', icon: Upload, permission: 'sales.create' },
]

const adminNavigation = [
  { name: 'Audits', href: '/audits', icon: Search, permission: 'audits.read' },
  { name: 'Reports', href: '/reports', icon: BarChart3, permission: 'reports.read' },
  { name: 'Settings', href: '/settings', icon: Settings, permission: 'system.admin' },
]

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { data: session } = useSession()
  const router = useRouter()
  const pathname = usePathname()
  const { hasPermission, userRole } = usePermissions()

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/login' })
  }

  const filteredNavigation = navigation.filter(item =>
    hasPermission(item.permission as any)
  )

  const filteredUploadNavigation = uploadNavigation.filter(item =>
    hasPermission(item.permission as any)
  )

  const filteredAdminNavigation = adminNavigation.filter(item =>
    hasPermission(item.permission as any)
  )

  return (
    <div className="min-h-screen bg-background lg:flex">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-25 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-card border-r transform transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:inset-0 lg:flex lg:flex-col
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between h-16 px-4 border-b">
            <Link href="/dashboard" className="flex items-center gap-2">
              <span className="text-2xl">🏡</span>
              <span className="font-bold text-foreground">Mafende</span>
            </Link>
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* User info */}
          {session && (
            <div className="p-4 border-b">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                  <User className="h-4 w-4 text-primary-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {session.user.name}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {session.user.email}
                  </p>
                </div>
              </div>
              <div className="mt-2">
                <Badge variant="secondary" className="text-xs">
                  {userRole ? getRoleName(userRole) : session.user.role}
                </Badge>
              </div>
            </div>
          )}

          {/* Navigation */}
          <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
            {/* Main Navigation */}
            {filteredNavigation.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`
                    flex items-center gap-3 px-3 py-2 text-sm rounded-md transition-colors
                    ${isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                    }
                  `}
                  onClick={() => setSidebarOpen(false)}
                >
                  <item.icon className="h-4 w-4" />
                  {item.name}
                </Link>
              )
            })}

            {/* Upload Section */}
            {filteredUploadNavigation.length > 0 && (
              <>
                <div className="mt-6 mb-2">
                  <div className="px-3 py-1 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Data Import
                  </div>
                </div>
                {filteredUploadNavigation.map((item) => {
                  const isActive = pathname === item.href
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={`
                        flex items-center gap-3 px-3 py-2 text-sm rounded-md transition-colors
                        ${isActive
                          ? 'bg-primary text-primary-foreground'
                          : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                        }
                      `}
                      onClick={() => setSidebarOpen(false)}
                    >
                      <item.icon className="h-4 w-4" />
                      {item.name}
                    </Link>
                  )
                })}
              </>
            )}

            {/* Admin Section */}
            {filteredAdminNavigation.length > 0 && (
              <>
                <div className="mt-6 mb-2">
                  <div className="px-3 py-1 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Administration
                  </div>
                </div>
                {filteredAdminNavigation.map((item) => {
                  const isActive = pathname === item.href
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={`
                        flex items-center gap-3 px-3 py-2 text-sm rounded-md transition-colors
                        ${isActive
                          ? 'bg-primary text-primary-foreground'
                          : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                        }
                      `}
                      onClick={() => setSidebarOpen(false)}
                    >
                      <item.icon className="h-4 w-4" />
                      {item.name}
                    </Link>
                  )
                })}
              </>
            )}
          </nav>

          <Separator />

          {/* Sign out */}
          <div className="p-4">
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 text-muted-foreground hover:text-foreground"
              onClick={handleSignOut}
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 lg:flex lg:flex-col lg:overflow-hidden">
        {/* Top bar */}
        <div className="sticky top-0 z-40 bg-background border-b lg:static">
          <div className="flex items-center justify-between h-16 px-4">
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-4 w-4" />
            </Button>

            <div className="flex items-center gap-4">
              <div className="text-sm text-muted-foreground">
                {new Date().toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1 p-4 lg:overflow-auto">
          {children}
        </main>
      </div>
    </div>
  )
}