'use client'

import { useState, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Upload, Download, FileText, CheckCircle, XCircle, AlertTriangle, Eye, MessageSquare } from 'lucide-react'

interface ValidationError {
  row: number
  field: string
  message: string
  severity: 'error' | 'warning'
}

interface ParsedData {
  headers: string[]
  rows: any[]
  format: 'csv' | 'whatsapp'
  errors: ValidationError[]
  summary: {
    total: number
    valid: number
    errors: number
    warnings: number
  }
}

interface CSVUploadComponentProps {
  title: string
  description: string
  templateName: string
  templatePath: string
  supportedFormats: ('csv' | 'whatsapp')[]
  onDataParsed: (data: ParsedData) => void
  onImportConfirmed: (data: ParsedData) => Promise<any>
  validateRow: (row: any, index: number) => ValidationError[]
  parseWhatsAppFormat?: (text: string) => any[]
}

export default function CSVUploadComponent({
  title,
  description,
  templateName,
  templatePath,
  supportedFormats,
  onDataParsed,
  onImportConfirmed,
  validateRow,
  parseWhatsAppFormat
}: CSVUploadComponentProps) {
  const [file, setFile] = useState<File | null>(null)
  const [textInput, setTextInput] = useState('')
  const [inputMethod, setInputMethod] = useState<'file' | 'text'>('file')
  const [parsedData, setParsedData] = useState<ParsedData | null>(null)
  const [loading, setLoading] = useState(false)
  const [importing, setImporting] = useState(false)
  const [uploadStep, setUploadStep] = useState<'upload' | 'validate' | 'preview' | 'confirm' | 'complete'>('upload')
  const [importResult, setImportResult] = useState<any>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Parse CSV content
  const parseCSV = (content: string): any[] => {
    const lines = content.trim().split('\n')
    const headers = lines[0].split(',').map(h => h.trim())

    return lines.slice(1).map((line, index) => {
      const values = line.split(',').map(v => v.trim())
      const row: any = { _rowIndex: index + 2 } // +2 because of header and 0-based index

      headers.forEach((header, i) => {
        row[header] = values[i] || ''
      })

      return row
    })
  }

  // Auto-detect format and parse content
  const detectAndParseContent = (content: string): ParsedData => {
    let format: 'csv' | 'whatsapp' = 'csv'
    let rows: any[] = []
    let headers: string[] = []

    // Auto-detect format
    if (content.includes('Salon sales:') || content.includes('Shop sales:') || content.includes('MM sales:')) {
      format = 'whatsapp'
      if (parseWhatsAppFormat && supportedFormats.includes('whatsapp')) {
        rows = parseWhatsAppFormat(content)
        headers = rows.length > 0 ? Object.keys(rows[0]).filter(k => k !== '_rowIndex') : []
      } else {
        throw new Error('WhatsApp format not supported for this data type')
      }
    } else {
      format = 'csv'
      rows = parseCSV(content)
      headers = rows.length > 0 ? Object.keys(rows[0]).filter(k => k !== '_rowIndex') : []
    }

    // Validate all rows
    const allErrors: ValidationError[] = []
    rows.forEach((row, index) => {
      const rowErrors = validateRow(row, index)
      allErrors.push(...rowErrors)
    })

    const errors = allErrors.filter(e => e.severity === 'error')
    const warnings = allErrors.filter(e => e.severity === 'warning')

    return {
      headers,
      rows,
      format,
      errors: allErrors,
      summary: {
        total: rows.length,
        valid: rows.length - errors.length,
        errors: errors.length,
        warnings: warnings.length
      }
    }
  }

  // Handle file upload
  const handleFileUpload = async (file: File) => {
    setLoading(true)
    setUploadStep('validate')

    try {
      const content = await file.text()
      const parsed = detectAndParseContent(content)

      setParsedData(parsed)
      onDataParsed(parsed)
      setUploadStep('preview')
    } catch (error) {
      console.error('Parse error:', error)
      alert(`Failed to parse file: ${error instanceof Error ? error.message : 'Unknown error'}`)
      setUploadStep('upload')
    } finally {
      setLoading(false)
    }
  }

  // Handle text input processing
  const handleTextProcess = async () => {
    if (!textInput.trim()) {
      alert('Please paste your data first')
      return
    }

    setLoading(true)
    setUploadStep('validate')

    try {
      const parsed = detectAndParseContent(textInput)

      setParsedData(parsed)
      onDataParsed(parsed)
      setUploadStep('preview')
    } catch (error) {
      console.error('Parse error:', error)
      alert(`Failed to parse text: ${error instanceof Error ? error.message : 'Unknown error'}`)
      setUploadStep('upload')
    } finally {
      setLoading(false)
    }
  }

  // Handle drag and drop
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const files = Array.from(e.dataTransfer.files)
    const file = files[0]

    if (file) {
      setFile(file)
      handleFileUpload(file)
    }
  }

  // Handle file input change
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setFile(file)
      handleFileUpload(file)
    }
  }

  // Handle import confirmation
  const handleImportConfirm = async () => {
    if (!parsedData) return

    setImporting(true)
    setUploadStep('confirm')

    try {
      const result = await onImportConfirmed(parsedData)
      setImportResult(result)
      setUploadStep('complete')
    } catch (error) {
      console.error('Import error:', error)
      alert(`Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
      setUploadStep('preview')
    } finally {
      setImporting(false)
    }
  }

  // Reset to start
  const handleReset = () => {
    setFile(null)
    setParsedData(null)
    setImportResult(null)
    setUploadStep('upload')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  // Download template
  const handleDownloadTemplate = () => {
    const link = document.createElement('a')
    link.href = templatePath
    link.download = templateName
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">{title}</h1>
          <p className="text-muted-foreground">{description}</p>
        </div>
        <Button onClick={handleDownloadTemplate} variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Download {templateName}
        </Button>
      </div>

      {/* Upload Step */}
      {uploadStep === 'upload' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Import Data
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Supported Formats */}
              <div className="flex gap-2">
                <span className="text-sm font-medium">Supported formats:</span>
                {supportedFormats.includes('csv') && (
                  <Badge variant="secondary">CSV Files</Badge>
                )}
                {supportedFormats.includes('whatsapp') && (
                  <Badge variant="secondary">WhatsApp Text</Badge>
                )}
              </div>

              {/* Input Methods Tabs */}
              <Tabs value={inputMethod} onValueChange={(value) => setInputMethod(value as 'file' | 'text')} className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="file" className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Upload File
                  </TabsTrigger>
                  {supportedFormats.includes('whatsapp') && (
                    <TabsTrigger value="text" className="flex items-center gap-2">
                      <MessageSquare className="h-4 w-4" />
                      Paste WhatsApp
                    </TabsTrigger>
                  )}
                </TabsList>

                {/* File Upload Tab */}
                <TabsContent value="file" className="space-y-4">
                  <div
                    className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors cursor-pointer"
                    onDrop={handleDrop}
                    onDragOver={(e) => e.preventDefault()}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-lg font-medium">Drop your file here or click to browse</p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Supports .csv files and .txt files
                    </p>
                  </div>

                  <Input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv,.txt"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </TabsContent>

                {/* Text Input Tab */}
                {supportedFormats.includes('whatsapp') && (
                  <TabsContent value="text" className="space-y-4">
                    <div className="space-y-3">
                      <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-lg">
                        <MessageSquare className="h-5 w-5 text-blue-600 mt-0.5" />
                        <div className="text-sm">
                          <p className="font-medium text-blue-900 mb-1">WhatsApp Format Example:</p>
                          <code className="text-xs text-blue-700 block bg-white p-2 rounded border">
                            20/10/25<br />
                            <br />
                            Salon sales:10.000<br />
                            Shop sales:466.800<br />
                            Charcoal(25bags):500.000<br />
                            Cinema sales:nil
                          </code>
                        </div>
                      </div>

                      <Textarea
                        placeholder="Paste your WhatsApp daily report here..."
                        value={textInput}
                        onChange={(e) => setTextInput(e.target.value)}
                        rows={8}
                        className="font-mono text-sm"
                      />

                      <Button
                        onClick={handleTextProcess}
                        disabled={!textInput.trim()}
                        className="w-full"
                      >
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Process WhatsApp Data
                      </Button>
                    </div>
                  </TabsContent>
                )}
              </Tabs>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Validation Step */}
      {uploadStep === 'validate' && loading && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <span className="ml-3">Validating data...</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Preview Step */}
      {uploadStep === 'preview' && parsedData && (
        <div className="space-y-4">
          {/* Validation Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Validation Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{parsedData.summary.total}</div>
                  <div className="text-sm text-muted-foreground">Total Rows</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{parsedData.summary.valid}</div>
                  <div className="text-sm text-muted-foreground">Valid Rows</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">{parsedData.summary.errors}</div>
                  <div className="text-sm text-muted-foreground">Errors</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-600">{parsedData.summary.warnings}</div>
                  <div className="text-sm text-muted-foreground">Warnings</div>
                </div>
              </div>

              <div className="mt-4 flex items-center gap-2">
                <Badge variant="outline" className="text-sm">
                  Format: {parsedData.format.toUpperCase()}
                </Badge>
                <Badge variant="outline" className="text-sm">
                  File: {file?.name}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Validation Errors */}
          {parsedData.errors.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-600">
                  <AlertTriangle className="h-5 w-5" />
                  Validation Issues ({parsedData.errors.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {parsedData.errors.map((error, index) => (
                    <Alert key={index} variant={error.severity === 'error' ? 'destructive' : 'default'}>
                      <AlertDescription>
                        <strong>Row {error.row}, {error.field}:</strong> {error.message}
                      </AlertDescription>
                    </Alert>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Data Preview */}
          <Card>
            <CardHeader>
              <CardTitle>Data Preview (First 5 rows)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {parsedData.headers.map((header) => (
                        <TableHead key={header}>{header}</TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {parsedData.rows.slice(0, 5).map((row, index) => (
                      <TableRow key={index}>
                        {parsedData.headers.map((header) => (
                          <TableCell key={header} className="font-mono text-sm">
                            {row[header]}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              onClick={handleImportConfirm}
              disabled={parsedData.summary.errors > 0}
              className="bg-green-600 hover:bg-green-700"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Confirm Import ({parsedData.summary.valid} rows)
            </Button>
            <Button variant="outline" onClick={handleReset}>
              Upload Different File
            </Button>
          </div>

          {parsedData.summary.errors > 0 && (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertDescription>
                Cannot import data with errors. Please fix the errors and upload again.
              </AlertDescription>
            </Alert>
          )}
        </div>
      )}

      {/* Import Progress */}
      {uploadStep === 'confirm' && importing && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <span className="ml-3">Importing data...</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Import Complete */}
      {uploadStep === 'complete' && importResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-600">
              <CheckCircle className="h-5 w-5" />
              Import Completed Successfully!
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{importResult.imported || 0}</div>
                  <div className="text-sm text-muted-foreground">Records Imported</div>
                </div>
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{importResult.skipped || 0}</div>
                  <div className="text-sm text-muted-foreground">Duplicates Skipped</div>
                </div>
                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <div className="text-2xl font-bold text-red-600">{importResult.failed || 0}</div>
                  <div className="text-sm text-muted-foreground">Failed</div>
                </div>
              </div>

              {importResult.errors && importResult.errors.length > 0 && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Some records failed to import. Check the logs for details.
                  </AlertDescription>
                </Alert>
              )}

              <Button onClick={handleReset} className="w-full">
                Import More Data
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}