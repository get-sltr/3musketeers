'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import UserProfileModal from './UserProfileModal'
import UserCard from './UserCard'
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
        const { data: profiles, error } = await supabase
          .from('profiles')
          .select('*')
          .order('last_active', { ascending: false })

        if (error) {
          console.error('Error loading profiles:', error)
          return
        }

        // Convert profiles to User format
        const userList: User[] = profiles?.map(profile => ({
          id: profile.id,
          username: profile.username || 'Unknown',
          display_name: profile.display_name,
          age: profile.age || 18,
          photo: profile.photo_url,
          photos: profile.photos || [profile.photo_url].filter(Boolean),
          distance: '0.5 mi', // TODO: Calculate real distance
          isOnline: profile.online || false,
          bio: profile.about || '',
          position: profile.position,
          party_friendly: profile.party_friendly || false,
          dtfn: profile.dtfn || false,
          tags: profile.tags || [],
          eta: '5 min'
        })) || []

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

  const handleMessage = (userId: string) => {
    router.push(`/messages/${userId}`)
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
          <UserCard
            key={user.id}
            user={user}
            onClick={handleUserClick}
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

