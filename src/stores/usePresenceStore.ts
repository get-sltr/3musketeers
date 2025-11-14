import { create } from 'zustand'

interface PresenceState {
  // We use a Set for high-performance checks
  onlineUsers: Set<string>
  // Actions to update the set
  setOnlineUsers: (users: string[]) => void
  addUser: (userId: string) => void
  removeUser: (userId: string) => void
}

export const usePresenceStore = create<PresenceState>((set) => ({
  onlineUsers: new Set(),
  
  setOnlineUsers: (users) => set({ 
    onlineUsers: new Set(users) 
  }),
  
  addUser: (userId) => set((state) => ({ 
    onlineUsers: new Set(state.onlineUsers).add(userId) 
  })),
  
  removeUser: (userId) => set((state) => {
    const newSet = new Set(state.onlineUsers)
    newSet.delete(userId)
    return { onlineUsers: newSet }
  }),
}))

