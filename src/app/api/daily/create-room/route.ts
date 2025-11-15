import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const { conversationId } = await request.json()

    if (!conversationId) {
      return NextResponse.json(
        { error: 'conversationId is required' },
        { status: 400 }
      )
    }

    // Get authenticated user
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if Daily.co API key is configured
    const dailyApiKey = process.env.DAILY_API_KEY
    if (!dailyApiKey) {
      console.error('Daily.co API key not configured')
      return NextResponse.json(
        { error: 'Video calling service not configured' },
        { status: 503 }
      )
    }

    // Create a Daily.co room
    const dailyApiUrl = process.env.DAILY_API_URL || 'https://api.daily.co/v1'
    const roomName = `conversation-${conversationId}-${Date.now()}`

    const response = await fetch(`${dailyApiUrl}/rooms`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${dailyApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: roomName,
        privacy: 'private',
        properties: {
          exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour expiry
          enable_chat: true,
          enable_screenshare: true,
          enable_recording: false,
        },
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Daily.co API error:', errorText)
      return NextResponse.json(
        { error: 'Failed to create video room' },
        { status: 500 }
      )
    }

    const roomData = await response.json()
    const roomUrl = roomData.url || roomData.config?.url

    if (!roomUrl) {
      console.error('Daily.co room URL missing:', roomData)
      return NextResponse.json(
        { error: 'Invalid response from video service' },
        { status: 500 }
      )
    }

    // Generate a token for the user to join
    const tokenResponse = await fetch(`${dailyApiUrl}/meeting-tokens`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${dailyApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        properties: {
          room_name: roomName,
          user_id: user.id,
          user_name: user.email || 'User',
          is_owner: true,
        },
      }),
    })

    let token = null
    if (tokenResponse.ok) {
      const tokenData = await tokenResponse.json()
      token = tokenData.token
    }

    return NextResponse.json({
      url: roomUrl,
      token,
      roomName,
    })
  } catch (error: any) {
    console.error('Error creating Daily.co room:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create video room' },
      { status: 500 }
    )
  }
}
