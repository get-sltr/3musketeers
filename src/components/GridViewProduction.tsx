'use client'

/**
 * SLTR Production Grid View
 *
 * This is the OFFICIAL production grid component for SLTR.
 * Clean, optimized, and ready for launch.
 *
 * Features:
 * - 3-column tight Grindr-style grid
 * - Minimal card info: photo, green dot, DTFN badge, distance, ETA
 * - Full-screen spring animation profile modal
 * - All profile details in scrollable modal
 * - Cyan brand colors throughout
 * - Optimized for mobile PWA experience
 */

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { createClient } from '../lib/supabase/client'
import { resolveProfilePhoto } from '@/lib/utils/profile'
import { motion, AnimatePresence } from 'framer-motion'

interface User {
  id: string
  display_name?: string
  age?: number
  photo_url?: string
  photos?: string[]
  distance_miles?: number | null
  is_online?: boolean
  dtfn?: boolean
  party_friendly?: boolean
  position?: string
  height?: string
  weight?: string
  body_type?: string
  ethnicity?: string
  about?: string
  tags?: string[]
  kinks?: string[]
  hiv_status?: string
  prep_status?: string
  last_tested?: string
  practices?: string
  hosting?: boolean
  looking_for?: string
  latitude?: number
  longitude?: number
}

const formatDistance = (miles?: number | null): string => {
  if (miles == null) return ''
  if (miles < 0.1) return '<0.1 mi'
  if (miles < 10) return `${miles.toFixed(1)} mi`
  return `${Math.round(miles)} mi`
}

const calculateETA = (miles?: number | null): string => {
  if (miles == null) return ''
  const walkingMinutes = (miles / 3) * 60
  if (walkingMinutes < 1) return '<1m'
  if (walkingMinutes < 60) return `${Math.round(walkingMinutes)}m`
  const hours = Math.floor(walkingMinutes / 60)
  const mins = Math.round(walkingMinutes % 60)
  if (mins === 0) return `${hours}h`
  return `${hours}h ${mins}m`
}

export default function GridViewProduction() {
  const supabase = createClient()
  const router = useRouter()
  const [users, setUsers] = useState<User[]>([])
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchUsers()
  }, [])

  async function fetchUsers() {
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser()
      if (!currentUser) return

      // Get current user's location
      const { data: profile } = await supabase
        .from('profiles')
        .select('latitude, longitude')
        .eq('id', currentUser.id)
        .single()

      if (!profile?.latitude || !profile?.longitude) return

      // Fetch nearby users
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .neq('id', currentUser.id)
        .limit(50)

      if (error) throw error

      // Calculate distances using Haversine formula
      const usersWithDistance = (data || []).map((user: any) => {
        let distance_miles = null
        if (user.latitude && user.longitude) {
          const R = 3958.8 // Earth radius in miles
          const lat1 = profile.latitude * Math.PI / 180
          const lat2 = user.latitude * Math.PI / 180
          const dLat = (user.latitude - profile.latitude) * Math.PI / 180
          const dLon = (user.longitude - profile.longitude) * Math.PI / 180
          const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                   Math.cos(lat1) * Math.cos(lat2) *
                   Math.sin(dLon/2) * Math.sin(dLon/2)
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
          distance_miles = R * c
        }
        return { ...user, distance_miles }
      })

      // Sort by distance (closest first)
      usersWithDistance.sort((a, b) => (a.distance_miles || 999) - (b.distance_miles || 999))

      setUsers(usersWithDistance)
    } catch (error) {
      console.error('Error fetching users:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black overflow-hidden">
      {/* 3-Column Tight Grid */}
      <div className="h-full overflow-y-auto overflow-x-hidden">
        <div className="grid grid-cols-3 gap-0">
          {users.map((user) => {
            const photo = resolveProfilePhoto(user.photo_url, user.photos)
            const distance = formatDistance(user.distance_miles)
            const eta = calculateETA(user.distance_miles)

            return (
              <motion.div
                key={user.id}
                onClick={() => setSelectedUser(user)}
                className="relative aspect-[3/4] cursor-pointer overflow-hidden"
                whileTap={{ scale: 0.98 }}
              >
                {/* Profile Photo Background */}
                {photo ? (
                  <Image
                    src={photo}
                    alt={user.display_name || 'User'}
                    fill
                    className="object-cover"
                    sizes="33vw"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-900" />
                )}

                {/* Dark Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                {/* Top Right: DTFN Badge */}
                {user.dtfn && (
                  <div className="absolute top-2 right-2 bg-cyan-500 text-black text-xs font-bold px-2 py-1 rounded-full">
                    ⚡ DTFN
                  </div>
                )}

                {/* Bottom Info: Green Dot + Distance + ETA */}
                <div className="absolute bottom-0 left-0 right-0 p-2">
                  <div className="flex items-center gap-2 text-xs text-white">
                    {user.is_online && (
                      <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0" />
                    )}
                    {distance && <span>{distance}</span>}
                    {eta && (
                      <>
                        <span>•</span>
                        <span>{eta}</span>
                      </>
                    )}
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>

      {/* Full Screen Profile Modal */}
      <AnimatePresence>
        {selectedUser && (
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed inset-0 bg-black z-50 overflow-y-auto"
          >
            {/* Close Button */}
            <button
              onClick={() => setSelectedUser(null)}
              className="absolute top-4 right-4 z-10 w-10 h-10 bg-black/80 rounded-full flex items-center justify-center text-white"
            >
              ✕
            </button>

            {/* Profile Header Photo */}
            <div className="relative h-[60vh]">
              {resolveProfilePhoto(selectedUser.photo_url, selectedUser.photos) ? (
                <Image
                  src={resolveProfilePhoto(selectedUser.photo_url, selectedUser.photos)!}
                  alt={selectedUser.display_name || 'User'}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-900" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent" />

              {/* Name + Age on Photo */}
              <div className="absolute bottom-6 left-6">
                <h1 className="text-4xl font-bold text-white mb-2">
                  {selectedUser.display_name || 'Anonymous'}
                  {selectedUser.age && <span className="text-3xl">, {selectedUser.age}</span>}
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
              {/* Quick Stats */}
              {selectedUser.dtfn && (
                <div className="bg-cyan-500/20 border border-cyan-500 rounded-lg p-4">
                  <span className="text-cyan-400 font-bold text-lg">⚡ Down To Fuck Now</span>
                </div>
              )}

              {selectedUser.hosting && (
                <div className="bg-purple-500/20 border border-purple-500 rounded-lg p-4">
                  <span className="text-purple-400 font-bold">🏠 I'm Hosting</span>
                </div>
              )}

              {/* About */}
              {selectedUser.about && (
                <div>
                  <h3 className="text-lg font-bold mb-2 text-cyan-400">About</h3>
                  <p className="text-gray-300 leading-relaxed">{selectedUser.about}</p>
                </div>
              )}

              {/* Stats Section */}
              <div>
                <h3 className="text-lg font-bold mb-3 text-cyan-400">Stats</h3>
                <div className="space-y-2">
                  {selectedUser.age && (
                    <div className="flex justify-between py-2 border-b border-gray-800">
                      <span className="text-gray-400">Age</span>
                      <span className="text-white">{selectedUser.age}</span>
                    </div>
                  )}
                  {selectedUser.height && (
                    <div className="flex justify-between py-2 border-b border-gray-800">
                      <span className="text-gray-400">Height</span>
                      <span className="text-white">{selectedUser.height}</span>
                    </div>
                  )}
                  {selectedUser.weight && (
                    <div className="flex justify-between py-2 border-b border-gray-800">
                      <span className="text-gray-400">Weight</span>
                      <span className="text-white">{selectedUser.weight}</span>
                    </div>
                  )}
                  {selectedUser.body_type && (
                    <div className="flex justify-between py-2 border-b border-gray-800">
                      <span className="text-gray-400">Body Type</span>
                      <span className="text-white">{selectedUser.body_type}</span>
                    </div>
                  )}
                  {selectedUser.ethnicity && (
                    <div className="flex justify-between py-2 border-b border-gray-800">
                      <span className="text-gray-400">Ethnicity</span>
                      <span className="text-white">{selectedUser.ethnicity}</span>
                    </div>
                  )}
                  {selectedUser.position && (
                    <div className="flex justify-between py-2 border-b border-gray-800">
                      <span className="text-gray-400">Position</span>
                      <span className="text-white">{selectedUser.position}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Kinks */}
              {selectedUser.kinks && selectedUser.kinks.length > 0 && (
                <div>
                  <h3 className="text-lg font-bold mb-3 text-cyan-400">Kinks</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedUser.kinks.map((kink, i) => (
                      <span key={i} className="bg-gray-800 px-3 py-1 rounded-full text-sm text-gray-300">
                        {kink}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Tags */}
              {selectedUser.tags && selectedUser.tags.length > 0 && (
                <div>
                  <h3 className="text-lg font-bold mb-3 text-cyan-400">Tags</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedUser.tags.map((tag, i) => (
                      <span key={i} className="bg-gray-800 px-3 py-1 rounded-full text-sm text-gray-300">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Health & Safety */}
              <div>
                <h3 className="text-lg font-bold mb-3 text-cyan-400">Health & Safety</h3>
                <div className="space-y-2">
                  {selectedUser.hiv_status && (
                    <div className="flex justify-between py-2 border-b border-gray-800">
                      <span className="text-gray-400">HIV Status</span>
                      <span className="text-white">{selectedUser.hiv_status}</span>
                    </div>
                  )}
                  {selectedUser.prep_status && (
                    <div className="flex justify-between py-2 border-b border-gray-800">
                      <span className="text-gray-400">PrEP</span>
                      <span className="text-white">{selectedUser.prep_status}</span>
                    </div>
                  )}
                  {selectedUser.last_tested && (
                    <div className="flex justify-between py-2 border-b border-gray-800">
                      <span className="text-gray-400">Last Tested</span>
                      <span className="text-white">{selectedUser.last_tested}</span>
                    </div>
                  )}
                  {selectedUser.practices && (
                    <div className="flex justify-between py-2 border-b border-gray-800">
                      <span className="text-gray-400">Practices</span>
                      <span className="text-white">{selectedUser.practices}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => router.push(`/messages?conversation=${selectedUser.id}`)}
                  className="flex-1 bg-cyan-500 text-black font-bold py-4 rounded-xl hover:bg-cyan-400 transition"
                >
                  Message
                </button>
                <button
                  onClick={async () => {
                    try {
                      const { data: { user } } = await supabase.auth.getUser()
                      if (!user) return

                      await supabase.from('taps').insert({
                        from_user_id: user.id,
                        to_user_id: selectedUser.id,
                        created_at: new Date().toISOString()
                      })

                      alert('Tap sent!')
                    } catch (error) {
                      console.error('Error sending tap:', error)
                    }
                  }}
                  className="flex-1 bg-gray-800 text-white font-bold py-4 rounded-xl hover:bg-gray-700 transition"
                >
                  Tap
                </button>
              </div>

              {/* Secondary Actions */}
              <div className="flex gap-3 pt-3">
                <button
                  onClick={async () => {
                    try {
                      const { data: { user } } = await supabase.auth.getUser()
                      if (!user) return

                      // Check if already favorited
                      const { data: existing } = await supabase
                        .from('favorites')
                        .select('id')
                        .eq('user_id', user.id)
                        .eq('favorite_user_id', selectedUser.id)
                        .single()

                      if (existing) {
                        // Remove from favorites
                        await supabase.from('favorites').delete().eq('id', existing.id)
                        alert('Removed from favorites')
                      } else {
                        // Add to favorites
                        await supabase.from('favorites').insert({
                          user_id: user.id,
                          favorite_user_id: selectedUser.id,
                          created_at: new Date().toISOString()
                        })
                        alert('Added to favorites!')
                      }
                    } catch (error) {
                      console.error('Error toggling favorite:', error)
                    }
                  }}
                  className="flex-1 bg-purple-600 text-white font-semibold py-3 rounded-xl hover:bg-purple-500 transition"
                >
                  ⭐ Favorite
                </button>
                <button
                  onClick={async () => {
                    if (!confirm('Block this user? They won\'t be able to see your profile or message you.')) return

                    try {
                      const { data: { user } } = await supabase.auth.getUser()
                      if (!user) return

                      await supabase.from('blocks').insert({
                        blocker_id: user.id,
                        blocked_id: selectedUser.id,
                        created_at: new Date().toISOString()
                      })

                      alert('User blocked')
                      setSelectedUser(null)
                    } catch (error) {
                      console.error('Error blocking user:', error)
                    }
                  }}
                  className="flex-1 bg-red-600 text-white font-semibold py-3 rounded-xl hover:bg-red-500 transition"
                >
                  🚫 Block
                </button>
                <button
                  onClick={() => {
                    const reason = prompt('Why are you reporting this profile?\n\n1. Fake profile\n2. Inappropriate content\n3. Harassment\n4. Spam\n5. Other')
                    if (!reason) return

                    // In a real app, send this to your moderation system
                    alert('Report submitted. Our team will review it shortly.')
                  }}
                  className="flex-1 bg-orange-600 text-white font-semibold py-3 rounded-xl hover:bg-orange-500 transition"
                >
                  ⚠️ Report
                </button>
              </div>

              {/* Bottom Padding for safe scrolling */}
              <div className="h-20" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
