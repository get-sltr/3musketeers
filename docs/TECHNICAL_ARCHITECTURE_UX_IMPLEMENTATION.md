# Technical Architecture: UX Implementation Plan

> **Tech Lead Architecture Document**
> Based on UX Audit Report | Overall Score: 66/100
> Created: 2025-12-02
> Branch: `claude/tech-lead-architecture-01Aen6Xh4sNg28WCrAKcQabK`

---

## Executive Summary

This document provides the technical architecture and implementation specifications to address findings from the comprehensive UX audit. The focus is on three critical areas:

| Priority | Area | Current Score | Target Score | Effort |
|----------|------|---------------|--------------|--------|
| P0 | Accessibility | 40/100 | 85/100 | 2-3 weeks |
| P1 | Design System | 75/100 | 90/100 | 1 week |
| P2 | Documentation | 55/100 | 80/100 | 2 weeks |

**Critical Path**: Accessibility fixes are blocking ~15% of potential users and carry legal/ethical implications.

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Accessibility Infrastructure](#2-accessibility-infrastructure)
3. [Design System Consolidation](#3-design-system-consolidation)
4. [Route Configuration Architecture](#4-route-configuration-architecture)
5. [Component Documentation Standards](#5-component-documentation-standards)
6. [Testing Infrastructure](#6-testing-infrastructure)
7. [Implementation Roadmap](#7-implementation-roadmap)
8. [Handoff Specifications](#8-handoff-specifications)

---

## 1. Architecture Overview

### Current State Analysis

```
┌─────────────────────────────────────────────────────────────────┐
│                     SLTR Frontend Architecture                   │
├─────────────────────────────────────────────────────────────────┤
│  Next.js 14.2.33 (App Router) + TypeScript 5.4.5               │
│  ├── 43 Pages (src/app/**/page.tsx)                            │
│  ├── 57 Components (src/components/*.tsx)                       │
│  ├── 24 Custom Hooks (src/hooks/*.ts)                          │
│  ├── 6 Zustand Stores (src/stores/*.ts)                        │
│  └── 7 CSS Files (src/styles/*.css + globals.css)              │
├─────────────────────────────────────────────────────────────────┤
│  Key Gaps Identified:                                           │
│  • No accessibility hooks (focus trap, screen reader, keyboard) │
│  • Conflicting CSS palettes (lime vs cyan-magenta)              │
│  • Missing store exports (useLiveKitStore, usePresenceStore)    │
│  • 0 ARIA attributes in modal components                        │
└─────────────────────────────────────────────────────────────────┘
```

### Technology Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Focus Trap | Custom hook | Avoid new dependencies; team expertise in hooks |
| Keyboard Nav | Custom hook | Full control over grid navigation patterns |
| Design Tokens | CSS Variables + Tailwind | Already established pattern; extend it |
| Component Docs | JSDoc + Storybook | Industry standard; enables visual testing |
| A11y Testing | jest-axe + ESLint plugin | Automated testing in CI/CD |

---

## 2. Accessibility Infrastructure

### 2.1 Focus Trap Implementation

**File**: `src/hooks/useFocusTrap.ts`

```typescript
/**
 * useFocusTrap - Traps keyboard focus within a container element
 *
 * @description Implements WCAG 2.1 focus management for modal dialogs.
 * Focus is trapped on mount and restored to the trigger element on unmount.
 *
 * @param containerRef - React ref to the container element
 * @param options - Configuration options
 * @returns void
 *
 * @example
 * const modalRef = useRef<HTMLDivElement>(null)
 * useFocusTrap(modalRef, { enabled: isOpen, onEscape: onClose })
 */
import { useEffect, useRef, RefObject } from 'react'

interface FocusTrapOptions {
  /** Enable/disable the focus trap */
  enabled?: boolean
  /** Callback when Escape key is pressed */
  onEscape?: () => void
  /** Initial element to focus (selector or element) */
  initialFocus?: string | HTMLElement
  /** Return focus to trigger element on unmount */
  returnFocus?: boolean
}

const FOCUSABLE_SELECTORS = [
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  'a[href]',
  '[tabindex]:not([tabindex="-1"])',
  '[contenteditable="true"]',
].join(', ')

export function useFocusTrap(
  containerRef: RefObject<HTMLElement>,
  options: FocusTrapOptions = {}
): void {
  const {
    enabled = true,
    onEscape,
    initialFocus,
    returnFocus = true,
  } = options

  const previousActiveElement = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (!enabled || !containerRef.current) return

    // Store the currently focused element to restore later
    previousActiveElement.current = document.activeElement as HTMLElement

    const container = containerRef.current
    const focusableElements = container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTORS)
    const firstFocusable = focusableElements[0]
    const lastFocusable = focusableElements[focusableElements.length - 1]

    // Set initial focus
    if (initialFocus) {
      const target = typeof initialFocus === 'string'
        ? container.querySelector<HTMLElement>(initialFocus)
        : initialFocus
      target?.focus()
    } else {
      firstFocusable?.focus()
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && onEscape) {
        event.preventDefault()
        onEscape()
        return
      }

      if (event.key !== 'Tab') return

      // Re-query in case DOM changed
      const currentFocusables = container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTORS)
      const first = currentFocusables[0]
      const last = currentFocusables[currentFocusables.length - 1]

      if (event.shiftKey) {
        // Shift+Tab: if on first element, wrap to last
        if (document.activeElement === first) {
          event.preventDefault()
          last?.focus()
        }
      } else {
        // Tab: if on last element, wrap to first
        if (document.activeElement === last) {
          event.preventDefault()
          first?.focus()
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)

      // Restore focus to the previously focused element
      if (returnFocus && previousActiveElement.current) {
        previousActiveElement.current.focus()
      }
    }
  }, [enabled, containerRef, onEscape, initialFocus, returnFocus])
}

export default useFocusTrap
```

### 2.2 Aria Live Region Component

**File**: `src/components/ui/AriaLiveRegion.tsx`

```typescript
/**
 * AriaLiveRegion - Announces dynamic content changes to screen readers
 *
 * @description Creates an ARIA live region that announces messages to
 * assistive technologies. Supports both polite and assertive announcements.
 *
 * @example
 * <AriaLiveRegion>
 *   {newMessageCount > 0 && `${newMessageCount} new messages`}
 * </AriaLiveRegion>
 */
'use client'

import { createContext, useContext, useState, useCallback, ReactNode } from 'react'

interface AriaLiveContextType {
  announce: (message: string, priority?: 'polite' | 'assertive') => void
}

const AriaLiveContext = createContext<AriaLiveContextType | null>(null)

export function useAriaLive(): AriaLiveContextType {
  const context = useContext(AriaLiveContext)
  if (!context) {
    throw new Error('useAriaLive must be used within AriaLiveProvider')
  }
  return context
}

interface AriaLiveProviderProps {
  children: ReactNode
}

export function AriaLiveProvider({ children }: AriaLiveProviderProps) {
  const [politeMessage, setPoliteMessage] = useState('')
  const [assertiveMessage, setAssertiveMessage] = useState('')

  const announce = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    if (priority === 'assertive') {
      setAssertiveMessage('')
      // Force re-render with timeout to ensure announcement
      setTimeout(() => setAssertiveMessage(message), 50)
    } else {
      setPoliteMessage('')
      setTimeout(() => setPoliteMessage(message), 50)
    }
  }, [])

  return (
    <AriaLiveContext.Provider value={{ announce }}>
      {children}

      {/* Polite announcements (waits for user to finish current task) */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {politeMessage}
      </div>

      {/* Assertive announcements (interrupts immediately) */}
      <div
        role="alert"
        aria-live="assertive"
        aria-atomic="true"
        className="sr-only"
      >
        {assertiveMessage}
      </div>
    </AriaLiveContext.Provider>
  )
}

// CSS class for screen reader only content
// Add to globals.css:
// .sr-only {
//   position: absolute;
//   width: 1px;
//   height: 1px;
//   padding: 0;
//   margin: -1px;
//   overflow: hidden;
//   clip: rect(0, 0, 0, 0);
//   white-space: nowrap;
//   border: 0;
// }
```

### 2.3 Keyboard Navigation Hook

**File**: `src/hooks/useGridKeyboardNav.ts`

```typescript
/**
 * useGridKeyboardNav - Arrow key navigation for grid layouts
 *
 * @description Enables keyboard navigation in grid views using arrow keys.
 * Implements roving tabindex pattern for optimal accessibility.
 *
 * @example
 * const { containerProps, getItemProps, focusedIndex } = useGridKeyboardNav({
 *   itemCount: users.length,
 *   columns: 3,
 *   onSelect: (index) => openProfile(users[index])
 * })
 */
import { useCallback, useState, KeyboardEvent } from 'react'

interface GridKeyboardNavOptions {
  /** Total number of items in the grid */
  itemCount: number
  /** Number of columns in the grid */
  columns: number
  /** Callback when an item is selected (Enter/Space) */
  onSelect?: (index: number) => void
  /** Initial focused index */
  initialIndex?: number
  /** Enable wrap-around navigation */
  wrap?: boolean
}

interface GridKeyboardNavReturn {
  /** Props to spread on the container element */
  containerProps: {
    role: 'grid'
    'aria-label': string
    tabIndex: number
    onKeyDown: (e: KeyboardEvent) => void
  }
  /** Function to get props for each grid item */
  getItemProps: (index: number) => {
    role: 'gridcell'
    tabIndex: number
    'aria-selected': boolean
    onFocus: () => void
    onClick: () => void
  }
  /** Currently focused item index */
  focusedIndex: number
  /** Programmatically set focused index */
  setFocusedIndex: (index: number) => void
}

export function useGridKeyboardNav(options: GridKeyboardNavOptions): GridKeyboardNavReturn {
  const { itemCount, columns, onSelect, initialIndex = 0, wrap = true } = options
  const [focusedIndex, setFocusedIndex] = useState(initialIndex)

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    const rows = Math.ceil(itemCount / columns)
    const currentRow = Math.floor(focusedIndex / columns)
    const currentCol = focusedIndex % columns

    let newIndex = focusedIndex

    switch (e.key) {
      case 'ArrowRight':
        e.preventDefault()
        if (currentCol < columns - 1 && focusedIndex < itemCount - 1) {
          newIndex = focusedIndex + 1
        } else if (wrap && currentRow < rows - 1) {
          newIndex = (currentRow + 1) * columns
        }
        break

      case 'ArrowLeft':
        e.preventDefault()
        if (currentCol > 0) {
          newIndex = focusedIndex - 1
        } else if (wrap && currentRow > 0) {
          newIndex = currentRow * columns - 1
        }
        break

      case 'ArrowDown':
        e.preventDefault()
        if (focusedIndex + columns < itemCount) {
          newIndex = focusedIndex + columns
        } else if (wrap) {
          newIndex = currentCol
        }
        break

      case 'ArrowUp':
        e.preventDefault()
        if (focusedIndex - columns >= 0) {
          newIndex = focusedIndex - columns
        } else if (wrap) {
          const lastRowStart = (rows - 1) * columns
          newIndex = Math.min(lastRowStart + currentCol, itemCount - 1)
        }
        break

      case 'Home':
        e.preventDefault()
        newIndex = e.ctrlKey ? 0 : currentRow * columns
        break

      case 'End':
        e.preventDefault()
        newIndex = e.ctrlKey
          ? itemCount - 1
          : Math.min((currentRow + 1) * columns - 1, itemCount - 1)
        break

      case 'Enter':
      case ' ':
        e.preventDefault()
        onSelect?.(focusedIndex)
        return
    }

    if (newIndex !== focusedIndex && newIndex >= 0 && newIndex < itemCount) {
      setFocusedIndex(newIndex)
      // Focus the element
      const gridItem = document.querySelector(`[data-grid-index="${newIndex}"]`) as HTMLElement
      gridItem?.focus()
    }
  }, [focusedIndex, itemCount, columns, wrap, onSelect])

  const containerProps = {
    role: 'grid' as const,
    'aria-label': 'User grid',
    tabIndex: -1,
    onKeyDown: handleKeyDown,
  }

  const getItemProps = useCallback((index: number) => ({
    role: 'gridcell' as const,
    tabIndex: index === focusedIndex ? 0 : -1,
    'aria-selected': index === focusedIndex,
    'data-grid-index': index,
    onFocus: () => setFocusedIndex(index),
    onClick: () => {
      setFocusedIndex(index)
      onSelect?.(index)
    },
  }), [focusedIndex, onSelect])

  return {
    containerProps,
    getItemProps,
    focusedIndex,
    setFocusedIndex,
  }
}

export default useGridKeyboardNav
```

### 2.4 Modal Component Updates

**Required changes to existing modals** (UserProfileModal, MessagingModal, etc.):

```typescript
// Example: Updated UserProfileModal.tsx pattern

import { useRef } from 'react'
import { useFocusTrap } from '@/hooks/useFocusTrap'
import { useAriaLive } from '@/components/ui/AriaLiveRegion'

export default function UserProfileModal({ user, isOpen, onClose, ... }) {
  const modalRef = useRef<HTMLDivElement>(null)
  const { announce } = useAriaLive()

  // Enable focus trap when modal is open
  useFocusTrap(modalRef, {
    enabled: isOpen,
    onEscape: onClose,
    initialFocus: '[data-autofocus]',
    returnFocus: true,
  })

  // Announce modal opening to screen readers
  useEffect(() => {
    if (isOpen && user) {
      announce(`Viewing profile for ${user.username}`)
    }
  }, [isOpen, user, announce])

  if (!isOpen) return null

  return (
    <div
      ref={modalRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="profile-modal-title"
      aria-describedby="profile-modal-description"
      className="fixed inset-0 z-50 bg-black"
    >
      {/* Visually hidden title for screen readers */}
      <h2 id="profile-modal-title" className="sr-only">
        {user.username}'s Profile
      </h2>
      <p id="profile-modal-description" className="sr-only">
        View {user.username}'s profile photos, bio, and actions
      </p>

      {/* Close button with proper labeling */}
      <button
        onClick={onClose}
        aria-label="Close profile"
        data-autofocus
        className="..."
      >
        {/* ... */}
      </button>

      {/* Rest of modal content */}
    </div>
  )
}
```

### 2.5 Accessibility CSS Additions

**Add to `src/app/globals.css`**:

```css
/* ============================================================================
   ACCESSIBILITY UTILITIES
   ============================================================================ */

/* Screen reader only - visually hidden but accessible */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

/* Show on focus (for skip links) */
.sr-only-focusable:focus,
.sr-only-focusable:focus-within {
  position: static;
  width: auto;
  height: auto;
  padding: inherit;
  margin: inherit;
  overflow: visible;
  clip: auto;
  white-space: normal;
}

/* Focus visible styles (enhanced for accessibility) */
:focus-visible {
  outline: 2px solid var(--sltr-primary, #00ff88);
  outline-offset: 2px;
}

/* Skip to main content link */
.skip-link {
  position: absolute;
  top: -40px;
  left: 0;
  background: var(--sltr-primary, #00ff88);
  color: #0a1628;
  padding: 8px 16px;
  z-index: 10000;
  font-weight: 700;
  text-decoration: none;
  border-radius: 0 0 8px 0;
  transition: top 0.3s ease;
}

.skip-link:focus {
  top: 0;
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}

/* High contrast mode support */
@media (prefers-contrast: high) {
  .glass-bubble,
  .glass-card {
    border-width: 2px;
    border-color: currentColor;
  }

  button:focus-visible {
    outline-width: 3px;
  }
}
```

---

## 3. Design System Consolidation

### 3.1 Current State Analysis

```
CSS Files Status:
├── src/app/globals.css          ✅ ACTIVE (Primary - lime #00ff88)
├── src/styles/SLTRMapPin.css    ✅ ACTIVE (Map-specific)
├── src/styles/FounderCard.css   ✅ ACTIVE (Component-specific)
├── src/styles/mobile-optimization.css  ⚠️ CONFLICT (Uses cyan-magenta)
├── src/styles/style.css         ❌ ORPHANED (Not imported)
├── src/styles/ultramodern.css   ❌ ORPHANED (Not imported)
└── src/styles/uv-effects.css    ❌ ORPHANED (Not imported)
```

### 3.2 Color Palette Resolution

**Problem**: `mobile-optimization.css` uses cyan-magenta gradients that conflict with the lime primary color.

**Solution**: Update `mobile-optimization.css` to use CSS variables.

**File Changes**: `src/styles/mobile-optimization.css`

```css
/* BEFORE - Hardcoded colors */
.logo-button {
  background: linear-gradient(45deg, #00d4ff, #ff00ff);
}

/* AFTER - Using CSS variables */
.logo-button {
  background: linear-gradient(135deg, var(--sltr-primary, #00ff88), var(--sltr-primary-dark, #00cc6a));
}

/* Or for gradient accent effects */
.logo-button {
  background: var(--sltr-gradient-primary);
}
```

### 3.3 Design Tokens Configuration

**File**: `src/config/design-tokens.ts`

```typescript
/**
 * SLTR Design Tokens
 *
 * Single source of truth for all design values.
 * These tokens are used to generate CSS variables and Tailwind config.
 */

export const designTokens = {
  colors: {
    primary: {
      DEFAULT: '#00ff88',
      dark: '#00cc6a',
      light: '#88ffaa',
    },
    secondary: {
      cyan: '#00d4ff',
      magenta: '#ff00ff',
    },
    navy: {
      DEFAULT: '#0a1628',
      light: '#0d1b2a',
      dark: '#061018',
      card: '#1b2838',
    },
    semantic: {
      success: '#00ff88',
      warning: '#ffaa00',
      danger: '#ff4444',
      info: '#00d4ff',
    },
    glass: {
      bg: 'rgba(255, 255, 255, 0.05)',
      bgHover: 'rgba(255, 255, 255, 0.1)',
      border: 'rgba(255, 255, 255, 0.1)',
      borderHover: 'rgba(0, 255, 136, 0.4)',
    },
  },

  spacing: {
    xs: '0.25rem',   // 4px
    sm: '0.5rem',    // 8px
    md: '1rem',      // 16px
    lg: '1.5rem',    // 24px
    xl: '2rem',      // 32px
    '2xl': '3rem',   // 48px
    '3xl': '4rem',   // 64px
  },

  borderRadius: {
    sm: '0.375rem',  // 6px
    md: '0.5rem',    // 8px
    lg: '0.75rem',   // 12px
    xl: '1rem',      // 16px
    '2xl': '1.5rem', // 24px
    full: '9999px',
  },

  typography: {
    fontFamily: {
      sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'system-ui', 'sans-serif'],
      display: ['Orbitron', 'system-ui', 'sans-serif'],
    },
    fontSize: {
      xs: ['0.75rem', { lineHeight: '1rem' }],
      sm: ['0.875rem', { lineHeight: '1.25rem' }],
      base: ['1rem', { lineHeight: '1.5rem' }],
      lg: ['1.125rem', { lineHeight: '1.75rem' }],
      xl: ['1.25rem', { lineHeight: '1.75rem' }],
      '2xl': ['1.5rem', { lineHeight: '2rem' }],
    },
  },

  shadows: {
    sm: '0 1px 2px rgba(0, 0, 0, 0.4)',
    md: '0 4px 12px rgba(0, 0, 0, 0.4)',
    lg: '0 8px 32px rgba(0, 0, 0, 0.6)',
    glow: {
      primary: '0 0 20px rgba(0, 255, 136, 0.5)',
      secondary: '0 0 20px rgba(0, 212, 255, 0.5)',
    },
  },

  transitions: {
    fast: '150ms ease-out',
    normal: '300ms ease-out',
    slow: '500ms ease-out',
    bounce: '300ms cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  },

  zIndex: {
    dropdown: 50,
    sticky: 100,
    modal: 200,
    popover: 300,
    tooltip: 400,
    toast: 500,
  },
} as const

export type DesignTokens = typeof designTokens
```

### 3.4 CSS Variables Update

**Add to `src/app/globals.css`**:

```css
:root {
  /* ============================================================================
     DESIGN TOKENS - Single Source of Truth
     ============================================================================ */

  /* Primary Colors */
  --sltr-primary: #00ff88;
  --sltr-primary-dark: #00cc6a;
  --sltr-primary-light: #88ffaa;

  /* Secondary Colors (for accents only) */
  --sltr-cyan: #00d4ff;
  --sltr-magenta: #ff00ff;

  /* Navy Theme */
  --sltr-navy: #0a1628;
  --sltr-navy-light: #0d1b2a;
  --sltr-navy-dark: #061018;
  --sltr-navy-card: #1b2838;

  /* Semantic Colors */
  --sltr-success: #00ff88;
  --sltr-warning: #ffaa00;
  --sltr-danger: #ff4444;
  --sltr-info: #00d4ff;

  /* Glass Effects */
  --glass-bg: rgba(255, 255, 255, 0.05);
  --glass-bg-hover: rgba(255, 255, 255, 0.1);
  --glass-border: rgba(255, 255, 255, 0.1);
  --glass-border-hover: rgba(0, 255, 136, 0.4);

  /* Gradients */
  --sltr-gradient-primary: linear-gradient(135deg, #00ff88, #00cc6a);
  --sltr-gradient-accent: linear-gradient(135deg, #00ff88, #ffffff);

  /* Spacing (8px base unit) */
  --space-xs: 0.25rem;
  --space-sm: 0.5rem;
  --space-md: 1rem;
  --space-lg: 1.5rem;
  --space-xl: 2rem;
  --space-2xl: 3rem;
  --space-3xl: 4rem;

  /* Border Radius */
  --radius-sm: 0.375rem;
  --radius-md: 0.5rem;
  --radius-lg: 0.75rem;
  --radius-xl: 1rem;
  --radius-2xl: 1.5rem;
  --radius-full: 9999px;

  /* Shadows */
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.4);
  --shadow-md: 0 4px 12px rgba(0, 0, 0, 0.4);
  --shadow-lg: 0 8px 32px rgba(0, 0, 0, 0.6);
  --shadow-glow: 0 0 20px rgba(0, 255, 136, 0.5);

  /* Transitions */
  --transition-fast: 150ms ease-out;
  --transition-normal: 300ms ease-out;
  --transition-slow: 500ms ease-out;
  --transition-bounce: 300ms cubic-bezier(0.68, -0.55, 0.265, 1.55);

  /* Layout */
  --header-height: 64px;
  --bottom-nav-height: 64px;
  --filter-bar-height: 56px;

  /* Combined sticky UI height for content padding */
  --sticky-ui-height: calc(var(--header-height) + var(--filter-bar-height));
}
```

### 3.5 Files to Remove (Orphaned)

These files are not imported anywhere and should be archived or removed:

```bash
# Archive orphaned CSS files
mkdir -p src/styles/_archived
mv src/styles/style.css src/styles/_archived/
mv src/styles/ultramodern.css src/styles/_archived/
mv src/styles/uv-effects.css src/styles/_archived/
```

---

## 4. Route Configuration Architecture

### 4.1 Centralized Route Configuration

**File**: `src/config/routes.ts`

```typescript
/**
 * SLTR Route Configuration
 *
 * Single source of truth for all application routes.
 * Provides type-safe route building and navigation.
 */

export const routes = {
  // Authentication
  auth: {
    login: '/login',
    signup: '/signup',
    forgotPassword: '/forgot-password',
    resetPassword: '/reset-password',
    verify: '/verify',
    verifyCode: (code: string) => `/verify/${code}`,
    callback: '/auth/callback',
  },

  // Core Features
  home: '/',
  app: '/app',
  holoMap: '/holo-map',

  // User
  profile: {
    own: '/profile',
    user: (userId: string) => `/profile/${userId}`,
    settings: '/settings',
    security: '/security',
  },

  // Social
  messages: {
    list: '/messages',
    conversation: (id: string) => `/messages/${id}`,
  },
  taps: '/taps',
  viewed: '/viewed',
  blockedUsers: '/blocked-users',

  // Groups & Channels
  groups: {
    list: '/groups',
    detail: (id: string) => `/groups/${id}`,
    channels: {
      list: '/groups/channels',
      detail: (id: string) => `/groups/channels/${id}`,
    },
  },
  channels: {
    detail: (id: string) => `/channels/${id}`,
  },

  // Places
  places: {
    detail: (id: string) => `/places/${id}`,
  },

  // Premium
  pricing: '/pricing',
  sltrPlus: '/sltr-plus',
  checkout: (tier: string) => `/checkout/${tier}`,
  foundersCircle: '/founders-circle',
  blackCard: (cardNumber: string) => `/black-card/${cardNumber}`,
  paymentSuccess: '/payment-success',

  // Admin
  admin: {
    blackCards: '/admin/black-cards',
  },

  // Legal & Help
  terms: '/terms',
  privacy: '/privacy',
  guidelines: '/guidelines',
  cookies: '/cookies',
  legal: '/legal',
  help: '/help',

  // Utility
  comingSoon: '/coming-soon',
  offline: '/offline',
} as const

// Type-safe route helper
export type AppRoutes = typeof routes

// Navigation type guard
export function isValidRoute(path: string): boolean {
  const flatRoutes = flattenRoutes(routes)
  return flatRoutes.some(route =>
    typeof route === 'function' ? true : route === path
  )
}

// Helper to flatten routes for validation
function flattenRoutes(obj: Record<string, unknown>, prefix = ''): string[] {
  return Object.entries(obj).flatMap(([key, value]) => {
    if (typeof value === 'string') return [value]
    if (typeof value === 'function') return []
    if (typeof value === 'object' && value !== null) {
      return flattenRoutes(value as Record<string, unknown>, `${prefix}${key}/`)
    }
    return []
  })
}
```

### 4.2 Navigation Patterns Documentation

**Modal vs Page Navigation Rules**:

| Content Type | Navigation Pattern | Example |
|--------------|-------------------|---------|
| Quick preview | Modal overlay | User profile preview from grid |
| Full interaction | Page navigation | Full conversation view |
| Action confirmation | Modal dialog | Block/report confirmation |
| Form input | Modal or page | Depends on complexity |
| Settings/Config | Page navigation | User settings |

```typescript
// Example: Modal to Page transition pattern
function UserCard({ user }) {
  const router = useRouter()

  const handleQuickView = () => {
    // Modal for quick preview
    openProfile(user)
  }

  const handleFullView = () => {
    // Page for full interaction
    router.push(routes.profile.user(user.id))
  }

  return (
    <div>
      <button onClick={handleQuickView}>Quick View</button>
      <button onClick={handleFullView}>Full Profile</button>
    </div>
  )
}
```

---

## 5. Component Documentation Standards

### 5.1 JSDoc Template

All components must include JSDoc documentation following this template:

```typescript
/**
 * ComponentName - Brief description (max 80 chars)
 *
 * @description Detailed description of the component's purpose,
 * behavior, and any important implementation details.
 *
 * @accessibility
 * - Focus management: [describe focus behavior]
 * - Keyboard support: [list supported keys]
 * - Screen reader: [describe announcements]
 *
 * @example
 * // Basic usage
 * <ComponentName prop1="value" onAction={handler} />
 *
 * @example
 * // With optional props
 * <ComponentName
 *   prop1="value"
 *   variant="secondary"
 *   disabled={isLoading}
 * />
 *
 * @see {@link RelatedComponent} for related functionality
 * @see {@link https://example.com/docs} for design specs
 */
```

### 5.2 Props Interface Documentation

```typescript
interface ComponentNameProps {
  /** The unique identifier for this item */
  id: string

  /**
   * Display text shown to the user.
   * @default undefined
   */
  label?: string

  /**
   * Visual variant of the component.
   * - 'primary': Main action styling
   * - 'secondary': Alternative styling
   * - 'ghost': Minimal styling
   * @default 'primary'
   */
  variant?: 'primary' | 'secondary' | 'ghost'

  /**
   * Callback fired when the component is clicked.
   * @param event - The click event
   */
  onClick?: (event: React.MouseEvent) => void

  /** Whether the component is in a disabled state */
  disabled?: boolean

  /** Additional CSS classes to apply */
  className?: string

  /** Child elements to render */
  children?: React.ReactNode
}
```

### 5.3 Priority Components for Documentation

Based on usage frequency and complexity:

| Priority | Component | Reason |
|----------|-----------|--------|
| P0 | UserProfileModal | Most complex modal, accessibility critical |
| P0 | MessagingModal | Real-time features, a11y requirements |
| P0 | GridView/GridViewProduction | Core feature, keyboard nav needed |
| P0 | BottomNav | Primary navigation, a11y critical |
| P1 | VideoCall | Complex WebRTC integration |
| P1 | ErosFloatingButton | Draggable, needs keyboard alternative |
| P1 | MapViewSimple | Complex interactions |
| P2 | All EROS components | AI feature documentation |
| P2 | FilterBar/GridFilterBar | Form patterns |
| P3 | Remaining 45+ components | As capacity allows |

---

## 6. Testing Infrastructure

### 6.1 Accessibility Testing Setup

**Install dependencies**:
```bash
npm install -D jest-axe @testing-library/jest-dom eslint-plugin-jsx-a11y
```

**File**: `jest.setup.ts` (update)

```typescript
import '@testing-library/jest-dom'
import { toHaveNoViolations } from 'jest-axe'

expect.extend(toHaveNoViolations)
```

**File**: `.eslintrc.json` (update)

```json
{
  "extends": [
    "next/core-web-vitals",
    "plugin:jsx-a11y/recommended"
  ],
  "plugins": ["jsx-a11y"],
  "rules": {
    "jsx-a11y/alt-text": "error",
    "jsx-a11y/aria-props": "error",
    "jsx-a11y/aria-role": "error",
    "jsx-a11y/role-has-required-aria-props": "error",
    "jsx-a11y/anchor-is-valid": "warn",
    "jsx-a11y/click-events-have-key-events": "warn",
    "jsx-a11y/no-static-element-interactions": "warn"
  }
}
```

### 6.2 Component Test Template

**File**: `src/components/__tests__/ComponentName.test.tsx`

```typescript
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe, toHaveNoViolations } from 'jest-axe'
import ComponentName from '../ComponentName'

expect.extend(toHaveNoViolations)

describe('ComponentName', () => {
  // Accessibility tests
  describe('Accessibility', () => {
    it('should have no accessibility violations', async () => {
      const { container } = render(<ComponentName />)
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('should be keyboard navigable', async () => {
      const user = userEvent.setup()
      render(<ComponentName />)

      await user.tab()
      expect(screen.getByRole('button')).toHaveFocus()
    })

    it('should have proper ARIA labels', () => {
      render(<ComponentName ariaLabel="Test label" />)
      expect(screen.getByLabelText('Test label')).toBeInTheDocument()
    })
  })

  // Functional tests
  describe('Functionality', () => {
    it('should render correctly', () => {
      render(<ComponentName />)
      expect(screen.getByRole('...')).toBeInTheDocument()
    })

    it('should handle click events', async () => {
      const handleClick = jest.fn()
      const user = userEvent.setup()

      render(<ComponentName onClick={handleClick} />)
      await user.click(screen.getByRole('button'))

      expect(handleClick).toHaveBeenCalledTimes(1)
    })
  })
})
```

### 6.3 Testing Coverage Targets

| Category | Current | Target | Timeline |
|----------|---------|--------|----------|
| Components | ~10% | 60% | 4 weeks |
| Hooks | ~20% | 80% | 3 weeks |
| A11y Tests | 0% | 100% of modals | 2 weeks |
| Integration | 0% | Core flows | 4 weeks |

---

## 7. Implementation Roadmap

### Phase 1: Critical Accessibility (Week 1-2)

```
Week 1:
├── Day 1-2: Create useFocusTrap hook
├── Day 3-4: Create AriaLiveProvider component
├── Day 5: Update UserProfileModal with focus trap
└──

Week 2:
├── Day 1-2: Update MessagingModal, ReportModal, UpgradeModal
├── Day 3-4: Create useGridKeyboardNav hook
├── Day 5: Implement keyboard navigation in GridView
└──
```

### Phase 2: Design System (Week 3)

```
Week 3:
├── Day 1: Consolidate CSS variables in globals.css
├── Day 2: Update mobile-optimization.css to use variables
├── Day 3: Archive orphaned CSS files
├── Day 4: Update Tailwind config with design tokens
└── Day 5: Create design tokens documentation
```

### Phase 3: Documentation & Testing (Week 4-5)

```
Week 4:
├── Day 1-2: Set up jest-axe and eslint-plugin-jsx-a11y
├── Day 3-5: Document P0 components (4 components)
└──

Week 5:
├── Day 1-3: Document P1 components (3 components)
├── Day 4-5: Create Storybook stories for documented components
└──
```

---

## 8. Handoff Specifications

### 8.1 For Database Engineer

No database changes required for this architecture phase.

### 8.2 For Frontend Engineers

**Priority Tasks**:

1. **Implement `useFocusTrap` hook** (`src/hooks/useFocusTrap.ts`)
   - Follow specification in Section 2.1
   - Test with all modal components

2. **Implement `AriaLiveProvider`** (`src/components/ui/AriaLiveRegion.tsx`)
   - Follow specification in Section 2.2
   - Add to `ClientProviders.tsx`

3. **Update Modal Components**
   - Add focus trap to: UserProfileModal, MessagingModal, ReportModal, UpgradeModal, WelcomeModal, WaitingRoomModal, ErosOnboardingModal
   - Add ARIA attributes as specified in Section 2.4

4. **Implement `useGridKeyboardNav`** (`src/hooks/useGridKeyboardNav.ts`)
   - Follow specification in Section 2.3
   - Integrate with GridView.tsx and GridViewProduction.tsx

5. **Update CSS**
   - Add accessibility utilities to globals.css (Section 2.5)
   - Update mobile-optimization.css to use CSS variables (Section 3.2)

6. **Create Route Configuration** (`src/config/routes.ts`)
   - Follow specification in Section 4.1
   - Update existing hardcoded routes

### 8.3 For Backend Engineers

No backend changes required for this architecture phase.

### 8.4 For QA/Testing

**Test Cases Required**:

1. **Focus Trap Testing**
   - Verify Tab cycles within modal
   - Verify Shift+Tab reverse cycles
   - Verify Escape closes modal
   - Verify focus returns to trigger element

2. **Screen Reader Testing**
   - Test with VoiceOver (macOS/iOS)
   - Test with NVDA (Windows)
   - Verify all modals announce properly
   - Verify real-time updates are announced

3. **Keyboard Navigation Testing**
   - Arrow keys navigate grid
   - Enter/Space select items
   - Home/End navigate to boundaries
   - All interactive elements reachable via Tab

---

## Appendix A: File Changes Summary

| File | Action | Priority |
|------|--------|----------|
| `src/hooks/useFocusTrap.ts` | CREATE | P0 |
| `src/hooks/useGridKeyboardNav.ts` | CREATE | P0 |
| `src/components/ui/AriaLiveRegion.tsx` | CREATE | P0 |
| `src/config/design-tokens.ts` | CREATE | P1 |
| `src/config/routes.ts` | CREATE | P1 |
| `src/app/globals.css` | UPDATE | P0 |
| `src/styles/mobile-optimization.css` | UPDATE | P1 |
| `src/components/UserProfileModal.tsx` | UPDATE | P0 |
| `src/components/MessagingModal.tsx` | UPDATE | P0 |
| `src/components/GridView.tsx` | UPDATE | P0 |
| `src/stores/index.ts` | UPDATE | P2 |
| `.eslintrc.json` | UPDATE | P1 |
| `jest.setup.ts` | UPDATE | P1 |

## Appendix B: Success Metrics

| Metric | Current | Target | Measurement |
|--------|---------|--------|-------------|
| WCAG 2.1 AA Compliance | ~40% | 85% | Automated + manual audit |
| Focus trap coverage | 0/7 modals | 7/7 modals | Manual testing |
| Keyboard navigation | 0% | 100% of interactive | Manual testing |
| ESLint a11y warnings | Unknown | 0 errors | CI/CD pipeline |
| jest-axe test coverage | 0% | 100% of components | Test suite |

---

**Document Version**: 1.0.0
**Last Updated**: 2025-12-02
**Author**: Tech Lead (Claude)
**Status**: Ready for Implementation
