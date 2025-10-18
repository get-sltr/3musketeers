'use client'

import { useEffect, useRef } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'

interface MapViewProps {
  onMarkerClick?: (userId: string) => void
}

export default function MapView({ onMarkerClick }: MapViewProps) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<mapboxgl.Map | null>(null)
  const markers = useRef<mapboxgl.Marker[]>([])

  const mockUsers = [
    {
      id: '1',
      username: 'Alex',
      photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face',
      coordinates: [-118.2437, 34.0522] as [number, number],
      isOnline: true,
    },
    {
      id: '2',
      username: 'Jordan',
      photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=face',
      coordinates: [-118.2537, 34.0622] as [number, number],
      isOnline: true,
    },
    {
      id: '3',
      username: 'Casey',
      photo: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&h=100&fit=crop&crop=face',
      coordinates: [-118.2337, 34.0422] as [number, number],
      isOnline: false,
    },
    {
      id: '4',
      username: 'Riley',
      photo: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100&h=100&fit=crop&crop=face',
      coordinates: [-118.2637, 34.0722] as [number, number],
      isOnline: true,
    },
    {
      id: '5',
      username: 'Morgan',
      photo: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face',
      coordinates: [-118.2237, 34.0322] as [number, number],
      isOnline: false,
    }
  ]

  useEffect(() => {
    if (!mapContainer.current) return
    
    mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || ''
    
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      center: [-118.2437, 34.0522], // Los Angeles
      zoom: 13
    })

    // Add user markers
    mockUsers.forEach(user => {
      // Create custom marker element
      const el = document.createElement('div')
      el.className = 'user-marker'
      el.style.backgroundImage = `url(${user.photo})`
      el.style.width = '48px'
      el.style.height = '48px'
      el.style.borderRadius = '50%'
      el.style.border = '3px solid #00d4ff'
      el.style.cursor = 'pointer'
      el.style.backgroundSize = 'cover'
      el.style.backgroundPosition = 'center'
      el.style.boxShadow = '0 0 20px rgba(0, 212, 255, 0.4)'
      el.style.transition = 'all 0.3s ease'

      // Add hover effect
      el.addEventListener('mouseenter', () => {
        el.style.transform = 'scale(1.1)'
        el.style.borderColor = '#ff00ff'
        el.style.boxShadow = '0 0 30px rgba(255, 0, 255, 0.6)'
      })

      el.addEventListener('mouseleave', () => {
        el.style.transform = 'scale(1)'
        el.style.borderColor = '#00d4ff'
        el.style.boxShadow = '0 0 20px rgba(0, 212, 255, 0.4)'
      })

      el.addEventListener('click', () => {
        onMarkerClick?.(user.id)
      })

      const marker = new mapboxgl.Marker(el)
        .setLngLat(user.coordinates)
        .addTo(map.current!)

      markers.current.push(marker)
    })
    
    return () => {
      markers.current.forEach(marker => marker.remove())
      map.current?.remove()
    }
  }, [onMarkerClick])

  return (
    <div className="p-4">
      <div 
        ref={mapContainer} 
        className="w-full h-[calc(100vh-200px)] rounded-2xl overflow-hidden"
      />
    </div>
  )
}
