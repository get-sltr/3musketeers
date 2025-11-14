'use client'

import { useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { RealtimeChannel } from '@supabase/supabase-js'

/**
 * Hook for real-time chat updates in conversations
 * Listens for new messages, typing indicators, and read receipts
 */
export function useChatRealtime(conversationId: string | null) {
  const supabase = createClient()

  useEffect(() => {
    if (!conversationId) return

    const channel = supabase
      .channel(`chat:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          // Dispatch new message event
          window.dispatchEvent(
            new CustomEvent('chat:new_message', { detail: payload.new })
          )
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          // Dispatch message update event (e.g., read receipts)
          window.dispatchEvent(
            new CustomEvent('chat:message_updated', { detail: payload.new })
          )
        }
      )
      .on('broadcast', { event: 'typing_start' }, (payload) => {
        window.dispatchEvent(
          new CustomEvent('chat:typing_start', { detail: payload.payload })
        )
      })
      .on('broadcast', { event: 'typing_stop' }, (payload) => {
        window.dispatchEvent(
          new CustomEvent('chat:typing_stop', { detail: payload.payload })
        )
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [conversationId, supabase])

  const sendTypingStart = useCallback(
    async (conversationId: string) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const channel = supabase.channel(`chat:${conversationId}`)
      await channel.send({
        type: 'broadcast',
        event: 'typing_start',
        payload: { userId: user.id, conversationId },
      })
    },
    [supabase]
  )

  const sendTypingStop = useCallback(
    async (conversationId: string) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const channel = supabase.channel(`chat:${conversationId}`)
      await channel.send({
        type: 'broadcast',
        event: 'typing_stop',
        payload: { userId: user.id, conversationId },
      })
    },
    [supabase]
  )

  return {
    sendTypingStart,
    sendTypingStop,
  }
}

