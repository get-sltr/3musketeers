'use client'

import { useLiveKitStore } from '@/stores/useLiveKitStore'
import type { Room } from 'livekit-client'

export const useHostTools = (room: Room | null) => {
  const {
    participants,
    promoteToHost,
    demoteToMember,
    setSpotlight,
  } = useLiveKitStore()

  const isHost = (() => {
    if (!room) return false
    try {
      const meta = JSON.parse(room.localParticipant.metadata || '{}')
      return meta.role === 'host'
    } catch {
      return false
    }
  })()

  const getParticipantByIdentity = (identity: string) => {
    if (!room) return null
    // Try to get participant by identity
    for (const [, participant] of room.remoteParticipants) {
      if (participant.identity === identity) {
        return participant
      }
    }
    // Also check local participant
    if (room.localParticipant.identity === identity) {
      return room.localParticipant
    }
    return null
  }

  const muteParticipant = async (sid: string) => {
    if (!room || !isHost) return
    const participantState = participants[sid]
    if (!participantState) return
    const p = getParticipantByIdentity(participantState.userId)
    if (!p) return
    
    // For remote participants, we need server-side control
    // For now, send a data message requesting mute
    // In production, you'd call your backend API to mute via LiveKit server SDK
    try {
      const payload = {
        type: 'host_action',
        action: 'mute',
        target: p.identity,
      }
      const encoded = new TextEncoder().encode(JSON.stringify(payload))
      await room.localParticipant.publishData(encoded, { reliable: true })
    } catch (error) {
      console.error('Failed to mute participant:', error)
    }
  }

  const disableCamera = async (sid: string) => {
    if (!room || !isHost) return
    const participantState = participants[sid]
    if (!participantState) return
    const p = getParticipantByIdentity(participantState.userId)
    if (!p) return
    
    // For remote participants, we need server-side control
    // For now, send a data message requesting camera off
    // In production, you'd call your backend API to disable camera via LiveKit server SDK
    try {
      const payload = {
        type: 'host_action',
        action: 'camera_off',
        target: p.identity,
      }
      const encoded = new TextEncoder().encode(JSON.stringify(payload))
      await room.localParticipant.publishData(encoded, { reliable: true })
    } catch (error) {
      console.error('Failed to disable camera:', error)
    }
  }

  const requestCameraOn = async (sid: string) => {
    if (!room || !isHost) return
    const participantState = participants[sid]
    if (!participantState) return
    const p = getParticipantByIdentity(participantState.userId)
    if (!p) return

    // Send a data message requesting the participant to turn on their camera
    // Note: LiveKit doesn't allow forcing camera on, only off, so this is a request
    // Data messages are broadcast to all participants, so we include target info
    try {
      let hostName = 'Host'
      try {
        const meta = JSON.parse(room.localParticipant.metadata || '{}')
        hostName = meta.name || room.localParticipant.identity || 'Host'
      } catch {
        hostName = room.localParticipant.identity || 'Host'
      }

      const payload = {
        type: 'host_request',
        action: 'camera_on',
        from: room.localParticipant.identity,
        fromName: hostName,
        target: p.identity, // Include target for filtering on receiving end
        message: 'Please turn on your camera',
      }
      const encoded = new TextEncoder().encode(JSON.stringify(payload))
      await room.localParticipant.publishData(encoded, { reliable: true })
    } catch (error) {
      console.error('Failed to send camera request:', error)
    }
  }

  const stopScreenShare = async (sid: string) => {
    if (!room || !isHost) return
    const participantState = participants[sid]
    if (!participantState) return
    const p = getParticipantByIdentity(participantState.userId)
    if (!p) return

    // For remote participants, we need server-side control
    // For now, send a data message requesting screen share stop
    // In production, you'd call your backend API to stop screen share via LiveKit server SDK
    try {
      const payload = {
        type: 'host_action',
        action: 'stop_screen_share',
        target: p.identity,
      }
      const encoded = new TextEncoder().encode(JSON.stringify(payload))
      await room.localParticipant.publishData(encoded, { reliable: true })
    } catch (error) {
      console.error('Failed to stop screen share:', error)
    }
  }

  const kickParticipant = async (sid: string) => {
    if (!room || !isHost) return
    const participantState = participants[sid]
    if (!participantState) return
    const p = getParticipantByIdentity(participantState.userId)
    if (!p) return
    
    // Kicking participants requires server-side control via LiveKit server SDK
    // For now, send a data message
    // In production, you'd call your backend API: POST /api/livekit/kick-participant
    // which uses the LiveKit server SDK to remove the participant
    try {
      const payload = {
        type: 'host_action',
        action: 'kick',
        target: p.identity,
      }
      const encoded = new TextEncoder().encode(JSON.stringify(payload))
      await room.localParticipant.publishData(encoded, { reliable: true })
      
      // TODO: Call your backend API to actually kick the participant
      // await fetch('/api/livekit/kick-participant', {
      //   method: 'POST',
      //   body: JSON.stringify({ roomName: room.name, identity: p.identity })
      // })
    } catch (error) {
      console.error('Failed to kick participant:', error)
    }
  }

  const spotlightParticipant = (sid: string) => {
    if (!isHost) return
    setSpotlight(sid)
  }

  const promote = (sid: string) => {
    if (!isHost) return
    promoteToHost(sid)
  }

  const demote = (sid: string) => {
    if (!isHost) return
    demoteToMember(sid)
  }

  return {
    isHost,
    muteParticipant,
    disableCamera,
    requestCameraOn,
    stopScreenShare,
    kickParticipant,
    spotlightParticipant,
    promote,
    demote,
  }
}

