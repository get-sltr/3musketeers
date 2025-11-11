"use client"

import { useState } from "react"
import { useTranslations } from 'next-intl'

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
  filters: { online: boolean; hosting: boolean; looking: boolean }
  setFilters: (f: { online: boolean; hosting: boolean; looking: boolean }) => void
  onCenter: () => void
  onRelocate: () => void
  onClear: () => void
  onAddPlace: () => void
  onHostGroup: () => void
  showVenues: boolean
  onToggleVenues: (enabled: boolean) => void
  showHeatmap: boolean
  onToggleHeatmap: (enabled: boolean) => void
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
  showHeatmap,
  onToggleHeatmap,
}: MapSessionMenuProps) {
  const t = useTranslations('map')
  const tCommon = useTranslations('common')
  const tActions = useTranslations('actions')
  const [open, setOpen] = useState(false)

  // Allow external toggling (e.g., from corner button)
  if (typeof window !== 'undefined') {
    // attach once per render pass
    (window as any).__mapMenuInit || ((window as any).__mapMenuInit = (() => {
      window.addEventListener('toggle_map_session_menu', () => setOpen(prev => !prev))
      return true
    })())
  }

  return (
    <div className="fixed top-32 left-4 z-30">
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

          {/* Radius */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-sm text-white/80">{t('radius')}</label>
              <span className="text-sm text-cyan-400 font-semibold">{radiusMiles} {tCommon('mi')}</span>
            </div>
            <input
              type="range"
              min={1}
              max={100}
              step={1}
              value={radiusMiles}
              onChange={(e) => setRadiusMiles(parseInt(e.target.value))}
              className="w-full accent-cyan-400"
            />
          </div>

          {/* Filters */}
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => setFilters({ ...filters, online: !filters.online })}
              className={`px-3 py-2 rounded-xl text-sm border transition ${filters.online ? "bg-green-500/20 border-green-400 text-green-300" : "bg-white/5 border-white/10 text-white/80"}`}
            >
              {t('online')}
            </button>
            <button
              onClick={() => setFilters({ ...filters, hosting: !filters.hosting })}
              className={`px-3 py-2 rounded-xl text-sm border transition ${filters.hosting ? "bg-yellow-500/20 border-yellow-400 text-yellow-300" : "bg-white/5 border-white/10 text-white/80"}`}
            >
              {t('hosting')}
            </button>
            <button
              onClick={() => setFilters({ ...filters, looking: !filters.looking })}
              className={`px-3 py-2 rounded-xl text-sm border transition ${filters.looking ? "bg-red-500/20 border-red-400 text-red-300" : "bg-white/5 border-white/10 text-white/80"}`}
            >
              {t('looking')}
            </button>
          </div>

          {/* Map style & Vanilla Mode */}
          <div>
            <div className="flex items-center justify-between">
              <label className="text-sm text-white/80">{t('mapStyle')}</label>
              <button
                onClick={() => onToggleVanilla(!vanillaMode)}
                className={`px-3 py-1 rounded-xl text-xs border transition ${vanillaMode ? "bg-blue-500/20 border-blue-400 text-blue-200" : "bg-white/5 border-white/10 text-white/80"}`}
                title={t('vanillaMode')}
              >
                {vanillaMode ? t('vanillaOn') : t('vanillaOff')}
              </button>
            </div>
            <div className="mt-2 grid grid-cols-3 gap-2 text-xs">
              {[
                { id: "dark-v11", label: t('dark') },
                { id: "streets-v12", label: t('streets') },
                { id: "satellite-streets-v12", label: t('satellite') },
              ].map((s) => (
                <button
                  key={s.id}
                  onClick={() => setStyleId(s.id)}
                  className={`px-3 py-2 rounded-xl border transition ${
                    styleId === s.id ? "bg-cyan-500/20 border-cyan-400 text-cyan-300" : "bg-white/5 border-white/10 text-white/80"
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Cluster markers toggle + density */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm text-white/80">{t('clusterMarkers')}</label>
              <button
                onClick={() => setClusterEnabled(!clusterEnabled)}
                className={`px-3 py-1 rounded-xl text-xs border transition ${clusterEnabled ? "bg-cyan-500/20 border-cyan-400 text-cyan-300" : "bg-white/5 border-white/10 text-white/80"}`}
              >
                {clusterEnabled ? tCommon('on') : tCommon('off')}
              </button>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-sm text-white/80">{t('clusterDensity')}</label>
                <span className="text-sm text-cyan-400 font-semibold">{clusterRadius}</span>
              </div>
              <input
                type="range"
                min={30}
                max={120}
                step={5}
                value={clusterRadius}
                onChange={(e) => setClusterRadius(parseInt(e.target.value))}
                className="w-full accent-cyan-400"
              />
            </div>
          </div>

          {/* Incognito */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm text-white/80">{t('incognito')}</span>
            </div>
            <button
              onClick={() => onToggleIncognito(!incognito)}
              className={`px-3 py-2 rounded-xl text-sm border transition ${incognito ? "bg-purple-500/20 border-purple-400 text-purple-200" : "bg-white/5 border-white/10 text-white/80"}`}
            >
              {incognito ? tCommon('on') : tCommon('off')}
            </button>
          </div>

          {/* LGBTQ Venues */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm text-white/80">{t('lgbtqVenues')} 🍸</span>
            </div>
            <button
              onClick={() => onToggleVenues(!showVenues)}
              className={`px-3 py-2 rounded-xl text-sm border transition ${showVenues ? "bg-pink-500/20 border-pink-400 text-pink-200" : "bg-white/5 border-white/10 text-white/80"}`}
            >
              {showVenues ? tCommon('on') : tCommon('off')}
            </button>
          </div>

          {/* User Heatmap */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm text-white/80">{t('userDensity')}</span>
            </div>
            <button
              onClick={() => onToggleHeatmap(!showHeatmap)}
              className={`px-3 py-2 rounded-xl text-sm border transition ${showHeatmap ? "bg-cyan-500/20 border-cyan-400 text-cyan-200" : "bg-white/5 border-white/10 text-white/80"}`}
            >
              {showHeatmap ? tCommon('on') : tCommon('off')}
            </button>
          </div>

          {/* Actions */}
          <div className="grid grid-cols-3 gap-2">
            <button onClick={onCenter} className="px-3 py-2 rounded-xl text-sm bg-white/5 border border-white/10 hover:bg-white/10 transition">{tActions('center')}</button>
            <button onClick={onRelocate} className="px-3 py-2 rounded-xl text-sm bg-white/5 border border-white/10 hover:bg-white/10 transition">{tActions('relocate')}</button>
            <button onClick={onClear} className="px-3 py-2 rounded-xl text-sm bg-white/5 border border-white/10 hover:bg-white/10 transition">{tActions('clear')}</button>
          </div>

          {/* Places & Groups */}
          <div className="grid grid-cols-2 gap-2">
            <button onClick={onHostGroup} className="px-3 py-2 rounded-xl text-sm bg-indigo-600/20 border border-indigo-400/40 hover:bg-indigo-600/30 transition">{tActions('hostGroup')}</button>
            <button onClick={onAddPlace} className="px-3 py-2 rounded-xl text-sm bg-emerald-600/20 border border-emerald-400/40 hover:bg-emerald-600/30 transition">{tActions('addPlace')}</button>
          </div>
        </div>
      )}
    </div>
  )
}