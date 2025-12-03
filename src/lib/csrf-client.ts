/**
 * CSRF Token Client
 * Handles fetching and caching of CSRF tokens for client-side requests
 */

let cachedToken: string | null = null
let tokenExpiry: number = 0

/**
 * Fetches a CSRF token from the server
 * Returns cached token if still valid, otherwise fetches a new one
 */
export async function getCSRFToken(): Promise<string> {
  const now = Date.now()

  // Return cached token if still valid
  if (cachedToken && tokenExpiry > now) {
    return cachedToken
  }

  try {
    const response = await fetch('/api/csrf-token', {
      method: 'GET',
      credentials: 'include',
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch CSRF token: ${response.statusText}`)
    }

    const data = await response.json()
    cachedToken = data.token
    tokenExpiry = now + (60 * 60 * 1000) // Cache for 1 hour

    // Type assertion is safe here because we just assigned a value from the API
    if (!cachedToken) {
      throw new Error('CSRF token is null or undefined')
    }

    return cachedToken
  } catch (error) {
    console.error('Error fetching CSRF token:', error)
    throw error
  }
}

/**
 * Clears the cached CSRF token
 * Useful for forcing a token refresh
 */
export function clearCSRFToken(): void {
  cachedToken = null
  tokenExpiry = 0
}

/**
 * Adds CSRF token to request headers
 */
export async function withCSRFToken(
  headers: HeadersInit = {}
): Promise<Headers> {
  const token = await getCSRFToken()
  const headersObj = new Headers(headers)
  headersObj.set('X-CSRF-Token', token)
  return headersObj
}
