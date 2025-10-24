'use client'

import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import GridView from '@/components/GridView'
import MapWithProfiles from '@/components/MapWithProfiles'
import FilterBar from '@/components/FilterBar'
import PanicButton from '@/components/PanicButton'
import MobileLayout from '@/components/MobileLayout'
import '@/styles/mobile-optimization.css'

type ViewMode = 'grid' | 'map'

export default function AppPage() {
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [loading, setLoading] = useState(true)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const userMenuRef = useRef<HTMLDivElement>(null)
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

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (loading) {
    return (
      <MobileLayout>
        <div className="min-h-screen bg-black flex items-center justify-center">
          <div className="text-white">Loading...</div>
        </div>
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
        <div className="relative" ref={userMenuRef}>
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="text-2xl font-black tracking-wider gradient-text hover:scale-105 transition-all duration-300 cursor-pointer"
          >
            SLTR
          </button>
          
          {/* User Menu Dropdown */}
          {showUserMenu && (
            <div className="absolute top-full left-0 mt-2 w-48 glass-bubble border border-white/20 rounded-xl overflow-hidden z-50">
              <button
                onClick={() => {
                  router.push('/profile')
                  setShowUserMenu(false)
                }}
                className="w-full px-4 py-3 text-left text-white hover:bg-white/10 transition-all duration-300 flex items-center gap-3"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Profile Settings
              </button>
              <button
                onClick={() => {
                  router.push('/messages')
                  setShowUserMenu(false)
                }}
                className="w-full px-4 py-3 text-left text-white hover:bg-white/10 transition-all duration-300 flex items-center gap-3"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                Messages
              </button>
              <button
                onClick={() => {
                  router.push('/guidelines')
                  setShowUserMenu(false)
                }}
                className="w-full px-4 py-3 text-left text-white hover:bg-white/10 transition-all duration-300 flex items-center gap-3"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Guidelines
              </button>
              <div className="border-t border-white/10"></div>
              <button
                onClick={handleLogout}
                className="w-full px-4 py-3 text-left text-red-400 hover:bg-red-500/10 transition-all duration-300 flex items-center gap-3"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Logout
              </button>
            </div>
          )}
        </div>

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
        {viewMode === 'grid' ? (
          <GridView />
        ) : (
          <div className="h-96 flex items-center justify-center">
            <div className="text-center">
              <div className="text-6xl mb-4">🗺️</div>
              <h3 className="text-white text-xl mb-2">Map Coming Soon</h3>
              <p className="text-white/60">Map view is being optimized for deployment</p>
            </div>
          </div>
        )}
      </main>

      {/* Emergency Panic Button */}
      <PanicButton />
    </div>
    </MobileLayout>
  )
}
