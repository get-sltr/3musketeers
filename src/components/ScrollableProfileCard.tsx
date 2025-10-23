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
    : 'w-full h-80'

  return (
    <div 
      className={`glass-bubble rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 hover:scale-105 ${cardClasses}`}
      onClick={handleCardClick}
    >
      {/* Main Photo */}
      <div className="relative h-48 overflow-hidden">
        <img
          src={user.photo || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400'}
          alt={user.display_name || user.username}
          className="w-full h-full object-cover"
        />
        
        {/* Status Indicators */}
        <div className="absolute top-3 left-3 flex gap-2">
          <div className={`w-3 h-3 rounded-full ${user.isOnline ? 'bg-green-500' : 'bg-gray-500'}`}></div>
          {user.party_friendly && <span className="text-2xl">🥳</span>}
          {user.dtfn && <span className="text-2xl">⚡</span>}
        </div>

        {/* Favorite Button */}
        <button
          onClick={handleFavoriteClick}
          className="absolute top-3 right-3 w-8 h-8 bg-black/50 rounded-full flex items-center justify-center hover:bg-black/70 transition-all duration-300"
        >
          <span className="text-white text-lg">
            {isFavorited ? '✨' : '☆'}
          </span>
        </button>

        {/* Distance & ETA */}
        <div className="absolute bottom-3 left-3 glass-bubble px-3 py-1">
          <div className="text-white text-sm font-semibold">
            {user.distance || '0.5 mi'}
          </div>
          <div className="text-white/80 text-xs">
            {user.eta || '5 min'}
          </div>
        </div>
      </div>

      {/* Scrollable Content */}
      <div 
        ref={scrollRef}
        className="p-4 max-h-48 overflow-y-auto scrollbar-hide"
        onScroll={handleScroll}
      >
        {/* Basic Info */}
        <div className="mb-3">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-xl font-bold text-white">
              {user.display_name || user.username}
            </h3>
            <span className="text-white/60 text-sm">{user.age}</span>
          </div>
          
          {user.position && (
            <p className="text-white/80 text-sm mb-2">{user.position}</p>
          )}
        </div>

        {/* Bio */}
        {user.bio && (
          <div className="mb-3">
            <p className="text-white/90 text-sm leading-relaxed">{user.bio}</p>
          </div>
        )}

        {/* Tags */}
        {user.tags && user.tags.length > 0 && (
          <div className="mb-3">
            <div className="flex flex-wrap gap-1">
              {user.tags.slice(0, 4).map((tag, index) => (
                <span 
                  key={index}
                  className="px-2 py-1 bg-purple-500/20 text-purple-300 rounded-full text-xs"
                >
                  {tag}
                </span>
              ))}
              {user.tags.length > 4 && (
                <span className="text-white/60 text-xs">+{user.tags.length - 4} more</span>
              )}
            </div>
          </div>
        )}

        {/* Kinks */}
        {user.kinks && user.kinks.length > 0 && (
          <div className="mb-3">
            <div className="flex flex-wrap gap-1">
              {user.kinks.slice(0, 3).map((kink, index) => (
                <span 
                  key={index}
                  className="px-2 py-1 bg-cyan-500/20 text-cyan-300 rounded-full text-xs"
                >
                  {kink}
                </span>
              ))}
              {user.kinks.length > 3 && (
                <span className="text-white/60 text-xs">+{user.kinks.length - 3} more</span>
              )}
            </div>
          </div>
        )}

        {/* Scroll Indicator */}
        {scrollPosition < 80 && (
          <div className="text-center">
            <div className="text-white/40 text-xs mb-2">Scroll for more info</div>
            <div className="w-full bg-white/20 rounded-full h-1">
              <div 
                className="bg-gradient-to-r from-cyan-500 to-purple-500 h-1 rounded-full transition-all duration-300"
                style={{ width: `${scrollPosition}%` }}
              ></div>
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="p-4 border-t border-white/10">
        <div className="flex gap-2">
          <button
            onClick={handleMessageClick}
            className="flex-1 px-4 py-2 bg-gradient-to-r from-cyan-500 to-purple-500 text-white rounded-xl font-semibold hover:scale-105 transition-all duration-300"
          >
            💬 Message
          </button>
          <button
            onClick={handleFavoriteClick}
            className="px-4 py-2 glass-bubble hover:bg-white/10 transition-all duration-300"
          >
            <span className="text-white text-lg">
              {isFavorited ? '✨' : '☆'}
            </span>
          </button>
        </div>
      </div>

      {/* Custom Scrollbar Styles */}
      <style jsx>{`
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  )
}
