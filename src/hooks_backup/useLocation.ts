'use client'

import { useState, useEffect, useCallback } from 'react'
import { Location, generateGeoHash, addPrivacyJitter } from '../utils/geohash'

interface UseLocationOptions {
  enableHighAccuracy?: boolean
  timeout?: number
  maximumAge?: number
  enablePrivacyJitter?: boolean
}

interface UseLocationReturn {
  location: Location | null
  error: string | null
  loading: boolean
  geoHash: string | null
  updateLocation: () => void
}

/**
 * Custom hook for location management with privacy protection
 * Includes geohashing, jitter, and error handling
 */
export function useLocation(options: UseLocationOptions = {}): UseLocationReturn {
  const {
    enableHighAccuracy = true,
    timeout = 10000,
    maximumAge = 0,
    enablePrivacyJitter = true
  } = options

  const [location, setLocation] = useState<Location | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [geoHash, setGeoHash] = useState<string | null>(null)

  const updateLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by this browser')
      return
    }

    setLoading(true)
    setError(null)

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const newLocation: Location = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy
        }

        // Apply privacy jitter if enabled
        const finalLocation = enablePrivacyJitter 
          ? addPrivacyJitter(newLocation) 
          : newLocation

        setLocation(finalLocation)
        
        // Generate geohash for efficient searching
        const hash = generateGeoHash(finalLocation)
        setGeoHash(hash.hash)
        
        setLoading(false)
      },
      (error) => {
        let errorMessage = 'Unknown error occurred'
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location access denied. Please enable location permissions.'
            break
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information unavailable.'
            break
          case error.TIMEOUT:
            errorMessage = 'Location request timed out.'
            break
        }
        
        setError(errorMessage)
        setLoading(false)
      },
      {
        enableHighAccuracy,
        timeout,
        maximumAge
      }
    )
  }, [enableHighAccuracy, timeout, maximumAge, enablePrivacyJitter])

  // Auto-update location on mount
  useEffect(() => {
    updateLocation()
  }, [updateLocation])

  return {
    location,
    error,
    loading,
    geoHash,
    updateLocation
  }
}

/**
 * Hook for watching location changes with privacy protection
 */
export function useLocationWatch(
  onLocationChange: (location: Location, geoHash: string) => void,
  options: UseLocationOptions = {}
) {
  const { enablePrivacyJitter = true } = options
  const [watchId, setWatchId] = useState<number | null>(null)

  const startWatching = useCallback(() => {
    if (!navigator.geolocation) {
      console.error('Geolocation is not supported')
      return
    }

    const id = navigator.geolocation.watchPosition(
      (position) => {
        const newLocation: Location = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy
        }

        const finalLocation = enablePrivacyJitter 
          ? addPrivacyJitter(newLocation) 
          : newLocation

        const hash = generateGeoHash(finalLocation)
        onLocationChange(finalLocation, hash.hash)
      },
      (error) => {
        console.error('Location watch error:', error)
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 30000 // 30 seconds
      }
    )

    setWatchId(id)
  }, [onLocationChange, enablePrivacyJitter])

  const stopWatching = useCallback(() => {
    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId)
      setWatchId(null)
    }
  }, [watchId])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopWatching()
    }
  }, [stopWatching])

  return {
    startWatching,
    stopWatching,
    isWatching: watchId !== null
  }
}
