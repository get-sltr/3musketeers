# SLTR Design System

> **Version**: 1.0.0
> **Last Updated**: 2025-12-02
> **Status**: Active

---

## Overview

SLTR uses a cohesive dark-mode design system built on glassmorphism principles with lime green (#00ff88) as the primary accent color. This document serves as the single source of truth for all design decisions.

---

## Color Palette

### Primary Colors

| Token | Value | Usage |
|-------|-------|-------|
| `--sltr-primary` | `#00ff88` | Primary actions, success states, highlights |
| `--sltr-primary-dark` | `#00cc6a` | Hover states, gradients |
| `--sltr-primary-light` | `#88ffaa` | Subtle highlights, disabled states |

### Navy Theme (Backgrounds)

| Token | Value | Usage |
|-------|-------|-------|
| `--sltr-navy` | `#0a1628` | App background |
| `--sltr-navy-light` | `#0d1b2a` | Card backgrounds |
| `--sltr-navy-dark` | `#061018` | Overlays, modals |
| `--sltr-navy-card` | `#1b2838` | Elevated surfaces |

### Semantic Colors

| Token | Value | Usage |
|-------|-------|-------|
| `--sltr-success` | `#00ff88` | Success messages, online status |
| `--sltr-warning` | `#ffaa00` | Warnings, cautions |
| `--sltr-danger` | `#ff4444` | Errors, destructive actions |
| `--sltr-info` | `#00d4ff` | Information, links |

### Glass Effect Colors

| Token | Value | Usage |
|-------|-------|-------|
| `--glass-bg` | `rgba(255, 255, 255, 0.05)` | Glass background |
| `--glass-bg-hover` | `rgba(255, 255, 255, 0.1)` | Glass hover state |
| `--glass-border` | `rgba(255, 255, 255, 0.1)` | Glass borders |
| `--glass-border-hover` | `rgba(0, 255, 136, 0.4)` | Hover border highlight |

---

## Typography

### Font Families

```css
/* Body text */
font-family: var(--font-inter), 'Inter', -apple-system, BlinkMacSystemFont, system-ui, sans-serif;

/* Display/Headlines */
font-family: var(--font-orbitron), 'Orbitron', system-ui, sans-serif;
```

### Font Sizes

| Size | Value | Line Height | Usage |
|------|-------|-------------|-------|
| `xs` | 0.75rem (12px) | 1rem | Labels, captions |
| `sm` | 0.875rem (14px) | 1.25rem | Secondary text |
| `base` | 1rem (16px) | 1.5rem | Body text |
| `lg` | 1.125rem (18px) | 1.75rem | Emphasized text |
| `xl` | 1.25rem (20px) | 1.75rem | Section headers |
| `2xl` | 1.5rem (24px) | 2rem | Page headers |

### Font Weights

| Weight | Value | Usage |
|--------|-------|-------|
| Normal | 500 | Body text |
| Semibold | 600 | Buttons, labels |
| Bold | 700 | Headers, emphasis |

---

## Spacing

Based on an 8px grid system with a 4px smallest unit.

| Token | Value | Pixels |
|-------|-------|--------|
| `--space-xs` | 0.25rem | 4px |
| `--space-sm` | 0.5rem | 8px |
| `--space-md` | 1rem | 16px |
| `--space-lg` | 1.5rem | 24px |
| `--space-xl` | 2rem | 32px |
| `--space-2xl` | 3rem | 48px |
| `--space-3xl` | 4rem | 64px |

---

## Border Radius

| Token | Value | Pixels | Usage |
|-------|-------|--------|-------|
| `--radius-sm` | 0.375rem | 6px | Small buttons, tags |
| `--radius-md` | 0.5rem | 8px | Input fields |
| `--radius-lg` | 0.75rem | 12px | Cards, modals |
| `--radius-xl` | 1rem | 16px | Large cards |
| `--radius-2xl` | 1.5rem | 24px | Feature cards |
| `--radius-full` | 9999px | - | Pills, avatars |

---

## Shadows

| Token | Value | Usage |
|-------|-------|-------|
| `--shadow-sm` | `0 1px 2px rgba(0, 0, 0, 0.4)` | Subtle elevation |
| `--shadow-md` | `0 4px 12px rgba(0, 0, 0, 0.4)` | Cards, buttons |
| `--shadow-lg` | `0 8px 32px rgba(0, 0, 0, 0.6)` | Modals, overlays |
| `--shadow-glow` | `0 0 20px rgba(0, 255, 136, 0.5)` | Primary glow effect |

---

## Transitions

| Token | Value | Usage |
|-------|-------|-------|
| `--transition-fast` | `150ms ease-out` | Hover states, micro-interactions |
| `--transition-normal` | `300ms ease-out` | Standard transitions |
| `--transition-slow` | `500ms ease-out` | Complex animations |
| `--transition-bounce` | `300ms cubic-bezier(0.68, -0.55, 0.265, 1.55)` | Playful bounce |

---

## Z-Index Scale

| Token | Value | Usage |
|-------|-------|-------|
| `dropdown` | 50 | Dropdown menus |
| `sticky` | 100 | Sticky headers, nav |
| `modal` | 200 | Modal dialogs |
| `popover` | 300 | Popovers, tooltips |
| `tooltip` | 400 | Tooltip overlays |
| `toast` | 500 | Toast notifications |

---

## Component Patterns

### Glass Bubble

The primary interactive element style.

```css
.glass-bubble {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 0.75rem;
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  transition: all 300ms ease-out;
  color: rgba(255, 255, 255, 0.7);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
}

.glass-bubble:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(0, 255, 136, 0.4);
  color: rgba(255, 255, 255, 1);
  text-shadow: 0 0 20px rgba(0, 255, 136, 0.8);
  box-shadow: 0 4px 16px rgba(0, 255, 136, 0.3);
}

.glass-bubble.active {
  background: linear-gradient(135deg, rgba(0, 255, 136, 0.2), rgba(0, 200, 100, 0.2));
  border-color: rgba(0, 255, 136, 0.5);
  color: rgba(255, 255, 255, 1);
  text-shadow: 0 0 20px rgba(0, 255, 136, 0.9);
  box-shadow: 0 0 30px rgba(0, 255, 136, 0.5);
}
```

### Glass Card

Container for content sections.

```css
.glass-card {
  background: rgba(10, 22, 40, 0.98);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 1rem;
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.6), 0 0 1px rgba(255, 255, 255, 0.1);
}
```

### Gradient Button

Primary action button.

```css
.gradient-button {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 8px 16px;
  color: rgba(255, 255, 255, 0.8);
  font-size: 0.8125rem;
  font-weight: 700;
  letter-spacing: 0.02em;
  backdrop-filter: blur(12px);
  transition: all 300ms cubic-bezier(0.4, 0, 0.2, 1);
}

.gradient-button:hover {
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(0, 255, 136, 0.4);
  color: rgba(255, 255, 255, 1);
  text-shadow: 0 0 20px rgba(0, 255, 136, 0.8);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 255, 136, 0.2);
}

.gradient-button:active,
.gradient-button.active {
  background: linear-gradient(135deg, rgba(0, 255, 136, 0.3), rgba(0, 200, 100, 0.3));
  border-color: rgba(0, 255, 136, 0.6);
  color: rgba(255, 255, 255, 1);
  text-shadow: 0 0 20px rgba(0, 255, 136, 1);
  box-shadow: 0 0 30px rgba(0, 255, 136, 0.5);
  transform: translateY(0);
}
```

### Chat Bubbles

```css
/* Sent messages (current user) */
.sent-bubble {
  background: linear-gradient(135deg, #00ff88, #00cc6a);
  border-radius: 20px 20px 4px 20px;
  padding: 12px 16px;
  max-width: 70%;
  color: #0a1628;
  font-weight: 500;
  box-shadow: 0 0 20px rgba(0, 255, 136, 0.2);
}

/* Received messages */
.received-bubble {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 20px 20px 20px 4px;
  padding: 12px 16px;
  max-width: 70%;
  backdrop-filter: blur(10px);
}
```

---

## Layout Tokens

| Token | Value | Description |
|-------|-------|-------------|
| `--header-height` | 64px | Fixed header height |
| `--bottom-nav-height` | 64px | Bottom navigation height |
| `--filter-bar-height` | 56px | Filter bar height |
| `--sticky-ui-height` | calc(header + filter) | Combined sticky elements |

---

## Breakpoints

| Name | Value | Usage |
|------|-------|-------|
| `sm` | 640px | Large phones |
| `md` | 768px | Tablets |
| `lg` | 1024px | Small desktops |
| `xl` | 1280px | Large desktops |
| `2xl` | 1536px | Extra large screens |

---

## Tailwind Integration

Custom colors in `tailwind.config.ts`:

```typescript
colors: {
  sltr: {
    navy: {
      DEFAULT: '#0a1628',
      light: '#0d1b2a',
      dark: '#061018',
      card: '#1b2838',
    },
    lime: {
      DEFAULT: '#00ff88',
      dark: '#00cc6a',
      light: '#88ffaa',
    },
    white: '#ffffff',
  },
}
```

**Usage in components**:

```tsx
<div className="bg-sltr-navy text-sltr-lime">
  <button className="bg-sltr-lime/20 hover:bg-sltr-lime/30 text-sltr-lime">
    Action
  </button>
</div>
```

---

## Accessibility Requirements

### Color Contrast

- Text on dark backgrounds: minimum 4.5:1 ratio
- Large text (18px+): minimum 3:1 ratio
- Interactive elements: minimum 3:1 ratio

### Focus States

All interactive elements must have visible focus indicators:

```css
:focus-visible {
  outline: 2px solid var(--sltr-primary, #00ff88);
  outline-offset: 2px;
}
```

### Motion Preferences

Respect user's motion preferences:

```css
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
```

---

## File References

| File | Purpose |
|------|---------|
| `src/app/globals.css` | Primary design tokens and base styles |
| `tailwind.config.ts` | Tailwind color and typography extensions |
| `src/styles/SLTRMapPin.css` | Map-specific styles |
| `src/styles/FounderCard.css` | Founder card component styles |
| `src/styles/mobile-optimization.css` | Mobile-specific overrides |

---

## Migration Notes

### Deprecated Patterns

The following patterns are deprecated and should not be used:

1. **Cyan-Magenta gradients** (`#00d4ff` to `#ff00ff`)
   - Replace with lime primary gradient
   - Exception: Secondary accent elements only

2. **Hardcoded colors**
   - Always use CSS variables or Tailwind classes
   - Never use hex codes directly in components

3. **Orphaned CSS files**
   - `src/styles/style.css` - ARCHIVED
   - `src/styles/ultramodern.css` - ARCHIVED
   - `src/styles/uv-effects.css` - ARCHIVED

---

**Document maintained by**: Tech Lead
**Review cycle**: Monthly
