'use client'

import { useEffect, useRef, useState, memo, useCallback, useMemo } from 'react'
import { createClient } from '../lib/supabase/client'
import { createSLTRMapboxMarker, cleanupSLTRMarker } from './SLTRMapPin'
import { resolveProfilePhoto } from '../lib/utils/profile'
import { createVenueMarker } from '../app/components/maps/VenueMarker'

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
interface MapViewSimpleProps {
  pinStyle?: number
  center?: [number, number] | null
}

function MapViewSimple({
  pinStyle = 1,
  center
}: MapViewSimpleProps) {
  // Create supabase client once per component instance
  const supabase = useMemo(() => createClient(), [])
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<any>(null)
  const [users, setUsers] = useState<any[]>([])
  const [currentLocation, setCurrentLocation] = useState<[number, number] | null>(null)
  const [venues, setVenues] = useState<any[]>([])
  const [mapLoaded, setMapLoaded] = useState(false)
  const [mapError, setMapError] = useState<string | null>(null)
  const markers = useRef<any[]>([])
  const venueMarkers = useRef<any[]>([])
  const centerManuallySet = useRef(false) // Track if center was manually set (from search)
  const lastCenterRef = useRef<[number, number] | null>(null) // Track last center to prevent unnecessary updates

  // Get user's location - only if center hasn't been manually set
  useEffect(() => {
    let isMounted = true
    
    // Don't override if center was manually set via search
    if (centerManuallySet.current) {
      return
    }
    
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          if (isMounted && !centerManuallySet.current) {
            setCurrentLocation([position.coords.longitude, position.coords.latitude])
          }
        },
        (error) => {
          // Silently handle geolocation errors (permission denied, unavailable, etc.)
          // Only log in development
          if (process.env.NODE_ENV === 'development') {
            console.warn('Geolocation unavailable, using default location:', error.code)
          }
          // Default to LA if location fails and center wasn't manually set
          if (isMounted && !centerManuallySet.current) {
            setCurrentLocation([-118.2437, 34.0522])
          }
        }
      )
    } else {
      if (isMounted && !centerManuallySet.current) {
        setCurrentLocation([-118.2437, 34.0522])
      }
    }
    
    return () => {
      isMounted = false
    }
  }, [])

  // Load nearby users with 10-mile radius
  useEffect(() => {
    let isMounted = true
    
    async function loadUsers() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user || !isMounted) return

        const { data: profile } = await supabase
          .from('profiles')
          .select('latitude, longitude')
          .eq('id', user.id)
          .single()

        if (!profile?.latitude || !profile?.longitude || !isMounted) return

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

        if (data && isMounted) {
          setUsers(data)
        }
      } catch (error) {
        console.error('Error loading users:', error)
      }
    }

    loadUsers()
    
    // Auto-refresh every 30 seconds (reduced from 15 to save connections)
    const interval = setInterval(() => {
      if (isMounted) {
        console.log('🗺️ Refreshing map users...')
        loadUsers()
      }
    }, 30000) // 30 seconds
    
    // REMOVED realtime subscription - it was creating too many connections
    // Map auto-refreshes every 30 seconds instead
    // If you need realtime back, use a single global channel with user-specific filters

    return () => {
      isMounted = false
      clearInterval(interval)
    }
  }, [])

  // Initialize map - ONLY ONCE on mount
  const mapInitialized = useRef(false)
  const isMountedRef = useRef(true)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  
  useEffect(() => {
    // Clear any pending timeout FIRST to prevent race conditions
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
    
    // Reset mounted state on each mount
    isMountedRef.current = true
    
    if (!mapContainer.current || map.current || mapInitialized.current) return
    
    // Use center prop if available, otherwise use currentLocation, otherwise default to LA
    // Don't default to London - use LA instead
    const initialCenter = center || currentLocation || [-118.2437, 34.0522]
    
    // Track if center was provided (manually set)
    if (center) {
      centerManuallySet.current = true
      lastCenterRef.current = center
    }

    // Wait for mapboxgl to be available from CDN with timeout
    let retryCount = 0
    const maxRetries = 50 // 5 seconds max (50 * 100ms)
    
    const initMap = () => {
      // Abort if component unmounted during retry cycle
      if (!isMountedRef.current) return
      
      if (typeof window !== 'undefined' && (window as any).mapboxgl) {
        const mapboxgl = (window as any).mapboxgl
        // Use token directly - process.env doesn't always work in client components
        mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || 'pk.eyJ1Ijoic2x0ciIsImEiOiJjbWh6Z3p3c2kwOTIyMmptenNid3lnbG8zIn0.NqKpGPFkrbUWoS0-rYfzhA'
        console.log('🗺️ Mapbox initialized')

        // Guard against unmounted component
        if (!mapContainer.current || !isMountedRef.current) return

        try {
          map.current = new mapboxgl.Map({
            container: mapContainer.current,
            style: 'mapbox://styles/mapbox/dark-v11',
            center: initialCenter,
            zoom: 13,
            pitch: 45,
            bearing: 0
          })
          
          mapInitialized.current = true
          
          // Wait for map to load before adding markers
          map.current.once('load', () => {
            if (isMountedRef.current) {
              console.log('🗺️ Map loaded')
              setMapLoaded(true)
            }
          })

          // Add navigation controls
          map.current.addControl(new mapboxgl.NavigationControl(), 'top-right')

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
        } catch (error) {
          console.error('🗺️ Failed to initialize map:', error)
          setMapError('Failed to initialize map')
        }
      } else {
        retryCount++
        if (retryCount < maxRetries && isMountedRef.current) {
          // Retry if mapboxgl not loaded yet
          timeoutRef.current = setTimeout(initMap, 100)
        } else if (retryCount >= maxRetries) {
          console.error('🗺️ Mapbox GL JS failed to load after 5 seconds')
          setMapError('Map library failed to load. Please refresh.')
        }
      }
    }

    initMap()

    return () => {
      // Mark as unmounted FIRST to prevent race conditions
      isMountedRef.current = false
      
      // Clear pending timeout to prevent stale callbacks
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }
      
      if (map.current) {
        map.current.remove()
        map.current = null
      }
      
      // Reset for potential remount
      mapInitialized.current = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Only run once on mount

  // Fly to center when center prop changes (from location search)
  // This prevents bounce-back by tracking manual center changes
  useEffect(() => {
    if (!map.current || !center) return
    
    // Prevent unnecessary updates if center hasn't actually changed
    if (lastCenterRef.current && 
        lastCenterRef.current[0] === center[0] && 
        lastCenterRef.current[1] === center[1]) {
      return
    }
    
    // Mark center as manually set to prevent geolocation from overriding
    centerManuallySet.current = true
    lastCenterRef.current = center
    
    const mapboxgl = (window as any).mapboxgl
    if (mapboxgl && map.current) {
      // Wait for map to be loaded before flying
      const flyToLocation = () => {
        if (map.current && map.current.loaded()) {
          map.current.flyTo({
            center: center,
            zoom: 13,
            duration: 2000,
            essential: true
          })
        } else {
          // If map not loaded yet, wait for load event
          map.current.once('load', () => {
            if (map.current) {
              map.current.flyTo({
                center: center,
                zoom: 13,
                duration: 2000,
                essential: true
              })
            }
          })
        }
      }
      
      flyToLocation()
    }
  }, [center])

  // Add/update user marker when currentLocation changes
  const userMarkerRef = useRef<any>(null)
  useEffect(() => {
    if (!map.current || !currentLocation) {
      // Remove marker if location is cleared
      if (userMarkerRef.current) {
        userMarkerRef.current.remove()
        userMarkerRef.current = null
      }
      return
    }

    const mapboxgl = (window as any).mapboxgl
    if (mapboxgl && map.current) {
      // Remove old marker
      if (userMarkerRef.current) {
        userMarkerRef.current.remove()
      }
      
      // Add new marker
      userMarkerRef.current = new mapboxgl.Marker({ color: '#00d4ff' })
        .setLngLat(currentLocation)
        .setPopup(new mapboxgl.Popup().setHTML('<strong>You are here</strong>'))
        .addTo(map.current)
    }
  }, [currentLocation])

  // Fetch venues - always show restaurants, bars, and LGBTQ venues
  const fetchVenues = useCallback(async () => {
    if (!map.current) {
      setVenues([])
      return
    }

    try {
      const mapCenter = map.current.getCenter()
      
      // Always fetch all venue types: restaurants, bars, and LGBTQ venues
      const response = await fetch(
        `/api/venues/search?lat=${mapCenter.lat}&lng=${mapCenter.lng}&radius=5000&types=restaurant,bar,lgbtq`
      )
      const data = await response.json()
      
      setVenues(data.venues || [])
    } catch (error) {
      console.error('Error fetching venues:', error)
      setVenues([])
    }
  }, [])

  // Fetch venues when map loads and when map moves
  useEffect(() => {
    if (!map.current || !mapLoaded) return

    fetchVenues()

    const onMoveEnd = () => {
      fetchVenues()
    }

    map.current.on('moveend', onMoveEnd)

    return () => {
      map.current?.off('moveend', onMoveEnd)
    }
  }, [mapLoaded, fetchVenues])

  // Render venue markers
  useEffect(() => {
    if (!map.current || venues.length === 0) {
      // Clear venue markers if none
      venueMarkers.current.forEach(marker => marker.remove())
      venueMarkers.current = []
      return
    }

    const mapboxgl = (window as any).mapboxgl
    if (!mapboxgl) return

    // Clear existing venue markers
    venueMarkers.current.forEach(marker => marker.remove())
    venueMarkers.current = []

    // Add new venue markers
    venues.forEach((venue: any) => {
      const el = createVenueMarker(
        venue.name,
        venue.type || 'restaurant',
        venue.address || '',
        () => {
          // Show venue info on click
          const popup = new mapboxgl.Popup({ offset: 25 })
            .setLngLat([venue.longitude, venue.latitude])
            .setHTML(`
              <div style="color: white; font-family: system-ui;">
                <strong style="font-size: 14px; display: block; margin-bottom: 4px;">${venue.name}</strong>
                <div style="font-size: 12px; color: rgba(255,255,255,0.7);">${venue.address || ''}</div>
                <div style="font-size: 11px; color: rgba(255,255,255,0.5); margin-top: 4px;">${venue.category || venue.type || ''}</div>
              </div>
            `)
            .addTo(map.current)
        }
      )

      const marker = new mapboxgl.Marker({ element: el, anchor: 'center' })
        .setLngLat([venue.longitude, venue.latitude])
        .addTo(map.current)

      venueMarkers.current.push(marker)
    })
  }, [venues])

  // Refresh markers when users or pin style changes
  useEffect(() => {
    if (!map.current) return

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
    if (mapboxgl && map.current && users.length > 0) {
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

      {/* Show loading state while map is initializing */}
      {!mapLoaded && !mapError && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          background: 'rgba(0,0,0,0.8)',
          padding: '20px',
          borderRadius: '10px',
          color: 'white',
          textAlign: 'center'
        }}>
          <div style={{ marginBottom: '10px' }}>Loading map...</div>
          <div style={{
            width: '30px',
            height: '30px',
            border: '3px solid rgba(255,255,255,0.3)',
            borderTop: '3px solid #00ff88',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto'
          }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      )}

      {/* Show error state if map failed to load */}
      {mapError && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          background: 'rgba(0,0,0,0.9)',
          padding: '20px',
          borderRadius: '10px',
          color: 'white',
          textAlign: 'center',
          maxWidth: '300px'
        }}>
          <div style={{ color: '#ff6b6b', marginBottom: '10px' }}>{mapError}</div>
          <button
            onClick={() => window.location.reload()}
            style={{
              background: '#00ff88',
              color: '#000',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '5px',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            Refresh Page
          </button>
        </div>
      )}
    </div>
  )
}

// Export memoized version to prevent unnecessary re-renders
export default memo(MapViewSimple)
