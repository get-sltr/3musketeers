'use client'

import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'

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

interface MapViewProps {
  onMarkerClick?: (user: User) => void
  onUserClick?: (userId: string) => void
}

export default function MapView({ onMarkerClick, onUserClick }: MapViewProps) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<mapboxgl.Map | null>(null)
  const markers = useRef<mapboxgl.Marker[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null)
  
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
          
          if (map.current) {
            map.current.setCenter([longitude, latitude])
            map.current.setZoom(12)
          }
        },
        (error) => {
          console.error('Location error:', error)
          // Fallback to Los Angeles
          setUserLocation({ lat: 34.0522, lng: -118.2437 })
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      )
    } else {
      // Fallback to Los Angeles
      setUserLocation({ lat: 34.0522, lng: -118.2437 })
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

  useEffect(() => {
    if (!mapContainer.current || !userLocation) return

    // Initialize map
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      center: [userLocation.lng, userLocation.lat],
      zoom: 12,
      accessToken: process.env.NEXT_PUBLIC_MAPBOX_TOKEN
    })

    // Add user's location marker
    const userMarker = new mapboxgl.Marker({
      color: '#00d4ff',
      scale: 1.2
    })
      .setLngLat([userLocation.lng, userLocation.lat])
      .addTo(map.current)

    // Add navigation controls
    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right')

    // Add geolocate control
    map.current.addControl(
      new mapboxgl.GeolocateControl({
        positionOptions: {
          enableHighAccuracy: true
        },
        trackUserLocation: true,
        showUserHeading: true
      }),
      'top-right'
    )

    return () => {
      if (map.current) {
        map.current.remove()
      }
    }
  }, [userLocation])

  useEffect(() => {
    if (!map.current || users.length === 0) return

    // Clear existing markers
    markers.current.forEach(marker => marker.remove())
    markers.current = []

    // Add user markers
    users.forEach(user => {
      if (!user.latitude || !user.longitude) return

      // Create custom marker element
      const markerEl = document.createElement('div')
      markerEl.className = 'user-marker'
      markerEl.style.cssText = `
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
      `

      // Add user photo or initial
      if (user.photo) {
        markerEl.innerHTML = `
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
        `
      } else {
        markerEl.innerHTML = `
          <span style="
            color: white;
            font-weight: bold;
            font-size: 18px;
          ">${user.username.charAt(0).toUpperCase()}</span>
        `
      }

      // Add status indicators
      const statusEl = document.createElement('div')
      statusEl.style.cssText = `
        position: absolute;
        bottom: -2px;
        right: -2px;
        width: 16px;
        height: 16px;
        border-radius: 50%;
        border: 2px solid white;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 10px;
      `

      if (user.isOnline) {
        statusEl.style.background = '#00ff00'
        statusEl.innerHTML = '●'
      } else {
        statusEl.style.background = '#666'
        statusEl.innerHTML = '○'
      }

      markerEl.appendChild(statusEl)

      // Add party/DTFN indicators
      if (user.party_friendly || user.dtfn) {
        const indicatorEl = document.createElement('div')
        indicatorEl.style.cssText = `
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
        `
        indicatorEl.innerHTML = user.dtfn ? '⚡' : '🥳'
        markerEl.appendChild(indicatorEl)
      }

      // Add hover effect
      markerEl.addEventListener('mouseenter', () => {
        markerEl.style.transform = 'scale(1.1)'
        markerEl.style.zIndex = '1000'
      })

      markerEl.addEventListener('mouseleave', () => {
        markerEl.style.transform = 'scale(1)'
        markerEl.style.zIndex = '1'
      })

      // Add click handler
      markerEl.addEventListener('click', () => {
        if (onMarkerClick) {
          onMarkerClick(user)
        }
        if (onUserClick) {
          onUserClick(user.id)
        }
      })

      // Create marker
      const marker = new mapboxgl.Marker(markerEl)
        .setLngLat([user.longitude, user.latitude])
        .addTo(map.current!)

      markers.current.push(marker)
    })
  }, [users, onMarkerClick, onUserClick])

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
      <div 
        ref={mapContainer} 
        className="w-full h-full rounded-2xl overflow-hidden"
        style={{ minHeight: '500px' }}
      />

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
  )
}