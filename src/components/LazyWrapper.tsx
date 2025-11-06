'use client'

import { Suspense, lazy, ComponentType } from 'react'
import LoadingSkeleton from './LoadingSkeleton'

interface LazyWrapperProps {
  fallback?: React.ReactNode
  variant?: 'text' | 'card' | 'avatar' | 'button' | 'fullscreen'
  className?: string
}

// Higher-order component for lazy loading
export function withLazyLoading<P extends object>(
  Component: ComponentType<P>,
  fallback?: React.ReactNode,
  variant: 'text' | 'card' | 'avatar' | 'button' | 'fullscreen' = 'fullscreen'
) {
  return function LazyComponent(props: P) {
    return (
      <Suspense fallback={fallback || <LoadingSkeleton variant={variant} />}>
        <Component {...props} />
      </Suspense>
    )
  }
}

// Lazy loading wrapper component
export default function LazyWrapper({ 
  children, 
  fallback, 
  variant = 'fullscreen',
  className = ''
}: LazyWrapperProps & { children: React.ReactNode }) {
  return (
    <Suspense fallback={fallback || <LoadingSkeleton variant={variant} className={className} />}>
      {children}
    </Suspense>
  )
}

// Lazy load heavy components
export const LazyMapWithProfiles = lazy(() => import('./MapWithProfiles'))
export const LazyGridView = lazy(() => import('./GridView'))
export const LazyVideoCall = lazy(() => import('./VideoCall'))
export const LazyFileUpload = lazy(() => import('./FileUpload'))
export const LazyErosAI = lazy(() => import('./ErosAI'))
export const LazyScrollableProfileCard = lazy(() => import('./ScrollableProfileCard'))
export const LazyUserProfileModal = lazy(() => import('./UserProfileModal'))
export const LazyAlbumsManager = lazy(() => import('./AlbumsManager'))
export const LazyErosMatchFinder = lazy(() => import('./ErosMatchFinder'))
export const LazyErosProfileOptimizer = lazy(() => import('./ErosProfileOptimizer'))
