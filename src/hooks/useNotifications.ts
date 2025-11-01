'use client'

import { useEffect, useState } from 'react'

export function useNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>('default')
  const [isSupported, setIsSupported] = useState(false)
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null)

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
      } catch (error) {
        console.error('❌ Service Worker registration failed:', error)
      }
    }

    registerSW()
  }, [isSupported])

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
          badge: '/badge-72.png',
          ...options
        })
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
  }

  return {
    isSupported,
    permission,
    requestPermission,
    showNotification,
    showMessageNotification
  }
}
