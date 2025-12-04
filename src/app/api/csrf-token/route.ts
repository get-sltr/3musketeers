import { NextRequest, NextResponse } from 'next/server'
import { generateCsrfToken, getCsrfCookieOptions, CSRF_COOKIE_NAME } from '@/lib/csrf'

/**
 * GET /api/csrf-token
 *
 * Returns a CSRF token for the client to use in state-changing requests
 * The token is also set as an HTTP-only cookie
 */
export async function GET(request: NextRequest) {
  try {
    const token = await generateCsrfToken()

    const response = NextResponse.json({
      token,
      headerName: 'x-csrf-token',
    })

    // Set CSRF token in HTTP-only cookie
    response.cookies.set(CSRF_COOKIE_NAME, token, getCsrfCookieOptions())

    return response
  } catch (error) {
    console.error('Error generating CSRF token:', error)
    return NextResponse.json(
      { error: 'Failed to generate CSRF token' },
      { status: 500 }
    )
  }
}
