/**
 * SLTR Simple Privilege System
 * ONE CHECK at login - stores in memory
 * ON/OFF switch - either you have sltr∝ or you don't
 *
 * NO database calls after login!
 * NO checking every click!
 * Just a simple boolean flag in memory!
 */

'use client'

// Simple global state - ONE check per user session
let isProUser: boolean = false
let isChecked: boolean = false
let userId: string | null = null

/**
 * Check user subscription ONCE at login
 * Stores result in memory for entire session
 */
export async function checkSubscriptionOnLogin(userIdToCheck: string): Promise<boolean> {
  // Already checked this session
  if (isChecked && userId === userIdToCheck) {
    return isProUser
  }

  // Import supabase only when needed
  const { createClient } = await import('@/lib/supabase/client')
  const supabase = createClient()

  // ONE database query - that's it!
  const { data } = await supabase
    .from('profiles')
    .select('subscription_tier, subscription_expires_at, is_super_admin')
    .eq('id', userIdToCheck)
    .single()

  if (!data) {
    isProUser = false
    isChecked = true
    userId = userIdToCheck
    return false
  }

  // Check if pro
  const isPro =
    data.is_super_admin === true ||
    (data.subscription_tier === 'plus' &&
     (!data.subscription_expires_at || new Date(data.subscription_expires_at) > new Date()))

  // Store in memory
  isProUser = isPro
  isChecked = true
  userId = userIdToCheck

  console.log(`✅ Subscription check: ${isPro ? 'sltr∝' : 'free'}`)

  return isPro
}

/**
 * Simple ON/OFF check
 * Returns true if user has sltr∝, false if free
 * NO database call - uses cached value from login
 */
export function isPro(): boolean {
  return isProUser
}

/**
 * Check if user can use a feature
 * Pro users: everything is ON
 * Free users: check specific limits
 */
export function canUseFeature(feature: string): boolean {
  // Pro users = ALL FEATURES ON
  if (isProUser) return true

  // Free users = specific features only
  const freeFeatures = [
    'basic_messaging',
    'profile_view',
    'basic_search',
    'basic_filters',
  ]

  return freeFeatures.includes(feature)
}

/**
 * Show upgrade modal if feature is blocked
 */
export function requiresUpgrade(feature: string): boolean {
  return !canUseFeature(feature)
}

/**
 * Reset check (for logout)
 */
export function resetSubscriptionCheck() {
  isProUser = false
  isChecked = false
  userId = null
}

/**
 * Get current subscription status
 */
export function getSubscriptionStatus() {
  return {
    isPro: isProUser,
    tier: isProUser ? 'plus' : 'free',
    checked: isChecked,
  }
}
