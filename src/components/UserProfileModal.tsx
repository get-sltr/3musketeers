'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { blockUser } from '@/lib/safety'
import ReportModal from './ReportModal'

interface User {
  id: string
  username: string
  age: number
  photos?: string[]
  bio?: string
  distance?: string
  isOnline: boolean
  position?: string
  party_friendly?: boolean
  dtfn?: boolean
  kinks?: string[]
  tags?: string[]
  height?: string
  body_type?: string
  ethnicity?: string
}

interface UserProfileModalProps {
  user: User | null
  isOpen: boolean
  onClose: () => void
  onMessage: (userId: string) => void
  onBlock?: (userId: string) => void
  onReport?: (userId: string) => void
  onFavorite?: (userId: string) => void
  isFavorited?: boolean
}

export default function UserProfileModal({
  user,
  isOpen,
  onClose,
  onMessage,
  onBlock,
  onReport,
  onFavorite,
  isFavorited = false
}: UserProfileModalProps) {
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0)
  const [showReportModal, setShowReportModal] = useState(false)
  const [blocked, setBlocked] = useState(false)
  const router = useRouter()

  if (!isOpen || !user) return null

  const photos: string[] = (user.photos?.length ?? 0) > 0 ? user.photos! : ['data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23222" width="100" height="100"/%3E%3Ctext fill="%23aaa" x="50%" y="50%" dominant-baseline="middle" text-anchor="middle"%3E?%3C/text%3E%3C/svg%3E']

  const handleMessage = async () => {
    try {
      const { startConversation } = await import('../utils/messaging')
      const conversationId = await startConversation(user.id)
      
      if (conversationId) {
        onMessage(user.id)
        onClose()
        router.push(`/messages/${conversationId}`)
      } else {
        console.error('Failed to create/get conversation')
        alert('Unable to start conversation. Please try again.')
      }
    } catch (error) {
      console.error('Error starting conversation:', error)
      alert('Unable to start conversation. Please try again.')
    }
  }

  const handleBlock = () => {
    if (confirm(`Block ${user.username}? They won't be able to see your profile or message you.`)) {
      blockUser(user.id, 'Blocked from profile')
      setBlocked(true)
      onBlock?.(user.id)
      setTimeout(() => onClose(), 1000)
    }
  }

  const handleReport = () => {
    setShowReportModal(true)
  }

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
          alt={user.username}
          className="w-full h-full object-contain"
        />

        {/* Top Left - Close button */}
        <button
          onClick={onClose}
          className="absolute top-6 left-6 z-20 w-12 h-12 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center hover:bg-black/70 transition-all"
        >
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>


        {/* Right Side Stack - Report & Block (moved higher to not block arrows) */}
        {(onBlock || onReport) && (
          <div className="absolute right-3 top-24 z-20 flex flex-col gap-3">
            {onReport && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleReport()
                }}
                className="w-12 h-12 rounded-2xl bg-black/50 backdrop-blur-xl border border-white/10 flex flex-col items-center justify-center hover:bg-red-500/30 hover:border-red-400/50 transition-all text-xl"
              >
                ⚠️
              </button>
            )}
            {onBlock && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleBlock()
                }}
                className="w-12 h-12 rounded-2xl bg-black/50 backdrop-blur-xl border border-white/10 flex flex-col items-center justify-center hover:bg-red-500/30 hover:border-red-400/50 transition-all text-xl"
              >
                🚫
              </button>
            )}
          </div>
        )}

        {/* Top Overlay - Name, Age, Stats */}
        <div className="absolute top-0 left-0 right-0 p-6 bg-gradient-to-b from-black/80 via-black/50 to-transparent">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              {/* Name, Age, Action Buttons Row */}
              <div className="flex items-center gap-3 mb-1">
                <h2 className="text-3xl font-bold text-white">
                  {user.username}
                  {user.age && <span className="text-2xl font-bold text-cyan-400 ml-2">{user.age}</span>}
                </h2>
                
                {/* Favorite & Horn Buttons */}
                {onFavorite && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onFavorite(user.id)
                    }}
                    className="w-10 h-10 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center hover:bg-black/70 transition-all text-xl"
                  >
                    {isFavorited ? '✨' : '☆'}
                  </button>
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleMessage()
                  }}
                  className="w-12 h-12 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center hover:bg-black/70 transition-all shadow-lg text-2xl animate-pulse-glow"
                  style={{ filter: 'drop-shadow(0 0 8px rgba(34, 211, 238, 0.8))' }}
                >
                  📯
                </button>
              </div>
              
              {/* Stats - bold and bright */}
              <div className="flex items-center gap-3 mt-2">
                {user.isOnline && (
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
                {user.party_friendly && <span className="text-2xl">🥳</span>}
                {user.dtfn && <span className="text-2xl">⚡</span>}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Right - Fire AI */}
        <div className="absolute bottom-28 right-4 z-20">
          <button
            className="w-14 h-14 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center hover:bg-orange-500/30 transition-all text-3xl shadow-lg"
          >
            🔥
          </button>
        </div>


        {/* Bottom Overlay - All Info */}
        <div className="absolute bottom-0 left-0 right-0 p-4 pb-20 bg-gradient-to-t from-black/95 via-black/70 to-transparent max-h-[45vh] overflow-y-auto custom-scrollbar">
          {/* Position + Tags + Kinks Row */}
          <div className="flex flex-wrap gap-2 mb-3">
            {user.position && (
              <span className="px-3 py-1.5 bg-white/20 backdrop-blur-sm rounded-full text-white text-sm font-bold">
                {user.position}
              </span>
            )}
            {user.tags && user.tags.slice(0, 3).map((tag, idx) => (
              <span
                key={idx}
                className="px-3 py-1.5 bg-white/20 backdrop-blur-sm rounded-full text-white text-xs font-semibold"
              >
                {tag}
              </span>
            ))}
            {user.kinks && user.kinks.slice(0, 3).map((kink, idx) => (
              <span
                key={idx}
                className="px-3 py-1.5 bg-cyan-500/30 border border-cyan-400/50 backdrop-blur-sm rounded-full text-cyan-300 text-xs font-bold"
              >
                {kink}
              </span>
            ))}
          </div>

          {/* Stats Row */}
          {(user.height || user.body_type || user.ethnicity) && (
            <div className="flex flex-wrap gap-2 mb-3">
              {user.height && (
                <span className="px-3 py-1.5 bg-white/10 backdrop-blur-sm rounded-full text-white/90 text-xs font-semibold">
                  {user.height}
                </span>
              )}
              {user.body_type && (
                <span className="px-3 py-1.5 bg-white/10 backdrop-blur-sm rounded-full text-white/90 text-xs font-semibold">
                  {user.body_type}
                </span>
              )}
              {user.ethnicity && (
                <span className="px-3 py-1.5 bg-white/10 backdrop-blur-sm rounded-full text-white/90 text-xs font-semibold">
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

      {/* Report Modal */}
      <ReportModal
        userId={user.id}
        username={user.username}
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        onSuccess={() => {
          alert('Thank you for your report. Our team will review it shortly.')
        }}
      />

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
        
        :global(.animate-pulse-glow) {
          animation: pulse-glow 2s ease-in-out infinite;
        }
        
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(0, 212, 255, 0.3);
          border-radius: 2px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(0, 212, 255, 0.5);
        }
      `}</style>
    </div>
  )
}
