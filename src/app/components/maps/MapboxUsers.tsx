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

      // Add existing user pins
      users.forEach((u) => addMarker(u))
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
    // In a real implementation we'd diff markers. For now, simple clear-and-add by reloading style is heavy.
    // Lightweight approach: add markers without tracking; acceptable for small sets in MVP.
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
    const el = document.createElement('div')
    
    // Larger pins on mobile for better touch targets
    const isMobile = window.innerWidth < 768
    
    // Style differently for current user
    if (u.isCurrentUser) {
      el.className = 'rounded-full bg-white shadow-lg shadow-white/50 active:scale-110 transition-transform'
      el.style.width = isMobile ? '32px' : '24px'
      el.style.height = isMobile ? '32px' : '24px'
      el.style.border = isMobile ? '5px solid rgba(0, 212, 255, 0.9)' : '4px solid rgba(0, 212, 255, 0.9)'
      el.style.boxShadow = '0 0 20px rgba(255, 255, 255, 0.8)'
    } else {
      el.className = 'rounded-full bg-cyan-400 shadow-lg shadow-cyan-400/50 active:scale-110 transition-transform'
      el.style.width = isMobile ? '28px' : '20px'
      el.style.height = isMobile ? '28px' : '20px'
      el.style.border = isMobile ? '4px solid rgba(0, 0, 0, 0.8)' : '3px solid rgba(0, 0, 0, 0.8)'
      el.style.boxShadow = '0 0 15px rgba(0, 212, 255, 0.6)'
    }

    if (onUserClick) {
      el.style.cursor = 'pointer'
      // Better touch handling
      el.style.touchAction = 'manipulation'
      el.addEventListener('click', (e) => {
        e.stopPropagation() // Prevent map click
        onUserClick(u.id)
      })
    }

    new mapboxgl.Marker(el)
      .setLngLat([u.longitude, u.latitude])
      .setPopup(
        new mapboxgl.Popup({ offset: 12 }).setText(
          u.display_name ? u.display_name : 'User'
        )
      )
      .addTo(mapRef.current)
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


