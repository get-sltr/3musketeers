/**
 * SLTR Privilege System - React Hooks
 * Optimized with caching for high-traffic performance
 * Handles 50+ concurrent users without database overload
 */

'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Feature, Profile, PrivilegeCheckResult } from '@/lib/privileges/types'
import {
  hasFeature,
  isPlusSubscriber,
  getActiveTier,
  canUseFeature,
  checkDTFNLimit,
  recordDTFNActivation,
} from '@/lib/privileges/checker'

// ==================== IN-MEMORY CACHE ====================
// Prevents repeated database calls for the same user
// Cache expires after 5 minutes to stay fresh
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

interface CacheEntry<T> {
  data: T
  timestamp: number
}

const profileCache = new Map<string, CacheEntry<Profile>>()

function getCachedProfile(userId: string): Profile | null {
  const cached = profileCache.get(userId)
  if (!cached) return null

  const age = Date.now() - cached.timestamp
  if (age > CACHE_DURATION) {
    profileCache.delete(userId)
    return null
  }

  return cached.data
}

function setCachedProfile(userId: string, profile: Profile): void {
  profileCache.set(userId, {
    data: profile,
    timestamp: Date.now(),
  })
}

// ==================== HOOKS ====================

/**
 * Get current user's profile with caching
 * Optimized: Only fetches once, then caches
 */
export function useUserProfile() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    let isMounted = true

    async function loadProfile() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user || !isMounted) {
          setLoading(false)
          return
        }

        // Check cache first (PERFORMANCE OPTIMIZATION)
        const cached = getCachedProfile(user.id)
        if (cached) {
          setProfile(cached)
          setLoading(false)
          return
        }

        // Fetch from database only if not cached
        const { data, error } = await supabase
          .from('profiles')
          .select('id, subscription_tier, subscription_expires_at, is_super_admin')
          .eq('id', user.id)
          .single()

        if (data && isMounted) {
          const profileData = data as Profile
          setProfile(profileData)
          setCachedProfile(user.id, profileData) // Cache it
        }
      } catch (err) {
        console.error('Error loading profile:', err)
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    loadProfile()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      loadProfile()
    })

    return () => {
      isMounted = false
      subscription?.unsubscribe()
    }
  }, [supabase])

  return { profile, loading }
}

/**
 * Check if user has a specific feature
 * Optimized with memoization
 */
export function useHasFeature(feature: Feature) {
  const { profile, loading } = useUserProfile()

  const allowed = useMemo(() => {
    if (loading || !profile) return false
    return hasFeature(profile, feature)
  }, [profile, feature, loading])

  return { allowed, loading, tier: profile ? getActiveTier(profile) : 'free' }
}

/**
 * Check if user is Plus subscriber
 */
export function useIsPlusSubscriber() {
  const { profile, loading } = useUserProfile()

  const isPlus = useMemo(() => {
    if (!profile) return false
    return isPlusSubscriber(profile)
  }, [profile])

  return { isPlus, loading }
}

/**
 * Check feature with limits (async)
 * Use this for features with usage limits
 */
export function useFeatureLimit(feature: Feature) {
  const { profile } = useUserProfile()
  const [result, setResult] = useState<PrivilegeCheckResult | null>(null)
  const [checking, setChecking] = useState(false)

  const checkLimit = useCallback(async () => {
    if (!profile) return

    setChecking(true)
    try {
      const res = await canUseFeature(profile.id, feature)
      setResult(res)
    } catch (err) {
      console.error('Error checking feature limit:', err)
    } finally {
      setChecking(false)
    }
  }, [profile, feature])

  useEffect(() => {
    checkLimit()
  }, [checkLimit])

  return { result, checking, recheckLimit: checkLimit }
}

/**
 * DTFN activation hook with limit checking
 */
export function useDTFNLimit() {
  const { profile } = useUserProfile()
  const [limit, setLimit] = useState<{
    canActivate: boolean
    activationsUsed: number
    remaining: number
  } | null>(null)
  const [loading, setLoading] = useState(false)

  const checkLimit = useCallback(async () => {
    if (!profile) return

    setLoading(true)
    try {
      const result = await checkDTFNLimit(profile.id)
      setLimit(result)
    } catch (err) {
      console.error('Error checking DTFN limit:', err)
    } finally {
      setLoading(false)
    }
  }, [profile])

  const activateDTFN = useCallback(async () => {
    if (!profile || !limit?.canActivate) return false

    try {
      await recordDTFNActivation(profile.id)
      await checkLimit() // Refresh limit
      return true
    } catch (err) {
      console.error('Error activating DTFN:', err)
      return false
    }
  }, [profile, limit, checkLimit])

  useEffect(() => {
    checkLimit()
  }, [checkLimit])

  return { limit, loading, activateDTFN, recheckLimit: checkLimit }
}

/**
 * Hook to require Plus subscription (redirects if needed)
 */
export function useRequirePlus(feature: Feature, redirectUrl = '/sltr-plus') {
  const { profile, loading } = useUserProfile()
  const [shouldRedirect, setShouldRedirect] = useState(false)

  useEffect(() => {
    if (loading || !profile) return

    const allowed = hasFeature(profile, feature)
    if (!allowed) {
      setShouldRedirect(true)
    }
  }, [profile, feature, loading])

  return { shouldRedirect, redirectUrl, loading }
}
