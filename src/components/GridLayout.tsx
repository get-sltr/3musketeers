import ParticipantTile from './ParticipantTile'
import type { ParticipantState } from '@/types/livekit'

interface GridLayoutProps {
  participants: ParticipantState[]
}

export default function GridLayout({ participants }: GridLayoutProps) {
  const count = participants.length

  const gridCols =
    count <= 1 ? 'grid-cols-1' :
    count <= 4 ? 'grid-cols-2' :
    count <= 9 ? 'grid-cols-3' :
    count <= 16 ? 'grid-cols-4' :
    'grid-cols-5'

  return (
    <div className={`w-full h-full grid ${gridCols} gap-3 p-4`}>
      {participants.map((p) => (
        <ParticipantTile key={p.sid} participant={p} />
      ))}
    </div>
  )
}

