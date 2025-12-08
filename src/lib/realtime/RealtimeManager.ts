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
  private _supabase: ReturnType<typeof createClient> | null = null
  private channel: RealtimeChannel | null = null
  private eventHandlers: Map<string, Set<EventHandler>> = new Map()
  private isConnected = false
  private isConnecting = false
  private connectionAttempts = 0
  private maxRetries = 3
  private lastConnectionAttempt = 0
  private connectionCooldown = 5000 // 5 seconds between retries
  private currentUserId: string | null = null

  private constructor() {}

  // Lazy-initialize Supabase client to avoid build-time errors
  private get supabase() {
    if (!this._supabase) {
      this._supabase = createClient()
    }
    return this._supabase
  }

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
    // Already connected to this user
    if (this.isConnected && this.channel && this.currentUserId === userId) {
      console.log('✅ Realtime already connected')
      return true
    }

    // Already connecting - prevent duplicate attempts
    if (this.isConnecting) {
      console.log('⏳ Connection already in progress, waiting...')
      return false
    }

    // Check cooldown period
    const now = Date.now()
    if (now - this.lastConnectionAttempt < this.connectionCooldown) {
      console.log('⏸️ Connection on cooldown')
      return false
    }

    // Max retries reached - stop trying
    if (this.connectionAttempts >= this.maxRetries) {
      console.warn('⚠️ Max realtime connection retries reached')
      return false
    }

    this.isConnecting = true
    this.lastConnectionAttempt = now
    this.connectionAttempts++
    this.currentUserId = userId

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
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
            filter: `sender_id=eq.${userId}`,
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
        .subscribe(async (status) => {
          if (status === 'SUBSCRIBED') {
            this.isConnected = true
            this.isConnecting = false
            this.connectionAttempts = 0
            console.log('✅ Global realtime connected')
            
            // Set user as online in database
            await this.supabase
              .from('profiles')
              .update({ online: true, last_active: new Date().toISOString() })
              .eq('id', userId)
            
            // Broadcast online status
            this.broadcast('user_online', { userId })
            
            this.emit('realtime:connected', { userId })
          } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            console.warn('⚠️ Realtime connection failed:', status)
            this.isConnected = false
            this.isConnecting = false
            this.emit('realtime:error', { status })
          }
        })

      return true
    } catch (error) {
      console.error('❌ Realtime connection error:', error)
      this.isConnected = false
      this.isConnecting = false
      return false
    }
  }

  /**
   * Disconnect and cleanup
   */
  async disconnect(userId?: string): Promise<void> {
    // Set user offline before disconnecting
    if (userId) {
      await this.supabase
        .from('profiles')
        .update({ online: false, last_active: new Date().toISOString() })
        .eq('id', userId)
      
      this.broadcast('user_offline', { userId })
    }
    
    if (this.channel) {
      this.supabase.removeChannel(this.channel)
      this.channel = null
    }
    this.isConnected = false
    this.isConnecting = false
    this.currentUserId = null
    this.eventHandlers.clear()
    console.log('🔌 Realtime disconnected')
  }

  /**
   * Reset connection state (use after errors to allow reconnection)
   */
  reset(): void {
    this.connectionAttempts = 0
    this.isConnecting = false
    this.lastConnectionAttempt = 0
    console.log('🔄 Realtime connection state reset')
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

// Export a getter function to ensure lazy initialization
export const getRealtimeManager = () => RealtimeManager.getInstance()
export default RealtimeManager
