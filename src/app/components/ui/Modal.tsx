'use client'

import { useEffect, useRef, useCallback } from 'react'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  children: React.ReactNode
  title?: string
  /** Optional aria-labelledby ID if title is provided externally */
  ariaLabelledBy?: string
  /** Optional aria-describedby ID for description */
  ariaDescribedBy?: string
}

export default function Modal({
  isOpen,
  onClose,
  children,
  title,
  ariaLabelledBy,
  ariaDescribedBy
}: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null)
  const previousActiveElement = useRef<HTMLElement | null>(null)

  // Store the previously focused element and restore on close
  useEffect(() => {
    if (isOpen) {
      previousActiveElement.current = document.activeElement as HTMLElement
      // Focus the modal container or first focusable element
      setTimeout(() => {
        const firstFocusable = modalRef.current?.querySelector<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        )
        firstFocusable?.focus()
      }, 50)
    } else {
      // Restore focus when modal closes
      previousActiveElement.current?.focus()
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

  // Handle keyboard events (Escape to close, Tab to trap focus)
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose()
      return
    }

    // Focus trap
    if (e.key === 'Tab' && modalRef.current) {
      const focusableElements = modalRef.current.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )

      if (focusableElements.length === 0) return

      const firstElement = focusableElements[0]
      const lastElement = focusableElements[focusableElements.length - 1]

      if (!firstElement || !lastElement) return

      if (e.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstElement) {
          e.preventDefault()
          lastElement.focus()
        }
      } else {
        // Tab
        if (document.activeElement === lastElement) {
          e.preventDefault()
          firstElement.focus()
        }
      }
    }
  }, [onClose])

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, handleKeyDown])

  if (!isOpen) return null

  const titleId = title ? 'modal-title' : ariaLabelledBy

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={ariaDescribedBy}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Content */}
      <div
        ref={modalRef}
        className="relative w-full max-w-md glass-bubble rounded-3xl overflow-hidden"
      >
        {title && (
          <div className="p-6 border-b border-white/10">
            <div className="flex items-center justify-between">
              <h2 id="modal-title" className="text-xl font-bold text-white">
                {title}
              </h2>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/10 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-lime-400"
                aria-label="Close modal"
              >
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}

        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  )
}
