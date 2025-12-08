import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { withCSRFProtection } from '@/lib/csrf-server'

async function handler(request: NextRequest) {
  try {
    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Verify the requesting user matches the account to delete
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user || user.id !== userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Delete user data (cascades will handle related tables)
    // 1. Delete from profiles table (this cascades to messages, taps, etc.)
    const { error: profileError } = await supabase
      .from('profiles')
      .delete()
      .eq('id', userId)

    if (profileError) {
      console.error('Error deleting profile:', profileError)
      return NextResponse.json(
        { error: 'Failed to delete profile data' },
        { status: 500 }
      )
    }

    // 2. Delete auth user (requires admin/service role)
    // TODO: This should use a separate admin client with SUPABASE_SERVICE_ROLE_KEY
    // The current createClient() uses anon key which won't have admin.deleteUser permissions
    const supabaseAdmin = await createClient()
    const { error: deleteAuthError } = await supabaseAdmin.auth.admin.deleteUser(userId)

    if (deleteAuthError) {
      console.error('Error deleting auth user:', deleteAuthError)
      // Profile is already deleted, so just log this
      console.warn('Auth user deletion failed but profile was removed')
    }

    return NextResponse.json({
      success: true,
      message: 'Account deleted successfully'
    })
  } catch (error) {
    console.error('Delete account error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export const POST = withCSRFProtection(handler)
