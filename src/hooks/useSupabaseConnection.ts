// hooks/useSupabaseConnection.ts
import { useEffect, useRef } from 'react'
import { createClient } from '../lib/supabase/client'

export function useSupabaseConnection() {
  const supabase = useRef(createClient()).current
  const channelRef = useRef<any>(null)
  
  useEffect(() => {
    // Create ONE channel for everything
    const channel = supabase.channel('app_channel', {
      config: {
        presence: { key: 'user_id' },
      }
    })
    
    channelRef.current = channel
    
    // Subscribe ONCE
    channel.subscribe()
    
    // Cleanup properly
    return () => {
      channel.unsubscribe()
      supabase.removeChannel(channel)
    }
  }, [supabase])
  
  return { supabase, channel: channelRef.current }
}
