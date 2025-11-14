import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { rateLimit } from '@/lib/rateLimit'

/**
 * Get Mapbox token server-side with authentication and rate limiting
 * 
 * Security features:
 * - Requires authenticated user
 * - Rate limiting (10 requests per minute per user)
 * - Token stays server-side
 */
export async function GET(request: NextRequest) {
  try {
    // 1. Check authentication
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized. Please log in to access map features.' },
        { status: 401 }
      )
    }

    // 2. Rate limiting (10 requests per minute per user)
    const identifier = user.id
    const limitResult = await rateLimit(identifier, 10, 60) // 10 requests per 60 seconds

    if (!limitResult.success) {
      return NextResponse.json(
        {
          error: 'Rate limit exceeded',
          limit: limitResult.limit,
          reset: new Date(limitResult.reset).toISOString(),
        },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': limitResult.limit.toString(),
            'X-RateLimit-Remaining': limitResult.remaining.toString(),
            'X-RateLimit-Reset': limitResult.reset.toString(),
            'Retry-After': Math.ceil((limitResult.reset - Date.now()) / 1000).toString(),
          },
        }
      )
    }

    // 3. Get token from environment
    const token = process.env.MAPBOX_TOKEN

    if (!token) {
      console.error('❌ MAPBOX_TOKEN not configured in environment')
      return NextResponse.json(
        { error: 'Mapbox token not configured' },
        { status: 500 }
      )
    }

    // 4. Return token with rate limit headers
    return NextResponse.json(
      { token },
      {
        headers: {
          'X-RateLimit-Limit': limitResult.limit.toString(),
          'X-RateLimit-Remaining': limitResult.remaining.toString(),
          'X-RateLimit-Reset': limitResult.reset.toString(),
          'Cache-Control': 'private, no-cache, no-store, must-revalidate',
        },
      }
    )
  } catch (error) {
    console.error('Error in mapbox-token API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

