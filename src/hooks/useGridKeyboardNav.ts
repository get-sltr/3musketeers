'use client'

import { useState, useCallback, useEffect, useRef } from 'react'

/**
 * Configuration options for the useGridKeyboardNav hook
 */
export interface UseGridKeyboardNavOptions {
  /** Number of columns in the grid */
  columns: number
  /** Total number of items in the grid */
  itemCount: number
  /** Callback when an item is selected (focused) */
  onSelect?: (index: number) => void
  /** Callback when an item is activated (Enter/Space pressed) */
  onActivate?: (index: number) => void
  /** Whether navigation wraps around from last to first item */
  wrap?: boolean
  /** Whether the grid navigation is enabled */
  enabled?: boolean
  /** Initial focused index */
  initialIndex?: number
}

/**
 * Props returned by getItemProps for each grid item
 */
export interface GridItemProps {
  /** Tab index for the item (-1 for non-focused, 0 for focused) */
  tabIndex: number
  /** Keyboard event handler */
  onKeyDown: (e: React.KeyboardEvent) => void
  /** Focus event handler */
  onFocus: () => void
  /** Click event handler */
  onClick: () => void
  /** Whether the item is currently focused */
  'aria-selected': boolean
  /** Role for accessibility */
  role: 'gridcell'
  /** Reference setter for the element */
  ref: (el: HTMLElement | null) => void
}

/**
 * Return type of the useGridKeyboardNav hook
 */
export interface UseGridKeyboardNavReturn {
  /** Currently focused item index */
  focusedIndex: number
  /** Set the focused index programmatically */
  setFocusedIndex: (index: number) => void
  /** Get props for a grid item at a specific index */
  getItemProps: (index: number) => GridItemProps
  /** Get props for the grid container */
  getGridProps: () => {
    role: 'grid'
    'aria-colcount': number
    'aria-rowcount': number
    onKeyDown: (e: React.KeyboardEvent) => void
  }
  /** Move focus to a specific item */
  moveFocusTo: (index: number) => void
  /** Reset focus to the first item */
  resetFocus: () => void
}

/**
 * Custom hook for keyboard navigation in a grid layout.
 * Implements WAI-ARIA grid pattern for accessible keyboard navigation.
 *
 * @param options - Configuration options for the grid navigation
 * @returns Object containing focused state and props generators
 *
 * @example
 * ```tsx
 * function UserGrid({ users }) {
 *   const { focusedIndex, getItemProps, getGridProps } = useGridKeyboardNav({
 *     columns: 3,
 *     itemCount: users.length,
 *     onActivate: (index) => openUserProfile(users[index].id),
 *   })
 *
 *   return (
 *     <div {...getGridProps()}>
 *       {users.map((user, index) => (
 *         <div key={user.id} {...getItemProps(index)}>
 *           {user.name}
 *         </div>
 *       ))}
 *     </div>
 *   )
 * }
 * ```
 */
export function useGridKeyboardNav(
  options: UseGridKeyboardNavOptions
): UseGridKeyboardNavReturn {
  const {
    columns,
    itemCount,
    onSelect,
    onActivate,
    wrap = true,
    enabled = true,
    initialIndex = 0,
  } = options

  const [focusedIndex, setFocusedIndexState] = useState(initialIndex)
  const itemRefs = useRef<Map<number, HTMLElement>>(new Map())

  // Calculate number of rows
  const rowCount = Math.ceil(itemCount / columns)

  /**
   * Set focused index with bounds checking
   */
  const setFocusedIndex = useCallback((index: number) => {
    if (index < 0 || index >= itemCount) return
    setFocusedIndexState(index)
    onSelect?.(index)
  }, [itemCount, onSelect])

  /**
   * Move focus to a specific index and focus the element
   */
  const moveFocusTo = useCallback((index: number) => {
    if (index < 0 || index >= itemCount) return
    setFocusedIndexState(index)
    onSelect?.(index)

    // Focus the element
    const element = itemRefs.current.get(index)
    if (element) {
      element.focus()
    }
  }, [itemCount, onSelect])

  /**
   * Reset focus to the first item
   */
  const resetFocus = useCallback(() => {
    moveFocusTo(0)
  }, [moveFocusTo])

  /**
   * Calculate next index based on direction
   */
  const getNextIndex = useCallback((
    currentIndex: number,
    direction: 'up' | 'down' | 'left' | 'right' | 'home' | 'end'
  ): number => {
    const currentRow = Math.floor(currentIndex / columns)
    const currentCol = currentIndex % columns

    switch (direction) {
      case 'left': {
        if (currentCol === 0) {
          if (wrap) {
            // Wrap to end of previous row
            const prevRow = currentRow === 0 ? rowCount - 1 : currentRow - 1
            const lastColInPrevRow = prevRow === rowCount - 1
              ? (itemCount - 1) % columns
              : columns - 1
            return prevRow * columns + lastColInPrevRow
          }
          return currentIndex
        }
        return currentIndex - 1
      }

      case 'right': {
        const isLastItem = currentIndex === itemCount - 1
        const isLastInRow = currentCol === columns - 1

        if (isLastItem) {
          return wrap ? 0 : currentIndex
        }
        if (isLastInRow) {
          if (wrap) {
            // Wrap to start of next row
            return (currentRow + 1) * columns
          }
          return currentIndex
        }
        return currentIndex + 1
      }

      case 'up': {
        if (currentRow === 0) {
          if (wrap) {
            // Wrap to same column in last row
            const targetIndex = (rowCount - 1) * columns + currentCol
            return Math.min(targetIndex, itemCount - 1)
          }
          return currentIndex
        }
        return currentIndex - columns
      }

      case 'down': {
        const nextRowStart = (currentRow + 1) * columns
        const targetIndex = nextRowStart + currentCol

        if (targetIndex >= itemCount) {
          if (wrap) {
            // Wrap to same column in first row
            return currentCol
          }
          return currentIndex
        }
        return targetIndex
      }

      case 'home':
        return 0

      case 'end':
        return itemCount - 1

      default:
        return currentIndex
    }
  }, [columns, rowCount, itemCount, wrap])

  /**
   * Handle keyboard events at the grid level
   */
  const handleGridKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (!enabled) return

    let handled = true
    let nextIndex = focusedIndex

    switch (event.key) {
      case 'ArrowLeft':
        nextIndex = getNextIndex(focusedIndex, 'left')
        break
      case 'ArrowRight':
        nextIndex = getNextIndex(focusedIndex, 'right')
        break
      case 'ArrowUp':
        nextIndex = getNextIndex(focusedIndex, 'up')
        break
      case 'ArrowDown':
        nextIndex = getNextIndex(focusedIndex, 'down')
        break
      case 'Home':
        nextIndex = event.ctrlKey ? 0 : Math.floor(focusedIndex / columns) * columns
        break
      case 'End':
        if (event.ctrlKey) {
          nextIndex = itemCount - 1
        } else {
          const rowStart = Math.floor(focusedIndex / columns) * columns
          nextIndex = Math.min(rowStart + columns - 1, itemCount - 1)
        }
        break
      case 'Enter':
      case ' ':
        event.preventDefault()
        onActivate?.(focusedIndex)
        return
      default:
        handled = false
    }

    if (handled) {
      event.preventDefault()
      if (nextIndex !== focusedIndex) {
        moveFocusTo(nextIndex)
      }
    }
  }, [enabled, focusedIndex, columns, itemCount, getNextIndex, moveFocusTo, onActivate])

  /**
   * Handle keyboard events at the item level
   */
  const handleItemKeyDown = useCallback((index: number) => (event: React.KeyboardEvent) => {
    if (!enabled) return

    // Activate on Enter or Space
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      onActivate?.(index)
    }
  }, [enabled, onActivate])

  /**
   * Handle focus event on an item
   */
  const handleItemFocus = useCallback((index: number) => () => {
    setFocusedIndexState(index)
    onSelect?.(index)
  }, [onSelect])

  /**
   * Handle click event on an item
   */
  const handleItemClick = useCallback((index: number) => () => {
    setFocusedIndexState(index)
    onSelect?.(index)
    onActivate?.(index)
  }, [onSelect, onActivate])

  /**
   * Get props for a grid item
   */
  const getItemProps = useCallback((index: number): GridItemProps => ({
    tabIndex: index === focusedIndex ? 0 : -1,
    onKeyDown: handleItemKeyDown(index),
    onFocus: handleItemFocus(index),
    onClick: handleItemClick(index),
    'aria-selected': index === focusedIndex,
    role: 'gridcell',
    ref: (el: HTMLElement | null) => {
      if (el) {
        itemRefs.current.set(index, el)
      } else {
        itemRefs.current.delete(index)
      }
    },
  }), [focusedIndex, handleItemKeyDown, handleItemFocus, handleItemClick])

  /**
   * Get props for the grid container
   */
  const getGridProps = useCallback(() => ({
    role: 'grid' as const,
    'aria-colcount': columns,
    'aria-rowcount': rowCount,
    onKeyDown: handleGridKeyDown,
  }), [columns, rowCount, handleGridKeyDown])

  // Reset focused index if item count changes and current index is out of bounds
  useEffect(() => {
    if (focusedIndex >= itemCount && itemCount > 0) {
      setFocusedIndexState(itemCount - 1)
    }
  }, [itemCount, focusedIndex])

  return {
    focusedIndex,
    setFocusedIndex,
    getItemProps,
    getGridProps,
    moveFocusTo,
    resetFocus,
  }
}

export default useGridKeyboardNav
