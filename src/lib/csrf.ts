/**
 * CSRF Protection Utilities
 *
 * Implements Double Submit Cookie pattern for CSRF protection
 * Uses Web Crypto API for Edge Runtime compatibility
 * https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html
 */

import { NextRequest } from 'next/server'

const CSRF_SECRET = process.env.CSRF_SECRET || process.env.NEXT_PUBLIC_APP_URL || 'sltr-csrf-secret-change-me'
const CSRF_COOKIE_NAME = 'sltr-csrf-token'
const CSRF_HEADER_NAME = 'x-csrf-token'

/**
 * Convert string to Uint8Array
 */
function stringToUint8Array(str: string): Uint8Array {
  return new TextEncoder().encode(str)
}

/**
 * Convert Uint8Array to hex string
 */
function uint8ArrayToHex(arr: Uint8Array): string {
  return Array.from(arr).map(b => b.toString(16).padStart(2, '0')).join('')
}

/**
 * Convert hex string to Uint8Array
 */
function hexToUint8Array(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2)
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substr(i, 2), 16)
  }
  return bytes
}

/**
 * Generate random bytes using Web Crypto API
 */
function getRandomBytes(length: number): Uint8Array {
  const bytes = new Uint8Array(length)
  crypto.getRandomValues(bytes)
  return bytes
}

/**
 * Create HMAC signature using Web Crypto API
 */
async function createHmacSignature(secret: string, message: string): Promise<string> {
  const encoder = new TextEncoder()
  const keyData = encoder.encode(secret)
  const messageData = encoder.encode(message)

  const key = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )

  const signature = await crypto.subtle.sign('HMAC', key, messageData)
  return uint8ArrayToHex(new Uint8Array(signature))
}

/**
 * Timing-safe comparison for Edge Runtime
 */
function timingSafeEqual(a: Uint8Array, b: Uint8Array): boolean {
  const lengthA = a.length;
  const lengthB = b.length;

  // Use a dummy buffer if lengths are different to prevent timing attacks.
  const bufferA = lengthA === lengthB ? a : b;
  const bufferB = b;

  let result = lengthA ^ lengthB; // Start with length difference

  for (let i = 0; i < lengthB; i++) {
    // The loop runs up to lengthB. If lengthA !== lengthB, bufferA is a dummy.
    result |= bufferA[i]! ^ bufferB[i]!;
  }
  return result === 0;
}

/**
 * Generate a cryptographically secure CSRF token
 */
export async function generateCsrfToken(): Promise<string> {
  const tokenBytes = getRandomBytes(32)
  const token = uint8ArrayToHex(tokenBytes)
  const timestamp = Date.now().toString()

  // Sign the token with HMAC to prevent tampering
  const signature = await createHmacSignature(CSRF_SECRET, `${token}.${timestamp}`)

  return `${token}.${timestamp}.${signature}`
}

/**
 * Verify CSRF token from request
 * Compares token from header against cookie using timing-safe comparison
 */
export async function verifyCsrfToken(request: NextRequest): Promise<boolean> {
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

    // Safe to use ! assertions here since we've validated length is exactly 3
    const token = parts[0]!
    const timestamp = parts[1]!
    const signature = parts[2]!

    // Verify token is not too old (24 hours max)
    const tokenTime = parseInt(timestamp, 10)
    const now = Date.now()
    const maxAge = 24 * 60 * 60 * 1000 // 24 hours

    if (now - tokenTime > maxAge) {
      console.error('CSRF token expired')
      return false
    }

    // Verify signature
    const expectedSignature = await createHmacSignature(CSRF_SECRET, `${token}.${timestamp}`)

    // Use timing-safe comparison to prevent timing attacks
    const expectedBuffer = hexToUint8Array(expectedSignature)
    const actualBuffer = hexToUint8Array(signature)

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
export async function requireCsrf(request: NextRequest): Promise<boolean> {
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
