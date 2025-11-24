// This file allows GET requests to setup THE CLUB
// Useful for one-click setup from the UI

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
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
      .select('id')
      .eq('title', 'THE CLUB')
      .limit(1)

    let groupId: string

    if (existingGroups && existingGroups.length > 0) {
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

      if (groupError || !newGroup) {
        return NextResponse.json(
          { error: 'Failed to create group' },
          { status: 500 }
        )
      }

      groupId = newGroup.id
    }

    // Get existing channels
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

    for (const channel of channelsToCreate) {
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

        if (channelError && channelError.code !== '42P01') {
          console.error(`Error creating channel ${channel.name}:`, channelError)
        } else if (newChannel) {
          createdChannels.push(newChannel)
        } else if (channelError?.code === '42P01') {
          // Channels table doesn't exist - create fallback
          createdChannels.push({
            id: `${groupId}-${channel.type}`,
            name: channel.name,
            description: channel.description,
            type: channel.type,
            group_id: groupId,
            _fallback: true,
          })
        }
      } else {
        const existing = existingChannels?.find(
          (c) => c.name === channel.name && c.type === channel.type
        )
        if (existing) createdChannels.push(existing)
      }
    }

    return NextResponse.json({
      success: true,
      group: {
        id: groupId,
        title: 'THE CLUB',
      },
      channels: createdChannels,
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to setup THE CLUB' },
      { status: 500 }
    )
  }
}

