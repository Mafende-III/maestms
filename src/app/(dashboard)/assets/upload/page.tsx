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

export default function AssetsUploadPage() {
  const router = useRouter()
  const { toast } = useToast()

  // Validate asset row
  const validateAssetRow = (row: any, index: number): ValidationError[] => {
    const errors: ValidationError[] = []
    const rowNum = row._rowIndex || index + 1

    // Required field validation
    if (!row.name || row.name.trim() === '') {
      errors.push({
        row: rowNum,
        field: 'name',
        message: 'Asset name is required',
        severity: 'error'
      })
    }

    // Category validation
    const validCategories = ['PROPERTY', 'EQUIPMENT', 'FURNITURE', 'VEHICLE', 'OTHER']
    if (!row.category || !validCategories.includes(row.category.toUpperCase())) {
      errors.push({
        row: rowNum,
        field: 'category',
        message: `Category must be one of: ${validCategories.join(', ')}`,
        severity: 'error'
      })
    }

    // Condition validation
    const validConditions = ['EXCELLENT', 'GOOD', 'FAIR', 'POOR']
    if (row.condition && !validConditions.includes(row.condition.toUpperCase())) {
      errors.push({
        row: rowNum,
        field: 'condition',
        message: `Condition must be one of: ${validConditions.join(', ')}`,
        severity: 'warning'
      })
    }

    // Status validation
    const validStatuses = ['ACTIVE', 'SOLD', 'DAMAGED', 'DISPOSED']
    if (row.status && !validStatuses.includes(row.status.toUpperCase())) {
      errors.push({
        row: rowNum,
        field: 'status',
        message: `Status must be one of: ${validStatuses.join(', ')}`,
        severity: 'warning'
      })
    }

    // Price validation
    if (row.purchasePrice && (isNaN(parseFloat(row.purchasePrice)) || parseFloat(row.purchasePrice) < 0)) {
      errors.push({
        row: rowNum,
        field: 'purchasePrice',
        message: 'Purchase price must be a positive number',
        severity: 'warning'
      })
    }

    if (row.currentValue && (isNaN(parseFloat(row.currentValue)) || parseFloat(row.currentValue) < 0)) {
      errors.push({
        row: rowNum,
        field: 'currentValue',
        message: 'Current value must be a positive number',
        severity: 'warning'
      })
    }

    // Date validation
    if (row.purchaseDate && isNaN(Date.parse(row.purchaseDate))) {
      errors.push({
        row: rowNum,
        field: 'purchaseDate',
        message: 'Purchase date must be a valid date (YYYY-MM-DD format)',
        severity: 'warning'
      })
    }

    if (row.warrantyExpiry && isNaN(Date.parse(row.warrantyExpiry))) {
      errors.push({
        row: rowNum,
        field: 'warrantyExpiry',
        message: 'Warranty expiry must be a valid date (YYYY-MM-DD format)',
        severity: 'warning'
      })
    }

    if (row.maintenanceDate && isNaN(Date.parse(row.maintenanceDate))) {
      errors.push({
        row: rowNum,
        field: 'maintenanceDate',
        message: 'Maintenance date must be a valid date (YYYY-MM-DD format)',
        severity: 'warning'
      })
    }

    return errors
  }

  // Handle data parsed
  const handleDataParsed = (data: any) => {
    console.log('Assets data parsed:', data)
  }

  // Handle import confirmation
  const handleImportConfirmed = async (data: any) => {
    console.log('Importing assets:', data)

    let imported = 0
    let failed = 0
    let skipped = 0
    const errors: string[] = []

    for (const row of data.rows) {
      try {
        // Transform row data to match API expectations
        const assetData = {
          name: row.name,
          description: row.description || null,
          category: row.category?.toUpperCase() || 'OTHER',
          purchasePrice: row.purchasePrice ? parseFloat(row.purchasePrice) : null,
          currentValue: row.currentValue ? parseFloat(row.currentValue) : null,
          purchaseDate: row.purchaseDate ? new Date(row.purchaseDate).toISOString() : null,
          condition: row.condition?.toUpperCase() || 'GOOD',
          location: row.location || null,
          serialNumber: row.serialNumber || null,
          warrantyExpiry: row.warrantyExpiry ? new Date(row.warrantyExpiry).toISOString() : null,
          maintenanceDate: row.maintenanceDate ? new Date(row.maintenanceDate).toISOString() : null,
          status: row.status?.toUpperCase() || 'ACTIVE',
          notes: row.notes || null
        }

        // Check for duplicate by name
        const existingCheck = await fetch(`/api/assets?name=${encodeURIComponent(assetData.name)}`)
        if (existingCheck.ok) {
          const existing = await existingCheck.json()
          if (existing.length > 0) {
            skipped++
            continue
          }
        }

        // Create asset via API
        const response = await fetch('/api/assets', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(assetData)
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
        title: "Assets Imported Successfully",
        description: `${imported} assets imported, ${skipped} duplicates skipped, ${failed} failed`,
      })
    }

    return {
      imported,
      skipped,
      failed,
      errors
    }
  }

  return (
    <CSVUploadComponent
      title="Import Assets"
      description="Upload CSV file to import multiple assets at once"
      templateName="assets-template.csv"
      templatePath="/templates/assets-template.csv"
      supportedFormats={['csv']}
      onDataParsed={handleDataParsed}
      onImportConfirmed={handleImportConfirmed}
      validateRow={validateAssetRow}
    />
  )
}