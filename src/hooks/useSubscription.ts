/**
 * React hook for subscription status
 * Checks ONCE at login, then uses cached value
 */

'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { checkSubscriptionOnLogin, isPro, resetSubscriptionCheck } from '@/lib/privileges/simple-switch'

export function useSubscription() {
  const [isProUser, setIsProUser] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    async function checkSubscription() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        setIsProUser(false)
        setLoading(false)
        return
      }

      // ONE CHECK - stores result in memory
      const isPro = await checkSubscriptionOnLogin(user.id)

      if (mounted) {
        setIsProUser(isPro)
        setLoading(false)
      }
    }

    checkSubscription()

    // Listen for auth changes
    const supabase = createClient()
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        resetSubscriptionCheck()
        setIsProUser(false)
      } else if (event === 'SIGNED_IN') {
        checkSubscription()
      }
    })

    return () => {
      mounted = false
      subscription?.unsubscribe()
    }
  }, [])

  return {
    isPro: isProUser,
    tier: isProUser ? 'plus' : 'free',
    loading,
  }
}

/**
 * Simple feature check hook
 */
export function useFeatureAccess(feature: string) {
  const { isPro, loading } = useSubscription()

  const allowed = isPro || [
    'basic_messaging',
    'profile_view',
    'basic_search',
    'basic_filters'
  ].includes(feature)

  return {
    allowed,
    requiresUpgrade: !allowed,
    loading,
  }
}
