'use client'

import { useEffect, useRef } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import { getCurrentUserLocation } from '@/app/lib/maps/mapboxUtils'

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN

if (!MAPBOX_TOKEN) {
  console.error('⚠️ MAPBOX TOKEN MISSING: Add NEXT_PUBLIC_MAPBOX_TOKEN to .env.local')
  console.error('Get a free token at: https://account.mapbox.com/access-tokens/')
}

mapboxgl.accessToken = MAPBOX_TOKEN || ''

type UserPin = {
  id: string
  latitude: number
  longitude: number
  display_name?: string
  isCurrentUser?: boolean
  photo?: string
  online?: boolean
  dtfn?: boolean
  party_friendly?: boolean
}

interface MapboxUsersProps {
  users?: UserPin[]
  onUserClick?: (userId: string) => void
  onMapClick?: (lng: number, lat: number) => void
  center?: [number, number] // [lng, lat]
  zoom?: number
  minZoom?: number
  maxZoom?: number
}

export default function MapboxUsers({
  users = [],
  onUserClick,
  onMapClick,
  center,
  zoom = 12,
  minZoom = 2,
  maxZoom = 18,
}: MapboxUsersProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<mapboxgl.Map | null>(null)
  const markersRef = useRef<mapboxgl.Marker[]>([])

  useEffect(() => {
    if (!containerRef.current) return
    if (mapRef.current) return

    const initialCenterPromise = (async (): Promise<[number, number]> => {
      if (center) return center
      try {
        const pos = await getCurrentUserLocation()
        return [pos.longitude, pos.latitude]
      } catch {
        // Los Angeles fallback
        return [-118.2437, 34.0522]
      }
    })()

    initialCenterPromise.then((resolvedCenter) => {
      mapRef.current = new mapboxgl.Map({
        container: containerRef.current as HTMLDivElement,
        style: 'mapbox://styles/mapbox/dark-v11',
        center: resolvedCenter,
        zoom,
        minZoom,
        maxZoom,
        // Mobile optimizations
        touchZoomRotate: true,
        touchPitch: false, // Disable tilt on mobile
        dragRotate: false, // Disable rotation for simpler UX
        pitchWithRotate: false,
        doubleClickZoom: true,
        cooperativeGestures: false // Allow immediate pan/zoom
      })

      // Add navigation controls (smaller on mobile)
      mapRef.current.addControl(
        new mapboxgl.NavigationControl({ showCompass: false }), 
        'top-right'
      )

      // Add click handler for map
      if (onMapClick) {
        mapRef.current.on('click', (e) => {
          onMapClick(e.lngLat.lng, e.lngLat.lat)
        })
      }
    })

    return () => {
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // When users change, update markers
  useEffect(() => {
    if (!mapRef.current) return
    
    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove())
    markersRef.current = []
    
    // Add new markers
    users.forEach((u) => addMarker(u))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [users])

  // Re-center map when center prop changes
  useEffect(() => {
    if (!mapRef.current || !center) return
    mapRef.current.flyTo({
      center: center,
      zoom: 14,
      duration: 1500
    })
  }, [center])

  const addMarker = (u: UserPin) => {
    if (!mapRef.current) return
    
    // Create container
    const container = document.createElement('div')
    container.style.position = 'relative'
    
    // Larger pins on mobile
    const isMobile = window.innerWidth < 768
    const size = isMobile ? '56px' : '48px'
    
    // Create profile image circle
    const img = document.createElement('img')
    img.src = u.photo || 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23111" width="100" height="100"/%3E%3Ctext fill="%23aaa" x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-size="40"%3E👤%3C/text%3E%3C/svg%3E'
    img.style.width = size
    img.style.height = size
    img.style.borderRadius = '50%'
    img.style.objectFit = 'cover'
    img.style.display = 'block'
    
    // Neon glow border style
    if (u.isCurrentUser) {
      // Your pin: white glow with cyan border + pulse animation
      img.style.border = '4px solid rgba(255, 255, 255, 0.9)'
      img.style.boxShadow = '0 0 20px rgba(255, 255, 255, 0.8), 0 0 40px rgba(0, 212, 255, 0.6), inset 0 0 20px rgba(0, 212, 255, 0.3)'
      img.style.animation = 'pulse-glow 2s ease-in-out infinite'
    } else if (u.online) {
      // Online: bright cyan glow + pulse
      img.style.border = '3px solid rgba(0, 212, 255, 0.9)'
      img.style.boxShadow = '0 0 20px rgba(0, 212, 255, 0.8), 0 0 30px rgba(0, 212, 255, 0.5)'
      img.style.animation = 'pulse-glow 3s ease-in-out infinite'
    } else {
      // Offline: dim cyan glow
      img.style.border = '3px solid rgba(0, 212, 255, 0.4)'
      img.style.boxShadow = '0 0 10px rgba(0, 212, 255, 0.3)'
    }
    
    img.style.transition = 'transform 0.2s ease'
    container.appendChild(img)

    // Touch handling
    if (onUserClick) {
      container.style.cursor = 'pointer'
      container.style.touchAction = 'manipulation'
      container.addEventListener('click', (e) => {
        e.stopPropagation()
        onUserClick(u.id)
      })
      // Scale on hover/active
      container.addEventListener('mouseenter', () => {
        img.style.transform = 'scale(1.1)'
      })
      container.addEventListener('mouseleave', () => {
        img.style.transform = 'scale(1)'
      })
    }

    // Add global pulse animation styles
    if (!document.getElementById('map-pin-styles')) {
      const style = document.createElement('style')
      style.id = 'map-pin-styles'
      style.textContent = `
        @keyframes pulse-glow {
          0%, 100% { filter: brightness(1) drop-shadow(0 0 8px rgba(0, 212, 255, 0.8)); }
          50% { filter: brightness(1.2) drop-shadow(0 0 16px rgba(0, 212, 255, 1)); }
        }
      `
      document.head.appendChild(style)
    }

    const marker = new mapboxgl.Marker(container)
      .setLngLat([u.longitude, u.latitude])
      .setPopup(
        new mapboxgl.Popup({ offset: 12 }).setText(
          u.display_name ? u.display_name : 'User'
        )
      )
      .addTo(mapRef.current)
    
    // Track marker for cleanup
    markersRef.current.push(marker)
  }

  if (!MAPBOX_TOKEN) {
    return (
      <div className="w-full h-screen overflow-hidden bg-black flex items-center justify-center">
        <div className="text-center p-8 glass-bubble max-w-md">
          <div className="text-6xl mb-4">🗺️</div>
          <h3 className="text-white text-xl font-bold mb-2">Mapbox Token Missing</h3>
          <p className="text-white/60 mb-4">To use the map feature, add your Mapbox access token to .env.local:</p>
          <code className="bg-black/50 text-cyan-400 px-3 py-2 rounded block mb-4 text-sm">
            NEXT_PUBLIC_MAPBOX_TOKEN=your_token_here
          </code>
          <a 
            href="https://account.mapbox.com/access-tokens/" 
            target="_blank"
            rel="noopener noreferrer"
            className="text-cyan-400 hover:text-cyan-300 underline text-sm"
          >
            Get a free token from Mapbox →
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full h-screen overflow-hidden">
      <div ref={containerRef} className="w-full h-full" />
    </div>
  )
}


