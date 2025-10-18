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
import { FileText, Plus, Search, Edit, Trash2, Calendar, MapPin, DollarSign, Phone, Mail } from 'lucide-react'

interface Tenant {
  id: string
  firstName: string
  lastName: string
  phoneNumber: string
  email?: string
}

interface Lease {
  id: string
  tenantId: string
  propertyAddress: string
  monthlyRent: number
  securityDeposit?: number
  startDate: string
  endDate?: string
  status: 'ACTIVE' | 'TERMINATED' | 'EXPIRED'
  terms?: string
  notes?: string
  createdAt: string
  updatedAt: string
  tenant: Tenant
}

interface LeaseFormData {
  tenantId: string
  propertyAddress: string
  monthlyRent: string
  securityDeposit: string
  startDate: string
  endDate: string
  status: 'ACTIVE' | 'TERMINATED' | 'EXPIRED'
  terms: string
  notes: string
}

export default function LeasesPage() {
  const permissions = usePermissions('leases') as any
  const { canCreate, canUpdate, canDelete } = permissions
  const [leases, setLeases] = useState<Lease[]>([])
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingLease, setEditingLease] = useState<Lease | null>(null)
  const [loading, setLoading] = useState(true)
  const [formData, setFormData] = useState<LeaseFormData>({
    tenantId: '',
    propertyAddress: '',
    monthlyRent: '',
    securityDeposit: '',
    startDate: '',
    endDate: '',
    status: 'ACTIVE',
    terms: '',
    notes: '',
  })

  const resetForm = () => {
    setFormData({
      tenantId: '',
      propertyAddress: '',
      monthlyRent: '',
      securityDeposit: '',
      startDate: '',
      endDate: '',
      status: 'ACTIVE',
      terms: '',
      notes: '',
    })
    setEditingLease(null)
    setShowForm(false)
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

  useEffect(() => {
    fetchLeases()
    fetchTenants()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const payload = {
      tenantId: formData.tenantId,
      propertyAddress: formData.propertyAddress,
      monthlyRent: parseFloat(formData.monthlyRent),
      securityDeposit: formData.securityDeposit ? parseFloat(formData.securityDeposit) : undefined,
      startDate: new Date(formData.startDate).toISOString(),
      endDate: formData.endDate ? new Date(formData.endDate).toISOString() : undefined,
      status: formData.status,
      terms: formData.terms || undefined,
      notes: formData.notes || undefined,
    }

    try {
      const url = editingLease ? `/api/leases/${editingLease.id}` : '/api/leases'
      const method = editingLease ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (response.ok) {
        await fetchLeases()
        resetForm()
      } else {
        const error = await response.json()
        alert(error.error || 'Something went wrong')
      }
    } catch (error) {
      console.error('Error saving lease:', error)
      alert('Failed to save lease')
    }
  }

  const handleEdit = (lease: Lease) => {
    setFormData({
      tenantId: lease.tenantId,
      propertyAddress: lease.propertyAddress,
      monthlyRent: lease.monthlyRent.toString(),
      securityDeposit: lease.securityDeposit?.toString() || '',
      startDate: lease.startDate.split('T')[0],
      endDate: lease.endDate ? lease.endDate.split('T')[0] : '',
      status: lease.status,
      terms: lease.terms || '',
      notes: lease.notes || '',
    })
    setEditingLease(lease)
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this lease?')) return

    try {
      const response = await fetch(`/api/leases/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        await fetchLeases()
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to delete lease')
      }
    } catch (error) {
      console.error('Error deleting lease:', error)
      alert('Failed to delete lease')
    }
  }

  const filteredLeases = leases.filter((lease) =>
    lease.propertyAddress.toLowerCase().includes(searchTerm.toLowerCase()) ||
    `${lease.tenant.firstName} ${lease.tenant.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lease.tenant.phoneNumber.includes(searchTerm) ||
    (lease.tenant.email && lease.tenant.email.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-green-100 text-green-800'
      case 'TERMINATED': return 'bg-red-100 text-red-800'
      case 'EXPIRED': return 'bg-yellow-100 text-yellow-800'
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

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Leases</h1>
          <p className="text-muted-foreground">
            Track and manage lease agreements
          </p>
        </div>
        {canCreate && (
          <Button onClick={() => setShowForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Lease
          </Button>
        )}
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by property address, tenant name, phone or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Add/Edit Form */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>
              {editingLease ? 'Edit Lease' : 'Add New Lease'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  <Label htmlFor="propertyAddress">Property Address</Label>
                  <Input
                    id="propertyAddress"
                    value={formData.propertyAddress}
                    onChange={(e) => setFormData({ ...formData, propertyAddress: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="monthlyRent">Monthly Rent (UGX)</Label>
                  <Input
                    id="monthlyRent"
                    type="number"
                    value={formData.monthlyRent}
                    onChange={(e) => setFormData({ ...formData, monthlyRent: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="securityDeposit">Security Deposit (UGX)</Label>
                  <Input
                    id="securityDeposit"
                    type="number"
                    value={formData.securityDeposit}
                    onChange={(e) => setFormData({ ...formData, securityDeposit: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="startDate">Start Date</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="endDate">End Date</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select value={formData.status} onValueChange={(value: 'ACTIVE' | 'TERMINATED' | 'EXPIRED') => setFormData({ ...formData, status: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ACTIVE">Active</SelectItem>
                      <SelectItem value="TERMINATED">Terminated</SelectItem>
                      <SelectItem value="EXPIRED">Expired</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="terms">Lease Terms</Label>
                <Textarea
                  id="terms"
                  value={formData.terms}
                  onChange={(e) => setFormData({ ...formData, terms: e.target.value })}
                  placeholder="Enter lease terms and conditions..."
                />
              </div>

              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Additional notes..."
                />
              </div>

              <div className="flex gap-2">
                <Button type="submit">
                  {editingLease ? 'Update Lease' : 'Create Lease'}
                </Button>
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Leases List */}
      <div className="grid gap-4">
        {filteredLeases.map((lease) => (
          <Card key={lease.id}>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <h3 className="font-semibold text-lg">{lease.propertyAddress}</h3>
                    <Badge className={getStatusColor(lease.status)}>
                      {lease.status}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{lease.tenant.firstName} {lease.tenant.lastName}</p>
                        <p className="text-muted-foreground">{lease.tenant.phoneNumber}</p>
                      </div>
                    </div>

                    {lease.tenant.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <p className="text-muted-foreground">{lease.tenant.email}</p>
                      </div>
                    )}

                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{formatCurrency(lease.monthlyRent)}/month</p>
                        {lease.securityDeposit && (
                          <p className="text-muted-foreground">Deposit: {formatCurrency(lease.securityDeposit)}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{formatDate(lease.startDate)}</p>
                        {lease.endDate && (
                          <p className="text-muted-foreground">to {formatDate(lease.endDate)}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {lease.terms && (
                    <div className="mt-3 p-3 bg-muted rounded-md">
                      <p className="text-sm text-muted-foreground">Terms: {lease.terms}</p>
                    </div>
                  )}

                  {lease.notes && (
                    <div className="mt-2">
                      <p className="text-sm text-muted-foreground">Notes: {lease.notes}</p>
                    </div>
                  )}
                </div>

                <div className="flex gap-2 ml-4">
                  {canUpdate && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(lease)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  )}
                  {canDelete && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(lease.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {filteredLeases.length === 0 && (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium">No leases found</h3>
                <p className="text-muted-foreground mt-2">
                  {searchTerm ? 'Try adjusting your search terms.' : 'Get started by creating your first lease.'}
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}