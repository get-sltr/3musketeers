import { motion } from 'framer-motion'
import type { ParticipantState } from '@/types/livekit'

interface ParticipantTileProps {
  participant: ParticipantState
  isSpotlight?: boolean
}

export default function ParticipantTile({ participant, isSpotlight = false }: ParticipantTileProps) {
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

      {/* Video Placeholder */}
      <div className="flex-1 w-full flex items-center justify-center text-white/40">
        {participant.isCameraOff ? (
          <div className="text-lg">{participant.name}</div>
        ) : (
          <div className="text-xs italic text-purple-300/40">[ Video Stream Here ]</div>
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

