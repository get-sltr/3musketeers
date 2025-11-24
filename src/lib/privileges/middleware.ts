/**
 * SLTR Privilege System - API Middleware
 * Backend protection for API routes
 * Optimized for 100,000+ concurrent users
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { Feature } from './types'
import { canUseFeature } from './checker'
import { getCachedProfile } from './cache'

/**
 * Middleware to require authentication
 * Returns user ID if authenticated, error response if not
 */
export async function requireAuth(
  request: NextRequest
): Promise<{ userId: string } | NextResponse> {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  return { userId: user.id }
}

/**
 * Middleware to require Plus subscription
 * Use this to protect Plus-only API endpoints
 *
 * Example usage:
 * ```ts
 * export async function POST(request: NextRequest) {
 *   const authCheck = await requirePlus(request)
 *   if (authCheck instanceof NextResponse) return authCheck
 *
 *   // User is Plus - proceed with logic
 *   const { userId } = authCheck
 *   // ...
 * }
 * ```
 */
export async function requirePlus(
  request: NextRequest
): Promise<{ userId: string } | NextResponse> {
  const authCheck = await requireAuth(request)
  if (authCheck instanceof NextResponse) return authCheck

  const { userId } = authCheck
  const supabase = createClient()

  // Use cached profile lookup (FAST)
  const profile = await getCachedProfile(userId, async () => {
    const { data } = await supabase
      .from('profiles')
      .select('id, subscription_tier, subscription_expires_at, is_super_admin')
      .eq('id', userId)
      .single()

    return data || null
  })

  if (!profile || profile.subscription_tier !== 'plus') {
    return NextResponse.json(
      {
        error: 'Plus subscription required',
        message: 'This feature requires SLTR Plus',
        upgrade_url: '/sltr-plus',
      },
      { status: 403 }
    )
  }

  return { userId }
}

/**
 * Middleware to check specific feature access
 * Use this for features with usage limits
 *
 * Example:
 * ```ts
 * export async function POST(request: NextRequest) {
 *   const featureCheck = await requireFeature(request, 'video_calls')
 *   if (featureCheck instanceof NextResponse) return featureCheck
 *
 *   // User has access - proceed
 *   const { userId } = featureCheck
 *   // ...
 * }
 * ```
 */
export async function requireFeature(
  request: NextRequest,
  feature: Feature
): Promise<{ userId: string } | NextResponse> {
  const authCheck = await requireAuth(request)
  if (authCheck instanceof NextResponse) return authCheck

  const { userId } = authCheck

  // Check feature access with caching and limits
  const result = await canUseFeature(userId, feature)

  if (!result.allowed) {
    const status = result.upgradeRequired ? 403 : 429 // 429 = rate limit

    return NextResponse.json(
      {
        error: result.reason || 'Feature access denied',
        feature,
        ...(result.limit && { limit: result.limit }),
        ...(result.remaining !== undefined && { remaining: result.remaining }),
        ...(result.upgradeRequired && { upgrade_url: '/sltr-plus' }),
      },
      { status }
    )
  }

  return { userId }
}

/**
 * Wrapper for API route with privilege checking
 * Cleaner syntax for protecting entire routes
 *
 * Example:
 * ```ts
 * export const POST = withFeature('video_calls', async (request, { userId }) => {
 *   // User has video_calls access
 *   return NextResponse.json({ success: true })
 * })
 * ```
 */
export function withFeature(
  feature: Feature,
  handler: (
    request: NextRequest,
    context: { userId: string }
  ) => Promise<NextResponse> | NextResponse
) {
  return async (request: NextRequest) => {
    const check = await requireFeature(request, feature)
    if (check instanceof NextResponse) return check

    return handler(request, check)
  }
}

/**
 * Wrapper for Plus-only routes
 */
export function withPlus(
  handler: (
    request: NextRequest,
    context: { userId: string }
  ) => Promise<NextResponse> | NextResponse
) {
  return async (request: NextRequest) => {
    const check = await requirePlus(request)
    if (check instanceof NextResponse) return check

    return handler(request, check)
  }
}

/**
 * Wrapper for authenticated routes (no privilege check)
 */
export function withAuth(
  handler: (
    request: NextRequest,
    context: { userId: string }
  ) => Promise<NextResponse> | NextResponse
) {
  return async (request: NextRequest) => {
    const check = await requireAuth(request)
    if (check instanceof NextResponse) return check

    return handler(request, check)
  }
}
