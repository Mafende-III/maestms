import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-UG', {
    style: 'currency',
    currency: 'UGX',
    minimumFractionDigits: 0,
  }).format(amount)
}

export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat('en-UG', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(date))
}

export function formatDateTime(date: Date | string): string {
  return new Intl.DateTimeFormat('en-UG', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date))
}

export function calculateDaysUntilExpiry(endDate: Date | string): number {
  const today = new Date()
  const expiry = new Date(endDate)
  const diffTime = expiry.getTime() - today.getTime()
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}

export function getExpiryStatus(daysUntilExpiry: number): 'critical' | 'attention' | 'monitor' | 'healthy' {
  if (daysUntilExpiry < 0) return 'critical' // Expired
  if (daysUntilExpiry <= 30) return 'critical'
  if (daysUntilExpiry <= 60) return 'attention'
  if (daysUntilExpiry <= 90) return 'monitor'
  return 'healthy'
}

export function generateReceiptNumber(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  const time = String(now.getHours()).padStart(2, '0') + String(now.getMinutes()).padStart(2, '0')
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0')

  return `RCP-${year}${month}${day}-${time}-${random}`
}

export function generateTenantSerialNumber(location: 'NGOMA' | 'NAKASONGOLA', count: number): string {
  const locationCode = location === 'NGOMA' ? 'NG' : 'NAK'
  const paddedCount = String(count + 1).padStart(4, '0')
  return `maest_tid${locationCode}${paddedCount}`
}