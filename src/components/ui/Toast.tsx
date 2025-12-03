'use client'

import { useEffect, useState } from 'react'

export type ToastType = 'success' | 'error' | 'warning' | 'info'

export interface ToastProps {
  id: string
  message: string
  type: ToastType
  duration?: number
  onDismiss: (id: string) => void
}

const toastIcons: Record<ToastType, string> = {
  success: '✓',
  error: '✕',
  warning: '⚠',
  info: 'ℹ',
}

const toastStyles: Record<ToastType, string> = {
  success: 'bg-green-500/20 border-green-500/50 text-green-400',
  error: 'bg-red-500/20 border-red-500/50 text-red-400',
  warning: 'bg-amber-500/20 border-amber-500/50 text-amber-400',
  info: 'bg-cyan-500/20 border-cyan-500/50 text-cyan-400',
}

const iconStyles: Record<ToastType, string> = {
  success: 'bg-green-500 text-white',
  error: 'bg-red-500 text-white',
  warning: 'bg-amber-500 text-black',
  info: 'bg-cyan-500 text-white',
}

export function Toast({ id, message, type, duration = 4000, onDismiss }: ToastProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [isLeaving, setIsLeaving] = useState(false)

  useEffect(() => {
    // Trigger enter animation
    requestAnimationFrame(() => setIsVisible(true))

    // Auto dismiss
    const timer = setTimeout(() => {
      handleDismiss()
    }, duration)

    return () => clearTimeout(timer)
  }, [duration])

  const handleDismiss = () => {
    setIsLeaving(true)
    setTimeout(() => onDismiss(id), 300)
  }

  return (
    <div
      role="alert"
      aria-live="polite"
      className={`
        flex items-center gap-3 px-4 py-3 rounded-2xl border backdrop-blur-xl
        shadow-lg shadow-black/20 transition-all duration-300 ease-out
        ${toastStyles[type]}
        ${isVisible && !isLeaving ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0'}
      `}
    >
      <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold ${iconStyles[type]}`}>
        {toastIcons[type]}
      </div>
      <p className="flex-1 text-sm font-medium text-white">{message}</p>
      <button
        onClick={handleDismiss}
        className="flex-shrink-0 p-1 hover:bg-white/10 rounded-full transition-colors"
        aria-label="Dismiss notification"
      >
        <svg className="w-4 h-4 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  )
}

export interface ToastContainerProps {
  toasts: Array<{
    id: string
    message: string
    type: ToastType
    duration?: number
  }>
  onDismiss: (id: string) => void
}

export function ToastContainer({ toasts, onDismiss }: ToastContainerProps) {
  return (
    <div
      className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 max-w-sm w-full pointer-events-none"
      style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
    >
      {toasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto">
          <Toast {...toast} onDismiss={onDismiss} />
        </div>
      ))}
    </div>
  )
}
