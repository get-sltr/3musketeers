'use client'

import { useEffect } from 'react'
import { Room, RoomEvent, RemoteParticipant, LocalParticipant } from 'livekit-client'
import { useLiveKitStore } from '@/stores/useLiveKitStore'
import type { ParticipantMeta, ParticipantState } from '@/types/livekit'

export const useLiveKitRoom = (room: Room | null) => {
  const {
    addOrUpdateParticipant,
    removeParticipant,
    setRoom,
    resetRoom
  } = useLiveKitStore()

  useEffect(() => {
    if (!room) return

    // CRITICAL: Reset store before setting up new room to clear old participants
    resetRoom()
    setRoom(room)

    const handleParticipantConnected = (p: RemoteParticipant | LocalParticipant) => {
      const meta = extractMetadata(p)
      const participantState = generateState(p, meta)
      addOrUpdateParticipant(participantState)
    }

    const handleParticipantDisconnected = (p: RemoteParticipant) => {
      removeParticipant(p.sid)
    }

    // Sync all participants when tracks change
    const syncAllParticipants = () => {
      // Update local participant
      const localMeta = extractMetadata(room.localParticipant)
      addOrUpdateParticipant(generateState(room.localParticipant, localMeta))

      // Update all remote participants
      room.remoteParticipants.forEach((p) => {
        const meta = extractMetadata(p)
        addOrUpdateParticipant(generateState(p, meta))
      })
    }

    // Subscribe to room events
    room.on(RoomEvent.ParticipantConnected, handleParticipantConnected)
    room.on(RoomEvent.ParticipantDisconnected, handleParticipantDisconnected)
    room.on(RoomEvent.TrackSubscribed, syncAllParticipants)
    room.on(RoomEvent.TrackMuted, syncAllParticipants)
    room.on(RoomEvent.TrackUnmuted, syncAllParticipants)
    room.on(RoomEvent.LocalTrackPublished, syncAllParticipants)
    room.on(RoomEvent.TrackPublished, syncAllParticipants)

    // Add local participant first
    handleParticipantConnected(room.localParticipant)

    // CRITICAL: Add ALL existing remote participants who were already in the room
    room.remoteParticipants.forEach((participant) => {
      console.log('Adding existing remote participant:', participant.identity)
      handleParticipantConnected(participant)
    })

    return () => {
      room.off(RoomEvent.ParticipantConnected, handleParticipantConnected)
      room.off(RoomEvent.ParticipantDisconnected, handleParticipantDisconnected)
      room.off(RoomEvent.TrackSubscribed, syncAllParticipants)
      room.off(RoomEvent.TrackMuted, syncAllParticipants)
      room.off(RoomEvent.TrackUnmuted, syncAllParticipants)
      room.off(RoomEvent.LocalTrackPublished, syncAllParticipants)
      room.off(RoomEvent.TrackPublished, syncAllParticipants)
      // CRITICAL: Reset entire store on cleanup to prevent stale participants
      resetRoom()
    }
  }, [room, addOrUpdateParticipant, removeParticipant, setRoom, resetRoom])
}

function extractMetadata(p: RemoteParticipant | LocalParticipant): ParticipantMeta {
  let meta: any = {}

  try {
    meta = JSON.parse(p.metadata || '{}')
  } catch {
    meta = {}
  }

  return {
    userId: meta.userId ?? p.identity,
    name: meta.name ?? p.identity ?? 'Unknown',
    avatar: meta.avatar,
    role: meta.role ?? 'guest',
  }
}

function generateState(p: RemoteParticipant | LocalParticipant, meta: ParticipantMeta): ParticipantState {
  return {
    sid: p.sid,
    identity: p.identity,
    userId: meta.userId,
    name: meta.name,
    avatar: meta.avatar,
    role: meta.role,
    isMuted: !p.isMicrophoneEnabled,
    isCameraOff: !p.isCameraEnabled,
    isHandRaised: false,
    isSpeaking: p.isSpeaking,
  }
}

