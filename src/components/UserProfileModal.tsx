'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface User {
  id: string
  username: string
  age: number
  photos: string[]
  bio?: string
  distance?: string
  isOnline: boolean
}

interface UserProfileModalProps {
  user: User | null
  isOpen: boolean
  onClose: () => void
  onMessage: (userId: string) => void
  onBlock?: (userId: string) => void
  onReport?: (userId: string) => void
}

export default function UserProfileModal({
  user,
  isOpen,
  onClose,
  onMessage,
  onBlock,
  onReport
}: UserProfileModalProps) {
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0)
  const router = useRouter()

  if (!isOpen || !user) return null

  const handleMessage = () => {
    onMessage(user.id)
    onClose()
    router.push(`/messages/${user.id}`)
  }

  const handleBlock = () => {
    onBlock?.(user.id)
    onClose()
  }

  const handleReport = () => {
    onReport?.(user.id)
    onClose()
  }

  const nextPhoto = () => {
    setCurrentPhotoIndex((prev) => (prev + 1) % user.photos.length)
  }

  const prevPhoto = () => {
    setCurrentPhotoIndex((prev) => (prev - 1 + user.photos.length) % user.photos.length)
  }

  return (
    <div 
      className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div 
        className="glass-card max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <div className="flex justify-end p-4">
          <button
            onClick={onClose}
            className="glass-bubble p-2 hover:bg-white/20 transition-all duration-300"
          >
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Photo Gallery */}
        <div className="relative">
          <div className="w-full h-80 bg-gradient-to-br from-gray-800 to-gray-900 rounded-t-3xl overflow-hidden">
            <img
              src={user.photos[currentPhotoIndex]}
              alt={`${user.username} photo ${currentPhotoIndex + 1}`}
              className="w-full h-full object-cover"
            />
            
            {/* Photo Navigation */}
            {user.photos.length > 1 && (
              <>
                <button
                  onClick={prevPhoto}
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 glass-bubble p-2 hover:bg-white/20 transition-all duration-300"
                >
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button
                  onClick={nextPhoto}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 glass-bubble p-2 hover:bg-white/20 transition-all duration-300"
                >
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </>
            )}

            {/* Online Indicator */}
            {user.isOnline && (
              <div className="absolute top-4 right-4">
                <div className="w-4 h-4 bg-green-500 rounded-full border-2 border-white shadow-lg shadow-green-500/50"></div>
              </div>
            )}

            {/* Photo Indicators */}
            {user.photos.length > 1 && (
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
                {user.photos.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentPhotoIndex(index)}
                    className={`w-2 h-2 rounded-full transition-all duration-300 ${
                      index === currentPhotoIndex 
                        ? 'bg-white' 
                        : 'bg-white/40 hover:bg-white/60'
                    }`}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* User Info */}
        <div className="p-6 space-y-4">
          {/* Name and Age */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold text-white">{user.username}</h2>
              <p className="text-white/60 text-lg">{user.age} years old</p>
            </div>
            {user.distance && (
              <div className="glass-bubble px-3 py-1">
                <span className="text-sm text-white/80">{user.distance}</span>
              </div>
            )}
          </div>

          {/* Bio */}
          {user.bio && (
            <div className="glass-bubble p-4">
              <p className="text-white/90 leading-relaxed">{user.bio}</p>
            </div>
          )}

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="glass-bubble p-3 text-center">
              <div className="text-2xl font-bold text-white">24</div>
              <div className="text-xs text-white/60">Photos</div>
            </div>
            <div className="glass-bubble p-3 text-center">
              <div className="text-2xl font-bold text-white">1.2k</div>
              <div className="text-xs text-white/60">Followers</div>
            </div>
            <div className="glass-bubble p-3 text-center">
              <div className="text-2xl font-bold text-white">89</div>
              <div className="text-xs text-white/60">Following</div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-6 pt-0 space-y-3">
          {/* Message Button */}
          <button
            onClick={handleMessage}
            className="w-full gradient-button py-4 rounded-2xl text-white font-semibold text-lg hover:scale-105 transition-all duration-300 shadow-lg"
            style={{
              background: 'linear-gradient(135deg, #00d4ff, #ff00ff)',
              boxShadow: '0 0 30px rgba(0, 212, 255, 0.3)'
            }}
          >
            💬 Send Message
          </button>

          {/* Secondary Actions */}
          <div className="flex gap-3">
            <button
              onClick={handleBlock}
              className="flex-1 glass-bubble py-3 rounded-2xl text-white/80 font-medium hover:bg-red-500/10 hover:text-red-400 transition-all duration-300"
            >
              🚫 Block
            </button>
            <button
              onClick={handleReport}
              className="flex-1 glass-bubble py-3 rounded-2xl text-white/80 font-medium hover:bg-red-500/10 hover:text-red-400 transition-all duration-300"
            >
              ⚠️ Report
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
