'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { formatDistanceToNow } from 'date-fns'
import { useRouter } from 'next/navigation'

// Helper function to format relative time
function formatTimeAgo(date: string): string {
  try {
    return formatDistanceToNow(new Date(date), { addSuffix: true })
  } catch {
    return 'recently'
  }
}

interface UserUpdate {
  id: string
  user_id: string
  display_name: string
  photo_url?: string
  update_text: string
  created_at: string
  distance?: number
  online?: boolean
  position?: string
  age?: number
}

interface UserAdvertisingPanelProps {
  isOpen?: boolean
  onToggle?: () => void
}

export default function UserAdvertisingPanel({ isOpen: controlledOpen, onToggle }: UserAdvertisingPanelProps) {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [updates, setUpdates] = useState<UserUpdate[]>([])
  const [loading, setLoading] = useState(true)
  const [sortBy, setSortBy] = useState<'time' | 'distance'>('time')
  const [showNewMessages, setShowNewMessages] = useState(false)
  const [showComposer, setShowComposer] = useState(false)
  const [composerText, setComposerText] = useState('')
  const [composerSaving, setComposerSaving] = useState(false)
  const [composerError, setComposerError] = useState('')
  const [composerSuccess, setComposerSuccess] = useState('')
  const panelRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  const actualIsOpen = controlledOpen !== undefined ? controlledOpen : isOpen
  const handleToggle = () => {
    if (onToggle) {
      onToggle()
    } else {
      setIsOpen(!isOpen)
    }
  }

  const fetchUpdates = useCallback(async () => {
    try {
      setLoading(true)

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setLoading(false)
        return
      }

      const { data: currentUser } = await supabase
        .from('profiles')
        .select('latitude, longitude')
        .eq('id', user.id)
        .single()

      if (!currentUser?.latitude || !currentUser?.longitude) {
        setLoading(false)
        return
      }

      const { data: profiles, error } = await supabase
        .from('profiles')
        .select(`
          id,
          display_name,
          photo_url,
          about,
          latitude,
          longitude,
          online,
          position,
          age,
          updated_at
        `)
        .not('latitude', 'is', null)
        .not('longitude', 'is', null)
        .neq('id', user.id)
        .limit(50)

      if (error) {
        console.error('Error fetching updates:', error)
        setLoading(false)
        return
      }

      const updatesList: UserUpdate[] = (profiles || [])
        .map(profile => {
          const lat1 = currentUser.latitude
          const lon1 = currentUser.longitude
          const lat2 = profile.latitude
          const lon2 = profile.longitude

          const R = 3959
          const dLat = (lat2 - lat1) * Math.PI / 180
          const dLon = (lon2 - lon1) * Math.PI / 180
          const a = 
            Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2)
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
          const distance = R * c

          return {
            id: profile.id,
            user_id: profile.id,
            display_name: profile.display_name || 'Anonymous',
            photo_url: profile.photo_url,
            update_text: profile.about || 'Looking to connect',
            created_at: profile.updated_at || new Date().toISOString(),
            distance: Math.round(distance * 10) / 10,
            online: profile.online,
            position: profile.position,
            age: profile.age
          }
        })
        .sort((a, b) => {
          if (sortBy === 'time') {
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          } else {
            return (a.distance || Infinity) - (b.distance || Infinity)
          }
        })

      setUpdates(updatesList)
      setLoading(false)
    } catch (error) {
      console.error('Error in fetchUpdates:', error)
      setLoading(false)
    }
  }, [sortBy, supabase])

  useEffect(() => {
    if (!actualIsOpen) return
    fetchUpdates()
    const interval = setInterval(fetchUpdates, 30000)
    return () => clearInterval(interval)
  }, [actualIsOpen, fetchUpdates])

  const handleSubmitUpdate = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    if (!composerText.trim()) {
      setComposerError('Say something that represents your vibe.')
      return
    }

    setComposerSaving(true)
    setComposerError('')
    setComposerSuccess('')

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setComposerError('Please sign in to post an update.')
        setComposerSaving(false)
        return
      }

      const { error } = await supabase
        .from('profiles')
        .update({
          about: composerText.trim(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id)

      if (error) {
        throw error
      }

      setComposerSuccess('Update posted! You’re in the feed.')
      setComposerText('')
      setShowComposer(false)
      fetchUpdates()
    } catch (err: any) {
      setComposerError(err.message || 'Failed to post update.')
    } finally {
      setComposerSaving(false)
    }
  }, [composerText, fetchUpdates, supabase])

  return (
    <>
      {/* Toggle Button - Right Corner */}
      <button
        onClick={handleToggle}
        className="fixed top-20 sm:top-24 right-4 z-40 w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-br from-cyan-500/90 to-purple-500/90 backdrop-blur-xl border-2 border-white/20 shadow-lg hover:scale-110 active:scale-95 transition-all duration-300 flex items-center justify-center group touch-manipulation"
        style={{ boxShadow: '0 4px 20px rgba(0, 212, 255, 0.4)' }}
      >
        <svg 
          className="w-6 h-6 text-white group-hover:rotate-90 transition-transform" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d={actualIsOpen 
              ? "M6 18L18 6M6 6l12 12" 
              : "M12 6v6m0 0v6m0-6h6m-6 0H6"
            } 
          />
        </svg>
      </button>

      {/* Panel */}
      <AnimatePresence>
        {actualIsOpen && (
          <motion.div
            ref={panelRef}
            initial={{ x: 400, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 400, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-16 sm:top-20 right-0 bottom-20 w-full sm:w-96 max-w-[90vw] z-30 bg-black/95 backdrop-blur-2xl border-l border-cyan-500/20 shadow-2xl overflow-hidden flex flex-col touch-pan-y"
            style={{ 
              boxShadow: '-4px 0 20px rgba(0, 0, 0, 0.5)',
              maxHeight: 'calc(100vh - 4rem - 5rem)', // Account for header and bottom nav
              touchAction: 'pan-y'
            }}
          >
            {/* Header */}
            <div className="p-4 border-b border-cyan-500/20 bg-gradient-to-r from-cyan-500/10 to-purple-500/10">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                  Updates
                </h2>
                <button
                  onClick={handleToggle}
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition"
                >
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              {/* Sort By */}
              <div className="flex items-center gap-2 text-sm">
                <span className="text-gray-400">Sort by:</span>
                <button
                  onClick={() => setSortBy('time')}
                  className={`px-3 py-1 rounded-lg transition ${
                    sortBy === 'time'
                      ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/50'
                      : 'bg-white/5 text-gray-400 hover:bg-white/10'
                  }`}
                >
                  Time
                </button>
                <button
                  onClick={() => setSortBy('distance')}
                  className={`px-3 py-1 rounded-lg transition ${
                    sortBy === 'distance'
                      ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/50'
                      : 'bg-white/5 text-gray-400 hover:bg-white/10'
                  }`}
                >
                  Distance
                </button>
              </div>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto overscroll-contain">
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-cyan-400"></div>
                </div>
              ) : updates.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                  <svg className="w-16 h-16 text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                  </svg>
                  <p className="text-gray-400">No updates yet</p>
                </div>
              ) : (
                <div className="p-2 space-y-2">
                  {updates.map((update) => (
                    <motion.div
                      key={update.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl p-3 transition-all cursor-pointer group"
                      onClick={() => router.push(`/profile/${update.id}`)}
                    >
                      <div className="flex items-start gap-3">
                        {/* Profile Picture */}
                        <div className="relative flex-shrink-0">
                          <img
                            src={update.photo_url || '/default-avatar.png'}
                            alt={update.display_name}
                            className="w-12 h-12 rounded-full object-cover border-2 border-cyan-500/50"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = '/default-avatar.png'
                            }}
                          />
                          {update.online && (
                            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-black"></div>
                          )}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold text-white text-sm truncate">
                              {update.display_name}
                            </span>
                            {update.age && (
                              <span className="text-gray-400 text-xs">{update.age}</span>
                            )}
                            {update.position && (
                              <span className="text-xs px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-400">
                                {update.position}
                              </span>
                            )}
                          </div>
                          
                          <div className="bg-gradient-to-br from-cyan-500/20 to-purple-500/20 rounded-lg p-2.5 mb-2 border border-cyan-500/30">
                            <p className="text-white text-sm leading-relaxed break-words">
                              {update.update_text}
                            </p>
                          </div>

                          <div className="flex items-center justify-between text-xs text-gray-400">
                            <span>
                              {formatTimeAgo(update.created_at)}
                            </span>
                            {update.distance && (
                              <span className="flex items-center gap-1">
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                {update.distance.toFixed(1)} mi
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Action Icons */}
                        <div className="flex flex-col gap-2 flex-shrink-0">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              router.push(`/profile/${update.id}#share`)
                            }}
                            className="w-8 h-8 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 flex items-center justify-center transition opacity-0 group-hover:opacity-100"
                          >
                            <svg className="w-4 h-4 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                            </svg>
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              router.push(`/messages?user=${update.id}`)
                            }}
                            className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition opacity-0 group-hover:opacity-100"
                          >
                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* Post Update Input */}
            <div className="p-4 border-t border-cyan-500/20 bg-black/50">
              <button
                onClick={() => {
                  setShowComposer(true)
                  setComposerError('')
                  setComposerSuccess('')
                }}
                className="w-full px-4 py-3 bg-gradient-to-r from-cyan-500/20 to-purple-500/20 hover:from-cyan-500/30 hover:to-purple-500/30 border border-cyan-500/50 rounded-xl text-white text-sm font-medium transition-all"
              >
                Post an Update...
              </button>
              <AnimatePresence>
                {showComposer && (
                  <motion.form
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    onSubmit={handleSubmitUpdate}
                    className="mt-4 space-y-3 bg-black/60 border border-cyan-500/20 rounded-xl p-4"
                  >
                    <div>
                      <label className="block text-xs uppercase tracking-[0.2em] text-cyan-200/70 mb-2">
                        Broadcast to nearby members
                      </label>
                      <textarea
                        value={composerText}
                        onChange={(e) => setComposerText(e.target.value)}
                        rows={3}
                        className="w-full bg-black/40 border border-cyan-500/30 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/40 rounded-lg px-3 py-2 text-sm text-white placeholder-white/40 transition"
                        placeholder="Let people know your vibe, where you are, or what you're into tonight."
                      />
                    </div>
                    {composerError && (
                      <div className="text-xs text-red-300 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">
                        {composerError}
                      </div>
                    )}
                    {composerSuccess && (
                      <div className="text-xs text-emerald-300 bg-emerald-500/10 border border-emerald-500/30 rounded-lg px-3 py-2">
                        {composerSuccess}
                      </div>
                    )}
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setShowComposer(false)
                          setComposerError('')
                          setComposerSuccess('')
                        }}
                        className="px-3 py-2 text-sm text-white/60 hover:text-white/90 transition"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={composerSaving}
                        className="px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-purple-500 text-white text-sm font-semibold hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {composerSaving ? 'Posting…' : 'Share Update'}
                      </button>
                    </div>
                  </motion.form>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

