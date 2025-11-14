'use client'

import { Room } from "livekit-client"

import { useLiveKitStore } from "@/stores/useLiveKitStore"

import { useHostTools } from "@/hooks/useHostTools"

export default function ParticipantsDrawer({
  room,
  open,
  onClose,
}: {
  room: Room | null
  open: boolean
  onClose: () => void
}) {
  const { participants } = useLiveKitStore()
  const { isHost, muteParticipant, disableCamera, requestCameraOn, spotlightParticipant, promote, demote, kickParticipant } =
    useHostTools(room)

  if (!open) return null

  return (
    <div className="
      absolute top-0 left-0 h-full w-72
      bg-black/70 backdrop-blur-2xl border-r border-white/10
      z-[35] flex flex-col
    ">
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
        <h2 className="text-sm font-semibold">Participants</h2>
        <button onClick={onClose} className="text-white/60 text-xs">Close</button>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2">
        {Object.values(participants).map((p) => (
          <div
            key={p.sid}
            className="flex items-center justify-between px-2 py-2 bg-white/5 rounded-xl"
          >
            <div>
              <div className="text-xs font-medium">{p.name}</div>
              <div className="text-[10px] text-white/50">
                {p.role === "host" ? "Host" : "Member"}
              </div>
            </div>

            {/* everyone sees status icons; only hosts see control buttons */}
            <div className="flex items-center gap-1 text-[10px]">
              {/* status icons */}
              <span>{p.isMuted ? "🔇" : "🎤"}</span>
              <span>{p.isCameraOff ? "📷🚫" : "📷"}</span>
              {p.isHandRaised && <span>✋</span>}

              {isHost && (
                <>
                  <button
                    onClick={() => muteParticipant(p.sid)}
                    className="px-1 py-0.5 bg-purple-600/40 rounded"
                  >
                    M
                  </button>
                  <button
                    onClick={() => disableCamera(p.sid)}
                    className="px-1 py-0.5 bg-purple-600/40 rounded"
                  >
                    C
                  </button>
                  <button
                    onClick={() => requestCameraOn(p.sid)}
                    className="px-1 py-0.5 bg-purple-400/40 rounded"
                  >
                    Cam?
                  </button>
                  <button
                    onClick={() => spotlightParticipant(p.sid)}
                    className="px-1 py-0.5 bg-purple-400/40 rounded"
                  >
                    ⭐
                  </button>
                  {p.role !== "host" ? (
                    <button
                      onClick={() => promote(p.sid)}
                      className="px-1 py-0.5 bg-purple-300/40 rounded"
                    >
                      H+
                    </button>
                  ) : (
                    <button
                      onClick={() => demote(p.sid)}
                      className="px-1 py-0.5 bg-purple-300/40 rounded"
                    >
                      H-
                    </button>
                  )}
                  <button
                    onClick={() => kickParticipant(p.sid)}
                    className="px-1 py-0.5 bg-red-600/60 rounded"
                  >
                    ❌
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

