'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { blockUser } from '@/lib/safety'
import ReportModal from './ReportModal'
import { recordTap } from '@/lib/profileTracking'
import { createClient } from '@/lib/supabase/client'
import { useFeedback } from '@/contexts/FeedbackContext'

const DEFAULT_PHOTO_PLACEHOLDER = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23222" width="100" height="100"/%3E%3Ctext fill="%23aaa" x="50%" y="50%" dominant-baseline="middle" text-anchor="middle"%3E?%3C/text%3E%3C/svg%3E'

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
  isOwnProfile?: boolean
}

export default function UserProfileModal({
  user,
  isOpen,
  onClose,
  onMessage,
  onBlock,
  onReport,
  onFavorite,
  isFavorited = false,
  isOwnProfile = false
}: UserProfileModalProps) {
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0)
  const [showReportModal, setShowReportModal] = useState(false)
  const [blocked, setBlocked] = useState(false)
  const [isTapping, setIsTapping] = useState(false)
  const [hasTapped, setHasTapped] = useState(false)
  const [viewLimitReached, setViewLimitReached] = useState(false)
  const [viewsRemaining, setViewsRemaining] = useState<number | null>(null)
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])
  const { showError, showSuccess, confirmDanger } = useFeedback()

  // 🔒 Track profile view for usage limits (free tier)
  useEffect(() => {
    if (!isOpen || !user || isOwnProfile) return

    const trackProfileView = async () => {
      try {
        const { data: { user: currentUser } } = await supabase.auth.getUser()
        if (!currentUser) return

        const { data: result } = await supabase.rpc('record_usage', {
          p_user_id: currentUser.id,
          p_action_type: 'profile_viewed',
          p_target_id: user.id
        })

        if (result) {
          setViewLimitReached(!result.success)
          setViewsRemaining(result.usage?.remaining ?? null)
        }
      } catch (err) {
        console.error('Error tracking profile view:', err)
      }
    }

    trackProfileView()
  }, [isOpen, user?.id, isOwnProfile])

  if (!isOpen || !user) return null

  // 🔒 If view limit reached, show upgrade prompt
  if (viewLimitReached) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
        <div className="bg-[#1a1a1a] rounded-2xl max-w-sm w-full p-6 text-center border border-white/10">
          <div className="text-4xl mb-4">🔒</div>
          <h3 className="text-xl font-bold text-white mb-2">Daily Limit Reached</h3>
          <p className="text-white/70 text-sm mb-4">
            You've viewed 20 profiles today. Upgrade to SLTR Pro for unlimited profile views.
          </p>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 rounded-xl bg-white/10 text-white font-medium"
            >
              Close
            </button>
            <button
              onClick={() => router.push('/checkout/member')}
              className="flex-1 px-4 py-3 rounded-xl bg-lime-400 text-black font-bold"
            >
              Upgrade
            </button>
          </div>
        </div>
      </div>
    )
  }

  const photos: string[] = (user.photos?.length ?? 0) > 0 ? user.photos! : [DEFAULT_PHOTO_PLACEHOLDER]
  const currentPhotoSrc = photos[currentPhotoIndex] ?? DEFAULT_PHOTO_PLACEHOLDER

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
        showError('Unable to start conversation. Please try again.')
      }
    } catch (error) {
      console.error('Error starting conversation:', error)
      showError('Unable to start conversation. Please try again.')
    }
  }

  const handleBlock = async () => {
    const confirmed = await confirmDanger(
      `Block ${user.username}?`,
      "They won't be able to see your profile or message you. You can unblock them later from Settings."
    )

    if (confirmed) {
      const result = await blockUser(user.id, 'Blocked from profile')
      if (result.success) {
        setBlocked(true)
        showSuccess(`${user.username} has been blocked`)
        onBlock?.(user.id)
        setTimeout(() => onClose(), 1000)
      } else {
        showError(`Failed to block user: ${result.error || 'Unknown error'}`)
      }
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
        <Image
          src={currentPhotoSrc}
          alt={`Profile photo${photos.length > 1 ? ` ${currentPhotoIndex + 1} of ${photos.length}` : ''} of ${user.username}${user.age ? `, ${user.age} years old` : ''}`}
          fill
          sizes="100vw"
          className="object-contain"
          priority
        />

        {/* Top Left - Close button */}
        <button
          onClick={onClose}
          className="absolute top-6 left-6 z-20 w-12 h-12 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center hover:bg-black/70 transition-all"
          aria-label="Close profile"
        >
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Top Right - Edit Profile (only for own profile) */}
        {isOwnProfile && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              router.push('/profile')
            }}
            className="absolute top-6 right-6 z-20 px-4 py-2 rounded-full bg-cyan-500 backdrop-blur-md flex items-center gap-2 hover:bg-cyan-600 transition-all font-bold text-white shadow-lg"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Edit Profile
          </button>
        )}


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
                aria-label="Report user"
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
                aria-label="Block user"
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
                    aria-label={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
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
                  aria-label="Send message"
                >
                  🫧
                </button>
                <button
                  disabled={isTapping || hasTapped}
                  onClick={async (e) => {
                    e.stopPropagation()
                    if (hasTapped) return
                    try {
                      setIsTapping(true)
                      const result = await recordTap(user.id)
                      if (result.success) {
                        setHasTapped(true)
                        showSuccess(`Tap sent to ${user.username}!`)
                      } else {
                        showError('Unable to send tap. Please try again.')
                      }
                    } catch (err) {
                      console.error('Error sending tap:', err)
                      showError('Unable to send tap. Please try again.')
                    } finally {
                      setIsTapping(false)
                    }
                  }}
                  className={`w-12 h-12 rounded-full flex items-center justify-center transition-all text-2xl ${
                    hasTapped
                      ? 'bg-green-500/40 text-white cursor-default'
                      : 'bg-black/50 backdrop-blur-md hover:bg-black/70'
                  }`}
                  style={{ filter: 'drop-shadow(0 0 10px rgba(236, 72, 153, 0.6))' }}
                  aria-label={hasTapped ? 'Tap sent' : 'Send tap'}
                >
                  {hasTapped ? '💞' : '😈'}
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
            aria-label="Fire AI"
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
              aria-label="Previous photo"
            >
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
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
              aria-label="Next photo"
            >
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
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
                  aria-label={`Go to photo ${idx + 1} of ${photos.length}`}
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
          showSuccess('Thank you for your report. Our team will review it shortly.')
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
