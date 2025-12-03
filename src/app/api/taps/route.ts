import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { withCSRFProtection } from '@/lib/csrf-server'

export const dynamic = 'force-dynamic'

/**
 * POST /api/taps
 * Send a tap to another user using database function
 * Returns mutual status and triggers push notification
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

    // 4. Use database function to create tap (handles mutual status)
    const { data: tapResult, error: tapError } = await supabase
      .rpc('tap_user', { target_user_id: to_user_id })

    if (tapError) {
      console.error('Error creating tap:', tapError)
      
      // Check for specific errors
      if (tapError.message?.includes('Cannot tap yourself')) {
        return NextResponse.json(
          { error: 'Cannot tap yourself' },
          { status: 400 }
        )
      }
      
      return NextResponse.json(
        { error: 'Failed to send tap', details: tapError.message },
        { status: 500 }
      )
    }

    // 5. If tap already existed, return early
    if (tapResult?.already_exists) {
      return NextResponse.json({
        success: true,
        tap: tapResult,
        already_exists: true
      })
    }

    // 6. Get current user's display name for notification
    const { data: currentProfile } = await supabase
      .from('profiles')
      .select('display_name')
      .eq('id', user.id)
      .single()

    const senderName = currentProfile?.display_name || 'Someone'
    const isMutual = tapResult?.is_mutual || false

    // 7. Send push notification (non-blocking)
    // We fire and forget - don't await the response
    sendTapPushNotification(to_user_id, senderName, isMutual).catch(err => {
      console.error('Push notification failed (non-blocking):', err)
    })

    // 8. If mutual, also notify the original tapper
    if (isMutual) {
      sendTapPushNotification(user.id, senderName, true).catch(err => {
        console.error('Mutual push notification failed (non-blocking):', err)
      })
    }

    return NextResponse.json({
      success: true,
      tap: tapResult,
      is_mutual: isMutual
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
 * Helper to send tap push notification
 * Non-blocking - errors are logged but don't affect the response
 */
async function sendTapPushNotification(
  recipientUserId: string,
  senderName: string,
  isMutual: boolean
): Promise<void> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://getsltr.com'
    const internalKey = process.env.INTERNAL_API_KEY
    
    // Only send push notification if internal API key is configured
    if (!internalKey) {
      console.log('Push notification skipped: INTERNAL_API_KEY not configured')
      return
    }
    
    await fetch(`${baseUrl}/api/push/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-internal-key': internalKey
      },
      body: JSON.stringify({
        user_id: recipientUserId,
        payload: {
          title: isMutual ? "It's a Match! 💘" : "Someone tapped you! 👀",
          body: isMutual 
            ? `You and ${senderName} both tapped each other!`
            : `${senderName} just tapped you`,
          url: '/taps',
          tag: isMutual ? 'mutual-match' : 'tap-notification',
          data: {
            type: isMutual ? 'mutual_match' : 'tap',
            sender_name: senderName
          }
        }
      })
    })
  } catch (error) {
    // Log but don't throw - this is non-blocking
    console.error('Failed to send tap push notification:', error)
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

  } catch (error: unknown) {
    console.error('Error in taps GET:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
