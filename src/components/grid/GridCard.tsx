'use client'

import { memo, useState } from 'react'
import Image from 'next/image'

// --- Import Shared Types & Utils ---
import { UserGridProfile } from '@/lib/types/profile'
import { DEFAULT_PROFILE_IMAGE, resolveProfilePhoto, formatDistance } from '@/lib/utils/profile'

// --- Import Reusable Components ---
import StatusChip from '@/components/ui/StatusChip' // Assuming you created this

// --- Import SVG Icons ---
import { ChatBubbleLeftIcon, StarIcon } from '@heroicons/react/24/outline'
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid'

interface GridCardProps {
  user: UserGridProfile // Use shared type
  onOpen: (user: UserGridProfile) => void
  onToggleFavorite?: (userId: string) => void
  onQuickMessage?: (userId: string) => void
  isFavorited?: boolean
  priority?: boolean // For LCP optimization
}

// Wrap component in memo for massive performance gains
export default memo(function GridCard({
  user,
  onOpen,
  onToggleFavorite,
  onQuickMessage,
  isFavorited = false,
  priority = false, // Default to false
}: GridCardProps) {
  const displayName = user.display_name || user.username || 'Member'
  
  // State for handling broken image links
  const [imgSrc, setImgSrc] = useState(resolveProfilePhoto(user.photo_url, user.photos) || DEFAULT_PROFILE_IMAGE)
  
  const distance = formatDistance(user.distance_miles)

  return (
    <button
      type="button"
      onClick={() => onOpen(user)}
      className="group relative w-full overflow-hidden rounded-[28px] bg-gradient-to-b from-white/5 to-white/[0.02] p-[2px] transition-transform duration-200 hover:-translate-y-1 active:scale-95 hover:shadow-[0_20px_40px_rgba(9,12,24,0.45)]"
    >
      <div className="relative h-full w-full overflow-hidden rounded-[26px] bg-black">
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-white/5 opacity-0 transition-opacity duration-200 group-hover:opacity-30" />

        <div className="relative aspect-[3/4] w-full overflow-hidden">
          <Image
            src={imgSrc}
            alt={displayName}
            fill
            className="object-cover"
            sizes="(min-width: 768px) 25vw, 50vw"
            priority={priority} // Use priority prop
            onError={() => {
              // Fallback to default if image link is broken
              setImgSrc(DEFAULT_PROFILE_IMAGE)
            }}
          />

          {user.is_online && (
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
                    aria-label={`Send message to ${displayName}`}
                  >
                    {/* Use SVG Icon */}
                    <ChatBubbleLeftIcon className="h-5 w-5" aria-hidden="true" />
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
                    aria-label={isFavorited ? `Remove ${displayName} from favorites` : `Add ${displayName} to favorites`}
                  >
                    {/* Use SVG Icons */}
                    {isFavorited ? (
                      <StarIconSolid className="h-5 w-5" aria-hidden="true" />
                    ) : (
                      <StarIcon className="h-5 w-5" aria-hidden="true" />
                    )}
                  </button>
                )}
              </div>
            </div>

            {/* Use StatusChip Component */}
            <div className="flex flex-wrap gap-2">
              {user.id === 'SELF' && ( // Assuming you might pass the current user's ID
                <StatusChip variant="self" label="You" />
              )}
              {user.party_friendly && (
                <StatusChip variant="party" label="Party" />
              )}
              {user.dtfn && (
                <StatusChip variant="dtfn" label="Ready Now" />
              )}
              {user.tags?.slice(0, 2).map((tag) => (
                <StatusChip key={tag} variant="tag" label={tag} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </button>
  )
})