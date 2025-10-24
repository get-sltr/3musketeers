'use client'

import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import dynamic from 'next/dynamic'
import { useMap } from 'react-leaflet'

// Dynamically import Leaflet components to avoid SSR issues
const MapContainer = dynamic(() => import('react-leaflet').then(mod => mod.MapContainer), { ssr: false })
const TileLayer = dynamic(() => import('react-leaflet').then(mod => mod.TileLayer), { ssr: false })
const Marker = dynamic(() => import('react-leaflet').then(mod => mod.Marker), { ssr: false })
const Popup = dynamic(() => import('react-leaflet').then(mod => mod.Popup), { ssr: false })
// useMap is a hook, not a component, so we'll import it normally

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
}

interface LeafletMapProps {
  onUserClick?: (userId: string) => void
}

// Custom marker component
function UserMarker({ user, onClick }: { user: User, onClick: () => void }) {
  const map = useMap()
  
  const createCustomIcon = (user: User) => {
    const L = require('leaflet')
    
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

  return (
    <Marker
      position={[user.latitude!, user.longitude!]}
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

          {user.tags && user.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-2">
              {user.tags.slice(0, 3).map((tag, index) => (
                <span 
                  key={index}
                  className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs"
                >
                  {tag}
                </span>
              ))}
              {user.tags.length > 3 && (
                <span className="text-xs text-gray-500">+{user.tags.length - 3} more</span>
              )}
            </div>
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

export default function LeafletMap({ onUserClick }: LeafletMapProps) {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null)
  const [mapCenter, setMapCenter] = useState<[number, number]>([-118.2437, 34.0522])
  const [mapZoom, setMapZoom] = useState(12)
  
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
        distance: '0.5 mi', // TODO: Calculate real distance
        isOnline: profile.online || false,
        bio: profile.about || '',
        position: profile.position,
        party_friendly: profile.party_friendly || false,
        dtfn: profile.dtfn || false,
        latitude: profile.latitude,
        longitude: profile.longitude,
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
    <div className="h-full relative">
      {/* Map Container */}
      <div className="w-full h-full rounded-2xl overflow-hidden" style={{ minHeight: '500px' }}>
        <MapContainer
          center={mapCenter}
          zoom={mapZoom}
          style={{ height: '100%', width: '100%' }}
          zoomControl={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
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
                onClick={() => {
                  if (onUserClick) {
                    onUserClick(user.id)
                  }
                }}
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
