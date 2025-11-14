import { create } from 'zustand'

// User State Management Store
// Manages user-related state: selected users, profiles, messaging, etc.

interface UserWithLocation {
  id: string
  display_name: string
  latitude?: number
  longitude?: number
  isYou?: boolean
  isFavorited?: boolean
  dtfn?: boolean
  party_friendly?: boolean
  photo_url?: string
  photos?: string[]
  is_online?: boolean
  founder_number?: number | null
  age?: number
  about?: string
  kinks?: string[]
  tags?: string[]
  position?: string
  height?: string
  body_type?: string
  ethnicity?: string
  online?: boolean
  distance_miles?: number | null
  distance_label?: string
  incognito_mode?: boolean
}

interface UserState {
  // User Lists
  users: UserWithLocation[]
  
  // Selected User
  selectedUser: UserWithLocation | null
  
  // Messaging
  messagingUser: UserWithLocation | null
  
  // Current User
  currentUserId: string | null
  
  // Location
  mapCenter: [number, number] | null
  currentOrigin: [number, number] | null
}

interface UserActions {
  // User Lists
  setUsers: (users: UserWithLocation[]) => void
  addUser: (user: UserWithLocation) => void
  removeUser: (userId: string) => void
  updateUser: (userId: string, updates: Partial<UserWithLocation>) => void
  
  // Selected User
  setSelectedUser: (user: UserWithLocation | null) => void
  clearSelectedUser: () => void
  
  // Messaging
  setMessagingUser: (user: UserWithLocation | null) => void
  
  // Current User
  setCurrentUserId: (userId: string | null) => void
  
  // Location
  setMapCenter: (center: [number, number] | null) => void
  setCurrentOrigin: (origin: [number, number] | null) => void
  
  // Utility Actions
  resetUsers: () => void
}

const initialState: UserState = {
  users: [],
  selectedUser: null,
  messagingUser: null,
  currentUserId: null,
  mapCenter: null,
  currentOrigin: null,
}

export const useUserStore = create<UserState & UserActions>((set) => ({
  ...initialState,

  // User Lists
  setUsers: (users) => set({ users }),
  
  addUser: (user) => set((state) => ({
    users: [...state.users, user]
  })),
  
  removeUser: (userId) => set((state) => ({
    users: state.users.filter(u => u.id !== userId),
    selectedUser: state.selectedUser?.id === userId ? null : state.selectedUser,
  })),
  
  updateUser: (userId, updates) => set((state) => ({
    users: state.users.map(u => 
      u.id === userId ? { ...u, ...updates } : u
    ),
    selectedUser: state.selectedUser?.id === userId 
      ? { ...state.selectedUser, ...updates }
      : state.selectedUser,
  })),

  // Selected User
  setSelectedUser: (user) => set({ selectedUser: user }),
  clearSelectedUser: () => set({ selectedUser: null }),

  // Messaging
  setMessagingUser: (user) => set({ messagingUser: user }),

  // Current User
  setCurrentUserId: (userId) => set({ currentUserId: userId }),

  // Location
  setMapCenter: (center) => set({ mapCenter: center }),
  setCurrentOrigin: (origin) => set({ currentOrigin: origin }),

  // Utility Actions
  resetUsers: () => set(initialState),
}))

