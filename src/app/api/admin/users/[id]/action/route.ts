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

type ModerationAction = 'warn' | 'suspend' | 'ban' | 'unsuspend' | 'unban'

interface ActionRequestBody {
  action: ModerationAction
  reason: string
  duration_days?: number // For suspensions
  report_id?: string // Link action to a report
}

/**
 * POST /api/admin/users/[id]/action
 * Take moderation action on a user (warn, suspend, ban)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: targetUserId } = await params

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

    // 3. Prevent self-action
    if (targetUserId === user.id) {
      return NextResponse.json(
        { error: 'Cannot take action on yourself' },
        { status: 400 }
      )
    }

    // 4. Parse request body
    const body: ActionRequestBody = await request.json()
    const { action, reason, duration_days, report_id } = body

    // Validate action type
    const validActions: ModerationAction[] = ['warn', 'suspend', 'ban', 'unsuspend', 'unban']
    if (!action || !validActions.includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Must be: warn, suspend, ban, unsuspend, or unban' },
        { status: 400 }
      )
    }

    // Validate reason
    if (!reason || reason.trim().length < 10) {
      return NextResponse.json(
        { error: 'Reason must be at least 10 characters' },
        { status: 400 }
      )
    }

    const adminClient = createAdminClient()

    // 5. Check target user exists and is not an admin
    const { data: targetProfile, error: profileError } = await adminClient
      .from('profiles')
      .select('id, display_name, email, is_super_admin, account_status, suspended_until')
      .eq('id', targetUserId)
      .single()

    if (profileError || !targetProfile) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    if (targetProfile.is_super_admin) {
      return NextResponse.json(
        { error: 'Cannot take moderation action on an admin' },
        { status: 400 }
      )
    }

    // 6. Execute the moderation action
    let updateData: Record<string, any> = {}
    let actionResult: string

    switch (action) {
      case 'warn':
        // Warning doesn't change account status, just logs the warning
        updateData = {
          last_warning_at: new Date().toISOString(),
          warning_count: (targetProfile as any).warning_count ? (targetProfile as any).warning_count + 1 : 1
        }
        actionResult = 'User has been warned'
        break

      case 'suspend':
        if (!duration_days || duration_days < 1) {
          return NextResponse.json(
            { error: 'Suspension requires duration_days (minimum 1)' },
            { status: 400 }
          )
        }
        const suspendedUntil = new Date()
        suspendedUntil.setDate(suspendedUntil.getDate() + duration_days)

        updateData = {
          account_status: 'suspended',
          suspended_until: suspendedUntil.toISOString(),
          suspended_reason: reason
        }
        actionResult = `User suspended until ${suspendedUntil.toLocaleDateString()}`
        break

      case 'ban':
        updateData = {
          account_status: 'banned',
          banned_at: new Date().toISOString(),
          banned_reason: reason
        }
        actionResult = 'User has been banned permanently'
        break

      case 'unsuspend':
        updateData = {
          account_status: 'active',
          suspended_until: null,
          suspended_reason: null
        }
        actionResult = 'User suspension has been lifted'
        break

      case 'unban':
        updateData = {
          account_status: 'active',
          banned_at: null,
          banned_reason: null
        }
        actionResult = 'User ban has been lifted'
        break
    }

    // 7. Update user profile
    const { error: updateError } = await adminClient
      .from('profiles')
      .update(updateData)
      .eq('id', targetUserId)

    if (updateError) {
      console.error('Error updating user:', updateError)
      return NextResponse.json(
        { error: 'Failed to update user status', details: updateError.message },
        { status: 500 }
      )
    }

    // 8. Log the moderation action
    const { error: logError } = await adminClient
      .from('moderation_actions')
      .insert({
        admin_id: user.id,
        action_type: action,
        target_user_id: targetUserId,
        target_report_id: report_id || null,
        reason: reason,
        details: {
          duration_days: duration_days,
          previous_status: targetProfile.account_status || 'active'
        },
        created_at: new Date().toISOString()
      })

    if (logError) {
      console.error('Failed to log moderation action:', logError)
      // Don't fail the main operation
    }

    // 9. If linked to a report, update report status
    if (report_id) {
      await adminClient
        .from('reports')
        .update({
          status: 'resolved',
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString(),
          admin_notes: `Action taken: ${action}. Reason: ${reason}`
        })
        .eq('id', report_id)
    }

    return NextResponse.json({
      success: true,
      action: action,
      result: actionResult,
      target_user: {
        id: targetUserId,
        display_name: targetProfile.display_name,
        email: targetProfile.email
      }
    })

  } catch (error: any) {
    console.error('Error in user moderation action:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

/**
 * GET /api/admin/users/[id]/action
 * Get moderation history for a user
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: targetUserId } = await params

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

    // 3. Get user profile with status info
    const { data: profile, error: profileError } = await adminClient
      .from('profiles')
      .select(`
        id,
        display_name,
        email,
        photo_url,
        account_status,
        suspended_until,
        suspended_reason,
        banned_at,
        banned_reason,
        warning_count,
        last_warning_at,
        created_at
      `)
      .eq('id', targetUserId)
      .single()

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // 4. Get moderation action history
    const { data: actions, error: actionsError } = await adminClient
      .from('moderation_actions')
      .select(`
        *,
        admin:profiles!admin_id (
          id,
          display_name
        )
      `)
      .eq('target_user_id', targetUserId)
      .order('created_at', { ascending: false })
      .limit(50)

    // 5. Get reports filed against this user
    const { data: reports, error: reportsError } = await adminClient
      .from('reports')
      .select(`
        id,
        category,
        reason,
        status,
        created_at,
        reporter:profiles!reporter_user_id (
          id,
          display_name
        )
      `)
      .eq('reported_user_id', targetUserId)
      .order('created_at', { ascending: false })
      .limit(20)

    return NextResponse.json({
      user: profile,
      moderation_history: actions || [],
      reports_against: reports || []
    })

  } catch (error: any) {
    console.error('Error fetching moderation history:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}
