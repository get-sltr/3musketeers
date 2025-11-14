import { useLiveKitStore } from '@/stores/useLiveKitStore'
import { useHostTools } from '@/hooks/useHostTools'
import type { Room } from 'livekit-client'

interface HostPanelProps {
  room: Room
}

export default function HostPanel({ room }: HostPanelProps) {
  const {
    participants,
    setSpotlight,
  } = useLiveKitStore()

  const {
    isHost,
    muteParticipant,
    disableCamera,
    stopScreenShare,
    kickParticipant,
    spotlightParticipant,
    promote,
    demote,
  } = useHostTools(room)

  if (!isHost || !room) return null

  return (
    <div className="
      absolute right-4 top-20 z-[40]
      w-72 h-[70vh]
      rounded-2xl bg-black/50 backdrop-blur-2xl border border-white/10
      p-4 overflow-auto
      shadow-[0_0_25px_rgba(180,99,255,0.35)]
    ">
      <h2 className="text-lg font-semibold mb-3">Host Controls</h2>

      {Object.values(participants).map((p) => (
        <div
          key={p.sid}
          className="flex items-center justify-between mb-3 p-2 bg-white/5 rounded-xl"
        >
          <div>
            <div className="font-medium">{p.name}</div>
            <div className="text-xs text-white/40">{p.role}</div>
          </div>

          <div className="flex gap-2 text-xs">

            <button
              onClick={() => muteParticipant(p.sid)}
              className="px-2 py-1 bg-purple-600/40 rounded-lg"
            >
              Mute
            </button>

            <button
              onClick={() => disableCamera(p.sid)}
              className="px-2 py-1 bg-purple-600/40 rounded-lg"
            >
              Cam Off
            </button>

            <button
              onClick={() => stopScreenShare(p.sid)}
              className="px-2 py-1 bg-purple-500/40 rounded-lg"
              title="Stop Screen Share"
            >
              🖥️
            </button>

            <button
              onClick={() => spotlightParticipant(p.sid)}
              className="px-2 py-1 bg-purple-400/40 rounded-lg"
            >
              ⭐
            </button>

            {p.role !== 'host' ? (
              <button
                onClick={() => promote(p.sid)}
                className="px-2 py-1 bg-purple-300/40 rounded-lg"
              >
                Promote
              </button>
            ) : (
              <button
                onClick={() => demote(p.sid)}
                className="px-2 py-1 bg-purple-300/40 rounded-lg"
              >
                Demote
              </button>
            )}

            <button
              onClick={() => kickParticipant(p.sid)}
              className="px-2 py-1 bg-red-600/60 rounded-lg"
            >
              ❌
            </button>

          </div>
        </div>
      ))}
    </div>
  )
}

