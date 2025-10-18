'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { toast } from 'sonner'
import { usePermissions } from '@/hooks/usePermissions'
import { Loader2, Plus, Edit, Trash2, TrendingUp, MapPin, User, Calendar, FileText, CreditCard } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

interface Sale {
  id: string
  description: string
  salePrice: number
  saleDate: string
  buyerName?: string | null
  buyerPhone?: string | null
  buyerEmail?: string | null
  category: string
  saleType: string
  paymentMethod: string
  paymentStatus: string
  quantity?: number | null
  unitPrice?: number | null
  location?: string | null
  agentName?: string | null
  commissionRate?: number | null
  commissionAmount?: number | null
  notes?: string | null
  recordedBy: string
  createdAt: string
  updatedAt: string
}

interface FormData {
  description: string
  salePrice: string
  saleDate: string
  buyerName: string
  buyerPhone: string
  buyerEmail: string
  category: string
  saleType: string
  paymentMethod: string
  paymentStatus: string
  quantity: string
  unitPrice: string
  location: string
  agentName: string
  commissionRate: string
  commissionAmount: string
  notes: string
}

const initialFormData: FormData = {
  description: '',
  salePrice: '',
  saleDate: '',
  buyerName: '',
  buyerPhone: '',
  buyerEmail: '',
  category: 'RETAIL',
  saleType: 'SHOP_SALE',
  paymentMethod: 'CASH',
  paymentStatus: 'COMPLETED',
  quantity: '',
  unitPrice: '',
  location: '',
  agentName: '',
  commissionRate: '',
  commissionAmount: '',
  notes: '',
}

const saleTypes = [
  { value: 'DIRECT', label: 'Direct Sale' },
  { value: 'AGENT', label: 'Agent Sale' },
  { value: 'AUCTION', label: 'Auction' },
  { value: 'LEASE_TO_OWN', label: 'Lease to Own' },
]

const paymentMethods = [
  { value: 'CASH', label: 'Cash' },
  { value: 'MPESA', label: 'M-Pesa' },
  { value: 'BANK_TRANSFER', label: 'Bank Transfer' },
  { value: 'CHEQUE', label: 'Cheque' },
  { value: 'INSTALLMENTS', label: 'Installments' },
  { value: 'NOT_SPECIFIED', label: 'Not Specified' },
]

const paymentStatuses = [
  { value: 'PENDING', label: 'Pending' },
  { value: 'PARTIAL', label: 'Partial' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'OVERDUE', label: 'Overdue' },
]

const documentStatuses = [
  { value: 'PENDING', label: 'Pending' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'ISSUES', label: 'Issues' },
]

export default function SalesPage() {
  const [sales, setSales] = useState<Sale[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editingSale, setEditingSale] = useState<Sale | null>(null)
  const [formData, setFormData] = useState<FormData>(initialFormData)
  const [filter, setFilter] = useState({
    saleType: 'ALL',
    paymentStatus: 'ALL',
    documentStatus: 'ALL'
  })

  const { hasPermission } = usePermissions()

  const resetForm = () => {
    setFormData(initialFormData)
    setEditingSale(null)
    setShowForm(false)
  }

  useEffect(() => {
    fetchSales()
  }, [filter])

  const fetchSales = async () => {
    try {
      const params = new URLSearchParams()
      if (filter.saleType !== 'ALL') params.append('saleType', filter.saleType)
      if (filter.paymentStatus !== 'ALL') params.append('paymentStatus', filter.paymentStatus)
      if (filter.documentStatus !== 'ALL') params.append('documentStatus', filter.documentStatus)

      const response = await fetch(`/api/sales?${params}`)
      if (response.ok) {
        const data = await response.json()
        setSales(data)
      } else {
        toast.error('Failed to fetch sales')
      }
    } catch (error) {
      toast.error('Error fetching sales')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      const payload = {
        propertyAddress: formData.propertyAddress,
        salePrice: parseFloat(formData.salePrice),
        saleDate: new Date(formData.saleDate).toISOString(),
        buyerName: formData.buyerName,
        buyerPhone: formData.buyerPhone || undefined,
        buyerEmail: formData.buyerEmail || undefined,
        agentName: formData.agentName || undefined,
        commissionRate: formData.commissionRate ? parseFloat(formData.commissionRate) : undefined,
        commissionAmount: formData.commissionAmount ? parseFloat(formData.commissionAmount) : undefined,
        saleType: formData.saleType,
        paymentMethod: formData.paymentMethod === 'NOT_SPECIFIED' ? undefined : formData.paymentMethod,
        paymentStatus: formData.paymentStatus,
        documentStatus: formData.documentStatus,
        transferDate: formData.transferDate ? new Date(formData.transferDate).toISOString() : undefined,
        notes: formData.notes || undefined,
      }

      const url = editingSale ? `/api/sales/${editingSale.id}` : '/api/sales'
      const method = editingSale ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (response.ok) {
        toast.success(`Sale ${editingSale ? 'updated' : 'created'} successfully`)
        resetForm()
        fetchSales()
      } else {
        const errorData = await response.json()
        toast.error(errorData.error || 'Operation failed')
      }
    } catch (error) {
      toast.error('An error occurred')
    } finally {
      setSubmitting(false)
    }
  }

  const handleEdit = (sale: Sale) => {
    setEditingSale(sale)
    setFormData({
      description: sale.description,
      salePrice: sale.salePrice.toString(),
      saleDate: sale.saleDate.split('T')[0],
      buyerName: sale.buyerName || '',
      buyerPhone: sale.buyerPhone || '',
      buyerEmail: sale.buyerEmail || '',
      category: sale.category,
      saleType: sale.saleType,
      paymentMethod: sale.paymentMethod || 'CASH',
      paymentStatus: sale.paymentStatus,
      quantity: sale.quantity?.toString() || '',
      unitPrice: sale.unitPrice?.toString() || '',
      location: sale.location || '',
      agentName: sale.agentName || '',
      commissionRate: sale.commissionRate?.toString() || '',
      commissionAmount: sale.commissionAmount?.toString() || '',
      notes: sale.notes || '',
    })
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this sale?')) return

    try {
      const response = await fetch(`/api/sales/${id}`, { method: 'DELETE' })
      if (response.ok) {
        toast.success('Sale deleted successfully')
        fetchSales()
      } else {
        toast.error('Failed to delete sale')
      }
    } catch (error) {
      toast.error('Error deleting sale')
    }
  }


  const getStatusBadgeColor = (status: string, type: 'payment' | 'document') => {
    if (type === 'payment') {
      switch (status) {
        case 'COMPLETED': return 'bg-green-100 text-green-800'
        case 'PARTIAL': return 'bg-yellow-100 text-yellow-800'
        case 'OVERDUE': return 'bg-red-100 text-red-800'
        default: return 'bg-gray-100 text-gray-800'
      }
    } else {
      switch (status) {
        case 'COMPLETED': return 'bg-green-100 text-green-800'
        case 'IN_PROGRESS': return 'bg-blue-100 text-blue-800'
        case 'ISSUES': return 'bg-red-100 text-red-800'
        default: return 'bg-gray-100 text-gray-800'
      }
    }
  }

  const totalSales = sales.reduce((sum, sale) => sum + sale.salePrice, 0)
  const totalCommissions = sales.reduce((sum, sale) => sum + (sale.commissionAmount || 0), 0)
  const completedSales = sales.filter(sale => sale.paymentStatus === 'COMPLETED').length
  const pendingSales = sales.filter(sale => sale.paymentStatus === 'PENDING').length

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Sales Management</h1>
          <p className="text-muted-foreground">Track property sales and commissions</p>
        </div>
        {hasPermission('sales.create') && (
          <Button onClick={() => {
            setEditingSale(null)
            setFormData(initialFormData)
            setShowForm(true)
          }}>
            <Plus className="h-4 w-4 mr-2" />
            Add Sale
          </Button>
        )}
      </div>

      {/* Sale Form */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>{editingSale ? 'Edit Sale' : 'Add New Sale'}</CardTitle>
            <CardDescription>
              {editingSale ? 'Update sale information' : 'Record a new property sale'}
            </CardDescription>
          </CardHeader>
          <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="propertyAddress">Property Address *</Label>
                    <Input
                      id="propertyAddress"
                      value={formData.propertyAddress}
                      onChange={(e) => setFormData({ ...formData, propertyAddress: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="salePrice">Sale Price (UGX) *</Label>
                    <Input
                      id="salePrice"
                      type="number"
                      step="0.01"
                      value={formData.salePrice}
                      onChange={(e) => setFormData({ ...formData, salePrice: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="saleDate">Sale Date *</Label>
                    <Input
                      id="saleDate"
                      type="date"
                      value={formData.saleDate}
                      onChange={(e) => setFormData({ ...formData, saleDate: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="buyerName">Buyer Name *</Label>
                    <Input
                      id="buyerName"
                      value={formData.buyerName}
                      onChange={(e) => setFormData({ ...formData, buyerName: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="buyerPhone">Buyer Phone</Label>
                    <Input
                      id="buyerPhone"
                      value={formData.buyerPhone}
                      onChange={(e) => setFormData({ ...formData, buyerPhone: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="buyerEmail">Buyer Email</Label>
                    <Input
                      id="buyerEmail"
                      type="email"
                      value={formData.buyerEmail}
                      onChange={(e) => setFormData({ ...formData, buyerEmail: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="saleType">Sale Type *</Label>
                    <Select value={formData.saleType} onValueChange={(value) => setFormData({ ...formData, saleType: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {saleTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="agentName">Agent Name</Label>
                    <Input
                      id="agentName"
                      value={formData.agentName}
                      onChange={(e) => setFormData({ ...formData, agentName: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="commissionRate">Commission Rate (%)</Label>
                    <Input
                      id="commissionRate"
                      type="number"
                      step="0.01"
                      value={formData.commissionRate}
                      onChange={(e) => setFormData({ ...formData, commissionRate: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="commissionAmount">Commission Amount (UGX)</Label>
                    <Input
                      id="commissionAmount"
                      type="number"
                      step="0.01"
                      value={formData.commissionAmount}
                      onChange={(e) => setFormData({ ...formData, commissionAmount: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="paymentMethod">Payment Method</Label>
                    <Select value={formData.paymentMethod} onValueChange={(value) => setFormData({ ...formData, paymentMethod: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {paymentMethods.map((method) => (
                          <SelectItem key={method.value} value={method.value}>
                            {method.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="transferDate">Transfer Date</Label>
                    <Input
                      id="transferDate"
                      type="date"
                      value={formData.transferDate}
                      onChange={(e) => setFormData({ ...formData, transferDate: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="paymentStatus">Payment Status</Label>
                    <Select value={formData.paymentStatus} onValueChange={(value) => setFormData({ ...formData, paymentStatus: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {paymentStatuses.map((status) => (
                          <SelectItem key={status.value} value={status.value}>
                            {status.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="documentStatus">Document Status</Label>
                    <Select value={formData.documentStatus} onValueChange={(value) => setFormData({ ...formData, documentStatus: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {documentStatuses.map((status) => (
                          <SelectItem key={status.value} value={status.value}>
                            {status.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={3}
                  />
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => resetForm()}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={submitting}>
                    {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    {editingSale ? 'Update Sale' : 'Create Sale'}
                  </Button>
                </div>
              </form>
          </CardContent>
        </Card>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalSales)}</div>
            <p className="text-xs text-muted-foreground">{sales.length} properties sold</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Commissions</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalCommissions)}</div>
            <p className="text-xs text-muted-foreground">From {sales.filter(s => s.commissionAmount).length} sales</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed Sales</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedSales}</div>
            <p className="text-xs text-muted-foreground">Payment completed</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Sales</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingSales}</div>
            <p className="text-xs text-muted-foreground">Awaiting payment</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="saleTypeFilter">Sale Type</Label>
              <Select value={filter.saleType} onValueChange={(value) => setFilter({ ...filter, saleType: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Types</SelectItem>
                  {saleTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="paymentStatusFilter">Payment Status</Label>
              <Select value={filter.paymentStatus} onValueChange={(value) => setFilter({ ...filter, paymentStatus: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Statuses</SelectItem>
                  {paymentStatuses.map((status) => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="documentStatusFilter">Document Status</Label>
              <Select value={filter.documentStatus} onValueChange={(value) => setFilter({ ...filter, documentStatus: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Statuses</SelectItem>
                  {documentStatuses.map((status) => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sales Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Sales Records</CardTitle>
          <CardDescription>
            {sales.length} sale{sales.length !== 1 ? 's' : ''} found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {sales.length === 0 ? (
            <div className="text-center py-8">
              <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-muted-foreground mb-2">No sales found</h3>
              <p className="text-sm text-muted-foreground">
                {hasPermission('sales.create') ? 'Create your first sale record to get started.' : 'No sales records available.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Property</TableHead>
                    <TableHead>Buyer</TableHead>
                    <TableHead>Sale Price</TableHead>
                    <TableHead>Sale Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Payment Status</TableHead>
                    <TableHead>Document Status</TableHead>
                    <TableHead>Commission</TableHead>
                    {(hasPermission('sales.update') || hasPermission('sales.delete')) && (
                      <TableHead className="text-right">Actions</TableHead>
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sales.map((sale) => (
                    <TableRow key={sale.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{sale.propertyAddress}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <div className="font-medium">{sale.buyerName}</div>
                            {sale.buyerPhone && (
                              <div className="text-xs text-muted-foreground">{sale.buyerPhone}</div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono">
                        {formatCurrency(sale.salePrice)}
                      </TableCell>
                      <TableCell>
                        {new Date(sale.saleDate).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {saleTypes.find(t => t.value === sale.saleType)?.label || sale.saleType}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusBadgeColor(sale.paymentStatus, 'payment')}>
                          {paymentStatuses.find(s => s.value === sale.paymentStatus)?.label || sale.paymentStatus}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusBadgeColor(sale.documentStatus, 'document')}>
                          {documentStatuses.find(s => s.value === sale.documentStatus)?.label || sale.documentStatus}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono">
                        {sale.commissionAmount ? formatCurrency(sale.commissionAmount) : '-'}
                      </TableCell>
                      {(hasPermission('sales.update') || hasPermission('sales.delete')) && (
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            {hasPermission('sales.update') && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEdit(sale)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            )}
                            {hasPermission('sales.delete') && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(sale.id)}
                                className="text-destructive hover:text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}