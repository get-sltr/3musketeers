/**
 * SLTR Privilege System - React Hooks
 * Optimized with caching for high-traffic performance
 * Handles 50+ concurrent users without database overload
 */

'use client'

import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
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

// 🔓 INSTANT UNLOCK: Clear cache when subscription changes
export function invalidateProfileCache(userId?: string): void {
  if (userId) {
    profileCache.delete(userId)
  } else {
    profileCache.clear()
  }
}

// ==================== HOOKS ====================

/**
 * Get current user's profile with caching
 * Optimized: Only fetches once, then caches
 * 🔓 INSTANT UNLOCK: Realtime subscription for immediate updates after payment
 */
export function useUserProfile() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()
  const userIdRef = useRef<string | null>(null)
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)

  useEffect(() => {
    let isMounted = true

    async function loadProfile(skipCache = false) {
      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        
        if (authError || !user || !isMounted) {
          setLoading(false)
          return
        }
        
        // Set up realtime subscription for this user if not already done
        if (userIdRef.current !== user.id) {
          userIdRef.current = user.id
          
          // Clean up old channel safely
          try {
            if (channelRef.current) {
              supabase.removeChannel(channelRef.current)
            }
          } catch (e) {
            console.warn('Error removing channel:', e)
          }
          
          // 🔓 INSTANT UNLOCK: Realtime subscription for profile changes
          // Wrap in try-catch to prevent crashes
          try {
            channelRef.current = supabase
              .channel(`profile-${user.id}`)
              .on(
                'postgres_changes',
                {
                  event: 'UPDATE',
                  schema: 'public',
                  table: 'profiles',
                  filter: `id=eq.${user.id}`
                },
                (payload) => {
                  if (!isMounted) return
                  console.log('🔓 Profile updated - refreshing subscription status:', payload.new)
                  // Invalidate cache for all instances, then reload
                  invalidateProfileCache(user.id)
                  // Force reload to ensure all hook instances get fresh data
                  loadProfile(true)
                }
              )
              .subscribe()
          } catch (e) {
            console.warn('Error setting up realtime subscription:', e)
          }
        }

        // Check cache first (PERFORMANCE OPTIMIZATION)
        // Skip cache when called from realtime update
        if (!skipCache) {
          const cached = getCachedProfile(user.id)
          if (cached) {
            setProfile(cached)
            setLoading(false)
            return
          }
        }

        // Fetch from database - include founder status for unlimited access
        const { data, error } = await supabase
          .from('profiles')
          .select('id, subscription_tier, subscription_expires_at, is_super_admin, founder')
          .eq('id', user.id)
          .single()

        if (data && isMounted) {
          const profileData = {
            ...data,
            // Map founder/super_admin to effectively "plus" tier for privilege checks
            subscription_tier: (data.founder || data.is_super_admin) ? 'plus' : (data.subscription_tier || 'free')
          } as Profile
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
    const { data: { subscription: authSub } } = supabase.auth.onAuthStateChange(() => {
      loadProfile()
    })

    return () => {
      isMounted = false
      try {
        authSub?.unsubscribe()
      } catch (e) {
        console.warn('Error unsubscribing from auth:', e)
      }
      try {
        if (channelRef.current) {
          supabase.removeChannel(channelRef.current)
        }
      } catch (e) {
        console.warn('Error removing realtime channel:', e)
      }
    }
  }, [supabase])

  // 🔓 Function to force refresh (call after upgrade success page)
  const refreshProfile = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      invalidateProfileCache(user.id)
      const { data } = await supabase
        .from('profiles')
        .select('id, subscription_tier, subscription_expires_at, is_super_admin, founder')
        .eq('id', user.id)
        .single()
      
      if (data) {
        const profileData = {
          ...data,
          subscription_tier: (data.founder || data.is_super_admin) ? 'plus' : (data.subscription_tier || 'free')
        } as Profile
        setProfile(profileData)
        setCachedProfile(user.id, profileData)
      }
    }
  }, [supabase])

  return { profile, loading, refreshProfile }
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
