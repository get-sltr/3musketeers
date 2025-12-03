import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

/**
 * GET /api/admin/stats
 * Get aggregate statistics for admin dashboard (super admin only)
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if user is super admin
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('is_super_admin')
      .eq('id', user.id)
      .single()

    if (profileError || !profile?.is_super_admin) {
      return NextResponse.json(
        { error: 'Forbidden: Super admin access required' },
        { status: 403 }
      )
    }

    // Get moderation stats using the database function
    const { data: moderationStats, error: modStatsError } = await supabase
      .rpc('get_moderation_stats', { p_admin_id: user.id })
      .single()

    if (modStatsError) {
      console.error('Error fetching moderation stats:', modStatsError)
      // Continue without moderation stats if function doesn't exist yet
    }

    // Get report category breakdown
    const { data: categoryBreakdown, error: categoryError } = await supabase
      .from('reports')
      .select('category, status')

    let categories: Record<string, { total: number; pending: number }> = {}
    if (!categoryError && categoryBreakdown) {
      for (const report of categoryBreakdown) {
        const category = report.category
        if (!categories[category]) {
          categories[category] = { total: 0, pending: 0 }
        }
        const cat = categories[category]
        if (cat) {
          cat.total++
          if (report.status === 'pending') {
            cat.pending++
          }
        }
      }
    }

    // Get recent moderation actions
    const { data: recentActions, error: actionsError } = await supabase
      .from('moderation_actions')
      .select(`
        id,
        action_type,
        reason,
        created_at,
        target:profiles!target_user_id (
          id,
          display_name,
          photo_url
        ),
        admin:profiles!admin_user_id (
          id,
          display_name
        )
      `)
      .order('created_at', { ascending: false })
      .limit(10)

    if (actionsError) {
      console.error('Error fetching recent actions:', actionsError)
      // Continue without recent actions
    }

    // Get top reported users
    const { data: topReported, error: topReportedError } = await supabase
      .rpc('get_top_reported_users', { p_admin_id: user.id, p_limit: 5 })

    if (topReportedError) {
      console.error('Error fetching top reported users:', topReportedError)
      // Continue without top reported users
    }

    return NextResponse.json({
      stats: moderationStats || {
        total_reports: 0,
        pending_reports: 0,
        reviewed_reports: 0,
        resolved_reports: 0,
        dismissed_reports: 0,
        total_users: 0,
        active_users: 0,
        warned_users: 0,
        suspended_users: 0,
        banned_users: 0,
        total_moderation_actions: 0,
        actions_last_24h: 0,
        actions_last_7d: 0
      },
      category_breakdown: categories,
      recent_actions: recentActions || [],
      top_reported_users: topReported || []
    })

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('Error in admin stats API:', message)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
