'use client'

import { useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

interface UsageResult {
  allowed: boolean
  current: number
  limit: number
  remaining: number
  tier: string
}

interface RecordResult {
  success: boolean
  counted: boolean
  error?: string
  usage: UsageResult
}

/**
 * Hook for checking and recording usage limits
 * Used for message sending and profile viewing limits
 */
export function useUsageLimits() {
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  /**
   * Check if user can perform an action
   */
  const checkLimit = useCallback(async (
    actionType: 'message_sent' | 'profile_viewed'
  ): Promise<UsageResult | null> => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return null

      const { data, error } = await supabase.rpc('can_perform_action', {
        p_user_id: user.id,
        p_action_type: actionType
      })

      if (error) {
        console.error('Error checking limit:', error)
        return null
      }

      return data as UsageResult
    } catch (err) {
      console.error('Error in checkLimit:', err)
      return null
    }
  }, [supabase])

  /**
   * Record an action (message sent or profile viewed)
   * Returns whether the action was allowed
   */
  const recordUsage = useCallback(async (
    actionType: 'message_sent' | 'profile_viewed',
    targetId?: string
  ): Promise<RecordResult | null> => {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return null

      const { data, error } = await supabase.rpc('record_usage', {
        p_user_id: user.id,
        p_action_type: actionType,
        p_target_id: targetId || null
      })

      if (error) {
        console.error('Error recording usage:', error)
        return null
      }

      return data as RecordResult
    } catch (err) {
      console.error('Error in recordUsage:', err)
      return null
    } finally {
      setLoading(false)
    }
  }, [supabase])

  /**
   * Get current daily message count
   */
  const getMessageCount = useCallback(async (): Promise<UsageResult | null> => {
    return checkLimit('message_sent')
  }, [checkLimit])

  /**
   * Get current daily profile view count
   */
  const getProfileViewCount = useCallback(async (): Promise<UsageResult | null> => {
    return checkLimit('profile_viewed')
  }, [checkLimit])

  /**
   * Check and record a message send
   * Returns false if limit reached
   */
  const canSendMessage = useCallback(async (): Promise<{ allowed: boolean; remaining: number; limit: number }> => {
    const result = await recordUsage('message_sent')
    
    if (!result) {
      return { allowed: true, remaining: 999, limit: 999 } // Fail open if error
    }

    return {
      allowed: result.success,
      remaining: result.usage.remaining,
      limit: result.usage.limit
    }
  }, [recordUsage])

  /**
   * Check and record a profile view
   * Returns false if limit reached
   */
  const canViewProfile = useCallback(async (profileId: string): Promise<{ allowed: boolean; remaining: number }> => {
    const result = await recordUsage('profile_viewed', profileId)
    
    if (!result) {
      return { allowed: true, remaining: 999 } // Fail open if error
    }

    return {
      allowed: result.success,
      remaining: result.usage.remaining
    }
  }, [recordUsage])

  return {
    loading,
    checkLimit,
    recordUsage,
    getMessageCount,
    getProfileViewCount,
    canSendMessage,
    canViewProfile
  }
}

