'use client'

import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { createSLTRMapboxMarker, cleanupSLTRMarker } from '@/components/SLTRMapPin'
import { resolveProfilePhoto } from '@/lib/utils/profile'

// PIN STYLE FUNCTIONS
const createPinStyle1 = (user: any) => {
  const el = document.createElement('div')
  el.className = 'custom-marker'
  el.style.cssText = `
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(0, 217, 255, 1) 0%, rgba(0, 217, 255, 0.6) 70%, transparent 100%);
    box-shadow: 0 0 20px rgba(0, 217, 255, 0.8), 0 0 40px rgba(0, 217, 255, 0.4), inset 0 0 10px rgba(255, 255, 255, 0.3);
    cursor: pointer;
    transition: all 0.3s ease;
    border: 2px solid rgba(0, 217, 255, 0.9);
  `
  if (user.profile_photo_url) {
    el.innerHTML = `<img src="${user.profile_photo_url}" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover; opacity: 0.9;" />`
  }
  el.addEventListener('mouseenter', () => {
    el.style.transform = 'scale(1.2)'
    el.style.boxShadow = '0 0 30px rgba(0, 217, 255, 1), 0 0 60px rgba(0, 217, 255, 0.6)'
  })
  el.addEventListener('mouseleave', () => {
    el.style.transform = 'scale(1)'
    el.style.boxShadow = '0 0 20px rgba(0, 217, 255, 0.8), 0 0 40px rgba(0, 217, 255, 0.4)'
  })
  return el
}

const createPinStyle2 = (user: any) => {
  const el = document.createElement('div')
  el.className = 'custom-marker'
  el.style.cssText = `
    width: 40px;
    height: 40px;
    transform: rotate(45deg);
    background: linear-gradient(135deg, rgba(255, 0, 255, 1) 0%, rgba(236, 72, 153, 1) 100%);
    box-shadow: 0 0 20px rgba(255, 0, 255, 0.8), 0 4px 8px rgba(0, 0, 0, 0.3);
    cursor: pointer;
    transition: all 0.3s ease;
    border: 2px solid rgba(255, 255, 255, 0.3);
    position: relative;
  `
  if (user.profile_photo_url) {
    const innerDiv = document.createElement('div')
    innerDiv.style.cssText = `transform: rotate(-45deg); width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; overflow: hidden; border-radius: 4px;`
    innerDiv.innerHTML = `<img src="${user.profile_photo_url}" style="width: 100%; height: 100%; object-fit: cover; opacity: 0.9;" />`
    el.appendChild(innerDiv)
  }
  el.addEventListener('mouseenter', () => {
    el.style.transform = 'rotate(45deg) scale(1.2)'
    el.style.boxShadow = '0 0 30px rgba(255, 0, 255, 1), 0 6px 12px rgba(0, 0, 0, 0.4)'
  })
  el.addEventListener('mouseleave', () => {
    el.style.transform = 'rotate(45deg) scale(1)'
    el.style.boxShadow = '0 0 20px rgba(255, 0, 255, 0.8), 0 4px 8px rgba(0, 0, 0, 0.3)'
  })
  return el
}

const createPinStyle3 = (user: any) => {
  const el = document.createElement('div')
  el.className = 'custom-marker'
  el.style.cssText = `
    width: 50px;
    height: 50px;
    border-radius: 50%;
    background: linear-gradient(135deg, #00d9ff 0%, #ff00ff 100%);
    box-shadow: 0 0 0 0 rgba(0, 217, 255, 0.7), 0 4px 8px rgba(0, 0, 0, 0.3);
    cursor: pointer;
    transition: all 0.3s ease;
    border: 3px solid rgba(255, 255, 255, 0.5);
    position: relative;
    animation: pulse 2s infinite;
  `
  if (user.profile_photo_url) {
    el.innerHTML = `<img src="${user.profile_photo_url}" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover; opacity: 0.85;" />`
  }
  el.addEventListener('mouseenter', () => {
    el.style.transform = 'scale(1.3)'
    el.style.animationPlayState = 'paused'
  })
  el.addEventListener('mouseleave', () => {
    el.style.transform = 'scale(1)'
    el.style.animationPlayState = 'running'
  })
  return el
}

const createPinStyle4 = (user: any) => {
  const el = document.createElement('div')
  el.className = 'custom-marker'
  el.style.cssText = `
    width: 44px;
    height: 44px;
    border-radius: 8px;
    background: rgba(10, 10, 15, 0.95);
    box-shadow: 0 0 0 2px rgba(0, 217, 255, 1), 0 0 20px rgba(0, 217, 255, 0.5), 0 4px 12px rgba(0, 0, 0, 0.5);
    cursor: pointer;
    transition: all 0.3s ease;
    position: relative;
    overflow: hidden;
  `
  const accent = document.createElement('div')
  accent.style.cssText = `position: absolute; top: 0; right: 0; width: 8px; height: 8px; background: linear-gradient(135deg, #00d9ff 0%, #ff00ff 100%); border-bottom-left-radius: 4px;`
  el.appendChild(accent)
  if (user.profile_photo_url) {
    const img = document.createElement('img')
    img.src = user.profile_photo_url
    img.style.cssText = `width: 100%; height: 100%; object-fit: cover; opacity: 0.9;`
    el.appendChild(img)
  }
  el.addEventListener('mouseenter', () => {
    el.style.transform = 'scale(1.15) translateY(-4px)'
    el.style.boxShadow = '0 0 0 3px rgba(0, 217, 255, 1), 0 0 30px rgba(0, 217, 255, 0.8), 0 8px 16px rgba(0, 0, 0, 0.6)'
  })
  el.addEventListener('mouseleave', () => {
    el.style.transform = 'scale(1) translateY(0)'
    el.style.boxShadow = '0 0 0 2px rgba(0, 217, 255, 1), 0 0 20px rgba(0, 217, 255, 0.5), 0 4px 12px rgba(0, 0, 0, 0.5)'
  })
  return el
}

const createPinStyle5 = (user: any) => {
  const el = document.createElement('div')
  el.className = 'custom-marker'
  el.style.cssText = `
    width: 0;
    height: 0;
    border-left: 25px solid transparent;
    border-right: 25px solid transparent;
    border-bottom: 40px solid rgba(0, 217, 255, 1);
    cursor: pointer;
    transition: all 0.3s ease;
    filter: drop-shadow(0 0 15px rgba(0, 217, 255, 0.9)) drop-shadow(0 4px 8px rgba(0, 0, 0, 0.4));
    position: relative;
  `
  const inner = document.createElement('div')
  inner.style.cssText = `position: absolute; width: 0; height: 0; border-left: 20px solid transparent; border-right: 20px solid transparent; border-bottom: 32px solid rgba(255, 0, 255, 0.5); top: 4px; left: -20px;`
  el.appendChild(inner)
  if (user.profile_photo_url) {
    const circle = document.createElement('div')
    circle.style.cssText = `position: absolute; width: 30px; height: 30px; border-radius: 50%; top: 8px; left: -15px; overflow: hidden; border: 2px solid rgba(255, 255, 255, 0.8);`
    circle.innerHTML = `<img src="${user.profile_photo_url}" style="width: 100%; height: 100%; object-fit: cover;" />`
    el.appendChild(circle)
  }
  el.addEventListener('mouseenter', () => {
    el.style.transform = 'scale(1.2) translateY(-5px)'
    el.style.filter = 'drop-shadow(0 0 25px rgba(0, 217, 255, 1)) drop-shadow(0 6px 12px rgba(0, 0, 0, 0.5))'
  })
  el.addEventListener('mouseleave', () => {
    el.style.transform = 'scale(1) translateY(0)'
    el.style.filter = 'drop-shadow(0 0 15px rgba(0, 217, 255, 0.9)) drop-shadow(0 4px 8px rgba(0, 0, 0, 0.4))'
  })
  return el
}

// Simple Mapbox map component using CDN approach
export default function MapViewSimple({ pinStyle = 1 }: { pinStyle?: number }) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<any>(null)
  const [users, setUsers] = useState<any[]>([])
  const [currentLocation, setCurrentLocation] = useState<[number, number] | null>(null)
  const markers = useRef<any[]>([])
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

  // Load nearby users with 10-mile radius
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

        // Use get_nearby_profiles with 10-mile radius
        const { data, error } = await supabase.rpc('get_nearby_profiles', {
          p_user_id: user.id,
          p_origin_lat: profile.latitude,
          p_origin_lon: profile.longitude,
          p_radius_miles: 10, // 10-mile radius only
        })

        if (error) {
          console.error('Error loading nearby users:', error)
          return
        }

        if (data) {
          setUsers(data)
        }
      } catch (error) {
        console.error('Error loading users:', error)
      }
    }

    loadUsers()
    
    // Auto-refresh every 15 seconds
    const interval = setInterval(() => {
      console.log('🗺️ Refreshing map users...')
      loadUsers()
    }, 15000) // 15 seconds
    
    // Subscribe to real-time updates
    const channel = supabase
      .channel('map-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'profiles',
        },
        (payload) => {
          console.log('📡 Map real-time update:', payload)
          loadUsers()
        }
      )
      .subscribe()

    return () => {
      clearInterval(interval)
      supabase.removeChannel(channel)
    }
  }, [])

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || !currentLocation || map.current) return

    // Wait for mapboxgl to be available from CDN
    const initMap = () => {
      if (typeof window !== 'undefined' && (window as any).mapboxgl) {
        const mapboxgl = (window as any).mapboxgl
        mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!

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

        // Add CSS animation for pulse effect (Style 3)
        if (!document.getElementById('pulse-animation')) {
          const style = document.createElement('style')
          style.id = 'pulse-animation'
          style.textContent = `
            @keyframes pulse {
              0% { box-shadow: 0 0 0 0 rgba(0, 217, 255, 0.7), 0 4px 8px rgba(0, 0, 0, 0.3); }
              50% { box-shadow: 0 0 0 15px rgba(0, 217, 255, 0), 0 4px 8px rgba(0, 0, 0, 0.3); }
              100% { box-shadow: 0 0 0 0 rgba(0, 217, 255, 0), 0 4px 8px rgba(0, 0, 0, 0.3); }
            }
          `
          document.head.appendChild(style)
        }

        // Function to create marker using SLTR Map Pin
        const createMarker = (user: any) => {
          const primaryPhoto = resolveProfilePhoto(user.profile_photo_url, user.photos)
          
          const markerEl = createSLTRMapboxMarker(
            {
              id: user.id,
              display_name: user.display_name || 'Anonymous',
              avatar_url: primaryPhoto || null,
              age: user.age ?? 0,
              position: user.position || 'Unknown',
              dtfn: !!user.dtfn,
              party_friendly: !!user.party_friendly,
              latitude: user.latitude,
              longitude: user.longitude,
              distance: user.distance,
              is_online: user.is_online ?? user.online,
              online: user.online ?? user.is_online,
            },
            (id) => window.location.href = `/messages?user=${id}`,
            (id) => window.location.href = `/messages?user=${id}&startVideo=1`,
            (id) => {
              // Handle tap - you can add tap logic here
              console.log('Tap:', id)
            },
            (id) => window.location.href = `/profile/${id}`
          )

          return markerEl
        }

        // Add other users as markers
        users.forEach((user) => {
          if (user.latitude && user.longitude) {
            const el = createMarker(user)

            const marker = new mapboxgl.Marker({
              element: el,
              anchor: 'bottom'  // SLTR pins use bottom anchor
            })
              .setLngLat([user.longitude, user.latitude])
              .addTo(map.current)

            markers.current.push(marker)
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
  }, [currentLocation, users, pinStyle])

  // Refresh markers when pin style changes
  useEffect(() => {
    if (!map.current || !users.length) return

    // Remove old markers with proper cleanup
    markers.current.forEach(marker => {
      const element = (marker as any).getElement?.()
      if (element) {
        cleanupSLTRMarker(element)
      }
      marker.remove()
    })
    markers.current = []

    // Add new markers with SLTR style
    const mapboxgl = (window as any).mapboxgl
    if (mapboxgl) {
      users.forEach((user) => {
        if (user.latitude && user.longitude) {
          const primaryPhoto = resolveProfilePhoto(user.profile_photo_url, user.photos)
          
          const markerEl = createSLTRMapboxMarker(
            {
              id: user.id,
              display_name: user.display_name || 'Anonymous',
              avatar_url: primaryPhoto || null,
              age: user.age ?? 0,
              position: user.position || 'Unknown',
              dtfn: !!user.dtfn,
              party_friendly: !!user.party_friendly,
              latitude: user.latitude,
              longitude: user.longitude,
              distance: user.distance,
              is_online: user.is_online ?? user.online,
              online: user.online ?? user.is_online,
            },
            (id) => window.location.href = `/messages?user=${id}`,
            (id) => window.location.href = `/messages?user=${id}&startVideo=1`,
            (id) => {
              // Handle tap
              console.log('Tap:', id)
            },
            (id) => window.location.href = `/profile/${id}`
          )

          const marker = new mapboxgl.Marker({
            element: markerEl,
            anchor: 'bottom'  // SLTR pins use bottom anchor
          })
            .setLngLat([user.longitude, user.latitude])
            .addTo(map.current)

          markers.current.push(marker)
        }
      })
    }
  }, [pinStyle, users])

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
