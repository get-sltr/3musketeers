import { NextRequest, NextResponse } from 'next/server';

/**
 * Create a Daily.co room for video calls
 * This endpoint creates a private room for a conversation
 */
export async function POST(request: NextRequest) {
  try {
    const { conversationId } = await request.json();
    
    if (!conversationId) {
      return NextResponse.json(
        { error: 'conversationId is required' },
        { status: 400 }
      );
    }

    const apiKey = process.env.DAILY_API_KEY;
    
    if (!apiKey) {
      console.error('❌ DAILY_API_KEY not configured');
      return NextResponse.json(
        { error: 'Daily.co API key not configured' },
        { status: 500 }
      );
    }

    // Create a unique room name based on conversation ID
    const roomName = `sltr-${conversationId.replace(/[^a-zA-Z0-9]/g, '-')}`;

    // First, check if room already exists
    const getResponse = await fetch(`https://api.daily.co/v1/rooms/${roomName}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
    });

    // If room exists, return it (allows rejoining)
    if (getResponse.ok) {
      const existingRoom = await getResponse.json();
      console.log('✅ Reusing existing Daily.co room:', roomName);
      return NextResponse.json({
        url: existingRoom.url,
        name: existingRoom.name,
        id: existingRoom.id,
      });
    }

    // If room doesn't exist (404), create a new one
    console.log('📝 Creating new Daily.co room:', roomName);
    const response = await fetch('https://api.daily.co/v1/rooms', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: roomName,
        privacy: 'private',
        properties: {
          max_participants: 2,
          enable_screenshare: true,
          enable_recording: false, // Set to true if you want recording
          enable_chat: false, // We have our own chat
          enable_knocking: false,
          enable_prejoin_ui: false,
          start_video_off: false,
          start_audio_off: false,
        },
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('❌ Daily.co API error:', errorData);
      return NextResponse.json(
        { error: 'Failed to create Daily.co room', details: errorData },
        { status: response.status }
      );
    }

    const room = await response.json();
    
    return NextResponse.json({
      url: room.url,
      name: room.name,
      id: room.id,
    });

  } catch (error) {
    console.error('❌ Error creating Daily.co room:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

