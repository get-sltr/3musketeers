'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '../lib/supabase/client'
import { RealtimeChannel } from '@supabase/supabase-js'

interface UseRealtimeReturn {
  isConnected: boolean
  sendMessage: (conversationId: string, content: string, messageType?: string, fileUrl?: string) => void
  startTyping: (conversationId: string) => void
  stopTyping: (conversationId: string) => void
  joinConversation: (conversationId: string) => void
  leaveConversation: (conversationId: string) => void
  markMessageRead: (messageId: string, conversationId: string) => void
}

export function useRealtime(): UseRealtimeReturn {
  const [isConnected, setIsConnected] = useState(false)
  const [channels, setChannels] = useState<Map<string, RealtimeChannel>>(new Map())
  const supabase = createClient()

  useEffect(() => {
    // Check connection status
    const checkConnection = async () => {
      try {
        // Test connection by subscribing to a test channel
        const testChannel = supabase.channel('connection-test')
        testChannel.subscribe((status) => {
          setIsConnected(status === 'SUBSCRIBED')
        })
        
        // Cleanup test channel after a moment
        setTimeout(() => {
          supabase.removeChannel(testChannel)
        }, 1000)
      } catch (error) {
        console.error('Realtime connection error:', error)
        setIsConnected(false)
      }
    }

    checkConnection()
    
    // Cleanup on unmount
    return () => {
      channels.forEach((channel) => {
        supabase.removeChannel(channel)
      })
    }
  }, [])

  const joinConversation = useCallback((conversationId: string) => {
    if (channels.has(conversationId)) return

    const channel = supabase
      .channel(`conversation:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          // Dispatch custom event for new messages
          const event = new CustomEvent('new_message', { detail: payload.new })
          window.dispatchEvent(event)
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
          // Dispatch custom event for message updates (e.g., read receipts)
          const event = new CustomEvent('message_updated', { detail: payload.new })
          window.dispatchEvent(event)
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setIsConnected(true)
        }
      })

    setChannels((prev) => new Map(prev).set(conversationId, channel))
  }, [channels, supabase])

  const leaveConversation = useCallback((conversationId: string) => {
    const channel = channels.get(conversationId)
    if (channel) {
      supabase.removeChannel(channel)
      setChannels((prev) => {
        const newMap = new Map(prev)
        newMap.delete(conversationId)
        return newMap
      })
    }
  }, [channels, supabase])

  const sendMessage = useCallback(async (
    conversationId: string,
    content: string,
    messageType: string = 'text',
    fileUrl?: string
  ) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      console.error('User not authenticated')
      return
    }

    // Get conversation to determine receiver
    const { data: conversation } = await supabase
      .from('conversations')
      .select('user1_id, user2_id')
      .eq('id', conversationId)
      .single()

    if (!conversation) {
      console.error('Conversation not found')
      return
    }

    const receiverId = conversation.user1_id === user.id 
      ? conversation.user2_id 
      : conversation.user1_id

    // Insert message - Supabase Realtime will automatically broadcast to subscribers
    const { error } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender_id: user.id,
        receiver_id: receiverId,
        content,
        message_type: messageType,
        file_url: fileUrl || null,
      })

    if (error) {
      console.error('Error sending message:', error)
    }
  }, [supabase])

  const startTyping = useCallback(async (conversationId: string) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // Broadcast typing indicator via custom channel event
    const channel = channels.get(conversationId)
    if (channel) {
      channel.send({
        type: 'broadcast',
        event: 'typing_start',
        payload: { userId: user.id, conversationId },
      })
    }
  }, [channels, supabase])

  const stopTyping = useCallback(async (conversationId: string) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const channel = channels.get(conversationId)
    if (channel) {
      channel.send({
        type: 'broadcast',
        event: 'typing_stop',
        payload: { userId: user.id, conversationId },
      })
    }
  }, [channels, supabase])

  const markMessageRead = useCallback(async (messageId: string, conversationId: string) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { error } = await supabase
      .from('messages')
      .update({
        read_at: new Date().toISOString(),
        read_by: user.id,
      })
      .eq('id', messageId)

    if (error) {
      console.error('Error marking message as read:', error)
    }
  }, [supabase])

  return {
    isConnected,
    sendMessage,
    startTyping,
    stopTyping,
    joinConversation,
    leaveConversation,
    markMessageRead,
  }
}


