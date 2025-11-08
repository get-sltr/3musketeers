import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

const supabase = createClientComponentClient()

const viewCooldown = new Map<string, number>()
const VIEW_COOLDOWN_MS = 30_000

interface ProfileViewOptions {
  viewedPhotos?: boolean
  viewedFullProfile?: boolean
  scrollDepth?: number
}

export async function recordProfileView(
  viewedUserId: string,
  options: ProfileViewOptions = {}
) {
  const now = Date.now()
  const lastView = viewCooldown.get(viewedUserId)
  if (lastView && now - lastView < VIEW_COOLDOWN_MS) return
  viewCooldown.set(viewedUserId, now)

  try {
    const { error } = await supabase.rpc('record_profile_view', {
      viewed_user: viewedUserId,
      photos_viewed: options.viewedPhotos ?? false,
      full_profile_viewed: options.viewedFullProfile ?? false,
      scroll_amount: options.scrollDepth ?? 0,
    })
    if (error) throw error
    return { success: true }
  } catch (error) {
    console.error('Error recording profile view:', error)
    return { success: false, error }
  }
}

export async function recordTap(targetUserId: string) {
  try {
    const { data, error } = await supabase.rpc('tap_user', {
      target_user_id: targetUserId,
    })
    if (error) throw error
    return { success: true, data }
  } catch (error) {
    console.error('Error recording tap:', error)
    return { success: false, error }
  }
}

export async function removeTap(targetUserId: string) {
  try {
    const { error } = await supabase.rpc('untap_user', {
      target_user_id: targetUserId,
    })
    if (error) throw error
    return { success: true }
  } catch (error) {
    console.error('Error removing tap:', error)
    return { success: false, error }
  }
}

export async function getMyTaps() {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: null, error: 'Not authenticated' }

  const { data, error } = await supabase
    .from('taps')
    .select(`
      *,
      tapped_user:profiles!tapped_user_id(
        id,
        display_name,
        photo_url,
        age,
        position,
        distance,
        is_online,
        dtfn
      )
    `)
    .eq('tapper_id', user.id)
    .order('tapped_at', { ascending: false })

  return { data, error }
}

export async function getTapsReceived() {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: null, error: 'Not authenticated' }

  const { data, error } = await supabase
    .from('taps')
    .select(`
      *,
      tapper:profiles!tapper_id(
        id,
        display_name,
        photo_url,
        age,
        position,
        distance,
        is_online,
        dtfn
      )
    `)
    .eq('tapped_user_id', user.id)
    .order('tapped_at', { ascending: false })

  return { data, error }
}

export async function getMutualTaps() {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: null, error: 'Not authenticated' }

  const { data, error } = await supabase
    .from('taps')
    .select(`
      *,
      tapped_user:profiles!tapped_user_id(
        id,
        display_name,
        photo_url,
        age,
        position,
        distance,
        is_online,
        dtfn
      )
    `)
    .eq('tapper_id', user.id)
    .eq('is_mutual', true)
    .order('tapped_at', { ascending: false })

  return { data, error }
}
