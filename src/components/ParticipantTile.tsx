'use client'

import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { Track, TrackPublication, RemoteTrackPublication } from 'livekit-client'
import type { ParticipantState } from '@/types/livekit'
import { useLiveKitStore } from '@/stores/useLiveKitStore'

interface ParticipantTileProps {
  participant: ParticipantState
  isSpotlight?: boolean
}

export default function ParticipantTile({ participant, isSpotlight = false }: ParticipantTileProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const { room } = useLiveKitStore()
  const [hasVideo, setHasVideo] = useState(false)
  const attachedTrackRef = useRef<Track | null>(null)

  useEffect(() => {
    if (!room || !videoRef.current) return

    const videoElement = videoRef.current

    // Find the actual LiveKit participant by identity (more reliable than sid)
    let lkParticipant = null

    if (participant.identity === room.localParticipant.identity) {
      lkParticipant = room.localParticipant
    } else {
      // Search through remote participants by identity
      lkParticipant = room.remoteParticipants.get(participant.identity)

      // Fallback: search by sid if identity lookup fails
      if (!lkParticipant) {
        room.remoteParticipants.forEach((p) => {
          if (p.sid === participant.sid) {
            lkParticipant = p
          }
        })
      }
    }

    if (!lkParticipant) {
      console.warn('Could not find LiveKit participant:', participant.identity, participant.sid)
      setHasVideo(false)
      return
    }

    // Get camera track
    const cameraTrack = lkParticipant.getTrackPublication(Track.Source.Camera)

    const attachTrack = () => {
      if (cameraTrack?.track && videoElement) {
        // Detach any previously attached track first
        if (attachedTrackRef.current && attachedTrackRef.current !== cameraTrack.track) {
          attachedTrackRef.current.detach(videoElement)
        }

        cameraTrack.track.attach(videoElement)
        attachedTrackRef.current = cameraTrack.track
        setHasVideo(true)
        console.log('Attached video track for:', participant.identity)
      } else {
        setHasVideo(false)
      }
    }

    if (!cameraTrack) {
      setHasVideo(false)
      return
    }

    // Check if it's a remote track that needs subscription
    const isRemoteTrack = 'isSubscribed' in cameraTrack

    if (isRemoteTrack) {
      const remoteTrack = cameraTrack as RemoteTrackPublication
      if (remoteTrack.isSubscribed && remoteTrack.track) {
        attachTrack()
      } else {
        // Track not yet subscribed, set up listener
        const handleSubscribed = () => {
          console.log('Track subscribed for:', participant.identity)
          attachTrack()
        }
        remoteTrack.on('subscribed', handleSubscribed)

        return () => {
          remoteTrack.off('subscribed', handleSubscribed)
          if (attachedTrackRef.current && videoElement) {
            attachedTrackRef.current.detach(videoElement)
            attachedTrackRef.current = null
          }
        }
      }
    } else if (cameraTrack.track) {
      // Local track - attach immediately
      attachTrack()
    } else {
      setHasVideo(false)
    }

    // Cleanup
    return () => {
      if (attachedTrackRef.current && videoElement) {
        attachedTrackRef.current.detach(videoElement)
        attachedTrackRef.current = null
      }
    }
  }, [room, participant.sid, participant.identity, participant.isCameraOff])

  if (!participant) return null

  const speakingGlow = participant.isSpeaking
    ? 'shadow-[0_0_25px_rgba(180,99,255,0.55)]'
    : 'shadow-[0_0_12px_rgba(180,99,255,0.25)]'

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`relative flex flex-col items-center justify-center
      bg-black/40 backdrop-blur-xl border border-white/10
      rounded-2xl overflow-hidden p-2 transition-all duration-300
      ${speakingGlow}
      ${isSpotlight ? 'w-[70%] h-[70%]' : 'w-full h-full'}
      `}
    >

      {/* Video Element */}
      <div className="flex-1 w-full flex items-center justify-center text-white/40 relative">
        {/* Always render video element so track can attach, hide when no video */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={participant.identity === room?.localParticipant.identity}
          className={`w-full h-full object-cover rounded-xl ${
            participant.isCameraOff || !hasVideo ? 'hidden' : ''
          }`}
        />
        {/* Placeholder when no video */}
        {(participant.isCameraOff || !hasVideo) && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500/40 to-lime-500/40 flex items-center justify-center text-2xl font-bold text-white">
              {participant.name?.charAt(0)?.toUpperCase() || '?'}
            </div>
            <div className="text-sm">{participant.name}</div>
          </div>
        )}
      </div>

      {/* Bottom status bar */}
      <div className="absolute bottom-0 left-0 right-0 p-2 bg-black/40 backdrop-blur-xl flex items-center justify-between">
        <div className="text-sm font-medium">{participant.name}</div>

        <div className="flex items-center gap-2">
          {participant.role === 'host' && (
            <span className="px-2 py-1 text-xs bg-purple-500/40 border border-purple-500/60 rounded-lg">
              HOST
            </span>
          )}
          {participant.isHandRaised && (
            <span className="text-purple-300 text-base">✋</span>
          )}
        </div>
      </div>
    </motion.div>
  )
}

