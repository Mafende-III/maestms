import { useEffect, useState } from 'react'

interface ToastProps {
  message: string
  type: 'success' | 'error' | 'warning' | 'info'
  duration?: number
  onClose?: () => void
}

export function Toast({ message, type, duration = 3000, onClose }: ToastProps) {
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false)
      onClose?.()
    }, duration)

    return () => clearTimeout(timer)
  }, [duration, onClose])

  if (!isVisible) return null

  const bgColor = {
    success: 'bg-green-500',
    error: 'bg-red-500',
    warning: 'bg-yellow-500',
    info: 'bg-blue-500'
  }[type]

  const icon = {
    success: '✓',
    error: '✕',
    warning: '⚠',
    info: 'ℹ'
  }[type]

  return (
    <div className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-md text-white ${bgColor} shadow-lg animate-in slide-in-from-top`}>
      <span className="text-xl">{icon}</span>
      <span>{message}</span>
    </div>
  )
}