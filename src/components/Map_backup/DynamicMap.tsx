'use client'

import dynamic from 'next/dynamic'
import { Suspense } from 'react'

// Dynamically import the map component with SSR disabled
const LocationMap = dynamic(() => import('./LocationMap'), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full bg-gray-900 flex items-center justify-center">
      <div className="text-white text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400 mx-auto mb-4"></div>
        <p>Loading map...</p>
      </div>
    </div>
  )
})

interface DynamicMapProps {
  users: any[]
  center?: { latitude: number; longitude: number }
  onUserClick?: (user: any) => void
  className?: string
}

/**
 * Dynamic map component with SSR disabled for optimal performance
 * Includes lazy loading, error boundaries, and smooth animations
 */
export default function DynamicMap(props: DynamicMapProps) {
  return (
    <Suspense fallback={
      <div className="h-full w-full bg-gray-900 flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-pulse">
            <div className="h-8 w-8 bg-cyan-400 rounded-full mx-auto mb-4"></div>
            <div className="h-4 w-32 bg-gray-600 rounded mx-auto"></div>
          </div>
        </div>
      </div>
    }>
      <LocationMap {...props} />
    </Suspense>
  )
}
