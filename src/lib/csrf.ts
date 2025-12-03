/**
 * CSRF Protection Utilities
 *
 * Implements Double Submit Cookie pattern for CSRF protection
 * https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html
 */

import { randomBytes, createHmac, timingSafeEqual } from 'crypto'
import { NextRequest } from 'next/server'

const CSRF_SECRET = process.env.CSRF_SECRET || process.env.NEXT_PUBLIC_APP_URL || 'sltr-csrf-secret-change-me'
const CSRF_COOKIE_NAME = 'sltr-csrf-token'
const CSRF_HEADER_NAME = 'x-csrf-token'

/**
 * Generate a cryptographically secure CSRF token
 */
export function generateCsrfToken(): string {
  const token = randomBytes(32).toString('hex')
  const timestamp = Date.now().toString()

  // Sign the token with HMAC to prevent tampering
  const signature = createHmac('sha256', CSRF_SECRET)
    .update(`${token}.${timestamp}`)
    .digest('hex')

  return `${token}.${timestamp}.${signature}`
}

/**
 * Verify CSRF token from request
 * Compares token from header against cookie using timing-safe comparison
 */
export function verifyCsrfToken(request: NextRequest): boolean {
  try {
    // Get token from header
    const headerToken = request.headers.get(CSRF_HEADER_NAME)

    // Get token from cookie
    const cookieToken = request.cookies.get(CSRF_COOKIE_NAME)?.value

    if (!headerToken || !cookieToken) {
      console.error('Missing CSRF token in header or cookie')
      return false
    }

    // Tokens must match exactly
    if (headerToken !== cookieToken) {
      console.error('CSRF token mismatch between header and cookie')
      return false
    }

    // Verify token structure and signature
    const parts = headerToken.split('.')
    if (parts.length !== 3) {
      console.error('Invalid CSRF token format')
      return false
    }

    const [token, timestamp, signature] = parts

    // Verify token is not too old (24 hours max)
    const tokenTime = parseInt(timestamp, 10)
    const now = Date.now()
    const maxAge = 24 * 60 * 60 * 1000 // 24 hours

    if (now - tokenTime > maxAge) {
      console.error('CSRF token expired')
      return false
    }

    // Verify signature
    const expectedSignature = createHmac('sha256', CSRF_SECRET)
      .update(`${token}.${timestamp}`)
      .digest('hex')

    // Use timing-safe comparison to prevent timing attacks
    const expectedBuffer = Buffer.from(expectedSignature)
    const actualBuffer = Buffer.from(signature)

    if (expectedBuffer.length !== actualBuffer.length) {
      console.error('CSRF signature length mismatch')
      return false
    }

    const isValid = timingSafeEqual(expectedBuffer, actualBuffer)

    if (!isValid) {
      console.error('Invalid CSRF signature')
    }

    return isValid
  } catch (error) {
    console.error('Error verifying CSRF token:', error)
    return false
  }
}

/**
 * Create CSRF cookie options
 */
export function getCsrfCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: 24 * 60 * 60, // 24 hours
  }
}

/**
 * Middleware to check CSRF token on state-changing requests
 * Exempt webhooks and GET requests
 */
export function requireCsrf(request: NextRequest): boolean {
  // Skip CSRF check for:
  // 1. GET, HEAD, OPTIONS requests (safe methods)
  // 2. Webhooks (they use signature verification instead)
  const method = request.method
  const path = request.nextUrl.pathname

  if (['GET', 'HEAD', 'OPTIONS'].includes(method)) {
    return true
  }

  // Webhooks use their own signature verification
  if (path.startsWith('/api/webhooks/')) {
    return true
  }

  // All other state-changing requests require CSRF token
  return verifyCsrfToken(request)
}

export { CSRF_COOKIE_NAME, CSRF_HEADER_NAME }
