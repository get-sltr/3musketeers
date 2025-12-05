import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient, isAdmin } from '@/lib/admin'

export const dynamic = 'force-dynamic'

/**
 * GET /api/admin/stats
 * Get moderation dashboard statistics
 */
export async function GET(request: NextRequest) {
  try {
    // 1. Authenticate user
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // 2. Check admin status
    if (!await isAdmin(user.id)) {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      )
    }

    const adminClient = createAdminClient()

    // 3. Get report statistics
    const [
      { count: pendingReports },
      { count: totalReports },
      { count: todayReports },
      { count: weekReports }
    ] = await Promise.all([
      adminClient.from('reports').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
      adminClient.from('reports').select('*', { count: 'exact', head: true }),
      adminClient.from('reports').select('*', { count: 'exact', head: true }).gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()),
      adminClient.from('reports').select('*', { count: 'exact', head: true }).gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
    ])

    // 4. Get user statistics
    const [
      { count: totalUsers },
      { count: activeUsers },
      { count: suspendedUsers },
      { count: bannedUsers },
      { count: newUsersToday }
    ] = await Promise.all([
      adminClient.from('profiles').select('*', { count: 'exact', head: true }),
      adminClient.from('profiles').select('*', { count: 'exact', head: true }).eq('account_status', 'active'),
      adminClient.from('profiles').select('*', { count: 'exact', head: true }).eq('account_status', 'suspended'),
      adminClient.from('profiles').select('*', { count: 'exact', head: true }).eq('account_status', 'banned'),
      adminClient.from('profiles').select('*', { count: 'exact', head: true }).gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
    ])

    // 5. Get moderation action statistics
    const [
      { count: todayActions },
      { count: weekActions }
    ] = await Promise.all([
      adminClient.from('moderation_actions').select('*', { count: 'exact', head: true }).gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()),
      adminClient.from('moderation_actions').select('*', { count: 'exact', head: true }).gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
    ])

    // 6. Get reports by category
    const { data: reportsByCategory } = await adminClient
      .from('reports')
      .select('category')

    const categoryCounts: Record<string, number> = {}
    if (reportsByCategory) {
      reportsByCategory.forEach((report) => {
        categoryCounts[report.category] = (categoryCounts[report.category] || 0) + 1
      })
    }

    // 7. Get recent moderation actions
    const { data: recentActions } = await adminClient
      .from('moderation_actions')
      .select(`
        id,
        action_type,
        created_at,
        admin:profiles!admin_id (
          display_name
        ),
        target:profiles!target_user_id (
          display_name
        )
      `)
      .order('created_at', { ascending: false })
      .limit(10)

    // 8. Get most reported users
    const { data: mostReportedUsers } = await adminClient
      .from('reports')
      .select(`
        reported_user_id,
        reported:profiles!reported_user_id (
          id,
          display_name,
          photo_url
        )
      `)
      .eq('status', 'pending')

    const reportedUserCounts: Record<string, { user: any; count: number }> = {}
    if (mostReportedUsers) {
      mostReportedUsers.forEach((report) => {
        const userId = report.reported_user_id
        if (!reportedUserCounts[userId]) {
          reportedUserCounts[userId] = { user: report.reported, count: 0 }
        }
        const userEntry = reportedUserCounts[userId]
        if (userEntry) {
          userEntry.count++
        }
      })
    }

    const topReportedUsers = Object.values(reportedUserCounts)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)

    return NextResponse.json({
      reports: {
        pending: pendingReports || 0,
        total: totalReports || 0,
        today: todayReports || 0,
        thisWeek: weekReports || 0,
        byCategory: categoryCounts
      },
      users: {
        total: totalUsers || 0,
        active: activeUsers || 0,
        suspended: suspendedUsers || 0,
        banned: bannedUsers || 0,
        newToday: newUsersToday || 0
      },
      moderation: {
        actionsToday: todayActions || 0,
        actionsThisWeek: weekActions || 0,
        recentActions: recentActions || []
      },
      alerts: {
        topReportedUsers
      }
    })

  } catch (error: any) {
    console.error('Error fetching admin stats:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}
