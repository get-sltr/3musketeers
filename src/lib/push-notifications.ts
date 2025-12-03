/**
 * Push Notification Service
 * Sends push notifications via the backend service
 */

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || process.env.NEXT_PUBLIC_DEV_BACKEND_URL || 'https://sltr-backend.railway.app'

interface NotificationPayload {
  userId: string
  title: string
  body: string
  tag?: string
  url?: string
  data?: Record<string, any>
}

/**
 * Send a push notification to a user
 */
export async function sendPushNotification(payload: NotificationPayload): Promise<boolean> {
  try {
    const response = await fetch(`${BACKEND_URL}/api/push/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
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

/**
 * Send a tap notification
 */
export async function sendTapNotification(
  tappedUserId: string,
  tapperName: string,
  isMutual: boolean = false
): Promise<boolean> {
  const title = isMutual ? 'It\'s a Match! 🎉' : 'Someone tapped you! 👋'
  const body = isMutual
    ? `You and ${tapperName} both tapped each other!`
    : `${tapperName} is interested in you`

  return sendPushNotification({
    userId: tappedUserId,
    title,
    body,
    tag: isMutual ? 'mutual-tap' : 'new-tap',
    url: isMutual ? '/matches' : '/taps',
    data: { type: isMutual ? 'mutual_match' : 'new_tap' }
  })
}

/**
 * Send a new message notification
 */
export async function sendMessageNotification(
  receiverId: string,
  senderName: string,
  messagePreview: string,
  conversationId: string
): Promise<boolean> {
  return sendPushNotification({
    userId: receiverId,
    title: `New message from ${senderName}`,
    body: messagePreview.length > 100 ? messagePreview.substring(0, 100) + '...' : messagePreview,
    tag: `message-${conversationId}`,
    url: `/messages/${conversationId}`,
    data: { type: 'new_message', conversationId }
  })
}
