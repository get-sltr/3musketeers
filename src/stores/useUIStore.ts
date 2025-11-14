import { create } from 'zustand'

// UI State Management Store
// Manages all UI-related state: modals, panels, view modes, etc.

interface UIState {
  // View Mode
  viewMode: 'grid' | 'map'
  
  // Modal States
  showProfileModal: boolean
  showMessagingModal: boolean
  showWelcomeModal: boolean
  
  // Panel States
  showAdvertisingPanel: boolean
  isLargeDesktop: boolean
  
  // Feature States
  isIncognito: boolean
  isRelocating: boolean
  
  // Place/Group Modals
  isAddingPlace: boolean
  isHostingGroup: boolean
  
  // Loading States
  loading: boolean
  isFetching: boolean
  
  // Welcome Modal
  userName: string
}

interface UIActions {
  // View Mode
  setViewMode: (mode: 'grid' | 'map') => void
  
  // Modals
  setShowProfileModal: (show: boolean) => void
  setShowMessagingModal: (show: boolean) => void
  setShowWelcomeModal: (show: boolean) => void
  
  // Panels
  setShowAdvertisingPanel: (show: boolean) => void
  setIsLargeDesktop: (isLarge: boolean) => void
  
  // Features
  setIsIncognito: (isIncognito: boolean) => void
  setIsRelocating: (isRelocating: boolean) => void
  
  // Place/Group
  setIsAddingPlace: (isAdding: boolean) => void
  setIsHostingGroup: (isHosting: boolean) => void
  
  // Loading
  setLoading: (loading: boolean) => void
  setIsFetching: (isFetching: boolean) => void
  
  // Welcome Modal
  setUserName: (name: string) => void
  
  // Utility Actions
  closeAllModals: () => void
  resetUI: () => void
}

const initialState: UIState = {
  viewMode: 'grid',
  showProfileModal: false,
  showMessagingModal: false,
  showWelcomeModal: false,
  showAdvertisingPanel: false,
  isLargeDesktop: false,
  isIncognito: false,
  isRelocating: false,
  isAddingPlace: false,
  isHostingGroup: false,
  loading: true,
  isFetching: false,
  userName: '',
}

export const useUIStore = create<UIState & UIActions>((set) => ({
  ...initialState,

  // View Mode
  setViewMode: (mode) => set({ viewMode: mode }),

  // Modals
  setShowProfileModal: (show) => set({ showProfileModal: show }),
  setShowMessagingModal: (show) => set({ showMessagingModal: show }),
  setShowWelcomeModal: (show) => set({ showWelcomeModal: show }),

  // Panels
  setShowAdvertisingPanel: (show) => set({ showAdvertisingPanel: show }),
  setIsLargeDesktop: (isLarge) => set({ isLargeDesktop: isLarge }),

  // Features
  setIsIncognito: (isIncognito) => set({ isIncognito }),
  setIsRelocating: (isRelocating) => set({ isRelocating }),

  // Place/Group
  setIsAddingPlace: (isAdding) => set({ isAddingPlace: isAdding }),
  setIsHostingGroup: (isHosting) => set({ isHostingGroup: isHosting }),

  // Loading
  setLoading: (loading) => set({ loading }),
  setIsFetching: (isFetching) => set({ isFetching }),

  // Welcome Modal
  setUserName: (name) => set({ userName: name }),

  // Utility Actions
  closeAllModals: () => set({
    showProfileModal: false,
    showMessagingModal: false,
    showWelcomeModal: false,
    isAddingPlace: false,
    isHostingGroup: false,
  }),

  resetUI: () => set(initialState),
}))

