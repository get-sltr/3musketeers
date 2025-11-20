'use client'

import { useState, useEffect, useRef, useTransition } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useLocale } from 'next-intl'
import { createClient } from '@/lib/supabase/client'
import { locales, localeNames, type Locale } from '@/i18n/config'
import SltrButton from './SltrButton'

interface UserMenuProps {
  className?: string
}

export default function UserMenu({ className = '' }: UserMenuProps) {
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showLanguageMenu, setShowLanguageMenu] = useState(false)
  const userMenuRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const pathname = usePathname()
  const locale = useLocale()
  const [isPending, startTransition] = useTransition()

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  const handleLanguageChange = async (newLocale: Locale) => {
    startTransition(async () => {
      // Save locale to cookie
      document.cookie = `NEXT_LOCALE=${newLocale}; path=/; max-age=31536000`

      // Save preference to localStorage
      try {
        localStorage.setItem('sltr_preferred_language', newLocale)
      } catch {}

      // Save to Supabase profile
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          await supabase
            .from('profiles')
            .update({ preferred_language: newLocale })
            .eq('id', user.id)
        }
      } catch (error) {
        console.error('Failed to save language preference:', error)
      }

      setShowLanguageMenu(false)
      setShowUserMenu(false)

      // Reload page to apply new locale
      window.location.reload()
    })
  }

  // Notification preferences (localStorage)
  const [notifySound, setNotifySound] = useState<boolean>(() => {
    try { return (localStorage.getItem('sltr_notify_sound') ?? '1') === '1' } catch { return true }
  })
  const [notifyVibrate, setNotifyVibrate] = useState<boolean>(() => {
    try { return (localStorage.getItem('sltr_notify_vibrate') ?? '1') === '1' } catch { return true }
  })

  useEffect(() => {
    try {
      localStorage.setItem('sltr_notify_sound', notifySound ? '1' : '0')
      localStorage.setItem('sltr_notify_vibrate', notifyVibrate ? '1' : '0')
      window.dispatchEvent(new Event('sltr_settings_changed'))
    } catch {}
  }, [notifySound, notifyVibrate])

  const menuItems = [
    {
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
      text: 'Profile Settings',
      onClick: () => {
        router.push('/profile')
        setShowUserMenu(false)
      }
    },
    {
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      ),
      text: 'Messages',
      onClick: () => {
        router.push('/messages')
        setShowUserMenu(false)
      }
    },
    {
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
        </svg>
      ),
      text: 'Blocked Users',
      onClick: () => {
        router.push('/blocked-users')
        setShowUserMenu(false)
      }
    },
    {
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      text: 'Guidelines',
      onClick: () => {
        router.push('/guidelines')
        setShowUserMenu(false)
      }
    },
    {
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
        </svg>
      ),
      text: 'Legal & Policies',
      onClick: () => {
        router.push('/legal')
        setShowUserMenu(false)
      }
    },
  ]

  return (
    <div className={`relative ${className}`} ref={userMenuRef}>
      {/* SLTR Logo Button */}
      <button
        onClick={() => setShowUserMenu(!showUserMenu)}
        className="flex items-center gap-2 hover:scale-105 transition-all duration-300 cursor-pointer"
      >
        {/* Dot Grid */}
        <svg width="32" height="32" viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
          {[0, 1, 2, 3].map((row) =>
            [0, 1, 2, 3].map((col) => {
              const x = 15 + col * 20;
              const y = 15 + row * 20;
              const isMiddle = (row === 1 || row === 2) && (col === 1 || col === 2);
              const radius = isMiddle ? 8 : 5;
              return (
                <circle
                  key={`${row}-${col}`}
                  cx={x}
                  cy={y}
                  r={radius}
                  fill="#ccff00"
                />
              );
            })
          )}
        </svg>
        {/* Text */}
        <span 
          className="text-2xl font-black tracking-[0.3em] text-lime-400"
          style={{
            filter: 'drop-shadow(0 0 8px rgba(204, 255, 0, 0.6))'
          }}
        >
          sltr
        </span>
      </button>

      {/* Drawer Overlay */}
      {showUserMenu && (
        <div className="fixed inset-0 z-[9998]" aria-hidden>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowUserMenu(false)} />
        </div>
      )}

      {/* Slide-out Drawer (mid-screen) */}
      <div
        className={`fixed left-0 top-1/2 -translate-y-1/2 z-[9999] w-[280px] sm:w-[320px] bg-black/85 border border-white/15 rounded-r-2xl shadow-2xl backdrop-blur-xl transition-transform duration-300 ${
          showUserMenu ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
          <span className="text-white font-bold tracking-widest">SLTR</span>
          <button onClick={() => setShowUserMenu(false)} className="text-white/70 hover:text-white">✕</button>
        </div>

        {/* sltr∝ Button */}
        <div className="px-4 py-3 border-b border-white/10">
          <SltrButton size="sm" fullWidth />
        </div>

        {/* Quick Settings */}
        <div className="px-4 py-3 border-b border-white/10">
          <div className="flex items-center justify-between text-white text-sm mb-2">
            <span>Sound alerts</span>
            <label className="inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only" checked={notifySound} onChange={(e) => setNotifySound(e.target.checked)} />
              <span className="w-10 h-5 bg-white/20 rounded-full relative">
                <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full transition-all ${notifySound ? 'translate-x-5 bg-lime-400' : 'bg-white'}`}></span>
              </span>
            </label>
          </div>
          <div className="flex items-center justify-between text-white text-sm mb-2">
            <span>Vibration</span>
            <label className="inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only" checked={notifyVibrate} onChange={(e) => setNotifyVibrate(e.target.checked)} />
              <span className="w-10 h-5 bg-white/20 rounded-full relative">
                <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full transition-all ${notifyVibrate ? 'translate-x-5 bg-lime-400' : 'bg-white'}`}></span>
              </span>
            </label>
          </div>
          <div className="mt-2">
            <button
              onClick={() => setShowLanguageMenu(!showLanguageMenu)}
              className="flex items-center justify-between text-white text-sm w-full"
              disabled={isPending}
            >
              <span>Language</span>
              <span className="flex items-center gap-1 text-lime-400">
                {localeNames[locale as Locale]}
                <svg className={`w-4 h-4 transition-transform ${showLanguageMenu ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </span>
            </button>
            {showLanguageMenu && (
              <div className="mt-2 w-full bg-black/80 border border-white/15 rounded-xl overflow-hidden">
                {locales.map((loc) => (
                  <button
                    key={loc}
                    onClick={() => handleLanguageChange(loc)}
                    className={`w-full px-3 py-2 text-left text-sm transition-all duration-300 ${
                      locale === loc
                        ? 'bg-lime-400/20 text-lime-400'
                        : 'text-white hover:bg-white/10'
                    }`}
                    disabled={isPending}
                  >
                    {localeNames[loc]}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Nav Items */}
        <div className="py-2">
          {menuItems.map((item, index) => (
            <button
              key={index}
              onClick={() => { item.onClick(); setShowUserMenu(false) }}
              className="w-full px-4 py-3 text-left text-white/90 hover:bg-white/10 transition-all duration-300 flex items-center gap-3"
            >
              {item.icon}
              {item.text}
            </button>
          ))}
        </div>

        <div className="border-t border-white/10" />
        <button
          onClick={handleLogout}
          className="w-full px-4 py-3 text-left text-red-400 hover:bg-red-500/10 transition-all duration-300 flex items-center gap-3"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Logout
        </button>
      </div>
    </div>
  )
}
