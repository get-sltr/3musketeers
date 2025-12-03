import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * POST /api/groups/[id]/join
 * Join a group - auto-joins public groups, requires invite for private
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

    // Get group details
    const { data: group, error: groupError } = await supabase
      .from('groups')
      .select('id, name, is_private, max_members')
      .eq('id', groupId)
      .single()

    if (groupError || !group) {
      return NextResponse.json(
        { error: 'Group not found' },
        { status: 404 }
      )
    }

    // Check if user is already a member
    const { data: existingMember } = await supabase
      .from('group_members')
      .select('id, role')
      .eq('group_id', groupId)
      .eq('user_id', user.id)
      .single()

    if (existingMember) {
      return NextResponse.json({
        success: true,
        message: 'Already a member',
        member: existingMember,
        already_member: true
      })
    }

    // Check if group is private
    if (group.is_private) {
      return NextResponse.json(
        { 
          error: 'This is a private group. You need an invitation to join.',
          code: 'PRIVATE_GROUP'
        },
        { status: 403 }
      )
    }

    // Check member count limit
    if (group.max_members) {
      const { count } = await supabase
        .from('group_members')
        .select('*', { count: 'exact', head: true })
        .eq('group_id', groupId)

      if (count && count >= group.max_members) {
        return NextResponse.json(
          { 
            error: 'This group has reached its maximum member limit.',
            code: 'GROUP_FULL'
          },
          { status: 400 }
        )
      }
    }

    // Add user as member
    const { data: member, error: insertError } = await supabase
      .from('group_members')
      .insert({
        group_id: groupId,
        user_id: user.id,
        role: 'member'
      })
      .select()
      .single()

    if (insertError) {
      console.error('Error joining group:', insertError)
      return NextResponse.json(
        { error: 'Failed to join group' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: `Successfully joined ${group.name}`,
      member,
      group_name: group.name
    })

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('Error in group join API:', message)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/groups/[id]/join
 * Leave a group
 */
export async function DELETE(
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

    // Check membership
    const { data: membership } = await supabase
      .from('group_members')
      .select('id, role')
      .eq('group_id', groupId)
      .eq('user_id', user.id)
      .single()

    if (!membership) {
      return NextResponse.json(
        { error: 'Not a member of this group' },
        { status: 400 }
      )
    }

    // Owners cannot leave - they must transfer ownership or delete the group
    if (membership.role === 'owner') {
      return NextResponse.json(
        { 
          error: 'Group owners cannot leave. Transfer ownership or delete the group instead.',
          code: 'OWNER_CANNOT_LEAVE'
        },
        { status: 400 }
      )
    }

    // Remove membership
    const { error: deleteError } = await supabase
      .from('group_members')
      .delete()
      .eq('group_id', groupId)
      .eq('user_id', user.id)

    if (deleteError) {
      console.error('Error leaving group:', deleteError)
      return NextResponse.json(
        { error: 'Failed to leave group' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Successfully left the group'
    })

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('Error in group leave API:', message)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
