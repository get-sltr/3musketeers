// hooks/usePresenceSubscription.ts
import { useEffect, useCallback } from 'react'
import type { User } from '../types/app'

interface UsePresenceSubscriptionProps {
  users: User[]
  onUserUpdate: (userId: string, updates: Partial<User>) => void
}

export function usePresenceSubscription({ users, onUserUpdate }: UsePresenceSubscriptionProps) {
  const handleOnline = useCallback(
    (e: CustomEvent) => {
      const userId = e.detail?.userId
      if (userId && users.some((u) => u.id === userId)) {
        console.log('✅ User came online:', userId)
        onUserUpdate(userId, { online: true, is_online: true })
      }
    },
    [users, onUserUpdate]
  )

  const handleOffline = useCallback(
    (e: CustomEvent) => {
      const userId = e.detail?.userId
      if (userId && users.some((u) => u.id === userId)) {
        console.log('❌ User went offline:', userId)
        onUserUpdate(userId, { online: false, is_online: false })
      }
    },
    [users, onUserUpdate]
  )

  useEffect(() => {
    window.addEventListener('user_online', handleOnline as EventListener)
    window.addEventListener('user_offline', handleOffline as EventListener)

    return () => {
      window.removeEventListener('user_online', handleOnline as EventListener)
      window.removeEventListener('user_offline', handleOffline as EventListener)
    }
  }, [handleOnline, handleOffline])

  return { isSubscribed: true }
}
