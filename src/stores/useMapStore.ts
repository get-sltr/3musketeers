import { create } from 'zustand'

// Define the shape of your state
interface MapSessionState {
  radiusMiles: number
  clusterRadius: number
  styleId: string
  menuFilters: {
    online: boolean
    hosting: boolean
    looking: boolean
  }
  clusterEnabled: boolean
  jitterMeters: number
  vanillaMode: boolean
  travelMode: boolean
  showVenues: boolean
  showHeatmap: boolean
  pinStyle: number
}

// Define the actions (setters)
interface MapSessionActions {
  setRadiusMiles: (radius: number) => void
  setClusterRadius: (radius: number) => void
  setStyleId: (id: string) => void
  setMenuFilters: (filters: Partial<MapSessionState['menuFilters']>) => void
  setClusterEnabled: (enabled: boolean) => void
  setJitterMeters: (meters: number) => void
  setVanillaMode: (enabled: boolean) => void
  setTravelMode: (enabled: boolean) => void
  setShowVenues: (enabled: boolean) => void
  setShowHeatmap: (enabled: boolean) => void
  setPinStyle: (style: number) => void
  resetMapSettings: () => void
}

const DEFAULT_SLTR_STYLE =
  process.env.NEXT_PUBLIC_MAPBOX_SLTR_STYLE || 'mapbox://styles/sltr/cmhum4i1k001x01rlasmoccvm'

// Define the initial state
const initialState: MapSessionState = {
  radiusMiles: 10,
  clusterRadius: 60,
  styleId: DEFAULT_SLTR_STYLE,
  menuFilters: { online: false, hosting: false, looking: false },
  clusterEnabled: false,
  jitterMeters: 0,
  vanillaMode: false,
  travelMode: false,
  showVenues: false,
  showHeatmap: false,
  pinStyle: 1,
}

// Create the store
export const useMapStore = create<MapSessionState & MapSessionActions>((set) => ({
  ...initialState,

  // --- Actions ---
  setRadiusMiles: (radius) => set({ radiusMiles: radius }),
  setClusterRadius: (radius) => set({ clusterRadius: radius }),
  setStyleId: (id) => set({ styleId: id }),
  setMenuFilters: (newFilters) => set((state) => ({
    menuFilters: { ...state.menuFilters, ...newFilters }
  })),
  setClusterEnabled: (enabled) => set({ clusterEnabled: enabled }),
  setJitterMeters: (meters) => set({ jitterMeters: meters }),
  setVanillaMode: (enabled) => set({ vanillaMode: enabled }),
  setTravelMode: (enabled) => set({ travelMode: enabled }),
  setShowVenues: (enabled) => set({ showVenues: enabled }),
  setShowHeatmap: (enabled) => set({ showHeatmap: enabled }),
  setPinStyle: (style) => set({ pinStyle: style }),
  
  // You can also move component logic into the store
  resetMapSettings: () => set(initialState),
}))