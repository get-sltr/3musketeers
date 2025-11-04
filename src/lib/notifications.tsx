'use client'

import { useState, useEffect } from 'react'
import { useNotifications } from '@/hooks/useNotifications'

export function NotificationSettings() {
  const { isSupported, permission, requestPermission, debugNotifications } = useNotifications()
  const [notifySound, setNotifySound] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true
    try {
      return (localStorage.getItem('sltr_notify_sound') ?? '1') === '1'
    } catch {
      return true
    }
  })
  const [notifyVibrate, setNotifyVibrate] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true
    try {
      return (localStorage.getItem('sltr_notify_vibrate') ?? '1') === '1'
    } catch {
      return true
    }
  })
  const [notifyMessages, setNotifyMessages] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true
    try {
      return (localStorage.getItem('sltr_notify_messages') ?? '1') === '1'
    } catch {
      return true
    }
  })
  const [notifyMatches, setNotifyMatches] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true
    try {
      return (localStorage.getItem('sltr_notify_matches') ?? '1') === '1'
    } catch {
      return true
    }
  })

  // Save preferences to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('sltr_notify_sound', notifySound ? '1' : '0')
      localStorage.setItem('sltr_notify_vibrate', notifyVibrate ? '1' : '0')
      localStorage.setItem('sltr_notify_messages', notifyMessages ? '1' : '0')
      localStorage.setItem('sltr_notify_matches', notifyMatches ? '1' : '0')
      window.dispatchEvent(new Event('sltr_settings_changed'))
    } catch (error) {
      console.error('Failed to save notification preferences:', error)
    }
  }, [notifySound, notifyVibrate, notifyMessages, notifyMatches])

  const handleRequestPermission = async () => {
    const granted = await requestPermission()
    if (granted) {
      // Show success message or notification
      console.log('✅ Notification permission granted')
    }
  }

  if (!isSupported) {
    return (
      <div className="bg-black/40 backdrop-blur-xl border border-red-500/20 p-6 rounded-xl">
        <div className="flex items-center gap-3 mb-2">
          <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <h3 className="text-xl font-bold text-white">Notifications Not Supported</h3>
        </div>
        <p className="text-white/60">
          Your browser doesn't support notifications. Please use a modern browser like Chrome, Firefox, or Safari.
        </p>
      </div>
    )
  }

  return (
    <div className="bg-black/40 backdrop-blur-xl border border-cyan-500/20 p-6 rounded-xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-bold text-white mb-1">Notification Settings</h3>
          <p className="text-white/60 text-sm">Control how you receive notifications</p>
        </div>
        <div className="flex items-center gap-2">
          {permission === 'granted' ? (
            <span className="px-3 py-1 bg-green-500/20 text-green-400 text-xs font-semibold rounded-full border border-green-500/30">
              Enabled
            </span>
          ) : permission === 'denied' ? (
            <span className="px-3 py-1 bg-red-500/20 text-red-400 text-xs font-semibold rounded-full border border-red-500/30">
              Blocked
            </span>
          ) : (
            <span className="px-3 py-1 bg-yellow-500/20 text-yellow-400 text-xs font-semibold rounded-full border border-yellow-500/30">
              Not Set
            </span>
          )}
        </div>
      </div>

      {/* Permission Status */}
      {permission !== 'granted' && (
        <div className="mb-6 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white font-semibold mb-1">Enable Notifications</p>
              <p className="text-white/60 text-sm">
                {permission === 'denied'
                  ? 'Notifications are blocked. Please enable them in your browser settings.'
                  : 'Click the button below to enable browser notifications.'}
              </p>
            </div>
            {permission !== 'denied' && (
              <button
                onClick={handleRequestPermission}
                className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-purple-500 text-white font-semibold rounded-lg hover:scale-105 transition-all duration-300"
              >
                Enable
              </button>
            )}
          </div>
        </div>
      )}

      {/* Notification Preferences */}
      <div className="space-y-4">
        {/* Sound */}
        <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg hover:bg-white/10 transition-all">
          <div className="flex items-center gap-3">
            <svg className="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15.536a5 5 0 001.414 1.414m-1.414-8.486a5 5 0 011.414-1.414" />
            </svg>
            <div>
              <p className="text-white font-semibold">Sound</p>
              <p className="text-white/60 text-xs">Play sound when notifications arrive</p>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={notifySound}
              onChange={(e) => setNotifySound(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-white/20 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-cyan-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-cyan-500 peer-checked:to-purple-500"></div>
          </label>
        </div>

        {/* Vibration */}
        <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg hover:bg-white/10 transition-all">
          <div className="flex items-center gap-3">
            <svg className="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
            <div>
              <p className="text-white font-semibold">Vibration</p>
              <p className="text-white/60 text-xs">Vibrate device when notifications arrive</p>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={notifyVibrate}
              onChange={(e) => setNotifyVibrate(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-white/20 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-cyan-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-cyan-500 peer-checked:to-purple-500"></div>
          </label>
        </div>

        {/* Messages */}
        <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg hover:bg-white/10 transition-all">
          <div className="flex items-center gap-3">
            <svg className="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <div>
              <p className="text-white font-semibold">Messages</p>
              <p className="text-white/60 text-xs">Notify me about new messages</p>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={notifyMessages}
              onChange={(e) => setNotifyMessages(e.target.checked)}
              className="sr-only peer"
              disabled={permission !== 'granted'}
            />
            <div className={`w-11 h-6 bg-white/20 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-cyan-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-cyan-500 peer-checked:to-purple-500 ${permission !== 'granted' ? 'opacity-50 cursor-not-allowed' : ''}`}></div>
          </label>
        </div>

        {/* Matches */}
        <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg hover:bg-white/10 transition-all">
          <div className="flex items-center gap-3">
            <svg className="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
            <div>
              <p className="text-white font-semibold">Matches</p>
              <p className="text-white/60 text-xs">Notify me about new matches</p>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={notifyMatches}
              onChange={(e) => setNotifyMatches(e.target.checked)}
              className="sr-only peer"
              disabled={permission !== 'granted'}
            />
            <div className={`w-11 h-6 bg-white/20 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-cyan-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-cyan-500 peer-checked:to-purple-500 ${permission !== 'granted' ? 'opacity-50 cursor-not-allowed' : ''}`}></div>
          </label>
        </div>
      </div>

      {/* Test Button */}
      {permission === 'granted' && (
        <div className="mt-6 pt-6 border-t border-white/10">
          <button
            onClick={debugNotifications}
            className="w-full px-4 py-3 bg-gradient-to-r from-cyan-500 to-purple-500 text-white font-semibold rounded-lg hover:scale-105 transition-all duration-300 flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            Test Notifications
          </button>
        </div>
      )}
    </div>
  )
}

