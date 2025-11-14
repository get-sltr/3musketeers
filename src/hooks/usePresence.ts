'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { usePresenceStore } from '@/stores/usePresenceStore'
import { RealtimeChannel } from '@supabase/supabase-js'

/**
 * This hook connects to a global Supabase presence channel.
 * It tracks the current user and updates a global store
 * with the list of all other online users.
 */
export const usePresence = (currentUserId: string | null) => {
  const [channel, setChannel] = useState<RealtimeChannel | null>(null)
  const { setOnlineUsers, addUser, removeUser } = usePresenceStore()
  const supabase = createClient()

  useEffect(() => {
    if (!currentUserId) return

    // Create a channel for "global-presence"
    const presenceChannel = supabase.channel('global-presence', {
      config: {
        presence: {
          key: currentUserId, // Track this user's presence
        },
      },
    })

    // 2. On 'sync', get all users currently in the channel
    presenceChannel.on('presence', { event: 'sync' }, () => {
      const state = presenceChannel.presenceState()
      const userIds = Object.keys(state)
        .map(key => {
          const presences = state[key] as Array<{ user_id?: string }>
          return presences?.[0]?.user_id
        })
        .filter((id): id is string => Boolean(id))
      setOnlineUsers(userIds)
    })

    // 3. On 'join', add the new user to the store
    presenceChannel.on('presence', { event: 'join' }, ({ newPresences }) => {
      if (newPresences[0]?.user_id) {
        addUser(newPresences[0].user_id)
      }
    })

    // 4. On 'leave', remove the user from the store
    presenceChannel.on('presence', { event: 'leave' }, ({ leftPresences }) => {
      if (leftPresences[0]?.user_id) {
        removeUser(leftPresences[0].user_id)
      }
    })

    // 5. Subscribe and track the current user
    presenceChannel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await presenceChannel.track({
          user_id: currentUserId,
          online_at: new Date().toISOString(),
        })
      }
    })

    setChannel(presenceChannel)

    // 6. Unsubscribe on cleanup
    return () => {
      if (presenceChannel) {
        presenceChannel.unsubscribe()
        supabase.removeChannel(presenceChannel)
      }
    }
  }, [currentUserId, setOnlineUsers, addUser, removeUser, supabase])

}

