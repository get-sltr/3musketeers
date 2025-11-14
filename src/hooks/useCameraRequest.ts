'use client'

import { useEffect, useState } from 'react'
import { Room, RoomEvent } from 'livekit-client'

interface CameraRequest {
  from: string
  fromName: string
  message: string
  timestamp: number
}

export const useCameraRequest = (room: Room | null) => {
  const [request, setRequest] = useState<CameraRequest | null>(null)

  useEffect(() => {
    if (!room) return

    const handleData = (payload: Uint8Array, participant: any) => {
      try {
        const decoded = new TextDecoder().decode(payload)
        const data = JSON.parse(decoded)

        // Check if this is a camera request from a host
        if (data.type === 'host_request' && data.action === 'camera_on') {
          // Check if this request is for the current participant
          const localIdentity = room.localParticipant.identity
          if (data.target && data.target !== localIdentity) {
            // This request is for someone else, ignore it
            return
          }

          // Use the provided fromName or extract from participant metadata
          let fromName = data.fromName || 'Host'
          if (!data.fromName) {
            try {
              const meta = JSON.parse(participant.metadata || '{}')
              fromName = meta.name || participant.identity || 'Host'
            } catch {
              fromName = participant.identity || 'Host'
            }
          }

          setRequest({
            from: data.from || participant.identity,
            fromName,
            message: data.message || 'Please turn on your camera',
            timestamp: Date.now(),
          })
        }
      } catch (e) {
        console.error('Error parsing camera request data', e)
      }
    }

    room.on(RoomEvent.DataReceived, handleData)

    return () => {
      room.off(RoomEvent.DataReceived, handleData)
    }
  }, [room])

  const clearRequest = () => {
    setRequest(null)
  }

  return {
    request,
    clearRequest,
  }
}

