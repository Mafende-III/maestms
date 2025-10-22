'use client'

export const dynamic = 'force-dynamic'

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
  assetId: string
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
  transferDate: string
  documentStatus: string
}

const getInitialFormData = (): FormData => ({
  assetId: 'cmh2iqi9y0000ttaxuvz4ynaj', // Default to Ngoma Business Center
  description: 'Daily Shop Sales', // Auto-populated for SHOP category
  salePrice: '',
  saleDate: new Date().toISOString().split('T')[0], // Today's date
  buyerName: '',
  buyerPhone: '',
  buyerEmail: '',
  category: 'SHOP',
  saleType: 'CASH_SALE',
  paymentMethod: 'CASH',
  paymentStatus: 'COMPLETED',
  quantity: '',
  unitPrice: '',
  location: '',
  agentName: '',
  commissionRate: '',
  commissionAmount: '',
  notes: '',
  transferDate: '',
  documentStatus: 'PENDING',
})

const initialFormData = getInitialFormData()

const saleTypes = [
  { value: 'CASH_SALE', label: 'Cash Sale' },
  { value: 'BULK_SALE', label: 'Bulk Sale' },
  { value: 'SHOP_SALE', label: 'Shop Sale' },
  { value: 'PROPERTY_SALE', label: 'Property Sale' },
  { value: 'SERVICE', label: 'Service' },
]

const paymentMethods = [
  { value: 'CASH', label: 'Cash' },
  { value: 'MPESA', label: 'M-Pesa' },
  { value: 'BANK_TRANSFER', label: 'Bank Transfer' },
  { value: 'CHEQUE', label: 'Cheque' },
  { value: 'CREDIT', label: 'Credit' },
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
  const [assets, setAssets] = useState<Array<{id: string, name: string, location: string}>>([])
  const [filter, setFilter] = useState({
    category: 'ALL',
    dateRange: 'ALL',
    paymentStatus: 'ALL'
  })

  const { hasPermission } = usePermissions()

  const resetForm = () => {
    setFormData(getInitialFormData())
    setEditingSale(null)
    setShowForm(false)
  }

  // Auto-populate description based on category
  const getAutoDescription = (category: string) => {
    const autoDescriptions = {
      'SHOP': 'Daily Shop Sales',
      'SALON': 'Daily Salon Services',
      'CINEMA': 'Daily Cinema Tickets',
      'MOBILE_MONEY': 'Daily Mobile Money Transactions',
      'CHARCOAL': 'Charcoal Sales',
      'LIVESTOCK': 'Livestock Sale',
      'OTHER': ''
    }
    return autoDescriptions[category as keyof typeof autoDescriptions] || ''
  }

  // Smart asset selection based on category
  const getSmartAssetId = (category: string) => {
    // Ngoma Business Center for daily operations
    if (['SHOP', 'SALON', 'CINEMA', 'MOBILE_MONEY', 'CHARCOAL'].includes(category)) {
      return 'cmh2iqi9y0000ttaxuvz4ynaj' // Ngoma Business Center
    }
    // Nakasongola Ranch for livestock and property
    if (['LIVESTOCK', 'PROPERTY'].includes(category)) {
      return 'cmh2iqia00001ttaxe2o8g4f8' // Nakasongola Ranch
    }
    // Default to Ngoma for others
    return 'cmh2iqi9y0000ttaxuvz4ynaj'
  }

  // Handle category change with smart description, date, and asset selection
  const handleCategoryChange = (category: string) => {
    const autoDesc = getAutoDescription(category)
    const today = new Date().toISOString().split('T')[0] // YYYY-MM-DD format

    setFormData(prev => ({
      ...prev,
      category,
      assetId: getSmartAssetId(category), // Auto-select appropriate business center (but still editable)
      // Auto-populate description if it's empty or was previously auto-populated
      description: !prev.description ||
                   prev.description === getAutoDescription(prev.category) ?
                   autoDesc : prev.description,
      // Auto-populate date if it's empty
      saleDate: prev.saleDate || today
    }))
  }

  useEffect(() => {
    fetchSales()
  }, [filter])

  const fetchSales = async () => {
    try {
      const params = new URLSearchParams()
      if (filter.category !== 'ALL') params.append('category', filter.category)
      if (filter.paymentStatus !== 'ALL') params.append('paymentStatus', filter.paymentStatus)
      if (filter.dateRange !== 'ALL') {
        const today = new Date()
        let startDate = new Date()

        switch (filter.dateRange) {
          case 'TODAY':
            startDate = new Date(today.setHours(0, 0, 0, 0))
            break
          case 'WEEK':
            startDate = new Date(today.setDate(today.getDate() - 7))
            break
          case 'MONTH':
            startDate = new Date(today.setMonth(today.getMonth() - 1))
            break
        }
        params.append('date', startDate.toISOString().split('T')[0])
      }

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
        // Required fields
        assetId: formData.assetId,
        description: formData.description || `${formData.saleType} Sale`,
        salePrice: parseFloat(formData.salePrice),
        saleDate: new Date(formData.saleDate).toISOString(),
        category: formData.category,
        saleType: formData.saleType,

        // Optional fields - only include if they have values
        ...(formData.buyerName && { buyerName: formData.buyerName }),
        ...(formData.buyerPhone && { buyerPhone: formData.buyerPhone }),
        ...(formData.buyerEmail && { buyerEmail: formData.buyerEmail }),
        ...(formData.paymentMethod && formData.paymentMethod !== 'NOT_SPECIFIED' && { paymentMethod: formData.paymentMethod }),
        ...(formData.paymentStatus && { paymentStatus: formData.paymentStatus }),
        ...(formData.quantity && { quantity: parseFloat(formData.quantity) }),
        ...(formData.unitPrice && { unitPrice: parseFloat(formData.unitPrice) }),
        ...(formData.location && { location: formData.location }),
        ...(formData.agentName && { agentName: formData.agentName }),
        ...(formData.commissionRate && { commissionRate: parseFloat(formData.commissionRate) }),
        ...(formData.commissionAmount && { commissionAmount: parseFloat(formData.commissionAmount) }),
        ...(formData.notes && { notes: formData.notes }),

        // Default values
        currency: 'UGX'
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

  // Enhanced KPI calculations
  const totalSales = sales.reduce((sum, sale) => sum + sale.salePrice, 0)
  const totalCommissions = sales.reduce((sum, sale) => sum + (sale.commissionAmount || 0), 0)
  const completedSales = sales.filter(sale => sale.paymentStatus === 'COMPLETED').length
  const pendingSales = sales.filter(sale => sale.paymentStatus === 'PENDING').length

  // Business-specific metrics
  const shopSales = sales.filter(s => s.category === 'SHOP').reduce((sum, s) => sum + s.salePrice, 0)
  const charcoalSales = sales.filter(s => s.category === 'CHARCOAL').reduce((sum, s) => sum + s.salePrice, 0)
  const salonSales = sales.filter(s => s.category === 'SALON').reduce((sum, s) => sum + s.salePrice, 0)
  const cinemaSales = sales.filter(s => s.category === 'CINEMA').reduce((sum, s) => sum + s.salePrice, 0)
  const mobileMoneyRev = sales.filter(s => s.category === 'MOBILE_MONEY').reduce((sum, s) => sum + s.salePrice, 0)

  // Top performing category
  const categoryTotals = [
    { name: 'Shop', value: shopSales, icon: '🛒' },
    { name: 'Charcoal', value: charcoalSales, icon: '🔥' },
    { name: 'Salon', value: salonSales, icon: '💇' },
    { name: 'Cinema', value: cinemaSales, icon: '🎬' },
    { name: 'Mobile Money', value: mobileMoneyRev, icon: '📱' }
  ].sort((a, b) => b.value - a.value)

  const topCategory = categoryTotals[0]
  const avgDailySales = totalSales / Math.max(1, new Set(sales.map(s => s.saleDate.split('T')[0])).size)

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
          <p className="text-muted-foreground">Sales Recording</p>
        </div>
        {hasPermission('sales.create') && (
          <Button onClick={() => {
            setEditingSale(null)
            setFormData(getInitialFormData())
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
              {editingSale ? 'Update sale information' :
               formData.category === 'CHARCOAL' ? 'Record individual charcoal sale' :
               ['SHOP', 'SALON', 'CINEMA', 'MOBILE_MONEY'].includes(formData.category) ? 'Record daily business summary' :
               formData.category === 'PROPERTY' ? 'Record property sale' :
               'Record new sale transaction'}
            </CardDescription>
          </CardHeader>
          <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Category Selection - Primary Driver */}
                <div className="p-4 bg-slate-50 rounded-lg border-2 border-blue-200">
                  <Label htmlFor="category" className="text-base font-semibold">Category *</Label>
                  <Select value={formData.category} onValueChange={handleCategoryChange}>
                    <SelectTrigger className="mt-2 bg-white border-2 border-slate-300">
                      <SelectValue placeholder="Select sales category" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-2 border-slate-300 shadow-lg">
                      <SelectItem value="SHOP">🛒 Shop Sales (Daily Aggregate)</SelectItem>
                      <SelectItem value="SALON">💇 Salon Services (Daily Aggregate)</SelectItem>
                      <SelectItem value="CINEMA">🎬 Cinema Tickets (Daily Aggregate)</SelectItem>
                      <SelectItem value="MOBILE_MONEY">📱 Mobile Money (Daily Aggregate)</SelectItem>
                      <SelectItem value="CHARCOAL">🔥 Charcoal (Individual Sales)</SelectItem>
                      <SelectItem value="PROPERTY">🏠 Property/Land Sales</SelectItem>
                      <SelectItem value="LIVESTOCK">🐄 Livestock Sales</SelectItem>
                      <SelectItem value="OTHER">📦 Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Asset Selection - Auto-selected but editable */}
                <div>
                  <Label htmlFor="assetId" className="text-sm font-medium">
                    Business Center
                    <span className="text-xs text-green-600 ml-2">(Auto-selected, but editable)</span>
                  </Label>
                  <Select value={formData.assetId} onValueChange={(value) => setFormData({...formData, assetId: value})}>
                    <SelectTrigger className="mt-1 bg-white border-2 border-slate-300">
                      <SelectValue placeholder="Select business center" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-2 border-slate-300 shadow-lg">
                      <SelectItem value="cmh2iqi9y0000ttaxuvz4ynaj">🏢 Ngoma Business Center</SelectItem>
                      <SelectItem value="cmh2iqia00001ttaxe2o8g4f8">🐄 Nakasongola Ranch</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Smart Tabs for Land Assets - Only show for PROPERTY category */}
                {formData.category === 'PROPERTY' && formData.assetId === 'cmh2iqia00001ttaxe2o8g4f8' && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-slate-700 border-b pb-2">Land Plot Details</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="plotNumber">Plot Number</Label>
                        <Input
                          id="plotNumber"
                          value={formData.location || ''}
                          onChange={(e) => setFormData({ ...formData, location: `Plot ${e.target.value}` })}
                          placeholder="e.g., A1, B2, C3"
                        />
                      </div>
                      <div>
                        <Label htmlFor="plotSize">Plot Size (Acres)</Label>
                        <Input
                          id="plotSize"
                          value={formData.quantity || ''}
                          onChange={(e) => setFormData({ ...formData, quantity: e.target.value, unitPrice: formData.salePrice ? (parseFloat(formData.salePrice) / parseFloat(e.target.value || '1')).toString() : '' })}
                          placeholder="e.g., 2.5"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Basic Sale Information - Always Shown */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="description" className="flex items-center gap-2">
                      Description *
                      {['SHOP', 'SALON', 'CINEMA', 'MOBILE_MONEY', 'CHARCOAL', 'LIVESTOCK'].includes(formData.category) && (
                        <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">✨ Auto-filled</span>
                      )}
                    </Label>
                    <Input
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder={
                        formData.category === 'CHARCOAL' ? 'Charcoal bags' :
                        formData.category === 'PROPERTY' ? 'Property address (editable)' :
                        ['SHOP', 'SALON', 'CINEMA', 'MOBILE_MONEY'].includes(formData.category) ? 'Auto-filled, but editable' :
                        'Item or service description'
                      }
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="saleDate" className="flex items-center gap-2">
                      Sale Date *
                      <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded">📅 Today</span>
                    </Label>
                    <Input
                      id="saleDate"
                      type="date"
                      value={formData.saleDate}
                      onChange={(e) => setFormData({ ...formData, saleDate: e.target.value })}
                      required
                    />
                  </div>
                </div>

                {/* Price Information - Always Shown */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="salePrice">
                      {['SHOP', 'SALON', 'CINEMA', 'MOBILE_MONEY'].includes(formData.category)
                        ? 'Total Daily Sales (UGX) *'
                        : 'Sale Price (UGX) *'}
                    </Label>
                    <Input
                      id="salePrice"
                      type="number"
                      step="0.01"
                      value={formData.salePrice}
                      onChange={(e) => setFormData({ ...formData, salePrice: e.target.value })}
                      placeholder={['SHOP', 'SALON', 'CINEMA', 'MOBILE_MONEY'].includes(formData.category) ? 'Total daily revenue' : 'Sale amount'}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="location">Location</Label>
                    <Input
                      id="location"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      placeholder={
                        ['SHOP', 'SALON', 'CINEMA', 'MOBILE_MONEY'].includes(formData.category) ? 'Business center location' :
                        formData.category === 'PROPERTY' ? 'Property address' :
                        'Sale location'
                      }
                    />
                  </div>
                </div>

                {/* Quantity & Unit Price - Only for CHARCOAL and LIVESTOCK */}
                {['CHARCOAL', 'LIVESTOCK'].includes(formData.category) && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="quantity">
                        Quantity * {formData.category === 'CHARCOAL' ? '(bags)' : '(animals)'}
                      </Label>
                      <Input
                        id="quantity"
                        type="number"
                        step="0.1"
                        value={formData.quantity}
                        onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                        placeholder={formData.category === 'CHARCOAL' ? 'Number of bags' : 'Number of animals'}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="unitPrice">
                        Unit Price (UGX) * {formData.category === 'CHARCOAL' ? 'per bag' : 'per animal'}
                      </Label>
                      <Input
                        id="unitPrice"
                        type="number"
                        step="0.01"
                        value={formData.unitPrice}
                        onChange={(e) => setFormData({ ...formData, unitPrice: e.target.value })}
                        placeholder={formData.category === 'CHARCOAL' ? 'Price per bag' : 'Price per animal'}
                        required
                      />
                    </div>
                  </div>
                )}

                {/* Buyer Information - Only for Individual Sales (CHARCOAL, PROPERTY, LIVESTOCK) */}
                {['CHARCOAL', 'PROPERTY', 'LIVESTOCK'].includes(formData.category) && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-slate-700 border-b pb-2">Buyer Information</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="buyerName">
                          Buyer Name {['CHARCOAL', 'PROPERTY', 'LIVESTOCK'].includes(formData.category) ? '*' : ''}
                        </Label>
                        <Input
                          id="buyerName"
                          value={formData.buyerName}
                          onChange={(e) => setFormData({ ...formData, buyerName: e.target.value })}
                          placeholder="Customer name"
                          required={['CHARCOAL', 'PROPERTY', 'LIVESTOCK'].includes(formData.category)}
                        />
                      </div>
                      <div>
                        <Label htmlFor="buyerPhone">Buyer Phone</Label>
                        <Input
                          id="buyerPhone"
                          value={formData.buyerPhone}
                          onChange={(e) => setFormData({ ...formData, buyerPhone: e.target.value })}
                          placeholder="Contact number"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Payment Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-slate-700 border-b pb-2">Payment Details</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="paymentMethod">Payment Method *</Label>
                      <Select value={formData.paymentMethod} onValueChange={(value) => setFormData({ ...formData, paymentMethod: value })}>
                        <SelectTrigger className="bg-white border-2 border-slate-300">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-white border-2 border-slate-300 shadow-lg">
                          <SelectItem value="CASH">💵 Cash</SelectItem>
                          <SelectItem value="MPESA">📱 M-Pesa</SelectItem>
                          <SelectItem value="BANK_TRANSFER">🏦 Bank Transfer</SelectItem>
                          {formData.category === 'CHARCOAL' && <SelectItem value="CREDIT">📝 Credit</SelectItem>}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="paymentStatus">Payment Status *</Label>
                      <Select value={formData.paymentStatus} onValueChange={(value) => setFormData({ ...formData, paymentStatus: value })}>
                        <SelectTrigger className="bg-white border-2 border-slate-300">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-white border-2 border-slate-300 shadow-lg">
                          <SelectItem value="COMPLETED">✅ Completed</SelectItem>
                          <SelectItem value="PENDING">⏳ Pending</SelectItem>
                          {formData.paymentMethod === 'CREDIT' && <SelectItem value="OVERDUE">⚠️ Overdue</SelectItem>}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* Commission Information - Only for PROPERTY and LIVESTOCK */}
                {['PROPERTY', 'LIVESTOCK'].includes(formData.category) && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-slate-700 border-b pb-2">Agent & Commission</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="agentName">Agent Name</Label>
                        <Input
                          id="agentName"
                          value={formData.agentName}
                          onChange={(e) => setFormData({ ...formData, agentName: e.target.value })}
                          placeholder="Sales agent or broker"
                        />
                      </div>
                      <div>
                        <Label htmlFor="commissionRate">Commission Rate (%)</Label>
                        <Input
                          id="commissionRate"
                          type="number"
                          step="0.01"
                          value={formData.commissionRate}
                          onChange={(e) => setFormData({ ...formData, commissionRate: e.target.value })}
                          placeholder="Commission percentage"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Sale Type - Conditional based on category */}
                <div>
                  <Label htmlFor="saleType">Sale Type *</Label>
                  <Select value={formData.saleType} onValueChange={(value) => setFormData({ ...formData, saleType: value })}>
                    <SelectTrigger className="bg-white border-2 border-slate-300">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-2 border-slate-300 shadow-lg">
                      {['SHOP', 'SALON', 'CINEMA', 'MOBILE_MONEY'].includes(formData.category) && (
                        <SelectItem value="SHOP_SALE">🏪 Daily Business Sale</SelectItem>
                      )}
                      {formData.category === 'CHARCOAL' && (
                        <>
                          <SelectItem value="BULK_SALE">📦 Bulk Sale</SelectItem>
                          <SelectItem value="CASH_SALE">💵 Cash Sale</SelectItem>
                        </>
                      )}
                      {['PROPERTY', 'LIVESTOCK'].includes(formData.category) && (
                        <SelectItem value="PROPERTY_SALE">🏠 Property Sale</SelectItem>
                      )}
                      <SelectItem value="SERVICE">🔧 Service</SelectItem>
                    </SelectContent>
                  </Select>
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

      {/* Business KPI Cards - Responsive Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-green-700">{formatCurrency(totalSales)}</div>
            <p className="text-xs text-muted-foreground">{sales.length} transactions • Avg: {formatCurrency(avgDailySales)}/day</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Top Category</CardTitle>
            <span className="text-lg">{topCategory?.icon}</span>
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-blue-700">{topCategory?.name}</div>
            <p className="text-xs text-muted-foreground">{formatCurrency(topCategory?.value || 0)} • {Math.round(((topCategory?.value || 0) / totalSales) * 100)}% of total</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Shop Sales</CardTitle>
            <span className="text-lg">🛒</span>
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-orange-700">{formatCurrency(shopSales)}</div>
            <p className="text-xs text-muted-foreground">{sales.filter(s => s.category === 'SHOP').length} daily reports</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Charcoal Sales</CardTitle>
            <span className="text-lg">🔥</span>
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-purple-700">{formatCurrency(charcoalSales)}</div>
            <p className="text-xs text-muted-foreground">{sales.filter(s => s.category === 'CHARCOAL' && s.salePrice > 0).length} actual sales</p>
          </CardContent>
        </Card>
      </div>

      {/* Business Breakdown - Mobile Responsive */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Business Unit Performance</CardTitle>
          <p className="text-sm text-muted-foreground">Revenue breakdown by business category</p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
            {categoryTotals.map((cat, index) => (
              <div key={cat.name} className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border">
                <div className="flex items-center space-x-2">
                  <span className="text-lg">{cat.icon}</span>
                  <div>
                    <p className="text-sm font-medium">{cat.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {sales.filter(s => s.category === cat.name.toUpperCase().replace(' ', '_')).length} records
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold">{formatCurrency(cat.value)}</p>
                  <p className="text-xs text-muted-foreground">
                    {Math.round((cat.value / totalSales) * 100)}%
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Business-Relevant Filters - Responsive */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filter Sales Data</CardTitle>
          <p className="text-sm text-muted-foreground">Filter by business category, time period, and payment status</p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            <div className="space-y-2">
              <Label htmlFor="categoryFilter" className="text-sm font-medium">Business Category</Label>
              <Select value={filter.category} onValueChange={(value) => setFilter({ ...filter, category: value })}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">🏢 All Categories</SelectItem>
                  <SelectItem value="SHOP">🛒 Shop Sales</SelectItem>
                  <SelectItem value="CHARCOAL">🔥 Charcoal Sales</SelectItem>
                  <SelectItem value="SALON">💇 Salon Services</SelectItem>
                  <SelectItem value="CINEMA">🎬 Cinema Tickets</SelectItem>
                  <SelectItem value="MOBILE_MONEY">📱 Mobile Money</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="dateRangeFilter" className="text-sm font-medium">Time Period</Label>
              <Select value={filter.dateRange} onValueChange={(value) => setFilter({ ...filter, dateRange: value })}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="All Time" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">📅 All Time</SelectItem>
                  <SelectItem value="TODAY">📆 Today</SelectItem>
                  <SelectItem value="WEEK">📊 Last 7 Days</SelectItem>
                  <SelectItem value="MONTH">📈 Last 30 Days</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="paymentStatusFilter" className="text-sm font-medium">Payment Status</Label>
              <Select value={filter.paymentStatus} onValueChange={(value) => setFilter({ ...filter, paymentStatus: value })}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="All Payments" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">💳 All Payments</SelectItem>
                  <SelectItem value="COMPLETED">✅ Completed</SelectItem>
                  <SelectItem value="PENDING">⏳ Pending</SelectItem>
                  <SelectItem value="OVERDUE">⚠️ Overdue</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Quick Filter Buttons - Mobile Friendly */}
          <div className="mt-4 pt-4 border-t">
            <p className="text-xs text-muted-foreground mb-2">Quick Filters:</p>
            <div className="flex flex-wrap gap-2">
              <Button
                variant={filter.category === 'SHOP' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter({ ...filter, category: 'SHOP' })}
                className="text-xs"
              >
                🛒 Shop Only
              </Button>
              <Button
                variant={filter.category === 'CHARCOAL' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter({ ...filter, category: 'CHARCOAL' })}
                className="text-xs"
              >
                🔥 Charcoal Only
              </Button>
              <Button
                variant={filter.dateRange === 'WEEK' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter({ ...filter, dateRange: 'WEEK' })}
                className="text-xs"
              >
                📊 This Week
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setFilter({ category: 'ALL', dateRange: 'ALL', paymentStatus: 'ALL' })}
                className="text-xs"
              >
                🔄 Reset All
              </Button>
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
            <>
              {/* Desktop Table View - Hidden on Mobile */}
              <div className="hidden lg:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[200px]">Description</TableHead>
                      <TableHead className="min-w-[120px]">Sale Price</TableHead>
                      <TableHead className="min-w-[100px]">Date</TableHead>
                      <TableHead className="min-w-[100px]">Category</TableHead>
                      <TableHead className="min-w-[100px]">Payment</TableHead>
                      <TableHead className="min-w-[80px]">Qty</TableHead>
                      {(hasPermission('sales.update') || hasPermission('sales.delete')) && (
                        <TableHead className="text-right min-w-[80px]">Actions</TableHead>
                      )}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sales.map((sale) => (
                      <TableRow key={sale.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="text-lg">
                              {sale.category === 'SHOP' ? '🛒' :
                               sale.category === 'CHARCOAL' ? '🔥' :
                               sale.category === 'SALON' ? '💇' :
                               sale.category === 'CINEMA' ? '🎬' :
                               sale.category === 'MOBILE_MONEY' ? '📱' : '📦'}
                            </span>
                            <div>
                              <span className="font-medium text-sm">{sale.description}</span>
                              {sale.location && (
                                <p className="text-xs text-muted-foreground">{sale.location}</p>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="font-mono font-semibold">
                          {formatCurrency(sale.salePrice)}
                        </TableCell>
                        <TableCell className="text-sm">
                          {new Date(sale.saleDate).toLocaleDateString('en-GB', {
                            day: '2-digit',
                            month: 'short'
                          })}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="text-xs">
                            {sale.category}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={`text-xs ${getStatusBadgeColor(sale.paymentStatus, 'payment')}`}>
                            {sale.paymentStatus === 'COMPLETED' ? '✅' : '⏳'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">
                          {sale.quantity ? `${sale.quantity}x` : '1x'}
                        </TableCell>
                        {(hasPermission('sales.update') || hasPermission('sales.delete')) && (
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              {hasPermission('sales.update') && (
                                <Button variant="ghost" size="sm" onClick={() => handleEdit(sale)}>
                                  <Edit className="h-3 w-3" />
                                </Button>
                              )}
                              {hasPermission('sales.delete') && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDelete(sale.id)}
                                  className="text-destructive hover:text-destructive"
                                >
                                  <Trash2 className="h-3 w-3" />
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

              {/* Mobile Card View - Shown on Mobile */}
              <div className="lg:hidden space-y-3">
                {sales.map((sale) => (
                  <Card key={sale.id} className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3">
                        <span className="text-2xl">
                          {sale.category === 'SHOP' ? '🛒' :
                           sale.category === 'CHARCOAL' ? '🔥' :
                           sale.category === 'SALON' ? '💇' :
                           sale.category === 'CINEMA' ? '🎬' :
                           sale.category === 'MOBILE_MONEY' ? '📱' : '📦'}
                        </span>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-sm truncate">{sale.description}</h3>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="secondary" className="text-xs">
                              {sale.category}
                            </Badge>
                            <Badge className={`text-xs ${getStatusBadgeColor(sale.paymentStatus, 'payment')}`}>
                              {sale.paymentStatus}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(sale.saleDate).toLocaleDateString()}
                            {sale.quantity && ` • Qty: ${sale.quantity}`}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-lg text-green-700">{formatCurrency(sale.salePrice)}</p>
                        {(hasPermission('sales.update') || hasPermission('sales.delete')) && (
                          <div className="flex gap-1 mt-2">
                            {hasPermission('sales.update') && (
                              <Button variant="outline" size="sm" onClick={() => handleEdit(sale)}>
                                <Edit className="h-3 w-3" />
                              </Button>
                            )}
                            {hasPermission('sales.delete') && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDelete(sale.id)}
                                className="text-destructive"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}