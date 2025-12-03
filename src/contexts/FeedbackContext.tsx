'use client'

import { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import { ToastContainer, ToastType } from '@/components/ui/Toast'
import { ConfirmDialog, ConfirmVariant } from '@/components/ui/ConfirmDialog'

// Toast types
interface ToastItem {
  id: string
  message: string
  type: ToastType
  duration?: number
}

// Confirm dialog types
interface ConfirmOptions {
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  variant?: ConfirmVariant
}

interface ConfirmState extends ConfirmOptions {
  isOpen: boolean
  resolve: ((value: boolean) => void) | null
}

// Context types
interface FeedbackContextType {
  // Toast methods
  showToast: (message: string, type?: ToastType, duration?: number) => void
  showSuccess: (message: string) => void
  showError: (message: string) => void
  showWarning: (message: string) => void
  showInfo: (message: string) => void

  // Confirm dialog methods
  confirm: (options: ConfirmOptions) => Promise<boolean>
  confirmDanger: (title: string, message: string) => Promise<boolean>
}

const FeedbackContext = createContext<FeedbackContextType | null>(null)

// Generate unique ID
let toastIdCounter = 0
const generateId = () => `toast-${++toastIdCounter}-${Date.now()}`

export function FeedbackProvider({ children }: { children: ReactNode }) {
  // Toast state
  const [toasts, setToasts] = useState<ToastItem[]>([])

  // Confirm dialog state
  const [confirmState, setConfirmState] = useState<ConfirmState>({
    isOpen: false,
    title: '',
    message: '',
    resolve: null,
  })

  // Toast methods
  const showToast = useCallback((message: string, type: ToastType = 'info', duration?: number) => {
    const id = generateId()
    setToasts((prev) => [...prev, { id, message, type, duration }])
  }, [])

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const showSuccess = useCallback((message: string) => showToast(message, 'success'), [showToast])
  const showError = useCallback((message: string) => showToast(message, 'error', 6000), [showToast])
  const showWarning = useCallback((message: string) => showToast(message, 'warning', 5000), [showToast])
  const showInfo = useCallback((message: string) => showToast(message, 'info'), [showToast])

  // Confirm dialog methods
  const confirm = useCallback((options: ConfirmOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      setConfirmState({
        isOpen: true,
        ...options,
        resolve,
      })
    })
  }, [])

  const confirmDanger = useCallback((title: string, message: string): Promise<boolean> => {
    return confirm({
      title,
      message,
      variant: 'danger',
      confirmText: 'Yes, proceed',
      cancelText: 'Cancel',
    })
  }, [confirm])

  const handleConfirm = useCallback(() => {
    confirmState.resolve?.(true)
    setConfirmState((prev) => ({ ...prev, isOpen: false, resolve: null }))
  }, [confirmState.resolve])

  const handleCancel = useCallback(() => {
    confirmState.resolve?.(false)
    setConfirmState((prev) => ({ ...prev, isOpen: false, resolve: null }))
  }, [confirmState.resolve])

  return (
    <FeedbackContext.Provider
      value={{
        showToast,
        showSuccess,
        showError,
        showWarning,
        showInfo,
        confirm,
        confirmDanger,
      }}
    >
      {children}

      {/* Toast Container */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={confirmState.isOpen}
        title={confirmState.title}
        message={confirmState.message}
        confirmText={confirmState.confirmText}
        cancelText={confirmState.cancelText}
        variant={confirmState.variant}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
    </FeedbackContext.Provider>
  )
}

// Hook to use feedback context
export function useFeedback() {
  const context = useContext(FeedbackContext)
  if (!context) {
    throw new Error('useFeedback must be used within a FeedbackProvider')
  }
  return context
}

// Convenience hooks
export function useToast() {
  const { showToast, showSuccess, showError, showWarning, showInfo } = useFeedback()
  return { showToast, showSuccess, showError, showWarning, showInfo }
}

export function useConfirm() {
  const { confirm, confirmDanger } = useFeedback()
  return { confirm, confirmDanger }
}
