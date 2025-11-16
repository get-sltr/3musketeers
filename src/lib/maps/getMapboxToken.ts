/**
 * Fetch Mapbox token from API with enhanced caching
 * 
 * Caching strategy:
 * - Memory cache (fastest, session-only)
 * - localStorage (persists across page reloads, 1 hour TTL)
 * - API fallback (if cache expired or missing)
 */
const CACHE_KEY = 'mapbox_token_cache'
const CACHE_TTL = 60 * 60 * 1000 // 1 hour in milliseconds

interface TokenCache {
  token: string
  expires: number
}

let memoryCache: string | null = null

export async function getMapboxToken(): Promise<string> {
  // 1. Check memory cache first (fastest)
  if (memoryCache) {
    return memoryCache
  }

  // 2. Check localStorage cache
  if (typeof window !== 'undefined') {
    try {
      const cached = localStorage.getItem(CACHE_KEY)
      if (cached) {
        const parsed: TokenCache = JSON.parse(cached)
        const now = Date.now()

        // Check if cache is still valid
        if (parsed.expires > now && parsed.token) {
          memoryCache = parsed.token
          return parsed.token
        } else {
          // Cache expired, remove it
          localStorage.removeItem(CACHE_KEY)
        }
      }
    } catch (error) {
      console.warn('Error reading localStorage cache:', error)
      // Continue to API fetch
    }
  }

  // 3. Fetch from API
  try {
    const response = await fetch('/api/mapbox-token', {
      method: 'GET',
      credentials: 'include', // Include cookies for auth
    })

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Authentication required. Please log in.')
      }
      if (response.status === 429) {
        const retryAfter = response.headers.get('Retry-After')
        throw new Error(`Rate limit exceeded. Please try again in ${retryAfter} seconds.`)
      }
      throw new Error(`Failed to fetch Mapbox token: ${response.statusText}`)
    }

    const data = await response.json()

    if (!data.token) {
      throw new Error('Invalid token response from API')
    }

    // 4. Update caches
    memoryCache = data.token

    // Store in localStorage with expiration
    if (typeof window !== 'undefined') {
      try {
        const cache: TokenCache = {
          token: data.token,
          expires: Date.now() + CACHE_TTL,
        }
        localStorage.setItem(CACHE_KEY, JSON.stringify(cache))
      } catch (error) {
        console.warn('Error writing to localStorage:', error)
        // Non-critical, continue
      }
    }

    return data.token
  } catch (error) {
    console.error('Error fetching Mapbox token:', error)
    throw error
  }
}

/**
 * Clear cached token (useful for logout or token refresh)
 */
export function clearMapboxTokenCache(): void {
  memoryCache = null
  if (typeof window !== 'undefined') {
    try {
      localStorage.removeItem(CACHE_KEY)
    } catch (error) {
      console.warn('Error clearing localStorage cache:', error)
    }
  }
}

