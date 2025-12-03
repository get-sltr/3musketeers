'use client'

import { useEffect, useRef, useCallback } from 'react'

/**
 * Configuration options for the useFocusTrap hook
 */
export interface UseFocusTrapOptions {
  /** Whether the focus trap is currently active */
  enabled?: boolean
  /** Reference to the element that should receive initial focus */
  initialFocusRef?: React.RefObject<HTMLElement>
  /** Whether to return focus to the previously focused element when deactivated */
  returnFocusOnDeactivate?: boolean
  /** Whether pressing Escape should deactivate the trap */
  escapeDeactivates?: boolean
  /** Callback function when Escape is pressed (only if escapeDeactivates is true) */
  onEscape?: () => void
  /** Whether to allow clicks outside the container (if false, outside clicks are blocked and focus returns to container) */
  allowOutsideClick?: boolean
}

/** Selector for all focusable elements */
const FOCUSABLE_SELECTOR = [
  'a[href]',
  'area[href]',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  'button:not([disabled])',
  'iframe',
  'object',
  'embed',
  '[contenteditable]',
  '[tabindex]:not([tabindex="-1"])',
].join(', ')

/**
 * Custom hook that traps focus within a container element.
 * Essential for accessible modal dialogs and overlays.
 *
 * @param containerRef - Reference to the container element that should trap focus
 * @param options - Configuration options for the focus trap
 *
 * @example
 * ```tsx
 * const modalRef = useRef<HTMLDivElement>(null)
 *
 * useFocusTrap(modalRef, {
 *   enabled: isOpen,
 *   onEscape: handleClose,
 *   returnFocusOnDeactivate: true
 * })
 *
 * return <div ref={modalRef} role="dialog" aria-modal="true">...</div>
 * ```
 */
export function useFocusTrap(
  containerRef: React.RefObject<HTMLElement>,
  options: UseFocusTrapOptions = {}
): void {
  const {
    enabled = true,
    initialFocusRef,
    returnFocusOnDeactivate = true,
    escapeDeactivates = true,
    onEscape,
    allowOutsideClick = false,
  } = options

  // Store the element that was focused before the trap was activated
  const previouslyFocusedElement = useRef<HTMLElement | null>(null)

  /**
   * Get all focusable elements within the container
   */
  const getFocusableElements = useCallback((): HTMLElement[] => {
    if (!containerRef.current) return []

    const elements = containerRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
    return Array.from(elements).filter(el => {
      // Filter out elements that are not visible
      const style = window.getComputedStyle(el)
      return style.display !== 'none' && style.visibility !== 'hidden' && !el.hasAttribute('hidden')
    })
  }, [containerRef])

  /**
   * Handle keyboard events for focus trapping
   */
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!containerRef.current) return

    // Handle Escape key
    if (event.key === 'Escape' && escapeDeactivates) {
      event.preventDefault()
      event.stopPropagation()
      onEscape?.()
      return
    }

    // Handle Tab key for focus trapping
    if (event.key === 'Tab') {
      const focusableElements = getFocusableElements()

      if (focusableElements.length === 0) {
        event.preventDefault()
        return
      }

      const firstElement = focusableElements[0]
      const lastElement = focusableElements[focusableElements.length - 1]
      const activeElement = document.activeElement as HTMLElement

      // Shift + Tab: If on first element, wrap to last
      if (event.shiftKey) {
        if (activeElement === firstElement || !containerRef.current.contains(activeElement)) {
          event.preventDefault()
          lastElement?.focus()
        }
      }
      // Tab: If on last element, wrap to first
      else {
        if (activeElement === lastElement || !containerRef.current.contains(activeElement)) {
          event.preventDefault()
          firstElement?.focus()
        }
      }
    }
  }, [containerRef, escapeDeactivates, onEscape, getFocusableElements])

  /**
   * Handle clicks outside the container
   */
  const handleClickOutside = useCallback((event: MouseEvent) => {
    if (!containerRef.current || allowOutsideClick) return

    const target = event.target as HTMLElement
    if (!containerRef.current.contains(target)) {
      event.preventDefault()
      event.stopPropagation()

      // Return focus to the container
      const focusableElements = getFocusableElements()
      if (focusableElements.length > 0) {
        focusableElements[0]?.focus()
      } else {
        containerRef.current.focus()
      }
    }
  }, [containerRef, allowOutsideClick, getFocusableElements])

  /**
   * Handle focus events to ensure focus stays within container
   */
  const handleFocusIn = useCallback((event: FocusEvent) => {
    if (!containerRef.current) return

    const target = event.target as HTMLElement
    if (!containerRef.current.contains(target)) {
      event.preventDefault()
      event.stopPropagation()

      const focusableElements = getFocusableElements()
      if (focusableElements.length > 0) {
        focusableElements[0]?.focus()
      }
    }
  }, [containerRef, getFocusableElements])

  // Main effect for activating/deactivating the focus trap
  useEffect(() => {
    if (!enabled || !containerRef.current) return

    // Store the currently focused element
    previouslyFocusedElement.current = document.activeElement as HTMLElement

    // Set initial focus
    const setInitialFocus = () => {
      if (initialFocusRef?.current) {
        initialFocusRef.current.focus()
      } else {
        const focusableElements = getFocusableElements()
        if (focusableElements.length > 0) {
          focusableElements[0]?.focus()
        } else if (containerRef.current) {
          // If no focusable elements, make container focusable
          containerRef.current.setAttribute('tabindex', '-1')
          containerRef.current.focus()
        }
      }
    }

    // Small delay to ensure DOM is ready
    const timeoutId = setTimeout(setInitialFocus, 0)

    // Add event listeners
    document.addEventListener('keydown', handleKeyDown, true)
    document.addEventListener('mousedown', handleClickOutside, true)
    document.addEventListener('focusin', handleFocusIn, true)

    // Cleanup function
    return () => {
      clearTimeout(timeoutId)
      document.removeEventListener('keydown', handleKeyDown, true)
      document.removeEventListener('mousedown', handleClickOutside, true)
      document.removeEventListener('focusin', handleFocusIn, true)

      // Return focus to the previously focused element
      if (returnFocusOnDeactivate && previouslyFocusedElement.current) {
        // Small delay to prevent focus from being stolen
        setTimeout(() => {
          previouslyFocusedElement.current?.focus()
        }, 0)
      }
    }
  }, [
    enabled,
    containerRef,
    initialFocusRef,
    returnFocusOnDeactivate,
    handleKeyDown,
    handleClickOutside,
    handleFocusIn,
    getFocusableElements,
  ])
}

export default useFocusTrap
