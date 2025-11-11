'use client'

import { useState, useEffect, useRef, useTransition } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useLocale } from 'next-intl'
import { createClient } from '@/lib/supabase/client'
import { locales, localeNames, type Locale } from '@/i18n/config'

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
    startTransition(() => {
      // Get current path without locale prefix
      const currentPath = pathname || '/'
      const pathWithoutLocale = currentPath.replace(`/${locale}`, '')

      // Navigate to new locale path
      const newPath = newLocale === 'en'
        ? pathWithoutLocale || '/'
        : `/${newLocale}${pathWithoutLocale || '/'}`

      router.push(newPath)
      setShowLanguageMenu(false)
      setShowUserMenu(false)
    })

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
    {
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      text: 'Member Services',
      onClick: () => {
        router.push('/pricing')
        setShowUserMenu(false)
      }
    }
  ]

  return (
    <div className={`relative ${className}`} ref={userMenuRef}>
      {/* SLTR Logo Button */}
      <button
        onClick={() => setShowUserMenu(!showUserMenu)}
        className="text-3xl font-black tracking-wider gradient-text hover:scale-105 transition-all duration-300 cursor-pointer"
        style={{
          background: 'linear-gradient(135deg, #00d4ff, #ff00ff)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          filter: 'drop-shadow(0 0 16px rgba(255, 0, 255, 0.9)) drop-shadow(0 0 32px rgba(0, 217, 255, 0.7)) drop-shadow(0 0 48px rgba(255, 0, 255, 0.5))',
          fontWeight: 900,
          letterSpacing: '0.15em'
        }}
      >
        SLTR
      </button>
      
      {/* User Menu Dropdown */}
      {showUserMenu && (
        <div className="absolute top-full left-0 mt-2 w-48 bg-black/60 backdrop-blur-2xl border border-white/20 rounded-xl overflow-hidden z-50 animate-fadeIn shadow-2xl">
          {/* Quick Settings */}
          <div className="px-4 py-3 border-b border-white/10">
            <div className="flex items-center justify-between text-white text-sm mb-2">
              <span>Sound alerts</span>
              <label className="inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only" checked={notifySound} onChange={(e) => setNotifySound(e.target.checked)} />
                <span className="w-10 h-5 bg-white/20 rounded-full relative">
                  <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full transition-all ${notifySound ? 'translate-x-5 bg-cyan-400' : 'bg-white'}`}></span>
                </span>
              </label>
            </div>
            <div className="flex items-center justify-between text-white text-sm mb-2">
              <span>Vibration</span>
              <label className="inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only" checked={notifyVibrate} onChange={(e) => setNotifyVibrate(e.target.checked)} />
                <span className="w-10 h-5 bg-white/20 rounded-full relative">
                  <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full transition-all ${notifyVibrate ? 'translate-x-5 bg-cyan-400' : 'bg-white'}`}></span>
                </span>
              </label>
            </div>
            <div className="relative">
              <button
                onClick={() => setShowLanguageMenu(!showLanguageMenu)}
                className="flex items-center justify-between text-white text-sm w-full"
                disabled={isPending}
              >
                <span>Language</span>
                <span className="flex items-center gap-1 text-cyan-400">
                  {localeNames[locale as Locale]}
                  <svg className={`w-4 h-4 transition-transform ${showLanguageMenu ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </span>
              </button>
              {showLanguageMenu && (
                <div className="absolute right-0 top-full mt-2 w-40 bg-black/80 backdrop-blur-2xl border border-white/20 rounded-xl overflow-hidden z-50 animate-fadeIn">
                  {locales.map((loc) => (
                    <button
                      key={loc}
                      onClick={() => handleLanguageChange(loc)}
                      className={`w-full px-3 py-2 text-left text-sm transition-all duration-300 ${
                        locale === loc
                          ? 'bg-cyan-500/20 text-cyan-400'
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

          {menuItems.map((item, index) => (
            <button
              key={index}
              onClick={item.onClick}
              className="w-full px-4 py-3 text-left text-white hover:bg-white/10 transition-all duration-300 flex items-center gap-3"
            >
              {item.icon}
              {item.text}
            </button>
          ))}
          
          <div className="border-t border-white/10"></div>
          
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
      )}

      {/* Custom Styles */}
      <style jsx>{`
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
        
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  )
}
