import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * GET /api/admin/reports/[id]
 * Get a specific report with full details (super admin only)
 */
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params
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

    // Get report with joined data
    const { data: report, error: reportError } = await supabase
      .from('reports')
      .select(`
        *,
        reporter:profiles!reporter_user_id (
          id,
          display_name,
          username,
          photo_url
        ),
        reported:profiles!reported_user_id (
          id,
          display_name,
          username,
          photo_url,
          account_status,
          account_status_reason,
          created_at
        ),
        reviewer:profiles!reviewed_by (
          id,
          display_name
        )
      `)
      .eq('id', id)
      .single()

    if (reportError) {
      if (reportError.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Report not found' },
          { status: 404 }
        )
      }
      console.error('Error fetching report:', reportError)
      return NextResponse.json(
        { error: 'Failed to fetch report' },
        { status: 500 }
      )
    }

    return NextResponse.json({ report })

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('Error in admin report API:', message)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/admin/reports/[id]
 * Update a report status (super admin only)
 */
export async function PATCH(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params
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

    const body = await request.json()
    const { status, admin_notes } = body

    // Validate status
    const validStatuses = ['pending', 'reviewed', 'resolved', 'dismissed']
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` },
        { status: 400 }
      )
    }

    // Build update object
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString()
    }

    if (status) {
      updateData.status = status
      updateData.reviewed_by = user.id
      updateData.reviewed_at = new Date().toISOString()
    }

    if (admin_notes !== undefined) {
      updateData.admin_notes = admin_notes
    }

    // Update report
    const { data: report, error: updateError } = await supabase
      .from('reports')
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        reporter:profiles!reporter_user_id (
          id,
          display_name
        ),
        reported:profiles!reported_user_id (
          id,
          display_name,
          account_status
        ),
        reviewer:profiles!reviewed_by (
          id,
          display_name
        )
      `)
      .single()

    if (updateError) {
      if (updateError.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Report not found' },
          { status: 404 }
        )
      }
      console.error('Error updating report:', updateError)
      return NextResponse.json(
        { error: 'Failed to update report' },
        { status: 500 }
      )
    }

    return NextResponse.json({ report })

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('Error in admin report update API:', message)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
