'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { usePermissions } from '@/hooks/usePermissions'
import { CreditCard, Plus, Search, Edit, Trash2, Calendar, DollarSign, Phone, Mail, MapPin, Receipt } from 'lucide-react'

interface Tenant {
  id: string
  firstName: string
  lastName: string
  phoneNumber: string
  email?: string
}

interface Lease {
  id: string
  propertyAddress: string
  monthlyRent: number
  status: string
}

interface Payment {
  id: string
  leaseId: string
  tenantId: string
  amount: number
  paymentDate: string
  dueDate?: string
  paymentMethod: 'CASH' | 'MPESA' | 'BANK_TRANSFER' | 'CHEQUE'
  status: 'PENDING' | 'COMPLETED' | 'OVERDUE' | 'CANCELLED'
  referenceNumber?: string
  notes?: string
  recordedBy: string
  createdAt: string
  updatedAt: string
  tenant: Tenant
  lease: Lease
}

interface PaymentFormData {
  leaseId: string
  tenantId: string
  amount: string
  paymentDate: string
  dueDate: string
  paymentMethod: 'CASH' | 'MPESA' | 'BANK_TRANSFER' | 'CHEQUE'
  status: 'PENDING' | 'COMPLETED' | 'OVERDUE' | 'CANCELLED'
  referenceNumber: string
  notes: string
}

export default function PaymentsPage() {
  const permissions = usePermissions('payments') as any
  const { canCreate, canUpdate, canDelete } = permissions
  const [payments, setPayments] = useState<Payment[]>([])
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [leases, setLeases] = useState<Lease[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('ALL')
  const [showForm, setShowForm] = useState(false)
  const [editingPayment, setEditingPayment] = useState<Payment | null>(null)
  const [loading, setLoading] = useState(true)
  const [formData, setFormData] = useState<PaymentFormData>({
    leaseId: '',
    tenantId: '',
    amount: '',
    paymentDate: '',
    dueDate: '',
    paymentMethod: 'CASH',
    status: 'COMPLETED',
    referenceNumber: '',
    notes: '',
  })

  const resetForm = () => {
    setFormData({
      leaseId: '',
      tenantId: '',
      amount: '',
      paymentDate: '',
      dueDate: '',
      paymentMethod: 'CASH',
      status: 'COMPLETED',
      referenceNumber: '',
      notes: '',
    })
    setEditingPayment(null)
    setShowForm(false)
  }

  const fetchPayments = async () => {
    try {
      const url = new URL('/api/payments', window.location.origin)
      if (statusFilter && statusFilter !== 'ALL') url.searchParams.set('status', statusFilter)

      const response = await fetch(url.toString())
      if (response.ok) {
        const data = await response.json()
        setPayments(data)
      }
    } catch (error) {
      console.error('Error fetching payments:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchTenants = async () => {
    try {
      const response = await fetch('/api/tenants')
      if (response.ok) {
        const data = await response.json()
        setTenants(data)
      }
    } catch (error) {
      console.error('Error fetching tenants:', error)
    }
  }

  const fetchLeases = async () => {
    try {
      const response = await fetch('/api/leases')
      if (response.ok) {
        const data = await response.json()
        setLeases(data)
      }
    } catch (error) {
      console.error('Error fetching leases:', error)
    }
  }

  useEffect(() => {
    fetchPayments()
    fetchTenants()
    fetchLeases()
  }, [statusFilter])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const payload = {
      leaseId: formData.leaseId,
      tenantId: formData.tenantId,
      amount: parseFloat(formData.amount),
      paymentDate: new Date(formData.paymentDate).toISOString(),
      dueDate: formData.dueDate ? new Date(formData.dueDate).toISOString() : undefined,
      paymentMethod: formData.paymentMethod,
      status: formData.status,
      referenceNumber: formData.referenceNumber || undefined,
      notes: formData.notes || undefined,
    }

    try {
      const url = editingPayment ? `/api/payments/${editingPayment.id}` : '/api/payments'
      const method = editingPayment ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (response.ok) {
        await fetchPayments()
        resetForm()
      } else {
        const error = await response.json()
        alert(error.error || 'Something went wrong')
      }
    } catch (error) {
      console.error('Error saving payment:', error)
      alert('Failed to save payment')
    }
  }

  const handleEdit = (payment: Payment) => {
    setFormData({
      leaseId: payment.leaseId,
      tenantId: payment.tenantId,
      amount: payment.amount.toString(),
      paymentDate: payment.paymentDate.split('T')[0],
      dueDate: payment.dueDate ? payment.dueDate.split('T')[0] : '',
      paymentMethod: payment.paymentMethod,
      status: payment.status,
      referenceNumber: payment.referenceNumber || '',
      notes: payment.notes || '',
    })
    setEditingPayment(payment)
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this payment?')) return

    try {
      const response = await fetch(`/api/payments/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        await fetchPayments()
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to delete payment')
      }
    } catch (error) {
      console.error('Error deleting payment:', error)
      alert('Failed to delete payment')
    }
  }

  const filteredPayments = payments.filter((payment) => {
    const searchLower = searchTerm.toLowerCase()
    return (
      payment.tenant.firstName.toLowerCase().includes(searchLower) ||
      payment.tenant.lastName.toLowerCase().includes(searchLower) ||
      payment.tenant.phoneNumber.includes(searchTerm) ||
      payment.lease.propertyAddress.toLowerCase().includes(searchLower) ||
      payment.referenceNumber?.toLowerCase().includes(searchLower) ||
      (payment.tenant.email && payment.tenant.email.toLowerCase().includes(searchLower))
    )
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'bg-green-100 text-green-800'
      case 'PENDING': return 'bg-yellow-100 text-yellow-800'
      case 'OVERDUE': return 'bg-red-100 text-red-800'
      case 'CANCELLED': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getMethodColor = (method: string) => {
    switch (method) {
      case 'MPESA': return 'bg-green-100 text-green-800'
      case 'BANK_TRANSFER': return 'bg-blue-100 text-blue-800'
      case 'CASH': return 'bg-gray-100 text-gray-800'
      case 'CHEQUE': return 'bg-purple-100 text-purple-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-UG', {
      style: 'currency',
      currency: 'UGX'
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-UG')
  }

  // Auto-populate tenant when lease is selected
  const handleLeaseChange = (leaseId: string) => {
    setFormData({ ...formData, leaseId })
    const selectedLease = leases.find(l => l.id === leaseId)
    if (selectedLease) {
      const leaseTenant = tenants.find(t => t.id === selectedLease.id) // This would need to be fixed with proper tenant lookup
      // For now, we'll let the user select tenant manually
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Payments</h1>
          <p className="text-muted-foreground">
            Record and track payment transactions
          </p>
        </div>
        {canCreate && (
          <Button onClick={() => setShowForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Record Payment
          </Button>
        )}
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by tenant name, phone, property, or reference..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Statuses</SelectItem>
                <SelectItem value="COMPLETED">Completed</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="OVERDUE">Overdue</SelectItem>
                <SelectItem value="CANCELLED">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Add/Edit Form */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>
              {editingPayment ? 'Edit Payment' : 'Record New Payment'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="leaseId">Lease / Property</Label>
                  <Select value={formData.leaseId} onValueChange={handleLeaseChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select lease" />
                    </SelectTrigger>
                    <SelectContent>
                      {leases.map((lease) => (
                        <SelectItem key={lease.id} value={lease.id}>
                          {lease.propertyAddress} - {formatCurrency(lease.monthlyRent)}/month
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="tenantId">Tenant</Label>
                  <Select value={formData.tenantId} onValueChange={(value) => setFormData({ ...formData, tenantId: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select tenant" />
                    </SelectTrigger>
                    <SelectContent>
                      {tenants.map((tenant) => (
                        <SelectItem key={tenant.id} value={tenant.id}>
                          {tenant.firstName} {tenant.lastName} - {tenant.phoneNumber}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="amount">Amount (UGX)</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="paymentMethod">Payment Method</Label>
                  <Select value={formData.paymentMethod} onValueChange={(value: 'CASH' | 'MPESA' | 'BANK_TRANSFER' | 'CHEQUE') => setFormData({ ...formData, paymentMethod: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CASH">Cash</SelectItem>
                      <SelectItem value="MPESA">M-Pesa</SelectItem>
                      <SelectItem value="BANK_TRANSFER">Bank Transfer</SelectItem>
                      <SelectItem value="CHEQUE">Cheque</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="paymentDate">Payment Date</Label>
                  <Input
                    id="paymentDate"
                    type="date"
                    value={formData.paymentDate}
                    onChange={(e) => setFormData({ ...formData, paymentDate: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="dueDate">Due Date (Optional)</Label>
                  <Input
                    id="dueDate"
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select value={formData.status} onValueChange={(value: 'PENDING' | 'COMPLETED' | 'OVERDUE' | 'CANCELLED') => setFormData({ ...formData, status: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="COMPLETED">Completed</SelectItem>
                      <SelectItem value="PENDING">Pending</SelectItem>
                      <SelectItem value="OVERDUE">Overdue</SelectItem>
                      <SelectItem value="CANCELLED">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="referenceNumber">Reference Number</Label>
                  <Input
                    id="referenceNumber"
                    value={formData.referenceNumber}
                    onChange={(e) => setFormData({ ...formData, referenceNumber: e.target.value })}
                    placeholder="M-Pesa code, cheque number, etc."
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Additional notes about this payment..."
                />
              </div>

              <div className="flex gap-2">
                <Button type="submit">
                  {editingPayment ? 'Update Payment' : 'Record Payment'}
                </Button>
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Payments List */}
      <div className="grid gap-4">
        {filteredPayments.map((payment) => (
          <Card key={payment.id}>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="flex items-center gap-2">
                      <Receipt className="h-4 w-4 text-muted-foreground" />
                      <span className="font-semibold">{formatCurrency(payment.amount)}</span>
                    </div>
                    <Badge className={getStatusColor(payment.status)}>
                      {payment.status}
                    </Badge>
                    <Badge className={getMethodColor(payment.paymentMethod)}>
                      {payment.paymentMethod}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{payment.tenant.firstName} {payment.tenant.lastName}</p>
                        <p className="text-muted-foreground">{payment.tenant.phoneNumber}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{payment.lease.propertyAddress}</p>
                        <p className="text-muted-foreground">Rent: {formatCurrency(payment.lease.monthlyRent)}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="font-medium">Paid: {formatDate(payment.paymentDate)}</p>
                        {payment.dueDate && (
                          <p className="text-muted-foreground">Due: {formatDate(payment.dueDate)}</p>
                        )}
                      </div>
                    </div>

                    {payment.referenceNumber && (
                      <div className="flex items-center gap-2">
                        <Receipt className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="font-medium">Ref: {payment.referenceNumber}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {payment.notes && (
                    <div className="mt-3 p-3 bg-muted rounded-md">
                      <p className="text-sm text-muted-foreground">Notes: {payment.notes}</p>
                    </div>
                  )}
                </div>

                <div className="flex gap-2 ml-4">
                  {canUpdate && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(payment)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  )}
                  {canDelete && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(payment.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {filteredPayments.length === 0 && (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <CreditCard className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium">No payments found</h3>
                <p className="text-muted-foreground mt-2">
                  {searchTerm || (statusFilter && statusFilter !== 'ALL') ? 'Try adjusting your search terms or filters.' : 'Get started by recording your first payment.'}
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}