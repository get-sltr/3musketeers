'use client'

import { useState, useCallback, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useChatRealtime } from './useChatRealtime'
import { useGroupRealtime } from './useGroupRealtime'

type ChatType = 'conversation' | 'group' | 'channel'

interface UseUniversalChatOptions {
  type: ChatType
  id: string | null
  enabled?: boolean
}

/**
 * Universal chat hook that works for conversations, groups, and channels
 * Provides a unified interface for sending messages and receiving real-time updates
 */
export function useUniversalChat({ type, id, enabled = true }: UseUniversalChatOptions) {
  const [messages, setMessages] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const supabase = createClient()

  // Use appropriate realtime hook based on type
  const chatRealtime = useChatRealtime(type === 'conversation' ? id : null)
  const groupRealtime = useGroupRealtime(type === 'group' ? id : null)

  // Load messages based on type
  const loadMessages = useCallback(async () => {
    if (!id || !enabled) return

    setIsLoading(true)
    try {
      let query

      switch (type) {
        case 'conversation':
          query = supabase
            .from('messages')
            .select('*, profiles!messages_sender_id_fkey(display_name, photos)')
            .eq('conversation_id', id)
            .order('created_at', { ascending: true })
          break
        case 'group':
          query = supabase
            .from('group_messages')
            .select('*, profiles!group_messages_sender_id_fkey(display_name, photos)')
            .eq('group_id', id)
            .order('created_at', { ascending: true })
          break
        case 'channel':
          query = supabase
            .from('channel_messages')
            .select('*, profiles!channel_messages_sender_id_fkey(display_name, photos)')
            .eq('channel_id', id)
            .order('created_at', { ascending: true })
          break
        default:
          return
      }

      const { data, error } = await query

      if (error) {
        console.error('Error loading messages:', error)
        return
      }

      setMessages(data || [])
    } catch (err) {
      console.error('Error loading messages:', err)
    } finally {
      setIsLoading(false)
    }
  }, [type, id, enabled, supabase])

  // Send message based on type
  const sendMessage = useCallback(
    async (content: string, metadata?: Record<string, any>) => {
      if (!id || !enabled || isSending) return

      setIsSending(true)
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          throw new Error('User not authenticated')
        }

        let insertData: any = {
          content,
          user_id: user.id,
        }

        switch (type) {
          case 'conversation':
            // Get receiver from conversation
            const { data: conversation } = await supabase
              .from('conversations')
              .select('user1_id, user2_id')
              .eq('id', id)
              .single()

            if (!conversation) {
              throw new Error('Conversation not found')
            }

            insertData.conversation_id = id
            insertData.sender_id = user.id
            insertData.receiver_id =
              conversation.user1_id === user.id
                ? conversation.user2_id
                : conversation.user1_id

            if (metadata) {
              insertData.metadata = metadata
            }

            const { error: msgError } = await supabase
              .from('messages')
              .insert(insertData)

            if (msgError) throw msgError
            break

          case 'group':
            insertData.group_id = id
            insertData.sender_id = user.id
            delete insertData.user_id
            const { error: groupError } = await supabase
              .from('group_messages')
              .insert(insertData)

            if (groupError) throw groupError
            break

          case 'channel':
            insertData.channel_id = id
            insertData.sender_id = user.id
            delete insertData.user_id
            const { error: channelError } = await supabase
              .from('channel_messages')
              .insert(insertData)

            if (channelError) throw channelError
            break
        }

        // Reload messages to show the new one
        await loadMessages()
      } catch (err) {
        console.error('Error sending message:', err)
        throw err
      } finally {
        setIsSending(false)
      }
    },
    [type, id, enabled, isSending, supabase, loadMessages]
  )

  // Listen for real-time updates
  useEffect(() => {
    if (!enabled) return

    const handleNewMessage = (evt: CustomEvent) => {
      const message = evt.detail
      setMessages((prev) => {
        // Avoid duplicates
        if (prev.some((m) => m.id === message.id)) return prev
        return [...prev, message]
      })
    }

    const eventName =
      type === 'conversation'
        ? 'chat:new_message'
        : type === 'group'
        ? 'group:new_post'
        : 'channel:new_post'

    window.addEventListener(eventName, handleNewMessage as EventListener)

    return () => {
      window.removeEventListener(eventName, handleNewMessage as EventListener)
    }
  }, [type, enabled])

  // Load messages on mount and when id changes
  useEffect(() => {
    loadMessages()
  }, [loadMessages])

  return {
    messages,
    isLoading,
    isSending,
    sendMessage,
    reloadMessages: loadMessages,
    sendTypingStart:
      type === 'conversation'
        ? () => chatRealtime.sendTypingStart(id!)
        : undefined,
    sendTypingStop:
      type === 'conversation'
        ? () => chatRealtime.sendTypingStop(id!)
        : undefined,
  }
}

