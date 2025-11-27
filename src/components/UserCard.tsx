'use client'

import { useState } from 'react'
import Image from 'next/image'

interface User {
  id: string
  username: string
  display_name?: string
  age: number
  photo?: string
  photos?: string[]
  distance: string
  isOnline: boolean
  bio?: string
  position?: string
  party_friendly?: boolean
  dtfn?: boolean
  latitude?: number
  longitude?: number
  eta?: string
  tags?: string[]
}

interface UserCardProps {
  user: User
  onClick?: (user: User) => void
  onMessage?: (userId: string) => void
  className?: string
}

export default function UserCard({ user, onClick, onMessage, className = '' }: UserCardProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [imageError, setImageError] = useState(false)

  const handleClick = () => {
    onClick?.(user)
  }

  const handleImageError = () => {
    setImageError(true)
  }

  return (
    <div
      className={`
        relative group cursor-pointer transition-all duration-300 ease-out
        ${isHovered ? 'scale-105' : 'scale-100'}
        ${className}
      `}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleClick}
    >
      {/* Glassmorphism Card */}
      <div className="
        relative overflow-hidden rounded-2xl
        bg-white/5 backdrop-blur-xl border border-white/10
        shadow-2xl hover:shadow-cyan-500/20
        transition-all duration-300
        group-hover:border-cyan-400/30
      ">
        {/* User Photo */}
        <div className="relative aspect-square overflow-hidden">
          {!imageError && user.photos?.[0] ? (
            <Image
              src={user.photos[0]}
              alt={`${user.display_name || user.username}`}
              fill
              sizes="(max-width: 768px) 50vw, 25vw"
              className="object-cover transition-transform duration-300 group-hover:scale-110"
              onError={() => handleImageError()}
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-cyan-500/20 to-pink-500/20 flex items-center justify-center">
              <div className="text-4xl">👤</div>
            </div>
          )}
          
          {/* Online Status Indicator */}
          {user.isOnline && (
            <div className="absolute top-3 left-3">
              <div className="relative">
                <div className="w-3 h-3 bg-green-400 rounded-full shadow-lg"></div>
                <div className="absolute inset-0 w-3 h-3 bg-green-400 rounded-full animate-ping opacity-75"></div>
              </div>
            </div>
          )}

          {/* Message Horn Button */}
          {onMessage && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onMessage(user.id)
              }}
              className="absolute top-3 right-3 z-10 text-3xl animate-pulse-glow"
              style={{ filter: 'drop-shadow(0 0 8px rgba(34, 211, 238, 0.8))' }}
            >
              🫧
            </button>
          )}

          {/* Status Badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-1">
            {user.party_friendly && (
              <div className="glass-badge party-badge">
                <span className="text-sm">🥳</span>
              </div>
            )}
            {user.dtfn && (
              <div className="glass-badge dtfn-badge">
                <span className="text-sm">⚡</span>
              </div>
            )}
          </div>

          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
        </div>

        {/* Card Content */}
        <div className="p-4 space-y-2">
          {/* Name and Age */}
          <div className="flex items-center justify-between">
            <h3 className="text-white font-bold text-lg truncate">
              {user.display_name || user.username}
            </h3>
            <span className="text-white/60 text-sm">
              {user.age}
            </span>
          </div>

          {/* Position */}
          {user.position && (
            <div className="text-cyan-300 text-sm font-medium">
              {user.position}
            </div>
          )}

          {/* Distance and ETA */}
          <div className="flex items-center justify-between text-sm">
            <div className="text-white/60">
              {user.distance || 'Nearby'}
            </div>
            {user.eta && (
              <div className="text-white/60">
                {user.eta}
              </div>
            )}
          </div>

          {/* Tags Preview */}
          {user.tags && user.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {user.tags.slice(0, 2).map((tag, index) => (
                <span
                  key={index}
                  className="px-2 py-1 text-xs bg-cyan-500/20 text-cyan-300 rounded-full border border-cyan-500/30"
                >
                  {tag}
                </span>
              ))}
              {user.tags.length > 2 && (
                <span className="px-2 py-1 text-xs bg-white/10 text-white/60 rounded-full">
                  +{user.tags.length - 2}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Hover Effect Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-cyan-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl"></div>
      </div>

      {/* Custom Styles */}
      <style jsx>{`
        @keyframes pulse-glow {
          0%, 100% {
            opacity: 1;
            filter: drop-shadow(0 0 8px rgba(34, 211, 238, 0.8)) brightness(1);
          }
          50% {
            opacity: 0.8;
            filter: drop-shadow(0 0 16px rgba(34, 211, 238, 1)) brightness(1.3);
          }
        }
        
        .animate-pulse-glow {
          animation: pulse-glow 2s ease-in-out infinite;
        }
        
        .glass-badge {
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 8px;
          padding: 4px 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        
        .party-badge {
          background: rgba(255, 107, 107, 0.2);
          border-color: rgba(255, 107, 107, 0.3);
        }
        
        .dtfn-badge {
          background: rgba(255, 217, 61, 0.2);
          border-color: rgba(255, 217, 61, 0.3);
        }
        
        .glass-badge:hover {
          transform: scale(1.1);
          transition: transform 0.2s ease;
        }
      `}</style>
    </div>
  )
}
