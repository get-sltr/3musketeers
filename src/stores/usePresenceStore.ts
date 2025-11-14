import { create } from 'zustand'

interface PresenceState {
  onlineUsers: Set<string>

  setOnlineUsers: (users: string[]) => void
  addUser: (userId: string) => void
  removeUser: (userId: string) => void

  isOnline: (userId: string) => boolean
  resetPresence: () => void
}

export const usePresenceStore = create<PresenceState>((set, get) => ({
  onlineUsers: new Set<string>(),

  setOnlineUsers: (users) =>
    set({
      onlineUsers: new Set(users),
    }),

  addUser: (userId) =>
    set((state) => {
      const next = new Set(state.onlineUsers)
      next.add(userId)
      return { onlineUsers: next }
    }),

  removeUser: (userId) =>
    set((state) => {
      const next = new Set(state.onlineUsers)
      next.delete(userId)
      return { onlineUsers: next }
    }),

  isOnline: (userId) => {
    return get().onlineUsers.has(userId)
  },

  resetPresence: () =>
    set({
      onlineUsers: new Set(),
    }),
}))

