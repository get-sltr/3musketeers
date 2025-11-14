import { create } from 'zustand'
import { UserGridProfile, UserFullProfile } from '../lib/types/profile'

// Grid View State Management Store
// Manages grid-specific state: users list, selected profile, loading states, etc.

interface GridState {
  // Grid Users (lightweight data)
  users: UserGridProfile[]
  
  // Selected User (lightweight)
  selectedUser: UserGridProfile | null
  
  // Full Profile (loaded on-demand)
  fullProfile: UserFullProfile | null
  
  // Loading States
  gridLoading: boolean
  modalLoading: boolean
  
  // Report Modal
  isReporting: boolean
}

interface GridActions {
  // Users
  setUsers: (users: UserGridProfile[]) => void
  addUser: (user: UserGridProfile) => void
  removeUser: (userId: string) => void
  updateUser: (userId: string, updates: Partial<UserGridProfile>) => void
  
  // Selected User
  setSelectedUser: (user: UserGridProfile | null) => void
  clearSelectedUser: () => void
  
  // Full Profile
  setFullProfile: (profile: UserFullProfile | null) => void
  
  // Loading
  setGridLoading: (loading: boolean) => void
  setModalLoading: (loading: boolean) => void
  
  // Report Modal
  setIsReporting: (isReporting: boolean) => void
  
  // Utility Actions
  resetGrid: () => void
}

const initialState: GridState = {
  users: [],
  selectedUser: null,
  fullProfile: null,
  gridLoading: true,
  modalLoading: false,
  isReporting: false,
}

export const useGridStore = create<GridState & GridActions>((set) => ({
  ...initialState,

  // Users
  setUsers: (users) => set({ users }),
  
  addUser: (user) => set((state) => ({
    users: [...state.users, user]
  })),
  
  removeUser: (userId) => set((state) => ({
    users: state.users.filter(u => u.id !== userId),
    selectedUser: state.selectedUser?.id === userId ? null : state.selectedUser,
    fullProfile: state.fullProfile?.id === userId ? null : state.fullProfile,
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
  clearSelectedUser: () => set({ 
    selectedUser: null,
    fullProfile: null, // Clear full profile when clearing selection
  }),

  // Full Profile
  setFullProfile: (profile) => set({ fullProfile: profile }),

  // Loading
  setGridLoading: (loading) => set({ gridLoading: loading }),
  setModalLoading: (loading) => set({ modalLoading: loading }),

  // Report Modal
  setIsReporting: (isReporting) => set({ isReporting }),

  // Utility Actions
  resetGrid: () => set(initialState),
}))

