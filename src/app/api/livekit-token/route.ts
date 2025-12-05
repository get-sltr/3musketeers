import { NextRequest, NextResponse } from 'next/server'
import { AccessToken } from 'livekit-server-sdk'
import { createClient } from '@/lib/supabase/server'
import { withCSRFProtection } from '@/lib/csrf-server'

/**
 * Generate LiveKit access token for video/audio calls
 * This endpoint creates a token that allows users to join LiveKit rooms
 */
async function handler(request: NextRequest) {
  try {
    const { roomName, participantName } = await request.json()

    if (!roomName) {
      return NextResponse.json(
        { error: 'roomName is required' },
        { status: 400 }
      )
    }

    // Verify user is authenticated
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const apiKey = process.env.LIVEKIT_API_KEY
    const apiSecret = process.env.LIVEKIT_API_SECRET
    const livekitUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL

    // Validate all LiveKit configuration is present and not placeholder values
    if (!apiKey || !apiSecret) {
      console.error('❌ LIVEKIT_API_KEY or LIVEKIT_API_SECRET not configured')
      return NextResponse.json(
        { error: 'LiveKit not configured', code: 'LIVEKIT_NOT_CONFIGURED' },
        { status: 503 }
      )
    }

    if (!livekitUrl || livekitUrl.includes('your-livekit-server')) {
      console.error('❌ NEXT_PUBLIC_LIVEKIT_URL not configured or using placeholder')
      return NextResponse.json(
        { error: 'LiveKit server URL not configured', code: 'LIVEKIT_URL_NOT_CONFIGURED' },
        { status: 503 }
      )
    }

    // Create access token
    const at = new AccessToken(apiKey, apiSecret, {
      identity: user.id,
      name: participantName || user.id,
    })

    // Grant permissions
    at.addGrant({
      room: roomName,
      roomJoin: true,
      canPublish: true,
      canSubscribe: true,
      canPublishData: true,
      canUpdateOwnMetadata: true,
    })

    const token = await at.toJwt()

    return NextResponse.json({
      token,
      url: livekitUrl,
    })

  } catch (error) {
    console.error('❌ Error creating LiveKit token:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

export const POST = withCSRFProtection(handler)
