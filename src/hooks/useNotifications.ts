'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export function useNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>('default')
  const [isSupported, setIsSupported] = useState(false)
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null)
  const [subscription, setSubscription] = useState<PushSubscription | null>(null)
  const supabase = createClient()

  useEffect(() => {
    // Check if notifications are supported
    if ('Notification' in window && 'serviceWorker' in navigator) {
      setIsSupported(true)
      setPermission(Notification.permission)
    }
  }, [])

  // Register service worker
  useEffect(() => {
    if (!isSupported) return

    const registerSW = async () => {
      try {
        const reg = await navigator.serviceWorker.register('/sw.js', {
          scope: '/'
        })
        console.log('✅ Service Worker registered:', reg)
        setRegistration(reg)

        // Request notification permission immediately
        if (Notification.permission === 'default') {
          const result = await Notification.requestPermission()
          setPermission(result)
          console.log('🔔 Notification permission:', result)
        }

        // Subscribe to push notifications if permission granted
        if (Notification.permission === 'granted') {
          await subscribeToPush(reg)
        }
      } catch (error) {
        console.error('❌ Service Worker registration failed:', error)
      }
    }

    registerSW()
  }, [isSupported])

  // Subscribe to push notifications
  const subscribeToPush = async (reg: ServiceWorkerRegistration) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Get VAPID public key from backend
      const backendUrl = process.env.NEXT_PUBLIC_DEV_BACKEND_URL || process.env.NEXT_PUBLIC_BACKEND_URL
      const response = await fetch(`${backendUrl}/api/push/vapid-public-key`)
      const { publicKey } = await response.json()

      // Subscribe to push
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey)
      })

      setSubscription(sub)

      // Save subscription to backend
      const subJson = sub.toJSON()
      await fetch(`${backendUrl}/api/push/subscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          subscription: subJson
        })
      })

      console.log('✅ Push subscription saved')
    } catch (error) {
      console.error('❌ Push subscription failed:', error)
    }
  }

  // Helper function to convert VAPID key
  const urlBase64ToUint8Array = (base64String: string) => {
    const padding = '='.repeat((4 - base64String.length % 4) % 4)
    const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/')
    const rawData = window.atob(base64)
    const outputArray = new Uint8Array(rawData.length)
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i)
    }
    return outputArray
  }

  // Request permission function
  const requestPermission = async () => {
    if (!isSupported) {
      console.warn('Notifications not supported')
      return false
    }

    try {
      const result = await Notification.requestPermission()
      setPermission(result)
      return result === 'granted'
    } catch (error) {
      console.error('Error requesting notification permission:', error)
      return false
    }
  }

  // Show notification function
  const showNotification = async (title: string, options?: NotificationOptions) => {
    if (!isSupported || permission !== 'granted') {
      console.warn('Cannot show notification - permission not granted')
      return
    }

    try {
      if (registration) {
        // Use service worker to show notification (works even when tab is closed)
        await registration.showNotification(title, {
          icon: '/icon-192.png',
          badge: '/icon-96.png', // Use existing icon for badge
          ...options
        } as NotificationOptions)
      } else {
        // Fallback to regular notification
        new Notification(title, {
          icon: '/icon-192.png',
          ...options
        })
      }
    } catch (error) {
      console.error('Error showing notification:', error)
    }
  }

  // Show message notification
  const showMessageNotification = (senderName: string, message: string, conversationId: string) => {
    showNotification(`New message from ${senderName}`, {
      body: message,
      tag: `message-${conversationId}`,
      data: {
        url: `/messages/${conversationId}`,
        conversationId
      },
      requireInteraction: false
    })
    // Haptic feedback on supported devices
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      try { (navigator as any).vibrate([80, 40, 80]) } catch {}
    }
  }

  // Debug function to test notifications
  const debugNotifications = async () => {
    console.log('1. Checking support...')
    
    if (!('Notification' in window)) {
      console.error('Browser doesn\'t support notifications')
      return
    }
    
    console.log('2. Current permission:', Notification.permission)
    
    console.log('3. Requesting permission...')
    const permission = await Notification.requestPermission()
    console.log('4. Permission result:', permission)
    
    if (permission === 'granted') {
      console.log('5. Sending test notification...')
      
      // Vibrate if supported (do this before notification)
      if (typeof window !== 'undefined' && 'vibrate' in navigator) {
        try {
          (navigator as any).vibrate([200, 100, 200])
        } catch (e) {
          console.log('Vibration not supported')
        }
      }
      
      // Try to use service worker notification first
      if (registration) {
        try {
          await registration.showNotification('SLTR Test 🔥', {
            body: 'If you see this, notifications work!',
            icon: '/icon-192.png',
            badge: '/icon-96.png',
            tag: 'test-notification'
          })
          console.log('✅ Service Worker notification sent')
        } catch (error) {
          console.error('Service Worker notification failed, trying regular notification:', error)
          // Fallback to regular notification
          const notification = new Notification('SLTR Test 🔥', {
            body: 'If you see this, notifications work!',
            icon: '/icon-192.png'
          })
        }
      } else {
        // Fallback to regular notification if no service worker
        const notification = new Notification('SLTR Test 🔥', {
          body: 'If you see this, notifications work!',
          icon: '/icon-192.png'
        })
      }
      
      // Try to play sound
      try {
        const audio = new Audio('/sounds/sltr-notification.mp3')
        await audio.play()
        console.log('6. Sound played successfully')
      } catch (e) {
        console.error('6. Sound failed:', e)
        console.log('💡 User needs to interact with page first for audio')
      }
    } else {
      console.warn('Permission denied. User must grant notification permission.')
    }
  }

  return {
    isSupported,
    permission,
    requestPermission,
    showNotification,
    showMessageNotification,
    debugNotifications
  }
}
