'use client'

import { useEffect, useState } from 'react'
import { Room } from 'livekit-client'
import { useLiveKitRoom } from '@/hooks/useLiveKitRoom'
import { useLiveKitStore } from '@/stores/useLiveKitStore'

import GridLayout from './GridLayout'
import ParticipantTile from './ParticipantTile'
import FloatingControls from './FloatingControls'
import HostPanel from './HostPanel'
import WaitingRoomModal from './WaitingRoomModal'
import ParticipantsDrawer from './ParticipantsDrawer'
import ChatSidebar from './ChatSidebar'
import CameraRequestBanner from './conference/CameraRequestBanner'

export default function ConferenceRoom({ room }: { room: Room }) {
  const {
    participants,
    spotlight,
    hardHostMode,
    waitingRoom
  } = useLiveKitStore()

  const [showControls, setShowControls] = useState(true)
  const [showParticipants, setShowParticipants] = useState(false)
  const [showChat, setShowChat] = useState(false)

  useLiveKitRoom(room)

  // Auto-hide floating controls
  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>

    const handleMove = () => {
      setShowControls(true)
      clearTimeout(timeout)
      timeout = setTimeout(() => setShowControls(false), 2500)
    }

    window.addEventListener('mousemove', handleMove)
    return () => window.removeEventListener('mousemove', handleMove)
  }, [])

  const participantList = Object.values(participants)
  const spotlightParticipant = spotlight.participantId ? participants[spotlight.participantId] : null

  return (
    <div className="relative w-full h-full bg-black text-white overflow-hidden">

      {/* Room Header - shows room name and participant count */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[20] px-6 py-2 bg-black/40 backdrop-blur-xl border border-white/10 rounded-full">
        <div className="flex items-center gap-3">
          <span className="text-lime-400 font-semibold">{room.name || 'Video Room'}</span>
          <span className="text-white/60 text-sm">•</span>
          <span className="text-white/60 text-sm">{participantList.length} {participantList.length === 1 ? 'person' : 'people'}</span>
        </div>
      </div>

      {/* Spotlight mode */}
      {spotlightParticipant && (
        <div className="absolute inset-0 z-[5] flex items-center justify-center bg-black/60 backdrop-blur-md">
          <ParticipantTile
            participant={spotlightParticipant}
            isSpotlight
          />
        </div>
      )}

      {/* Grid (if no spotlight) */}
      {!spotlight.participantId && (
        <GridLayout participants={participantList} />
      )}

      {/* Floating Controls */}
      <div className={`absolute bottom-6 w-full flex justify-center z-[30] transition-all duration-300
        ${showControls ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}
      `}>
        <FloatingControls 
          room={room}
          onToggleParticipants={() => setShowParticipants(!showParticipants)}
          onToggleChat={() => setShowChat(!showChat)}
        />
      </div>

      {/* Participants Drawer */}
      <ParticipantsDrawer
        room={room}
        open={showParticipants}
        onClose={() => setShowParticipants(false)}
      />

      {/* Chat Sidebar */}
      <ChatSidebar
        room={room}
        open={showChat}
        onClose={() => setShowChat(false)}
      />

      {/* Host Panel */}
      <HostPanel room={room} />

      {/* Waiting Room */}
      {waitingRoom.length > 0 && (
        <WaitingRoomModal room={room} />
      )}

      {/* Hard Host Mode background indicator */}
      {hardHostMode && (
        <div className="absolute top-4 left-4 px-4 py-2 bg-purple-500/20 border border-purple-500/40 rounded-xl text-xs">
          HARD HOST MODE ENABLED
        </div>
      )}

      {/* Camera Request Banner */}
      <CameraRequestBanner room={room} />

    </div>
  )
}

