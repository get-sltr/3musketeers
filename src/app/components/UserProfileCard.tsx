'use client'

import { useState } from 'react'

interface UserProfile {
  id: string
  display_name: string
  age?: number
  photos: string[]
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
}

export default function UserProfileCard({ user, isOpen, onClose, onMessage }: UserProfileCardProps) {
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0)

  if (!isOpen || !user) return null

  const photos = user.photos?.length > 0 ? user.photos : ['https://via.placeholder.com/400x500']

  return (
    <div 
      className="fixed inset-0 z-50 flex items-end md:items-center justify-center md:p-4"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
      
      {/* Modal */}
      <div 
        className="relative w-full md:max-w-md bg-black/95 backdrop-blur-xl border-t md:border border-cyan-500/30 md:rounded-2xl overflow-hidden max-h-[85vh] md:max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center hover:bg-black/80 transition-all"
        >
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Scrollable content */}
        <div className="overflow-y-auto flex-1 custom-scrollbar">
          {/* Photo Gallery */}
          <div className="relative h-[400px] bg-black">
            <img
              src={photos[currentPhotoIndex]}
              alt={user.display_name}
              className="w-full h-full object-cover"
            />
            
            {/* Online indicator */}
            {user.online && (
              <div className="absolute top-4 left-4 px-3 py-1 bg-green-500/90 backdrop-blur-sm rounded-full text-white text-sm font-semibold">
                Online
              </div>
            )}

            {/* Photo nav */}
            {photos.length > 1 && (
              <>
                <button
                  onClick={() => setCurrentPhotoIndex((currentPhotoIndex - 1 + photos.length) % photos.length)}
                  className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center hover:bg-black/80 transition-all"
                >
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button
                  onClick={() => setCurrentPhotoIndex((currentPhotoIndex + 1) % photos.length)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center hover:bg-black/80 transition-all"
                >
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
                
                {/* Photo dots */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                  {photos.map((_, idx) => (
                    <div
                      key={idx}
                      className={`w-2 h-2 rounded-full transition-all ${
                        idx === currentPhotoIndex ? 'bg-cyan-400 w-6' : 'bg-white/40'
                      }`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Profile info */}
          <div className="p-6 space-y-6">
            {/* Name and age */}
            <div>
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                {user.display_name}
                {user.age && <span className="text-white/60 text-xl">{user.age}</span>}
              </h2>
              {user.distance && (
                <p className="text-cyan-400 text-sm mt-1">{user.distance} away</p>
              )}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-3">
              {user.position && (
                <div className="glass-bubble p-3">
                  <p className="text-white/60 text-xs">Position</p>
                  <p className="text-white font-semibold">{user.position}</p>
                </div>
              )}
              {user.height && (
                <div className="glass-bubble p-3">
                  <p className="text-white/60 text-xs">Height</p>
                  <p className="text-white font-semibold">{user.height}</p>
                </div>
              )}
              {user.body_type && (
                <div className="glass-bubble p-3">
                  <p className="text-white/60 text-xs">Body Type</p>
                  <p className="text-white font-semibold">{user.body_type}</p>
                </div>
              )}
              {user.ethnicity && (
                <div className="glass-bubble p-3">
                  <p className="text-white/60 text-xs">Ethnicity</p>
                  <p className="text-white font-semibold">{user.ethnicity}</p>
                </div>
              )}
            </div>

            {/* Bio */}
            {user.bio && (
              <div>
                <h3 className="text-white/80 text-sm font-semibold mb-2">About</h3>
                <p className="text-white/70 leading-relaxed">{user.bio}</p>
              </div>
            )}

            {/* Kinks */}
            {user.kinks && user.kinks.length > 0 && (
              <div>
                <h3 className="text-white/80 text-sm font-semibold mb-2">Into</h3>
                <div className="flex flex-wrap gap-2">
                  {user.kinks.map((kink, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 bg-cyan-500/20 border border-cyan-500/30 rounded-full text-cyan-400 text-sm"
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
                <h3 className="text-white/80 text-sm font-semibold mb-2">Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {user.tags.map((tag, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 bg-white/10 border border-white/20 rounded-full text-white/70 text-sm"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Message button */}
            {onMessage && (
              <button
                onClick={() => onMessage(user.id)}
                className="w-full py-4 bg-gradient-to-r from-cyan-500 to-magenta-500 rounded-2xl text-white font-bold text-lg hover:scale-[1.02] transition-all shadow-[0_0_30px_rgba(0,212,255,0.3)]"
              >
                Send Message
              </button>
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(0, 212, 255, 0.3);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(0, 212, 255, 0.5);
        }
      `}</style>
    </div>
  )
}
