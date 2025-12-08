'use client'

import { useEffect, useRef, useCallback } from 'react'
import { Room, RoomEvent, RemoteParticipant, LocalParticipant, ConnectionState } from 'livekit-client'
import { useLiveKitStore } from '@/stores/useLiveKitStore'
import type { ParticipantMeta, ParticipantState } from '@/types/livekit'

export const useLiveKitRoom = (room: Room | null) => {
  const {
    addOrUpdateParticipant,
    removeParticipant,
    setRoom,
    resetRoom
  } = useLiveKitStore()

  // Track if room is still active to avoid race conditions
  const isActiveRef = useRef(false)
  const syncTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Debounced sync to batch rapid track events
  const debouncedSync = useCallback((room: Room) => {
    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current)
    }
    syncTimeoutRef.current = setTimeout(() => {
      if (!isActiveRef.current) {
        console.log('Skipping sync - room no longer active')
        return
      }

      // Update local participant
      const localMeta = extractMetadata(room.localParticipant)
      addOrUpdateParticipant(generateState(room.localParticipant, localMeta))

      // Update all remote participants
      room.remoteParticipants.forEach((p) => {
        const meta = extractMetadata(p)
        addOrUpdateParticipant(generateState(p, meta))
      })
    }, 50) // 50ms debounce to batch rapid events
  }, [addOrUpdateParticipant])

  useEffect(() => {
    if (!room) return

    // Mark room as active
    isActiveRef.current = true

    // CRITICAL: Reset store before setting up new room to clear old participants
    resetRoom()
    setRoom(room)

    const handleParticipantConnected = (p: RemoteParticipant | LocalParticipant) => {
      if (!isActiveRef.current) {
        console.log('Skipping participant connected - room no longer active')
        return
      }
      const meta = extractMetadata(p)
      const participantState = generateState(p, meta)
      addOrUpdateParticipant(participantState)
      console.log('Participant connected:', p.identity, 'total:', room.remoteParticipants.size + 1)
    }

    const handleParticipantDisconnected = (p: RemoteParticipant) => {
      if (!isActiveRef.current) return
      removeParticipant(p.sid)
      console.log('Participant disconnected:', p.identity)
    }

    // Sync all participants when tracks change (debounced)
    const syncAllParticipants = () => {
      if (!isActiveRef.current) {
        console.log('Skipping track event - room no longer active')
        return
      }
      debouncedSync(room)
    }

    // Handle reconnection
    const handleReconnected = () => {
      console.log('Room reconnected, syncing all participants')
      if (!isActiveRef.current) return

      // Re-add all participants after reconnection
      handleParticipantConnected(room.localParticipant)
      room.remoteParticipants.forEach((participant) => {
        handleParticipantConnected(participant)
      })
    }

    // Subscribe to room events
    room.on(RoomEvent.ParticipantConnected, handleParticipantConnected)
    room.on(RoomEvent.ParticipantDisconnected, handleParticipantDisconnected)
    room.on(RoomEvent.TrackSubscribed, syncAllParticipants)
    room.on(RoomEvent.TrackUnsubscribed, syncAllParticipants)
    room.on(RoomEvent.TrackMuted, syncAllParticipants)
    room.on(RoomEvent.TrackUnmuted, syncAllParticipants)
    room.on(RoomEvent.LocalTrackPublished, syncAllParticipants)
    room.on(RoomEvent.LocalTrackUnpublished, syncAllParticipants)
    room.on(RoomEvent.TrackPublished, syncAllParticipants)
    room.on(RoomEvent.Reconnected, handleReconnected)

    // Add local participant first
    handleParticipantConnected(room.localParticipant)

    // CRITICAL: Add ALL existing remote participants who were already in the room
    console.log('Adding', room.remoteParticipants.size, 'existing remote participants')
    room.remoteParticipants.forEach((participant) => {
      handleParticipantConnected(participant)
    })

    return () => {
      // Mark room as inactive FIRST to prevent race conditions
      isActiveRef.current = false

      // Clear any pending sync
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current)
        syncTimeoutRef.current = null
      }

      room.off(RoomEvent.ParticipantConnected, handleParticipantConnected)
      room.off(RoomEvent.ParticipantDisconnected, handleParticipantDisconnected)
      room.off(RoomEvent.TrackSubscribed, syncAllParticipants)
      room.off(RoomEvent.TrackUnsubscribed, syncAllParticipants)
      room.off(RoomEvent.TrackMuted, syncAllParticipants)
      room.off(RoomEvent.TrackUnmuted, syncAllParticipants)
      room.off(RoomEvent.LocalTrackPublished, syncAllParticipants)
      room.off(RoomEvent.LocalTrackUnpublished, syncAllParticipants)
      room.off(RoomEvent.TrackPublished, syncAllParticipants)
      room.off(RoomEvent.Reconnected, handleReconnected)

      // CRITICAL: Reset entire store on cleanup to prevent stale participants
      resetRoom()
    }
  }, [room, addOrUpdateParticipant, removeParticipant, setRoom, resetRoom, debouncedSync])
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

