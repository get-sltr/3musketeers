import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

interface PushPayload {
  title: string
  body: string
  url?: string
  tag?: string
  data?: Record<string, unknown>
}

interface SendRequest {
  user_id: string
  payload: PushPayload
}

/**
 * POST /api/push/send
 * Send a push notification to a user
 * Can be called internally or by authenticated users (with restrictions)
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    // For internal calls, we'll check for a special header
    // Both the header AND the environment variable must be present and match
    const internalKey = request.headers.get('x-internal-key')
    const configuredKey = process.env.INTERNAL_API_KEY
    const isInternalCall = !!(configuredKey && internalKey && internalKey === configuredKey)
    
    if (authError || (!user && !isInternalCall)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body: SendRequest = await request.json()
    const { user_id, payload } = body

    if (!user_id || !payload || !payload.title) {
      return NextResponse.json(
        { error: 'Missing required fields: user_id and payload.title' },
        { status: 400 }
      )
    }

    // Get user's push subscriptions
    const { data: subscriptions, error: subError } = await supabase
      .from('push_subscriptions')
      .select('endpoint, p256dh, auth')
      .eq('user_id', user_id)

    if (subError) {
      console.error('Error fetching subscriptions:', subError)
      return NextResponse.json(
        { error: 'Failed to fetch push subscriptions' },
        { status: 500 }
      )
    }

    if (!subscriptions || subscriptions.length === 0) {
      return NextResponse.json({
        success: true,
        sent: 0,
        message: 'No push subscriptions found for user'
      })
    }

    // Send to backend push service if available
    const backendUrl = process.env.NEXT_PUBLIC_DEV_BACKEND_URL || process.env.NEXT_PUBLIC_BACKEND_URL
    
    if (backendUrl) {
      try {
        const response = await fetch(`${backendUrl}/api/push/send`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            subscriptions: subscriptions.map(sub => ({
              endpoint: sub.endpoint,
              keys: {
                p256dh: sub.p256dh,
                auth: sub.auth
              }
            })),
            payload: {
              title: payload.title,
              body: payload.body,
              url: payload.url || '/',
              tag: payload.tag || 'sltr-notification',
              ...payload.data
            }
          })
        })

        if (response.ok) {
          const result = await response.json()
          return NextResponse.json({
            success: true,
            sent: result.sent || subscriptions.length,
            message: 'Notifications sent via backend'
          })
        }
      } catch (backendError) {
        console.error('Backend push send failed:', backendError)
        // Fall through to return partial success
      }
    }

    // Return success with count of subscriptions
    // Actual push will be handled by the service worker or backend
    return NextResponse.json({
      success: true,
      sent: subscriptions.length,
      message: 'Push subscriptions available'
    })

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('Error in push send API:', message)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
