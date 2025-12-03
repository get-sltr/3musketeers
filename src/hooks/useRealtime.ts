'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '../lib/supabase/client'
import { RealtimeChannel } from '@supabase/supabase-js'
import RealtimeManager from '../lib/realtime/RealtimeManager'

interface UseRealtimeReturn {
  isConnected: boolean
  sendMessage: (conversationId: string, content: string, messageType?: string, fileUrl?: string, metadata?: Record<string, any>) => void
  startTyping: (conversationId: string) => void
  stopTyping: (conversationId: string) => void
  joinConversation: (conversationId: string) => void
  leaveConversation: (conversationId: string) => void
  markMessageRead: (messageId: string, conversationId: string) => void
}

export function useRealtime(): UseRealtimeReturn {
  const [isConnected, setIsConnected] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    let unsubConnect: (() => void) | undefined
    let unsubError: (() => void) | undefined

    // Connect to global realtime manager
    const initRealtime = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Check current connection status first
      const currentStatus = RealtimeManager.getConnectionStatus()
      setIsConnected(currentStatus)

      // Only attempt connection if not already connected
      if (!currentStatus) {
        const connected = await RealtimeManager.connect(user.id)
        setIsConnected(connected)
      }

      // Listen for connection status changes
      unsubConnect = RealtimeManager.on('realtime:connected', () => setIsConnected(true))
      unsubError = RealtimeManager.on('realtime:error', () => setIsConnected(false))
    }

    initRealtime()
    
    // Cleanup on unmount - DON'T disconnect as other components may use it
    return () => {
      unsubConnect?.()
      unsubError?.()
    }
  }, [])

  const joinConversation = useCallback((conversationId: string) => {
    // Subscribe to message events from global manager
    RealtimeManager.on('message:new', (message) => {
      if (message.conversation_id === conversationId) {
        window.dispatchEvent(new CustomEvent('new_message', { detail: message }))
      }
    })
    RealtimeManager.on('message:updated', (message) => {
      if (message.conversation_id === conversationId) {
        window.dispatchEvent(new CustomEvent('message_updated', { detail: message }))
      }
    })
    RealtimeManager.on('user:typing', (data) => {
      if (data.conversationId === conversationId) {
        window.dispatchEvent(new CustomEvent('user_typing', { detail: data }))
      }
    })
    RealtimeManager.on('user:stop_typing', (data) => {
      if (data.conversationId === conversationId) {
        window.dispatchEvent(new CustomEvent('user_stop_typing', { detail: data }))
      }
    })
  }, [])

  const leaveConversation = useCallback((conversationId: string) => {
    // No-op - global manager handles all subscriptions
  }, [])

  const sendMessage = useCallback(async (
    conversationId: string,
    content: string,
    messageType: string = 'text',
    fileUrl?: string,
    metadata?: Record<string, any>
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
    // Use ONLY fields that exist in the schema to avoid trigger conflicts
    const messageData: any = {
        conversation_id: conversationId,
        sender_id: user.id,
        receiver_id: receiverId,
        content,
    }
    
    // Add message_type only if not default 'text' (schema has CHECK constraint)
    if (messageType && messageType !== 'text') {
      messageData.message_type = messageType
    }
    
    // Store metadata in JSONB field (schema has metadata column)
    if (metadata) {
      messageData.metadata = metadata
    } else if (fileUrl) {
      // Fallback: if only fileUrl provided, store it in metadata
      messageData.metadata = { file_url: fileUrl }
    }
    
    const { error } = await supabase
      .from('messages')
      .insert(messageData)

    if (error) {
      console.error('Error sending message:', error)
    }
  }, [supabase])

  const startTyping = useCallback(async (conversationId: string) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    RealtimeManager.broadcast('typing_start', { userId: user.id, conversationId })
  }, [supabase])

  const stopTyping = useCallback(async (conversationId: string) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    RealtimeManager.broadcast('typing_stop', { userId: user.id, conversationId })
  }, [supabase])

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


