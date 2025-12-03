'use client'

import { useEffect, useRef, useId } from 'react'
import { useFocusTrapLegacy } from '@/hooks/useFocusTrap'

interface ModalProps {
  /** Whether the modal is currently open */
  isOpen: boolean
  /** Callback when the modal should close */
  onClose: () => void
  /** Modal content */
  children: React.ReactNode
  /** Optional title displayed in the modal header */
  title?: string
  /** Optional ref to the element that should receive initial focus */
  initialFocusRef?: React.RefObject<HTMLElement>
  /** Optional description ID for aria-describedby */
  ariaDescribedBy?: string
  /** Optional size variant */
  size?: 'sm' | 'md' | 'lg' | 'xl'
  /** Whether to show the close button */
  showCloseButton?: boolean
}

const sizeClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
}

/**
 * Accessible Modal Dialog Component
 *
 * Features:
 * - Focus trap to keep keyboard focus within the modal
 * - ARIA attributes for screen reader accessibility
 * - Escape key to close
 * - Click outside to close
 * - Returns focus to trigger element on close
 *
 * @example
 * ```tsx
 * <Modal
 *   isOpen={isOpen}
 *   onClose={handleClose}
 *   title="Confirm Action"
 * >
 *   <p>Are you sure you want to proceed?</p>
 *   <button onClick={handleConfirm}>Confirm</button>
 * </Modal>
 * ```
 */
export default function Modal({
  isOpen,
  onClose,
  children,
  title,
  initialFocusRef,
  ariaDescribedBy,
  size = 'md',
  showCloseButton = true,
}: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null)
  const titleId = useId()

  // Use focus trap hook for accessibility
  useFocusTrapLegacy(modalRef, {
    enabled: isOpen,
    initialFocusRef,
    returnFocusOnDeactivate: true,
    escapeDeactivates: true,
    onEscape: onClose,
  })

  // Prevent body scroll when modal is open
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

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="presentation"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog */}
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        aria-describedby={ariaDescribedBy}
        className={`relative w-full ${sizeClasses[size]} glass-bubble rounded-3xl overflow-hidden`}
      >
        {/* Header */}
        {(title || showCloseButton) && (
          <div className="p-6 border-b border-white/10">
            <div className="flex items-center justify-between">
              {title && (
                <h2
                  id={titleId}
                  className="text-xl font-bold text-white"
                >
                  {title}
                </h2>
              )}
              {showCloseButton && (
                <button
                  type="button"
                  onClick={onClose}
                  className="p-2 hover:bg-white/10 rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--sltr-primary,#00ff88)] focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
                  aria-label="Close modal"
                >
                  <svg
                    className="w-5 h-5 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Content */}
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  )
}
