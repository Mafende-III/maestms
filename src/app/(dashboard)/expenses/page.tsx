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
import { Receipt, Plus, Search, Edit, Trash2, Calendar, DollarSign, Building } from 'lucide-react'

interface Expense {
  id: string
  description: string
  amount: number
  category: 'SHOP_EXPENSES' | 'HOUSEHOLD_EXPENSES' | 'PROPERTY_MAINTENANCE' | 'UTILITIES' | 'TAXES' | 'INSURANCE' | 'LEGAL' | 'MARKETING' | 'REPAIRS' | 'SECURITY' | 'CLEANING' | 'SUPPLIES' | 'TRANSPORT' | 'STAFF_WAGES' | 'OTHER'
  expenseDate: string
  paymentMethod?: string
  receiptNumber?: string
  vendor?: string
  propertyAddress?: string
  notes?: string
  createdAt: string
  updatedAt: string
}

interface ExpenseFormData {
  description: string
  amount: string
  category: 'SHOP_EXPENSES' | 'HOUSEHOLD_EXPENSES' | 'PROPERTY_MAINTENANCE' | 'UTILITIES' | 'TAXES' | 'INSURANCE' | 'LEGAL' | 'MARKETING' | 'REPAIRS' | 'SECURITY' | 'CLEANING' | 'SUPPLIES' | 'TRANSPORT' | 'STAFF_WAGES' | 'OTHER'
  expenseDate: string
  paymentMethod: string
  receiptNumber: string
  vendor: string
  propertyAddress: string
  notes: string
}

export default function ExpensesPage() {
  const permissions = usePermissions('expenses') as any
  const { canCreate, canUpdate, canDelete } = permissions
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('ALL')
  const [showForm, setShowForm] = useState(false)
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null)
  const [loading, setLoading] = useState(true)
  const [formData, setFormData] = useState<ExpenseFormData>({
    description: '',
    amount: '',
    category: 'OTHER',
    expenseDate: '',
    paymentMethod: '',
    receiptNumber: '',
    vendor: '',
    propertyAddress: '',
    notes: '',
  })

  const resetForm = () => {
    setFormData({
      description: '',
      amount: '',
      category: 'OTHER',
      expenseDate: '',
      paymentMethod: '',
      receiptNumber: '',
      vendor: '',
      propertyAddress: '',
      notes: '',
    })
    setEditingExpense(null)
    setShowForm(false)
  }

  const fetchExpenses = async () => {
    try {
      const params = new URLSearchParams()
      if (categoryFilter !== 'ALL') params.append('category', categoryFilter)

      const response = await fetch(`/api/expenses?${params}`)
      if (response.ok) {
        const data = await response.json()
        setExpenses(data)
      }
    } catch (error) {
      console.error('Error fetching expenses:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchExpenses()
  }, [categoryFilter])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const payload = {
      description: formData.description,
      amount: parseFloat(formData.amount),
      category: formData.category,
      expenseDate: new Date(formData.expenseDate).toISOString(),
      paymentMethod: formData.paymentMethod === 'NOT_SPECIFIED' ? undefined : formData.paymentMethod || undefined,
      receiptNumber: formData.receiptNumber || undefined,
      vendor: formData.vendor || undefined,
      propertyAddress: formData.propertyAddress || undefined,
      notes: formData.notes || undefined,
    }

    try {
      const url = editingExpense ? `/api/expenses/${editingExpense.id}` : '/api/expenses'
      const method = editingExpense ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (response.ok) {
        await fetchExpenses()
        resetForm()
      } else {
        const error = await response.json()
        alert(error.error || 'Something went wrong')
      }
    } catch (error) {
      console.error('Error saving expense:', error)
      alert('Failed to save expense')
    }
  }

  const handleEdit = (expense: Expense) => {
    setFormData({
      description: expense.description,
      amount: expense.amount.toString(),
      category: expense.category,
      expenseDate: expense.expenseDate.split('T')[0],
      paymentMethod: expense.paymentMethod || 'NOT_SPECIFIED',
      receiptNumber: expense.receiptNumber || '',
      vendor: expense.vendor || '',
      propertyAddress: expense.propertyAddress || '',
      notes: expense.notes || '',
    })
    setEditingExpense(expense)
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this expense?')) return

    try {
      const response = await fetch(`/api/expenses/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        await fetchExpenses()
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to delete expense')
      }
    } catch (error) {
      console.error('Error deleting expense:', error)
      alert('Failed to delete expense')
    }
  }

  const filteredExpenses = expenses.filter((expense) =>
    expense.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (expense.vendor && expense.vendor.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (expense.propertyAddress && expense.propertyAddress.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (expense.receiptNumber && expense.receiptNumber.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'MAINTENANCE': return 'bg-orange-100 text-orange-800'
      case 'REPAIRS': return 'bg-red-100 text-red-800'
      case 'UTILITIES': return 'bg-blue-100 text-blue-800'
      case 'SECURITY': return 'bg-yellow-100 text-yellow-800'
      case 'CLEANING': return 'bg-green-100 text-green-800'
      case 'SUPPLIES': return 'bg-indigo-100 text-indigo-800'
      case 'TAXES': return 'bg-rose-100 text-rose-800'
      case 'INSURANCE': return 'bg-emerald-100 text-emerald-800'
      case 'LEGAL': return 'bg-purple-100 text-purple-800'
      case 'MARKETING': return 'bg-pink-100 text-pink-800'
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
          <h1 className="text-3xl font-bold text-foreground">Expenses</h1>
          <p className="text-muted-foreground">
            Track and manage property expenses
          </p>
        </div>
        {canCreate && (
          <Button onClick={() => setShowForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Expense
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
                placeholder="Search by description, vendor, property or receipt number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="relative">
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Filter by category" />
                </SelectTrigger>
                <SelectContent className="z-50">
                  <SelectItem value="ALL">All Categories</SelectItem>
                  <SelectItem value="SHOP_EXPENSES">Shop Expenses</SelectItem>
                  <SelectItem value="HOUSEHOLD_EXPENSES">Household Expenses</SelectItem>
                  <SelectItem value="PROPERTY_MAINTENANCE">Property Maintenance</SelectItem>
                  <SelectItem value="UTILITIES">Utilities</SelectItem>
                  <SelectItem value="TAXES">Taxes</SelectItem>
                  <SelectItem value="INSURANCE">Insurance</SelectItem>
                  <SelectItem value="LEGAL">Legal</SelectItem>
                  <SelectItem value="MARKETING">Marketing</SelectItem>
                  <SelectItem value="REPAIRS">Repairs</SelectItem>
                  <SelectItem value="SECURITY">Security</SelectItem>
                  <SelectItem value="CLEANING">Cleaning</SelectItem>
                  <SelectItem value="SUPPLIES">Supplies</SelectItem>
                  <SelectItem value="TRANSPORT">Transport</SelectItem>
                  <SelectItem value="STAFF_WAGES">Staff Wages</SelectItem>
                  <SelectItem value="OTHER">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Add/Edit Form */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>
              {editingExpense ? 'Edit Expense' : 'Add New Expense'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <Label htmlFor="description">Description</Label>
                  <Input
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    required
                  />
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

                <div className="relative z-40">
                  <Label htmlFor="category">Category</Label>
                  <Select value={formData.category} onValueChange={(value: 'SHOP_EXPENSES' | 'HOUSEHOLD_EXPENSES' | 'PROPERTY_MAINTENANCE' | 'UTILITIES' | 'TAXES' | 'INSURANCE' | 'LEGAL' | 'MARKETING' | 'REPAIRS' | 'SECURITY' | 'CLEANING' | 'SUPPLIES' | 'TRANSPORT' | 'STAFF_WAGES' | 'OTHER') => setFormData({ ...formData, category: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="z-50 max-h-[200px] overflow-y-auto">
                      <SelectItem value="SHOP_EXPENSES">Shop Expenses</SelectItem>
                      <SelectItem value="HOUSEHOLD_EXPENSES">Household Expenses</SelectItem>
                      <SelectItem value="PROPERTY_MAINTENANCE">Property Maintenance</SelectItem>
                      <SelectItem value="UTILITIES">Utilities</SelectItem>
                      <SelectItem value="TAXES">Taxes</SelectItem>
                      <SelectItem value="INSURANCE">Insurance</SelectItem>
                      <SelectItem value="LEGAL">Legal</SelectItem>
                      <SelectItem value="MARKETING">Marketing</SelectItem>
                      <SelectItem value="REPAIRS">Repairs</SelectItem>
                      <SelectItem value="SECURITY">Security</SelectItem>
                      <SelectItem value="CLEANING">Cleaning</SelectItem>
                      <SelectItem value="SUPPLIES">Supplies</SelectItem>
                      <SelectItem value="TRANSPORT">Transport</SelectItem>
                      <SelectItem value="STAFF_WAGES">Staff Wages</SelectItem>
                      <SelectItem value="OTHER">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="expenseDate">Expense Date</Label>
                  <Input
                    id="expenseDate"
                    type="date"
                    value={formData.expenseDate}
                    onChange={(e) => setFormData({ ...formData, expenseDate: e.target.value })}
                    required
                  />
                </div>

                <div className="relative z-30">
                  <Label htmlFor="paymentMethod">Payment Method</Label>
                  <Select value={formData.paymentMethod} onValueChange={(value) => setFormData({ ...formData, paymentMethod: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select payment method" />
                    </SelectTrigger>
                    <SelectContent className="z-50 max-h-[200px] overflow-y-auto">
                      <SelectItem value="NOT_SPECIFIED">Not specified</SelectItem>
                      <SelectItem value="CASH">Cash</SelectItem>
                      <SelectItem value="MPESA">M-Pesa</SelectItem>
                      <SelectItem value="BANK_TRANSFER">Bank Transfer</SelectItem>
                      <SelectItem value="CHEQUE">Cheque</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="receiptNumber">Receipt Number</Label>
                  <Input
                    id="receiptNumber"
                    value={formData.receiptNumber}
                    onChange={(e) => setFormData({ ...formData, receiptNumber: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="vendor">Vendor/Supplier</Label>
                  <Input
                    id="vendor"
                    value={formData.vendor}
                    onChange={(e) => setFormData({ ...formData, vendor: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="propertyAddress">Property Address</Label>
                  <Input
                    id="propertyAddress"
                    value={formData.propertyAddress}
                    onChange={(e) => setFormData({ ...formData, propertyAddress: e.target.value })}
                    placeholder="Optional - which property"
                  />
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

              <div className="flex gap-3 pt-4">
                <Button type="submit" className="flex-1 md:flex-none md:px-8">
                  {editingExpense ? 'Update Expense' : 'Add Expense'}
                </Button>
                <Button type="button" variant="outline" className="flex-1 md:flex-none md:px-8" onClick={resetForm}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Expenses List */}
      <div className="grid gap-4">
        {filteredExpenses.map((expense) => (
          <Card key={expense.id}>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <h3 className="font-semibold text-lg">{expense.description}</h3>
                    <Badge className={getCategoryColor(expense.category)}>
                      {expense.category}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{formatCurrency(expense.amount)}</p>
                        {expense.paymentMethod && (
                          <p className="text-muted-foreground">{expense.paymentMethod}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <p className="font-medium">{formatDate(expense.expenseDate)}</p>
                    </div>

                    {expense.vendor && (
                      <div className="flex items-center gap-2">
                        <Receipt className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{expense.vendor}</p>
                          {expense.receiptNumber && (
                            <p className="text-muted-foreground">#{expense.receiptNumber}</p>
                          )}
                        </div>
                      </div>
                    )}

                    {expense.propertyAddress && (
                      <div className="flex items-center gap-2">
                        <Building className="h-4 w-4 text-muted-foreground" />
                        <p className="text-muted-foreground">{expense.propertyAddress}</p>
                      </div>
                    )}
                  </div>

                  {expense.notes && (
                    <div className="mt-3 p-3 bg-muted rounded-md">
                      <p className="text-sm text-muted-foreground">{expense.notes}</p>
                    </div>
                  )}
                </div>

                <div className="flex gap-2 ml-4">
                  {canUpdate && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(expense)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  )}
                  {canDelete && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(expense.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {filteredExpenses.length === 0 && (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <Receipt className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium">No expenses found</h3>
                <p className="text-muted-foreground mt-2">
                  {searchTerm ? 'Try adjusting your search terms.' : 'Get started by adding your first expense.'}
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}