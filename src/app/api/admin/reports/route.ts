import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient, isAdmin } from '@/lib/admin'

export const dynamic = 'force-dynamic'

/**
 * GET /api/admin/reports
 * List all reports with filtering options
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

    // 3. Parse query params
    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get('status') // pending, reviewed, resolved, dismissed
    const category = searchParams.get('category') // harassment, fake, inappropriate, spam, other
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    // 4. Fetch reports with admin client (bypasses RLS)
    const adminClient = createAdminClient()

    let query = adminClient
      .from('reports')
      .select(`
        *,
        reporter:profiles!reporter_user_id (
          id,
          display_name,
          email,
          photo_url
        ),
        reported:profiles!reported_user_id (
          id,
          display_name,
          email,
          photo_url
        ),
        reviewer:profiles!reviewed_by (
          id,
          display_name
        )
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    // Apply filters
    if (status) {
      query = query.eq('status', status)
    }
    if (category) {
      query = query.eq('category', category)
    }

    const { data: reports, error, count } = await query

    if (error) {
      console.error('Error fetching reports:', error)
      return NextResponse.json(
        { error: 'Failed to fetch reports' },
        { status: 500 }
      )
    }

    // 5. Get stats
    const { data: stats } = await adminClient
      .from('reports')
      .select('status', { count: 'exact', head: false })

    const statusCounts = {
      pending: 0,
      reviewed: 0,
      resolved: 0,
      dismissed: 0,
      total: reports?.length || 0
    }

    // Count by status
    const { data: pendingCount } = await adminClient
      .from('reports')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'pending')

    const { data: reviewedCount, count: reviewedCountNum } = await adminClient
      .from('reports')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'reviewed')

    return NextResponse.json({
      reports,
      pagination: {
        limit,
        offset,
        hasMore: (reports?.length || 0) === limit
      },
      stats: statusCounts
    })

  } catch (error: any) {
    console.error('Error in admin reports GET:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}
