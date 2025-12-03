'use client'

import { useEffect, useRef, useCallback } from 'react'
import { 
  Room, 
  RoomEvent, 
  Participant,
  Track,
  TrackPublication,
  RemoteTrack,
  LocalTrack,
  ConnectionState
} from 'livekit-client'
import { useLiveKitStore } from '@/stores/useLiveKitStore'
import type { ParticipantMeta, ParticipantState } from '@/types/livekit'

// Debounce timeout for track sync events (ms)
const TRACK_SYNC_DEBOUNCE = 100

export const useLiveKitRoom = (room: Room | null) => {
  const {
    addOrUpdateParticipant,
    removeParticipant,
    setRoom,
    resetRoom,
    room: currentRoom
  } = useLiveKitStore()

  // Track connection state to prevent duplicate connections
  const connectionRef = useRef<{
    isConnecting: boolean
    isConnected: boolean
    roomId: string | null
  }>({
    isConnecting: false,
    isConnected: false,
    roomId: null
  })

  // Debounce timer for track sync
  const syncTimerRef = useRef<NodeJS.Timeout | null>(null)

  // Sync all participants - debounced
  const syncParticipants = useCallback((room: Room) => {
    // Clear existing timer
    if (syncTimerRef.current) {
      clearTimeout(syncTimerRef.current)
    }

    // Debounce the sync to avoid rapid updates
    syncTimerRef.current = setTimeout(() => {
      // Sync local participant
      const localMeta = extractMetadata(room.localParticipant)
      const localState = generateState(room.localParticipant, localMeta)
      addOrUpdateParticipant(localState)

      // Sync all remote participants
      room.remoteParticipants.forEach((p) => {
        const meta = extractMetadata(p)
        const state = generateState(p, meta)
        addOrUpdateParticipant(state)
      })
    }, TRACK_SYNC_DEBOUNCE)
  }, [addOrUpdateParticipant])

  useEffect(() => {
    if (!room) {
      // Clean up when room becomes null
      if (connectionRef.current.isConnected) {
        resetRoom()
        connectionRef.current = {
          isConnecting: false,
          isConnected: false,
          roomId: null
        }
      }
      return
    }

    // Prevent duplicate connections
    const roomName = room.name || 'default-room'
    if (connectionRef.current.isConnecting || 
        (connectionRef.current.isConnected && connectionRef.current.roomId === roomName)) {
      console.log('[LiveKit] Skipping duplicate connection attempt')
      return
    }

    // Prevent connecting if already have a different room connected
    if (currentRoom && currentRoom !== room) {
      console.log('[LiveKit] Cleaning up previous room before connecting new one')
      resetRoom()
    }

    connectionRef.current.isConnecting = true

    // Set room in store
    setRoom(room)

    const handleParticipantConnected = (p: Participant) => {
      console.log('[LiveKit] Participant connected:', p.identity)
      const meta = extractMetadata(p)
      const participantState = generateState(p, meta)
      addOrUpdateParticipant(participantState)

      // Subscribe to track events for this participant
      subscribeToParticipantTracks(p)
    }

    const handleParticipantDisconnected = (p: Participant) => {
      console.log('[LiveKit] Participant disconnected:', p.identity)
      removeParticipant(p.sid)
    }

    const handleTrackSubscribed = (
      track: RemoteTrack,
      publication: TrackPublication,
      participant: Participant
    ) => {
      console.log('[LiveKit] Track subscribed:', track.kind, participant.identity)
      // Debounced sync to update state
      syncParticipants(room)
    }

    const handleTrackUnsubscribed = (
      track: RemoteTrack,
      publication: TrackPublication,
      participant: Participant
    ) => {
      console.log('[LiveKit] Track unsubscribed:', track.kind, participant.identity)
      syncParticipants(room)
    }

    const handleLocalTrackPublished = (
      publication: TrackPublication,
      participant: Participant
    ) => {
      console.log('[LiveKit] Local track published:', publication.kind)
      syncParticipants(room)
    }

    const handleLocalTrackUnpublished = (
      publication: TrackPublication,
      participant: Participant
    ) => {
      console.log('[LiveKit] Local track unpublished:', publication.kind)
      syncParticipants(room)
    }

    const handleConnectionStateChanged = (state: ConnectionState) => {
      console.log('[LiveKit] Connection state changed:', state)
      
      if (state === ConnectionState.Connected) {
        connectionRef.current.isConnected = true
        connectionRef.current.isConnecting = false
        connectionRef.current.roomId = roomName
        
        // Full sync on reconnection
        syncParticipants(room)
      } else if (state === ConnectionState.Disconnected) {
        connectionRef.current.isConnected = false
        connectionRef.current.isConnecting = false
      } else if (state === ConnectionState.Reconnecting) {
        console.log('[LiveKit] Reconnecting...')
      }
    }

    const handleReconnected = () => {
      console.log('[LiveKit] Reconnected successfully')
      connectionRef.current.isConnected = true
      connectionRef.current.isConnecting = false
      // Full sync after reconnection
      syncParticipants(room)
    }

    // Subscribe to participant track events
    const subscribeToParticipantTracks = (participant: Participant) => {
      participant.on('trackMuted', () => syncParticipants(room))
      participant.on('trackUnmuted', () => syncParticipants(room))
      participant.on('isSpeakingChanged', () => syncParticipants(room))
    }

    // Room event listeners
    room.on(RoomEvent.ParticipantConnected, handleParticipantConnected)
    room.on(RoomEvent.ParticipantDisconnected, handleParticipantDisconnected)
    room.on(RoomEvent.TrackSubscribed, handleTrackSubscribed)
    room.on(RoomEvent.TrackUnsubscribed, handleTrackUnsubscribed)
    room.on(RoomEvent.LocalTrackPublished, handleLocalTrackPublished)
    room.on(RoomEvent.LocalTrackUnpublished, handleLocalTrackUnpublished)
    room.on(RoomEvent.ConnectionStateChanged, handleConnectionStateChanged)
    room.on(RoomEvent.Reconnected, handleReconnected)

    // Initial sync - add local participant and existing remote participants
    const localMeta = extractMetadata(room.localParticipant)
    const localState = generateState(room.localParticipant, localMeta)
    addOrUpdateParticipant(localState)
    subscribeToParticipantTracks(room.localParticipant)

    // Add existing remote participants (in case we're joining mid-session)
    room.remoteParticipants.forEach((p) => {
      const meta = extractMetadata(p)
      const state = generateState(p, meta)
      addOrUpdateParticipant(state)
      subscribeToParticipantTracks(p)
    })

    connectionRef.current.isConnected = room.state === ConnectionState.Connected
    connectionRef.current.isConnecting = false
    connectionRef.current.roomId = roomName

    // Cleanup function
    return () => {
      console.log('[LiveKit] Cleaning up room listeners')
      
      // Clear debounce timer
      if (syncTimerRef.current) {
        clearTimeout(syncTimerRef.current)
        syncTimerRef.current = null
      }

      // Remove all event listeners
      room.off(RoomEvent.ParticipantConnected, handleParticipantConnected)
      room.off(RoomEvent.ParticipantDisconnected, handleParticipantDisconnected)
      room.off(RoomEvent.TrackSubscribed, handleTrackSubscribed)
      room.off(RoomEvent.TrackUnsubscribed, handleTrackUnsubscribed)
      room.off(RoomEvent.LocalTrackPublished, handleLocalTrackPublished)
      room.off(RoomEvent.LocalTrackUnpublished, handleLocalTrackUnpublished)
      room.off(RoomEvent.ConnectionStateChanged, handleConnectionStateChanged)
      room.off(RoomEvent.Reconnected, handleReconnected)

      // Clean up participant listeners
      room.localParticipant.removeAllListeners()
      room.remoteParticipants.forEach((p) => {
        p.removeAllListeners()
      })

      // Full reset of store state
      resetRoom()
      
      connectionRef.current = {
        isConnecting: false,
        isConnected: false,
        roomId: null
      }
    }
  }, [room, addOrUpdateParticipant, removeParticipant, setRoom, resetRoom, syncParticipants, currentRoom])
}

function extractMetadata(p: Participant): ParticipantMeta {
  let meta: Record<string, unknown> = {}

  try {
    meta = JSON.parse(p.metadata || '{}')
  } catch {
    meta = {}
  }

  return {
    userId: (meta.userId as string) ?? p.identity,
    name: (meta.name as string) ?? 'Unknown',
    avatar: meta.avatar as string | undefined,
    role: (meta.role as 'host' | 'cohost' | 'guest' | 'member') ?? 'guest',
  }
}

function generateState(p: Participant, meta: ParticipantMeta): ParticipantState {
  return {
    sid: p.sid,
    identity: p.identity, // Add identity for better tracking
    userId: meta.userId,
    name: meta.name,
    avatar: meta.avatar,
    role: meta.role,
    isMuted: !p.isMicrophoneEnabled,
    isCameraOff: !p.isCameraEnabled,
    isHandRaised: false,
    isSpeaking: p.isSpeaking,
    // Track references for attaching/detaching
    videoTrack: p.getTrackPublication(Track.Source.Camera)?.track as LocalTrack | RemoteTrack | undefined,
    audioTrack: p.getTrackPublication(Track.Source.Microphone)?.track as LocalTrack | RemoteTrack | undefined,
  }
}

