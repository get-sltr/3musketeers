'use client'

import { useEffect, useState, useRef, useCallback, createContext, useContext } from 'react'

/**
 * Props for the AriaLiveRegion component
 */
export interface AriaLiveRegionProps {
  /** The message to announce to screen readers */
  message: string
  /** The politeness level of the announcement */
  politeness?: 'polite' | 'assertive' | 'off'
  /** Whether the entire region should be announced as a whole */
  atomic?: boolean
  /** Time in milliseconds after which the message should be cleared */
  clearAfter?: number
  /** Additional CSS class names */
  className?: string
}

/**
 * Visually hidden styles that keep content accessible to screen readers
 */
const visuallyHiddenStyles: React.CSSProperties = {
  position: 'absolute',
  width: '1px',
  height: '1px',
  padding: 0,
  margin: '-1px',
  overflow: 'hidden',
  clip: 'rect(0, 0, 0, 0)',
  whiteSpace: 'nowrap',
  border: 0,
}

/**
 * AriaLiveRegion Component
 *
 * A visually hidden component that announces dynamic content changes
 * to screen reader users. Essential for accessibility in real-time
 * applications like chat, notifications, and filter updates.
 *
 * @example
 * ```tsx
 * <AriaLiveRegion
 *   message="15 users found matching your filters"
 *   politeness="polite"
 *   clearAfter={5000}
 * />
 * ```
 */
export function AriaLiveRegion({
  message,
  politeness = 'polite',
  atomic = true,
  clearAfter,
  className = '',
}: AriaLiveRegionProps) {
  const [currentMessage, setCurrentMessage] = useState('')
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    // Update the message
    setCurrentMessage(message)

    // Set up auto-clear if specified
    if (clearAfter && message) {
      timeoutRef.current = setTimeout(() => {
        setCurrentMessage('')
      }, clearAfter)
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [message, clearAfter])

  return (
    <div
      role="status"
      aria-live={politeness}
      aria-atomic={atomic}
      className={className}
      style={visuallyHiddenStyles}
    >
      {currentMessage}
    </div>
  )
}

// ============================================================================
// Context-based announcement system for global use
// ============================================================================

interface Announcement {
  id: string
  message: string
  politeness: 'polite' | 'assertive'
  timestamp: number
}

interface AnnouncerContextValue {
  announce: (message: string, politeness?: 'polite' | 'assertive') => void
  announcePolite: (message: string) => void
  announceAssertive: (message: string) => void
}

const AnnouncerContext = createContext<AnnouncerContextValue | null>(null)

/**
 * Provider component for the global announcement system
 *
 * @example
 * ```tsx
 * // In your app layout
 * <AnnouncerProvider>
 *   <App />
 * </AnnouncerProvider>
 *
 * // In any component
 * const { announce } = useAnnouncer()
 * announce('New message received', 'assertive')
 * ```
 */
export function AnnouncerProvider({ children }: { children: React.ReactNode }) {
  const [politeMessage, setPoliteMessage] = useState('')
  const [assertiveMessage, setAssertiveMessage] = useState('')
  const politeTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const assertiveTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const announce = useCallback((message: string, politeness: 'polite' | 'assertive' = 'polite') => {
    if (politeness === 'assertive') {
      // Clear previous timeout
      if (assertiveTimeoutRef.current) {
        clearTimeout(assertiveTimeoutRef.current)
      }

      // Clear and re-set to force announcement
      setAssertiveMessage('')
      setTimeout(() => {
        setAssertiveMessage(message)
      }, 50)

      // Auto-clear after 5 seconds
      assertiveTimeoutRef.current = setTimeout(() => {
        setAssertiveMessage('')
      }, 5000)
    } else {
      // Clear previous timeout
      if (politeTimeoutRef.current) {
        clearTimeout(politeTimeoutRef.current)
      }

      // Clear and re-set to force announcement
      setPoliteMessage('')
      setTimeout(() => {
        setPoliteMessage(message)
      }, 50)

      // Auto-clear after 5 seconds
      politeTimeoutRef.current = setTimeout(() => {
        setPoliteMessage('')
      }, 5000)
    }
  }, [])

  const announcePolite = useCallback((message: string) => {
    announce(message, 'polite')
  }, [announce])

  const announceAssertive = useCallback((message: string) => {
    announce(message, 'assertive')
  }, [announce])

  const contextValue: AnnouncerContextValue = {
    announce,
    announcePolite,
    announceAssertive,
  }

  return (
    <AnnouncerContext.Provider value={contextValue}>
      {children}
      {/* Polite announcements */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        style={visuallyHiddenStyles}
      >
        {politeMessage}
      </div>
      {/* Assertive announcements */}
      <div
        role="alert"
        aria-live="assertive"
        aria-atomic="true"
        style={visuallyHiddenStyles}
      >
        {assertiveMessage}
      </div>
    </AnnouncerContext.Provider>
  )
}

/**
 * Hook to access the global announcement system
 *
 * @returns AnnouncerContextValue - returns no-op functions if used outside AnnouncerProvider
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { announce, announcePolite, announceAssertive } = useAnnouncer()
 *
 *   const handleFilterChange = () => {
 *     // Update filters...
 *     announcePolite('Showing 15 users matching your filters')
 *   }
 *
 *   const handleError = () => {
 *     announceAssertive('Error loading users. Please try again.')
 *   }
 *
 *   return // ...
 * }
 * ```
 */
export function useAnnouncer(): AnnouncerContextValue {
  const context = useContext(AnnouncerContext)

  if (!context) {
    // Return a no-op implementation if not in provider
    // This allows components to be used outside the provider context
    return {
      announce: () => {},
      announcePolite: () => {},
      announceAssertive: () => {},
    }
  }

  return context
}

// ============================================================================
// Pre-built announcement patterns for common use cases
// ============================================================================

/**
 * Hook for announcing filter results
 *
 * @example
 * ```tsx
 * const { announceResults } = useFilterAnnouncement()
 *
 * useEffect(() => {
 *   announceResults(filteredUsers.length, 'users')
 * }, [filteredUsers.length])
 * ```
 */
export function useFilterAnnouncement() {
  const { announcePolite } = useAnnouncer()

  const announceResults = useCallback((count: number, itemType: string = 'items') => {
    const message = count === 0
      ? `No ${itemType} found matching your filters`
      : count === 1
        ? `1 ${itemType.replace(/s$/, '')} found`
        : `${count} ${itemType} found`

    announcePolite(message)
  }, [announcePolite])

  const announceFilterApplied = useCallback((filterName: string) => {
    announcePolite(`${filterName} filter applied`)
  }, [announcePolite])

  const announceFilterCleared = useCallback((filterName?: string) => {
    const message = filterName
      ? `${filterName} filter cleared`
      : 'All filters cleared'
    announcePolite(message)
  }, [announcePolite])

  return {
    announceResults,
    announceFilterApplied,
    announceFilterCleared,
  }
}

/**
 * Hook for announcing loading states
 *
 * @example
 * ```tsx
 * const { announceLoading, announceLoaded, announceError } = useLoadingAnnouncement()
 *
 * useEffect(() => {
 *   if (isLoading) {
 *     announceLoading('Loading users')
 *   } else if (error) {
 *     announceError('Failed to load users')
 *   } else {
 *     announceLoaded('Users loaded successfully')
 *   }
 * }, [isLoading, error])
 * ```
 */
export function useLoadingAnnouncement() {
  const { announcePolite, announceAssertive } = useAnnouncer()

  const announceLoading = useCallback((action: string = 'Loading') => {
    announcePolite(`${action}...`)
  }, [announcePolite])

  const announceLoaded = useCallback((message: string = 'Content loaded') => {
    announcePolite(message)
  }, [announcePolite])

  const announceError = useCallback((message: string = 'An error occurred') => {
    announceAssertive(message)
  }, [announceAssertive])

  return {
    announceLoading,
    announceLoaded,
    announceError,
  }
}

export default AriaLiveRegion
