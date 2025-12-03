import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * POST /api/groups/[id]/message
 * Send a message to a group (requires membership)
 */
export async function POST(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id: groupId } = await params
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { content } = body

    if (!content || content.trim().length === 0) {
      return NextResponse.json(
        { error: 'Message content is required' },
        { status: 400 }
      )
    }

    // Check membership - user must be a member to send messages
    const { data: membership, error: memberError } = await supabase
      .from('group_members')
      .select('id, role')
      .eq('group_id', groupId)
      .eq('user_id', user.id)
      .single()

    if (memberError || !membership) {
      // Check if group exists
      const { data: group } = await supabase
        .from('groups')
        .select('id, name, is_private')
        .eq('id', groupId)
        .single()

      if (!group) {
        return NextResponse.json(
          { error: 'Group not found' },
          { status: 404 }
        )
      }

      // Group exists but user is not a member
      return NextResponse.json(
        { 
          error: 'You must be a member of this group to send messages',
          code: 'NOT_A_MEMBER',
          group_name: group.name,
          is_private: group.is_private,
          action_required: group.is_private ? 'request_invite' : 'join_group'
        },
        { status: 403 }
      )
    }

    // Check content length
    if (content.length > 5000) {
      return NextResponse.json(
        { error: 'Message is too long (max 5000 characters)' },
        { status: 400 }
      )
    }

    // Insert the message
    const { data: message, error: insertError } = await supabase
      .from('group_messages')
      .insert({
        group_id: groupId,
        sender_id: user.id,
        content: content.trim()
      })
      .select(`
        *,
        sender_profile:profiles!group_messages_sender_id_fkey(display_name, photo_url)
      `)
      .single()

    if (insertError) {
      console.error('Error sending message:', insertError)
      return NextResponse.json(
        { error: 'Failed to send message' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message
    })

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('Error in group message API:', message)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/groups/[id]/message
 * Get messages from a group (requires membership for private groups)
 */
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id: groupId } = await params
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Parse query params
    const { searchParams } = new URL(request.url)
    const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 100)
    const before = searchParams.get('before') // cursor for pagination

    // Check group and membership
    const { data: group } = await supabase
      .from('groups')
      .select('id, name, is_private')
      .eq('id', groupId)
      .single()

    if (!group) {
      return NextResponse.json(
        { error: 'Group not found' },
        { status: 404 }
      )
    }

    // For private groups, check membership
    if (group.is_private) {
      const { data: membership } = await supabase
        .from('group_members')
        .select('id')
        .eq('group_id', groupId)
        .eq('user_id', user.id)
        .single()

      if (!membership) {
        return NextResponse.json(
          { 
            error: 'You must be a member to view messages in this private group',
            code: 'NOT_A_MEMBER'
          },
          { status: 403 }
        )
      }
    }

    // Build query
    let query = supabase
      .from('group_messages')
      .select(`
        *,
        sender_profile:profiles!group_messages_sender_id_fkey(display_name, photo_url)
      `)
      .eq('group_id', groupId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (before) {
      query = query.lt('created_at', before)
    }

    const { data: messages, error: messagesError } = await query

    if (messagesError) {
      console.error('Error fetching messages:', messagesError)
      return NextResponse.json(
        { error: 'Failed to fetch messages' },
        { status: 500 }
      )
    }

    // Reverse to get chronological order
    const orderedMessages = messages?.reverse() || []

    return NextResponse.json({
      messages: orderedMessages,
      has_more: messages?.length === limit
    })

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('Error in group messages GET:', message)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
