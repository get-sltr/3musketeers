import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

interface RouteParams {
  params: Promise<{ id: string }>
}

type ActionType = 'warn' | 'suspend' | 'ban' | 'unwarn' | 'unsuspend' | 'unban'

interface ActionBody {
  action: ActionType
  reason: string
  report_id?: string
  duration_days?: number
}

const validActions: ActionType[] = ['warn', 'suspend', 'ban', 'unwarn', 'unsuspend', 'unban']

// Map action to account status
const actionToStatus: Record<ActionType, string> = {
  warn: 'warned',
  suspend: 'suspended',
  ban: 'banned',
  unwarn: 'active',
  unsuspend: 'active',
  unban: 'active'
}

/**
 * GET /api/admin/users/[id]/action
 * Get moderation history for a specific user (super admin only)
 */
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id: targetUserId } = await params
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

    // Get target user profile
    const { data: targetProfile, error: targetError } = await supabase
      .from('profiles')
      .select('id, display_name, photo_url, account_status, account_status_reason, account_status_updated_at')
      .eq('id', targetUserId)
      .single()

    if (targetError || !targetProfile) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Get moderation history
    const { data: actions, error: actionsError } = await supabase
      .from('moderation_actions')
      .select(`
        *,
        admin:profiles!admin_user_id (
          id,
          display_name
        )
      `)
      .eq('target_user_id', targetUserId)
      .order('created_at', { ascending: false })

    if (actionsError) {
      console.error('Error fetching moderation history:', actionsError)
      return NextResponse.json(
        { error: 'Failed to fetch moderation history' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      user: targetProfile,
      actions: actions || []
    })

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('Error in admin user action GET:', message)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/admin/users/[id]/action
 * Take a moderation action on a user (super admin only)
 */
export async function POST(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id: targetUserId } = await params
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

    // Cannot moderate yourself
    if (targetUserId === user.id) {
      return NextResponse.json(
        { error: 'Cannot take moderation action on yourself' },
        { status: 400 }
      )
    }

    const body: ActionBody = await request.json()
    const { action, reason, report_id, duration_days } = body

    // Validate action
    if (!action || !validActions.includes(action)) {
      return NextResponse.json(
        { error: `Invalid action. Must be one of: ${validActions.join(', ')}` },
        { status: 400 }
      )
    }

    // Validate reason
    if (!reason || reason.trim().length < 5) {
      return NextResponse.json(
        { error: 'Reason is required and must be at least 5 characters' },
        { status: 400 }
      )
    }

    // Validate target user exists
    const { data: targetProfile, error: targetError } = await supabase
      .from('profiles')
      .select('id, display_name, account_status, is_super_admin')
      .eq('id', targetUserId)
      .single()

    if (targetError || !targetProfile) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Cannot moderate other super admins
    if (targetProfile.is_super_admin) {
      return NextResponse.json(
        { error: 'Cannot take moderation action on a super admin' },
        { status: 400 }
      )
    }

    // Calculate expiration for temporary suspensions
    let expiresAt: string | null = null
    if (action === 'suspend' && duration_days && duration_days > 0) {
      const expiry = new Date()
      expiry.setDate(expiry.getDate() + duration_days)
      expiresAt = expiry.toISOString()
    }

    // Create moderation action record
    const { data: moderationAction, error: actionError } = await supabase
      .from('moderation_actions')
      .insert({
        target_user_id: targetUserId,
        admin_user_id: user.id,
        action_type: action,
        reason: reason.trim(),
        report_id: report_id || null,
        duration_days: duration_days || null,
        expires_at: expiresAt,
        metadata: {
          previous_status: targetProfile.account_status || 'active'
        }
      })
      .select()
      .single()

    if (actionError) {
      console.error('Error creating moderation action:', actionError)
      return NextResponse.json(
        { error: 'Failed to create moderation action' },
        { status: 500 }
      )
    }

    // Update user's account status
    const newStatus = actionToStatus[action]
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        account_status: newStatus,
        account_status_reason: reason.trim(),
        account_status_updated_at: new Date().toISOString()
      })
      .eq('id', targetUserId)

    if (updateError) {
      console.error('Error updating user status:', updateError)
      return NextResponse.json(
        { error: 'Failed to update user status' },
        { status: 500 }
      )
    }

    // If linked to a report, update the report status to resolved
    if (report_id) {
      await supabase
        .from('reports')
        .update({
          status: 'resolved',
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString()
        })
        .eq('id', report_id)
    }

    return NextResponse.json({
      success: true,
      action: moderationAction,
      user_status: newStatus
    })

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('Error in admin user action POST:', message)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
