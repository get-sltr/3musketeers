'use client'

import { useState, useEffect, Suspense, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Room } from 'livekit-client'
import ConferenceRoom from '@/components/ConferenceRoom'
import LoadingSkeleton from '@/components/LoadingSkeleton'

function ChannelRoomContent({ channelId }: { channelId: string }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const channelType = searchParams?.get('type') || 'text'
  const groupId = searchParams?.get('group') || ''

  const [room, setRoom] = useState<Room | null>(null)
  const [connecting, setConnecting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Use ref to prevent multiple connection attempts
  const connectionAttempted = useRef(false)
  const roomRef = useRef<Room | null>(null)

  useEffect(() => {
    // Prevent multiple connections
    if (connectionAttempted.current) return
    connectionAttempted.current = true

    const supabase = createClient()

    const connectToRoom = async () => {
      if (channelType !== 'video' && channelType !== 'voice') {
        // For text channels, redirect to chat interface
        router.push(`/groups/${groupId}?channel=${channelId}`)
        return
      }

      setConnecting(true)
      setError(null)

      try {
        // Get current user
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          throw new Error('Not authenticated')
        }

        // Get user profile for name
        const { data: profile } = await supabase
          .from('profiles')
          .select('display_name, photo_url')
          .eq('id', user.id)
          .single()

        const participantName = profile?.display_name || user.id

        // Get LiveKit token from Next.js API route
        const response = await fetch('/api/livekit-token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            roomName: `group-${groupId}-${channelId}`,
            participantName,
          }),
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to get LiveKit token')
        }

        const { token, url } = await response.json()

        // Connect to LiveKit room
        const newRoom = new Room()

        await newRoom.connect(url, token, {
          autoSubscribe: true,
        })

        // Set participant metadata after connection
        await newRoom.localParticipant.setMetadata(JSON.stringify({
          userId: user.id,
          name: participantName,
          avatar: profile?.photo_url,
          role: 'member', // Default role, can be 'host' if user created the group
        }))

        // Enable camera and microphone
        if (channelType === 'video') {
          await newRoom.localParticipant.setCameraEnabled(true)
        }
        await newRoom.localParticipant.setMicrophoneEnabled(true)

        roomRef.current = newRoom
        setRoom(newRoom)

        // Handle disconnection - reset everything
        newRoom.on('disconnected', () => {
          setRoom(null)
          roomRef.current = null
          connectionAttempted.current = false  // Allow reconnection on next visit
          router.back()
        })

      } catch (err: any) {
        console.error('Failed to connect to room:', err)
        setError(err.message || 'Failed to connect to video room')
        connectionAttempted.current = false // Allow retry on error
      } finally {
        setConnecting(false)
      }
    }

    connectToRoom()

    return () => {
      if (roomRef.current) {
        roomRef.current.disconnect()
        roomRef.current = null
      }
      connectionAttempted.current = false  // Reset for next mount
    }
  }, [channelId, channelType, groupId, router])

  if (connecting) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center z-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-lime-400 mx-auto mb-4"></div>
          <p className="text-white">Connecting to {channelType === 'video' ? 'video' : 'voice'} room...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center z-50">
        <div className="max-w-md w-full bg-red-500/20 border border-red-500/40 rounded-2xl p-6 text-center">
          <h2 className="text-2xl font-semibold text-white mb-2">Connection Failed</h2>
          <p className="text-red-200 text-sm mb-4">{error}</p>
          <button
            onClick={() => router.back()}
            className="px-6 py-3 rounded-full bg-red-500 text-white font-semibold"
          >
            Go Back
          </button>
        </div>
      </div>
    )
  }

  if (!room) {
    return null
  }

  return <ConferenceRoom room={room} />
}

export default function ChannelRoomPage({ params }: { params: { id: string } }) {
  return (
    <Suspense fallback={
      <div className="fixed inset-0 bg-black flex items-center justify-center">
        <LoadingSkeleton variant="fullscreen" />
      </div>
    }>
      <ChannelRoomContent channelId={params.id} />
    </Suspense>
  )
}

