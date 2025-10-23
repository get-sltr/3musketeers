'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import UserProfileModal from './UserProfileModal'
import { useLocation } from '../hooks/useLocation'
// import { useSocket } from '../hooks/useSocket'
import { calculateDistance } from '../utils/geohash'

interface User {
  id: string
  username: string
  age: number
  photo: string
  distance: string
  isOnline: boolean
  photos?: string[]
  bio?: string
  position?: string
  party_friendly?: boolean
  dtfn?: boolean
  latitude?: number
  longitude?: number
  eta?: string
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
  
  // New location hooks (Socket.io temporarily disabled)
  const { location, error: locationError } = useLocation()
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
          username: profile.display_name || 'Unknown',
          age: profile.age || 18,
          photo: profile.photo_url || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400',
          distance: '0.5 mi', // TODO: Calculate real distance
          isOnline: profile.online || false,
          photos: [profile.photo_url || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400'],
          bio: profile.about || '',
          position: profile.position,
          party_friendly: profile.party_friendly || false,
          dtfn: profile.dtfn || false
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
          <div 
            key={user.id}
            onClick={() => handleUserClick(user)}
            className="glass-bubble cursor-pointer p-4 group hover:scale-105 transition-all duration-300"
          >
            {/* Photo Container */}
            <div className="relative mb-3">
              <img
                src={user.photo}
                alt={user.username}
                className="w-full aspect-[3/4] object-cover rounded-2xl"
              />
              
              {/* Online Indicator */}
              {user.isOnline && (
                <div 
                  className="absolute top-2 right-2 w-3 h-3 rounded-full"
                  style={{
                    background: 'rgba(0, 255, 0, 0.8)',
                    boxShadow: '0 0 10px rgba(0, 255, 0, 0.5)'
                  }}
                />
              )}

              {/* Status Badges */}
              {(user.party_friendly || user.dtfn) && (
                <div className="absolute top-2 left-2 flex gap-1">
                  {user.party_friendly && (
                    <div className="glass-bubble px-2 py-1 text-sm">
                      <span>🥳</span>
                    </div>
                  )}
                  {user.dtfn && (
                    <div className="glass-bubble px-2 py-1 text-sm">
                      <span>⚡</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* User Info */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <h3 className="text-white font-semibold text-lg">
                  {user.username}
                </h3>
                <span className="text-white/60 text-lg">{user.age}</span>
              </div>
              
              <p className="text-white/70 text-sm">
                {user.distance} away
              </p>
              {user.position && (
                <p className="text-white/50 text-xs">
                  {user.position}
                </p>
              )}
            </div>
          </div>
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

