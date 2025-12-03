'use client'

import { useState, useEffect } from 'react'

interface LocationShareProps {
  isOpen: boolean
  onClose: () => void
  onLocationSend: (location: { lat: number; lng: number; address: string }) => void
}

export default function LocationShare({
  isOpen,
  onClose,
  onLocationSend
}: LocationShareProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [address, setAddress] = useState<string>('')
  const [error, setError] = useState<string | null>(null)
  const [accuracy, setAccuracy] = useState<number | null>(null)

  useEffect(() => {
    if (isOpen) {
      getCurrentLocation()
    }
    return () => {
      setLocation(null)
      setAddress('')
      setError(null)
    }
  }, [isOpen])

  const getCurrentLocation = () => {
    setIsLoading(true)
    setError(null)

    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser')
      setIsLoading(false)
      return
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude, accuracy } = position.coords
        setLocation({ lat: latitude, lng: longitude })
        setAccuracy(accuracy)

        // Reverse geocode to get address
        try {
          const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN
          if (mapboxToken) {
            const response = await fetch(
              `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?access_token=${mapboxToken}&types=address,place,locality`
            )
            const data = await response.json()
            if (data.features && data.features.length > 0) {
              setAddress(data.features[0].place_name)
            } else {
              setAddress(`${latitude.toFixed(6)}, ${longitude.toFixed(6)}`)
            }
          } else {
            setAddress(`${latitude.toFixed(6)}, ${longitude.toFixed(6)}`)
          }
        } catch {
          setAddress(`${latitude.toFixed(6)}, ${longitude.toFixed(6)}`)
        }

        setIsLoading(false)
      },
      (error) => {
        console.error('Geolocation error:', error)
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setError('Location permission denied. Please enable location access.')
            break
          case error.POSITION_UNAVAILABLE:
            setError('Location information unavailable.')
            break
          case error.TIMEOUT:
            setError('Location request timed out.')
            break
          default:
            setError('Unable to get your location.')
        }
        setIsLoading(false)
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    )
  }

  const handleSend = () => {
    if (location && address) {
      onLocationSend({ ...location, address })
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm bg-white/10 backdrop-blur-2xl border border-white/20 rounded-3xl overflow-hidden shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 pt-6 pb-4 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-lime-400/20 to-lime-400/5 flex items-center justify-center">
            <svg className="w-8 h-8 text-lime-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-white">Share Location</h3>
          <p className="text-white/50 text-sm mt-1">Send your current location</p>
        </div>

        {/* Content */}
        <div className="px-6 pb-6">
          {isLoading ? (
            <div className="py-8 text-center">
              <div className="w-12 h-12 mx-auto mb-4 border-3 border-lime-400/30 border-t-lime-400 rounded-full animate-spin" />
              <p className="text-white/60">Getting your location...</p>
            </div>
          ) : error ? (
            <div className="py-6 text-center">
              <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-red-500/20 flex items-center justify-center">
                <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <p className="text-red-400 text-sm mb-4">{error}</p>
              <button
                onClick={getCurrentLocation}
                className="px-4 py-2 bg-white/10 text-white rounded-xl text-sm font-medium hover:bg-white/20 transition-all"
              >
                Try Again
              </button>
            </div>
          ) : location ? (
            <div className="space-y-4">
              {/* Map Preview */}
              <div className="relative h-40 rounded-2xl overflow-hidden bg-black/30">
                {process.env.NEXT_PUBLIC_MAPBOX_TOKEN ? (
                  <img
                    src={`https://api.mapbox.com/styles/v1/mapbox/dark-v11/static/pin-l+a3e635(${location.lng},${location.lat})/${location.lng},${location.lat},14,0/400x200@2x?access_token=${process.env.NEXT_PUBLIC_MAPBOX_TOKEN}`}
                    alt="Location map"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="text-4xl">📍</div>
                  </div>
                )}
                {/* Accuracy indicator */}
                {accuracy && (
                  <div className="absolute top-2 right-2 px-2 py-1 bg-black/60 backdrop-blur-sm rounded-full text-xs text-white/70">
                    ±{Math.round(accuracy)}m
                  </div>
                )}
              </div>

              {/* Address */}
              <div className="p-4 bg-white/5 rounded-2xl">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-lime-400/20 flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-lime-400" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium leading-relaxed">{address}</p>
                    <p className="text-white/40 text-xs mt-1">
                      {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 py-3 bg-white/5 text-white/70 rounded-2xl font-medium hover:bg-white/10 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSend}
                  className="flex-1 py-3 bg-lime-400 text-black rounded-2xl font-semibold hover:bg-lime-300 transition-all flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                  Send
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}
