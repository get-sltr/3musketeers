# Technical Architecture: UX Implementation Guide

> **Document Version:** 1.0
> **Last Updated:** December 2024
> **Status:** Active Implementation

## Overview

This document provides comprehensive technical specifications for implementing the UX improvements identified in the SLTR accessibility and design system audit. It serves as the single source of truth for frontend implementation decisions.

---

## 1. Accessibility Infrastructure (P0 - Critical)

### 1.1 Focus Trap Hook (`useFocusTrap`)

**Purpose:** Ensures keyboard focus remains within modal dialogs, preventing users from accidentally tabbing outside the modal context.

**Location:** `src/hooks/useFocusTrap.ts`

**API:**
```typescript
interface UseFocusTrapOptions {
  enabled?: boolean;
  initialFocusRef?: React.RefObject<HTMLElement>;
  returnFocusOnDeactivate?: boolean;
  escapeDeactivates?: boolean;
  onEscape?: () => void;
}

function useFocusTrap(
  containerRef: React.RefObject<HTMLElement>,
  options?: UseFocusTrapOptions
): void;
```

**Implementation Requirements:**
- Trap focus within container when `enabled` is true
- Support initial focus on specific element
- Return focus to trigger element on deactivation
- Handle Escape key to close modal
- Support both Tab and Shift+Tab navigation

**Usage:**
```tsx
const modalRef = useRef<HTMLDivElement>(null);

useFocusTrap(modalRef, {
  enabled: isOpen,
  onEscape: onClose,
  returnFocusOnDeactivate: true
});

return <div ref={modalRef}>...</div>;
```

---

### 1.2 ARIA Live Region Component (`AriaLiveRegion`)

**Purpose:** Announces dynamic content changes to screen reader users for real-time updates (filter changes, new messages, user status changes).

**Location:** `src/components/ui/AriaLiveRegion.tsx`

**API:**
```typescript
interface AriaLiveRegionProps {
  message: string;
  politeness?: 'polite' | 'assertive';
  atomic?: boolean;
  clearAfter?: number; // milliseconds
}
```

**Implementation Requirements:**
- Support both `polite` and `assertive` announcements
- Auto-clear messages after configurable delay
- Use visually hidden but accessible text
- Queue multiple announcements appropriately

**Use Cases:**
| Event Type | Politeness | Example Message |
|------------|------------|-----------------|
| Filter applied | polite | "Showing 15 users matching filters" |
| New message | assertive | "New message from Alex" |
| Error | assertive | "Failed to load users. Please retry." |
| Success | polite | "Profile saved successfully" |

---

### 1.3 Grid Keyboard Navigation Hook (`useGridKeyboardNav`)

**Purpose:** Enables arrow key navigation through the user grid for keyboard users.

**Location:** `src/hooks/useGridKeyboardNav.ts`

**API:**
```typescript
interface UseGridKeyboardNavOptions {
  columns: number;
  itemCount: number;
  onSelect?: (index: number) => void;
  onActivate?: (index: number) => void;
  wrap?: boolean;
}

interface UseGridKeyboardNavReturn {
  focusedIndex: number;
  setFocusedIndex: (index: number) => void;
  getItemProps: (index: number) => {
    tabIndex: number;
    onKeyDown: (e: React.KeyboardEvent) => void;
    onFocus: () => void;
    'aria-selected': boolean;
  };
}
```

**Keyboard Mappings:**
| Key | Action |
|-----|--------|
| ArrowRight | Move to next item |
| ArrowLeft | Move to previous item |
| ArrowDown | Move down one row |
| ArrowUp | Move up one row |
| Home | Move to first item |
| End | Move to last item |
| Enter/Space | Activate (open profile) |

**Implementation Requirements:**
- Support dynamic column count (responsive grid)
- Maintain focus visibility with proper focus ring
- Announce position to screen readers
- Handle edge cases (first/last item, row boundaries)

---

## 2. Design System Consolidation (P1)

### 2.1 CSS Palette Conflict Resolution

**Issue:** `mobile-optimization.css` uses cyan-magenta palette (`#00d4ff`, `#ff00ff`) while `globals.css` uses lime green (`#00ff88`).

**Solution:** Update `mobile-optimization.css` to use CSS variables from the design system.

**Before:**
```css
.logo-button {
  background: linear-gradient(45deg, #00d4ff, #ff00ff);
}
```

**After:**
```css
.logo-button {
  background: linear-gradient(135deg, var(--sltr-primary), var(--sltr-primary-dark));
}
```

**CSS Variables to Use:**
```css
--sltr-primary: #00ff88;      /* Lime Green */
--sltr-primary-dark: #00cc6a; /* Darker Lime */
--sltr-secondary: #ffffff;    /* White */
--sltr-accent: #00ff88;       /* Lime accent */
--bg-primary: #0a1628;        /* Dark navy */
```

### 2.2 Orphaned CSS Files

**Files to Archive:**
| File | Status | Reason |
|------|--------|--------|
| `src/styles/style.css` | Archive | Duplicate, uses old palette |
| `src/styles/ultramodern.css` | Archive | Duplicate, uses old palette |
| `src/styles/uv-effects.css` | Archive | UV effects for founder card, no longer imported |

**Archive Location:** `src/styles/_archived/`

---

## 3. Component Updates

### 3.1 Modal Component Enhancements

**File:** `src/app/components/ui/Modal.tsx`

**Required Changes:**
1. Integrate `useFocusTrap` hook
2. Add ARIA attributes (`role="dialog"`, `aria-modal`, `aria-labelledby`)
3. Announce modal open/close to screen readers
4. Ensure first focusable element receives focus on open

**Enhanced Interface:**
```typescript
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  initialFocusRef?: React.RefObject<HTMLElement>;
  returnFocusRef?: React.RefObject<HTMLElement>;
  ariaDescribedBy?: string;
}
```

### 3.2 GridView Accessibility Enhancements

**File:** `src/components/GridView.tsx`

**Required Changes:**
1. Integrate `useGridKeyboardNav` hook
2. Add `role="grid"` and `role="gridcell"` attributes
3. Announce filter results via `AriaLiveRegion`
4. Make profile cards focusable and activatable via keyboard
5. Add proper `aria-label` to each grid item

**Semantic Structure:**
```tsx
<div role="grid" aria-label="User profiles grid">
  <div role="row">
    <div role="gridcell" tabIndex={0} aria-label="Alex, 28, 0.5 miles away">
      {/* Card content */}
    </div>
  </div>
</div>
```

---

## 4. Testing Requirements

### 4.1 Accessibility Testing Checklist

- [ ] Focus trap works correctly in all modals
- [ ] Tab order is logical and complete
- [ ] Screen reader announces all dynamic updates
- [ ] Grid navigation works with arrow keys
- [ ] All interactive elements have visible focus states
- [ ] Color contrast meets WCAG AA (4.5:1 for text)
- [ ] Touch targets are minimum 44x44px

### 4.2 Manual Testing

1. **Keyboard-only navigation:** Complete all user flows without mouse
2. **Screen reader testing:** Test with VoiceOver (macOS) and NVDA (Windows)
3. **High contrast mode:** Verify visibility in Windows High Contrast
4. **Reduced motion:** Test with `prefers-reduced-motion: reduce`

---

## 5. Implementation Priority

| Priority | Task | Estimated Effort |
|----------|------|------------------|
| P0 | `useFocusTrap` hook | 2-3 hours |
| P0 | `AriaLiveRegion` component | 1-2 hours |
| P0 | `useGridKeyboardNav` hook | 2-3 hours |
| P1 | Fix CSS palette conflict | 1 hour |
| P1 | Archive orphaned CSS | 30 minutes |
| P2 | Update Modal with focus trap | 1-2 hours |
| P2 | Update GridView accessibility | 2-3 hours |

---

## 6. References

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [WAI-ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)
- [MDN: ARIA Grid Pattern](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Roles/grid_role)
- [Focus Trap Best Practices](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/)

---

## Document History

| Date | Version | Changes |
|------|---------|---------|
| Dec 2024 | 1.0 | Initial document creation |
