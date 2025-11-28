/**
 * Client-side CSRF Token Utilities
 *
 * Helper functions for including CSRF tokens in API requests
 */

let cachedToken: string | null = null
let tokenExpiry: number = 0

/**
 * Fetch a fresh CSRF token from the server
 */
export async function getCsrfToken(): Promise<string> {
  const now = Date.now()

  // Return cached token if still valid (cache for 1 hour)
  if (cachedToken && now < tokenExpiry) {
    return cachedToken
  }

  try {
    const response = await fetch('/api/csrf-token', {
      method: 'GET',
      credentials: 'same-origin',
    })

    if (!response.ok) {
      throw new Error('Failed to fetch CSRF token')
    }

    const data = await response.json()
    cachedToken = data.token
    tokenExpiry = now + (60 * 60 * 1000) // Cache for 1 hour

    return cachedToken
  } catch (error) {
    console.error('Error fetching CSRF token:', error)
    throw error
  }
}

/**
 * Make a CSRF-protected fetch request
 * Automatically includes CSRF token in headers
 *
 * @example
 * ```typescript
 * const response = await csrfFetch('/api/delete-account', {
 *   method: 'POST',
 *   body: JSON.stringify({ confirm: true })
 * })
 * ```
 */
export async function csrfFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const method = options.method?.toUpperCase() || 'GET'

  // GET requests don't need CSRF token
  if (method === 'GET' || method === 'HEAD' || method === 'OPTIONS') {
    return fetch(url, options)
  }

  // Get CSRF token
  const token = await getCsrfToken()

  // Add CSRF token to headers
  const headers = new Headers(options.headers)
  headers.set('x-csrf-token', token)

  // Make request with CSRF token
  return fetch(url, {
    ...options,
    headers,
    credentials: options.credentials || 'same-origin',
  })
}

/**
 * Get headers object with CSRF token included
 * Useful for custom fetch implementations
 *
 * @example
 * ```typescript
 * const headers = await getCsrfHeaders()
 * fetch('/api/endpoint', {
 *   method: 'POST',
 *   headers,
 *   body: JSON.stringify(data)
 * })
 * ```
 */
export async function getCsrfHeaders(): Promise<HeadersInit> {
  const token = await getCsrfToken()
  return {
    'x-csrf-token': token,
    'Content-Type': 'application/json',
  }
}

/**
 * Clear cached CSRF token
 * Call this if you get a 403 CSRF error to force token refresh
 */
export function clearCsrfToken(): void {
  cachedToken = null
  tokenExpiry = 0
}
