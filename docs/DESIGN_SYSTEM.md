# SLTR Design System

> **Version:** 1.0
> **Last Updated:** December 2024
> **Theme:** Dark Navy with Lime Green Accents

## Overview

This document serves as the **single source of truth** for all design tokens, color palettes, typography, spacing, and component styles in the SLTR application. All CSS files and components should reference these values.

---

## 1. Color Palette

### Primary Colors

| Token | Hex | RGB | Usage |
|-------|-----|-----|-------|
| `--sltr-primary` | `#00ff88` | `0, 255, 136` | Primary action buttons, highlights |
| `--sltr-primary-dark` | `#00cc6a` | `0, 204, 106` | Hover states, gradients |
| `--sltr-secondary` | `#ffffff` | `255, 255, 255` | Text, secondary elements |
| `--sltr-accent` | `#00ff88` | `0, 255, 136` | Accent elements, icons |

### Semantic Colors

| Token | Hex | Usage |
|-------|-----|-------|
| `--sltr-success` | `#00ff88` | Success states, online indicators |
| `--sltr-warning` | `#ffaa00` | Warnings, caution states |
| `--sltr-danger` | `#ff4444` | Errors, destructive actions |
| `--sltr-info` | `#00d4ff` | Information, links |

### Background Colors

| Token | Hex | Usage |
|-------|-----|-------|
| `--bg-primary` | `#0a1628` | Main background |
| `--bg-secondary` | `#0d1b2a` | Elevated surfaces |
| `--bg-tertiary` | `#1b2838` | Cards, modals |

### Text Colors

| Token | Value | Usage |
|-------|-------|-------|
| `--text-primary` | `#ffffff` | Primary text |
| `--text-secondary` | `rgba(255, 255, 255, 0.85)` | Secondary text |
| `--text-muted` | `rgba(255, 255, 255, 0.6)` | Disabled, hints |

### Glassmorphism

| Token | Value | Usage |
|-------|-------|-------|
| `--glass-bg` | `rgba(255, 255, 255, 0.05)` | Glass background |
| `--glass-border` | `rgba(255, 255, 255, 0.1)` | Glass borders |
| `--glass-shadow` | `0 8px 32px rgba(0, 0, 0, 0.3)` | Glass elevation |

---

## 2. Typography

### Font Family

```css
--font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', Roboto, sans-serif;
```

### Font Sizes

| Token | Size | Usage |
|-------|------|-------|
| `--font-size-xs` | `0.75rem` (12px) | Captions, badges |
| `--font-size-sm` | `0.875rem` (14px) | Small text, labels |
| `--font-size-base` | `1rem` (16px) | Body text |
| `--font-size-lg` | `1.125rem` (18px) | Large text |
| `--font-size-xl` | `1.25rem` (20px) | Subheadings |
| `--font-size-2xl` | `1.5rem` (24px) | Headings |
| `--font-size-3xl` | `1.875rem` (30px) | Large headings |
| `--font-size-4xl` | `2.25rem` (36px) | Display text |
| `--font-size-5xl` | `3rem` (48px) | Hero text |

### Font Weights

| Weight | Value | Usage |
|--------|-------|-------|
| Regular | 400 | Body text |
| Medium | 500 | Emphasized text |
| Semibold | 600 | Buttons, labels |
| Bold | 700 | Headings |
| Extrabold | 800 | Display text |

---

## 3. Spacing System

| Token | Value | Usage |
|-------|-------|-------|
| `--space-xs` | `0.25rem` (4px) | Tight spacing |
| `--space-sm` | `0.5rem` (8px) | Small gaps |
| `--space-md` | `1rem` (16px) | Default spacing |
| `--space-lg` | `1.5rem` (24px) | Section spacing |
| `--space-xl` | `2rem` (32px) | Large spacing |
| `--space-2xl` | `3rem` (48px) | Extra large |
| `--space-3xl` | `4rem` (64px) | Page sections |

---

## 4. Border Radius

| Token | Value | Usage |
|-------|-------|-------|
| `--radius-sm` | `0.375rem` (6px) | Small elements |
| `--radius-md` | `0.5rem` (8px) | Buttons, inputs |
| `--radius-lg` | `0.75rem` (12px) | Cards |
| `--radius-xl` | `1rem` (16px) | Modals |
| `--radius-2xl` | `1.5rem` (24px) | Large cards |
| `--radius-full` | `9999px` | Pills, avatars |

---

## 5. Shadows

| Token | Value | Usage |
|-------|-------|-------|
| `--shadow-sm` | `0 1px 2px rgba(0, 0, 0, 0.05)` | Subtle elevation |
| `--shadow-md` | `0 4px 6px rgba(0, 0, 0, 0.1)` | Cards |
| `--shadow-lg` | `0 10px 15px rgba(0, 0, 0, 0.1)` | Modals |
| `--shadow-xl` | `0 20px 25px rgba(0, 0, 0, 0.1)` | Dropdowns |
| `--shadow-2xl` | `0 25px 50px rgba(0, 0, 0, 0.25)` | Prominent elements |

### Glow Effects

```css
/* Primary glow */
box-shadow: 0 0 20px rgba(0, 255, 136, 0.3);

/* Intense glow (hover) */
box-shadow: 0 0 40px rgba(0, 255, 136, 0.6);

/* Online indicator glow */
box-shadow: 0 0 10px rgba(0, 255, 136, 0.5);
```

---

## 6. Transitions

| Token | Value | Usage |
|-------|-------|-------|
| `--transition-fast` | `150ms ease-out` | Hover states |
| `--transition-normal` | `300ms ease-out` | Default animations |
| `--transition-slow` | `500ms ease-out` | Complex animations |
| `--transition-bounce` | `300ms cubic-bezier(0.68, -0.55, 0.265, 1.55)` | Playful interactions |

---

## 7. Gradients

### Primary Gradient

```css
background: linear-gradient(135deg, #00ff88, #00cc6a);
```

### Accent Gradient

```css
background: linear-gradient(135deg, #00ff88, #00dd77);
```

### Dark Background Gradient

```css
background: linear-gradient(135deg, #0a1628, #1b2838);
```

### Text Gradient

```css
background: linear-gradient(135deg, #00ff88, #ffffff);
-webkit-background-clip: text;
-webkit-text-fill-color: transparent;
```

---

## 8. Component Styles

### Buttons

#### Primary Button
```css
.btn-primary {
  background: linear-gradient(135deg, var(--sltr-primary), var(--sltr-primary-dark));
  color: var(--bg-primary);
  font-weight: 700;
  border-radius: var(--radius-lg);
  padding: var(--space-md) var(--space-lg);
  box-shadow: 0 4px 15px rgba(0, 255, 136, 0.3);
  transition: all var(--transition-normal);
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 255, 136, 0.5);
}
```

#### Glass Button
```css
.btn-glass {
  background: var(--glass-bg);
  border: 1px solid var(--glass-border);
  color: var(--text-primary);
  backdrop-filter: blur(20px);
  border-radius: var(--radius-lg);
}

.btn-glass:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: var(--sltr-primary);
}
```

### Cards

```css
.card {
  background: var(--glass-bg);
  backdrop-filter: blur(20px);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-xl);
  padding: var(--space-lg);
  box-shadow: var(--shadow-lg);
}

.card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-2xl);
  border-color: var(--sltr-primary);
}
```

### Inputs

```css
.input {
  background: var(--glass-bg);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-lg);
  padding: var(--space-md) var(--space-lg);
  color: var(--text-primary);
  backdrop-filter: blur(20px);
}

.input:focus {
  outline: none;
  border-color: var(--sltr-primary);
  box-shadow: 0 0 0 3px rgba(0, 255, 136, 0.15);
}
```

---

## 9. Accessibility Requirements

### Focus States

```css
*:focus-visible {
  outline: 2px solid var(--sltr-primary);
  outline-offset: 2px;
}
```

### Minimum Touch Targets

- **Mobile:** 44x44px minimum
- **Desktop:** 24x24px minimum for icons with adequate spacing

### Color Contrast

| Element | Requirement |
|---------|-------------|
| Body text | 4.5:1 minimum |
| Large text (18px+) | 3:1 minimum |
| UI components | 3:1 minimum |

### Reduced Motion

```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## 10. Responsive Breakpoints

| Name | Min Width | Usage |
|------|-----------|-------|
| Mobile | 0 | Default (mobile-first) |
| Tablet | 480px | Small tablets |
| Desktop | 768px | Tablets, small laptops |
| Large | 1024px | Laptops |
| XL | 1280px | Large screens |

### Media Query Examples

```css
/* Mobile-first approach */
.grid {
  grid-template-columns: repeat(1, 1fr);
}

@media (min-width: 480px) {
  .grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: 768px) {
  .grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (min-width: 1024px) {
  .grid {
    grid-template-columns: repeat(4, 1fr);
  }
}
```

---

## 11. CSS Variables Reference

### Complete :root Block

```css
:root {
  /* Primary Colors */
  --sltr-primary: #00ff88;
  --sltr-primary-dark: #00cc6a;
  --sltr-secondary: #ffffff;
  --sltr-accent: #00ff88;

  /* Semantic Colors */
  --sltr-success: #00ff88;
  --sltr-warning: #ffaa00;
  --sltr-danger: #ff4444;
  --sltr-info: #00d4ff;

  /* Background Colors */
  --bg-primary: #0a1628;
  --bg-secondary: #0d1b2a;
  --bg-tertiary: #1b2838;

  /* Text Colors */
  --text-primary: #ffffff;
  --text-secondary: rgba(255, 255, 255, 0.85);
  --text-muted: rgba(255, 255, 255, 0.6);

  /* Glass Effects */
  --glass-bg: rgba(255, 255, 255, 0.05);
  --glass-border: rgba(255, 255, 255, 0.1);
  --glass-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);

  /* Typography */
  --font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', Roboto, sans-serif;
  --font-size-xs: 0.75rem;
  --font-size-sm: 0.875rem;
  --font-size-base: 1rem;
  --font-size-lg: 1.125rem;
  --font-size-xl: 1.25rem;
  --font-size-2xl: 1.5rem;
  --font-size-3xl: 1.875rem;
  --font-size-4xl: 2.25rem;
  --font-size-5xl: 3rem;

  /* Spacing */
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
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.1);
  --shadow-xl: 0 20px 25px rgba(0, 0, 0, 0.1);
  --shadow-2xl: 0 25px 50px rgba(0, 0, 0, 0.25);

  /* Transitions */
  --transition-fast: 150ms ease-out;
  --transition-normal: 300ms ease-out;
  --transition-slow: 500ms ease-out;
  --transition-bounce: 300ms cubic-bezier(0.68, -0.55, 0.265, 1.55);

  /* Layout */
  --header-height: 64px;
  --bottom-nav-height: 64px;
  --filter-bar-height: 57px;
}
```

---

## Document History

| Date | Version | Changes |
|------|---------|---------|
| Dec 2024 | 1.0 | Initial design system documentation |
