'use client'

import { useRef, useEffect, useCallback, RefObject, useState } from 'react'

/**
 * Configuration options for the useFocusTrap hook
 */
export interface UseFocusTrapOptions {
  /** Whether the focus trap is enabled (can be activated) */
  enabled?: boolean
  /** Whether to return focus to the previously focused element when deactivated */
  returnFocusOnDeactivate?: boolean
  /** Where to set initial focus: a ref, 'first' focusable, or 'container' */
  initialFocus?: RefObject<HTMLElement> | 'first' | 'container'
  /** Callback function when Escape is pressed */
  onEscape?: () => void
  /** Callback function when clicking outside the container */
  onClickOutside?: () => void
  /** Whether to allow clicks outside the container */
  allowOutsideClick?: boolean
}

/**
 * Return value from the useFocusTrap hook
 */
export interface UseFocusTrapReturn {
  /** Ref to attach to the container element (can be any HTMLElement) */
  containerRef: RefObject<HTMLElement>
  /** Activate the focus trap */
  activate: () => void
  /** Deactivate the focus trap */
  deactivate: () => void
  /** Whether the focus trap is currently active (reactive state) */
  isActive: boolean
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
 * Custom hook for trapping focus within a container element.
 * Useful for modals, dialogs, and other overlay components.
 *
 * @param options - Configuration options for the focus trap
 * @returns Object containing containerRef, activate, deactivate, and isActive
 *
 * @example
 * ```tsx
 * const { containerRef, activate, deactivate, isActive } = useFocusTrap({
 *   onEscape: handleClose,
 *   returnFocusOnDeactivate: true
 * })
 *
 * useEffect(() => {
 *   if (isOpen) activate()
 *   else deactivate()
 * }, [isOpen, activate, deactivate])
 *
 * return <div ref={containerRef} role="dialog" aria-modal="true">...</div>
 * ```
 */
export function useFocusTrap(options: UseFocusTrapOptions = {}): UseFocusTrapReturn {
  const {
    enabled = true,
    returnFocusOnDeactivate = true,
    initialFocus = 'first',
    onEscape,
    onClickOutside,
    allowOutsideClick = false,
  } = options

  const containerRef = useRef<HTMLElement>(null)
  const previouslyFocusedElement = useRef<HTMLElement | null>(null)
  // ref for internal handlers (stable, avoids stale closures)
  const isActiveRef = useRef(false)
  // reactive state exposed to consumers
  const [isActive, setIsActive] = useState(false)
  // mounted guard to avoid setState after unmount
  const mountedRef = useRef(true)

  // Track restore focus timeout to prevent memory leaks
  const restoreFocusTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  // Track initial focus timeout to prevent memory leaks
  const initialFocusTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Set mounted flag on mount/unmount
  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
      // Clean up any pending timeouts on unmount
      if (restoreFocusTimeoutRef.current) {
        clearTimeout(restoreFocusTimeoutRef.current)
      }
      if (initialFocusTimeoutRef.current) {
        clearTimeout(initialFocusTimeoutRef.current)
      }
    }
  }, [])

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
  }, [])

  /**
   * Handle keyboard events for focus trapping
   */
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // Use ref to check active state (avoids stale closure)
    if (!isActiveRef.current || !containerRef.current) return

    // Handle Escape key
    if (event.key === 'Escape') {
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
  }, [onEscape, getFocusableElements])

  /**
   * Handle clicks outside the container
   */
  const handleClickOutside = useCallback((event: MouseEvent) => {
    // Use ref to check active state (avoids stale closure)
    if (!isActiveRef.current || !containerRef.current) return

    const target = event.target as HTMLElement
    if (!containerRef.current.contains(target)) {
      if (!allowOutsideClick) {
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
      onClickOutside?.()
    }
  }, [allowOutsideClick, getFocusableElements, onClickOutside])

  /**
   * Handle focus events to ensure focus stays within container
   */
  const handleFocusIn = useCallback((event: FocusEvent) => {
    // Use ref to check active state (avoids stale closure)
    if (!isActiveRef.current || !containerRef.current) return

    const target = event.target as HTMLElement
    if (!containerRef.current.contains(target)) {
      event.preventDefault()
      event.stopPropagation()

      const focusableElements = getFocusableElements()
      if (focusableElements.length > 0) {
        focusableElements[0]?.focus()
      }
    }
  }, [getFocusableElements])

  /**
   * Set initial focus when trap is activated
   */
  const setInitialFocusElement = useCallback(() => {
    if (!containerRef.current) return

    if (initialFocus && typeof initialFocus === 'object' && initialFocus.current) {
      // initialFocus is a RefObject
      initialFocus.current.focus()
    } else if (initialFocus === 'first') {
      const focusableElements = getFocusableElements()
      if (focusableElements.length > 0) {
        focusableElements[0]?.focus()
      } else {
        // If no focusable elements, make container focusable
        containerRef.current.setAttribute('tabindex', '-1')
        containerRef.current.focus()
      }
    } else if (initialFocus === 'container') {
      containerRef.current.setAttribute('tabindex', '-1')
      containerRef.current.focus()
    }
  }, [initialFocus, getFocusableElements])

  /**
   * Activate the focus trap
   */
  const activate = useCallback(() => {
    if (!enabled || isActiveRef.current || !containerRef.current) return

    // Store the currently focused element
    previouslyFocusedElement.current = document.activeElement as HTMLElement

    // Update both ref and state
    isActiveRef.current = true
    if (mountedRef.current) {
      setIsActive(true)
    }

    // Set initial focus with a microtask delay to ensure DOM is ready.
    // This is necessary because the container element may not be fully
    // rendered or focusable immediately when activate is called.
    initialFocusTimeoutRef.current = setTimeout(setInitialFocusElement, 0)

    // Add event listeners
    document.addEventListener('keydown', handleKeyDown, true)
    document.addEventListener('mousedown', handleClickOutside, true)
    document.addEventListener('focusin', handleFocusIn, true)
  }, [enabled, setInitialFocusElement, handleKeyDown, handleClickOutside, handleFocusIn])

  /**
   * Deactivate the focus trap
   */
  const deactivate = useCallback(() => {
    if (!isActiveRef.current) return

    // Clear any pending initial focus timeout
    if (initialFocusTimeoutRef.current) {
      clearTimeout(initialFocusTimeoutRef.current)
      initialFocusTimeoutRef.current = null
    }

    // Update both ref and state
    isActiveRef.current = false
    if (mountedRef.current) {
      setIsActive(false)
    }

    // Remove event listeners
    document.removeEventListener('keydown', handleKeyDown, true)
    document.removeEventListener('mousedown', handleClickOutside, true)
    document.removeEventListener('focusin', handleFocusIn, true)

    // Return focus to the previously focused element
    if (returnFocusOnDeactivate && previouslyFocusedElement.current) {
      // Delay focus restoration to prevent the focus from being immediately
      // stolen by other elements that may be responding to the same event
      // that triggered deactivation (e.g., clicking outside the container).
      restoreFocusTimeoutRef.current = setTimeout(() => {
        previouslyFocusedElement.current?.focus()
      }, 0)
    }
  }, [returnFocusOnDeactivate, handleKeyDown, handleClickOutside, handleFocusIn])

  // Cleanup on unmount - ensure event listeners are removed
  useEffect(() => {
    return () => {
      if (isActiveRef.current) {
        document.removeEventListener('keydown', handleKeyDown, true)
        document.removeEventListener('mousedown', handleClickOutside, true)
        document.removeEventListener('focusin', handleFocusIn, true)
      }
    }
  }, [handleKeyDown, handleClickOutside, handleFocusIn])

  return {
    containerRef,
    activate,
    deactivate,
    isActive,
  }
}

// Legacy function signature for backward compatibility
export function useFocusTrapLegacy(
  containerRef: React.RefObject<HTMLElement>,
  options: {
    enabled?: boolean
    initialFocusRef?: React.RefObject<HTMLElement>
    returnFocusOnDeactivate?: boolean
    escapeDeactivates?: boolean
    onEscape?: () => void
    allowOutsideClick?: boolean
  } = {}
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
