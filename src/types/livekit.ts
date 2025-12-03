import type { LocalTrack, RemoteTrack } from 'livekit-client'

export type Role = 'host' | 'cohost' | 'guest' | 'member'

export interface ParticipantMeta {
  userId: string
  name: string
  avatar?: string
  role: Role
}

export interface ParticipantState {
  sid: string
  identity?: string // Participant identity for better tracking
  userId: string
  name: string
  avatar?: string
  role: Role
  isMuted: boolean
  isCameraOff: boolean
  isHandRaised: boolean
  isSpeaking: boolean
  // Track references for attaching/detaching video elements
  videoTrack?: LocalTrack | RemoteTrack
  audioTrack?: LocalTrack | RemoteTrack
}

export interface SpotlightState {
  participantId: string | null
}

export interface WaitingRoomEntry {
  userId: string
  name: string
  avatar?: string
  timestamp: number
}

export interface Permissions {
  canUnmuteSelf: boolean
  canTurnOnCamera: boolean
  canSpeak: boolean
  canShareScreen: boolean
  canPromoteOthers: boolean
  canKick: boolean
  canMuteOthers: boolean
}

