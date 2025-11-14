'use client'

import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { usePresenceStore } from '@/stores/usePresenceStore'
import type { RealtimeChannel } from '@supabase/supabase-js'

const supabase = createClient()

export const usePresence = (currentUserId: string | null) => {
  const channelRef = useRef<RealtimeChannel | null>(null)
  const [isConnected, setIsConnected] = useState(false)

  const {
    setOnlineUsers,
    addUser,
    removeUser,
    resetPresence,
  } = usePresenceStore()

  useEffect(() => {
    if (!currentUserId) return
    if (channelRef.current) return // already connected

    const presenceChannel = supabase.channel('global-presence', {
      config: {
        presence: {
          key: currentUserId,
        },
      },
    })

    channelRef.current = presenceChannel

    // SYNC EVENT = Full presence snapshot
    presenceChannel.on('presence', { event: 'sync' }, () => {
      const state = presenceChannel.presenceState()

      const userIds = Object.values(state)
        .flat()
        .map((p: any) => p.user_id)

      setOnlineUsers(userIds)
    })

    // JOIN EVENT
    presenceChannel.on('presence', { event: 'join' }, ({ newPresences }) => {
      if (!newPresences?.length) return
      const presence = newPresences[0]
      const user_id = presence?.user_id || (presence as any)?.user_id
      if (user_id) addUser(user_id)
    })

    // LEAVE EVENT
    presenceChannel.on('presence', { event: 'leave' }, ({ leftPresences }) => {
      if (!leftPresences?.length) return
      const presence = leftPresences[0]
      const user_id = presence?.user_id || (presence as any)?.user_id
      if (user_id) removeUser(user_id)
    })

    // SUBSCRIBE AND SEND OWN PRESENCE
    presenceChannel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        setIsConnected(true)

        await presenceChannel.track({
          user_id: currentUserId,
          online_at: new Date().toISOString(),
        })
      }
    })

    // CLEANUP
    return () => {
      setIsConnected(false)
      resetPresence()
      presenceChannel.unsubscribe()
      channelRef.current = null
    }
  }, [currentUserId])

  return { isConnected }
}

