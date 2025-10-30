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
}

export default function AppPage() {
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [loading, setLoading] = useState(true)
  const [activeFilters, setActiveFilters] = useState<string[]>([])
  const [users, setUsers] = useState<UserWithLocation[]>([])
  const [selectedUser, setSelectedUser] = useState<UserWithLocation | null>(null)
  const [showProfileModal, setShowProfileModal] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        router.push('/login')
        return
      }
      
      // Fetch users with location data
      await fetchUsers()
      setLoading(false)
    }
    checkAuth()
  }, [router])

  const fetchUsers = async () => {
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
    
    setUsers(data || [])
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

  const handleMessage = (userId: string) => {
    router.push(`/messages/${userId}`)
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
      <GradientBackground variant="vignette">
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
                display_name: u.display_name
              }))}
              onUserClick={handleUserClick}
              minZoom={2}
              maxZoom={18}
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
                      src={user.photos?.[0] || 'https://via.placeholder.com/50'}
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
      />

      {/* Blaze AI Assistant Button */}
      <BlazeAIButton />
      </GradientBackground>
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