'use client'

import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { getRoleName, getRoleDescription, hasPermission, getRolePermissions, type UserRole } from '@/lib/permissions'

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/login' })
  }

  const userRole = session?.user?.role as UserRole
  const userPermissions = userRole ? getRolePermissions(userRole) : []

  return (
    <main className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              🏡 Mafende Estate Dashboard
            </h1>
            <p className="text-muted-foreground">
              Welcome back, {session.user.name}
            </p>
          </div>
          <Button variant="outline" onClick={handleSignOut}>
            Sign Out
          </Button>
        </div>

        {/* User Info */}
        <Alert variant="success">
          <AlertTitle>✅ Authentication Working!</AlertTitle>
          <AlertDescription>
            You are successfully logged in as {userRole ? getRoleName(userRole) : session.user.role}
          </AlertDescription>
        </Alert>

        {/* User Details Card */}
        <Card>
          <CardHeader>
            <CardTitle>User Information</CardTitle>
            <CardDescription>
              Current session details
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Name</label>
                <p className="text-foreground">{session.user.name}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Email</label>
                <p className="text-foreground">{session.user.email}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Role</label>
                <div className="mt-1 space-y-1">
                  <Badge variant={session.user.role === 'ADMIN' ? 'default' : 'secondary'}>
                    {userRole ? getRoleName(userRole) : session.user.role}
                  </Badge>
                  {userRole && (
                    <p className="text-xs text-muted-foreground">
                      {getRoleDescription(userRole)}
                    </p>
                  )}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">User ID</label>
                <p className="text-foreground text-xs font-mono">{session.user.id}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* User Permissions */}
        {userRole && (
          <Card>
            <CardHeader>
              <CardTitle>Access Permissions</CardTitle>
              <CardDescription>
                Features available to your role: {getRoleName(userRole)}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {userPermissions.map((permission) => (
                  <Badge key={permission} variant="outline" className="text-xs">
                    {permission}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Dashboard Features Preview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {userRole && hasPermission(userRole, 'dashboard.read') && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">📊 Dashboard</CardTitle>
                <CardDescription>
                  Executive KPIs and alerts
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Coming in TASK-010
                </p>
              </CardContent>
            </Card>
          )}

          {userRole && hasPermission(userRole, 'tenants.read') && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">👥 Tenants</CardTitle>
                <CardDescription>
                  Manage tenant information
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Coming in TASK-012
                </p>
              </CardContent>
            </Card>
          )}

          {userRole && hasPermission(userRole, 'leases.read') && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">📋 Leases</CardTitle>
                <CardDescription>
                  Track lease agreements
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Coming in TASK-020
                </p>
              </CardContent>
            </Card>
          )}

          {userRole && hasPermission(userRole, 'payments.read') && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">💰 Payments</CardTitle>
                <CardDescription>
                  Financial transactions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Coming in TASK-025
                </p>
              </CardContent>
            </Card>
          )}

          {userRole && hasPermission(userRole, 'audits.read') && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">🔍 Audits</CardTitle>
                <CardDescription>
                  Livestock tracking
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Coming in TASK-030
                </p>
              </CardContent>
            </Card>
          )}

          {userRole && hasPermission(userRole, 'reports.read') && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">📈 Reports</CardTitle>
                <CardDescription>
                  Analytics and insights
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Coming in TASK-035
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Next Steps */}
        <Card>
          <CardHeader>
            <CardTitle>🚧 Development Progress</CardTitle>
            <CardDescription>
              Authentication is complete, continuing with layout and navigation
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant="healthy">Done</Badge>
                <span className="text-sm">NextAuth.js authentication</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="attention">Next</Badge>
                <span className="text-sm">App layout and navigation</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="monitor">Queue</Badge>
                <span className="text-sm">Dashboard home page</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}