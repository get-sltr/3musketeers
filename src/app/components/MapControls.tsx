'use client'

import { useState } from 'react'
import { useHasFeature } from '@/hooks/usePrivileges'
import UpgradePrompt from '@/components/UpgradePrompt'

interface MapControlsProps {
  onCenterLocation: () => void
  onToggleIncognito: (enabled: boolean) => void
  onMoveLocation: () => void
  isIncognito: boolean
  rightOffset?: number
}

export default function MapControls({ 
  onCenterLocation, 
  onToggleIncognito, 
  onMoveLocation,
  isIncognito,
  rightOffset = 16,
}: MapControlsProps) {
  const [movingLocation, setMovingLocation] = useState(false)
  const [showUpgrade, setShowUpgrade] = useState<string | null>(null)

  // 🔒 Check Plus features
  const { allowed: hasTravelMode } = useHasFeature('travel_mode')
  const { allowed: hasIncognito } = useHasFeature('incognito_mode')

  const handleMoveLocation = () => {
    // 🔒 Gate travel mode
    if (!hasTravelMode) {
      setShowUpgrade('Travel Mode')
      return
    }
    setMovingLocation(!movingLocation)
    onMoveLocation()
  }

  const handleToggleIncognito = () => {
    // 🔒 Gate incognito mode
    if (!hasIncognito) {
      setShowUpgrade('Incognito Mode')
      return
    }
    onToggleIncognito(!isIncognito)
  }

  return (
    <>
      {/* 🔒 Upgrade prompt */}
      {showUpgrade && (
        <UpgradePrompt feature={showUpgrade} onClose={() => setShowUpgrade(null)} />
      )}

      <div
        className="fixed top-1/2 flex flex-col gap-3 z-40 transform -translate-y-1/2"
        style={{ right: rightOffset }}
      >
        {/* Center to current location */}
        <button
          onClick={onCenterLocation}
          className="w-14 h-14 rounded-full bg-black/90 backdrop-blur-xl border-2 border-cyan-500/30 flex items-center justify-center hover:border-cyan-500 hover:scale-110 transition-all shadow-lg shadow-black/50"
          title="Center on my location"
          aria-label="Center on my location"
        >
          <svg className="w-7 h-7 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
        </button>

        {/* Toggle incognito mode - 🔒 Plus only */}
        <button
          onClick={handleToggleIncognito}
          className={`w-14 h-14 rounded-full backdrop-blur-xl border-2 flex items-center justify-center hover:scale-110 transition-all shadow-lg shadow-black/50 ${
            isIncognito
              ? 'bg-purple-500/90 border-purple-400'
              : hasIncognito
                ? 'bg-black/90 border-white/30 hover:border-white/50'
                : 'bg-black/90 border-white/20 opacity-60'
          }`}
          title={hasIncognito ? (isIncognito ? "Incognito ON" : "Go Incognito") : "Incognito (Pro)"}
          aria-label={hasIncognito ? (isIncognito ? "Turn off incognito mode" : "Turn on incognito mode") : "Incognito mode requires Pro"}
        >
        <svg className={`w-7 h-7 ${isIncognito ? 'text-white' : 'text-white/70'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
        </svg>
      </button>

        {/* Move/relocate on map - 🔒 Plus only */}
        <button
          onClick={handleMoveLocation}
          className={`w-14 h-14 rounded-full backdrop-blur-xl border-2 flex items-center justify-center hover:scale-110 transition-all shadow-lg shadow-black/50 ${
            movingLocation
              ? 'bg-magenta-500/90 border-magenta-400 animate-pulse'
              : hasTravelMode
                ? 'bg-black/90 border-cyan-500/30 hover:border-cyan-500'
                : 'bg-black/90 border-white/20 opacity-60'
          }`}
          title={hasTravelMode ? "Move my location" : "Travel Mode (Pro)"}
          aria-label={hasTravelMode ? (movingLocation ? "Cancel move location" : "Move my location") : "Travel mode requires Pro"}
        >
          <svg className={`w-7 h-7 ${movingLocation ? 'text-white' : hasTravelMode ? 'text-cyan-400' : 'text-white/50'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          {!hasTravelMode && <span className="absolute -top-1 -right-1 text-xs" aria-hidden="true">🔒</span>}
        </button>

        {/* Status indicator when moving */}
        {movingLocation && (
          <div className="absolute -top-16 right-1/2 translate-x-1/2 bg-magenta-500/90 backdrop-blur-xl border border-magenta-400 px-4 py-2 rounded-full text-white text-sm font-semibold whitespace-nowrap shadow-lg">
            Click map to relocate
          </div>
        )}

        {/* Incognito indicator */}
        {isIncognito && (
          <div className="absolute -top-16 right-1/2 translate-x-1/2 bg-purple-500/90 backdrop-blur-xl border border-purple-400 px-4 py-2 rounded-full text-white text-sm font-semibold whitespace-nowrap shadow-lg flex items-center gap-2">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
            Incognito Mode
          </div>
        )}
      </div>
    </>
  )
}
