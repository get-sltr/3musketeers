import { useLiveKitStore } from '@/stores/useLiveKitStore'
import { useHostTools } from '@/hooks/useHostTools'
import type { Room } from 'livekit-client'

interface WaitingRoomModalProps {
  room: Room
}

export default function WaitingRoomModal({ room }: WaitingRoomModalProps) {
  const { waitingRoom, removeFromWaitingRoom } = useLiveKitStore()
  const { isHost } = useHostTools(room)

  if (!isHost) return null

  return (
    <div className="
      fixed inset-0 z-[50]
      bg-black/60 backdrop-blur-xl
      flex items-center justify-center
    ">
      <div className="
        w-96 p-6 rounded-2xl bg-black/50 border border-purple-400/30
        shadow-[0_0_30px_rgba(180,99,255,0.45)]
      ">
        <h2 className="text-xl mb-4">Waiting Room</h2>

        {waitingRoom.map((u) => (
          <div
            key={u.userId}
            className="flex items-center justify-between mb-3 p-2 bg-white/5 rounded-xl"
          >
            <div>
              <div className="font-medium">{u.name}</div>
              <div className="text-xs text-white/40">{u.userId}</div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  // TODO: Implement approve logic (e.g., grant room access)
                  removeFromWaitingRoom(u.userId)
                }}
                className="px-3 py-1 bg-purple-500/40 rounded-lg"
              >
                Admit
              </button>

              <button
                onClick={() => removeFromWaitingRoom(u.userId)}
                className="px-3 py-1 bg-red-600/60 rounded-lg"
              >
                Deny
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

