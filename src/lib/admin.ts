import { createClient as createSupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!

/**
 * Creates a Supabase admin client that bypasses RLS (Row Level Security).
 * Use this for admin operations that need full database access.
 */
export function createAdminClient() {
  return createSupabaseClient(supabaseUrl, supabaseServiceKey)
}

/**
 * Check if a user is a super admin by querying their profile.
 * @param userId - The user ID to check
 * @returns Promise<boolean> - True if the user is a super admin
 */
export async function isAdmin(userId: string): Promise<boolean> {
  const adminClient = createAdminClient()
  const { data } = await adminClient
    .from('profiles')
    .select('is_super_admin')
    .eq('id', userId)
    .single()

  return data?.is_super_admin === true
}
