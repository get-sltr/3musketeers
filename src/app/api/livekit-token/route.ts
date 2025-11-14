import { NextRequest, NextResponse } from 'next/server'
import { AccessToken } from 'livekit-server-sdk'
import { createClient } from '@/lib/supabase/server'

/**
 * Generate LiveKit access token for video/audio calls
 * This endpoint creates a token that allows users to join LiveKit rooms
 */
export async function POST(request: NextRequest) {
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

    if (!apiKey || !apiSecret) {
      console.error('❌ LIVEKIT_API_KEY or LIVEKIT_API_SECRET not configured')
      return NextResponse.json(
        { error: 'LiveKit not configured' },
        { status: 500 }
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
    })

    const token = await at.toJwt()

    return NextResponse.json({
      token,
      url: process.env.NEXT_PUBLIC_LIVEKIT_URL || 'wss://your-livekit-server.livekit.cloud',
    })

  } catch (error) {
    console.error('❌ Error creating LiveKit token:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

