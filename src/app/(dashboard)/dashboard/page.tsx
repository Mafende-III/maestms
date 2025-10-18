'use client'

export const dynamic = 'force-dynamic'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { getRoleName, hasPermission, type UserRole } from '@/lib/permissions'
import { usePermissions } from '@/hooks/usePermissions'
import {
  Users,
  FileText,
  CreditCard,
  Receipt,
  Package,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Clock,
  AlertTriangle,
  CheckCircle,
  Calendar,
  Phone,
  Mail,
  MapPin
} from 'lucide-react'

interface DashboardStats {
  totalTenants: number
  activeTenants: number
  inactiveTenants: number
  totalLeases: number
  activeLeases: number
  expiredLeases: number
  totalPayments: number
  completedPayments: number
  pendingPayments: number
  overduePayments: number
  monthlyRevenue: number
  totalRevenue: number
  averageRent: number
  totalExpenses: number
  monthlyExpenses: number
  totalAssets: number
  activeAssets: number
  totalAssetValue: number
}

interface RecentActivity {
  id: string
  type: 'tenant' | 'lease' | 'payment'
  title: string
  description: string
  timestamp: string
  amount?: number
}

interface Tenant {
  id: string
  firstName: string
  lastName: string
  phoneNumber: string
  email?: string
  status: string
  createdAt: string
}

interface Lease {
  id: string
  propertyAddress: string
  monthlyRent: number
  status: string
  startDate: string
  endDate?: string
  tenant: {
    firstName: string
    lastName: string
  }
}

interface Payment {
  id: string
  amount: number
  paymentDate: string
  status: string
  tenant: {
    firstName: string
    lastName: string
  }
  lease: {
    propertyAddress: string
  }
}

interface Expense {
  id: string
  description: string
  amount: number
  category: string
  expenseDate: string
  vendor?: string
  propertyAddress?: string
}

interface Asset {
  id: string
  name: string
  description?: string
  category: string
  currentValue?: number
  purchasePrice?: number
  status: string
  location?: string
}

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const permissions = usePermissions()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [recentTenants, setRecentTenants] = useState<Tenant[]>([])
  const [recentLeases, setRecentLeases] = useState<Lease[]>([])
  const [recentPayments, setRecentPayments] = useState<Payment[]>([])
  const [recentExpenses, setRecentExpenses] = useState<Expense[]>([])
  const [recentAssets, setRecentAssets] = useState<Asset[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  const fetchDashboardData = async () => {
    try {
      // Fetch all data in parallel
      const [tenantsRes, leasesRes, paymentsRes, expensesRes, assetsRes] = await Promise.all([
        permissions.hasPermission('tenants.read') ? fetch('/api/tenants') : Promise.resolve(null),
        permissions.hasPermission('leases.read') ? fetch('/api/leases') : Promise.resolve(null),
        permissions.hasPermission('payments.read') ? fetch('/api/payments') : Promise.resolve(null),
        permissions.hasPermission('expenses.read') ? fetch('/api/expenses') : Promise.resolve(null),
        permissions.hasPermission('assets.read') ? fetch('/api/assets') : Promise.resolve(null),
      ])

      const tenants = tenantsRes?.ok ? await tenantsRes.json() : []
      const leases = leasesRes?.ok ? await leasesRes.json() : []
      const payments = paymentsRes?.ok ? await paymentsRes.json() : []
      const expenses = expensesRes?.ok ? await expensesRes.json() : []
      const assets = assetsRes?.ok ? await assetsRes.json() : []

      // Calculate stats
      const now = new Date()
      const currentMonth = now.getMonth()
      const currentYear = now.getFullYear()

      const activeTenants = tenants.filter((t: Tenant) => t.status === 'ACTIVE').length
      const activeLeases = leases.filter((l: Lease) => l.status === 'ACTIVE').length
      const expiredLeases = leases.filter((l: Lease) => {
        if (!l.endDate) return false
        return new Date(l.endDate) < now
      }).length

      const completedPayments = payments.filter((p: Payment) => p.status === 'COMPLETED').length
      const pendingPayments = payments.filter((p: Payment) => p.status === 'PENDING').length
      const overduePayments = payments.filter((p: Payment) => p.status === 'OVERDUE').length

      const monthlyPayments = payments.filter((p: Payment) => {
        const paymentDate = new Date(p.paymentDate)
        return paymentDate.getMonth() === currentMonth &&
               paymentDate.getFullYear() === currentYear &&
               p.status === 'COMPLETED'
      })

      const monthlyRevenue = monthlyPayments.reduce((sum: number, p: Payment) => sum + p.amount, 0)
      const totalRevenue = payments
        .filter((p: Payment) => p.status === 'COMPLETED')
        .reduce((sum: number, p: Payment) => sum + p.amount, 0)

      const averageRent = activeLeases.length > 0
        ? leases.reduce((sum: number, l: Lease) => sum + l.monthlyRent, 0) / activeLeases
        : 0

      // Calculate expense stats
      const monthlyExpenseData = expenses.filter((e: Expense) => {
        const expenseDate = new Date(e.expenseDate)
        return expenseDate.getMonth() === currentMonth &&
               expenseDate.getFullYear() === currentYear
      })
      const monthlyExpenses = monthlyExpenseData.reduce((sum: number, e: Expense) => sum + e.amount, 0)
      const totalExpenses = expenses.reduce((sum: number, e: Expense) => sum + e.amount, 0)

      // Calculate asset stats
      const activeAssets = assets.filter((a: Asset) => a.status === 'ACTIVE').length
      const totalAssetValue = assets
        .filter((a: Asset) => a.currentValue && a.status === 'ACTIVE')
        .reduce((sum: number, a: Asset) => sum + (a.currentValue || 0), 0)

      setStats({
        totalTenants: tenants.length,
        activeTenants,
        inactiveTenants: tenants.length - activeTenants,
        totalLeases: leases.length,
        activeLeases,
        expiredLeases,
        totalPayments: payments.length,
        completedPayments,
        pendingPayments,
        overduePayments,
        monthlyRevenue,
        totalRevenue,
        averageRent,
        totalExpenses,
        monthlyExpenses,
        totalAssets: assets.length,
        activeAssets,
        totalAssetValue,
      })

      // Set recent data (last 5 items)
      setRecentTenants(tenants.slice(0, 5))
      setRecentLeases(leases.slice(0, 5))
      setRecentPayments(payments.slice(0, 5))
      setRecentExpenses(expenses.slice(0, 5))
      setRecentAssets(assets.slice(0, 5))

    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (session) {
      fetchDashboardData()
    }
  }, [session])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-UG', {
      style: 'currency',
      currency: 'UGX'
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-UG')
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent mx-auto mb-4" />
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  const userRole = session?.user?.role as UserRole

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">
          Welcome back, {session.user.name}
        </h1>
        <p className="text-muted-foreground">
          Here&apos;s your estate management overview for today.
        </p>
      </div>

      {/* Key Performance Indicators */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {permissions.hasPermission('tenants.read') && (
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Tenants</p>
                    <p className="text-2xl font-bold">{stats.totalTenants}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {stats.activeTenants} active, {stats.inactiveTenants} inactive
                    </p>
                  </div>
                  <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <Users className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {permissions.hasPermission('leases.read') && (
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Active Leases</p>
                    <p className="text-2xl font-bold">{stats.activeLeases}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {stats.expiredLeases} expired
                    </p>
                  </div>
                  <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
                    <FileText className="h-6 w-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {permissions.hasPermission('payments.read') && (
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Monthly Revenue</p>
                    <p className="text-2xl font-bold">{formatCurrency(stats.monthlyRevenue)}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {stats.completedPayments} payments completed
                    </p>
                  </div>
                  <div className="h-12 w-12 bg-purple-100 rounded-full flex items-center justify-center">
                    <DollarSign className="h-6 w-6 text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {permissions.hasPermission('payments.read') && (
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Average Rent</p>
                    <p className="text-2xl font-bold">{formatCurrency(stats.averageRent)}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Per active lease
                    </p>
                  </div>
                  <div className="h-12 w-12 bg-orange-100 rounded-full flex items-center justify-center">
                    <TrendingUp className="h-6 w-6 text-orange-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Expenses and Assets KPIs */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {permissions.hasPermission('expenses.read') && (
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Monthly Expenses</p>
                    <p className="text-2xl font-bold">{formatCurrency(stats.monthlyExpenses)}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Total: {formatCurrency(stats.totalExpenses)}
                    </p>
                  </div>
                  <div className="h-12 w-12 bg-red-100 rounded-full flex items-center justify-center">
                    <Receipt className="h-6 w-6 text-red-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {permissions.hasPermission('assets.read') && (
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Active Assets</p>
                    <p className="text-2xl font-bold">{stats.activeAssets}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Total assets: {stats.totalAssets}
                    </p>
                  </div>
                  <div className="h-12 w-12 bg-indigo-100 rounded-full flex items-center justify-center">
                    <Package className="h-6 w-6 text-indigo-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {permissions.hasPermission('assets.read') && (
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Asset Value</p>
                    <p className="text-2xl font-bold">{formatCurrency(stats.totalAssetValue)}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Current valuation
                    </p>
                  </div>
                  <div className="h-12 w-12 bg-emerald-100 rounded-full flex items-center justify-center">
                    <DollarSign className="h-6 w-6 text-emerald-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {permissions.hasPermission('payments.read') && permissions.hasPermission('expenses.read') && (
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Net Income</p>
                    <p className="text-2xl font-bold">{formatCurrency(stats.monthlyRevenue - stats.monthlyExpenses)}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Revenue - Expenses
                    </p>
                  </div>
                  <div className={`h-12 w-12 rounded-full flex items-center justify-center ${
                    stats.monthlyRevenue - stats.monthlyExpenses >= 0
                      ? 'bg-green-100'
                      : 'bg-red-100'
                  }`}>
                    {stats.monthlyRevenue - stats.monthlyExpenses >= 0 ? (
                      <TrendingUp className="h-6 w-6 text-green-600" />
                    ) : (
                      <TrendingDown className="h-6 w-6 text-red-600" />
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Payment Status Overview */}
      {stats && permissions.hasPermission('payments.read') && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Completed Payments</p>
                  <p className="text-2xl font-bold text-green-600">{stats.completedPayments}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Pending Payments</p>
                  <p className="text-2xl font-bold text-yellow-600">{stats.pendingPayments}</p>
                </div>
                <Clock className="h-8 w-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Overdue Payments</p>
                  <p className="text-2xl font-bold text-red-600">{stats.overduePayments}</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-red-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Tenants */}
        {permissions.hasPermission('tenants.read') && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Recent Tenants
              </CardTitle>
              <CardDescription>
                Latest tenant registrations
              </CardDescription>
            </CardHeader>
            <CardContent>
              {recentTenants.length > 0 ? (
                <div className="space-y-4">
                  {recentTenants.map((tenant) => (
                    <div key={tenant.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center">
                          <Users className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{tenant.firstName} {tenant.lastName}</p>
                          <p className="text-sm text-muted-foreground">{tenant.phoneNumber}</p>
                        </div>
                      </div>
                      <Badge className={tenant.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                        {tenant.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-4">No tenants yet</p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Recent Payments */}
        {permissions.hasPermission('payments.read') && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Recent Payments
              </CardTitle>
              <CardDescription>
                Latest payment transactions
              </CardDescription>
            </CardHeader>
            <CardContent>
              {recentPayments.length > 0 ? (
                <div className="space-y-4">
                  {recentPayments.map((payment) => (
                    <div key={payment.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-green-100 rounded-full flex items-center justify-center">
                          <DollarSign className="h-5 w-5 text-green-600" />
                        </div>
                        <div>
                          <p className="font-medium">{formatCurrency(payment.amount)}</p>
                          <p className="text-sm text-muted-foreground">
                            {payment.tenant.firstName} {payment.tenant.lastName}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge className={
                          payment.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                          payment.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }>
                          {payment.status}
                        </Badge>
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatDate(payment.paymentDate)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-4">No payments yet</p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Recent Expenses */}
        {permissions.hasPermission('expenses.read') && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Receipt className="h-5 w-5" />
                Recent Expenses
              </CardTitle>
              <CardDescription>
                Latest expense records
              </CardDescription>
            </CardHeader>
            <CardContent>
              {recentExpenses.length > 0 ? (
                <div className="space-y-4">
                  {recentExpenses.map((expense) => (
                    <div key={expense.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-red-100 rounded-full flex items-center justify-center">
                          <Receipt className="h-5 w-5 text-red-600" />
                        </div>
                        <div>
                          <p className="font-medium">{expense.description}</p>
                          <p className="text-sm text-muted-foreground">
                            {expense.category} {expense.vendor && `• ${expense.vendor}`}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{formatCurrency(expense.amount)}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatDate(expense.expenseDate)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-4">No expenses yet</p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Recent Assets */}
        {permissions.hasPermission('assets.read') && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Recent Assets
              </CardTitle>
              <CardDescription>
                Latest asset registrations
              </CardDescription>
            </CardHeader>
            <CardContent>
              {recentAssets.length > 0 ? (
                <div className="space-y-4">
                  {recentAssets.map((asset) => (
                    <div key={asset.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-indigo-100 rounded-full flex items-center justify-center">
                          <Package className="h-5 w-5 text-indigo-600" />
                        </div>
                        <div>
                          <p className="font-medium">{asset.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {asset.category} {asset.location && `• ${asset.location}`}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge className={asset.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                          {asset.status}
                        </Badge>
                        {asset.currentValue && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {formatCurrency(asset.currentValue)}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-4">No assets yet</p>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Recent Leases */}
      {permissions.hasPermission('leases.read') && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Recent Leases
            </CardTitle>
            <CardDescription>
              Latest lease agreements
            </CardDescription>
          </CardHeader>
          <CardContent>
            {recentLeases.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {recentLeases.map((lease) => (
                  <div key={lease.id} className="p-4 bg-muted rounded-lg">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <p className="font-medium text-sm">{lease.propertyAddress}</p>
                      </div>
                      <Badge className={lease.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                        {lease.status}
                      </Badge>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">
                        Tenant: {lease.tenant.firstName} {lease.tenant.lastName}
                      </p>
                      <p className="text-sm font-medium">
                        {formatCurrency(lease.monthlyRent)}/month
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Started: {formatDate(lease.startDate)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">No leases yet</p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Frequently used features
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {permissions.hasPermission('tenants.create') && (
              <Button
                variant="outline"
                className="h-20 flex-col gap-2"
                onClick={() => router.push('/tenants')}
              >
                <Users className="h-5 w-5" />
                Add Tenant
              </Button>
            )}
            {permissions.hasPermission('leases.create') && (
              <Button
                variant="outline"
                className="h-20 flex-col gap-2"
                onClick={() => router.push('/leases')}
              >
                <FileText className="h-5 w-5" />
                Create Lease
              </Button>
            )}
            {permissions.hasPermission('payments.create') && (
              <Button
                variant="outline"
                className="h-20 flex-col gap-2"
                onClick={() => router.push('/payments')}
              >
                <CreditCard className="h-5 w-5" />
                Record Payment
              </Button>
            )}
            {permissions.hasPermission('expenses.create') && (
              <Button
                variant="outline"
                className="h-20 flex-col gap-2"
                onClick={() => router.push('/expenses')}
              >
                <Receipt className="h-5 w-5" />
                Add Expense
              </Button>
            )}
            {permissions.hasPermission('assets.create') && (
              <Button
                variant="outline"
                className="h-20 flex-col gap-2"
                onClick={() => router.push('/assets')}
              >
                <Package className="h-5 w-5" />
                Add Asset
              </Button>
            )}
            <Button
              variant="outline"
              className="h-20 flex-col gap-2"
              onClick={() => window.location.reload()}
            >
              <TrendingUp className="h-5 w-5" />
              Refresh Data
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}