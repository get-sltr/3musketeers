'use client'

import { Room } from "livekit-client"

import { useLiveKitStore } from "@/stores/useLiveKitStore"

interface Props {
  room: Room
  onToggleParticipants: () => void
  onToggleChat: () => void
}

export default function FloatingControls({
  room,
  onToggleParticipants,
  onToggleChat,
}: Props) {
  const {
    micEnabled,
    cameraEnabled,
    isLocalScreenSharing,
    toggleMic,
    toggleCamera,
    setLocalScreenSharing,
    setScreenShareParticipant,
    hardHostMode,
    setHardHostMode,
  } = useLiveKitStore()

  const toggleScreenShare = async () => {
    const local = room.localParticipant
    const next = !isLocalScreenSharing

    try {
      if (next) {
        // Start screen share
        await local.setScreenShareEnabled(true)
        setLocalScreenSharing(true)
        setScreenShareParticipant(local.sid)
      } else {
        // Stop screen share
        await local.setScreenShareEnabled(false)
        setLocalScreenSharing(false)
        setScreenShareParticipant(null)
      }
    } catch (error) {
      console.error('Failed to toggle screen share:', error)
    }
  }

  const isHost = (() => {
    try {
      const meta = JSON.parse(room.localParticipant.metadata || "{}")
      return meta.role === "host"
    } catch {
      return false
    }
  })()

  return (
    <div className="
      flex items-center gap-4
      bg-black/30 backdrop-blur-2xl
      px-6 py-4 rounded-full border border-white/10
      shadow-[0_0_25px_rgba(180,99,255,0.25)]
      text-sm
    ">
      {/* Participants list */}
      <button
        onClick={onToggleParticipants}
        className="p-2 bg-white/10 rounded-full"
        title="Participants"
        aria-label="View participants"
      >
        👥
      </button>

      {/* Chat */}
      <button
        onClick={onToggleChat}
        className="p-2 bg-white/10 rounded-full"
        title="Chat"
        aria-label="Open chat"
      >
        💬
      </button>

      {/* MIC */}
      <button
        onClick={() => toggleMic()}
        className={`p-3 rounded-full transition
        ${micEnabled ? 'bg-purple-600/50' : 'bg-red-600/70'}`}
        aria-label={micEnabled ? 'Mute microphone' : 'Unmute microphone'}
      >
        🎤
      </button>

      {/* CAMERA */}
      <button
        onClick={() => toggleCamera()}
        className={`p-3 rounded-full transition
        ${cameraEnabled ? 'bg-purple-600/50' : 'bg-red-600/70'}`}
        aria-label={cameraEnabled ? 'Turn off camera' : 'Turn on camera'}
      >
        📷
      </button>

      {/* SCREEN SHARE */}
      <button
        onClick={toggleScreenShare}
        className={`p-3 rounded-full transition
        ${isLocalScreenSharing ? 'bg-purple-400/70' : 'bg-white/10'}`}
        title="Share screen"
        aria-label={isLocalScreenSharing ? 'Stop sharing screen' : 'Share screen'}
      >
        🖥
      </button>

      {/* LEAVE */}
      <button
        onClick={() => room.disconnect()}
        className="p-3 bg-red-600/80 rounded-full"
        aria-label="Leave call"
      >
        🔚
      </button>

      {/* HOST: HARD HOST MODE TOGGLE */}
      {isHost && (
        <button
          onClick={() => setHardHostMode(!hardHostMode)}
          className="p-3 bg-purple-300/20 border border-purple-400/40 rounded-full"
          title="Hard Host Mode"
          aria-label={hardHostMode ? 'Disable hard host mode' : 'Enable hard host mode'}
        >
          🛡
        </button>
      )}
    </div>
  )
}

