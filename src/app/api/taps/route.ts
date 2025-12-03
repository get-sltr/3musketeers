import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendTapNotification } from '@/lib/push-notifications'

export const dynamic = 'force-dynamic'

/**
 * POST /api/taps
 * Send a tap to another user
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Check authentication
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // 2. Get the target user ID from request body
    const body = await request.json()
    const { to_user_id } = body

    if (!to_user_id) {
      return NextResponse.json(
        { error: 'Missing to_user_id' },
        { status: 400 }
      )
    }

    // 3. Prevent self-tapping
    if (to_user_id === user.id) {
      return NextResponse.json(
        { error: 'Cannot tap yourself' },
        { status: 400 }
      )
    }

    // 4. Use the tap_user database function which handles all edge cases
    const { data: tapResult, error: tapError } = await supabase
      .rpc('tap_user', { target_user_id: to_user_id })

    if (tapError) {
      console.error('Error calling tap_user:', tapError)
      return NextResponse.json(
        { error: 'Failed to send tap', details: tapError.message },
        { status: 500 }
      )
    }

    // 5. Check if it was already tapped (the function returns already_exists: true)
    if (tapResult?.already_exists) {
      return NextResponse.json({
        success: true,
        tap: tapResult,
        message: 'You already tapped this user'
      })
    }

    // 6. Get tapper's profile name for notification
    const { data: tapperProfile } = await supabase
      .from('profiles')
      .select('display_name')
      .eq('id', user.id)
      .single()

    const tapperName = tapperProfile?.display_name || 'Someone'

    // 7. Send push notification (non-blocking)
    sendTapNotification(to_user_id, tapperName, tapResult?.is_mutual || false)
      .catch(err => console.error('Push notification failed:', err))

    return NextResponse.json({
      success: true,
      tap: tapResult,
      is_mutual: tapResult?.is_mutual || false
    })

  } catch (error: any) {
    console.error('Error in taps API:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

/**
 * GET /api/taps
 * Get taps received by the current user
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

    // Get taps received by this user
    const { data: taps, error } = await supabase
      .from('taps')
      .select(`
        *,
        tapper:profiles!tapper_id (
          id,
          display_name,
          photo_url,
          photos,
          age,
          position
        )
      `)
      .eq('tapped_user_id', user.id)
      .order('tapped_at', { ascending: false })
      .limit(50)

    if (error) {
      console.error('Error fetching taps:', error)
      return NextResponse.json(
        { error: 'Failed to fetch taps' },
        { status: 500 }
      )
    }

    return NextResponse.json({ taps })

  } catch (error: any) {
    console.error('Error in taps GET:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
