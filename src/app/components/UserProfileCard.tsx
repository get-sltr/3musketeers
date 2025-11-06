'use client'

import { useState } from 'react'

interface UserProfile {
  id: string
  display_name: string
  age?: number
  photos?: string[]
  bio?: string
  kinks?: string[]
  tags?: string[]
  position?: string
  height?: string
  body_type?: string
  ethnicity?: string
  online?: boolean
  distance?: string
}

interface UserProfileCardProps {
  user: UserProfile | null
  isOpen: boolean
  onClose: () => void
  onMessage?: (userId: string) => void
  onBlock?: (userId: string) => void
  onReport?: (userId: string) => void
  onFavorite?: (userId: string) => void
  isFavorited?: boolean
}

export default function UserProfileCard({ 
  user, 
  isOpen, 
  onClose, 
  onMessage,
  onBlock,
  onReport,
  onFavorite,
  isFavorited = false
}: UserProfileCardProps) {
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0)

  if (!isOpen || !user) return null

  const hasPhotos = Array.isArray(user.photos) && user.photos.length > 0
  const photos = hasPhotos
    ? user.photos!
    : ['data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23222" width="100" height="100"/%3E%3Ctext fill="%23aaa" x="50%" y="50%" dominant-baseline="middle" text-anchor="middle"%3E?%3C/text%3E%3C/svg%3E']

  return (
    <div 
      className="fixed inset-0 z-50 bg-black"
      onClick={onClose}
    >
      {/* Full-screen photo gallery */}
      <div className="relative w-full h-full">
        {/* Current Photo */}
        <img
          src={photos[currentPhotoIndex]}
          alt={user.display_name}
          className="w-full h-full object-contain"
        />

        {/* Top Right Actions */}
        <div className="absolute top-6 right-6 z-20 flex items-center gap-2">
          {/* Favorite */}
          {onFavorite && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onFavorite(user.id)
              }}
              className="w-12 h-12 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center hover:bg-black/70 transition-all text-2xl"
            >
              {isFavorited ? '✨' : '☆'}
            </button>
          )}
          
          {/* Close button */}
          <button
            onClick={onClose}
            className="w-12 h-12 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center hover:bg-black/70 transition-all"
          >
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Bottom Right Actions - Block & Report */}
        {(onBlock || onReport) && (
          <div className="absolute bottom-6 right-6 z-20 flex items-center gap-2">
            {onReport && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onReport(user.id)
                }}
                className="px-4 py-2 rounded-full bg-black/50 backdrop-blur-md text-white text-sm font-semibold hover:bg-red-500/30 hover:text-red-400 transition-all"
              >
                ⚠️ Report
              </button>
            )}
            {onBlock && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onBlock(user.id)
                }}
                className="px-4 py-2 rounded-full bg-black/50 backdrop-blur-md text-white text-sm font-semibold hover:bg-red-500/30 hover:text-red-400 transition-all"
              >
                🚫 Block
              </button>
            )}
          </div>
        )}

        {/* Top Overlay - Name, Age, Stats */}
        <div className="absolute top-0 left-0 right-0 p-6 bg-gradient-to-b from-black/80 via-black/50 to-transparent">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-3xl font-bold text-white mb-1">
                {user.display_name}
                {user.age && <span className="text-2xl font-bold text-cyan-400 ml-2">{user.age}</span>}
              </h2>
              
              {/* Stats - bold and bright */}
              <div className="flex items-center gap-3 mt-2">
                {user.online && (
                  <span className="px-3 py-1 bg-green-500/90 rounded-full text-white text-sm font-bold">
                    ● Online
                  </span>
                )}
                {user.position && (
                  <span className="text-white font-bold text-lg">{user.position}</span>
                )}
                {user.height && (
                  <span className="text-white/90 font-semibold">{user.height}</span>
                )}
                {user.distance && (
                  <span className="text-cyan-400 font-bold">{user.distance}</span>
                )}
              </div>
            </div>

            {/* Small Chat/Mail Emoji Button - like grid */}
            {onMessage && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onMessage(user.id)
                }}
                className="w-12 h-12 rounded-full bg-cyan-500/80 backdrop-blur-md flex items-center justify-center hover:bg-cyan-500 transition-all shadow-lg text-2xl"
              >
                💬
              </button>
            )}
          </div>
        </div>

        {/* Bottom Overlay - All Info (simplified) */}
        <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/95 via-black/70 to-transparent max-h-[50vh] overflow-y-auto custom-scrollbar">
          {/* Stats Row - Compact */}
          {(user.position || user.height || user.body_type || user.ethnicity) && (
            <div className="flex flex-wrap gap-2 mb-4">
              {user.position && (
                <span className="px-3 py-1.5 bg-white/20 backdrop-blur-sm rounded-full text-white text-sm font-semibold">
                  {user.position}
                </span>
              )}
              {user.height && (
                <span className="px-3 py-1.5 bg-white/20 backdrop-blur-sm rounded-full text-white text-sm font-semibold">
                  {user.height}
                </span>
              )}
              {user.body_type && (
                <span className="px-3 py-1.5 bg-white/20 backdrop-blur-sm rounded-full text-white text-sm font-semibold">
                  {user.body_type}
                </span>
              )}
              {user.ethnicity && (
                <span className="px-3 py-1.5 bg-white/20 backdrop-blur-sm rounded-full text-white text-sm font-semibold">
                  {user.ethnicity}
                </span>
              )}
            </div>
          )}

          {/* Bio */}
          {user.bio && (
            <div className="mb-4">
              <p className="text-white/90 leading-relaxed text-sm font-medium">{user.bio}</p>
            </div>
          )}

          {/* Kinks */}
          {user.kinks && user.kinks.length > 0 && (
            <div className="mb-3">
              <p className="text-white/80 text-xs font-semibold mb-2">INTO</p>
              <div className="flex flex-wrap gap-2">
                {user.kinks.map((kink, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1.5 bg-cyan-500/30 border border-cyan-400/50 rounded-full text-cyan-300 text-sm font-bold backdrop-blur-sm"
                  >
                    {kink}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Tags */}
          {user.tags && user.tags.length > 0 && (
            <div>
              <p className="text-white/80 text-xs font-semibold mb-2">TAGS</p>
              <div className="flex flex-wrap gap-2">
                {user.tags.map((tag, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1.5 bg-white/20 border border-white/30 rounded-full text-white text-sm font-semibold backdrop-blur-sm"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Photo Navigation */}
        {photos.length > 1 && (
          <>
            {/* Previous Photo */}
            <button
              onClick={(e) => {
                e.stopPropagation()
                setCurrentPhotoIndex((currentPhotoIndex - 1 + photos.length) % photos.length)
              }}
              className="absolute left-4 top-1/2 -translate-y-1/2 z-10 w-12 h-12 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center hover:bg-black/70 transition-all"
            >
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            {/* Next Photo */}
            <button
              onClick={(e) => {
                e.stopPropagation()
                setCurrentPhotoIndex((currentPhotoIndex + 1) % photos.length)
              }}
              className="absolute right-4 top-1/2 -translate-y-1/2 z-10 w-12 h-12 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center hover:bg-black/70 transition-all"
            >
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>

            {/* Photo Dots Indicator */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 flex gap-2">
              {photos.map((_, idx) => (
                <button
                  key={idx}
                  onClick={(e) => {
                    e.stopPropagation()
                    setCurrentPhotoIndex(idx)
                  }}
                  className={`transition-all ${
                    idx === currentPhotoIndex 
                      ? 'w-8 h-2 bg-cyan-400 rounded-full' 
                      : 'w-2 h-2 bg-white/50 rounded-full hover:bg-white/70'
                  }`}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
