# Archived CSS Files

These CSS files were archived as part of the UX audit consolidation (December 2025).

## Reason for Archiving

These files were identified as orphaned (not imported anywhere in the codebase) and contained outdated color palettes (cyan-magenta) that conflicted with the current design system (lime green).

## Archived Files

| File | Original Purpose | Archived Date |
|------|------------------|---------------|
| `style.css` | Legacy design system with cyan-magenta palette | Dec 2024 |
| `ultramodern.css` | Alternative modern styles with cyan-magenta palette | Dec 2024 |
| `uv-effects.css` | UV effects for founder cards | Dec 2024 |

## Active Design System

The active design system files are:
- `src/app/globals.css` - Main global styles (imported in layout.tsx)
- `src/styles/globals.css` - Design system tokens
- `src/styles/mobile-optimization.css` - Mobile-specific optimizations

## Recovery

If you need to restore any of these files, simply move them back to `src/styles/` and import them as needed. However, note that they use the old cyan-magenta palette and should be updated to use CSS variables from the design system.
