'use client'

import { useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

/**
 * Hook for real-time updates in groups/channels
 * Listens for new posts, member joins/leaves, and updates
 */
export function useGroupRealtime(groupId: string | null) {
  const supabase = createClient()

  useEffect(() => {
    if (!groupId) return

    const channel = supabase
      .channel(`group:${groupId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'group_messages',
          filter: `group_id=eq.${groupId}`,
        },
        (payload) => {
          window.dispatchEvent(
            new CustomEvent('group:new_post', { detail: payload.new })
          )
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'groups',
          filter: `id=eq.${groupId}`,
        },
        (payload) => {
          window.dispatchEvent(
            new CustomEvent('group:updated', { detail: payload.new })
          )
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'group_members',
          filter: `group_id=eq.${groupId}`,
        },
        (payload) => {
          window.dispatchEvent(
            new CustomEvent('group:member_joined', { detail: payload.new })
          )
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'group_members',
          filter: `group_id=eq.${groupId}`,
        },
        (payload) => {
          window.dispatchEvent(
            new CustomEvent('group:member_left', { detail: payload.old })
          )
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [groupId, supabase])

  const sendGroupMessage = useCallback(
    async (groupId: string, content: string) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { error } = await supabase.from('group_messages').insert({
        group_id: groupId,
        sender_id: user.id,
        content,
      })

      if (error) {
        console.error('Error sending group message:', error)
      }
    },
    [supabase]
  )

  return {
    sendGroupMessage,
  }
}

