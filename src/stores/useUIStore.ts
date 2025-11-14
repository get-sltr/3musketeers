import { create } from 'zustand'

// UI State Management Store
// Manages all UI-related state: modals, panels, view modes, etc.

// Simple User type for the store
type User = { id: string, display_name: string, [key: string]: any }

interface UIState {
  // User tracking
  selectedUser: User | null
  messagingUser: User | null
  
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
  // User actions - new improved API
  openProfile: (user: User) => void
  closeProfile: () => void
  openMessages: (user: User) => void
  closeMessages: () => void
  
  // View Mode
  setViewMode: (mode: 'grid' | 'map') => void
  
  // Modals - keeping backward compatibility
  setShowProfileModal: (show: boolean) => void
  setShowMessagingModal: (show: boolean) => void
  setShowWelcomeModal: (show: boolean, userName?: string) => void
  
  // Panels
  setShowAdvertisingPanel: (show: boolean) => void
  setIsLargeDesktop: (isLarge: boolean) => void
  
  // Features
  setIsIncognito: (isIncognito: boolean) => void
  setIsRelocating: (isRelocating: boolean) => void
  
  // Place/Group - new toggle API + backward compatibility
  toggleAddingPlace: (open?: boolean) => void
  toggleHostingGroup: (open?: boolean) => void
  toggleAdvertisingPanel: (open?: boolean) => void
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
  selectedUser: null,
  messagingUser: null,
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

  // --- New User Actions (Improved API) ---
  openProfile: (user) => set({ 
    selectedUser: user, 
    showProfileModal: true 
  }),

  closeProfile: () => set({ 
    showProfileModal: false, 
    selectedUser: null 
  }),

  openMessages: (user) => set({
    messagingUser: user,
    showMessagingModal: true,
    showProfileModal: false // Also close profile modal if open
  }),

  closeMessages: () => set({ 
    showMessagingModal: false, 
    messagingUser: null 
  }),

  // --- View Mode ---
  setViewMode: (mode) => set({ viewMode: mode }),

  // --- Modals (Backward Compatible) ---
  setShowProfileModal: (show) => set({ 
    showProfileModal: show,
    ...(show ? {} : { selectedUser: null }) // Clear user when closing
  }),
  
  setShowMessagingModal: (show) => set({ 
    showMessagingModal: show,
    ...(show ? {} : { messagingUser: null }) // Clear user when closing
  }),
  
  setShowWelcomeModal: (show, userName = '') => set({ 
    showWelcomeModal: show, 
    userName: userName 
  }),

  // --- Panels ---
  setShowAdvertisingPanel: (show) => set({ showAdvertisingPanel: show }),
  setIsLargeDesktop: (isLarge) => set({ isLargeDesktop: isLarge }),

  // --- Features ---
  setIsIncognito: (isIncognito) => set({ isIncognito }),
  setIsRelocating: (isRelocating) => set({ isRelocating }),

  // --- Place/Group (New Toggle API + Backward Compatible) ---
  toggleAddingPlace: (open) => set((state) => ({ 
    isAddingPlace: open ?? !state.isAddingPlace 
  })),
  
  toggleHostingGroup: (open) => set((state) => ({ 
    isHostingGroup: open ?? !state.isHostingGroup 
  })),
  
  toggleAdvertisingPanel: (open) => set((state) => ({ 
    showAdvertisingPanel: open ?? !state.showAdvertisingPanel 
  })),
  
  // Backward compatible setters
  setIsAddingPlace: (isAdding) => set({ isAddingPlace: isAdding }),
  setIsHostingGroup: (isHosting) => set({ isHostingGroup: isHosting }),

  // --- Loading ---
  setLoading: (loading) => set({ loading }),
  setIsFetching: (isFetching) => set({ isFetching }),

  // --- Welcome Modal ---
  setUserName: (name) => set({ userName: name }),

  // --- Utility Actions ---
  closeAllModals: () => set({
    showProfileModal: false,
    showMessagingModal: false,
    showWelcomeModal: false,
    isAddingPlace: false,
    isHostingGroup: false,
    selectedUser: null,
    messagingUser: null,
  }),

  resetUI: () => set(initialState),
}))

