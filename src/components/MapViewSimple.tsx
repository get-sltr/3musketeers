'use client'

import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

// Simple Mapbox map component using CDN approach
export default function MapViewSimple() {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<any>(null)
  const [users, setUsers] = useState<any[]>([])
  const [currentLocation, setCurrentLocation] = useState<[number, number] | null>(null)
  const supabase = createClient()

  // Get user's location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCurrentLocation([position.coords.longitude, position.coords.latitude])
        },
        (error) => {
          console.error('Error getting location:', error)
          // Default to LA if location fails
          setCurrentLocation([-118.2437, 34.0522])
        }
      )
    } else {
      setCurrentLocation([-118.2437, 34.0522])
    }
  }, [])

  // Load nearby users
  useEffect(() => {
    async function loadUsers() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { data: profile } = await supabase
          .from('profiles')
          .select('latitude, longitude')
          .eq('id', user.id)
          .single()

        if (!profile?.latitude || !profile?.longitude) return

        const { data } = await supabase
          .from('profiles')
          .select('*')
          .neq('id', user.id)
          .not('latitude', 'is', null)
          .not('longitude', 'is', null)
          .limit(50)

        if (data) {
          setUsers(data)
        }
      } catch (error) {
        console.error('Error loading users:', error)
      }
    }

    loadUsers()
  }, [])

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || !currentLocation || map.current) return

    // Wait for mapboxgl to be available from CDN
    const initMap = () => {
      if (typeof window !== 'undefined' && (window as any).mapboxgl) {
        const mapboxgl = (window as any).mapboxgl
        mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || 'pk.eyJ1Ijoic2x0ciIsImEiOiJjbWdtdXE0MWoxNGd5MmpweDZsZ3ExdmwzIn0.VboEWsoaBpPkIW8xKQdY8w'

        map.current = new mapboxgl.Map({
          container: mapContainer.current!,
          style: 'mapbox://styles/mapbox/dark-v11',
          center: currentLocation,
          zoom: 13,
          pitch: 45,
          bearing: 0
        })

        // Add navigation controls
        map.current.addControl(new mapboxgl.NavigationControl(), 'top-right')

        // Add current user marker (blue)
        new mapboxgl.Marker({ color: '#00d4ff' })
          .setLngLat(currentLocation)
          .setPopup(new mapboxgl.Popup().setHTML('<strong>You are here</strong>'))
          .addTo(map.current)

        // Add other users as markers
        users.forEach((user) => {
          if (user.latitude && user.longitude) {
            const el = document.createElement('div')
            el.className = 'user-marker'
            el.style.cssText = `
              width: 40px;
              height: 40px;
              border-radius: 50%;
              background: ${user.dtfn ? '#00d4ff' : '#ff00ff'};
              border: 3px solid white;
              cursor: pointer;
              box-shadow: 0 2px 8px rgba(0,0,0,0.3);
            `
            if (user.online) {
              el.style.border = '3px solid #00ff00'
            }

            const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(`
              <div style="padding: 8px;">
                <strong>${user.display_name || 'Anonymous'}</strong>
                ${user.age ? `, ${user.age}` : ''}
                <br/>
                ${user.dtfn ? '<span style="color: #00d4ff;">⚡ DTFN</span>' : ''}
                ${user.online ? '<span style="color: #00ff00;">● Online</span>' : ''}
              </div>
            `)

            new mapboxgl.Marker(el)
              .setLngLat([user.longitude, user.latitude])
              .setPopup(popup)
              .addTo(map.current)

            // Click to view profile
            el.addEventListener('click', () => {
              window.location.href = `/profile/${user.id}`
            })
          }
        })
      } else {
        // Retry if mapboxgl not loaded yet
        setTimeout(initMap, 100)
      }
    }

    initMap()

    return () => {
      if (map.current) {
        map.current.remove()
        map.current = null
      }
    }
  }, [currentLocation, users])

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <div ref={mapContainer} style={{ width: '100%', height: '100%' }} />

      {!currentLocation && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          background: 'rgba(0,0,0,0.8)',
          padding: '20px',
          borderRadius: '10px',
          color: 'white'
        }}>
          Loading map...
        </div>
      )}
    </div>
  )
}
