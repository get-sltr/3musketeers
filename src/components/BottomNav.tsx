'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useRef, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useSocket } from '@/hooks/useSocket'

export default function BottomNav() {
  const pathname = usePathname()
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
      action: () => {
        if (pathname === '/app') {
          window.dispatchEvent(new CustomEvent('sltr_switch_to_map'))
        } else {
          router.push('/app')
          setTimeout(() => {
            window.dispatchEvent(new CustomEvent('sltr_switch_to_map'))
          }, 100)
        }
      },
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
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 backdrop-blur-2xl"
      style={{
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        background: 'linear-gradient(0deg, rgba(26, 10, 46, 0.98) 0%, rgba(10, 10, 15, 0.95) 50%, rgba(10, 10, 15, 0.92) 100%)',
        borderTop: '2px solid transparent',
        borderImage: 'linear-gradient(90deg, rgba(255, 0, 255, 0.4), rgba(0, 217, 255, 0.4), rgba(255, 0, 255, 0.4)) 1',
        boxShadow: '0 -4px 32px rgba(0, 0, 0, 0.7), 0 0 60px rgba(255, 0, 255, 0.2), 0 0 100px rgba(0, 217, 255, 0.1)'
      }}
    >
      <div className="flex items-center justify-around h-16 max-w-screen-xl mx-auto px-2">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={item.action}
            className={`relative flex flex-col items-center justify-center gap-1 flex-1 h-full transition-all ${
              activeTab === item.id
                ? 'text-cyan-400'
                : 'text-white/60 hover:text-white/80'
            }`}
          >
            <div className="relative text-2xl">{item.icon}</div>
            <span className="text-[10px] font-semibold tracking-tight">{item.label}</span>
            {item.id === 'messages' && unreadCount > 0 && (
              <>
                <span className="absolute top-2 right-1/4 inline-flex h-4 w-4 rounded-full bg-red-500 opacity-75 animate-ping" />
                <span className="absolute top-2 right-1/4 bg-red-500 text-white text-[9px] font-bold leading-none rounded-full min-w-[16px] h-4 px-1 flex items-center justify-center shadow-lg">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              </>
            )}
            {activeTab === item.id && (
              <div
                className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-1 rounded-t-full"
                style={{
                  background: 'linear-gradient(90deg, #00d9ff, #ff00ff)',
                  boxShadow: '0 0 16px rgba(255, 0, 255, 0.9), 0 0 8px rgba(0, 217, 255, 0.6)'
                }}
              />
            )}
          </button>
        ))}
      </div>
    </nav>
  )
}
