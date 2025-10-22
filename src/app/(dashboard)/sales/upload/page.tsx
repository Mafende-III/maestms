'use client'

import { useRouter } from 'next/navigation'
import CSVUploadComponent from '@/components/upload/CSVUploadComponent'
import { useToast } from '@/hooks/use-toast'

interface ValidationError {
  row: number
  field: string
  message: string
  severity: 'error' | 'warning'
}

export default function SalesUploadPage() {
  const router = useRouter()
  const { toast } = useToast()

  // Parse WhatsApp format
  const parseWhatsAppFormat = (text: string): any[] => {
    const lines = text.trim().split('\n')
    const results: any[] = []
    let currentDate = ''

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim()

      // Extract date from lines like "20/10/25" or "5/10/25"
      const dateMatch = line.match(/^(\d{1,2}\/\d{1,2}\/\d{2,4})/)
      if (dateMatch) {
        // Parse date and convert to proper format
        const dateParts = dateMatch[1].split('/')
        let day = dateParts[0]
        let month = dateParts[1]
        let year = dateParts[2]

        // Convert 2-digit year to 4-digit
        if (year.length === 2) {
          year = '20' + year
        }

        // Ensure day and month are 2 digits
        day = day.padStart(2, '0')
        month = month.padStart(2, '0')

        currentDate = `${year}-${month}-${day}`
        continue
      }

      // Skip empty lines
      if (!line) continue

      // Parse sales data lines
      if (line.includes('sales:') || line.includes('exp:') || line.includes('Purchases:')) {
        const parts = line.split(':')
        if (parts.length >= 2) {
          const category = parts[0].trim()
          const amountText = parts[1].trim()

          // Extract amount (handle "nil", numbers with commas, etc.)
          let amount = 0
          if (amountText.toLowerCase() !== 'nil' && amountText !== '') {
            // Remove any non-numeric characters except decimal points
            const cleanAmount = amountText.replace(/[^\d.]/g, '')
            amount = parseFloat(cleanAmount) || 0
          }

          // Map category names to our system
          let mappedCategory = ''
          let isExpense = false

          switch (category.toLowerCase()) {
            case 'salon sales':
              mappedCategory = 'SALON'
              break
            case 'shop sales':
              mappedCategory = 'SHOP'
              break
            case 'cinema sales':
              mappedCategory = 'CINEMA'
              break
            case 'mm sales':
              mappedCategory = 'MOBILE_MONEY'
              break
            case 'charcoal':
              // Handle special charcoal format like "Charcoal(30bags):600.000"
              const charcoalMatch = line.match(/charcoal\((\d+(?:\.\d+)?)\s*bags?\)/i)
              if (charcoalMatch) {
                const quantity = parseFloat(charcoalMatch[1])
                results.push({
                  _rowIndex: i + 1,
                  date: currentDate,
                  category: 'CHARCOAL',
                  description: 'Charcoal Bags',
                  quantity: quantity,
                  unitPrice: quantity > 0 ? amount / quantity : 20000, // Default unit price
                  totalAmount: amount,
                  paymentMethod: 'CASH',
                  paymentStatus: 'COMPLETED',
                  location: 'Ngoma Business Center',
                  notes: `Imported from WhatsApp report - ${quantity} bags`
                })
                continue
              } else {
                mappedCategory = 'CHARCOAL'
              }
              break
            case 'shop exp':
            case 'home exp':
            case 'purchases':
              // These are expenses, not sales - skip for now
              isExpense = true
              break
            default:
              // Try to extract from other formats
              if (category.toLowerCase().includes('salon')) mappedCategory = 'SALON'
              else if (category.toLowerCase().includes('shop')) mappedCategory = 'SHOP'
              else if (category.toLowerCase().includes('cinema')) mappedCategory = 'CINEMA'
              else if (category.toLowerCase().includes('mobile') || category.toLowerCase().includes('mm')) mappedCategory = 'MOBILE_MONEY'
              else mappedCategory = 'OTHER'
              break
          }

          // Only add sales records (skip expenses)
          if (!isExpense && mappedCategory && amount >= 0) {
            results.push({
              _rowIndex: i + 1,
              date: currentDate,
              category: mappedCategory,
              description: getAutoDescription(mappedCategory),
              quantity: 1,
              unitPrice: amount,
              totalAmount: amount,
              paymentMethod: getDefaultPaymentMethod(mappedCategory),
              paymentStatus: amount > 0 ? 'COMPLETED' : 'PENDING',
              location: 'Ngoma Business Center',
              notes: `Imported from WhatsApp report`
            })
          }
        }
      }
    }

    return results
  }

  // Get auto description based on category
  const getAutoDescription = (category: string): string => {
    const descriptions = {
      'SHOP': 'Daily Shop Sales',
      'SALON': 'Daily Salon Services',
      'CINEMA': 'Daily Cinema Tickets',
      'MOBILE_MONEY': 'Daily Mobile Money Transactions',
      'CHARCOAL': 'Charcoal Bags'
    }
    return descriptions[category as keyof typeof descriptions] || 'Sales Transaction'
  }

  // Get default payment method based on category
  const getDefaultPaymentMethod = (category: string): string => {
    const methods = {
      'SHOP': 'CASH',
      'SALON': 'CASH',
      'CINEMA': 'CASH',
      'MOBILE_MONEY': 'MPESA',
      'CHARCOAL': 'CASH'
    }
    return methods[category as keyof typeof methods] || 'CASH'
  }

  // Validate sales row
  const validateSalesRow = (row: any, index: number): ValidationError[] => {
    const errors: ValidationError[] = []
    const rowNum = row._rowIndex || index + 1

    // Date validation
    if (!row.date || isNaN(Date.parse(row.date))) {
      errors.push({
        row: rowNum,
        field: 'date',
        message: 'Valid date is required (YYYY-MM-DD format)',
        severity: 'error'
      })
    }

    // Category validation
    const validCategories = ['SHOP', 'SALON', 'CINEMA', 'MOBILE_MONEY', 'CHARCOAL', 'PROPERTY', 'LIVESTOCK', 'OTHER']
    if (!row.category || !validCategories.includes(row.category.toUpperCase())) {
      errors.push({
        row: rowNum,
        field: 'category',
        message: `Category must be one of: ${validCategories.join(', ')}`,
        severity: 'error'
      })
    }

    // Amount validation
    if (!row.totalAmount || isNaN(parseFloat(row.totalAmount)) || parseFloat(row.totalAmount) < 0) {
      errors.push({
        row: rowNum,
        field: 'totalAmount',
        message: 'Total amount must be a positive number',
        severity: 'error'
      })
    }

    // Quantity validation
    if (row.quantity && (isNaN(parseFloat(row.quantity)) || parseFloat(row.quantity) <= 0)) {
      errors.push({
        row: rowNum,
        field: 'quantity',
        message: 'Quantity must be a positive number',
        severity: 'warning'
      })
    }

    // Unit price validation
    if (row.unitPrice && (isNaN(parseFloat(row.unitPrice)) || parseFloat(row.unitPrice) < 0)) {
      errors.push({
        row: rowNum,
        field: 'unitPrice',
        message: 'Unit price must be a positive number',
        severity: 'warning'
      })
    }

    // Payment method validation
    const validPaymentMethods = ['CASH', 'MPESA', 'BANK_TRANSFER', 'CHEQUE', 'CREDIT']
    if (row.paymentMethod && !validPaymentMethods.includes(row.paymentMethod.toUpperCase())) {
      errors.push({
        row: rowNum,
        field: 'paymentMethod',
        message: `Payment method must be one of: ${validPaymentMethods.join(', ')}`,
        severity: 'warning'
      })
    }

    // Payment status validation
    const validPaymentStatuses = ['PENDING', 'COMPLETED', 'OVERDUE', 'CANCELLED']
    if (row.paymentStatus && !validPaymentStatuses.includes(row.paymentStatus.toUpperCase())) {
      errors.push({
        row: rowNum,
        field: 'paymentStatus',
        message: `Payment status must be one of: ${validPaymentStatuses.join(', ')}`,
        severity: 'warning'
      })
    }

    return errors
  }

  // Handle data parsed
  const handleDataParsed = (data: any) => {
    console.log('Sales data parsed:', data)
  }

  // Handle import confirmation
  const handleImportConfirmed = async (data: any) => {
    console.log('Importing sales:', data)

    let imported = 0
    let failed = 0
    let skipped = 0
    const errors: string[] = []

    // Default asset ID (Ngoma Business Center)
    const defaultAssetId = 'cmh2iqi9y0000ttaxuvz4ynaj'

    for (const row of data.rows) {
      try {
        // Transform row data to match API expectations
        const saleData = {
          assetId: defaultAssetId,
          description: row.description || getAutoDescription(row.category),
          salePrice: parseFloat(row.totalAmount),
          saleDate: new Date(row.date).toISOString(),
          category: row.category?.toUpperCase(),
          saleType: getSaleType(row.category?.toUpperCase()),
          paymentMethod: row.paymentMethod?.toUpperCase() || getDefaultPaymentMethod(row.category),
          paymentStatus: row.paymentStatus?.toUpperCase() || 'COMPLETED',
          quantity: row.quantity ? parseFloat(row.quantity) : 1,
          unitPrice: row.unitPrice ? parseFloat(row.unitPrice) : parseFloat(row.totalAmount),
          location: row.location || 'Ngoma Business Center',
          currency: 'UGX',
          notes: row.notes || null
        }

        // Check for duplicate
        const duplicateCheck = await fetch(`/api/sales?date=${row.date}&category=${saleData.category}&amount=${saleData.salePrice}`)
        if (duplicateCheck.ok) {
          const existing = await duplicateCheck.json()
          if (existing.length > 0) {
            skipped++
            continue
          }
        }

        // Create sale via API
        const response = await fetch('/api/sales', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(saleData)
        })

        if (response.ok) {
          imported++
        } else {
          failed++
          const error = await response.json()
          errors.push(`Row ${row._rowIndex}: ${error.error || 'Unknown error'}`)
        }

      } catch (error) {
        failed++
        errors.push(`Row ${row._rowIndex}: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }

    // Show success toast
    if (imported > 0) {
      toast({
        title: "Sales Imported Successfully",
        description: `${imported} sales imported, ${skipped} duplicates skipped, ${failed} failed`,
      })
    }

    return {
      imported,
      skipped,
      failed,
      errors
    }
  }

  // Get sale type based on category
  const getSaleType = (category: string): string => {
    if (['SHOP', 'SALON', 'CINEMA', 'MOBILE_MONEY'].includes(category)) {
      return 'SHOP_SALE'
    }
    if (category === 'CHARCOAL') {
      return 'BULK_SALE'
    }
    if (['PROPERTY', 'LIVESTOCK'].includes(category)) {
      return 'PROPERTY_SALE'
    }
    return 'CASH_SALE'
  }

  return (
    <CSVUploadComponent
      title="Import Sales"
      description="Upload CSV file or WhatsApp daily reports to import sales data"
      templateName="sales-template.csv"
      templatePath="/templates/sales-template.csv"
      supportedFormats={['csv', 'whatsapp']}
      onDataParsed={handleDataParsed}
      onImportConfirmed={handleImportConfirmed}
      validateRow={validateSalesRow}
      parseWhatsAppFormat={parseWhatsAppFormat}
    />
  )
}