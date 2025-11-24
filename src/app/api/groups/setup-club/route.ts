import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET endpoint for easy setup
export async function GET() {
  return handleSetup()
}

// POST endpoint for setup
export async function POST(request: NextRequest) {
  return handleSetup()
}

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

    // Check if "THE CLUB" group already exists
    const { data: existingGroups } = await supabase
      .from('groups')
      .select('id, title')
      .ilike('title', 'THE CLUB')
      .limit(1)

    let groupId: string
    let isNew = false

    if (existingGroups && existingGroups.length > 0) {
      // Group already exists, use it
      groupId = existingGroups[0].id
    } else {
      // Create "THE CLUB" group
      const { data: newGroup, error: groupError } = await supabase
        .from('groups')
        .insert({
          title: 'THE CLUB',
          description: 'The premier group for video conferencing, voice chats, and messaging. Join the conversation!',
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

    const channelsToCreate = [
      {
        name: 'General Chat',
        description: 'Text messaging and group chat',
        type: 'text' as const,
      },
      {
        name: 'Voice Room',
        description: 'Join voice calls with the group',
        type: 'voice' as const,
      },
      {
        name: 'Video Conference',
        description: 'Join video calls and conferences',
        type: 'video' as const,
      },
    ]

    const createdChannels: any[] = []

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
        title: 'THE CLUB',
        description: 'The premier group for video conferencing, voice chats, and messaging.',
      },
      channels: createdChannels,
      message: isNew 
        ? 'THE CLUB group created successfully!' 
        : 'THE CLUB group already exists. Channels verified.',
    })
  } catch (error: any) {
    console.error('Error setting up THE CLUB:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to setup THE CLUB' },
      { status: 500 }
    )
  }
}

