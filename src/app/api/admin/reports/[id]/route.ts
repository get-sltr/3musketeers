import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!

// Admin client bypasses RLS
function createAdminClient() {
  return createSupabaseClient(supabaseUrl, supabaseServiceKey)
}

// Check if user is super admin
async function isAdmin(userId: string): Promise<boolean> {
  const adminClient = createAdminClient()
  const { data } = await adminClient
    .from('profiles')
    .select('is_super_admin')
    .eq('id', userId)
    .single()

  return data?.is_super_admin === true
}

export const dynamic = 'force-dynamic'

/**
 * GET /api/admin/reports/[id]
 * Get a single report by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

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

    // 3. Fetch report with admin client
    const adminClient = createAdminClient()
    const { data: report, error } = await adminClient
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
      .eq('id', id)
      .single()

    if (error || !report) {
      return NextResponse.json(
        { error: 'Report not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ report })

  } catch (error: any) {
    console.error('Error fetching report:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/admin/reports/[id]
 * Update report status and add admin notes
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

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

    // 3. Parse request body
    const body = await request.json()
    const { status, admin_notes } = body

    // Validate status
    const validStatuses = ['pending', 'reviewed', 'resolved', 'dismissed']
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be: pending, reviewed, resolved, or dismissed' },
        { status: 400 }
      )
    }

    // 4. Update report with admin client
    const adminClient = createAdminClient()
    const updateData: Record<string, any> = {
      updated_at: new Date().toISOString()
    }

    if (status) {
      updateData.status = status
      // Set reviewed_by and reviewed_at when status changes from pending
      if (status !== 'pending') {
        updateData.reviewed_by = user.id
        updateData.reviewed_at = new Date().toISOString()
      }
    }

    if (admin_notes !== undefined) {
      updateData.admin_notes = admin_notes
    }

    const { data: updatedReport, error } = await adminClient
      .from('reports')
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        reporter:profiles!reporter_user_id (
          id,
          display_name,
          email
        ),
        reported:profiles!reported_user_id (
          id,
          display_name,
          email
        )
      `)
      .single()

    if (error) {
      console.error('Error updating report:', error)
      return NextResponse.json(
        { error: 'Failed to update report', details: error.message },
        { status: 500 }
      )
    }

    // 5. Log the moderation action
    await logModerationAction(adminClient, {
      admin_id: user.id,
      action_type: 'report_status_update',
      target_report_id: id,
      details: {
        new_status: status,
        admin_notes: admin_notes
      }
    })

    return NextResponse.json({
      success: true,
      report: updatedReport
    })

  } catch (error: any) {
    console.error('Error updating report:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

// Helper function to log moderation actions
async function logModerationAction(adminClient: any, action: {
  admin_id: string
  action_type: string
  target_user_id?: string
  target_report_id?: string
  details: Record<string, any>
}) {
  try {
    await adminClient
      .from('moderation_actions')
      .insert({
        admin_id: action.admin_id,
        action_type: action.action_type,
        target_user_id: action.target_user_id,
        target_report_id: action.target_report_id,
        details: action.details,
        created_at: new Date().toISOString()
      })
  } catch (error) {
    // Log error but don't fail the main operation
    console.error('Failed to log moderation action:', error)
  }
}
