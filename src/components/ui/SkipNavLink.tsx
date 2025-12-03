'use client'

/**
 * Skip Navigation Link
 *
 * Accessibility feature that allows keyboard users to skip
 * directly to main content, bypassing navigation elements.
 *
 * The link is visually hidden until focused, then slides into view.
 */

interface SkipNavLinkProps {
  /** The ID of the main content container to skip to */
  contentId?: string
  /** Custom label text */
  label?: string
}

export function SkipNavLink({
  contentId = 'main-content',
  label = 'Skip to main content'
}: SkipNavLinkProps) {
  return (
    <a
      href={`#${contentId}`}
      className="
        sr-only focus:not-sr-only
        fixed top-0 left-0 z-[10000]
        px-4 py-3 m-2
        bg-lime-400 text-black font-bold text-sm
        rounded-lg shadow-lg
        focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-black
        transform -translate-y-full focus:translate-y-0
        transition-transform duration-200
      "
    >
      {label}
    </a>
  )
}

/**
 * Main Content Wrapper
 *
 * Wrap your main page content with this component to provide
 * the target for the skip navigation link.
 */
interface MainContentProps {
  children: React.ReactNode
  /** The ID to use for the main content (matches SkipNavLink contentId) */
  id?: string
  className?: string
}

export function MainContent({
  children,
  id = 'main-content',
  className = ''
}: MainContentProps) {
  return (
    <main
      id={id}
      role="main"
      tabIndex={-1}
      className={`outline-none ${className}`}
    >
      {children}
    </main>
  )
}
