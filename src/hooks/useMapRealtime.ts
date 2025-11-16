'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { RealtimeChannel } from '@supabase/supabase-js'

interface LocationUpdate {
  userId: string
  latitude: number
  longitude: number
  timestamp?: string
}

interface UseMapRealtimeReturn {
  isConnected: boolean
  updateLocation: (latitude: number, longitude: number) => Promise<void>
  joinMap: () => void
  leaveMap: () => void
}

/**
 * Hook for real-time map location updates using Supabase Realtime
 * Replaces Socket.io for live location sharing on the map
 */
export function useMapRealtime(): UseMapRealtimeReturn {
  const [isConnected, setIsConnected] = useState(false)
  const supabase = createClient()
  const channelRef = useRef<RealtimeChannel | null>(null)
  const currentUserIdRef = useRef<string | null>(null)

  // Initialize channel and get current user
  useEffect(() => {
    let isMounted = true
    
    const initChannel = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          console.warn('⚠️ No authenticated user for map realtime')
          // Still mark as "connected" so map can work without realtime
          setIsConnected(true)
          return
        }

        if (!isMounted) return

        currentUserIdRef.current = user.id

        // Create channel for map location updates
        const channel = supabase
          .channel('map-location-updates', {
            config: {
              broadcast: {
                self: false, // Don't receive our own broadcasts
              },
            },
          })
          .on('broadcast', { event: 'location' }, (payload) => {
            // Dispatch event for MapboxUsers to handle
            const locationUpdate = payload.payload as LocationUpdate
            window.dispatchEvent(
              new CustomEvent('user_location_update', {
                detail: locationUpdate,
              })
            )
          })
          .subscribe((status) => {
            if (!isMounted) return
            
            if (status === 'SUBSCRIBED') {
              console.log('✅ Connected to map location updates (Supabase Realtime)')
              setIsConnected(true)
            } else if (status === 'CHANNEL_ERROR') {
              console.error('❌ Map location channel error')
              setIsConnected(false)
            } else if (status === 'TIMED_OUT') {
              console.warn('⚠️ Map location channel timed out')
              setIsConnected(false)
            }
          })

        if (isMounted) {
          channelRef.current = channel
        }
      } catch (error) {
        console.error('❌ Error initializing map realtime:', error)
        // Still mark as connected so map can work
        if (isMounted) {
          setIsConnected(true)
        }
      }
    }

    initChannel()

    return () => {
      isMounted = false
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }
      setIsConnected(false)
    }
  }, [])

  // Update current user's location
  const updateLocation = useCallback(
    async (latitude: number, longitude: number) => {
      if (!channelRef.current || !isConnected || !currentUserIdRef.current) {
        return
      }

      try {
        const locationUpdate: LocationUpdate = {
          userId: currentUserIdRef.current,
          latitude,
          longitude,
          timestamp: new Date().toISOString(),
        }

        await channelRef.current.send({
          type: 'broadcast',
          event: 'location',
          payload: locationUpdate,
        })
      } catch (error) {
        console.error('❌ Error broadcasting location:', error)
      }
    },
    [isConnected]
  )

  // Join map session (for compatibility with old API)
  const joinMap = useCallback(() => {
    console.log('📍 Joined map session (Supabase Realtime)')
    // Channel is already subscribed in useEffect
  }, [])

  // Leave map session (for compatibility with old API)
  const leaveMap = useCallback(() => {
    console.log('👋 Left map session (Supabase Realtime)')
    // Channel will be cleaned up in useEffect cleanup
  }, [])

  return {
    isConnected,
    updateLocation,
    joinMap,
    leaveMap,
  }
}
