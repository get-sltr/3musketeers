'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useRef, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function BottomNav() {
  const pathname = usePathname()
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
  const activeTab =
    pathname === '/messages'
      ? 'messages'
      : pathname?.startsWith('/viewed')
      ? 'viewed'
      : pathname?.startsWith('/taps')
      ? 'taps'
      : pathname === '/profile'
      ? 'profile'
      : pathname === '/holo-map'
      ? 'map'
      : pathname === '/app'
      ? 'discover'
      : 'discover'

  const navItems = [
    {
      id: 'profile',
      icon: '👤',
      label: 'Profile',
      action: () => router.push('/profile'),
    },
    {
      id: 'discover',
      icon: '🔥',
      label: 'Discover',
      action: () => router.push('/app'),
    },
    {
      id: 'map',
      icon: '🗺️',
      label: 'Map',
      action: () => router.push('/map'),
    },
    {
      id: 'messages',
      icon: '💬',
      label: 'Messages',
      action: () => router.push('/messages'),
    },
    {
      id: 'taps',
      icon: '😈',
      label: 'Taps',
      action: () => router.push('/taps'),
    },
    {
      id: 'viewed',
      icon: '👀',
      label: 'Viewed',
      action: () => router.push('/viewed'),
    },
  ]

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

    // Listen for new messages via Supabase Realtime
    let messageChannel: any = null
    const setupRealtimeListener = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        messageChannel = supabase
          .channel(`user:${user.id}:notifications`)
          .on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'messages',
              filter: `receiver_id=eq.${user.id}`,
            },
            () => {
              // Vibrate + ping on new message (respect settings)
              if (notifyVibrate && 'vibrate' in navigator) {
                try { (navigator as any).vibrate([80, 40, 80]) } catch {}
              }
              if (notifySound) playPing()
              loadUnread()
            }
          )
          .on(
            'postgres_changes',
            {
              event: 'UPDATE',
              schema: 'public',
              table: 'messages',
              filter: `receiver_id=eq.${user.id}`,
            },
            () => {
              // Message read/updated
              loadUnread()
            }
          )
          .subscribe((status) => {
            if (status === 'SUBSCRIBED') {
              console.log('✅ Connected to message notifications (Supabase Realtime)')
            }
          })
      } catch (error) {
        console.error('❌ Error setting up realtime listener:', error)
      }
    }

    setupRealtimeListener()

    return () => {
      cancelled = true
      document.removeEventListener('visibilitychange', handleVisibility)
      if (pollingRef.current) clearInterval(pollingRef.current)
      if (messageChannel) supabase.removeChannel(messageChannel)
      try { audioCtxRef.current?.close() } catch {}
      audioCtxRef.current = null
    }
  }, [supabase, playPing, notifySound, notifyVibrate])

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 bg-black/95 backdrop-blur-lg border-t border-white/5"
      style={{
        paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 16px)',
        minHeight: '70px'
      }}
    >
      <div className="flex items-center justify-around h-14 max-w-screen-xl mx-auto px-4">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={item.action}
            className={`relative flex flex-col items-center justify-center gap-0.5 flex-1 h-full transition-colors ${
              activeTab === item.id
                ? 'text-cyan-400'
                : 'text-white/50 hover:text-white/70'
            }`}
          >
            <div className="relative text-xl">{item.icon}</div>
            <span className="text-[9px] font-medium">{item.label}</span>
            {item.id === 'messages' && unreadCount > 0 && (
              <span className="absolute top-1 right-1/4 bg-red-500 text-white text-[9px] font-bold leading-none rounded-full min-w-[16px] h-4 px-1 flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
        ))}
      </div>
    </nav>
  )
}
