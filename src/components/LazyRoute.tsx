'use client'

import { Suspense, lazy, useState, useRef, useEffect } from 'react'
import LoadingSkeleton from './LoadingSkeleton'

// Lazy load route components
export const LazyLoginPage = lazy(() => import('../app/login/page'))
export const LazySignupPage = lazy(() => import('../app/signup/page'))
export const LazyProfilePage = lazy(() => import('../app/profile/page'))
export const LazyMessagesPage = lazy(() => import('../app/messages/page'))
export const LazyGuidelinesPage = lazy(() => import('../app/guidelines/page'))
export const LazyPrivacyPage = lazy(() => import('../app/privacy/page'))
export const LazyTermsPage = lazy(() => import('../app/terms/page'))

// Route wrapper with loading
export function LazyRouteWrapper({ 
  children, 
  fallback 
}: { 
  children: React.ReactNode
  fallback?: React.ReactNode 
}) {
  return (
    <Suspense fallback={fallback || <LoadingSkeleton variant="fullscreen" />}>
      {children}
    </Suspense>
  )
}

// Preload route components
export function preloadRoutes() {
  // Preload critical routes
  import('../app/login/page')
  import('../app/signup/page')
  import('../app/profile/page')
  import('../app/messages/page')
}

// Intersection observer for lazy loading sections
export function useLazySection() {
  const [isVisible, setIsVisible] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0]
        if (entry && entry.isIntersecting) {
          setIsVisible(true)
          observer.disconnect()
        }
      },
      { threshold: 0.1 }
    )

    if (ref.current) {
      observer.observe(ref.current)
    }

    return () => observer.disconnect()
  }, [])

  return { ref, isVisible }
}
