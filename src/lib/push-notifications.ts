/**
 * Push Notification Service
 * Sends push notifications via the backend service
 */

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || process.env.NEXT_PUBLIC_DEV_BACKEND_URL || 'https://sltr-backend.railway.app'

interface NotificationPayload {
  title: string
  body: string
  tag?: string
  url?: string
  data?: Record<string, any>
}

/**
 * Send a push notification to the authenticated user's devices
 * Requires a valid authentication token
 */
export async function sendPushNotification(
  payload: NotificationPayload,
  authToken: string
): Promise<boolean> {
  try {
    if (!authToken) {
      console.error('Push notification failed: authentication token required')
      return false
    }

    const response = await fetch(`${BACKEND_URL}/api/push/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify(payload)
    })

    if (!response.ok) {
      console.error('Push notification failed:', await response.text())
      return false
    }

    return true
  } catch (error) {
    console.error('Push notification error:', error)
    return false
  }
}

// Note: Notifications to other users (tap notifications, message notifications)
// should be triggered server-side in socket.io handlers or webhooks using
// webpush directly, not through the client-side /api/push/send endpoint.
