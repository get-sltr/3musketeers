'use client'

import { useEffect, useState, useRef } from 'react'
import dynamic from 'next/dynamic'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import UserPin from './UserPin'
import { Location, calculateDistance } from '../../utils/geohash'

// Fix for default markers in Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
})

interface User {
  id: string
  username: string
  display_name?: string
  latitude: number
  longitude: number
  isOnline: boolean
  party_friendly?: boolean
  dtfn?: boolean
  distance?: string
  eta?: string
}

interface LocationMapProps {
  users: User[]
  center?: Location
  onUserClick?: (user: User) => void
  className?: string
}

// Custom marker component with smooth animations
function AnimatedMarker({ user, onUserClick }: { user: User; onUserClick?: (user: User) => void }) {
  const [isVisible, setIsVisible] = useState(false)
  
  useEffect(() => {
    // Fade in animation
    const timer = setTimeout(() => setIsVisible(true), Math.random() * 500)
    return () => clearTimeout(timer)
  }, [])
  
  const customIcon = L.divIcon({
    html: `<div style="transform: translate(-50%, -50%);">${UserPin({ 
      isOnline: user.isOnline, 
      isPartyFriendly: user.party_friendly, 
      isDTFN: user.dtfn,
      size: 32 
    })}</div>`,
    className: 'custom-marker',
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  })
  
  return (
    <Marker
      position={[user.latitude, user.longitude]}
      icon={customIcon}
      eventHandlers={{
        click: () => onUserClick?.(user)
      }}
    >
      <Popup>
        <div className="p-2">
          <h3 className="font-bold text-gray-900">{user.display_name || user.username}</h3>
          {user.distance && <p className="text-sm text-gray-600">{user.distance}</p>}
          {user.eta && <p className="text-sm text-gray-600">{user.eta}</p>}
          <div className="flex gap-1 mt-2">
            {user.party_friendly && <span className="text-sm">🥳</span>}
            {user.dtfn && <span className="text-sm">⚡</span>}
          </div>
        </div>
      </Popup>
    </Marker>
  )
}

// Map component with optimized settings
function MapContent({ users, center, onUserClick }: LocationMapProps) {
  const mapRef = useRef<L.Map>(null)
  
  useEffect(() => {
    if (mapRef.current && center) {
      mapRef.current.setView([center.latitude, center.longitude], 13)
    }
  }, [center])
  
  return (
    <MapContainer
      center={center ? [center.latitude, center.longitude] : [34.0522, -118.2437]}
      zoom={13}
      minZoom={10}
      maxZoom={18}
      className="h-full w-full"
      zoomControl={true}
      scrollWheelZoom={true}
      doubleClickZoom={true}
      touchZoom={true}
      dragging={true}
    >
      {/* Dark theme tile layer */}
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        subdomains="abcd"
        maxZoom={18}
      />
      
      {/* User markers with animations */}
      {users.map((user) => (
        <AnimatedMarker
          key={user.id}
          user={user}
          onUserClick={onUserClick}
        />
      ))}
    </MapContainer>
  )
}

// Main map component with lazy loading
export default function LocationMap(props: LocationMapProps) {
  const [isLoaded, setIsLoaded] = useState(false)
  
  useEffect(() => {
    // Lazy load Leaflet CSS
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = 'https://unpkg.com/leaflet@1.7.1/dist/leaflet.css'
    document.head.appendChild(link)
    
    setIsLoaded(true)
    
    return () => {
      document.head.removeChild(link)
    }
  }, [])
  
  if (!isLoaded) {
    return (
      <div className="h-full w-full bg-gray-900 flex items-center justify-center">
        <div className="text-white">Loading map...</div>
      </div>
    )
  }
  
  return (
    <div className={`relative ${props.className || ''}`}>
      <MapContent {...props} />
      
      <style jsx global>{`
        .custom-marker {
          background: transparent !important;
          border: none !important;
        }
        
        .leaflet-popup-content-wrapper {
          background: rgba(0, 0, 0, 0.8);
          backdrop-filter: blur(10px);
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .leaflet-popup-content {
          color: white;
          margin: 0;
          padding: 0;
        }
        
        .leaflet-popup-tip {
          background: rgba(0, 0, 0, 0.8);
        }
        
        .leaflet-control-zoom {
          background: rgba(0, 0, 0, 0.8) !important;
          backdrop-filter: blur(10px);
          border-radius: 8px;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .leaflet-control-zoom a {
          background: transparent !important;
          color: white !important;
          border: none !important;
        }
        
        .leaflet-control-zoom a:hover {
          background: rgba(255, 255, 255, 0.1) !important;
        }
      `}</style>
    </div>
  )
}
