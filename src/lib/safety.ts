import { createClient } from '@/lib/supabase/client'

export interface BlockedUser {
  id?: string
  userId: string
  blockedAt: Date
  reason?: string
}

export interface Report {
  id?: string
  reportedUserId: string
  reporterUserId: string
  reason: string
  category: 'harassment' | 'fake' | 'inappropriate' | 'spam' | 'other'
  timestamp: Date
  status: 'pending' | 'reviewed' | 'resolved' | 'dismissed'
}

// ============================================
// BLOCKING FUNCTIONS
// ============================================

/**
 * Block a user
 * @param userId - The user ID to block
 * @param reason - Optional reason for blocking
 * @returns Success status and error if any
 */
export const blockUser = async (userId: string, reason?: string): Promise<{ success: boolean; error?: string }> => {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    // Check if already blocked
    const { data: existing } = await supabase
      .from('blocks')
      .select('id')
      .eq('blocker_id', user.id)
      .eq('blocked_id', userId)
      .single()

    if (existing) {
      return { success: true } // Already blocked
    }

    // Insert block using the database function
    const { error } = await supabase.rpc('block_user', {
      target_user_id: userId
    })

    if (error) {
      console.error('Error blocking user:', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error: any) {
    console.error('Error in blockUser:', error)
    return { success: false, error: error.message || 'Failed to block user' }
  }
}

/**
 * Unblock a user
 * @param userId - The user ID to unblock
 * @returns Success status and error if any
 */
export const unblockUser = async (userId: string): Promise<{ success: boolean; error?: string }> => {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    const { error } = await supabase.rpc('unblock_user', {
      target_user_id: userId
    })

    if (error) {
      console.error('Error unblocking user:', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error: any) {
    console.error('Error in unblockUser:', error)
    return { success: false, error: error.message || 'Failed to unblock user' }
  }
}

/**
 * Get list of blocked users for current user
 * @returns Array of blocked user IDs
 */
export const getBlockedUsers = async (): Promise<BlockedUser[]> => {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      console.log('No user found when fetching blocked users')
      return []
    }

    console.log('Fetching blocks for user:', user.id)

    const { data, error } = await supabase
      .from('blocks')
      .select('id, blocked_id, created_at')
      .eq('blocker_id', user.id)
      .order('created_at', { ascending: false })

    console.log('Blocks query result:', { data, error })

    if (error) {
      console.error('Error fetching blocked users:', error)
      return []
    }

    return (data || []).map(block => ({
      id: block.id,
      userId: block.blocked_id,
      blockedAt: new Date(block.created_at),
      reason: undefined
    }))
  } catch (error) {
    console.error('Error in getBlockedUsers:', error)
    return []
  }
}

/**
 * Get list of blocked user IDs only (for filtering)
 * @returns Array of blocked user ID strings
 */
export const getBlockedUserIds = async (): Promise<string[]> => {
  const blocked = await getBlockedUsers()
  return blocked.map(b => b.userId)
}

/**
 * Check if a specific user is blocked
 * @param userId - The user ID to check
 * @returns True if user is blocked
 */
export const isUserBlocked = async (userId: string): Promise<boolean> => {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return false
    }

    const { data, error } = await supabase
      .from('blocks')
      .select('id')
      .eq('blocker_id', user.id)
      .eq('blocked_id', userId)
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error checking if user is blocked:', error)
      return false
    }

    return !!data
  } catch (error) {
    console.error('Error in isUserBlocked:', error)
    return false
  }
}

// ============================================
// REPORTING FUNCTIONS
// ============================================

/**
 * Submit a report about a user
 * @param report - Report details (without timestamp and status)
 * @returns Success status and error if any
 */
export const submitReport = async (
  report: Omit<Report, 'timestamp' | 'status' | 'id'>
): Promise<{ success: boolean; error?: string }> => {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    // Verify reporter is the current user
    if (report.reporterUserId !== user.id) {
      return { success: false, error: 'Reporter ID mismatch' }
    }

    // Insert report
    const { error } = await supabase
      .from('reports')
      .insert({
        reporter_user_id: report.reporterUserId,
        reported_user_id: report.reportedUserId,
        category: report.category,
        reason: report.reason,
        status: 'pending'
      })

    if (error) {
      console.error('Error submitting report:', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error: any) {
    console.error('Error in submitReport:', error)
    return { success: false, error: error.message || 'Failed to submit report' }
  }
}

/**
 * Get reports submitted by current user
 * @returns Array of reports
 */
export const getReports = async (): Promise<Report[]> => {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return []
    }

    const { data, error } = await supabase
      .from('reports')
      .select('id, reporter_user_id, reported_user_id, category, reason, status, created_at')
      .eq('reporter_user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching reports:', error)
      return []
    }

    return (data || []).map(report => ({
      id: report.id,
      reporterUserId: report.reporter_user_id,
      reportedUserId: report.reported_user_id,
      category: report.category as Report['category'],
      reason: report.reason,
      status: report.status as Report['status'],
      timestamp: new Date(report.created_at)
    }))
  } catch (error) {
    console.error('Error in getReports:', error)
    return []
  }
}

/**
 * Check if current user has already reported a specific user
 * @param userId - The reported user ID to check
 * @returns True if already reported
 */
export const hasReportedUser = async (userId: string): Promise<boolean> => {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return false
    }

    const { data, error } = await supabase
      .from('reports')
      .select('id')
      .eq('reporter_user_id', user.id)
      .eq('reported_user_id', userId)
      .limit(1)

    if (error) {
      console.error('Error checking if user reported:', error)
      return false
    }

    return (data?.length || 0) > 0
  } catch (error) {
    console.error('Error in hasReportedUser:', error)
    return false
  }
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Filter out blocked users from a list of user IDs
 * @param userIds - Array of user IDs to filter
 * @returns Filtered array without blocked users
 */
export const filterBlockedUsers = async (userIds: string[]): Promise<string[]> => {
  const blockedIds = await getBlockedUserIds()
  return userIds.filter(id => !blockedIds.includes(id))
}

/**
 * Check if two users have blocked each other
 * @param userId - The other user's ID
 * @returns True if either user has blocked the other
 */
export const isMutuallyBlocked = async (userId: string): Promise<boolean> => {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return false
    }

    // Check if current user blocked them OR they blocked current user
    const { data, error } = await supabase
      .from('blocks')
      .select('id')
      .or(`and(blocker_id.eq.${user.id},blocked_id.eq.${userId}),and(blocker_id.eq.${userId},blocked_id.eq.${user.id})`)
      .limit(1)

    if (error) {
      console.error('Error checking mutual block:', error)
      return false
    }

    return (data?.length || 0) > 0
  } catch (error) {
    console.error('Error in isMutuallyBlocked:', error)
    return false
  }
}
