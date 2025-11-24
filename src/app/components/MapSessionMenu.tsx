"use client"

import { useState, useEffect } from "react"
import { useTranslations } from 'next-intl'

const SLTR_STYLE_ID =
  process.env.NEXT_PUBLIC_MAPBOX_SLTR_STYLE || 'mapbox://styles/sltr/cmhum4i1k001x01rlasmoccvm'

interface MapSessionMenuProps {
  radiusMiles: number
  setRadiusMiles: (n: number) => void
  clusterRadius: number
  setClusterRadius: (n: number) => void
  clusterEnabled: boolean
  setClusterEnabled: (b: boolean) => void
  styleId: string
  setStyleId: (s: string) => void
  incognito: boolean
  onToggleIncognito: (enabled: boolean) => void
  vanillaMode: boolean
  onToggleVanilla: (enabled: boolean) => void
  travelMode: boolean
  onToggleTravelMode: (enabled: boolean) => void
  filters: { online: boolean; hosting: boolean; looking: boolean }
  setFilters: (f: { online: boolean; hosting: boolean; looking: boolean }) => void
  onCenter: () => void
  onRelocate: () => void
  onClear: () => void
  onAddPlace: () => void
  onHostGroup: () => void
  showVenues: boolean
  onToggleVenues: (enabled: boolean) => void
  showRestaurants: boolean
  onToggleRestaurants: (enabled: boolean) => void
  showBars: boolean
  onToggleBars: (enabled: boolean) => void
  showHeatmap: boolean
  onToggleHeatmap: (enabled: boolean) => void
  pinStyle?: number
  onPinStyleChange?: (styleId: number) => void
}

export default function MapSessionMenu({
  radiusMiles,
  setRadiusMiles,
  clusterRadius,
  setClusterRadius,
  styleId,
  setStyleId,
  incognito,
  onToggleIncognito,
  vanillaMode,
  onToggleVanilla,
  travelMode,
  onToggleTravelMode,
  filters,
  setFilters,
  onCenter,
  onRelocate,
  onClear,
  clusterEnabled,
  setClusterEnabled,
  onAddPlace,
  onHostGroup,
  showVenues,
  onToggleVenues,
  showRestaurants,
  onToggleRestaurants,
  showBars,
  onToggleBars,
  showHeatmap,
  onToggleHeatmap,
  pinStyle = 1,
  onPinStyleChange,
}: MapSessionMenuProps) {
  const t = useTranslations('map')
  const tCommon = useTranslations('common')
  const tActions = useTranslations('actions')
  const [open, setOpen] = useState(false)

  // Allow external toggling (e.g., from corner button) with proper cleanup
  useEffect(() => {
    const handler = () => setOpen(prev => !prev)
    window.addEventListener('toggle_map_session_menu', handler)
    return () => window.removeEventListener('toggle_map_session_menu', handler)
  }, [])

  return (
    <div className="fixed top-20 left-4 z-20">
      <button
        onClick={() => setOpen(!open)}
        className="mb-3 px-4 py-2 rounded-full bg-black/80 border border-white/10 text-white text-sm font-semibold hover:bg-black/70 transition shadow-lg"
      >
        {open ? tCommon('hide') : tCommon('show')} {t('mapSession')}
      </button>

      {open && (
        <div className="w-80 max-w-[90vw] p-4 rounded-2xl bg-black/80 border border-cyan-500/20 backdrop-blur-xl shadow-2xl space-y-4 text-white">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">{t('sessionControls')}</h3>
            <span className="text-xs text-white/50">{tCommon('live')}</span>
          </div>

          {/* Travel Mode Toggle */}
          <div className="flex items-center justify-between p-3 rounded-xl border border-amber-500/30 bg-amber-500/10">
            <div className="flex items-center gap-2">
              <span className="text-2xl">✈️</span>
              <div>
                <span className="text-sm text-white font-semibold block">Travel Mode</span>
                <span className="text-xs text-white/60">See friends worldwide</span>
              </div>
            </div>
            <button
              onClick={() => onToggleTravelMode(!travelMode)}
              className={`px-3 py-2 rounded-xl text-sm border transition ${travelMode ? "bg-amber-500/20 border-amber-400 text-amber-200" : "bg-white/5 border-white/10 text-white/80"}`}
            >
              {travelMode ? tCommon('on') : tCommon('off')}
            </button>
          </div>

          {/* Radius - only show when NOT in travel mode */}
          {!travelMode && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-sm text-white/80">{t('radius')}</label>
                <span className="text-sm text-cyan-400 font-semibold">{radiusMiles} {tCommon('mi')}</span>
              </div>
              <input
                type="range"
                min={1}
                max={10}
                step={0.5}
                value={radiusMiles}
                onChange={(e) => setRadiusMiles(parseFloat(e.target.value))}
                className="w-full accent-cyan-400"
              />
            </div>
          )}

          {travelMode && (
            <div className="text-center p-2 rounded-xl bg-amber-500/10 border border-amber-500/20">
              <p className="text-xs text-amber-200">🌍 Showing users worldwide - no distance limit</p>
            </div>
          )}

          {/* Filters */}
          <div className="space-y-3">
            {/* Online Now */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-white/80">Online Now</span>
              <button
                onClick={() => setFilters({ ...filters, online: !filters.online })}
                className={`px-3 py-2 rounded-xl text-sm border transition ${filters.online ? "bg-lime-400/20 border-lime-400 text-lime-300" : "bg-white/5 border-white/10 text-white/80"}`}
              >
                {filters.online ? tCommon('on') : tCommon('off')}
              </button>
            </div>
            
            {/* DTFN */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-white/80">DTFN</span>
              <button
                onClick={() => setFilters({ ...filters, looking: !filters.looking })}
                className={`px-3 py-2 rounded-xl text-sm border transition ${filters.looking ? "bg-lime-400/20 border-lime-400 text-lime-300" : "bg-white/5 border-white/10 text-white/80"}`}
              >
                {filters.looking ? tCommon('on') : tCommon('off')}
              </button>
            </div>
          </div>


          {/* Venues Section */}
          <div className="space-y-2 border-t border-white/10 pt-3">
            <div className="text-xs text-white/60 mb-2">Venues</div>
            
            {/* Restaurants */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm text-white/80">🍽️ Restaurants</span>
              </div>
              <button
                onClick={() => onToggleRestaurants(!showRestaurants)}
                className={`px-3 py-2 rounded-xl text-sm border transition ${showRestaurants ? "bg-orange-500/20 border-orange-400 text-orange-200" : "bg-white/5 border-white/10 text-white/80"}`}
              >
                {showRestaurants ? tCommon('on') : tCommon('off')}
              </button>
            </div>

            {/* Bars */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm text-white/80">🍺 Bars</span>
              </div>
              <button
                onClick={() => onToggleBars(!showBars)}
                className={`px-3 py-2 rounded-xl text-sm border transition ${showBars ? "bg-amber-500/20 border-amber-400 text-amber-200" : "bg-white/5 border-white/10 text-white/80"}`}
              >
                {showBars ? tCommon('on') : tCommon('off')}
              </button>
            </div>

            {/* LGBTQ Venues */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm text-white/80">{t('lgbtqVenues')} 🏳️‍🌈</span>
              </div>
              <button
                onClick={() => onToggleVenues(!showVenues)}
                className={`px-3 py-2 rounded-xl text-sm border transition ${showVenues ? "bg-pink-500/20 border-pink-400 text-pink-200" : "bg-white/5 border-white/10 text-white/80"}`}
              >
                {showVenues ? tCommon('on') : tCommon('off')}
              </button>
            </div>
          </div>

          {/* Testing Centres Toggle */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm text-white/80">Testing Centres 🦠</span>
            </div>
            <button
              onClick={() => onToggleHeatmap(!showHeatmap)}
              className={`px-3 py-2 rounded-xl text-sm border transition ${showHeatmap ? "bg-lime-400/20 border-lime-400 text-lime-200" : "bg-white/5 border-white/10 text-white/80"}`}
            >
              {showHeatmap ? tCommon('on') : tCommon('off')}
            </button>
          </div>

          {/* Host a Group Button */}
          <button 
            onClick={onHostGroup} 
            className="w-full px-4 py-3 rounded-xl text-sm font-semibold bg-lime-400 text-black hover:bg-lime-300 transition"
          >
            Host a Group
          </button>
        </div>
      )}
    </div>
  )
}