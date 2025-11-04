'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useRef, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useSocket } from '@/hooks/useSocket'

export default function BottomNav() {
  const pathname = usePathname()
  // Ensure real-time connection is active app-wide
  useSocket()
  const router = useRouter()
  const [unreadCount, setUnreadCount] = useState(0)
  const pollingRef = useRef<NodeJS.Timeout | null>(null)
  const supabase = createClient()
  const audioCtxRef = useRef<AudioContext | null>(null)
  const [notifySound, setNotifySound] = useState(true)
  const [notifyVibrate, setNotifyVibrate] = useState(true)

  // Load notification preferences
  useEffect(() => {
    try {
      const s = localStorage.getItem('sltr_notify_sound')
      const v = localStorage.getItem('sltr_notify_vibrate')
      if (s !== null) setNotifySound(s === '1')
      if (v !== null) setNotifyVibrate(v === '1')
    } catch {}

    const onSettings = () => {
      try {
        const s = localStorage.getItem('sltr_notify_sound')
        const v = localStorage.getItem('sltr_notify_vibrate')
        if (s !== null) setNotifySound(s === '1')
        if (v !== null) setNotifyVibrate(v === '1')
      } catch {}
    }
    window.addEventListener('sltr_settings_changed', onSettings as any)
    window.addEventListener('storage', onSettings)
    return () => {
      window.removeEventListener('sltr_settings_changed', onSettings as any)
      window.removeEventListener('storage', onSettings)
    }
  }, [])

  const playPing = useCallback(() => {
    try {
      const AudioCtx: any = (window as any).AudioContext || (window as any).webkitAudioContext
      if (!AudioCtx) return
      if (!audioCtxRef.current) audioCtxRef.current = new AudioCtx()
      const ctx = audioCtxRef.current!
      if (ctx.state === 'suspended') ctx.resume()
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.value = 1100
      osc.connect(gain)
      gain.connect(ctx.destination)
      gain.gain.setValueAtTime(0.0001, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.08, ctx.currentTime + 0.01)
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.2)
      osc.start()
      osc.stop(ctx.currentTime + 0.21)
    } catch {}
  }, [])

  // Determine active tab based on pathname
  const activeTab = pathname === '/messages' ? 'messages' 
    : pathname === '/app' ? 'map' 
    : pathname === '/groups' ? 'groups'
    : 'map'

  // Fetch unread count
  useEffect(() => {
    let cancelled = false

    const loadUnread = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          setUnreadCount(0)
          return
        }
        const { count } = await supabase
          .from('messages')
          .select('id', { count: 'exact', head: true })
          .eq('receiver_id', user.id)
          .eq('read', false)
        if (!cancelled) setUnreadCount(count || 0)
      } catch (e) {
        // ignore
      }
    }

    loadUnread()

    // Poll while tab visible (fallback when socket not mounted)
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        if (!pollingRef.current) {
          pollingRef.current = setInterval(loadUnread, 10000)
        }
      } else if (pollingRef.current) {
        clearInterval(pollingRef.current)
        pollingRef.current = null
      }
    }

    handleVisibility()
    document.addEventListener('visibilitychange', handleVisibility)

    // Listen for real-time events dispatched by useSocket (if mounted elsewhere)
    const onNewMessage = () => {
      // Vibrate + ping on new message (respect settings)
      if (notifyVibrate && 'vibrate' in navigator) {
        try { (navigator as any).vibrate([80, 40, 80]) } catch {}
      }
      if (notifySound) playPing()
      loadUnread()
    }
    const onMessageRead = loadUnread

    window.addEventListener('new_message', onNewMessage as any)
    window.addEventListener('message_read', onMessageRead as any)

    return () => {
      cancelled = true
      document.removeEventListener('visibilitychange', handleVisibility)
      if (pollingRef.current) clearInterval(pollingRef.current)
      window.removeEventListener('new_message', onNewMessage as any)
      window.removeEventListener('message_read', onMessageRead as any)
      try { audioCtxRef.current?.close() } catch {}
      audioCtxRef.current = null
    }
  }, [supabase, playPing, notifySound, notifyVibrate])

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-cyan-500/20 bg-black/90 backdrop-blur-xl safe-area-bottom">
      <div className="flex items-center justify-around h-16 max-w-screen-xl mx-auto px-4">
        {/* Messages Tab */}
        <button
          onClick={() => router.push('/messages')}
          className={`flex flex-col items-center justify-center flex-1 h-full transition-all ${
            activeTab === 'messages' 
              ? 'text-cyan-400' 
              : 'text-white/60 hover:text-white/80'
          }`}
        >
          <div className="relative">
            <svg 
              className="w-6 h-6" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" 
              />
            </svg>
            {unreadCount > 0 && (
              <>
                {/* Blinking ring */}
                <span className="absolute -top-1 -right-1 inline-flex h-4 w-4 rounded-full bg-red-500 opacity-75 animate-ping" />
                {/* Count badge */}
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] leading-none rounded-full min-w-4 h-4 px-1 flex items-center justify-center font-bold shadow-lg">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              </>
            )}
          </div>
          <span className="text-xs mt-1 font-medium">Messages</span>
          {activeTab === 'messages' && (
            <div className="absolute bottom-0 w-12 h-0.5 bg-cyan-400 rounded-t-full" 
                 style={{ boxShadow: '0 0 10px rgba(0, 212, 255, 0.8)' }} />
          )}
        </button>

        {/* Map Tab */}
        <button
          onClick={() => router.push('/app')}
          className={`flex flex-col items-center justify-center flex-1 h-full transition-all ${
            activeTab === 'map' 
              ? 'text-cyan-400' 
              : 'text-white/60 hover:text-white/80'
          }`}
        >
          <svg 
            className="w-6 h-6" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" 
            />
          </svg>
          <span className="text-xs mt-1 font-medium">Map</span>
          {activeTab === 'map' && (
            <div className="absolute bottom-0 w-12 h-0.5 bg-cyan-400 rounded-t-full" 
                 style={{ boxShadow: '0 0 10px rgba(0, 212, 255, 0.8)' }} />
          )}
        </button>

        {/* Groups Tab */}
        <button
          onClick={() => router.push('/groups')}
          className={`flex flex-col items-center justify-center flex-1 h-full transition-all ${
            activeTab === 'groups' 
              ? 'text-cyan-400' 
              : 'text-white/60 hover:text-white/80'
          }`}
        >
          <svg 
            className="w-6 h-6" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" 
          />
          </svg>
          <span className="text-xs mt-1 font-medium">Groups</span>
          {activeTab === 'groups' && (
            <div className="absolute bottom-0 w-12 h-0.5 bg-cyan-400 rounded-t-full" 
                 style={{ boxShadow: '0 0 10px rgba(0, 212, 255, 0.8)' }} />
          )}
        </button>
      </div>
    </nav>
  )
}
