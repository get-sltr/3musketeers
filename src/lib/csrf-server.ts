/**
 * CSRF Token Server-Side Validation
 * Validates CSRF tokens for server-side API routes
 */

import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

/**
 * Validates CSRF token from request headers against stored cookie
 * @param request - Next.js request object
 * @returns true if valid, false otherwise
 */
export async function validateCSRFToken(request: NextRequest): Promise<boolean> {
  try {
    // Get token from request header
    const headerToken = request.headers.get('X-CSRF-Token')

    if (!headerToken) {
      return false
    }

    // Get token from cookie
    const cookieStore = await cookies()
    const cookieToken = cookieStore.get('csrf-token')?.value

    if (!cookieToken) {
      return false
    }

    // Tokens must match exactly
    return headerToken === cookieToken
  } catch (error) {
    console.error('Error validating CSRF token:', error)
    return false
  }
}

/**
 * Middleware helper to require CSRF token validation
 * Returns error response if validation fails
 */
export async function requireCSRFToken(
  request: NextRequest
): Promise<NextResponse | null> {
  const isValid = await validateCSRFToken(request)

  if (!isValid) {
    return NextResponse.json(
      { error: 'Invalid or missing CSRF token' },
      { status: 403 }
    )
  }

  return null
}

/**
 * Higher-order function to wrap API routes with CSRF protection
 * @param handler - The API route handler
 * @returns Wrapped handler with CSRF validation
 */
export function withCSRFProtection(
  handler: (request: NextRequest) => Promise<NextResponse>
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    // Skip CSRF check for GET and HEAD requests
    if (request.method === 'GET' || request.method === 'HEAD') {
      return handler(request)
    }

    // Validate CSRF token for state-changing requests
    const csrfError = await requireCSRFToken(request)
    if (csrfError) {
      return csrfError
    }

    return handler(request)
  }
}
