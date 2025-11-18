'use client'

import { useState, useEffect } from 'react'

export default function NotificationPrompt() {
  const [permission, setPermission] = useState<NotificationPermission>('default')
  const [showPrompt, setShowPrompt] = useState(false)

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPermission(Notification.permission)
      // Show prompt if not granted and user hasn't dismissed it
      const dismissed = localStorage.getItem('notification_prompt_dismissed')
      if (Notification.permission === 'default' && !dismissed) {
        setShowPrompt(true)
      }
    }
  }, [])

  const requestPermission = async () => {
    if ('Notification' in window) {
      try {
        const result = await Notification.requestPermission()
        setPermission(result)
        if (result === 'granted') {
          setShowPrompt(false)
          // Show success notification
          new Notification('SLTR Notifications Enabled! 🎉', {
            body: "You'll now receive messages and match notifications",
            icon: '/icon-192.png'
          })
        }
      } catch (error) {
        console.error('Error requesting notification permission:', error)
      }
    }
  }

  const dismissPrompt = () => {
    setShowPrompt(false)
    localStorage.setItem('notification_prompt_dismissed', 'true')
  }

  if (!showPrompt || permission === 'granted') return null

  return (
    <div className="fixed bottom-24 left-4 right-4 z-50 animate-slide-up">
      <div className="bg-black/95 backdrop-blur-xl rounded-2xl p-4 shadow-2xl border border-lime-400/30">
        <div className="flex items-start gap-3">
          <div className="text-3xl">🔔</div>
          <div className="flex-1">
            <h3 className="text-white font-bold text-lg mb-1">
              Enable Notifications?
            </h3>
            <p className="text-white/80 text-sm mb-3">
              Get notified when you receive messages, taps, and matches
            </p>
            <div className="flex gap-2">
              <button
                onClick={requestPermission}
                className="flex-1 bg-lime-400 text-black font-semibold px-4 py-2 rounded-lg hover:bg-lime-300 transition"
              >
                Enable
              </button>
              <button
                onClick={dismissPrompt}
                className="px-4 py-2 text-white/60 hover:text-white transition"
              >
                Not Now
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
