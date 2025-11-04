/**
 * Get the production site URL for redirects
 * Always returns getsltr.com in production, localhost in development
 * NEVER returns Vercel URLs - always use getsltr.com for production
 */
export function getSiteUrl(): string {
  // Client-side check
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname
    // If already on getsltr.com, use it
    if (hostname === 'getsltr.com' || hostname === 'www.getsltr.com') {
      return 'https://getsltr.com'
    }
    // If on localhost, use localhost
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return `http://${hostname}:${window.location.port || '3001'}`
    }
    // If on Vercel or any other domain, use getsltr.com (production domain)
    // This ensures emails always redirect to the correct domain
    return 'https://getsltr.com'
  }
  
  // Server-side: Always use getsltr.com in production
  // Check if we're in a production environment (not localhost)
  const isProduction = process.env.NODE_ENV === 'production'
  
  // In production, always use getsltr.com (never use Vercel URLs)
  if (isProduction) {
    return 'https://getsltr.com'
  }
  
  // For local development
  const port = process.env.PORT || '3001'
  return `http://localhost:${port}`
}

/**
 * Get the auth callback URL with optional next parameter
 */
export function getAuthCallbackUrl(next?: string): string {
  const baseUrl = getSiteUrl()
  const params = new URLSearchParams()
  if (next) {
    params.set('next', next)
  }
  const queryString = params.toString()
  return `${baseUrl}/auth/callback${queryString ? `?${queryString}` : ''}`
}

