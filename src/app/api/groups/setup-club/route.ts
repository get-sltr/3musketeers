import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { withCSRFProtection } from '@/lib/csrf-server'

// GET endpoint for easy setup (no CSRF needed for GET)
export async function GET() {
  return handleSetup()
}

// POST endpoint for setup (CSRF protected)
async function postHandler(request: NextRequest) {
  return handleSetup()
}

export const POST = withCSRFProtection(postHandler)

async function handleSetup() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if "The Club sltr" group already exists
    const { data: existingGroups } = await supabase
      .from('groups')
      .select('id, name')
      .ilike('name', 'The Club sltr')
      .limit(1)

    let groupId: string
    let isNew = false

    if (existingGroups && existingGroups.length > 0 && existingGroups[0]) {
      // Group already exists, use it
      groupId = existingGroups[0].id
    } else {
      // Create "The Club sltr" group
      const { data: newGroup, error: groupError } = await supabase
        .from('groups')
        .insert({
          name: 'The Club sltr',
          description: 'The premier club for video conferencing, voice chats, and messaging. Connect, chat, and vibe with the community!',
          host_id: user.id,
        })
        .select('id')
        .single()

      if (groupError) {
        console.error('Error creating group:', groupError)
        return NextResponse.json(
          { error: `Failed to create group: ${groupError.message}` },
          { status: 500 }
        )
      }

      if (!newGroup) {
        return NextResponse.json(
          { error: 'Failed to create group' },
          { status: 500 }
        )
      }

      groupId = newGroup.id
      isNew = true
    }

    // Get existing channels for this group
    const { data: existingChannels } = await supabase
      .from('channels')
      .select('id, name, type, description')
      .eq('group_id', groupId)

    // The Club sltr channels - each with video conferencing, chat, and messaging
    const channelsToCreate = [
      // The Club P'n'P - Video
      {
        name: "The Club P'n'P",
        description: 'Video conferencing room - Party and Play with the community',
        type: 'video' as const,
      },
      // The Club P'n'P - Voice
      {
        name: "The Club P'n'P Voice",
        description: 'Voice chat room - Party and Play audio',
        type: 'voice' as const,
      },
      // The Club P'n'P - Text
      {
        name: "The Club P'n'P Chat",
        description: 'Text chat room - Party and Play messaging',
        type: 'text' as const,
      },
      // The Club H'n'H - Video
      {
        name: "The Club H'n'H",
        description: 'Video conferencing room - High and Horny with the community',
        type: 'video' as const,
      },
      // The Club H'n'H - Voice
      {
        name: "The Club H'n'H Voice",
        description: 'Voice chat room - High and Horny audio',
        type: 'voice' as const,
      },
      // The Club H'n'H - Text
      {
        name: "The Club H'n'H Chat",
        description: 'Text chat room - High and Horny messaging',
        type: 'text' as const,
      },
      // The Club Smoke N' Stroke - Video
      {
        name: "The Club Smoke N' Stroke",
        description: 'Video conferencing room - Smoke and Stroke with the community',
        type: 'video' as const,
      },
      // The Club Smoke N' Stroke - Voice
      {
        name: "The Club Smoke N' Stroke Voice",
        description: 'Voice chat room - Smoke and Stroke audio',
        type: 'voice' as const,
      },
      // The Club Smoke N' Stroke - Text
      {
        name: "The Club Smoke N' Stroke Chat",
        description: 'Text chat room - Smoke and Stroke messaging',
        type: 'text' as const,
      },
    ]

    const createdChannels: unknown[] = []

    // Create channels if they don't exist
    for (const channel of channelsToCreate) {
      // Check if channel already exists
      const exists = existingChannels?.some(
        (c) => c.name === channel.name && c.type === channel.type
      )

      if (!exists) {
        const { data: newChannel, error: channelError } = await supabase
          .from('channels')
          .insert({
            name: channel.name,
            description: channel.description,
            group_id: groupId,
            type: channel.type,
            created_by: user.id,
          })
          .select()
          .single()

        if (channelError) {
          console.error(`Error creating channel ${channel.name}:`, channelError)
          // Continue with other channels even if one fails
        } else if (newChannel) {
          createdChannels.push(newChannel)
        }
      } else {
        // Channel exists, add to response
        const existing = existingChannels?.find(
          (c) => c.name === channel.name && c.type === channel.type
        )
        if (existing) {
          createdChannels.push(existing)
        }
      }
    }

    return NextResponse.json({
      success: true,
      group: {
        id: groupId,
        name: 'The Club sltr',
        description: 'The premier club for video conferencing, voice chats, and messaging.',
      },
      channels: createdChannels,
      message: isNew
        ? 'The Club sltr created successfully with all channels!'
        : 'The Club sltr already exists. Channels verified.',
    })
  } catch (error: unknown) {
    console.error('Error setting up The Club sltr:', error)
    const message = error instanceof Error ? error.message : 'Failed to setup The Club sltr'
    return NextResponse.json(
      { error: message },
      { status: 500 }
    )
  }
}
