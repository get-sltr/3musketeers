'use client'

import { useEffect, useState, Suspense } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import FilterBar from '@/components/FilterBar'
import MobileLayout from '@/components/MobileLayout'
import LoadingSkeleton, { MapLoadingSkeleton } from '@/components/LoadingSkeleton'
import LazyWrapper, { LazyMapWithProfiles, LazyGridView } from '@/components/LazyWrapper'
import AnimatedHeader from '@/components/AnimatedHeader'
import GradientBackground from '@/components/GradientBackground'
import MicroInteractions, { InteractiveButton } from '@/components/MicroInteractions'
import BlazeAIButton from '@/components/BlazeAIButton'
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
      <GradientBackground variant="vignette">
        {/* Animated Header with transparency */}
        <AnimatedHeader 
          viewMode={viewMode} 
          onViewModeChange={setViewMode} 
        />

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

      {/* Blaze AI Assistant Button */}
      <BlazeAIButton />
      </GradientBackground>
    </MobileLayout>
  )
}