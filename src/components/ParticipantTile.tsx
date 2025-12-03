import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import type { ParticipantState } from '@/types/livekit'

interface ParticipantTileProps {
  participant: ParticipantState
  isSpotlight?: boolean
}

export default function ParticipantTile({ participant, isSpotlight = false }: ParticipantTileProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const audioRef = useRef<HTMLAudioElement>(null)

  // Attach/detach video track
  useEffect(() => {
    const videoElement = videoRef.current
    const videoTrack = participant.videoTrack

    if (!videoElement) return

    if (videoTrack && !participant.isCameraOff) {
      // Attach track to video element
      videoTrack.attach(videoElement)
      return () => {
        videoTrack.detach(videoElement)
      }
    } else {
      // Ensure video is cleared when no track
      videoElement.srcObject = null
    }
  }, [participant.videoTrack, participant.isCameraOff])

  // Attach/detach audio track (for remote participants)
  useEffect(() => {
    const audioElement = audioRef.current
    const audioTrack = participant.audioTrack

    if (!audioElement) return

    // Only attach audio for remote participants (not local)
    if (audioTrack && !participant.isMuted && participant.identity !== undefined) {
      audioTrack.attach(audioElement)
      return () => {
        audioTrack.detach(audioElement)
      }
    }
  }, [participant.audioTrack, participant.isMuted, participant.identity])

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
      {/* Hidden audio element for remote participants */}
      <audio ref={audioRef} autoPlay playsInline />

      {/* Video Element or Placeholder */}
      <div className="flex-1 w-full flex items-center justify-center text-white/40 relative">
        {participant.isCameraOff ? (
          <div className="flex flex-col items-center justify-center gap-2">
            {participant.avatar ? (
              <img 
                src={participant.avatar} 
                alt={participant.name}
                className="w-16 h-16 rounded-full object-cover"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-purple-500/30 flex items-center justify-center">
                <span className="text-2xl text-white">
                  {participant.name.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            <div className="text-lg">{participant.name}</div>
          </div>
        ) : (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted // Local video should be muted to prevent feedback
            className="w-full h-full object-cover rounded-xl"
          />
        )}
      </div>

      {/* Bottom status bar */}
      <div className="absolute bottom-0 left-0 right-0 p-2 bg-black/40 backdrop-blur-xl flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="text-sm font-medium truncate max-w-[150px]">{participant.name}</div>
          {participant.isMuted && (
            <span className="text-red-400" title="Muted">🔇</span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {participant.role === 'host' && (
            <span className="px-2 py-1 text-xs bg-purple-500/40 border border-purple-500/60 rounded-lg">
              HOST
            </span>
          )}
          {participant.role === 'cohost' && (
            <span className="px-2 py-1 text-xs bg-blue-500/40 border border-blue-500/60 rounded-lg">
              CO-HOST
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

