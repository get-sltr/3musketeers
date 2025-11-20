'use client'
import { useCallback, useEffect, useMemo, useRef, useState, Suspense } from 'react'
import { useMapStore } from '../../stores/useMapStore'
import { useUIStore } from '../../stores/useUIStore'
import { createClient } from '../../lib/supabase/client'
import { useRouter } from 'next/navigation'
import MobileLayout from '../../components/MobileLayout'
import LoadingSkeleton from '../../components/LoadingSkeleton'
import { LazyGridView } from '../../components/LazyWrapper'
import GridViewProduction from '../../components/GridViewProduction'
import MapViewSimple from '../../components/MapViewSimple'
import dynamic from 'next/dynamic'
import AnimatedHeader from '../../components/AnimatedHeader'
import GradientBackground from '../../components/GradientBackground'
import ErosDailyMatchesStrip from '../../components/ErosDailyMatchesStrip'
import UserProfileCard from '../components/UserProfileCard'
import MapControls from '../components/MapControls'
import MapSessionMenu from '../components/MapSessionMenu'
import CornerButtons from '../components/CornerButtons'
import MessagingModal from '../../components/MessagingModal'
import BottomNav from '../../components/BottomNav'
import PlaceModal from '../components/PlaceModal'
import GroupModal from '../components/GroupModal'
import UserAdvertisingPanel from '../components/UserAdvertisingPanel'
import LocationSearch from '../components/LocationSearch'
import WelcomeModal from '../../components/WelcomeModal'
import ErosOnboardingModal from '../../components/ErosOnboardingModal'
import '../../styles/mobile-optimization.css'
import { useRealtime } from '../../hooks/useRealtime'
import { resolveProfilePhoto } from '@/lib/utils/profile'
import { useFullScreenMobile } from '../../hooks/useFullScreenMobile'
import { erosAPI } from '../../lib/eros-api'

type ViewMode = 'grid' | 'map'

interface UserWithLocation {
  id: string
  display_name: string
  latitude?: number
  longitude?: number
  isYou?: boolean
  isFavorited?: boolean
  dtfn?: boolean
  party_friendly?: boolean
  photo_url?: string
  photos?: string[]
  is_online?: boolean
  founder_number?: number | null
  // legacy optional fields referenced elsewhere
  age?: number
  about?: string
  kinks?: string[]
  tags?: string[]
  position?: string
  height?: string
  body_type?: string
  ethnicity?: string
  online?: boolean
  distance_miles?: number | null
  distance_label?: string
  incognito_mode?: boolean
}

const formatDistance = (miles?: number | null) => {
  if (miles == null) return undefined
  if (miles < 0.1) return '<0.1 mi'
  if (miles < 10) return `${miles.toFixed(1)} mi`
  return `${Math.round(miles)} mi`
}

export default function AppPage() {
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  // Ensure realtime presence/auth is initialized regardless of view
  const { isConnected } = useRealtime()
  const [loading, setLoading] = useState(true)
  const [users, setUsers] = useState<UserWithLocation[]>([])
  const [isIncognito, setIsIncognito] = useState(false)
  const [isRelocating, setIsRelocating] = useState(false)
  const [mapCenter, setMapCenter] = useState<[number, number] | null>(null)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [currentOrigin, setCurrentOrigin] = useState<[number, number] | null>(null)
  const [isFetching, setIsFetching] = useState(false)
  const [showErosOnboarding, setShowErosOnboarding] = useState(false)
  const fetchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  
  // Use Zustand store for map session state
  const {
    radiusMiles,
    clusterRadius,
    styleId,
    menuFilters,
    clusterEnabled,
    jitterMeters,
    vanillaMode,
    travelMode,
    showVenues,
    showHeatmap,
    pinStyle,
    setRadiusMiles,
    setClusterRadius,
    setStyleId,
    setMenuFilters,
    setClusterEnabled,
    setJitterMeters,
    setVanillaMode,
    setTravelMode,
    setShowVenues,
    setShowHeatmap,
    setPinStyle,
    resetMapSettings,
  } = useMapStore()
  
  const previousRadiusRef = useRef<number>(radiusMiles)
  
  // Read from UI Store (state + actions)
  const { 
    selectedUser, 
    showProfileModal,
    messagingUser, 
    showMessagingModal,
    isAddingPlace, 
    isHostingGroup,
    showAdvertisingPanel, 
    showWelcomeModal,
    userName,
    openProfile,
    closeProfile,
    openMessages,
    closeMessages,
    toggleAddingPlace,
    toggleHostingGroup,
    toggleAdvertisingPanel,
    setShowWelcomeModal
  } = useUIStore()

  const [isLargeDesktop, setIsLargeDesktop] = useState<boolean>(false)
  const router = useRouter()

  // Enable full-screen mobile app experience
  useFullScreenMobile()

  // Heartbeat tracking - send every 30 seconds
  useEffect(() => {
    let heartbeatInterval: ReturnType<typeof setInterval> | null = null

    const startHeartbeat = async () => {
      heartbeatInterval = setInterval(async () => {
        try {
          const response = await erosAPI.sendHeartbeat(true, true)
          if (response.success) {
            console.log(`💓 Heartbeat sent - Idle: ${response.idleTime}ms, Phase: ${response.processingPhase}`)
          }
        } catch (error) {
          console.warn('Heartbeat error:', error)
          // Silently fail - don't interrupt user experience
        }
      }, 30000) // Every 30 seconds
    }

    startHeartbeat()

    // Cleanup on unmount
    return () => {
      if (heartbeatInterval) {
        clearInterval(heartbeatInterval)
      }
    }
  }, [])

  // Check if first login and show welcome/onboarding modals
  useEffect(() => {
    const checkFirstLogin = async () => {
      const hasSeenWelcome = localStorage.getItem('sltr_welcome_shown')
      const hasSeenErosOnboarding = localStorage.getItem('eros_onboarding_shown')
      if (!hasSeenWelcome) {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          // Get user's display name
          const { data: profile } = await supabase
            .from('profiles')
            .select('display_name, username')
            .eq('id', user.id)
            .single()

          const name = profile?.display_name || profile?.username || ''
          setShowWelcomeModal(true, name)
          localStorage.setItem('sltr_welcome_shown', 'true')
          
          // Show EROS onboarding after welcome
          if (!hasSeenErosOnboarding) {
            setTimeout(() => {
              setShowErosOnboarding(true)
              localStorage.setItem('eros_onboarding_shown', 'true')
            }, 1000)
          }
        }
      }
    }

    checkFirstLogin()
  }, [setShowWelcomeModal])

  // Keep user online with Supabase Presence (scalable for 100k+ users)
  useEffect(() => {
    let presenceChannel: any

    const setupPresence = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Create presence channel
      presenceChannel = supabase.channel('online-users', {
        config: { presence: { key: user.id } }
      })

      // Track presence state
      presenceChannel
        .on('presence', { event: 'sync' }, () => {
          const state = presenceChannel.presenceState()
          // Presence is synced across all clients
        })
        .subscribe(async (status: string) => {
          if (status === 'SUBSCRIBED') {
            // Track this user as online
            await presenceChannel.track({
              user_id: user.id,
              online_at: new Date().toISOString()
            })

            // Update database once on connect
            await supabase
              .from('profiles')
              .update({ online: true, last_active: new Date().toISOString() })
              .eq('id', user.id)
          }
        })
    }

    setupPresence()

    // Cleanup: set offline on unmount
    return () => {
      if (presenceChannel) {
        const cleanup = async () => {
          const supabase = createClient()
          const { data: { user } } = await supabase.auth.getUser()
          if (user) {
            await supabase
              .from('profiles')
              .update({ online: false, last_active: new Date().toISOString() })
              .eq('id', user.id)
          }
          presenceChannel.unsubscribe()
        }
        cleanup()
      }
    }
  }, [])

  // Listen for bottom nav map button click - toggle between grid and map
  useEffect(() => {
    const handleSwitchToMap = () => {
      setViewMode(prev => prev === 'grid' ? 'map' : 'grid')
    }
    
    window.addEventListener('sltr_switch_to_map', handleSwitchToMap)
    return () => {
      window.removeEventListener('sltr_switch_to_map', handleSwitchToMap)
    }
  }, [])

  // Emit view mode change event for bottom nav
  useEffect(() => {
    window.dispatchEvent(new CustomEvent('sltr_view_mode_changed', {
      detail: { viewMode }
    }))
  }, [viewMode])

  useEffect(() => {
    const updateBreakpoint = () => {
      if (typeof window !== 'undefined') {
        setIsLargeDesktop(window.innerWidth >= 1024)
      }
    }

    updateBreakpoint()
    window.addEventListener('resize', updateBreakpoint)
    return () => window.removeEventListener('resize', updateBreakpoint)
  }, [])

  const fetchUsers = useCallback(async (userId: string, origin: [number, number], options: { immediate?: boolean } = {}) => {
    const supabase = createClient()
    setIsFetching(true)
    setCurrentOrigin(origin)

    try {
      // In travel mode, use a very large radius (25000 miles = entire world)
      const effectiveRadius = travelMode ? 25000 : radiusMiles

      const { data, error } = await supabase.rpc('get_nearby_profiles', {
        p_user_id: userId,
        p_origin_lat: origin[1],
        p_origin_lon: origin[0],
        p_radius_miles: effectiveRadius,
      })

      if (error) {
        console.error('Error fetching nearby profiles:', error)
        return
      }

      const { data: favoritesRows } = await supabase
        .from('favorites')
        .select('favorited_user_id')
        .eq('user_id', userId)

      const favoriteIds = new Set<string>()
      for (const row of favoritesRows || []) {
        if (row?.favorited_user_id) {
          favoriteIds.add(row.favorited_user_id)
        }
      }

      const mappedUsers: UserWithLocation[] = (data || []).map((profile: any) => {
        const photos = Array.isArray(profile?.photos) ? profile.photos.filter(Boolean) : undefined

        return {
          id: profile.id,
          display_name: profile.display_name || 'Anonymous',
          latitude: profile.latitude ?? undefined,
          longitude: profile.longitude ?? undefined,
          isYou: !!profile.is_self,
          isFavorited: favoriteIds.has(profile.id),
          dtfn: profile.dtfn ?? false,
          party_friendly: profile.party_friendly ?? false,
          photo_url: profile.photo_url ?? undefined,
          photos,
          is_online: profile.is_online ?? null,
          founder_number: profile.founder_number ?? null,
          about: profile.about ?? undefined,
          kinks: Array.isArray(profile.kinks) ? profile.kinks : undefined,
          tags: Array.isArray(profile.tags) ? profile.tags : undefined,
          position: profile.position ?? undefined,
          age: profile.age ?? undefined,
          online: profile.is_online ?? null,
          distance_miles: profile.distance_miles ?? null,
          distance_label: profile.is_self ? 'You' : formatDistance(profile.distance_miles),
          incognito_mode: profile.incognito_mode ?? false,
        }
      })

      setUsers(mappedUsers)

      // Auto-center on origin when we first load or explicitly requested
      if ((options.immediate || !mapCenter) && origin) {
        setMapCenter(origin)
      }
    } finally {
      setIsFetching(false)
      if (loading) {
        setLoading(false)
      }
    }
  }, [radiusMiles, travelMode, mapCenter, loading])

  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()

      if (!session) {
        router.push('/login')
        return
      }

      // Check if current user has location set
      const { data: profile } = await supabase
        .from('profiles')
        .select('latitude, longitude')
        .eq('id', session.user.id)
        .single()

      let originLat = profile?.latitude ?? null
      let originLon = profile?.longitude ?? null

      // If no location, request it and save BEFORE showing page
      if (!originLat || !originLon) {
        console.log('📍 No location found, requesting permission...')
        if (navigator.geolocation) {
          await new Promise<void>((resolve) => {
            navigator.geolocation.getCurrentPosition(
              async (position) => {
                console.log('✅ Location granted:', position.coords.latitude, position.coords.longitude)
                originLat = position.coords.latitude
                originLon = position.coords.longitude
                await supabase
                  .from('profiles')
                  .update({
                    latitude: originLat,
                    longitude: originLon
                  })
                  .eq('id', session.user.id)
                resolve()
              },
              (error) => {
                console.warn('⚠️ Location denied or unavailable:', error)
                alert('Location access is required to use SLTR. Please enable location to see other users nearby!')
                resolve()
              }
            )
          })
        }
      }

      setCurrentUserId(session.user.id)

      if (originLat != null && originLon != null) {
        const origin: [number, number] = [originLon, originLat]
        await fetchUsers(session.user.id, origin, { immediate: true })
      } else {
        setLoading(false)
      }
    }
    checkAuth()
  }, [router, fetchUsers])

  // Re-fetch when radius or travel mode changes
  useEffect(() => {
    if (previousRadiusRef.current === radiusMiles) return
    previousRadiusRef.current = radiusMiles

    if (!currentUserId || !currentOrigin) return
    if (fetchTimeoutRef.current) {
      clearTimeout(fetchTimeoutRef.current)
    }
    fetchTimeoutRef.current = setTimeout(() => {
      fetchUsers(currentUserId, currentOrigin)
    }, 350)

    return () => {
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current)
      }
    }
  }, [radiusMiles, currentUserId, currentOrigin, fetchUsers])

  // Immediately re-fetch when travel mode is toggled (no debounce needed)
  useEffect(() => {
    if (!currentUserId || !currentOrigin) return
    fetchUsers(currentUserId, currentOrigin)
  }, [travelMode])

  // Real-time presence updates: keep users[] in sync with socket events
  useEffect(() => {
    const onOnline = (e: any) => {
      console.log('✅ User came online:', e.userId)
      setUsers(prev => prev.map(u => u.id === e.userId ? { ...u, online: true } : u))
    }
    const onOffline = (e: any) => {
      console.log('❌ User went offline:', e.userId)
      setUsers(prev => prev.map(u => u.id === e.userId ? { ...u, online: false } : u))
    }
    window.addEventListener('user_online', onOnline as any)
    window.addEventListener('user_offline', onOffline as any)
    return () => {
      window.removeEventListener('user_online', onOnline as any)
      window.removeEventListener('user_offline', onOffline as any)
    }
  }, [])

  const handleUserClick = (userId: string) => {
    const user = users.find(u => u.id === userId)
    if (user) {
      openProfile(user)
    }
  }

  const handleMessage = async (userId: string) => {
    // Open messaging modal instead of navigating
    const userToMessage = users.find(u => u.id === userId)
    if (userToMessage) {
      openMessages(userToMessage)
    }
  }

  const handleBlock = async (userId: string) => {
    if (confirm('Block this user? They won\'t be able to see your profile or message you.')) {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Add to blocked users
      const { error } = await supabase
        .from('blocked_users')
        .insert({
          user_id: user.id,
          blocked_user_id: userId,
          created_at: new Date().toISOString()
        })

      if (error) {
        console.error('Error blocking user:', error)
        alert('Failed to block user')
      } else {
        // Remove from users list
        setUsers(prev => prev.filter(u => u.id !== userId))
        closeProfile()
        alert('User blocked')
      }
    }
  }

  const handleReport = async (userId: string) => {
    const reason = prompt('Why are you reporting this user?')
    if (reason) {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { error } = await supabase
        .from('reports')
        .insert({
          reporter_id: user.id,
          reported_user_id: userId,
          reason: reason,
          created_at: new Date().toISOString()
        })

      if (error) {
        console.error('Error reporting user:', error)
        alert('Failed to report user')
      } else {
        alert('Thank you for your report. Our team will review it.')
        closeProfile()
      }
    }
  }

  const handleFavorite = async (userId: string) => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      console.error('User not authenticated')
      return
    }

    try {
      // Check if already favorited - try both column name variations
      const { data: existing, error: checkError } = await supabase
        .from('favorites')
        .select('id')
        .eq('user_id', user.id)
        .eq('favorite_user_id', userId)
        .maybeSingle()

      // If that doesn't work, try alternative column name
      let existingFavorite = existing
      if (!existing && checkError) {
        const { data: altExisting } = await supabase
          .from('favorites')
          .select('id')
          .eq('user_id', user.id)
          .eq('favorited_user_id', userId)
          .maybeSingle()
        existingFavorite = altExisting
      }

      if (existingFavorite) {
        // Remove favorite
        const { error } = await supabase
          .from('favorites')
          .delete()
          .eq('id', existingFavorite.id)

        if (error) {
          console.error('Error removing favorite:', error)
          alert('Failed to remove favorite. Please try again.')
        } else {
          setUsers(prev => prev.map(u => 
            u.id === userId ? { ...u, isFavorited: false } : u
          ))
        }
      } else {
        // Add favorite - try both column name variations
        const insertData: any = {
          user_id: user.id,
          created_at: new Date().toISOString()
        }
        
        // Try favorite_user_id first
        insertData.favorite_user_id = userId
        
        const { error: insertError } = await supabase
          .from('favorites')
          .insert(insertData)

        if (insertError) {
          // If that fails, try favorited_user_id
          const altInsertData = {
            user_id: user.id,
            favorited_user_id: userId,
            created_at: new Date().toISOString()
          }
          
          const { error: altError } = await supabase
            .from('favorites')
            .insert(altInsertData)

          if (altError) {
            console.error('Error adding favorite:', altError)
            alert(`Failed to add favorite: ${altError.message}. Please check if the favorites table exists.`)
          } else {
            setUsers(prev => prev.map(u => 
              u.id === userId ? { ...u, isFavorited: true } : u
            ))
          }
        } else {
          setUsers(prev => prev.map(u => 
            u.id === userId ? { ...u, isFavorited: true } : u
          ))
        }
      }
    } catch (err) {
      console.error('Error toggling favorite:', err)
      alert('Failed to toggle favorite. Please try again.')
    }
  }

  const handleCenterLocation = async () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setMapCenter([position.coords.longitude, position.coords.latitude])
        },
        (error) => {
          console.error('Error getting location:', error)
          alert('Unable to get your location. Please enable location services.')
        }
      )
    }
  }

  const handleMapVideo = (userId: string) => {
    router.push(`/messages?user=${userId}&startVideo=1`)
    window.dispatchEvent(new CustomEvent('eros_start_video_call', { detail: { userId } }))
  }

  const handleMapTap = async (userId: string) => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      alert('Sign in to send a tap.')
      return
    }

    const { error } = await supabase
      .from('taps')
      .insert({ from_user_id: user.id, to_user_id: userId })

    if (error) {
      console.error('Failed to send tap:', error)
      alert('Could not send tap. Try again later.')
    }
  }

  const handleToggleIncognito = async (enabled: boolean) => {
    setIsIncognito(enabled)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // Update online status in database
    const { error } = await supabase
      .from('profiles')
      .update({ online: !enabled })
      .eq('id', user.id)
    
    if (error) {
      console.error('Failed to update online status:', error)
    }
  }

  const handleMoveLocation = () => {
    setIsRelocating(!isRelocating)
    // Map click handler will be managed by MapboxUsers component
  }

  const handleMapClick = async (lng: number, lat: number) => {
    if (!isRelocating) return
    
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // Update user location in database
    const { error } = await supabase
      .from('profiles')
      .update({ latitude: lat, longitude: lng })
      .eq('id', user.id)
    
    if (error) {
      console.error('Failed to update location:', error)
      alert('Failed to update location. Please try again.')
      return
    }

    const origin: [number, number] = [lng, lat]
    setIsRelocating(false)
    await fetchUsers(user.id, origin, { immediate: true })
  }

  // Compute map users once per render BEFORE any early return
  const mapUsers = useMemo(() => {
    return users
      .filter(u => (menuFilters.online ? !!(u.is_online ?? u.online) : true))
      .filter(u => (menuFilters.hosting ? !!u.party_friendly : true))
      .filter(u => (menuFilters.looking ? !!u.dtfn : true))
      .map(u => ({
        id: u.id,
        latitude: u.latitude!,
        longitude: u.longitude!,
        display_name: u.isYou ? 'You' : u.display_name,
        isYou: u.isYou,
        isCurrentUser: u.isYou,
        photo: u.photo_url,
        photos: Array.isArray(u.photos) ? u.photos.filter(Boolean) : undefined,
        online: u.is_online ?? u.online,
        is_online: u.is_online ?? u.online,
        dtfn: u.dtfn,
        party_friendly: u.party_friendly,
        age: u.age,
        position: u.position,
        distance: u.distance_label ?? formatDistance(u.distance_miles),
        distanceValue: u.distance_miles ?? undefined,
      }))
  }, [users, menuFilters])

  if (loading) {
    return (
      <MobileLayout>
        <LoadingSkeleton variant="fullscreen" />
      </MobileLayout>
    )
  }

  return (
    <MobileLayout>
      <div className="min-h-screen bg-[#0a0a0f]" style={{
        paddingBottom: viewMode === 'map' ? '0' : 'calc(80px + env(safe-area-inset-bottom))'
      }}>
        {/* Animated Header with transparency */}
        <AnimatedHeader 
          viewMode={viewMode} 
          onViewModeChange={setViewMode} 
        />

      {/* Main Content */}
      <main className={viewMode === 'grid' ? 'pt-0' : 'pt-0'}>
        {/* EROS Daily Matches strip */}
        {viewMode === 'grid' && <ErosDailyMatchesStrip />}
        {/* Grid or Map view based on viewMode */}
        {viewMode === 'grid' ? (
          <GridViewProduction
            onUserClick={(userId) => {
              router.push(`/profile/${userId}`)
            }}
          />
        ) : (
          <div className="fixed inset-0 top-[64px]" style={{
            paddingBottom: 'env(safe-area-inset-bottom)'
          }}>
            {/* User Advertising Panel */}
            <UserAdvertisingPanel 
              isOpen={showAdvertisingPanel}
              onToggle={() => toggleAdvertisingPanel()}
            />
            
            <MapViewSimple pinStyle={pinStyle} />

            {/* Location Search Bar */}
            <div className="absolute top-16 left-1/2 -translate-x-1/2 w-full max-w-md px-4 z-20">
              <LocationSearch
                onLocationSelect={(lat, lng, placeName) => {
                  setMapCenter([lng, lat])
                  // Optionally show a notification
                  console.log('Traveling to:', placeName)
                }}
              />
            </div>

            {/* Map Session Menu */}
            <div className="z-20">
            <MapSessionMenu
              radiusMiles={radiusMiles}
              setRadiusMiles={setRadiusMiles}
              clusterRadius={clusterRadius}
              setClusterRadius={setClusterRadius}
              clusterEnabled={clusterEnabled}
              setClusterEnabled={setClusterEnabled}
              styleId={styleId}
              setStyleId={setStyleId}
              incognito={isIncognito}
              onToggleIncognito={handleToggleIncognito}
              vanillaMode={vanillaMode}
              onToggleVanilla={setVanillaMode}
              travelMode={travelMode}
              onToggleTravelMode={setTravelMode}
              filters={menuFilters}
              setFilters={setMenuFilters}
              onCenter={handleCenterLocation}
              onRelocate={handleMoveLocation}
              onClear={resetMapSettings}
              onAddPlace={() => toggleAddingPlace(true)}
              onHostGroup={() => toggleHostingGroup(true)}
              showVenues={showVenues}
              onToggleVenues={setShowVenues}
              showHeatmap={showHeatmap}
              onToggleHeatmap={setShowHeatmap}
              pinStyle={pinStyle}
              onPinStyleChange={setPinStyle}
            />
            </div>

            {/* Corner Buttons */}
            <CornerButtons
              onToggleMenu={() => window.dispatchEvent(new Event('toggle_map_session_menu'))}
              onCenter={handleCenterLocation}
              onMessages={() => router.push('/messages')}
              onGroups={() => router.push('/groups')}
              rightOffset={isLargeDesktop && showAdvertisingPanel ? 384 + 32 : 16}
            />

            {/* Map Controls (eye/incognito + relocate) */}
            <MapControls
              onCenterLocation={handleCenterLocation}
              onToggleIncognito={handleToggleIncognito}
              onMoveLocation={handleMoveLocation}
              isIncognito={isIncognito}
              rightOffset={isLargeDesktop && showAdvertisingPanel ? 384 + 32 : 16}
            />
          </div>
        )}
      </main>

      {/* Add Place / Host Group Modals */}
      <PlaceModal
        isOpen={isAddingPlace}
        onClose={() => toggleAddingPlace(false)}
        onSave={async ({ name, type, notes }) => {
          const supabase = createClient()
          try {
            const { data: { user } } = await supabase.auth.getUser()
            const coords = mapCenter ? { latitude: mapCenter[1], longitude: mapCenter[0] } : { latitude: null, longitude: null }
            const { data, error } = await supabase
              .from('places')
              .insert({
                name,
                type,
                notes,
                user_id: user?.id || null,
                ...coords,
                created_at: new Date().toISOString()
              })
              .select('id')
              .single()
            if (!error && data?.id) router.push(`/places/${data.id}`)
          } catch (e) {
            console.warn('Places table may be missing; skipping insert', e)
          }
        }}
      />
      <GroupModal
        isOpen={isHostingGroup}
        onClose={() => toggleHostingGroup(false)}
        onSave={async ({ title, time, description }) => {
          const supabase = createClient()
          try {
            const { data: { user } } = await supabase.auth.getUser()
            const { data, error } = await supabase
              .from('groups')
              .insert({
                title,
                time,
                description,
                host_id: user?.id || null,
                created_at: new Date().toISOString()
              })
              .select('id')
              .single()
            if (error) {
              // Handle table doesn't exist error gracefully
              if (error.code === '42P01' || error.code === '42P17') {
                console.warn('Groups table not found. Please create it in Supabase.')
                alert('Groups feature is not available yet. Please contact support.')
              } else {
                console.error('Error creating group:', error)
                alert('Failed to create group. Please try again.')
              }
            } else if (data?.id) {
              router.push(`/groups/${data.id}`)
            }
          } catch (e: any) {
            console.warn('Groups table may be missing; skipping insert', e)
            alert('Groups feature is not available yet. Please contact support.')
          }
        }}
      />

      {/* User Profile Modal */}
      <UserProfileCard
        user={selectedUser}
        isOpen={showProfileModal}
        onClose={closeProfile}
        onMessage={handleMessage}
        onBlock={handleBlock}
        onReport={handleReport}
        onFavorite={handleFavorite}
        isFavorited={selectedUser ? users.find(u => u.id === selectedUser.id)?.isFavorited : false}
      />

      {/* Simple Messaging Modal - Opens on grid, doesn't navigate */}
      {messagingUser && (
        <MessagingModal
          user={messagingUser}
          isOpen={showMessagingModal}
          onClose={closeMessages}
        />
      )}

      {/* Welcome Modal - First login */}
      <WelcomeModal
        isOpen={showWelcomeModal}
        onClose={() => setShowWelcomeModal(false)}
        userName={userName}
      />

      {/* EROS Onboarding Modal - Introduces EROS AI */}
      <ErosOnboardingModal
        isOpen={showErosOnboarding}
        onClose={() => setShowErosOnboarding(false)}
      />

      {/* Bottom Navigation */}
      <BottomNav />
      </div>
    </MobileLayout>
  )
}

// Lazy-load Mapbox (client-only)
const MapboxUsers = dynamic(() => import('@/app/components/maps/MapboxUsers'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[500px] md:h-[600px] rounded-xl overflow-hidden flex items-center justify-center text-white/60">
      Loading map...
    </div>
  )
})