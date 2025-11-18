/**
 * Global Realtime Connection Manager
 * 
 * Manages a single Supabase Realtime connection for the entire app.
 * All components subscribe to events through this manager instead of
 * creating their own channels.
 */

import { createClient } from '../supabase/client'
import { RealtimeChannel } from '@supabase/supabase-js'

type EventHandler = (payload: any) => void

class RealtimeManager {
  private static instance: RealtimeManager
  private supabase = createClient()
  private channel: RealtimeChannel | null = null
  private eventHandlers: Map<string, Set<EventHandler>> = new Map()
  private isConnected = false
  private connectionAttempts = 0
  private maxRetries = 3

  private constructor() {}

  static getInstance(): RealtimeManager {
    if (!RealtimeManager.instance) {
      RealtimeManager.instance = new RealtimeManager()
    }
    return RealtimeManager.instance
  }

  /**
   * Initialize the global realtime connection
   */
  async connect(userId: string): Promise<boolean> {
    if (this.isConnected && this.channel) {
      console.log('✅ Realtime already connected')
      return true
    }

    if (this.connectionAttempts >= this.maxRetries) {
      console.warn('⚠️ Max realtime connection retries reached')
      return false
    }

    this.connectionAttempts++

    try {
      // Create a single global channel for this user
      this.channel = this.supabase
        .channel(`global:${userId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
            filter: `receiver_id=eq.${userId}`,
          },
          (payload) => {
            this.emit('message:new', payload.new)
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'messages',
            filter: `receiver_id=eq.${userId}`,
          },
          (payload) => {
            this.emit('message:updated', payload.new)
          }
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'profiles',
          },
          (payload) => {
            this.emit('profile:changed', payload.new)
          }
        )
        .on('broadcast', { event: 'typing_start' }, (payload) => {
          this.emit('user:typing', payload.payload)
        })
        .on('broadcast', { event: 'typing_stop' }, (payload) => {
          this.emit('user:stop_typing', payload.payload)
        })
        .on('broadcast', { event: 'user_online' }, (payload) => {
          this.emit('user:online', payload.payload)
        })
        .on('broadcast', { event: 'user_offline' }, (payload) => {
          this.emit('user:offline', payload.payload)
        })
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            this.isConnected = true
            this.connectionAttempts = 0
            console.log('✅ Global realtime connected')
            this.emit('realtime:connected', { userId })
          } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            console.warn('⚠️ Realtime connection failed:', status)
            this.isConnected = false
            this.emit('realtime:error', { status })
          }
        })

      return true
    } catch (error) {
      console.error('❌ Realtime connection error:', error)
      this.isConnected = false
      return false
    }
  }

  /**
   * Disconnect and cleanup
   */
  disconnect(): void {
    if (this.channel) {
      this.supabase.removeChannel(this.channel)
      this.channel = null
    }
    this.isConnected = false
    this.eventHandlers.clear()
    console.log('🔌 Realtime disconnected')
  }

  /**
   * Subscribe to an event
   */
  on(event: string, handler: EventHandler): () => void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set())
    }
    this.eventHandlers.get(event)!.add(handler)

    // Return unsubscribe function
    return () => {
      const handlers = this.eventHandlers.get(event)
      if (handlers) {
        handlers.delete(handler)
      }
    }
  }

  /**
   * Emit an event to all subscribers
   */
  private emit(event: string, payload: any): void {
    const handlers = this.eventHandlers.get(event)
    if (handlers) {
      handlers.forEach((handler) => {
        try {
          handler(payload)
        } catch (error) {
          console.error(`Error in event handler for ${event}:`, error)
        }
      })
    }
  }

  /**
   * Broadcast a message to all connected clients
   */
  broadcast(event: string, payload: any): void {
    if (this.channel && this.isConnected) {
      this.channel.send({
        type: 'broadcast',
        event,
        payload,
      })
    }
  }

  /**
   * Check if connected
   */
  getConnectionStatus(): boolean {
    return this.isConnected
  }
}

export default RealtimeManager.getInstance()
