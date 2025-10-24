'use client'

import { useEffect, useState, Suspense } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import FilterBar from '@/components/FilterBar'
import PanicButton from '@/components/PanicButton'
import MobileLayout from '@/components/MobileLayout'
import UserMenu from '@/components/UserMenu'
import LoadingSkeleton, { MapLoadingSkeleton } from '@/components/LoadingSkeleton'
import LazyWrapper, { LazyMapWithProfiles, LazyGridView } from '@/components/LazyWrapper'
import '@/styles/mobile-optimization.css'

type ViewMode = 'grid' | 'map'

export default function AppPage() {
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        router.push('/login')
        return
      }
      
      setLoading(false)
    }
    checkAuth()
  }, [])


  if (loading) {
    return (
      <MobileLayout>
        <LoadingSkeleton variant="fullscreen" />
      </MobileLayout>
    )
  }

  return (
    <MobileLayout>
      <div className="min-h-screen bg-black">
      {/* Header with logo and toggle */}
      <header 
        className="fixed top-0 left-0 right-0 z-50 h-20 flex items-center justify-between px-6"
        style={{
          background: 'rgba(0, 0, 0, 0.95)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
        }}
      >
        {/* SLTR Logo with User Menu */}
        <UserMenu />

        {/* View Toggle */}
        <div className="flex items-center gap-4">
          <div className="flex glass-bubble p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 ${
                viewMode === 'grid' 
                  ? 'bg-gradient-to-r from-[#00d4ff] to-[#ff00ff] text-white scale-105' 
                  : 'text-white/60 hover:text-white'
              }`}
            >
              Grid
            </button>
            <button
              onClick={() => setViewMode('map')}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 ${
                viewMode === 'map' 
                  ? 'bg-gradient-to-r from-[#00d4ff] to-[#ff00ff] text-white scale-105' 
                  : 'text-white/60 hover:text-white'
              }`}
            >
              Map
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-20">
        {/* Filter Bar */}
        <FilterBar />

        {/* Grid or Map view based on viewMode */}
        <LazyWrapper variant="card">
          {viewMode === 'grid' ? (
            <LazyGridView />
          ) : (
            <LazyMapWithProfiles onUserClick={(userId) => console.log('User clicked:', userId)} />
          )}
        </LazyWrapper>
      </main>

      {/* Emergency Panic Button */}
      <PanicButton />
    </div>
    </MobileLayout>
  )
}