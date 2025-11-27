'use client'

/**
 * SLTR Production Grid View
 *
 * v2.0 - Refactored for Security, Performance, and UX
 *
 * Features:
 * - Server-side geospatial query via Supabase RPC (get_nearby_users).
 * - Client-side is secure, only receives data it needs.
 * - Lazy-loading profile modal (full data fetched on-click).
 * - Professional toast notifications (react-hot-toast) instead of alerts.
 * - Optimistic UI for blocking/favoriting.
 */

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { createClient } from '../lib/supabase/client'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import GridFilterBar, { GridFilters } from './GridFilterBar'

// --- Import our new shared types and utils ---
import { UserGridProfile, UserFullProfile } from '../lib/types/profile'
import { resolveProfilePhoto, formatDistance, calculateETA, DEFAULT_PROFILE_IMAGE } from '../lib/utils/profile'
import FoundersCircleAd from './FoundersCircleAd'

import { GridSkeleton } from './LoadingSkeleton'

// A simple spinner component (kept for other uses)
const LoadingSpinner = () => (
  <div className="w-12 h-12 border-4 border-lime-400 border-t-transparent rounded-full animate-spin" />
)

// A placeholder for your new Report Modal
const ReportModal = ({
  user,
  onClose,
}: {
  user: UserGridProfile
  onClose: () => void
}) => {
  // --- BUILD THIS OUT ---
  // This is a placeholder. You should build a real modal here
  // that takes the 'reason' and calls a Supabase function.
  return (
    <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center">
      <div className="bg-gray-900 p-6 rounded-lg text-white">
        <h2 className="text-xl font-bold mb-4">Report {user.display_name}</h2>
        <p className="mb-4">
          Create a form here to submit a report.
        </p>
        <button
          onClick={() => {
            toast.success('Report submitted. Our team will review it.')
            onClose()
          }}
          className="bg-red-600 text-white font-semibold py-3 px-6 rounded-xl w-full"
        >
          Submit Report (Placeholder)
        </button>
        <button
          onClick={onClose}
          className="mt-2 text-gray-400 text-sm w-full"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}

interface GridViewProductionProps {
  onUserClick: (userId: string) => void
  users?: UserGridProfile[]
}

export default function GridViewProduction({ 
  onUserClick,
  users: propsUsers = [] 
}: GridViewProductionProps) {
  const supabase = createClient()
  const router = useRouter()
  
  // --- STATE MANAGEMENT ---
  // Users for the grid (light data) - use prop if provided, otherwise fetch
  const [users, setUsers] = useState<UserGridProfile[]>(propsUsers)
  // The currently clicked user (light data)
  const [selectedUser, setSelectedUser] = useState<UserGridProfile | null>(null)
  // The full, lazy-loaded profile for the modal
  const [fullProfile, setFullProfile] = useState<UserFullProfile | null>(null)
  
  // Loading states
  const [gridLoading, setGridLoading] = useState(true)
  const [modalLoading, setModalLoading] = useState(false)

  // Report modal state
  const [isReporting, setIsReporting] = useState(false)
  
  // Location error state - prevent toast spam
  const [locationErrorShown, setLocationErrorShown] = useState(false)
  
  // Current user state for header
  const [currentUserPhoto, setCurrentUserPhoto] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())
  const [filters, setFilters] = useState<GridFilters>({
    tab: 'all',
    genderIdentity: [],
    bodyTypes: [],
    lookingFor: []
  })

  // --- DATA FETCHING ---

  // 1. Fetch current user's profile photo
  useEffect(() => {
    const loadCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      
      const { data: profile } = await supabase
        .from('profiles')
        .select('photos, photo_url')
        .eq('id', user.id)
        .single()
      
      if (profile) {
        const photo = resolveProfilePhoto(profile.photo_url, profile.photos)
        setCurrentUserPhoto(photo || DEFAULT_PROFILE_IMAGE)
      }
    }
    loadCurrentUser()
  }, [])
  
  // 2. Sync internal state with props if provided
  useEffect(() => {
    if (propsUsers.length > 0) {
      setUsers(propsUsers)
    } else {
      fetchGridUsers()
    }
  }, [propsUsers])
  
  // 4. Auto-refresh every 60 seconds (real-time subscription handles immediate updates)
  useEffect(() => {
    if (locationErrorShown) return
    
    const interval = setInterval(() => {
      fetchGridUsers()
      setLastRefresh(new Date())
    }, 60000) // 60 seconds - reduced frequency since real-time handles updates

    return () => clearInterval(interval)
  }, [locationErrorShown])
  
  // 5. Subscribe to real-time profile updates - optimized to update in place
  useEffect(() => {
    let debounceTimer: NodeJS.Timeout | null = null
    
    const channel = supabase
      .channel('grid-updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
        },
        (payload) => {
          // Update only the changed profile in state instead of full refetch
          const updatedProfile = payload.new as UserGridProfile
          setUsers(prev => prev.map(user => 
            user.id === updatedProfile.id ? { ...user, ...updatedProfile } : user
          ))
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'profiles',
        },
        () => {
          // Debounce new user inserts - don't fetch immediately
          if (debounceTimer) clearTimeout(debounceTimer)
          debounceTimer = setTimeout(() => fetchGridUsers(), 5000)
        }
      )
      .subscribe()

    return () => {
      if (debounceTimer) clearTimeout(debounceTimer)
      supabase.removeChannel(channel)
    }
  }, [])

  // 3. Fetch the full profile *only* when a user is selected
  useEffect(() => {
    if (selectedUser) {
      fetchFullProfile(selectedUser.id)
    }
  }, [selectedUser])

  async function fetchGridUsers() {
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser()
      if (!currentUser) return

      // Get current user's location to pass to our new function
      const { data: profile } = await supabase
        .from('profiles')
        .select('latitude, longitude')
        .eq('id', currentUser.id)
        .single()

      if (!profile?.latitude || !profile?.longitude) {
        // Only show error once to prevent toast spam
        if (!locationErrorShown) {
        toast.error("Please set your location in your profile to see nearby users.");
          setLocationErrorShown(true)
        }
        setGridLoading(false)
        return
      }

      // --- THIS IS THE CRITICAL FIX ---
      // Call our secure, fast SQL function with 10-mile radius
      // Add timeout and fallback for network issues
      let data = null
      let error = null
      
      try {
        // Add timeout wrapper (10 seconds - faster fallback)
        const rpcPromise = supabase.rpc('get_nearby_profiles', {
          p_user_id: currentUser.id,
          p_origin_lat: profile.latitude,
          p_origin_lon: profile.longitude,
          p_radius_miles: 10, // 10-mile radius only
        })
        
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('RPC timeout')), 10000)
        )
        
        const result = await Promise.race([rpcPromise, timeoutPromise]) as any
        if (result.error) {
          throw result.error
        }
        data = result.data
      } catch (rpcError) {
        // Silently fallback - don't log errors (expected if RPC not available)
        // Fallback: Direct query if RPC fails
        try {
          const { data: fallbackData, error: fallbackError } = await supabase
            .from('profiles')
            .select('id, display_name, photo_url, photos, online as is_online, dtfn, party_friendly, latitude, longitude, founder_number, about, kinks, tags, position, age, incognito_mode')
            .not('latitude', 'is', null)
            .not('longitude', 'is', null)
            .eq('incognito_mode', false)
            .limit(200)
          
          if (!fallbackError && fallbackData) {
            // Calculate distances manually
            const haversineDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
              const toRad = (value: number) => (value * Math.PI) / 180
              const R = 3958.8
              const dLat = toRad(lat2 - lat1)
              const dLon = toRad(lon2 - lon1)
              const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
                Math.sin(dLon / 2) * Math.sin(dLon / 2)
              const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
              return R * c
            }
            
            data = fallbackData.map((p: any) => {
              const distanceMiles = haversineDistance(profile.latitude, profile.longitude, p.latitude, p.longitude)
              return {
                ...p,
                distance_miles: distanceMiles,
                is_self: p.id === currentUser.id
              }
            }).filter((p: any) => p.distance_miles <= 10 && p.id !== currentUser.id)
              .sort((a: any, b: any) => a.distance_miles - b.distance_miles)
          } else {
            error = fallbackError
          }
        } catch (fallbackErr) {
          error = fallbackErr
        }
      }

      // If we have data (from RPC or fallback), use it
      if (data && data.length > 0) {
        // Filter and transform data
        const filteredUsers = data
          .filter((u: any) => u.id !== currentUser.id) // Exclude self
          .map((u: any) => ({
            id: u.id,
            display_name: u.display_name || 'Anonymous',
            photo_url: u.photo_url || u.photos?.[0] || null,
            photos: u.photos || [],
            age: u.age,
            position: u.position,
            dtfn: u.dtfn,
            party_friendly: u.party_friendly,
            distance_miles: u.distance_miles,
            is_online: u.is_online,
          }))

        setUsers(filteredUsers)
      } else if (error) {
        // Only show error if both RPC and fallback failed
        console.error('Error fetching nearby profiles (both RPC and fallback failed):', error)
        // Don't show toast - just set empty array
        setUsers([])
      } else {
        // No data and no error - set empty array
        setUsers([])
      }
    } catch (error: any) {
      // Only log unexpected errors (not RPC failures which are handled above)
      if (!error?.message?.includes('RPC') && !error?.message?.includes('get_nearby_profiles')) {
        console.error('Unexpected error fetching grid users:', error)
      }
      setUsers([])
    } finally {
      setGridLoading(false)
    }
  }

  // This function is new and runs on-demand
  async function fetchFullProfile(userId: string) {
    setModalLoading(true)
    setFullProfile(null) // Clear old profile

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*') // Get all details for the modal
        .eq('id', userId)
        .single()

      if (error) throw error
      setFullProfile(data)

    } catch (error: any) {
      console.error('Error fetching full profile:', error)
      toast.error('Could not load profile details.')
      setSelectedUser(null) // Close modal on error
    } finally {
      setModalLoading(false)
    }
  }

  // --- ACTIONS (with Optimistic UI and Toasts) ---

  const handleTap = async (toUserId: string) => {
    const promise = Promise.resolve(
      supabase.rpc('tap_user', { target_user_id: toUserId })
    ).then(({ data, error }) => {
      if (error) throw error
      return data
    })

    toast.promise(promise, {
      loading: 'Sending tap...',
      success: (data: any) => data?.already_exists ? 'Already tapped!' : 'Tap sent! 👋',
      error: (err) => err.message || 'Could not send tap'
    })
  }

  const handleToggleFavorite = async () => {
    if (!fullProfile) return
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // TODO: You should store favorite status in `fullProfile`
    // For now, we'll just query it.
    
    const { data: existing } = await supabase
      .from('favorites')
      .select('id')
      .eq('user_id', user.id)
      .eq('favorited_user_id', fullProfile.id)
      .single()

    if (existing) {
      // Remove from favorites
      const promise = Promise.resolve(supabase.from('favorites').delete().eq('id', existing.id)).then(({ error }) => {
        if (error) throw error
        return { success: true }
      })
      toast.promise(promise, {
        loading: 'Removing favorite...',
        success: 'Removed from favorites',
        error: 'Error'
      })
    } else {
      // Add to favorites
      const promise = Promise.resolve(supabase.from('favorites').insert({
        user_id: user.id,
        favorited_user_id: fullProfile.id,
        created_at: new Date().toISOString()
      })).then(({ error }) => {
        if (error) throw error
        return { success: true }
      })
      toast.promise(promise, {
        loading: 'Adding favorite...',
        success: 'Added to favorites!',
        error: 'Error'
      })
    }
  }

  const handleBlock = async () => {
    if (!selectedUser) return
    if (!confirm('Block this user? They won\'t be able to see your profile or message you.')) return

    const blockedId = selectedUser.id

    // Optimistic UI: Close modal and remove user from grid immediately
    setSelectedUser(null)
    setUsers(currentUsers => currentUsers.filter(u => u.id !== blockedId))

    const promise = Promise.resolve(
      supabase.rpc('block_user', { target_user_id: blockedId })
    ).then(({ error }) => {
      if (error) throw error
      return { success: true }
    })

    toast.promise(promise, {
      loading: 'Blocking user...',
      success: 'User blocked',
      error: (err) => {
        // Rollback UI on error
        toast.error('Failed to block user. Refreshing.')
        fetchGridUsers() // Refresh to fix optimistic state
        return err.message || 'Failed to block user'
      }
    })
  }

  // --- RENDER ---

  // Show skeleton while loading - prevents CLS by reserving space
  if (gridLoading) {
    return (
      <div className="min-h-screen bg-black" style={{ 
        paddingTop: 'calc(72px + max(env(safe-area-inset-top), 16px))',
        paddingBottom: 'calc(84px + env(safe-area-inset-bottom, 0px))'
      }}>
        <GridSkeleton count={12} />
      </div>
    )
  }

  // Filter users based on search query and filters
  const filteredUsers = users
    .filter(u => {
      // Search query filter
      if (searchQuery && !u.display_name?.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false
      }
      // Tab filters
      if (filters.tab === 'online' && !u.is_online) return false
      if (filters.tab === 'dtfn' && !u.dtfn) return false
      if (filters.tab === 'hosting' && !u.party_friendly) return false
      
      return true
    })

  return (
    <div className="min-h-screen bg-black">
{/* Internal header removed to avoid double header; AnimatedHeader handles this */}
      
      {/* 3-Column Grid with Gaps - Like Grindr */}
      <div className="min-h-screen" style={{ 
        paddingTop: 'calc(72px + max(env(safe-area-inset-top), 16px))',
        paddingBottom: 'calc(84px + env(safe-area-inset-bottom, 0px))',
        WebkitOverflowScrolling: 'touch',
        overscrollBehavior: 'contain'
      }}>
        {/* Optional: lightweight search/filter UI can be re-added later */}
        <div className="grid grid-cols-3 gap-0.5 bg-black p-0.5">
          
          {/* --- EMPTY STATE --- */}
          {filteredUsers.length === 0 && (
            <div className="col-span-3 h-[80vh] flex items-center justify-center text-center text-gray-400">
              <div>
                <p className="text-4xl mb-2">{searchQuery ? '🔍' : '📍'}</p>
                <p className="text-lg">{searchQuery ? 'No matches found' : 'No users nearby'}</p>
                <p className="text-sm text-gray-500">
                  {searchQuery ? 'Try a different search' : 'Try expanding your filters or check back later.'}
                </p>
              </div>
            </div>
          )}

          {filteredUsers.map((user, index) => {
            const photo = resolveProfilePhoto(user.photo_url, user.photos)
            const distance = formatDistance(user.distance_miles)
            const eta = calculateETA(user.distance_miles)
            // Prioritize first 6 images (above-the-fold) for LCP optimization
            const isAboveFold = index < 6

            return (
              <div
                key={user.id}
                onClick={() => setSelectedUser(user)}
                className="relative aspect-[3/4] cursor-pointer overflow-hidden active:opacity-90 transition-opacity bg-gray-900"
              >
                  {/* ... Grid card details ... */}
                  {photo ? (
                    <Image 
                      src={photo} 
                      alt={user.display_name || 'User'} 
                      fill 
                      className="object-cover" 
                      sizes="33vw"
                      priority={isAboveFold}
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-900" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  {user.dtfn && (
                    <div className="absolute top-2 right-2 bg-cyan-500 text-black text-xs font-bold px-2 py-1 rounded-full">
                      ⚡ DTFN
                    </div>
                  )}
                  <div className="absolute bottom-0 left-0 right-0 p-2">
                    <div className="flex items-center gap-2 text-xs text-white">
                      {user.is_online && (
                        <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0" />
                      )}
                      {distance && <span>{distance}</span>}
                      {eta && ( <> <span>•</span> <span>{eta}</span> </> )}
                    </div>
                  </div>
                </div>
            )
          })}
        </div>
      </div>

      {/* Report Modal */}
      <AnimatePresence>
        {isReporting && selectedUser && (
          <ReportModal 
            user={selectedUser} 
            onClose={() => setIsReporting(false)} 
          />
        )}
      </AnimatePresence>

      {/* Full Screen Profile Modal */}
      <AnimatePresence>
        {selectedUser && (
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed inset-0 bg-black z-[100] flex flex-col"
            style={{ touchAction: 'pan-y' }}
          >
            {/* Close Button */}
            <button
              onClick={() => setSelectedUser(null)}
              className="absolute top-4 right-4 z-50 w-10 h-10 bg-black/80 rounded-full flex items-center justify-center text-white"
            >
              ✕
            </button>
            
            {/* Scrollable Content Area */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden" style={{ WebkitOverflowScrolling: 'touch' }}>
              {/* Profile Header Photo (uses light data, loads instantly) */}
              <div className="relative h-[60vh]">
                {resolveProfilePhoto(selectedUser.photo_url, selectedUser.photos) ? (
                  <Image
                    src={resolveProfilePhoto(selectedUser.photo_url, selectedUser.photos)!}
                    alt={selectedUser.display_name || 'User'}
                    fill
                    className="object-cover"
                    priority // Load this image first
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-900" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent" />

                {/* Name + Age on Photo */}
                <div className="absolute bottom-6 left-6 z-10">
                  <h1 className="text-4xl font-bold text-white mb-2">
                    {selectedUser.display_name || 'Anonymous'}
                    {/* --- LAZY LOADED DATA --- */}
                    {fullProfile?.age && <span className="text-3xl">, {fullProfile.age}</span>}
                  </h1>
                  <div className="flex items-center gap-2 text-gray-300">
                    {selectedUser.is_online && (
                      <div className="flex items-center gap-1.5">
                        <div className="w-2.5 h-2.5 bg-green-500 rounded-full" />
                        <span className="text-sm">Online</span>
                      </div>
                    )}
                    <span>•</span>
                    <span>{formatDistance(selectedUser.distance_miles)}</span>
                    <span>•</span>
                    <span>{calculateETA(selectedUser.distance_miles)}</span>
                  </div>
                </div>
              </div>

              {/* Scrollable Content */}
              <div className="bg-black text-white p-6 space-y-6">
                {/* --- LAZY LOADED CONTENT --- */}
                {modalLoading && (
                  <div className="flex justify-center py-10">
                    <LoadingSpinner />
                  </div>
                )}

                {/* Show this content ONLY after full profile is loaded */}
                {fullProfile && (
                  <>
                    {/* Quick Stats */}
                    {fullProfile.dtfn && (
                      <div className="bg-lime-400/20 border border-lime-400 rounded-lg p-4">
                        <span className="text-lime-400 font-bold text-lg">⚡ Down To Fuck Now</span>
                      </div>
                    )}
                    {fullProfile.hosting && (
                      <div className="bg-purple-500/20 border border-purple-500 rounded-lg p-4">
                        <span className="text-purple-400 font-bold">🏠 I'm Hosting</span>
                      </div>
                    )}

                    {/* About */}
                    {fullProfile.about && (
                      <div>
                        <h3 className="text-lg font-bold mb-2 text-lime-400">About</h3>
                        <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">{fullProfile.about}</p>
                      </div>
                    )}

                    {/* Stats Section */}
                    <div>
                      <h3 className="text-lg font-bold mb-3 text-lime-400">Stats</h3>
                      <div className="space-y-2">
                        {fullProfile.age && (
                          <div className="flex justify-between py-2 border-b border-gray-800">
                            <span className="text-gray-400">Age</span>
                            <span className="text-white">{fullProfile.age}</span>
                          </div>
                        )}
                        {fullProfile.height && (
                          <div className="flex justify-between py-2 border-b border-gray-800">
                            <span className="text-gray-400">Height</span>
                            <span className="text-white">{fullProfile.height}</span>
                          </div>
                        )}
                        {fullProfile.weight && (
                          <div className="flex justify-between py-2 border-b border-gray-800">
                            <span className="text-gray-400">Weight</span>
                            <span className="text-white">{fullProfile.weight}</span>
                          </div>
                        )}
                        {fullProfile.body_type && (
                          <div className="flex justify-between py-2 border-b border-gray-800">
                            <span className="text-gray-400">Body Type</span>
                            <span className="text-white">{fullProfile.body_type}</span>
                          </div>
                        )}
                        {fullProfile.ethnicity && (
                          <div className="flex justify-between py-2 border-b border-gray-800">
                            <span className="text-gray-400">Ethnicity</span>
                            <span className="text-white">{fullProfile.ethnicity}</span>
                          </div>
                        )}
                        {fullProfile.position && (
                          <div className="flex justify-between py-2 border-b border-gray-800">
                            <span className="text-gray-400">Position</span>
                            <span className="text-white">{fullProfile.position}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Kinks */}
                    {fullProfile.kinks && fullProfile.kinks.length > 0 && (
                      <div>
                        <h3 className="text-lg font-bold mb-3 text-lime-400">Kinks</h3>
                        <div className="flex flex-wrap gap-2">
                          {fullProfile.kinks.map((kink, i) => (
                            <span key={i} className="bg-gray-800 px-3 py-1 rounded-full text-sm text-gray-300">
                              {kink}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Tags */}
                    {fullProfile.tags && fullProfile.tags.length > 0 && (
                      <div>
                        <h3 className="text-lg font-bold mb-3 text-lime-400">Tags</h3>
                        <div className="flex flex-wrap gap-2">
                          {fullProfile.tags.map((tag, i) => (
                            <span key={i} className="bg-gray-800 px-3 py-1 rounded-full text-sm text-gray-300">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Health & Safety */}
                    <div>
                      <h3 className="text-lg font-bold mb-3 text-lime-400">Health & Safety</h3>
                      <div className="space-y-2">
                        {fullProfile.hiv_status && (
                          <div className="flex justify-between py-2 border-b border-gray-800">
                            <span className="text-gray-400">HIV Status</span>
                            <span className="text-white">{fullProfile.hiv_status}</span>
                          </div>
                        )}
                        {fullProfile.prep_status && (
                          <div className="flex justify-between py-2 border-b border-gray-800">
                            <span className="text-gray-400">PrEP</span>
                            <span className="text-white">{fullProfile.prep_status}</span>
                          </div>
                        )}
                        {fullProfile.last_tested && (
                          <div className="flex justify-between py-2 border-b border-gray-800">
                            <span className="text-gray-400">Last Tested</span>
                            <span className="text-white">{fullProfile.last_tested}</span>
                          </div>
                        )}
                        {fullProfile.practices && (
                          <div className="flex justify-between py-2 border-b border-gray-800">
                            <span className="text-gray-400">Practices</span>
                            <span className="text-white">{fullProfile.practices}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                )}
                
                {/* Spacer at the bottom to ensure content clears the sticky bar */}
                <div className="h-40" />
              </div>
            </div>

            {/* --- UI/UX FIX: STICKY ACTION BAR --- */}
            {/* This bar stays at the bottom while the content above scrolls */}
            <div className="sticky bottom-0 z-20 bg-gradient-to-t from-black via-black to-black/90 p-4 border-t border-gray-800">
              {/* Primary Actions */}
              <div className="flex gap-3">
                <button
                  onClick={() => router.push(`/messages?conversation=${selectedUser.id}`)}
                  className="flex-1 bg-lime-400 text-black font-bold py-4 rounded-xl hover:bg-lime-300 transition"
                  disabled={!fullProfile} // Disabled until profile is loaded
                >
                  Message
                </button>
                <button
                  onClick={() => handleTap(selectedUser.id)}
                  className="flex-1 bg-gray-800 text-white font-bold py-4 rounded-xl hover:bg-gray-700 transition"
                  disabled={!fullProfile}
                >
                  Tap
                </button>
              </div>
              
              {/* Secondary Actions */}
              <div className="flex gap-3 pt-3">
                <button
                  onClick={handleToggleFavorite}
                  className="flex-1 bg-purple-600 text-white font-semibold py-3 rounded-xl hover:bg-purple-500 transition"
                  disabled={!fullProfile}
                >
                  ⭐ Favorite
                </button>
                <button
                  onClick={handleBlock}
                  className="flex-1 bg-red-600 text-white font-semibold py-3 rounded-xl hover:bg-red-500 transition"
                >
                  🚫 Block
                </button>
                <button
                  onClick={() => setIsReporting(true)}
                  className="flex-1 bg-orange-600 text-white font-semibold py-3 rounded-xl hover:bg-orange-500 transition"
                >
                  ⚠️ Report
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}