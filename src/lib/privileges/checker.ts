/**
 * SLTR Privilege System - Core Checker
 * Clean, reusable privilege checking logic
 */

import { createClient } from '@/lib/supabase/client'
import { Feature, Profile, PrivilegeCheckResult, SubscriptionTier } from './types'
import { FEATURE_LIMITS, requiresPlusSubscription } from './config'

/**
 * Get user's active subscription tier
 * Handles expiration checks
 */
export function getActiveTier(profile: Profile | null): SubscriptionTier {
  if (!profile) return 'free'

  // Super admin always has Plus benefits
  if (profile.is_super_admin) return 'plus'

  // Check if subscription is expired
  if (profile.subscription_tier === 'plus' && profile.subscription_expires_at) {
    const expiryDate = new Date(profile.subscription_expires_at)
    if (expiryDate < new Date()) {
      return 'free' // Subscription expired
    }
  }

  return profile.subscription_tier || 'free'
}

/**
 * Check if user is a Plus subscriber
 */
export function isPlusSubscriber(profile: Profile | null): boolean {
  return getActiveTier(profile) === 'plus'
}

/**
 * Check if user has access to a specific feature
 * Simple boolean check without limits
 */
export function hasFeature(profile: Profile | null, feature: Feature): boolean {
  if (!profile) return false

  // Super admin has all features
  if (profile.is_super_admin) return true

  const tier = getActiveTier(profile)
  const featureConfig = FEATURE_LIMITS[feature]

  // Plus tier has access to all features
  if (tier === 'plus') return true

  // Free tier only has access to free features
  return featureConfig.tier === 'free'
}

/**
 * Check if user can use a feature (with limit checking)
 * Returns detailed result with remaining usage
 * OPTIMIZED: Uses multi-tier caching for 100k+ users
 */
export async function canUseFeature(
  userId: string,
  feature: Feature
): Promise<PrivilegeCheckResult> {
  const supabase = createClient()

  // Get user profile with caching (PERFORMANCE CRITICAL)
  const { getCachedProfile, checkRateLimit } = await import('./cache')

  // Rate limit check (prevent abuse)
  if (!checkRateLimit(userId, 1000, 60000)) { // 1000 req/min per user
    return {
      allowed: false,
      reason: 'Rate limit exceeded',
      upgradeRequired: false,
    }
  }

  // Get profile from cache or database
  const profile = await getCachedProfile(userId, async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, subscription_tier, subscription_expires_at, is_super_admin')
      .eq('id', userId)
      .single()

    return error ? null : (data as Profile)
  })

  if (!profile) {
    return {
      allowed: false,
      reason: 'User not found',
      upgradeRequired: false,
    }
  }

  const tier = getActiveTier(profile)
  const featureConfig = FEATURE_LIMITS[feature]

  // Check tier access
  if (featureConfig.tier === 'plus' && tier !== 'plus') {
    return {
      allowed: false,
      reason: `${feature} requires SLTR Plus`,
      upgradeRequired: true,
    }
  }

  // For features with limits, check usage
  if (featureConfig.limit !== undefined) {
    const usage = await getFeatureUsage(userId, feature, featureConfig.period)

    if (usage >= featureConfig.limit) {
      return {
        allowed: false,
        reason: `Daily limit reached for ${feature}`,
        remaining: 0,
        limit: featureConfig.limit,
        upgradeRequired: true,
      }
    }

    return {
      allowed: true,
      remaining: featureConfig.limit - usage,
      limit: featureConfig.limit,
      upgradeRequired: false,
    }
  }

  // No limits - allowed
  return {
    allowed: true,
    upgradeRequired: false,
  }
}

/**
 * Get current usage for a feature with limits
 */
async function getFeatureUsage(
  userId: string,
  feature: Feature,
  period?: 'day' | 'week' | 'month' | 'lifetime'
): Promise<number> {
  const supabase = createClient()

  // Calculate time range based on period
  let startDate: string | undefined
  const now = new Date()

  switch (period) {
    case 'day':
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
      break
    case 'week':
      const weekStart = new Date(now)
      weekStart.setDate(now.getDate() - now.getDay())
      startDate = weekStart.toISOString()
      break
    case 'month':
      startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
      break
    case 'lifetime':
    default:
      startDate = undefined
  }

  // Query different tables based on feature
  switch (feature) {
    case 'basic_messaging': {
      const query = supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('sender_id', userId)

      if (startDate) {
        query.gte('created_at', startDate)
      }

      const { count } = await query
      return count || 0
    }

    case 'profile_view': {
      const query = supabase
        .from('profile_views')
        .select('*', { count: 'exact', head: true })
        .eq('viewer_id', userId)

      if (startDate) {
        query.gte('viewed_at', startDate)
      }

      const { count } = await query
      return count || 0
    }

    default:
      return 0
  }
}

/**
 * Check DTFN activation limit (special case)
 */
export async function checkDTFNLimit(
  userId: string
): Promise<{ canActivate: boolean; activationsUsed: number; remaining: number }> {
  const supabase = createClient()

  // Check if user is Plus subscriber
  const { data: profile } = await supabase
    .from('profiles')
    .select('subscription_tier, subscription_expires_at, is_super_admin')
    .eq('id', userId)
    .single()

  const tier = getActiveTier(profile)

  // Plus users have unlimited
  if (tier === 'plus') {
    return {
      canActivate: true,
      activationsUsed: 0,
      remaining: -1, // -1 = unlimited
    }
  }

  // Free users: check activation count
  const { count } = await supabase
    .from('dtfn_activations')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)

  const activationsUsed = count || 0
  const FREE_LIMIT = 4

  return {
    canActivate: activationsUsed < FREE_LIMIT,
    activationsUsed,
    remaining: Math.max(0, FREE_LIMIT - activationsUsed),
  }
}

/**
 * Record DTFN activation
 */
export async function recordDTFNActivation(userId: string): Promise<void> {
  const supabase = createClient()
  await supabase.from('dtfn_activations').insert({
    user_id: userId,
    activated_at: new Date().toISOString(),
  })
}

/**
 * Record feature usage (for tracking/analytics)
 */
export async function recordFeatureUsage(userId: string, feature: Feature): Promise<void> {
  const supabase = createClient()

  // Optional: Create a feature_usage table for analytics
  // This is helpful for understanding what features users want
  await supabase.from('feature_usage').insert({
    user_id: userId,
    feature,
    used_at: new Date().toISOString(),
  }).then(() => {
    // Silently fail if table doesn't exist
  }).catch(() => {
    // Feature tracking is optional
  })
}
