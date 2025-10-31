'use client'

import { useState, useRef, useEffect } from 'react'

interface User {
  id: string
  username: string
  display_name?: string
  age: number
  photo?: string
  photos?: string[]
  distance?: string
  isOnline: boolean
  bio?: string
  position?: string
  party_friendly?: boolean
  dtfn?: boolean
  latitude?: number
  longitude?: number
  eta?: string
  tags?: string[]
  kinks?: string[]
}

interface ScrollableProfileCardProps {
  user: User
  onUserClick?: (userId: string) => void
  onMessage?: (userId: string) => void
  onFavorite?: (userId: string) => void
  isFavorited?: boolean
  variant?: 'map' | 'grid'
}

export default function ScrollableProfileCard({ 
  user, 
  onUserClick, 
  onMessage, 
  onFavorite, 
  isFavorited = false,
  variant = 'grid'
}: ScrollableProfileCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [scrollPosition, setScrollPosition] = useState(0)
  const scrollRef = useRef<HTMLDivElement>(null)

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.target as HTMLDivElement
    const scrollTop = target.scrollTop
    const scrollHeight = target.scrollHeight - target.clientHeight
    const scrollPercent = (scrollTop / scrollHeight) * 100
    
    setScrollPosition(scrollPercent)
    
    // Auto-expand when scrolled down enough
    if (scrollPercent > 20 && !isExpanded) {
      setIsExpanded(true)
    }
  }

  const handleCardClick = () => {
    if (onUserClick) {
      onUserClick(user.id)
    }
  }

  const handleMessageClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (onMessage) {
      onMessage(user.id)
    }
  }

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (onFavorite) {
      onFavorite(user.id)
    }
  }

  const cardClasses = variant === 'map' 
    ? 'w-80 h-96' 
    : 'w-full aspect-square'

  return (
    <div 
      className={`glass-bubble rounded-xl overflow-hidden cursor-pointer transition-all duration-300 hover:scale-105 ${cardClasses}`}
      onClick={handleCardClick}
    >
      {/* Main Photo */}
      <div className="relative h-full overflow-hidden">
        <img
          src={user.photo || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400'}
          alt={user.display_name || user.username}
          className="w-full h-full object-cover"
        />
        
        {/* Top Status Bar */}
        <div className="absolute top-0 left-0 right-0 p-1.5 bg-gradient-to-b from-black/70 to-transparent">
          <div className="flex items-center justify-between">
            {/* Online indicator */}
            <div className="flex items-center gap-1">
              <div className={`w-2 h-2 rounded-full ${user.isOnline ? 'bg-green-500' : 'bg-gray-500'}`}></div>
              {user.party_friendly && <span className="text-sm">🥳</span>}
              {user.dtfn && <span className="text-sm">⚡</span>}
            </div>
            {/* Favorite */}
            <button
              onClick={handleFavoriteClick}
              className="text-white text-sm"
            >
              {isFavorited ? '✨' : '☆'}
            </button>
          </div>
        </div>

        {/* Bottom Info Overlay - Grindr style */}
        <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/90 via-black/60 to-transparent">
          <div className="flex items-end justify-between">
            <div className="flex-1 min-w-0">
              <h3 className="text-white text-sm font-bold truncate">
                {user.display_name || user.username}
              </h3>
              <div className="flex items-center gap-1 text-xs text-white/80">
                <span>{user.age}</span>
                {user.position && (
                  <>
                    <span>•</span>
                    <span className="truncate">{user.position}</span>
                  </>
                )}
              </div>
              {user.distance && (
                <div className="text-xs text-white/60">{user.distance}</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
