'use client'

import Image from 'next/image'
import { DEFAULT_PROFILE_IMAGE } from '@/lib/utils/profile'

type GridUser = {
  id: string
  display_name?: string
  username?: string
  age?: number
  photo?: string | null
  distance?: string
  isOnline?: boolean
  dtfn?: boolean
  party_friendly?: boolean
  tags?: string[]
}

interface GridCardProps {
  user: GridUser
  onOpen: (user: GridUser) => void
  onToggleFavorite?: (userId: string) => void
  onQuickMessage?: (userId: string) => void
  isFavorited?: boolean
}

const statusChip = (label: string, variant: 'dtfn' | 'party' | 'tag' | 'self') => {
  switch (variant) {
    case 'dtfn':
      return 'bg-gradient-to-r from-fuchsia-500/30 to-purple-500/40 text-fuchsia-100'
    case 'party':
      return 'bg-gradient-to-r from-cyan-500/25 to-blue-500/35 text-cyan-100'
    case 'self':
      return 'bg-white/20 text-white'
    default:
      return 'bg-white/10 text-white/70'
  }
}

export default function GridCard({
  user,
  onOpen,
  onToggleFavorite,
  onQuickMessage,
  isFavorited = false,
}: GridCardProps) {
  const displayName = user.display_name || user.username || 'Member'
  const photoSrc = user.photo || DEFAULT_PROFILE_IMAGE
  const distance = user.distance && user.distance !== '' ? user.distance : undefined

  return (
    <button
      type="button"
      onClick={() => onOpen(user)}
      className="group relative w-full overflow-hidden rounded-[28px] bg-gradient-to-b from-white/5 to-white/[0.02] p-[2px] transition-transform duration-200 hover:-translate-y-1 hover:shadow-[0_20px_40px_rgba(9,12,24,0.45)]"
    >
      <div className="relative h-full w-full overflow-hidden rounded-[26px] bg-black">
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-white/5 opacity-0 transition-opacity duration-200 group-hover:opacity-30" />

        <div className="relative aspect-[3/4] w-full overflow-hidden">
          <Image
            src={photoSrc}
            alt={displayName}
            fill
            className="object-cover"
            sizes="(min-width: 768px) 25vw, 50vw"
            priority={false}
          />

          {user.isOnline && (
            <span className="absolute left-3 top-3 flex items-center gap-1 rounded-full bg-emerald-500/90 px-3 py-1 text-xs font-semibold text-white shadow-lg">
              <span className="h-2 w-2 animate-pulse rounded-full bg-white" />
              Online
            </span>
          )}

          {user.dtfn && (
            <span className="absolute right-3 top-3 rounded-full bg-gradient-to-r from-fuchsia-500 to-purple-500 px-3 py-1 text-xs font-semibold text-white shadow-lg">
              DTFN
            </span>
          )}

          <div className="absolute inset-x-0 bottom-0 flex flex-col gap-2 bg-gradient-to-t from-black via-black/60 to-transparent px-4 pb-4 pt-16">
            <div className="flex items-center justify-between">
              <div className="flex flex-col text-left">
                <span className="text-lg font-semibold text-white leading-snug">
                  {displayName}
                </span>
                {distance && (
                  <span className="text-xs uppercase tracking-[0.3em] text-white/70">
                    {distance}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {onQuickMessage && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      onQuickMessage(user.id)
                    }}
                    className="rounded-full bg-white/15 p-2 text-sm text-white shadow hover:bg-white/25"
                  >
                    🗨️
                  </button>
                )}
                {onToggleFavorite && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      onToggleFavorite(user.id)
                    }}
                    className={`rounded-full p-2 text-sm text-white shadow transition-colors ${
                      isFavorited ? 'bg-yellow-400/80 text-black' : 'bg-white/15 hover:bg-white/25'
                    }`}
                  >
                    {isFavorited ? '★' : '☆'}
                  </button>
                )}
              </div>
            </div>

            <div className="flex flex-wrap gap-2 text-[11px] font-semibold uppercase tracking-[0.18em]">
              {user.id === 'SELF' && (
                <span className={`px-3 py-1 rounded-full ${statusChip('You', 'self')}`}>You</span>
              )}
              {user.party_friendly && (
                <span className={`px-3 py-1 rounded-full ${statusChip('Party Friendly', 'party')}`}>
                  Party
                </span>
              )}
              {user.dtfn && (
                <span className={`px-3 py-1 rounded-full ${statusChip('Ready', 'dtfn')}`}>
                  Ready Now
                </span>
              )}
              {user.tags?.slice(0, 2).map((tag) => (
                <span key={tag} className={`px-3 py-1 rounded-full ${statusChip(tag, 'tag')}`}>
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </button>
  )
}
