'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '../lib/supabase/client'
import UserProfileModal from './UserProfileModal'
import ScrollableProfileCard from './ScrollableProfileCard'
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

export default function GridView({ onUserClick, activeFilters = { filters: [], ageRange: { min: 18, max: 99 }, positions: [] } }: GridViewProps) {
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
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
        
        const { data: profiles, error } = await supabase
          .from('profiles')
          .select('*')
          .order('created_at', { ascending: false })

        if (error) {
          console.error('Error loading profiles:', error)
          return
        }

        // Convert profiles to User format
        let userList: User[] = profiles?.map(profile => ({
          id: profile.id,
          username: profile.username || 'Unknown',
          display_name: profile.display_name || 'Unknown',
          age: profile.age || 18,
          photo: profile.photos?.[0] || profile.photo_url, // Use first photo from photos array
          photos: profile.photos || [],
          distance: '0.5 mi', // TODO: Calculate real distance
          isOnline: profile.online || false,
          bio: profile.about || '',
          position: profile.position,
          party_friendly: profile.party_friendly || false,
          dtfn: profile.dtfn || false,
          tags: profile.tags || [],
          eta: '5 min'
        })) || []

        // Sort to put current user first
        if (currentUser) {
          userList = userList.sort((a, b) => {
            if (a.id === currentUser.id) return -1
            if (b.id === currentUser.id) return 1
            return 0
          })
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
      filtered = filtered.filter(user => user.position && positions.includes(user.position))
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
    try {
      const { startConversation } = await import('../utils/messaging')
      const conversationId = await startConversation(userId)
      
      if (conversationId) {
        // Redirect to messages page with the conversation
        router.push(`/messages?conversation=${conversationId}`)
      } else {
        console.error('Failed to start conversation')
        // Fallback to old behavior
        router.push(`/messages/${userId}`)
      }
    } catch (error) {
      console.error('Error starting conversation:', error)
      // Fallback to old behavior
      router.push(`/messages/${userId}`)
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
      if (!user) return

      const { error } = await supabase
        .from('favorites')
        .upsert({
          user_id: user.id,
          favorite_user_id: userId,
          created_at: new Date().toISOString()
        })

      if (error) {
        console.error('Error toggling favorite:', error)
      } else {
        // Update local state
        setUsers(prev => prev.map(u => 
          u.id === userId ? { ...u, isFavorited: !u.isFavorited } : u
        ))
      }
    } catch (err) {
      console.error('Error toggling favorite:', err)
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
      />
    </>
  )
}

