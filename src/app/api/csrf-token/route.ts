/**
 * CSRF Token API Route
 * Generates and returns CSRF tokens for client-side requests
 */

import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { randomBytes } from 'crypto'

export const dynamic = 'force-dynamic'

/**
 * GET /api/csrf-token
 * Returns a CSRF token for the current session
 */
export async function GET() {
  try {
    // Generate a cryptographically secure random token
    const token = randomBytes(32).toString('base64url')

    // Store token in httpOnly cookie for server-side validation
    const cookieStore = await cookies()
    cookieStore.set('csrf-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60, // 1 hour
      path: '/',
    })

    // Return token to client
    return NextResponse.json(
      { token },
      {
        status: 200,
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate',
        },
      }
    )
  } catch (error) {
    console.error('Error generating CSRF token:', error)
    return NextResponse.json(
      { error: 'Failed to generate CSRF token' },
      { status: 500 }
    )
  }
}
