'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import dynamic from 'next/dynamic'
import ScrollableProfileCard from './ScrollableProfileCard'
import { MapLoadingSkeleton } from './LoadingSkeleton'

// Dynamically import Leaflet components
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
  latitude?: number
  longitude?: number
  eta?: string
  tags?: string[]
  kinks?: string[]
  isFavorited?: boolean
}

interface MapWithProfilesProps {
  onUserClick?: (userId: string) => void
}

// Custom marker component
function UserMarker({ user, onClick }: { user: User, onClick: () => void }) {
  // Dynamically import leaflet to avoid SSR issues
  const [L, setL] = useState<any>(null)
  
  useEffect(() => {
    import('leaflet').then(leaflet => {
      setL(leaflet.default)
    })
  }, [])
  
  if (!L) return null
  
  const createCustomIcon = (user: User) => {
    const iconHtml = `
      <div style="
        width: 50px;
        height: 50px;
        border-radius: 50%;
        background: linear-gradient(135deg, #00d4ff, #ff00ff);
        border: 3px solid white;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        position: relative;
        transition: all 0.3s ease;
        overflow: hidden;
      ">
        ${user.photo ? `
          <img 
            src="${user.photo}" 
            alt="${user.username}"
            style="
              width: 44px;
              height: 44px;
              border-radius: 50%;
              object-fit: cover;
            "
          />
        ` : `
          <span style="
            color: white;
            font-weight: bold;
            font-size: 18px;
          ">${user.username.charAt(0).toUpperCase()}</span>
        `}
        <div style="
          position: absolute;
          bottom: -2px;
          right: -2px;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          border: 2px solid white;
          background: ${user.isOnline ? '#00ff00' : '#666'};
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 10px;
          color: white;
        ">${user.isOnline ? '●' : '○'}</div>
        ${user.party_friendly || user.dtfn ? `
          <div style="
            position: absolute;
            top: -5px;
            right: -5px;
            width: 20px;
            height: 20px;
            border-radius: 50%;
            background: ${user.dtfn ? '#ff4444' : '#ffaa00'};
            border: 2px solid white;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 12px;
          ">${user.dtfn ? '⚡' : '🥳'}</div>
        ` : ''}
      </div>
    `
    
    return L.divIcon({
      html: iconHtml,
      className: 'custom-user-marker',
      iconSize: [50, 50],
      iconAnchor: [25, 25],
      popupAnchor: [0, -25]
    })
  }

  const icon = createCustomIcon(user)
  const jitteredCoords = {
    lat: user.latitude! + (Math.random() - 0.5) * 0.001,
    lng: user.longitude! + (Math.random() - 0.5) * 0.001
  }

  return (
    <Marker
      position={[jitteredCoords.lat, jitteredCoords.lng]}
      icon={icon}
      eventHandlers={{
        click: onClick
      }}
    >
      <Popup>
        <div className="p-2 min-w-[200px]">
          <div className="flex items-center gap-3 mb-2">
            {user.photo ? (
              <img 
                src={user.photo} 
                alt={user.username}
                className="w-12 h-12 rounded-full object-cover"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-gradient-to-r from-cyan-500 to-purple-500 flex items-center justify-center text-white font-bold">
                {user.username.charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <h3 className="font-bold text-gray-900">{user.display_name || user.username}</h3>
              <p className="text-sm text-gray-600">{user.age} years old</p>
              {user.position && (
                <p className="text-xs text-gray-500">{user.position}</p>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-2 mb-2">
            {user.party_friendly && (
              <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs">
                🥳 Party
              </span>
            )}
            {user.dtfn && (
              <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs">
                ⚡ DTFN
              </span>
            )}
            <span className={`px-2 py-1 rounded-full text-xs ${
              user.isOnline 
                ? 'bg-green-100 text-green-800' 
                : 'bg-gray-100 text-gray-800'
            }`}>
              {user.isOnline ? 'Online' : 'Offline'}
            </span>
          </div>

          {user.bio && (
            <p className="text-sm text-gray-700 mb-2">{user.bio}</p>
          )}

          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>{user.distance || '0.5 mi'}</span>
            <span>{user.eta || '5 min'}</span>
          </div>
        </div>
      </Popup>
    </Marker>
  )
}

export default function MapWithProfiles({ onUserClick }: MapWithProfilesProps) {
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
          console.error('Location error:', error)
          setUserLocation({ lat: 34.0522, lng: -118.2437 })
          setMapCenter([-118.2437, 34.0522])
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      )
    } else {
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
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error loading profiles:', error)
        return
      }

      const userList: User[] = profiles?.map(profile => ({
        id: profile.id,
        username: profile.username || 'Unknown',
        display_name: profile.display_name,
        age: profile.age || 18,
        photo: profile.photos?.[0] || profile.photo_url,
        photos: profile.photos || [],
        distance: '0.5 mi',
        isOnline: profile.online || false,
        bio: profile.about || '',
        position: profile.position,
        party_friendly: profile.party_friendly || false,
        dtfn: profile.dtfn || false,
        latitude: profile.latitude,
        longitude: profile.longitude,
        tags: profile.tags || [],
        kinks: profile.kinks || [],
        eta: '5 min',
        isFavorited: false
      })) || []

      setUsers(userList)
    } catch (err) {
      console.error('Error loading users:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleUserClick = (userId: string) => {
    const user = users.find(u => u.id === userId)
    if (user) {
      setSelectedUser(user)
    }
    if (onUserClick) {
      onUserClick(userId)
    }
  }

  const handleMessage = (userId: string) => {
    console.log('Message user:', userId)
    // TODO: Implement messaging
  }

  const handleFavorite = (userId: string) => {
    console.log('Toggle favorite:', userId)
    // TODO: Implement favorites
  }

  if (loading) {
    return <MapLoadingSkeleton />
  }

  return (
    <div className="h-full flex">
      {/* Map Section */}
      <div className="flex-1 relative">
        <div className="w-full h-full rounded-2xl overflow-hidden" style={{ minHeight: '500px' }}>
          <MapContainer
            center={mapCenter}
            zoom={mapZoom}
            style={{ height: '100%', width: '100%' }}
            zoomControl={true}
            minZoom={8}
            maxZoom={18}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              maxZoom={18}
              minZoom={8}
            />
            
            {/* User's location marker */}
            {userLocation && (
              <Marker position={[userLocation.lng, userLocation.lat]}>
                <Popup>
                  <div className="text-center">
                    <p className="font-bold text-blue-600">Your Location</p>
                  </div>
                </Popup>
              </Marker>
            )}

            {/* User markers */}
            {users.map((user) => (
              user.latitude && user.longitude && (
                <UserMarker
                  key={user.id}
                  user={user}
                  onClick={() => handleUserClick(user.id)}
                />
              )
            ))}
          </MapContainer>
        </div>

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
              isFavorited={user.isFavorited}
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

      {/* Custom Styles */}
      <style jsx global>{`
        .leaflet-container {
          background: #1a1a1a !important;
        }
        
        .custom-user-marker {
          background: transparent !important;
          border: none !important;
        }
        
        .leaflet-popup-content-wrapper {
          background: white;
          border-radius: 12px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
        }
        
        .leaflet-popup-tip {
          background: white;
        }
      `}</style>
    </div>
  )
}
