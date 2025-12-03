'use client'

import { useEffect, useRef, useState } from 'react'

export type ConfirmVariant = 'danger' | 'warning' | 'default'

export interface ConfirmDialogProps {
  isOpen: boolean
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  variant?: ConfirmVariant
  onConfirm: () => void
  onCancel: () => void
}

const variantStyles: Record<ConfirmVariant, { button: string; icon: string; iconBg: string }> = {
  danger: {
    button: 'bg-red-500 hover:bg-red-600 text-white',
    icon: '🚫',
    iconBg: 'bg-red-500/20',
  },
  warning: {
    button: 'bg-amber-500 hover:bg-amber-600 text-black',
    icon: '⚠️',
    iconBg: 'bg-amber-500/20',
  },
  default: {
    button: 'bg-lime-400 hover:bg-lime-500 text-black',
    icon: '❓',
    iconBg: 'bg-lime-400/20',
  },
}

export function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'default',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [isLeaving, setIsLeaving] = useState(false)
  const dialogRef = useRef<HTMLDivElement>(null)
  const confirmButtonRef = useRef<HTMLButtonElement>(null)
  const cancelButtonRef = useRef<HTMLButtonElement>(null)

  // Handle animations
  useEffect(() => {
    if (isOpen) {
      setIsLeaving(false)
      requestAnimationFrame(() => setIsVisible(true))
      // Focus the cancel button by default (safer option)
      setTimeout(() => cancelButtonRef.current?.focus(), 100)
    } else {
      setIsVisible(false)
    }
  }, [isOpen])

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  // Handle keyboard navigation and escape
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleCancel()
      }

      // Trap focus within dialog
      if (e.key === 'Tab') {
        const focusableElements = dialogRef.current?.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        )
        if (!focusableElements || focusableElements.length === 0) return

        const firstElement = focusableElements[0] as HTMLElement
        const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement

        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault()
            lastElement.focus()
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault()
            firstElement.focus()
          }
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen])

  const handleCancel = () => {
    setIsLeaving(true)
    setTimeout(() => {
      setIsVisible(false)
      onCancel()
    }, 200)
  }

  const handleConfirm = () => {
    setIsLeaving(true)
    setTimeout(() => {
      setIsVisible(false)
      onConfirm()
    }, 200)
  }

  if (!isOpen) return null

  const styles = variantStyles[variant]

  return (
    <div
      className={`fixed inset-0 z-[9999] flex items-center justify-center p-4 transition-opacity duration-200 ${
        isVisible && !isLeaving ? 'opacity-100' : 'opacity-0'
      }`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
      aria-describedby="confirm-dialog-description"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={handleCancel}
        aria-hidden="true"
      />

      {/* Dialog */}
      <div
        ref={dialogRef}
        className={`relative w-full max-w-sm rounded-3xl border border-white/10 backdrop-blur-xl overflow-hidden transition-all duration-200 ${
          isVisible && !isLeaving ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4'
        }`}
        style={{
          background: 'rgba(26, 26, 26, 0.95)',
        }}
      >
        {/* Icon */}
        <div className="flex justify-center pt-6">
          <div className={`w-16 h-16 rounded-full ${styles.iconBg} flex items-center justify-center text-3xl`}>
            {styles.icon}
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-4 text-center">
          <h2
            id="confirm-dialog-title"
            className="text-xl font-bold text-white mb-2"
          >
            {title}
          </h2>
          <p
            id="confirm-dialog-description"
            className="text-white/70 text-sm leading-relaxed"
          >
            {message}
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-3 p-4 border-t border-white/10">
          <button
            ref={cancelButtonRef}
            onClick={handleCancel}
            className="flex-1 px-4 py-3 rounded-xl bg-white/10 border border-white/10 text-white font-semibold hover:bg-white/20 transition-colors focus:outline-none focus:ring-2 focus:ring-white/30"
          >
            {cancelText}
          </button>
          <button
            ref={confirmButtonRef}
            onClick={handleConfirm}
            className={`flex-1 px-4 py-3 rounded-xl font-bold transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black ${styles.button}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}
