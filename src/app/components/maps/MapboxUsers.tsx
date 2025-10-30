'use client'

import { useEffect, useRef } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import { getCurrentUserLocation } from '@/app/lib/maps/mapboxUtils'

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN as string

type UserPin = {
  id: string
  latitude: number
  longitude: number
  display_name?: string
}

interface MapboxUsersProps {
  users?: UserPin[]
  onUserClick?: (userId: string) => void
  center?: [number, number] // [lng, lat]
  zoom?: number
  minZoom?: number
  maxZoom?: number
}

export default function MapboxUsers({
  users = [],
  onUserClick,
  center,
  zoom = 12,
  minZoom = 2,
  maxZoom = 16,
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
        style: 'mapbox://styles/mapbox/streets-v11',
        center: resolvedCenter,
        zoom,
        minZoom,
        maxZoom,
      })

      mapRef.current.addControl(new mapboxgl.NavigationControl(), 'top-right')

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

  const addMarker = (u: UserPin) => {
    if (!mapRef.current) return
    const el = document.createElement('div')
    el.className = 'rounded-full bg-cyan-500 shadow-lg shadow-cyan-500/30'
    el.style.width = '14px'
    el.style.height = '14px'
    el.style.border = '2px solid white'

    if (onUserClick) {
      el.style.cursor = 'pointer'
      el.addEventListener('click', () => onUserClick(u.id))
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

  return (
    <div className="w-full h-[500px] md:h-[600px] rounded-xl overflow-hidden">
      <div ref={containerRef} className="w-full h-full" />
    </div>
  )
}


