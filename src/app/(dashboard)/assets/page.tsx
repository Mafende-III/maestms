'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { usePermissions } from '@/hooks/usePermissions'
import { Package, Plus, Search, Edit, Trash2, Calendar, DollarSign, MapPin, Settings } from 'lucide-react'

interface Asset {
  id: string
  name: string
  description?: string
  category: 'PROPERTY' | 'EQUIPMENT' | 'FURNITURE' | 'VEHICLE' | 'OTHER'
  purchasePrice?: number
  currentValue?: number
  purchaseDate?: string
  condition: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR'
  location?: string
  serialNumber?: string
  warrantyExpiry?: string
  maintenanceDate?: string
  status: 'ACTIVE' | 'SOLD' | 'DAMAGED' | 'DISPOSED'
  notes?: string
  createdAt: string
  updatedAt: string
}

interface AssetFormData {
  name: string
  description: string
  category: 'PROPERTY' | 'EQUIPMENT' | 'FURNITURE' | 'VEHICLE' | 'OTHER'
  purchasePrice: string
  currentValue: string
  purchaseDate: string
  condition: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR'
  location: string
  serialNumber: string
  warrantyExpiry: string
  maintenanceDate: string
  status: 'ACTIVE' | 'SOLD' | 'DAMAGED' | 'DISPOSED'
  notes: string
}

export default function AssetsPage() {
  const permissions = usePermissions('assets') as any
  const { canCreate, canUpdate, canDelete } = permissions
  const [assets, setAssets] = useState<Asset[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('ALL')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [showForm, setShowForm] = useState(false)
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null)
  const [loading, setLoading] = useState(true)
  const [formData, setFormData] = useState<AssetFormData>({
    name: '',
    description: '',
    category: 'OTHER',
    purchasePrice: '',
    currentValue: '',
    purchaseDate: '',
    condition: 'GOOD',
    location: '',
    serialNumber: '',
    warrantyExpiry: '',
    maintenanceDate: '',
    status: 'ACTIVE',
    notes: '',
  })

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      category: 'OTHER',
      purchasePrice: '',
      currentValue: '',
      purchaseDate: '',
      condition: 'GOOD',
      location: '',
      serialNumber: '',
      warrantyExpiry: '',
      maintenanceDate: '',
      status: 'ACTIVE',
      notes: '',
    })
    setEditingAsset(null)
    setShowForm(false)
  }

  const fetchAssets = async () => {
    try {
      const params = new URLSearchParams()
      if (categoryFilter !== 'ALL') params.append('category', categoryFilter)
      if (statusFilter !== 'ALL') params.append('status', statusFilter)

      const response = await fetch(`/api/assets?${params}`)
      if (response.ok) {
        const data = await response.json()
        setAssets(data)
      }
    } catch (error) {
      console.error('Error fetching assets:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAssets()
  }, [categoryFilter, statusFilter])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const payload = {
      name: formData.name,
      description: formData.description || undefined,
      category: formData.category,
      purchasePrice: formData.purchasePrice ? parseFloat(formData.purchasePrice) : undefined,
      currentValue: formData.currentValue ? parseFloat(formData.currentValue) : undefined,
      purchaseDate: formData.purchaseDate ? new Date(formData.purchaseDate).toISOString() : undefined,
      condition: formData.condition,
      location: formData.location || undefined,
      serialNumber: formData.serialNumber || undefined,
      warrantyExpiry: formData.warrantyExpiry ? new Date(formData.warrantyExpiry).toISOString() : undefined,
      maintenanceDate: formData.maintenanceDate ? new Date(formData.maintenanceDate).toISOString() : undefined,
      status: formData.status,
      notes: formData.notes || undefined,
    }

    try {
      const url = editingAsset ? `/api/assets/${editingAsset.id}` : '/api/assets'
      const method = editingAsset ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (response.ok) {
        await fetchAssets()
        resetForm()
      } else {
        const error = await response.json()
        alert(error.error || 'Something went wrong')
      }
    } catch (error) {
      console.error('Error saving asset:', error)
      alert('Failed to save asset')
    }
  }

  const handleEdit = (asset: Asset) => {
    setFormData({
      name: asset.name,
      description: asset.description || '',
      category: asset.category,
      purchasePrice: asset.purchasePrice?.toString() || '',
      currentValue: asset.currentValue?.toString() || '',
      purchaseDate: asset.purchaseDate ? asset.purchaseDate.split('T')[0] : '',
      condition: asset.condition,
      location: asset.location || '',
      serialNumber: asset.serialNumber || '',
      warrantyExpiry: asset.warrantyExpiry ? asset.warrantyExpiry.split('T')[0] : '',
      maintenanceDate: asset.maintenanceDate ? asset.maintenanceDate.split('T')[0] : '',
      status: asset.status,
      notes: asset.notes || '',
    })
    setEditingAsset(asset)
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this asset?')) return

    try {
      const response = await fetch(`/api/assets/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        await fetchAssets()
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to delete asset')
      }
    } catch (error) {
      console.error('Error deleting asset:', error)
      alert('Failed to delete asset')
    }
  }

  const filteredAssets = assets.filter((asset) =>
    asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (asset.description && asset.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (asset.location && asset.location.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (asset.serialNumber && asset.serialNumber.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'PROPERTY': return 'bg-blue-100 text-blue-800'
      case 'EQUIPMENT': return 'bg-orange-100 text-orange-800'
      case 'FURNITURE': return 'bg-green-100 text-green-800'
      case 'VEHICLE': return 'bg-purple-100 text-purple-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-green-100 text-green-800'
      case 'SOLD': return 'bg-blue-100 text-blue-800'
      case 'DAMAGED': return 'bg-red-100 text-red-800'
      case 'DISPOSED': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getConditionColor = (condition: string) => {
    switch (condition) {
      case 'EXCELLENT': return 'bg-green-100 text-green-800'
      case 'GOOD': return 'bg-blue-100 text-blue-800'
      case 'FAIR': return 'bg-yellow-100 text-yellow-800'
      case 'POOR': return 'bg-red-100 text-red-800'
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
          <h1 className="text-3xl font-bold text-foreground">Assets</h1>
          <p className="text-muted-foreground">
            Manage and track property assets
          </p>
        </div>
        {canCreate && (
          <Button onClick={() => setShowForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Asset
          </Button>
        )}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, description, location or serial number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Categories</SelectItem>
                <SelectItem value="PROPERTY">Property</SelectItem>
                <SelectItem value="EQUIPMENT">Equipment</SelectItem>
                <SelectItem value="FURNITURE">Furniture</SelectItem>
                <SelectItem value="VEHICLE">Vehicle</SelectItem>
                <SelectItem value="OTHER">Other</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-32">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Status</SelectItem>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="SOLD">Sold</SelectItem>
                <SelectItem value="DAMAGED">Damaged</SelectItem>
                <SelectItem value="DISPOSED">Disposed</SelectItem>
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
              {editingAsset ? 'Edit Asset' : 'Add New Asset'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Asset Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="category">Category</Label>
                  <Select value={formData.category} onValueChange={(value: 'PROPERTY' | 'EQUIPMENT' | 'FURNITURE' | 'VEHICLE' | 'OTHER') => setFormData({ ...formData, category: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PROPERTY">Property</SelectItem>
                      <SelectItem value="EQUIPMENT">Equipment</SelectItem>
                      <SelectItem value="FURNITURE">Furniture</SelectItem>
                      <SelectItem value="VEHICLE">Vehicle</SelectItem>
                      <SelectItem value="OTHER">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor="description">Description</Label>
                  <Input
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="purchasePrice">Purchase Price (UGX)</Label>
                  <Input
                    id="purchasePrice"
                    type="number"
                    step="0.01"
                    value={formData.purchasePrice}
                    onChange={(e) => setFormData({ ...formData, purchasePrice: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="currentValue">Current Value (UGX)</Label>
                  <Input
                    id="currentValue"
                    type="number"
                    step="0.01"
                    value={formData.currentValue}
                    onChange={(e) => setFormData({ ...formData, currentValue: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="purchaseDate">Purchase Date</Label>
                  <Input
                    id="purchaseDate"
                    type="date"
                    value={formData.purchaseDate}
                    onChange={(e) => setFormData({ ...formData, purchaseDate: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="condition">Condition</Label>
                  <Select value={formData.condition} onValueChange={(value: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR') => setFormData({ ...formData, condition: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="EXCELLENT">Excellent</SelectItem>
                      <SelectItem value="GOOD">Good</SelectItem>
                      <SelectItem value="FAIR">Fair</SelectItem>
                      <SelectItem value="POOR">Poor</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="Property address or storage location"
                  />
                </div>

                <div>
                  <Label htmlFor="serialNumber">Serial Number</Label>
                  <Input
                    id="serialNumber"
                    value={formData.serialNumber}
                    onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="warrantyExpiry">Warranty Expiry</Label>
                  <Input
                    id="warrantyExpiry"
                    type="date"
                    value={formData.warrantyExpiry}
                    onChange={(e) => setFormData({ ...formData, warrantyExpiry: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="maintenanceDate">Last Maintenance</Label>
                  <Input
                    id="maintenanceDate"
                    type="date"
                    value={formData.maintenanceDate}
                    onChange={(e) => setFormData({ ...formData, maintenanceDate: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select value={formData.status} onValueChange={(value: 'ACTIVE' | 'SOLD' | 'DAMAGED' | 'DISPOSED') => setFormData({ ...formData, status: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ACTIVE">Active</SelectItem>
                      <SelectItem value="SOLD">Sold</SelectItem>
                      <SelectItem value="DAMAGED">Damaged</SelectItem>
                      <SelectItem value="DISPOSED">Disposed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Additional notes..."
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <Button type="submit">
                  {editingAsset ? 'Update Asset' : 'Add Asset'}
                </Button>
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Assets List */}
      <div className="grid gap-4">
        {filteredAssets.map((asset) => (
          <Card key={asset.id}>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <h3 className="font-semibold text-lg">{asset.name}</h3>
                    <Badge className={getCategoryColor(asset.category)}>
                      {asset.category}
                    </Badge>
                    <Badge className={getStatusColor(asset.status)}>
                      {asset.status}
                    </Badge>
                    <Badge className={getConditionColor(asset.condition)}>
                      {asset.condition}
                    </Badge>
                  </div>

                  {asset.description && (
                    <p className="text-muted-foreground mb-3">{asset.description}</p>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                    {(asset.purchasePrice || asset.currentValue) && (
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                        <div>
                          {asset.currentValue && (
                            <p className="font-medium">{formatCurrency(asset.currentValue)}</p>
                          )}
                          {asset.purchasePrice && (
                            <p className="text-muted-foreground">
                              Purchased: {formatCurrency(asset.purchasePrice)}
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    {asset.purchaseDate && (
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="font-medium">Purchased</p>
                          <p className="text-muted-foreground">{formatDate(asset.purchaseDate)}</p>
                        </div>
                      </div>
                    )}

                    {asset.location && (
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <p className="text-muted-foreground">{asset.location}</p>
                      </div>
                    )}

                    {asset.serialNumber && (
                      <div className="flex items-center gap-2">
                        <Settings className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="font-medium">Serial</p>
                          <p className="text-muted-foreground">{asset.serialNumber}</p>
                        </div>
                      </div>
                    )}

                    {asset.warrantyExpiry && (
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="font-medium">Warranty expires</p>
                          <p className="text-muted-foreground">{formatDate(asset.warrantyExpiry)}</p>
                        </div>
                      </div>
                    )}

                    {asset.maintenanceDate && (
                      <div className="flex items-center gap-2">
                        <Settings className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="font-medium">Last maintenance</p>
                          <p className="text-muted-foreground">{formatDate(asset.maintenanceDate)}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {asset.notes && (
                    <div className="mt-3 p-3 bg-muted rounded-md">
                      <p className="text-sm text-muted-foreground">{asset.notes}</p>
                    </div>
                  )}
                </div>

                <div className="flex gap-2 ml-4">
                  {canUpdate && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(asset)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  )}
                  {canDelete && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(asset.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {filteredAssets.length === 0 && (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium">No assets found</h3>
                <p className="text-muted-foreground mt-2">
                  {searchTerm ? 'Try adjusting your search terms.' : 'Get started by adding your first asset.'}
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}