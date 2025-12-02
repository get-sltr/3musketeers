import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { withCSRFProtection } from '@/lib/csrf-server'

export const dynamic = 'force-dynamic'

/**
 * POST /api/taps
 * Send a tap to another user
 */
async function postHandler(request: NextRequest) {
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

    // 4. Check if tap already exists (prevent spam)
    const { data: existing } = await supabase
      .from('taps')
      .select('id, tapped_at')
      .eq('tapper_id', user.id)
      .eq('tapped_user_id', to_user_id)
      .single()

    if (existing) {
      // Check if tap is less than 24 hours old
      const tapAge = Date.now() - new Date(existing.tapped_at).getTime()
      const oneDay = 24 * 60 * 60 * 1000

      if (tapAge < oneDay) {
        return NextResponse.json(
          { error: 'You already tapped this user recently', tap: existing },
          { status: 400 }
        )
      }
    }

    // 5. Insert the tap
    const { data: tap, error: insertError } = await supabase
      .from('taps')
      .insert({
        tapper_id: user.id,
        tapped_user_id: to_user_id,
        tapped_at: new Date().toISOString()
      })
      .select()
      .single()

    if (insertError) {
      console.error('Error inserting tap:', insertError)
      return NextResponse.json(
        { error: 'Failed to send tap', details: insertError.message },
        { status: 500 }
      )
    }

    // 6. Optionally send a notification (if you have a notifications system)
    // TODO: Add push notification here

    return NextResponse.json({
      success: true,
      tap
    })

  } catch (error: unknown) {
    console.error('Error in taps API:', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { error: 'Internal server error', details: message },
      { status: 500 }
    )
  }
}

export const POST = withCSRFProtection(postHandler)

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

  } catch (error: unknown) {
    console.error('Error in taps GET:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
