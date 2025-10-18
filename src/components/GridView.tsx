'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import UserProfileModal from './UserProfileModal'

interface User {
  id: string
  username: string
  age: number
  photo: string
  distance: string
  isOnline: boolean
  photos?: string[]
  bio?: string
}

interface GridViewProps {
  onUserClick?: (userId: string) => void
}

export default function GridView({ onUserClick }: GridViewProps) {
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const router = useRouter()
  const mockUsers: User[] = [
    {
      id: '1',
      username: 'Alex',
      age: 25,
      photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=600&fit=crop&crop=face',
      distance: '0.5 mi',
      isOnline: true,
      photos: [
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=600&fit=crop&crop=face',
        'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=600&fit=crop&crop=face',
        'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=600&fit=crop&crop=face'
      ],
      bio: 'Love hiking, photography, and good coffee. Always up for an adventure!'
    },
    {
      id: '2',
      username: 'Jordan',
      age: 28,
      photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=600&fit=crop&crop=face',
      distance: '1.2 mi',
      isOnline: true,
      photos: [
        'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=600&fit=crop&crop=face',
        'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=400&h=600&fit=crop&crop=face'
      ],
      bio: 'Fitness enthusiast and foodie. Let\'s grab a workout and then some amazing food!'
    },
    {
      id: '3',
      username: 'Casey',
      age: 23,
      photo: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=600&fit=crop&crop=face',
      distance: '2.1 mi',
      isOnline: false,
      photos: [
        'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=600&fit=crop&crop=face',
        'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=600&fit=crop&crop=face'
      ],
      bio: 'Artist and musician. Love creating and exploring new places.'
    },
    {
      id: '4',
      username: 'Riley',
      age: 26,
      photo: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=400&h=600&fit=crop&crop=face',
      distance: '0.8 mi',
      isOnline: true,
      photos: [
        'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=400&h=600&fit=crop&crop=face'
      ],
      bio: 'Tech professional by day, chef by night. Always experimenting with new recipes!'
    },
    {
      id: '5',
      username: 'Morgan',
      age: 24,
      photo: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=600&fit=crop&crop=face',
      distance: '1.5 mi',
      isOnline: false,
      photos: [
        'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=600&fit=crop&crop=face',
        'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=600&fit=crop&crop=face'
      ],
      bio: 'Travel blogger and adventure seeker. Let\'s explore the world together!'
    },
    {
      id: '6',
      username: 'Taylor',
      age: 27,
      photo: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=600&fit=crop&crop=face',
      distance: '3.2 mi',
      isOnline: true,
      photos: [
        'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=600&fit=crop&crop=face'
      ],
      bio: 'Yoga instructor and wellness coach. Let\'s find balance together!'
    },
    {
      id: '7',
      username: 'Avery',
      age: 22,
      photo: 'https://images.unsplash.com/photo-1507591064344-4c6ce005b128?w=400&h=600&fit=crop&crop=face',
      distance: '0.3 mi',
      isOnline: true,
      photos: [
        'https://images.unsplash.com/photo-1507591064344-4c6ce005b128?w=400&h=600&fit=crop&crop=face'
      ],
      bio: 'Student and aspiring entrepreneur. Love learning and growing!'
    },
    {
      id: '8',
      username: 'Quinn',
      age: 29,
      photo: 'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=400&h=600&fit=crop&crop=face',
      distance: '2.8 mi',
      isOnline: false,
      photos: [
        'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=400&h=600&fit=crop&crop=face'
      ],
      bio: 'Engineer and outdoor enthusiast. Always up for a challenge!'
    },
    {
      id: '9',
      username: 'Sage',
      age: 25,
      photo: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=600&fit=crop&crop=face',
      distance: '1.7 mi',
      isOnline: true,
      photos: [
        'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=600&fit=crop&crop=face'
      ],
      bio: 'Writer and book lover. Let\'s discuss our favorite stories!'
    }
  ]

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
        {mockUsers.map(user => (
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
            </div>
          </div>
        ))}
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
