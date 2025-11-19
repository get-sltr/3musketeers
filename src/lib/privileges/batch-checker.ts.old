/**
 * SLTR Privilege System - Batch Checker
 * For checking privileges of multiple users at once
 * CRITICAL for performance when displaying grids of 100+ users
 */

import { createClient } from '@/lib/supabase/client'
import { Profile, SubscriptionTier } from './types'
import { getCachedProfile, setCachedProfile } from './cache'

/**
 * Batch check subscription tiers for multiple users
 * Returns a Map of userId -> tier
 *
 * PERFORMANCE: Single query for all users instead of N queries
 */
export async function batchCheckSubscriptionTiers(
  userIds: string[]
): Promise<Map<string, SubscriptionTier>> {
  if (userIds.length === 0) return new Map()

  const supabase = createClient()
  const result = new Map<string, SubscriptionTier>()

  // Check cache first
  const uncachedIds: string[] = []

  for (const userId of userIds) {
    const cached = getCachedProfile(userId, async () => null)
    if (cached) {
      const tier = getActiveTier(cached)
      result.set(userId, tier)
    } else {
      uncachedIds.push(userId)
    }
  }

  // Fetch uncached users in a single query
  if (uncachedIds.length > 0) {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, subscription_tier, subscription_expires_at, is_super_admin')
      .in('id', uncachedIds)

    if (profiles) {
      for (const profile of profiles) {
        const typedProfile = profile as Profile

        // Cache it
        setCachedProfile(profile.id, typedProfile)

        // Get tier
        const tier = getActiveTier(typedProfile)
        result.set(profile.id, tier)
      }
    }
  }

  return result
}

/**
 * Get active tier with expiration check
 */
function getActiveTier(profile: Profile | null): SubscriptionTier {
  if (!profile) return 'free'

  // Super admin always has plus benefits
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
 * Batch check if users have a specific feature
 * Returns a Map of userId -> boolean
 */
export async function batchCheckFeatureAccess(
  userIds: string[],
  feature: string
): Promise<Map<string, boolean>> {
  const tiers = await batchCheckSubscriptionTiers(userIds)
  const result = new Map<string, boolean>()

  for (const [userId, tier] of tiers.entries()) {
    // For now, all features are either free or plus
    // Plus tier has access to everything
    result.set(userId, tier === 'plus')
  }

  return result
}

/**
 * Add tier information to a list of users
 * Efficient for grid views with many users
 *
 * Example:
 * const usersWithTiers = await addSubscriptionTiers(users)
 */
export async function addSubscriptionTiers<T extends { id: string }>(
  users: T[]
): Promise<(T & { subscription_tier: SubscriptionTier })[]> {
  if (users.length === 0) return []

  const userIds = users.map(u => u.id)
  const tiers = await batchCheckSubscriptionTiers(userIds)

  return users.map(user => ({
    ...user,
    subscription_tier: tiers.get(user.id) || 'free',
  }))
}

/**
 * Get cached profile (internal helper)
 */
function getCachedProfile(userId: string, fetchFn: () => Promise<Profile | null>): Profile | null {
  // Import here to avoid circular dependency
  const { getCachedProfile: _getCachedProfile } = require('./cache')
  return _getCachedProfile(userId, fetchFn)
}
