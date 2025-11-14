import { create } from 'zustand'
import type { Room } from 'livekit-client'

import {
  Role,
  ParticipantState,
  SpotlightState,
  WaitingRoomEntry,
} from '@/types/livekit'

interface LiveKitState {
  room: Room | null
  participants: Record<string, ParticipantState>
  spotlight: SpotlightState
  waitingRoom: WaitingRoomEntry[]

  hardHostMode: boolean

  // NEW: screen share state
  screenShareParticipantId: string | null
  isLocalScreenSharing: boolean

  // NEW: local participant controls
  micEnabled: boolean
  cameraEnabled: boolean

  setRoom: (room: Room | null) => void

  addOrUpdateParticipant: (p: ParticipantState) => void
  removeParticipant: (sid: string) => void

  promoteToHost: (sid: string) => void
  demoteToMember: (sid: string) => void

  setSpotlight: (sid: string | null) => void

  raiseHand: (sid: string) => void
  lowerHand: (sid: string) => void

  addToWaitingRoom: (user: WaitingRoomEntry) => void
  removeFromWaitingRoom: (userId: string) => void

  setHardHostMode: (enabled: boolean) => void

  // NEW: screen share setters
  setScreenShareParticipant: (sid: string | null) => void
  setLocalScreenSharing: (on: boolean) => void

  // NEW: local participant controls
  toggleMic: () => void
  toggleCamera: () => void

  resetRoom: () => void
}

export const useLiveKitStore = create<LiveKitState>((set, get) => ({
  room: null,
  participants: {},
  spotlight: { participantId: null },
  waitingRoom: [],
  hardHostMode: false,

  screenShareParticipantId: null,
  isLocalScreenSharing: false,

  micEnabled: true,
  cameraEnabled: true,

  setRoom: (room) => set({ room }),

  addOrUpdateParticipant: (p) =>
    set((state) => ({
      participants: {
        ...state.participants,
        [p.sid]: p
      }
    })),

  removeParticipant: (sid) =>
    set((state) => {
      const next = { ...state.participants }
      delete next[sid]
      return { participants: next }
    }),

  promoteToHost: (sid) =>
    set((state) => {
      const participant = state.participants[sid]
      if (!participant) return state
      return {
        participants: {
          ...state.participants,
          [sid]: { ...participant, role: 'host' as Role },
        },
      }
    }),

  demoteToMember: (sid) =>
    set((state) => {
      const participant = state.participants[sid]
      if (!participant) return state
      return {
        participants: {
          ...state.participants,
          [sid]: { ...participant, role: 'member' as Role },
        },
      }
    }),

  setSpotlight: (sid) => set({ spotlight: { participantId: sid } }),

  raiseHand: (sid) =>
    set((state) => {
      const p = state.participants[sid]
      if (!p) return state
      return {
        participants: {
          ...state.participants,
          [sid]: { ...p, isHandRaised: true }
        }
      }
    }),

  lowerHand: (sid) =>
    set((state) => {
      const p = state.participants[sid]
      if (!p) return state
      return {
        participants: {
          ...state.participants,
          [sid]: { ...p, isHandRaised: false }
        }
      }
    }),

  addToWaitingRoom: (user) =>
    set((state) => ({
      waitingRoom: [...state.waitingRoom, user],
    })),

  removeFromWaitingRoom: (userId) =>
    set((state) => ({
      waitingRoom: state.waitingRoom.filter((u) => u.userId !== userId),
    })),

  setHardHostMode: (enabled) => set({ hardHostMode: enabled }),

  setScreenShareParticipant: (sid) =>
    set({ screenShareParticipantId: sid }),

  setLocalScreenSharing: (on) =>
    set({ isLocalScreenSharing: on }),

  toggleMic: () => {
    const { room, micEnabled } = get()
    if (!room) return

    const local = room.localParticipant
    local.setMicrophoneEnabled(!micEnabled)
    set({ micEnabled: !micEnabled })
  },

  toggleCamera: () => {
    const { room, cameraEnabled } = get()
    if (!room) return

    const local = room.localParticipant
    local.setCameraEnabled(!cameraEnabled)
    set({ cameraEnabled: !cameraEnabled })
  },

  resetRoom: () =>
    set({
      room: null,
      participants: {},
      spotlight: { participantId: null },
      waitingRoom: [],
      hardHostMode: false,
      screenShareParticipantId: null,
      isLocalScreenSharing: false,
      micEnabled: true,
      cameraEnabled: true,
    }),
}))

