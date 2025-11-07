'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '../lib/supabase/client'
import { resolveProfilePhoto } from '@/lib/utils/profile'
import UserProfileModal from './UserProfileModal'
import ScrollableProfileCard from './ScrollableProfileCard'
import MessagingModal from './MessagingModal'
import { LazyAvatar } from './LazyImage'
// import { useLocation } from '../hooks/useLocation'
// import { useSocket } from '../hooks/useSocket'
// import { calculateDistance } from '../utils/geohash'

interface User {
  id: string
  username: string
  display_name?: string
  age: number
  photo?: string
  photos?: string[]
  distance: string
  distanceMiles?: number | null
  isOnline: boolean
  bio?: string
  position?: string
  party_friendly?: boolean
  dtfn?: boolean
  latitude?: number
  longitude?: number
  eta?: string
  tags?: string[]
  isFavorited?: boolean
}

interface GridViewProps {
  onUserClick?: (userId: string) => void
  activeFilters?: any
}

const MAX_GRID_DISTANCE_MILES = 10

const haversineDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
) => {
  const toRad = (value: number) => (value * Math.PI) / 180
  const R = 3958.8 // Miles

  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

const formatDistance = (distanceMiles: number | null | undefined) => {
  if (distanceMiles == null || Number.isNaN(distanceMiles)) {
    return ''
  }

  if (distanceMiles < 0.1) {
    return '<0.1 mi'
  }

  if (distanceMiles < 10) {
    return `${distanceMiles.toFixed(1)} mi`
  }

  return `${Math.round(distanceMiles)} mi`
}

export default function GridView({ onUserClick, activeFilters = { filters: [], ageRange: { min: 18, max: 99 }, positions: [] } }: GridViewProps) {
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isMessagingOpen, setIsMessagingOpen] = useState(false)
  const [messagingUser, setMessagingUser] = useState<User | null>(null)
  const [users, setUsers] = useState<User[]>([])
  const [filteredUsers, setFilteredUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()
  
  // New location hooks (temporarily disabled for deployment)
  // const { location, error: locationError } = useLocation()
  // const { nearbyUsers, isConnected, updateLocation } = useSocket()

  useEffect(() => {
    const loadUsers = async () => {
      try {
        // Get current user to put their profile first
        const { data: { user: currentUser } } = await supabase.auth.getUser()
        let currentUserLat: number | null = null
        let currentUserLon: number | null = null
        
        const { data: profiles, error } = await supabase
          .from('profiles')
          .select('*')
          .order('created_at', { ascending: false })

        if (error) {
          console.error('Error loading profiles:', error)
          return
        }

        // Convert profiles to User format
        const cleanedProfiles = (profiles || []).filter(profile => {
          const username = profile.username?.trim()
          const displayName = profile.display_name?.trim()
          const looksAnonymous =
            (!displayName || displayName.toLowerCase() === 'unknown') &&
            (!username || username.toLowerCase().includes('unknown'))

          const missingVisual =
            !profile.photo_url &&
            (!Array.isArray(profile.photos) || profile.photos.length === 0)

          // Skip placeholder/anonymous profiles unless it's the current user
          if (currentUser?.id === profile.id) {
            return true
          }

          return !looksAnonymous && !missingVisual
        })

        const currentProfile = cleanedProfiles.find(
          profile => profile.id === currentUser?.id
        )

        if (currentProfile?.latitude && currentProfile?.longitude) {
          currentUserLat = currentProfile.latitude
          currentUserLon = currentProfile.longitude
        }

        let userList: User[] =
          cleanedProfiles?.map(profile => {
            const hasCoords =
              typeof profile.latitude === 'number' &&
              typeof profile.longitude === 'number' &&
              profile.latitude !== null &&
              profile.longitude !== null

            const distanceMiles =
              hasCoords && currentUserLat != null && currentUserLon != null
                ? haversineDistance(
                    currentUserLat,
                    currentUserLon,
                    profile.latitude,
                    profile.longitude
                  )
                : null

            const isSelf = profile.id === currentUser?.id
            return {
              id: profile.id,
              username: profile.username || profile.display_name || 'User',
              display_name: profile.display_name || profile.username || 'User',
              age: profile.age || 0,
              photo: resolveProfilePhoto(profile.photo_url, profile.photos),
              photos: Array.isArray(profile.photos) ? profile.photos.filter(Boolean) : [],
              distance: isSelf ? 'You' : formatDistance(distanceMiles),
              distanceMiles: isSelf ? 0 : distanceMiles,
              isOnline: profile.online || profile.is_online || false,
              bio: profile.about || '',
              position: profile.position,
              party_friendly: profile.party_friendly || false,
              dtfn: profile.dtfn || false,
              tags: profile.tags || [],
              eta: profile.eta || '',
              latitude: profile.latitude ?? undefined,
              longitude: profile.longitude ?? undefined
            }
          }) || []

        // Limit by distance if we can calculate it
        userList = userList.filter(user => {
          if (user.id === currentUser?.id) {
            return true
          }

          if (user.distanceMiles == null) {
            // Keep users without distance for now rather than showing inaccurate value
            return false
          }

          return user.distanceMiles <= MAX_GRID_DISTANCE_MILES
        })

        // Sort to put current user first
        if (currentUser) {
          userList = userList.sort((a, b) => {
            if (a.id === currentUser.id) return -1
            if (b.id === currentUser.id) return 1
            if (a.distanceMiles != null && b.distanceMiles != null) {
              return a.distanceMiles - b.distanceMiles
            }
            return 0
          })
        }

        if (currentUser) {
          const { data: favoritesRows } = await supabase
            .from('favorites')
            .select('favorited_user_id')
            .eq('user_id', currentUser.id)

          const favoriteIds = new Set<string>()
          for (const row of favoritesRows || []) {
            if (row?.favorited_user_id) favoriteIds.add(row.favorited_user_id)
          }

          userList = userList.map(user => ({
            ...user,
            isFavorited: favoriteIds.has(user.id)
          }))
        }

        setUsers(userList)
      } catch (err) {
        console.error('Error loading users:', err)
      } finally {
        setLoading(false)
      }
    }

    loadUsers()
  }, [])

  // Filter users based on active filters
  useEffect(() => {
    let filtered = [...users]
    const filters = activeFilters.filters || []
    const ageRange = activeFilters.ageRange || { min: 18, max: 99 }
    const positions = activeFilters.positions || []

    // Apply filters
    if (filters.includes('online')) {
      filtered = filtered.filter(user => user.isOnline)
    }

    if (filters.includes('dtfn')) {
      filtered = filtered.filter(user => user.dtfn)
    }

    if (filters.includes('party')) {
      filtered = filtered.filter(user => user.party_friendly)
    }

    if (filters.includes('age')) {
      filtered = filtered.filter(user => user.age >= ageRange.min && user.age <= ageRange.max)
    }

    if (filters.includes('position') && positions.length > 0) {
      filtered = filtered.filter(user => {
        if (!user.position) return positions.includes('Not Specified')
        // Handle position matching (exact match or contains)
        const userPos = user.position
        return positions.some((pos: string) => {
          // Exact match
          if (userPos === pos) return true
          // Handle Vers/Top and Vers/Btm matching
          if (pos === 'Vers/Top' && (userPos === 'Vers/Top' || userPos === 'Vers Top' || (userPos?.includes('Vers') && userPos?.includes('Top')))) return true
          if (pos === 'Vers/Btm' && (userPos === 'Vers/Btm' || userPos === 'Vers Bottom' || (userPos?.includes('Vers') && userPos?.includes('Bottom')))) return true
          // Case-insensitive partial match
          return userPos?.toLowerCase().includes(pos.toLowerCase()) || pos.toLowerCase().includes(userPos?.toLowerCase() || '')
        })
      })
    }

    setFilteredUsers(filtered)
  }, [users, activeFilters])

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white">Loading users...</div>
      </div>
    )
  }


  const handleUserClick = (userId: string) => {
    const user = users.find(u => u.id === userId)
    if (user) {
      setSelectedUser(user)
      setIsModalOpen(true)
      onUserClick?.(userId)
    }
  }

  const handleMessage = async (userId: string) => {
    // Open messaging modal instead of navigating
    const user = users.find(u => u.id === userId)
    if (user) {
      setMessagingUser(user)
      setIsModalOpen(false) // Close profile modal if open
      setIsMessagingOpen(true) // Open messaging modal
    }
  }

  const handleBlock = (userId: string) => {
    console.log('Block user:', userId)
    // In real app, this would block the user
  }

  const handleReport = (userId: string) => {
    console.log('Report user:', userId)
    // In real app, this would report the user
  }

  const handleToggleFavorite = async (userId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        console.error('User not authenticated')
        return
      }

      // Check if already favorited
      const { data: existingFavorite } = await supabase
        .from('favorites')
        .select('id')
        .eq('user_id', user.id)
        .eq('favorited_user_id', userId)
        .maybeSingle()

      if (existingFavorite) {
        // Remove favorite
        const { error } = await supabase
          .from('favorites')
          .delete()
          .eq('id', existingFavorite.id)

        if (error) {
          console.error('Error removing favorite:', error)
          alert('Failed to remove favorite. Please try again.')
        } else {
          setUsers(prev => prev.map(u => 
            u.id === userId ? { ...u, isFavorited: false } : u
          ))
        }
      } else {
        // Add favorite
        const insertData = {
          user_id: user.id,
          created_at: new Date().toISOString(),
          favorited_user_id: userId
        }
        
        const { error: insertError } = await supabase
          .from('favorites')
          .insert(insertData)

        if (insertError) {
          console.error('Error adding favorite:', insertError)
          alert(`Failed to add favorite: ${insertError.message}. Please check if the favorites table exists.`)
        } else {
          setUsers(prev => prev.map(u => 
            u.id === userId ? { ...u, isFavorited: true } : u
          ))
        }
      }
    } catch (err) {
      console.error('Error toggling favorite:', err)
      alert('Failed to toggle favorite. Please try again.')
    }
  }

  return (
    <>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2 p-2">
            {filteredUsers.length > 0 ? filteredUsers.map(user => (
              <ScrollableProfileCard
                key={user.id}
                user={user}
                onUserClick={handleUserClick}
                onMessage={handleMessage}
                onFavorite={handleToggleFavorite}
                isFavorited={user.isFavorited}
                variant="grid"
              />
            )) : (
              <div className="col-span-full text-center py-12">
                <div className="text-white/60 text-lg">
                  {activeFilters.length > 0 ? 'No users match your filters' : 'No users found'}
                </div>
                <div className="text-white/40 text-sm mt-2">
                  {activeFilters.length > 0 ? 'Try adjusting your filters' : 'Check back later for new profiles'}
                </div>
              </div>
            )}
          </div>

      {/* User Profile Modal */}
      <UserProfileModal
        user={selectedUser}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onMessage={handleMessage}
        onBlock={handleBlock}
        onReport={handleReport}
        onFavorite={handleToggleFavorite}
        isFavorited={selectedUser ? users.find(u => u.id === selectedUser.id)?.isFavorited : false}
      />

      {/* Simple Messaging Modal - Opens on grid, doesn't navigate */}
      {isMessagingOpen && messagingUser && (
        <MessagingModal
          user={messagingUser}
          isOpen={isMessagingOpen}
          onClose={() => {
            setIsMessagingOpen(false)
            setMessagingUser(null)
          }}
        />
      )}
    </>
  )
}

