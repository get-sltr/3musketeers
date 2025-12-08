'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import dynamic from 'next/dynamic'
import ScrollableProfileCard from './ScrollableProfileCard'

// Dynamically import Leaflet components to avoid SSR issues
const MapContainer = dynamic(() => import('react-leaflet').then(mod => mod.MapContainer), { 
  ssr: false,
  loading: () => <div className="h-full flex items-center justify-center"><div className="animate-spin w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full"></div></div>
})
const TileLayer = dynamic(() => import('react-leaflet').then(mod => mod.TileLayer), { ssr: false })
const Marker = dynamic(() => import('react-leaflet').then(mod => mod.Marker), { ssr: false })
const Popup = dynamic(() => import('react-leaflet').then(mod => mod.Popup), { ssr: false })

interface User {
  id: string
  username: string
  display_name?: string
  age: number
  photo?: string
  photos?: string[]
  distance?: string
  isOnline: boolean
  bio?: string
  position?: string
  party_friendly?: boolean
  dtfn?: boolean
  latitude: number
  longitude: number
  isFavorited?: boolean
}

interface MapViewProps {
  onMarkerClick?: (user: User) => void
  onUserClick?: (userId: string) => void
}

export default function MapView({ onMarkerClick, onUserClick }: MapViewProps) {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null)
  const [mapCenter, setMapCenter] = useState<[number, number]>([-118.2437, 34.0522])
  const [mapZoom, setMapZoom] = useState(12)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  
  const supabase = createClient()

  useEffect(() => {
    loadUsers()
    getUserLocation()
  }, [])

  const getUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords
          setUserLocation({ lat: latitude, lng: longitude })
          setMapCenter([longitude, latitude])
          setMapZoom(12)
        },
        (error) => {
          // Silently handle geolocation errors (expected when permission denied/unavailable)
          if (process.env.NODE_ENV === 'development') {
            console.warn('Geolocation unavailable, using default location:', error.code)
          }
          // Fallback to Los Angeles
          setUserLocation({ lat: 34.0522, lng: -118.2437 })
          setMapCenter([-118.2437, 34.0522])
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      )
    } else {
      // Fallback to Los Angeles
      setUserLocation({ lat: 34.0522, lng: -118.2437 })
      setMapCenter([-118.2437, 34.0522])
    }
  }

  const loadUsers = async () => {
    try {
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('*')
        .not('latitude', 'is', null)
        .not('longitude', 'is', null)

      if (error) {
        console.error('Error loading users:', error)
        return
      }

      const userList: User[] = (profiles || []).map((profile: any) => ({
        id: profile.id,
        username: profile.username,
        display_name: profile.display_name,
        age: profile.age,
        photo: profile.photos?.[0],
        photos: profile.photos,
        distance: profile.distance,
        isOnline: profile.is_online || false,
        bio: profile.bio,
        position: profile.position,
        party_friendly: profile.party_friendly,
        dtfn: profile.dtfn,
        latitude: profile.latitude,
        longitude: profile.longitude
      })) || []

      setUsers(userList)
    } catch (err) {
      console.error('Error loading users:', err)
    } finally {
      setLoading(false)
    }
  }

  // Advanced user interaction handlers
  const handleUserClick = useCallback((userId: string) => {
    const user = users.find(u => u.id === userId)
    if (user) {
      setSelectedUser(user)
      setMapCenter([user.longitude, user.latitude])
      setMapZoom(15)
    }
    if (onUserClick) onUserClick(userId)
  }, [users, onUserClick])

  const handleMessage = useCallback((userId: string) => {
    console.log('Message user:', userId)
    // TODO: Implement messaging functionality
  }, [])

  const handleFavorite = useCallback((userId: string) => {
    console.log('Favorite user:', userId)
    // TODO: Implement favorite functionality
  }, [])

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-white/60">Loading map...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex">
      {/* Map Section */}
      <div className="flex-1 relative">
      {/* Map Container */}
      {userLocation && (
        <MapContainer
          center={mapCenter}
          zoom={mapZoom}
          className="w-full h-full rounded-2xl overflow-hidden"
          style={{ minHeight: '500px' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          {/* User's location marker */}
          <Marker position={[userLocation.lat, userLocation.lng]}>
            <Popup>
              <div className="text-center">
                <div className="w-4 h-4 bg-cyan-500 rounded-full mx-auto mb-2"></div>
                <p className="text-sm font-semibold">You are here</p>
              </div>
            </Popup>
          </Marker>
          
          {/* User markers */}
          {users.map((user) => (
            <Marker 
              key={user.id} 
              position={[user.latitude, user.longitude]}
              eventHandlers={{
                click: () => {
                  setSelectedUser(user)
                  setMapCenter([user.longitude, user.latitude])
                  setMapZoom(15)
                  if (onMarkerClick) onMarkerClick(user)
                  if (onUserClick) onUserClick(user.id)
                }
              }}
            >
              <Popup>
                <div className="text-center p-2">
                  {user.photo && (
                    <img 
                      src={user.photo} 
                      alt={user.display_name || user.username}
                      className="w-12 h-12 rounded-full mx-auto mb-2 object-cover"
                    />
                  )}
                  <h3 className="font-semibold text-sm">{user.display_name || user.username}</h3>
                  <p className="text-xs text-gray-600">{user.age} years old</p>
                  {user.distance && (
                    <p className="text-xs text-blue-600">{user.distance} away</p>
                  )}
                  <div className="flex gap-1 mt-2">
                    {user.isOnline && (
                      <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    )}
                    {user.party_friendly && (
                      <span className="text-yellow-400">🥳</span>
                    )}
                    {user.dtfn && (
                      <span className="text-red-400">⚡</span>
                    )}
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      )}

      {/* Map Controls Overlay */}
      <div className="absolute top-4 left-4 space-y-2">
        <div className="glass-bubble px-4 py-2">
          <div className="flex items-center gap-2 text-white text-sm">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span>{users.filter(u => u.isOnline).length} online</span>
          </div>
        </div>
        
        <div className="glass-bubble px-4 py-2">
          <div className="flex items-center gap-2 text-white text-sm">
            <div className="w-3 h-3 bg-cyan-500 rounded-full"></div>
            <span>{users.length} nearby</span>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 glass-bubble p-4 rounded-xl">
        <h4 className="text-white font-semibold mb-2 text-sm">Status</h4>
        <div className="space-y-1 text-xs text-white/80">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span>Online</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
            <span>Offline</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-yellow-400">🥳</span>
            <span>Party Friendly</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-red-400">⚡</span>
            <span>DTFN</span>
          </div>
        </div>
      </div>

      {/* Custom Styles */}
      <style jsx>{`
        .user-marker:hover {
          transform: scale(1.1) !important;
          z-index: 1000 !important;
        }
      `}</style>
      </div>

      {/* Profile Cards Section */}
      <div className="w-80 bg-black/50 border-l border-white/10 p-4 overflow-y-auto">
        <div className="mb-4">
          <h3 className="text-white font-bold text-lg mb-2">Nearby Users</h3>
          <p className="text-white/60 text-sm">Scroll to see more profiles</p>
        </div>

        <div className="space-y-4">
          {users.map((user) => (
            <ScrollableProfileCard
              key={user.id}
              user={user}
              onUserClick={handleUserClick}
              onMessage={handleMessage}
              onFavorite={handleFavorite}
              isFavorited={user.isFavorited || false}
              variant="map"
            />
          ))}
        </div>

        {users.length === 0 && (
          <div className="text-center py-8">
            <div className="text-4xl mb-2">📍</div>
            <p className="text-white/60">No users nearby</p>
            <p className="text-white/40 text-sm">Check back later for new profiles</p>
          </div>
        )}
      </div>
    </div>
  )
}