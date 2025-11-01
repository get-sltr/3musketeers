'use client'

import { useEffect, useState } from 'react'
import { createClient } from '../../lib/supabase/client'
import { useRouter } from 'next/navigation'
import FilterBar from '../../components/FilterBar'
import MobileLayout from '../../components/MobileLayout'
import LoadingSkeleton from '../../components/LoadingSkeleton'
import { LazyGridView } from '../../components/LazyWrapper'
import dynamic from 'next/dynamic'
import AnimatedHeader from '../../components/AnimatedHeader'
import GradientBackground from '../../components/GradientBackground'
import BlazeAIButton from '../../components/BlazeAIButton'
import UserProfileCard from '../components/UserProfileCard'
import MapControls from '../components/MapControls'
import MessagingModal from '../../components/MessagingModal'
import '../../styles/mobile-optimization.css'

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
}

export default function AppPage() {
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [loading, setLoading] = useState(true)
  const [activeFilters, setActiveFilters] = useState<string[]>([])
  const [users, setUsers] = useState<UserWithLocation[]>([])
  const [selectedUser, setSelectedUser] = useState<UserWithLocation | null>(null)
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [messagingUser, setMessagingUser] = useState<UserWithLocation | null>(null)
  const [showMessagingModal, setShowMessagingModal] = useState(false)
  const [isIncognito, setIsIncognito] = useState(false)
  const [isRelocating, setIsRelocating] = useState(false)
  const [mapCenter, setMapCenter] = useState<[number, number] | null>(null)
  const router = useRouter()

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
      setLoading(false)
    }
    checkAuth()
  }, [router])

  const fetchUsers = async (currentUserId: string) => {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('profiles')
      .select('id, display_name, age, photos, bio, kinks, tags, position, height, body_type, ethnicity, online, latitude, longitude')
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
    
    setUsers(usersWithYou)
  }

  const handleFilterChange = (filters: string[]) => {
    setActiveFilters(filters)
    console.log('Active filters:', filters)
  }

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
    if (!user) return

    // Check if already favorited
    const { data: existing } = await supabase
      .from('favorites')
      .select('id')
      .eq('user_id', user.id)
      .eq('favorite_user_id', userId)
      .single()

    if (existing) {
      // Remove favorite
      const { error } = await supabase
        .from('favorites')
        .delete()
        .eq('id', existing.id)

      if (!error) {
        setUsers(prev => prev.map(u => 
          u.id === userId ? { ...u, isFavorited: false } : u
        ))
      }
    } else {
      // Add favorite
      const { error } = await supabase
        .from('favorites')
        .insert({
          user_id: user.id,
          favorite_user_id: userId,
          created_at: new Date().toISOString()
        })

      if (!error) {
        setUsers(prev => prev.map(u => 
          u.id === userId ? { ...u, isFavorited: true } : u
        ))
      }
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


  if (loading) {
    return (
      <MobileLayout>
        <LoadingSkeleton variant="fullscreen" />
      </MobileLayout>
    )
  }

  return (
    <MobileLayout>
      <div className="min-h-screen bg-[#0a0a0f]">
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
              users={users.map(u => ({
                id: u.id,
                latitude: u.latitude!,
                longitude: u.longitude!,
                display_name: u.isYou ? 'You' : u.display_name,
                isCurrentUser: u.isYou
              }))}
              onUserClick={handleUserClick}
              onMapClick={handleMapClick}
              center={mapCenter || undefined}
              minZoom={2}
              maxZoom={18}
            />
            
            {/* Map Controls */}
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

      {/* Blaze AI Assistant Button */}
      <BlazeAIButton />
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