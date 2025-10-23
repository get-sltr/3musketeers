'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import UserProfileModal from './UserProfileModal'
import ScrollableProfileCard from './ScrollableProfileCard'
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
}

interface GridViewProps {
  onUserClick?: (userId: string) => void
}

export default function GridView({ onUserClick }: GridViewProps) {
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [users, setUsers] = useState<User[]>([])
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

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white">Loading users...</div>
      </div>
    )
  }


  const handleUserClick = (user: User) => {
    setSelectedUser(user)
    setIsModalOpen(true)
    onUserClick?.(user.id)
  }

  const handleMessage = async (userId: string) => {
    try {
      const { startConversation } = await import('@/utils/messaging')
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

  return (
    <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
            {users.length > 0 ? users.map(user => (
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
                <div className="text-white/60 text-lg">No users found</div>
                <div className="text-white/40 text-sm mt-2">Check back later for new profiles</div>
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

