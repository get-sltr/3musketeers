'use client'

import { useEffect, useMemo, useState } from 'react'
import { createClient } from '../../lib/supabase/client'
import { useRouter } from 'next/navigation'
import FilterBar from '../../components/FilterBar'
import MobileLayout from '../../components/MobileLayout'
import LoadingSkeleton from '../../components/LoadingSkeleton'
import { LazyGridView } from '../../components/LazyWrapper'
import dynamic from 'next/dynamic'
import AnimatedHeader from '../../components/AnimatedHeader'
import GradientBackground from '../../components/GradientBackground'
import UserProfileCard from '../components/UserProfileCard'
import MapControls from '../components/MapControls'
import MapSessionMenu from '../components/MapSessionMenu'
import CornerButtons from '../components/CornerButtons'
import MessagingModal from '../../components/MessagingModal'
import BottomNav from '../../components/BottomNav'
import PlaceModal from '../components/PlaceModal'
import GroupModal from '../components/GroupModal'
import '../../styles/mobile-optimization.css'
import { useSocket } from '../../hooks/useSocket'

type ViewMode = 'grid' | 'map'

interface UserWithLocation {
  id: string
  display_name: string
  age?: number
  photos: string[]
  bio?: string
  kinks?: string[]
  tags?: string[]
  position?: string
  height?: string
  body_type?: string
  ethnicity?: string
  online?: boolean
  latitude?: number
  longitude?: number
  isYou?: boolean
  isFavorited?: boolean
  dtfn?: boolean
  party_friendly?: boolean
}

export default function AppPage() {
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  // Ensure realtime presence/auth is initialized regardless of view
  const { isConnected } = useSocket() as any
  const [loading, setLoading] = useState(true)
  const [activeFilters, setActiveFilters] = useState<string[]>([])
  const [selectedPositions, setSelectedPositions] = useState<string[]>([])
  const [users, setUsers] = useState<UserWithLocation[]>([])
  const [selectedUser, setSelectedUser] = useState<UserWithLocation | null>(null)
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [messagingUser, setMessagingUser] = useState<UserWithLocation | null>(null)
  const [showMessagingModal, setShowMessagingModal] = useState(false)
  const [isIncognito, setIsIncognito] = useState(false)
  const [isRelocating, setIsRelocating] = useState(false)
  const [mapCenter, setMapCenter] = useState<[number, number] | null>(null)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  // Map session UI state
  const [radiusMiles, setRadiusMiles] = useState<number>(25)
  const [clusterRadius, setClusterRadius] = useState<number>(60)
  const [styleId, setStyleId] = useState<string>('dark-v11')
  const [menuFilters, setMenuFilters] = useState({ online: false, hosting: false, looking: false })
  const [clusterEnabled, setClusterEnabled] = useState<boolean>(false)
  const [jitterMeters, setJitterMeters] = useState<number>(0)
  const [vanillaMode, setVanillaMode] = useState<boolean>(false)
  // Add/Host modals
  const [isAddingPlace, setIsAddingPlace] = useState<boolean>(false)
  const [isHostingGroup, setIsHostingGroup] = useState<boolean>(false)
  const router = useRouter()

  // Listen for bottom nav map button click
  useEffect(() => {
    const handleSwitchToMap = () => {
      setViewMode('map')
    }
    
    window.addEventListener('sltr_switch_to_map', handleSwitchToMap)
    return () => {
      window.removeEventListener('sltr_switch_to_map', handleSwitchToMap)
    }
  }, [])

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
      
      // If no location, request it and save
      if (!profile?.latitude || !profile?.longitude) {
        console.log('📍 No location found, requesting permission...')
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            async (position) => {
              console.log('✅ Location granted:', position.coords.latitude, position.coords.longitude)
              // Save to database
              await supabase
                .from('profiles')
                .update({
                  latitude: position.coords.latitude,
                  longitude: position.coords.longitude
                })
                .eq('id', session.user.id)
              
              // Fetch users after setting location
              await fetchUsers(session.user.id)
            },
            (error) => {
              console.warn('⚠️ Location denied or unavailable:', error)
              alert('Please enable location to appear on the map and see other users nearby!')
              // Still fetch users even if location denied
              fetchUsers(session.user.id)
            }
          )
        }
      }
      
      // Fetch users with location data (including yourself)
      await fetchUsers(session.user.id)
      setCurrentUserId(session.user.id)
      setLoading(false)
    }
    checkAuth()
  }, [router])

  // Listen to Location Randomizer slider
  useEffect(() => {
    const handler = (e: any) => setJitterMeters(e.detail as number)
    window.addEventListener('map_randomizer_change', handler)
    return () => window.removeEventListener('map_randomizer_change', handler)
  }, [])

  const fetchUsers = async (currentUserId: string) => {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('profiles')
      .select('id, display_name, age, photos, photo_url, about, kinks, tags, position, height, body_type, ethnicity, online, latitude, longitude, dtfn, party_friendly, founder')
      .not('latitude', 'is', null)
      .not('longitude', 'is', null)
    
    if (error) {
      console.error('Error fetching users:', error)
      return
    }
    
    // Mark current user
    const usersWithYou = (data || []).map(user => ({
      ...user,
      isYou: user.id === currentUserId
    }))
    
    console.log('📊 Fetched users:', usersWithYou.length)
    const currentUser = usersWithYou.find(u => u.id === currentUserId)
    console.log('👤 Current user location:', currentUser ? 
      `lat: ${currentUser.latitude}, lng: ${currentUser.longitude}` : 
      'NOT FOUND')
    
    setUsers(usersWithYou)
    
    // Auto-set map center to current user's location
    if (currentUser?.latitude && currentUser?.longitude && !mapCenter) {
      console.log('🎯 Setting map center to:', currentUser.longitude, currentUser.latitude)
      setMapCenter([currentUser.longitude, currentUser.latitude])
    } else {
      console.warn('⚠️ Cannot center map - missing location data')
    }
  }

  const handleFilterChange = (filterData: { filters?: string[]; positions?: string[]; ageRange?: { min: number; max: number } }) => {
    if (filterData.filters) {
      setActiveFilters(filterData.filters)
      console.log('Active filters:', filterData.filters)
    }
    if (filterData.positions) {
      setSelectedPositions(filterData.positions)
      console.log('Selected positions:', filterData.positions)
    }
  }

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
      setSelectedUser(user)
      setShowProfileModal(true)
    }
  }

  const handleMessage = async (userId: string) => {
    // Open messaging modal instead of navigating
    const userToMessage = users.find(u => u.id === userId)
    if (userToMessage) {
      setMessagingUser(userToMessage)
      setShowProfileModal(false) // Close profile modal if open
      setShowMessagingModal(true) // Open messaging modal
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
        setShowProfileModal(false)
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
        setShowProfileModal(false)
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

  const handleToggleIncognito = async (enabled: boolean) => {
    setIsIncognito(enabled)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // Update online status in database
    await supabase
      .from('profiles')
      .update({ online: !enabled })
      .eq('id', user.id)
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
    await supabase
      .from('profiles')
      .update({ latitude: lat, longitude: lng })
      .eq('id', user.id)

    setIsRelocating(false)
    // Refresh users
    await fetchUsers(user.id)
  }

  // Compute map users once per render BEFORE any early return
  const mapUsers = useMemo(() => {
    const center = mapCenter
    const inRadius = (lat?: number, lon?: number) => {
      if (!center || lat == null || lon == null) return true
      const [centerLon, centerLat] = center
      const R = 3959
      const dLat = ((lat - centerLat) * Math.PI) / 180
      const dLon = ((lon - centerLon) * Math.PI) / 180
      const a = Math.sin(dLat / 2) ** 2 + Math.cos(centerLat * Math.PI / 180) * Math.cos(lat * Math.PI / 180) * Math.sin(dLon / 2) ** 2
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
      const dist = R * c
      return dist <= radiusMiles
    }
    return users
      .filter(u => inRadius(u.latitude, u.longitude))
      .filter(u => (menuFilters.online ? !!u.online : true))
      .filter(u => (menuFilters.hosting ? !!u.party_friendly : true))
      .filter(u => (menuFilters.looking ? !!u.dtfn : true))
      .filter(u => {
        // Filter by position if positions are selected
        if (selectedPositions.length === 0) return true
        if (!u.position) return selectedPositions.includes('Not Specified')
        // Handle position matching (exact match or contains)
        const userPos = u.position
        return selectedPositions.some((pos: string) => {
          // Exact match
          if (userPos === pos) return true
          // Handle Vers/Top and Vers/Btm matching
          if (pos === 'Vers/Top' && (userPos === 'Vers/Top' || userPos === 'Vers Top' || userPos?.includes('Vers') && userPos?.includes('Top'))) return true
          if (pos === 'Vers/Btm' && (userPos === 'Vers/Btm' || userPos === 'Vers Bottom' || userPos?.includes('Vers') && userPos?.includes('Bottom'))) return true
          // Case-insensitive partial match
          return userPos?.toLowerCase().includes(pos.toLowerCase()) || pos.toLowerCase().includes(userPos?.toLowerCase() || '')
        })
      })
      .map(u => ({
        id: u.id,
        latitude: u.latitude!,
        longitude: u.longitude!,
        display_name: u.isYou ? 'You' : u.display_name,
        isCurrentUser: u.isYou,
        photo: u.photos?.[0],
        online: u.online,
        dtfn: u.dtfn,
        party_friendly: u.party_friendly
      }))
  }, [users, mapCenter, radiusMiles, menuFilters, selectedPositions])

  if (loading) {
    return (
      <MobileLayout>
        <LoadingSkeleton variant="fullscreen" />
      </MobileLayout>
    )
  }

  return (
    <MobileLayout>
      <div className="min-h-screen bg-[#0a0a0f] pb-20">
        {/* Animated Header with transparency */}
        <AnimatedHeader 
          viewMode={viewMode} 
          onViewModeChange={setViewMode} 
        />

      {/* Main Content */}
      <main className="pt-20">
        {/* Filter Bar */}
        <FilterBar onFilterChange={handleFilterChange} />

        {/* Grid or Map view based on viewMode */}
        {viewMode === 'grid' ? (
          <LazyGridView activeFilters={activeFilters} />
        ) : (
          <div className="relative">
            <MapboxUsers 
              users={mapUsers.map(u => ({
                id: u.id,
                latitude: u.latitude,
                longitude: u.longitude,
                display_name: u.display_name,
                isCurrentUser: u.isYou,
                photo: (u.photos && Array.isArray(u.photos) && u.photos[0]) || u.photo_url || undefined,
                online: u.online,
                dtfn: u.dtfn,
                party_friendly: u.party_friendly
              }))}
              advancedPins
              autoLoad={false}
              onUserClick={handleUserClick}
              onMapClick={handleMapClick}
              center={mapCenter || undefined}
              minZoom={2}
              maxZoom={18}
              incognito={isIncognito}
              cluster={clusterEnabled}
              styleId={styleId}
              clusterRadius={clusterRadius}
              jitterMeters={jitterMeters}
              vanillaMode={vanillaMode}
            />

            {/* Map Session Menu */}
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
              filters={menuFilters}
              setFilters={setMenuFilters}
              onCenter={handleCenterLocation}
              onRelocate={handleMoveLocation}
              onClear={() => {
                setRadiusMiles(25)
                setClusterRadius(60)
                setStyleId('dark-v11')
                setMenuFilters({ online: false, hosting: false, looking: false })
                setVanillaMode(false)
                window.dispatchEvent(new CustomEvent('map_randomizer_change', { detail: 0 }))
              }}
              onAddPlace={() => setIsAddingPlace(true)}
              onHostGroup={() => setIsHostingGroup(true)}
            />

            {/* Corner Buttons */}
            <CornerButtons
              onToggleMenu={() => window.dispatchEvent(new Event('toggle_map_session_menu'))}
              onToggleNight={() => setStyleId(prev => prev === 'dark-v11' ? 'streets-v12' : 'dark-v11')}
              isNight={styleId === 'dark-v11'}
              onCenter={handleCenterLocation}
              onMessages={() => router.push('/messages')}
              onGroups={() => router.push('/groups')}
            />

            {/* Map Controls (eye/incognito + relocate) */}
            <MapControls
              onCenterLocation={handleCenterLocation}
              onToggleIncognito={handleToggleIncognito}
              onMoveLocation={handleMoveLocation}
              isIncognito={isIncognito}
            />
            
            {/* Users sidebar */}
            <div className="hidden lg:block absolute top-0 right-0 w-80 h-screen bg-black/90 backdrop-blur-xl border-l border-cyan-500/20 overflow-y-auto custom-scrollbar">
              <div className="p-4 border-b border-white/10">
                <h3 className="text-white font-bold text-lg">Nearby Users</h3>
                <p className="text-white/60 text-sm">{users.length} online</p>
              </div>
              <div className="p-2 space-y-2">
                {users.map(user => (
                  <button
                    key={user.id}
                    onClick={() => handleUserClick(user.id)}
                    className="w-full p-3 glass-bubble hover:bg-white/10 transition-all flex items-center gap-3 text-left"
                  >
                    <img
                      src={user.photos?.[0] || 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23222" width="100" height="100"/%3E%3Ctext fill="%23aaa" x="50%" y="50%" dominant-baseline="middle" text-anchor="middle"%3E?%3C/text%3E%3C/svg%3E'}
                      alt={user.display_name}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-white font-semibold truncate">{user.display_name}</p>
                        {user.age && <span className="text-white/60 text-sm">{user.age}</span>}
                      </div>
                      {user.online && (
                        <p className="text-green-400 text-xs">Online</p>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Add Place / Host Group Modals */}
      <PlaceModal
        isOpen={isAddingPlace}
        onClose={() => setIsAddingPlace(false)}
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
        onClose={() => setIsHostingGroup(false)}
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
            if (!error && data?.id) router.push(`/groups/${data.id}`)
          } catch (e) {
            console.warn('Groups table may be missing; skipping insert', e)
          }
        }}
      />

      {/* User Profile Modal */}
      <UserProfileCard
        user={selectedUser}
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        onMessage={handleMessage}
        onBlock={handleBlock}
        onReport={handleReport}
        onFavorite={handleFavorite}
        isFavorited={selectedUser ? users.find(u => u.id === selectedUser.id)?.isFavorited : false}
      />

      {/* Simple Messaging Modal - Opens on grid, doesn't navigate */}
      {showMessagingModal && messagingUser && (
        <MessagingModal
          user={messagingUser}
          isOpen={showMessagingModal}
          onClose={() => {
            setShowMessagingModal(false)
            setMessagingUser(null)
          }}
        />
      )}

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