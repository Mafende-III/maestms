import { useState, useCallback } from 'react'

interface Toast {
  id: string
  title: string
  description?: string
  variant?: 'default' | 'destructive'
}

interface ToastOptions {
  title: string
  description?: string
  variant?: 'default' | 'destructive'
}

let toastCount = 0

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([])

  const toast = useCallback(({ title, description, variant = 'default' }: ToastOptions) => {
    const id = (++toastCount).toString()

    const newToast: Toast = {
      id,
      title,
      description,
      variant
    }

    setToasts(prev => [...prev, newToast])

    // Auto remove after 5 seconds
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, 5000)

    // For now, use browser alert as fallback
    if (variant === 'destructive') {
      alert(`Error: ${title}${description ? '\n' + description : ''}`)
    } else {
      alert(`${title}${description ? '\n' + description : ''}`)
    }
  }, [])

  const dismissToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  return {
    toast,
    toasts,
    dismissToast
  }
}