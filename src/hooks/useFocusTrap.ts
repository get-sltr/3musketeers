'use client'

import { useRef, useEffect, useCallback, RefObject, useState } from 'react'

interface UseFocusTrapOptions {
  enabled?: boolean
  returnFocusOnDeactivate?: boolean
  initialFocus?: RefObject<HTMLElement> | 'first' | 'container'
  onEscape?: () => void
  onClickOutside?: () => void
  allowOutsideClick?: boolean
}

interface UseFocusTrapReturn {
  containerRef: RefObject<HTMLDivElement>
  activate: () => void
  deactivate: () => void
  isActive: boolean
}

/**
 * Custom hook for trapping focus within a container element.
 * Useful for modals, dialogs, and other overlay components.
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

  const containerRef = useRef<HTMLDivElement>(null)
  const previouslyFocusedElement = useRef<HTMLElement | null>(null)
  // ref for internal handlers (stable, avoids stale closures)
  const isActiveRef = useRef(false)
  // reactive state exposed to consumers
  const [isActive, setIsActive] = useState(false)
  // mounted guard to avoid setState after unmount
  const mountedRef = useRef(true)
  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
    }
  }, [])

  // Track restore focus timeout to prevent memory leaks
  const restoreFocusTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Get all focusable elements within the container
  const getFocusableElements = useCallback((): HTMLElement[] => {
    if (!containerRef.current) return []

    const focusableSelectors = [
      'a[href]',
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
      'audio[controls]',
      'video[controls]',
      '[contenteditable]:not([contenteditable="false"])',
    ].join(', ')

    const elements = containerRef.current.querySelectorAll<HTMLElement>(focusableSelectors)
    return Array.from(elements).filter(
      (el) => !el.hasAttribute('disabled') && el.offsetParent !== null
    )
  }, [])

  // Focus the first focusable element
  const focusFirstElement = useCallback(() => {
    const focusableElements = getFocusableElements()
    const firstEl = focusableElements[0]
    if (firstEl) {
      firstEl.focus()
    } else {
      // If no focusable elements, focus the container itself
      containerRef.current?.focus()
    }
  }, [getFocusableElements])

  // Handle initial focus based on options
  const handleInitialFocus = useCallback(() => {
    if (!containerRef.current) return

    if (initialFocus === 'container') {
      containerRef.current.focus()
    } else if (initialFocus === 'first') {
      focusFirstElement()
    } else if (initialFocus && 'current' in initialFocus && initialFocus.current) {
      initialFocus.current.focus()
    } else {
      focusFirstElement()
    }
  }, [initialFocus, focusFirstElement])

  // Activate focus trap
  const activate = useCallback(() => {
    if (isActiveRef.current) return

    // Store currently focused element
    previouslyFocusedElement.current = document.activeElement as HTMLElement
    isActiveRef.current = true
    if (mountedRef.current) setIsActive(true)

    // Focus initial element after a small delay to ensure DOM is ready
    requestAnimationFrame(() => {
      handleInitialFocus()
    })
  }, [handleInitialFocus])

  // Deactivate focus trap
  const deactivate = useCallback(() => {
    if (!isActiveRef.current) return

    isActiveRef.current = false
    if (mountedRef.current) setIsActive(false)

    // Clear any pending restore focus timeout
    if (restoreFocusTimeoutRef.current) {
      clearTimeout(restoreFocusTimeoutRef.current)
      restoreFocusTimeoutRef.current = null
    }

    // Return focus to previously focused element
    if (returnFocusOnDeactivate && previouslyFocusedElement.current) {
      restoreFocusTimeoutRef.current = setTimeout(() => {
        previouslyFocusedElement.current?.focus()
        restoreFocusTimeoutRef.current = null
      }, 0)
    }
  }, [returnFocusOnDeactivate])

  // Main effect for activating/deactivating the focus trap
  useEffect(() => {
    if (!enabled || !containerRef.current) return

    // Clear any pending restore focus timeout from previous activation
    if (restoreFocusTimeoutRef.current) {
      clearTimeout(restoreFocusTimeoutRef.current)
      restoreFocusTimeoutRef.current = null
    }

    // Store currently focused element before trapping
    previouslyFocusedElement.current = document.activeElement as HTMLElement
    isActiveRef.current = true
    if (mountedRef.current) setIsActive(true)

    // Handle initial focus with a small delay
    const timeoutId = setTimeout(() => {
      handleInitialFocus()
    }, 0)

    // Handle Tab key to trap focus
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isActiveRef.current || !containerRef.current) return

      // Handle Escape key
      if (event.key === 'Escape' && onEscape) {
        event.preventDefault()
        event.stopPropagation()
        onEscape()
        return
      }

      // Handle Tab key
      if (event.key === 'Tab') {
        const focusableElements = getFocusableElements()
        if (focusableElements.length === 0) {
          event.preventDefault()
          return
        }

        const firstElement = focusableElements[0]
        const lastElement = focusableElements[focusableElements.length - 1]
        const activeElement = document.activeElement

        if (event.shiftKey) {
          // Shift + Tab: Move backwards
          if (activeElement === firstElement || !containerRef.current.contains(activeElement)) {
            event.preventDefault()
            lastElement?.focus()
          }
        } else {
          // Tab: Move forwards
          if (activeElement === lastElement || !containerRef.current.contains(activeElement)) {
            event.preventDefault()
            firstElement?.focus()
          }
        }
      }
    }

    // Handle click outside
    const handleClickOutside = (event: MouseEvent) => {
      if (!isActiveRef.current || !containerRef.current) return

      const target = event.target as Node
      if (!containerRef.current.contains(target)) {
        if (!allowOutsideClick) {
          event.preventDefault()
          event.stopPropagation()
        }
        if (onClickOutside) {
          onClickOutside()
        }
      }
    }

    // Prevent focus from leaving the container
    const handleFocusIn = (event: FocusEvent) => {
      if (!isActiveRef.current || !containerRef.current) return

      const target = event.target as Node
      if (!containerRef.current.contains(target)) {
        event.preventDefault()
        event.stopPropagation()
        focusFirstElement()
      }
    }

    // Add event listeners (capture phase for priority)
    document.addEventListener('keydown', handleKeyDown, true)
    document.addEventListener('mousedown', handleClickOutside, true)
    document.addEventListener('focusin', handleFocusIn, true)

    // Cleanup
    return () => {
      clearTimeout(timeoutId)
      document.removeEventListener('keydown', handleKeyDown, true)
      document.removeEventListener('mousedown', handleClickOutside, true)
      document.removeEventListener('focusin', handleFocusIn, true)

      isActiveRef.current = false
      if (mountedRef.current) setIsActive(false)

      // Return focus to the previously focused element
      if (returnFocusOnDeactivate && previouslyFocusedElement.current) {
        restoreFocusTimeoutRef.current = setTimeout(() => {
          previouslyFocusedElement.current?.focus()
          restoreFocusTimeoutRef.current = null
        }, 0)
      }
    }
  }, [
    enabled,
    returnFocusOnDeactivate,
    onEscape,
    onClickOutside,
    allowOutsideClick,
    getFocusableElements,
    focusFirstElement,
    handleInitialFocus,
  ])

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (restoreFocusTimeoutRef.current) {
        clearTimeout(restoreFocusTimeoutRef.current)
        restoreFocusTimeoutRef.current = null
      }
    }
  }, [])

  return {
    containerRef,
    activate,
    deactivate,
    isActive,
  }
}

export default useFocusTrap
