'use client'

import { useEffect } from 'react'
import { Room, RoomEvent, ParticipantEvent } from 'livekit-client'
import { useLiveKitStore } from '@/stores/useLiveKitStore'
import type { ParticipantMeta, ParticipantState } from '@/types/livekit'

export const useLiveKitRoom = (room: Room | null) => {
  const {
    addOrUpdateParticipant,
    removeParticipant,
    setRoom
  } = useLiveKitStore()

  useEffect(() => {
    if (!room) return

    setRoom(room)

    const handleParticipantConnected = (p: any) => {
      const meta = extractMetadata(p)
      const participantState = generateState(p, meta)
      addOrUpdateParticipant(participantState)
    }

    const handleParticipantDisconnected = (p: any) => {
      removeParticipant(p.sid)
    }

    room.on(RoomEvent.ParticipantConnected, handleParticipantConnected)
    room.on(RoomEvent.ParticipantDisconnected, handleParticipantDisconnected)

    // local participant
    handleParticipantConnected(room.localParticipant)

    return () => {
      room.off(RoomEvent.ParticipantConnected, handleParticipantConnected)
      room.off(RoomEvent.ParticipantDisconnected, handleParticipantDisconnected)
      setRoom(null)
    }
  }, [room, addOrUpdateParticipant, removeParticipant, setRoom])
}

function extractMetadata(p: any): ParticipantMeta {
  let meta: any = {}

  try {
    meta = JSON.parse(p.metadata || '{}')
  } catch {
    meta = {}
  }

  return {
    userId: meta.userId ?? p.identity,
    name: meta.name ?? 'Unknown',
    avatar: meta.avatar,
    role: meta.role ?? 'guest',
  }
}

function generateState(p: any, meta: ParticipantMeta): ParticipantState {
  return {
    sid: p.sid,
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

