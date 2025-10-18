'use client'

interface User {
  id: string
  username: string
  age: number
  photo: string
  distance: string
  isOnline: boolean
}

interface GridViewProps {
  onUserClick?: (userId: string) => void
}

export default function GridView({ onUserClick }: GridViewProps) {
  const mockUsers: User[] = [
    {
      id: '1',
      username: 'Alex',
      age: 25,
      photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=600&fit=crop&crop=face',
      distance: '0.5 mi',
      isOnline: true,
    },
    {
      id: '2',
      username: 'Jordan',
      age: 28,
      photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=600&fit=crop&crop=face',
      distance: '1.2 mi',
      isOnline: true,
    },
    {
      id: '3',
      username: 'Casey',
      age: 23,
      photo: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=600&fit=crop&crop=face',
      distance: '2.1 mi',
      isOnline: false,
    },
    {
      id: '4',
      username: 'Riley',
      age: 26,
      photo: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=400&h=600&fit=crop&crop=face',
      distance: '0.8 mi',
      isOnline: true,
    },
    {
      id: '5',
      username: 'Morgan',
      age: 24,
      photo: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=600&fit=crop&crop=face',
      distance: '1.5 mi',
      isOnline: false,
    },
    {
      id: '6',
      username: 'Taylor',
      age: 27,
      photo: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=600&fit=crop&crop=face',
      distance: '3.2 mi',
      isOnline: true,
    },
    {
      id: '7',
      username: 'Avery',
      age: 22,
      photo: 'https://images.unsplash.com/photo-1507591064344-4c6ce005b128?w=400&h=600&fit=crop&crop=face',
      distance: '0.3 mi',
      isOnline: true,
    },
    {
      id: '8',
      username: 'Quinn',
      age: 29,
      photo: 'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=400&h=600&fit=crop&crop=face',
      distance: '2.8 mi',
      isOnline: false,
    },
    {
      id: '9',
      username: 'Sage',
      age: 25,
      photo: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=600&fit=crop&crop=face',
      distance: '1.7 mi',
      isOnline: true,
    }
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
      {mockUsers.map(user => (
        <div 
          key={user.id}
          onClick={() => onUserClick?.(user.id)}
          className="glass-bubble cursor-pointer p-4 group"
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
  )
}
