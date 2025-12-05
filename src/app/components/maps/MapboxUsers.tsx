'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import '../../styles/map-view.css'
import '../../styles/map-pin-drawer.css'
import { getCurrentUserLocation } from '@/app/lib/maps/mapboxUtils'
import { useMapRealtime } from '@/hooks/useMapRealtime'
import Supercluster from 'supercluster'
import { HoloPinsLayer } from '@/app/components/maps/HoloPinsLayer'
import type { Pin } from '@/types/pins'
import { useHoloPins } from '@/hooks/useHoloPins'
import { createSLTRMapboxMarker, cleanupSLTRMarker } from '@/components/SLTRMapPin'
import { resolveProfilePhoto } from '@/lib/utils/profile'
import { createVenueMarker } from './VenueMarker'
import { getMapboxToken } from '@/lib/maps/getMapboxToken'

const DEFAULT_SLTR_STYLE =
  process.env.NEXT_PUBLIC_MAPBOX_SLTR_STYLE || 'mapbox://styles/sltr/cmhum4i1k001x01rlasmoccvm'

const resolveStyleUrl = (style: string | undefined) => {
  if (!style || style.trim().length === 0) {
    return DEFAULT_SLTR_STYLE
  }
  if (style.startsWith('mapbox://')) {
    return style
  }
  if (style.includes('/')) {
    return `mapbox://styles/${style}`
  }
  return `mapbox://styles/mapbox/${style}`
}

type UserPin = {
  id: string
  latitude: number
  longitude: number
  display_name?: string
  isCurrentUser?: boolean
  photo?: string
  photos?: string[]
  online?: boolean
  is_online?: boolean // Support both field names
  dtfn?: boolean
  party_friendly?: boolean
  position?: string
  age?: number
  distance?: string
  distanceValue?: number
}

interface MapboxUsersProps {
  users?: UserPin[]
  onUserClick?: (userId: string) => void
  onMapClick?: (lng: number, lat: number) => void
  center?: [number, number] // [lng, lat]
  zoom?: number
  minZoom?: number
  maxZoom?: number
  incognito?: boolean
  cluster?: boolean
  styleId?: string
  clusterRadius?: number
  vanillaMode?: boolean
  advancedPins?: boolean
  onChat?: (userId: string) => void
  onVideo?: (userId: string) => void
  onTap?: (userId: string) => void
  onNav?: (loc: { lat: number; lng: number }) => void
  holoTheme?: boolean // apply neon/glass Mapbox theming (fog/sky/3D)
  showVenues?: boolean // show LGBTQ venues
  showRestaurants?: boolean // show restaurants
  showBars?: boolean // show bars
  showHeatmap?: boolean // show user density heatmap
}

function hashPair(id: string): [number, number] {
  let h1 = 0, h2 = 0
  for (let i = 0; i < id.length; i++) {
    h1 = (h1 * 31 + id.charCodeAt(i)) >>> 0
    h2 = (h2 * 17 + id.charCodeAt(i)) >>> 0
  }
  // map to [-1,1]
  const n1 = (h1 / 0xffffffff) * 2 - 1
  const n2 = (h2 / 0xffffffff) * 2 - 1
  return [n1, n2]
}

function jitter(lng: number, lat: number, meters: number, id: string): [number, number] {
  if (!meters) return [lng, lat]
  const [nx, ny] = hashPair(id)
  const dLat = (meters / 111111) * ny
  const dLng = (meters / (111111 * Math.cos((lat * Math.PI) / 180))) * nx
  return [lng + dLng, lat + dLat]
}

export default function MapboxUsers({
  users = [],
  onUserClick,
  onMapClick,
  center,
  zoom = 12,
  minZoom = 2,
  maxZoom = 18,
  incognito = false,
  cluster = true,
  styleId = DEFAULT_SLTR_STYLE,
  clusterRadius = 60,
  jitterMeters = 0,
  vanillaMode = false,
  advancedPins = false,
  onChat,
  onVideo,
  onTap,
  onNav,
  autoLoad = false,
  holoTheme = false,
  showVenues = false,
  showRestaurants = false,
  showBars = false,
  showHeatmap = false,
}: MapboxUsersProps & { jitterMeters?: number; autoLoad?: boolean }) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<mapboxgl.Map | null>(null)
  const markersRef = useRef<mapboxgl.Marker[]>([])
  const markerIndexRef = useRef<Record<string, mapboxgl.Marker>>({})
  const venueMarkersRef = useRef<mapboxgl.Marker[]>([])
  const [mapLoaded, setMapLoaded] = useState(false)
  const [venues, setVenues] = useState<any[]>([])
  const { isConnected, joinMap, leaveMap, updateLocation } = useMapRealtime()
  const { pins: autoPins, options: holoOptions } = useHoloPins(advancedPins && autoLoad)

  // Holo layer state - always active when WebGL is supported
  const holoLayerRef = useRef<HoloPinsLayer | null>(null)
  const supportsAdvanced = (mapboxgl as any).supported?.({ failIfMajorPerformanceCaveat: true }) ?? false
  const useAdvanced = advancedPins && supportsAdvanced
  const [hovered, setHovered] = useState<{ user: UserPin; pt: { x: number; y: number } } | null>(null)
  const [tokenLoaded, setTokenLoaded] = useState(false)

  // Clustering state
  const clusterIndexRef = useRef<any | null>(null)
  const pointsRef = useRef<any[]>([])

  // Fetch Mapbox token from API
  useEffect(() => {
    const loadToken = async () => {
      try {
        console.log('🗺️ Loading Mapbox token...')
        const token = await getMapboxToken()
        console.log('✅ Mapbox token loaded successfully')
        mapboxgl.accessToken = token
        setTokenLoaded(true)
      } catch (error) {
        console.error('⚠️ Failed to load Mapbox token from API:', error)
        // Fallback: try to use env var if API fails (for development)
        if (process.env.NEXT_PUBLIC_MAPBOX_TOKEN) {
          console.log('⚠️ Using fallback NEXT_PUBLIC_MAPBOX_TOKEN')
          mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN
          setTokenLoaded(true)
        } else {
          console.error('❌ No Mapbox token available')
        }
      }
    }
    loadToken()
  }, [])

  useEffect(() => {
    if (!containerRef.current) return
    if (mapRef.current) return
    if (!tokenLoaded) return // Wait for token to load

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
        style: resolveStyleUrl(styleId),
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
      
      // Wait for map to fully load before allowing markers
      mapRef.current.on('load', () => {
        setMapLoaded(true)
        // Apply SLTR night theme (atmosphere + lighting)
        try { applyNightTheme(mapRef.current!) } catch {}
        // Always try to use advanced HoloPinsLayer when WebGL is supported
        if (useAdvanced) {
          // Check if layer already exists, remove it first
          try {
            if (mapRef.current!.getLayer('holo-pins-layer')) {
              mapRef.current!.removeLayer('holo-pins-layer')
              mapRef.current!.removeSource('holo-pins-layer')
            }
          } catch (e) {
            // Layer doesn't exist yet, that's fine
          }
          
          // Initialize layer with empty array first, will be updated when users arrive
          const layer = new HoloPinsLayer([])
          try {
            mapRef.current!.addLayer(layer as any)
            holoLayerRef.current = layer
            console.log('✅ HoloPinsLayer initialized and added to map')
            
            // If users are already available, update the layer immediately
            if (users.length > 0 || (autoLoad && autoPins.length > 0)) {
              const srcUsers = autoLoad && autoPins.length ? autoPins.map(p => ({
                id: p.id,
                lng: p.lng,
                lat: p.lat,
                name: p.name,
                photo: p.photo,
                status: p.status,
                badge: p.badge,
                premiumTier: p.premiumTier,
                isCurrentUser: false,
              })) : users.map(u => ({
                id: u.id,
                lng: u.longitude,
                lat: u.latitude,
                name: u.display_name,
                photo: u.photo,
                status: u.online ? 'online' : 'offline',
                badge: u.dtfn ? 'DTFN' : null,
                premiumTier: u.party_friendly ? 1 : 0,
                isCurrentUser: !!u.isCurrentUser,
              }))
              layer.setData(srcUsers as any)
              console.log('✅ HoloPinsLayer updated with', srcUsers.length, 'pins')
            }
          } catch (e) {
            console.error('Failed to add holo pins layer:', e)
            console.warn('Falling back to DOM markers')
          }
        } else {
          console.warn('⚠️ WebGL not supported, using DOM markers instead of HoloPinsLayer')
        }
      })
    })

    return () => {
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tokenLoaded])

  // Build/update layers or markers
  useEffect(() => {
    if (!mapRef.current || !mapLoaded) return

    // Always use advanced HoloPinsLayer when WebGL is supported
    // If layer doesn't exist yet, try to create it
    if (useAdvanced) {
      if (!holoLayerRef.current) {
        // Layer not created yet, wait for it to be created in map load event
        console.log('⏳ Waiting for HoloPinsLayer to be initialized...')
        return
      }
      const basePins: Pin[] = (autoLoad && autoPins.length
        ? autoPins
        : users
          .filter(u => !(u.isCurrentUser && incognito) && u.latitude != null && u.longitude != null)
          .map(u => ({
            id: u.id,
            lng: u.longitude,
            lat: u.latitude,
            name: u.display_name || 'Unknown',
            photo: resolveProfilePhoto(u.photo, u.photos),
            status: u.online ? 'online' : 'offline',
            badge: u.dtfn ? 'DTFN' : null,
            premiumTier: u.party_friendly ? 1 : 0,
            isCurrentUser: !!u.isCurrentUser,
          }))
      )

      // Build/refresh cluster index
      const points = basePins.map(p => ({
        type: 'Feature',
        properties: { id: p.id },
        geometry: { type: 'Point', coordinates: [p.lng, p.lat] }
      }))
      clusterIndexRef.current = new (Supercluster as any)({ radius: clusterRadius, maxZoom: 18 }).load(points)

      const recompute = () => {
        if (!mapRef.current || !holoLayerRef.current) return
        const bounds = mapRef.current.getBounds()
        const zoom = Math.round(mapRef.current.getZoom())
        const features = clusterIndexRef.current.getClusters(
          [bounds.getWest(), bounds.getSouth(), bounds.getEast(), bounds.getNorth()],
          zoom
        )
        const out: Pin[] = []
        for (const f of features) {
          const [lng, lat] = f.geometry.coordinates
          if (f.properties.cluster) {
            const count = f.properties.point_count as number
            out.push({ id: `cluster_${f.properties.cluster_id}`, lng, lat, clusterSize: count, premiumTier: 0 })
          } else {
            const uid = f.properties.id as string
            const p = basePins.find(x => x.id === uid)
            if (p) out.push(p)
          }
        }
        holoLayerRef.current.setData(out)
        const pinCount = basePins.length
        const lod = pinCount < 500 ? 'ULTRA' : pinCount < 1000 ? 'HIGH' : pinCount < 5000 ? 'MEDIUM' : 'LOW'
        holoLayerRef.current.setLOD(lod as any)
        // Pass global options
        holoLayerRef.current.setOptions({ partyMode: holoOptions.partyMode, prideMonth: holoOptions.prideMonth })
        console.log('✅ HoloPinsLayer updated with', out.length, 'visible pins (from', basePins.length, 'total)')
      }

      recompute()
      const onMoveEnd = () => recompute()
      const onZoomEnd = () => recompute()
      mapRef.current.on('moveend', onMoveEnd)
      mapRef.current.on('zoomend', onZoomEnd)
      return () => {
        mapRef.current?.off('moveend', onMoveEnd)
        mapRef.current?.off('zoomend', onZoomEnd)
      }
    }

    // Only use DOM markers as fallback if advanced pins are not available
    if (useAdvanced && holoLayerRef.current) {
      console.log('🗺️ Using HoloPinsLayer for', users.length, 'users')
      return
    }

    console.log('🗺️ Using DOM markers fallback for', users.length, 'users')
    // DOM markers fallback path (existing logic)
    // Filter out current user's pin if incognito
    const visibleUsers = users.filter(u => !(u.isCurrentUser && incognito))

    // Prepare points for clustering
    pointsRef.current = visibleUsers.map(u => {
      const [jlng, jlat] = jitter(u.longitude, u.latitude, jitterMeters, u.id)
      return ({
        type: 'Feature',
        properties: { userId: u.id, isUser: true },
        geometry: { type: 'Point', coordinates: [jlng, jlat] }
      })
    })

    if (cluster) {
      clusterIndexRef.current = new (Supercluster as any)({ radius: clusterRadius, maxZoom: 18 })
        .load(pointsRef.current)
    } else {
      clusterIndexRef.current = null
    }

    const update = () => {
      // Clear existing markers with proper cleanup
      markersRef.current.forEach(marker => {
        const element = (marker as any).getElement?.()
        if (element) {
          cleanupSLTRMarker(element)
        }
        marker.remove()
      })
      markersRef.current = []
      markerIndexRef.current = {}

      if (!cluster || !clusterIndexRef.current) {
        visibleUsers.forEach((u) => {
          if (typeof u.latitude !== 'number' || typeof u.longitude !== 'number') return
          const j = jitter(u.longitude, u.latitude, jitterMeters, u.id)
          const marker = addMarker({ ...u, longitude: j[0], latitude: j[1] })
          if (marker) markerIndexRef.current[u.id] = marker
        })
        return
      }

      const bounds = mapRef.current!.getBounds()
      const zoom = Math.round(mapRef.current!.getZoom())
      const clusters = clusterIndexRef.current.getClusters(
        [bounds.getWest(), bounds.getSouth(), bounds.getEast(), bounds.getNorth()],
        zoom
      )

      clusters.forEach((feature: any) => {
        const [lng, lat] = feature.geometry.coordinates
        if (feature.properties.cluster) {
          // Render cluster marker
          const count = feature.properties.point_count
          const clusterId = feature.properties.cluster_id
          const clusterMarker = addClusterMarker(lng, lat, count, () => {
            const expansionZoom = Math.min(
              clusterIndexRef.current.getClusterExpansionZoom(clusterId),
              18
            )
            mapRef.current!.easeTo({ center: [lng, lat], zoom: expansionZoom })
          })
          if (clusterMarker) markersRef.current.push(clusterMarker)
        } else {
          const userId = feature.properties.userId as string
          const u = visibleUsers.find(x => x.id === userId)
          if (u) {
            const [jlng, jlat] = jitter(u.longitude, u.latitude, jitterMeters, u.id)
          const marker = addMarker({ ...u, longitude: jlng, latitude: jlat })
            if (marker) markerIndexRef.current[userId] = marker
          }
        }
      })
    }

    update()

    const onMoveEnd = () => update()
    mapRef.current.on('moveend', onMoveEnd)

    return () => {
      mapRef.current?.off('moveend', onMoveEnd)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [users, mapLoaded, incognito, cluster, advancedPins])

  // Hover detection for advanced pins
  useEffect(() => {
    if (!mapRef.current || !mapLoaded || !useAdvanced) return
    const map = mapRef.current
    const container = map.getCanvasContainer()

    const onMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      const vis = users.filter(u => !(u.isCurrentUser && incognito))
      let best: { user: UserPin; d2: number; pt: { x: number; y: number } } | null = null
      for (const u of vis) {
        const p = map.project([u.longitude, u.latitude])
        const dx = p.x - x
        const dy = p.y - y
        const d2 = dx*dx + dy*dy
        if (!best || d2 < best.d2) best = { user: u, d2, pt: { x: p.x, y: p.y } }
      }
      if (best && best.d2 < 38*38) setHovered({ user: best.user, pt: best.pt })
      else setHovered(null)
    }

    container.addEventListener('mousemove', onMove)
    container.addEventListener('mouseleave', () => setHovered(null))
    return () => {
      container.removeEventListener('mousemove', onMove)
      container.removeEventListener('mouseleave', () => setHovered(null))
    }
  }, [mapLoaded, useAdvanced, users, incognito])

  // Re-center map when center prop changes OR when first user loads
  useEffect(() => {
    if (!mapRef.current || !mapLoaded) return
    
    // If center prop is provided, use it
    if (center) {
      console.log('🎯 Flying to center:', center)
      mapRef.current.flyTo({
        center: center,
        zoom: 14,
        duration: 1500
      })
      return
    }
    
    // Otherwise, if we have users and no center has been set yet, center on first user
    if (users.length > 0 && markersRef.current.length === 0) {
      const firstUser = users[0]
      if (firstUser) {
        console.log('🎯 Auto-centering on first user:', firstUser.display_name, [firstUser.longitude, firstUser.latitude])
        mapRef.current.flyTo({
          center: [firstUser.longitude, firstUser.latitude],
          zoom: 14,
          duration: 1500
        })
      }
    }
  }, [center, users, mapLoaded])

  // Update style when styleId changes
  useEffect(() => {
    if (!mapRef.current || !mapLoaded) return
    try {
      const newStyle = resolveStyleUrl(styleId)
      const styleToken = newStyle.split('/').pop() || newStyle
      const currentSprite = (mapRef.current as any).getStyle?.().sprite as string | undefined
      if (currentSprite && currentSprite.includes(styleToken)) return

      mapRef.current.setStyle(newStyle)
      // Re-apply theme once the new style is ready
      mapRef.current.once('styledata', () => {
        try { applyNightTheme(mapRef.current!) } catch {}
      })
    } catch (err) {
      console.warn('Failed to switch map style', err)
    }
  }, [styleId, mapLoaded, holoTheme])

  const addMarker = (u: UserPin) => {
    if (!mapRef.current) return null

    const primaryPhoto = resolveProfilePhoto(u.photo, u.photos)

    const markerEl = createSLTRMapboxMarker(
      {
        id: u.id,
        display_name: u.display_name || 'Anonymous',
        avatar_url: primaryPhoto || null,
        age: u.age ?? 0,
        position: u.position || 'Unknown',
        dtfn: !!u.dtfn,
        party_friendly: !!u.party_friendly,
        latitude: u.latitude,
        longitude: u.longitude,
        distance: u.distance,
        is_online: u.is_online ?? u.online,
        online: u.online ?? u.is_online,
      },
      (id) => onChat?.(id),
      (id) => onVideo?.(id),
      (id) => onTap?.(id),
      (id) => onUserClick?.(id)
    )

    const marker = new mapboxgl.Marker({ element: markerEl, anchor: 'bottom' })
      .setLngLat([u.longitude, u.latitude])
      .addTo(mapRef.current)

    markersRef.current.push(marker)
    return marker
  }

  const addClusterMarker = (lng: number, lat: number, count: number, onClick: () => void) => {
    if (!mapRef.current) return null

    const container = document.createElement('div')
    container.style.width = '44px'
    container.style.height = '44px'
    container.style.borderRadius = '9999px'
    container.style.background = 'radial-gradient(circle at 30% 30%, rgba(0,212,255,0.9), rgba(147,51,234,0.9))'
    container.style.border = '3px solid rgba(255,255,255,0.9)'
    container.style.boxShadow = '0 8px 24px rgba(0,0,0,0.4), 0 0 24px rgba(0,212,255,0.6)'
    container.style.display = 'flex'
    container.style.alignItems = 'center'
    container.style.justifyContent = 'center'
    container.style.color = 'white'
    container.style.fontWeight = '800'
    container.style.fontSize = '14px'
    container.style.cursor = 'pointer'
    container.style.backdropFilter = 'blur(6px)'
    container.textContent = String(count)
    container.addEventListener('click', (e) => {
      e.stopPropagation()
      onClick()
    })

    const marker = new mapboxgl.Marker(container)
      .setLngLat([lng, lat])
      .addTo(mapRef.current)

    markersRef.current.push(marker)
    return marker
  }

  // Live map session: join a shared room and stream location updates
  useEffect(() => {
    if (!mapLoaded || !isConnected) return

    // Join map session
    joinMap()

    // Handle incoming live location updates from other users
    const onLocationUpdate = (e: any) => {
      try {
        const payload = e.detail // Supabase sends via event.detail
        const userId = (payload.userId || payload.user_id) as string
        const lat = (payload.latitude ?? payload.lat) as number
        const lng = (payload.longitude ?? payload.lng) as number
        if (!userId || typeof lat !== 'number' || typeof lng !== 'number') return

        const existing = markerIndexRef.current[userId]
        const [jlng, jlat] = jitter(lng, lat, jitterMeters, userId)
        if (existing) {
          existing.setLngLat([jlng, jlat])
        } else {
          // Create a lightweight marker if user not in initial list
          const marker = addMarker({ id: userId, latitude: jlat, longitude: jlng })
          if (marker) markerIndexRef.current[userId] = marker as mapboxgl.Marker
        }
      } catch (err) {
        console.warn('Live location update handling failed', err)
      }
    }

    window.addEventListener('user_location_update', onLocationUpdate as any)

    // Start streaming the current user's location periodically
    let watchId: number | null = null
    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      watchId = navigator.geolocation.watchPosition(
        (pos) => {
          if (!incognito) {
            // Broadcast location via Supabase Realtime
            updateLocation(pos.coords.latitude, pos.coords.longitude)
          }
        },
        () => {},
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 5000 }
      )
    }

    return () => {
      window.removeEventListener('user_location_update', onLocationUpdate as any)
      if (watchId !== null) navigator.geolocation.clearWatch(watchId)
      leaveMap()
    }
  }, [mapLoaded, isConnected, joinMap, leaveMap, updateLocation, incognito, jitterMeters])

  // Fetch and display venues (restaurants, bars, LGBTQ)
  useEffect(() => {
    if (!mapLoaded || !mapRef.current) {
      return
    }

    // If no venue types are enabled, clear markers
    if (!showVenues && !showRestaurants && !showBars) {
      venueMarkersRef.current.forEach(marker => marker.remove())
      venueMarkersRef.current = []
      setVenues([])
      return
    }

    const map = mapRef.current
    const currentCenter = map.getCenter()

    const fetchVenues = async () => {
      try {
        // Build types query based on what's enabled
        const types: string[] = []
        if (showRestaurants) types.push('restaurant')
        if (showBars) types.push('bar')
        if (showVenues) types.push('lgbtq')

        if (types.length === 0) {
          setVenues([])
          return
        }

        const response = await fetch(
          `/api/venues/search?lat=${currentCenter.lat}&lng=${currentCenter.lng}&radius=5000&types=${types.join(',')}`
        )
        const data = await response.json()
        
        // Filter venues based on what's enabled
        let filteredVenues = data.venues || []
        
        if (showRestaurants && showBars && showVenues) {
          // Show all
        } else {
          filteredVenues = filteredVenues.filter((venue: any) => {
            if (showRestaurants && (venue.type === 'restaurant' || venue.type === 'cafe')) return true
            if (showBars && venue.type === 'bar') return true
            if (showVenues && (venue.type === 'lgbtq' || venue.type === 'club' || venue.type === 'sauna')) return true
            return false
          })
        }
        
        setVenues(filteredVenues)
      } catch (error) {
        console.error('Error fetching venues:', error)
        setVenues([])
      }
    }

    fetchVenues()

    // Refetch when map moves significantly
    const onMoveEnd = () => {
      fetchVenues()
    }

    map.on('moveend', onMoveEnd)

    return () => {
      map.off('moveend', onMoveEnd)
    }
  }, [mapLoaded, showVenues, showRestaurants, showBars])

  // Render venue markers
  useEffect(() => {
    if (!mapRef.current || venues.length === 0) {
      // Clear markers if no venues
      venueMarkersRef.current.forEach(marker => marker.remove())
      venueMarkersRef.current = []
      return
    }

    // Clear existing venue markers
    venueMarkersRef.current.forEach(marker => marker.remove())
    venueMarkersRef.current = []

    // Add new venue markers
    venues.forEach((venue: any) => {
      const el = createVenueMarker(
        venue.name,
        venue.type,
        venue.address,
        () => {
          alert(`${venue.name}\n${venue.address}`)
        }
      )

      const marker = new mapboxgl.Marker({ element: el, anchor: 'center' })
        .setLngLat([venue.longitude, venue.latitude])
        .addTo(mapRef.current!)

      venueMarkersRef.current.push(marker)
    })
  }, [venues])

  // Add user density heatmap layer
  useEffect(() => {
    if (!mapLoaded || !mapRef.current) return

    const map = mapRef.current

    if (showHeatmap && users.length > 0) {
      // Remove existing heatmap if it exists
      if (map.getLayer('user-heatmap')) {
        map.removeLayer('user-heatmap')
      }
      if (map.getSource('user-heat')) {
        map.removeSource('user-heat')
      }

      // Create GeoJSON from user locations
      const heatmapData = {
        type: 'FeatureCollection',
        features: users.map(u => ({
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [u.longitude, u.latitude]
          },
          properties: {
            intensity: u.online ? 2 : 1 // Online users show hotter
          }
        }))
      }

      // Add source
      map.addSource('user-heat', {
        type: 'geojson',
        data: heatmapData as any
      })

      // Add heatmap layer
      map.addLayer({
        id: 'user-heatmap',
        type: 'heatmap',
        source: 'user-heat',
        maxzoom: 15,
        paint: {
          // Increase weight based on online status
          'heatmap-weight': ['get', 'intensity'],
          // Increase intensity as zoom level increases
          'heatmap-intensity': [
            'interpolate',
            ['linear'],
            ['zoom'],
            0, 1,
            15, 3
          ],
          // Cool white-blue gradient to match night palette
          'heatmap-color': [
            'interpolate',
            ['linear'],
            ['heatmap-density'],
            0, 'rgba(255, 255, 255, 0)',
            0.2, 'rgba(210, 224, 255, 0.25)',
            0.5, 'rgba(168, 191, 255, 0.55)',
            0.8, 'rgba(135, 167, 255, 0.75)',
            1, 'rgba(255, 255, 255, 0.85)'
          ],
          // Radius of each heatmap point
          'heatmap-radius': [
            'interpolate',
            ['linear'],
            ['zoom'],
            0, 18,
            15, 42
          ],
          // Opacity
          'heatmap-opacity': 0.6
        }
      }, 'waterway-label') // Place below labels
    } else {
      // Remove heatmap if toggled off
      if (map.getLayer('user-heatmap')) {
        map.removeLayer('user-heatmap')
      }
      if (map.getSource('user-heat')) {
        map.removeSource('user-heat')
      }
    }

    return () => {
      if (map.getLayer('user-heatmap')) {
        map.removeLayer('user-heatmap')
      }
      if (map.getSource('user-heat')) {
        map.removeSource('user-heat')
      }
    }
  }, [mapLoaded, showHeatmap, users])

  if (!tokenLoaded) {
    return (
      <div className="w-full h-screen overflow-hidden bg-black flex items-center justify-center">
        <div className="text-center p-8 glass-bubble max-w-md">
          <div className="text-6xl mb-4">🗺️</div>
          <h3 className="text-white text-xl font-bold mb-2">Loading Map...</h3>
          <p className="text-white/60 mb-4">Initializing map components...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full h-full min-h-[400px] overflow-hidden relative touch-pan-y">
      <div ref={containerRef} className="w-full h-full" style={{ touchAction: 'pan-x pan-y' }} />
      {useAdvanced && hovered && (
        <div
          className="pointer-events-auto absolute z-50"
          style={{ left: hovered.pt.x, top: hovered.pt.y }}
        >
          {/* Lightweight glass hover card */}
          <div className="-translate-x-1/2 -translate-y-full">
            <div className="rounded-2xl backdrop-blur-xl bg-white/10 border border-white/20 shadow-2xl p-3 w-64">
              <div className="flex gap-3 items-center">
                <img src={hovered.user.photo || ''} alt={hovered.user.display_name || ''} className="w-10 h-10 rounded-lg object-cover" />
                <div className="flex-1">
                  <div className="font-semibold text-white text-sm">{hovered.user.display_name || 'User'}</div>
                  <div className="text-[11px] text-white/70">{hovered.user.online ? 'Online' : 'Offline'}</div>
                </div>
              </div>
              <div className="mt-3 grid grid-cols-4 gap-2">
                <button onClick={() => onChat?.(hovered.user.id)} className="px-2 py-1 text-[11px] rounded-md bg-lime-400/20 text-lime-200 border border-lime-400/40">Chat</button>
                <button onClick={() => onVideo?.(hovered.user.id)} className="px-2 py-1 text-[11px] rounded-md bg-fuchsia-500/20 text-fuchsia-200 border border-fuchsia-400/40">Video</button>
                <button onClick={() => onTap?.(hovered.user.id)} className="px-2 py-1 text-[11px] rounded-md bg-amber-500/20 text-amber-200 border border-amber-400/40">Tap</button>
                <button onClick={() => onNav?.({ lat: hovered.user.latitude, lng: hovered.user.longitude })} className="px-2 py-1 text-[11px] rounded-md bg-emerald-500/20 text-emerald-200 border border-emerald-400/40">Nav</button>
              </div>
              {hovered.user.dtfn && (
                <div className="mt-2 text-[10px] uppercase tracking-widest text-red-300">DTFN</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function applyNightTheme(map: mapboxgl.Map) {
  // Atmosphere / fog
  try {
    (map as any).setFog?.({
      range: [0.6, 8],
      color: 'rgba(7, 11, 22, 0.7)',
      'horizon-blend': 0.25,
      'high-color': 'rgba(90, 110, 160, 0.25)',
      'space-color': '#04060d',
      'star-intensity': 0.22,
    })
  } catch {}

  // Ambient light
  try {
    (map as any).setLight?.({
      anchor: 'viewport',
      color: '#f5f7ff',
      intensity: 0.32,
    })
  } catch {}

  // Subtle night sky
  if (!map.getLayer('sltr-sky')) {
    try {
      map.addLayer({
        id: 'sltr-sky',
        type: 'sky',
        paint: {
          'sky-type': 'atmosphere',
          'sky-atmosphere-sun-intensity': 12,
          'sky-atmosphere-halo-color': '#9cb8ff',
          'sky-atmosphere-color': '#0b1224',
        },
      })
    } catch {}
  }

  // 3D buildings soft tint
  try {
    const layers = map.getStyle().layers || []
    let labelLayerId: string | undefined
    for (const layer of layers) {
      if (layer.type === 'symbol' && (layer.layout as any)['text-field']) {
        labelLayerId = layer.id
        break
      }
    }
    if (!map.getLayer('sltr-3d-buildings')) {
      map.addLayer(
        {
          id: 'sltr-3d-buildings',
          source: 'composite',
          'source-layer': 'building',
          filter: ['==', ['get', 'extrude'], 'true'],
          type: 'fill-extrusion',
          minzoom: 14,
          paint: {
            'fill-extrusion-color': '#1c2438',
            'fill-extrusion-height': ['interpolate', ['linear'], ['zoom'], 14, 0, 16.5, ['get', 'height']],
            'fill-extrusion-base': ['interpolate', ['linear'], ['zoom'], 14, 0, 16.5, ['get', 'min_height']],
            'fill-extrusion-opacity': 0.65,
          },
        },
        labelLayerId
      )
    }
  } catch {}

  // Water + road refinements (best effort)
  try {
    if (map.getLayer('water')) {
      map.setPaintProperty('water', 'fill-color', '#0c1525')
    }
  } catch {}

  try {
    const roadLayers = (map.getStyle().layers || [])
      .filter(l => l.type === 'line' && (l.id.includes('road') || l.id.includes('street')))
      .map(l => l.id)
    roadLayers.forEach(id => {
      try {
        map.setPaintProperty(id, 'line-color', 'rgba(235, 241, 255, 0.9)')
        if (map.getPaintProperty(id, 'line-width') !== undefined) {
          map.setPaintProperty(id, 'line-width', [
            'interpolate',
            ['linear'],
            ['zoom'],
            10,
            0.6,
            16,
            2.2,
          ])
        }
      } catch {}
    })
  } catch {}
}



