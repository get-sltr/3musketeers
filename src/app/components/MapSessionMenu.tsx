"use client"

import { useState } from "react"

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
}: MapSessionMenuProps) {
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
    <div className="fixed top-36 left-4 z-40">
      <button
        onClick={() => setOpen(!open)}
        className="mb-3 px-4 py-2 rounded-full bg-black/80 border border-white/10 text-white text-sm font-semibold hover:bg-black/70 transition shadow-lg"
      >
        {open ? "Hide" : "Show"} Map Session
      </button>

      {open && (
        <div className="w-80 max-w-[90vw] p-4 rounded-2xl bg-black/80 border border-cyan-500/20 backdrop-blur-xl shadow-2xl space-y-4 text-white">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Session Controls</h3>
            <span className="text-xs text-white/50">Live</span>
          </div>

          {/* Radius */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-sm text-white/80">Radius</label>
              <span className="text-sm text-cyan-400 font-semibold">{radiusMiles} mi</span>
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
              Online
            </button>
            <button
              onClick={() => setFilters({ ...filters, hosting: !filters.hosting })}
              className={`px-3 py-2 rounded-xl text-sm border transition ${filters.hosting ? "bg-yellow-500/20 border-yellow-400 text-yellow-300" : "bg-white/5 border-white/10 text-white/80"}`}
            >
              Hosting
            </button>
            <button
              onClick={() => setFilters({ ...filters, looking: !filters.looking })}
              className={`px-3 py-2 rounded-xl text-sm border transition ${filters.looking ? "bg-red-500/20 border-red-400 text-red-300" : "bg-white/5 border-white/10 text-white/80"}`}
            >
              Looking
            </button>
          </div>

          {/* Map style & Vanilla Mode */}
          <div>
            <div className="flex items-center justify-between">
              <label className="text-sm text-white/80">Map Style</label>
              <button
                onClick={() => onToggleVanilla(!vanillaMode)}
                className={`px-3 py-1 rounded-xl text-xs border transition ${vanillaMode ? "bg-blue-500/20 border-blue-400 text-blue-200" : "bg-white/5 border-white/10 text-white/80"}`}
                title="Vanilla Mode (hide NSFW)"
              >
                {vanillaMode ? 'Vanilla On' : 'Vanilla Off'}
              </button>
            </div>
            <div className="mt-2 grid grid-cols-3 gap-2 text-xs">
              {[
                { id: "dark-v11", label: "Dark" },
                { id: "streets-v12", label: "Streets" },
                { id: "satellite-streets-v12", label: "Satellite" },
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
              <label className="text-sm text-white/80">Cluster Markers</label>
              <button
                onClick={() => setClusterEnabled(!clusterEnabled)}
                className={`px-3 py-1 rounded-xl text-xs border transition ${clusterEnabled ? "bg-cyan-500/20 border-cyan-400 text-cyan-300" : "bg-white/5 border-white/10 text-white/80"}`}
              >
                {clusterEnabled ? 'On' : 'Off'}
              </button>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-sm text-white/80">Cluster Density</label>
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

          {/* Location Randomizer */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-sm text-white/80">Location Randomizer</label>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-white/60 text-xs">less</span>
              <input type="range" min={0} max={150} step={5} id="randomizer-slider" className="flex-1 accent-cyan-400" onChange={(e)=>{
                const ev = new CustomEvent('map_randomizer_change', { detail: parseInt((e.target as HTMLInputElement).value) })
                window.dispatchEvent(ev)
              }} />
              <span className="text-white/60 text-xs">more</span>
            </div>
          </div>

          {/* Incognito */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm text-white/80">Incognito</span>
            </div>
            <button
              onClick={() => onToggleIncognito(!incognito)}
              className={`px-3 py-2 rounded-xl text-sm border transition ${incognito ? "bg-purple-500/20 border-purple-400 text-purple-200" : "bg-white/5 border-white/10 text-white/80"}`}
            >
              {incognito ? "On" : "Off"}
            </button>
          </div>

          {/* Actions */}
          <div className="grid grid-cols-3 gap-2">
            <button onClick={onCenter} className="px-3 py-2 rounded-xl text-sm bg-white/5 border border-white/10 hover:bg-white/10 transition">Center</button>
            <button onClick={onRelocate} className="px-3 py-2 rounded-xl text-sm bg-white/5 border border-white/10 hover:bg-white/10 transition">Relocate</button>
            <button onClick={onClear} className="px-3 py-2 rounded-xl text-sm bg-white/5 border border-white/10 hover:bg-white/10 transition">Clear</button>
          </div>

          {/* Places & Groups */}
          <div className="grid grid-cols-2 gap-2">
            <button onClick={onHostGroup} className="px-3 py-2 rounded-xl text-sm bg-indigo-600/20 border border-indigo-400/40 hover:bg-indigo-600/30 transition">Host a Group</button>
            <button onClick={onAddPlace} className="px-3 py-2 rounded-xl text-sm bg-emerald-600/20 border border-emerald-400/40 hover:bg-emerald-600/30 transition">Add a Place</button>
          </div>
        </div>
      )}
    </div>
  )
}