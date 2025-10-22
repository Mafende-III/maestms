export interface ParsedDailyData {
  date: string
  shopSales?: number
  salonSales?: number
  cinemaSales?: number
  mobileMoneyRev?: number
  shopExpenses?: number
  homeExpenses?: number
  purchases?: number
}

export function parseDailyData(text: string): ParsedDailyData {
  const lines = text.trim().split('\n')

  if (lines.length === 0) {
    throw new Error('Empty input text')
  }

  // First line should be the date in DD/MM/YY format
  const dateMatch = lines[0].match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/)
  if (!dateMatch) {
    throw new Error('Invalid date format. Expected DD/MM/YY or DD/MM/YYYY')
  }

  const [, day, month, year] = dateMatch
  const fullYear = year.length === 2 ? `20${year}` : year
  const isoDate = `${fullYear}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`

  const result: ParsedDailyData = { date: isoDate }

  // Parse remaining lines for sales and expense data
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue

    // Match pattern: "Category name: amount" (with optional thousands separators)
    const match = line.match(/^(.+?):\s*([0-9,.]+)$/)
    if (!match) continue

    const [, category, amountStr] = match
    const amount = parseFloat(amountStr.replace(/,/g, ''))

    if (isNaN(amount)) continue

    // Map category names to fields
    const categoryLower = category.toLowerCase().trim()

    if (categoryLower.includes('salon')) {
      result.salonSales = amount
    } else if (categoryLower.includes('shop') && categoryLower.includes('sales')) {
      result.shopSales = amount
    } else if (categoryLower.includes('cinema')) {
      result.cinemaSales = amount
    } else if (categoryLower.includes('mm') || categoryLower.includes('mobile money')) {
      result.mobileMoneyRev = amount
    } else if (categoryLower.includes('shop') && categoryLower.includes('exp')) {
      result.shopExpenses = amount
    } else if (categoryLower.includes('home') && categoryLower.includes('exp')) {
      result.homeExpenses = amount
    } else if (categoryLower.includes('purchase')) {
      result.purchases = amount
    }
  }

  return result
}

export function formatDailyData(data: ParsedDailyData): string {
  const lines = [data.date.split('-').reverse().join('/')]

  if (data.shopSales) lines.push(`Shop sales: ${data.shopSales.toLocaleString()}`)
  if (data.salonSales) lines.push(`Salon sales: ${data.salonSales.toLocaleString()}`)
  if (data.cinemaSales) lines.push(`Cinema sales: ${data.cinemaSales.toLocaleString()}`)
  if (data.mobileMoneyRev) lines.push(`MM sales: ${data.mobileMoneyRev.toLocaleString()}`)
  if (data.shopExpenses) lines.push(`Shop exp: ${data.shopExpenses.toLocaleString()}`)
  if (data.homeExpenses) lines.push(`Home exp: ${data.homeExpenses.toLocaleString()}`)
  if (data.purchases) lines.push(`Purchases: ${data.purchases.toLocaleString()}`)

  return lines.join('\n')
}