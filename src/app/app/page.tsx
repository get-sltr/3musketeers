'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import GridView from '@/components/GridView'
import MapView from '@/components/MapView'
import FilterBar from '@/components/FilterBar'

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
  }, [router])

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    )
  }

  return (
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
        {/* SLTR Logo */}
        <div className="flex items-center">
          <h1 
            className="text-2xl font-black tracking-wider"
            style={{
              background: 'linear-gradient(135deg, #00d4ff, #ff00ff)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}
          >
            SLTR
          </h1>
        </div>

        {/* View Toggle */}
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
      </header>

      {/* Main Content */}
      <main className="pt-20">
        {/* Filter Bar */}
        <FilterBar />

        {/* Grid or Map view based on viewMode */}
        {viewMode === 'grid' ? (
          <GridView />
        ) : (
          <MapView />
        )}
      </main>
    </div>
  )
}
