/**
 * Push notification helper functions for frontend use
 * These functions send push notifications to users via the /api/push/send endpoint
 */

interface NotificationOptions {
  url?: string
  tag?: string
  data?: Record<string, unknown>
}

/**
 * Send a generic push notification to a user
 */
export async function sendPushNotification(
  userId: string,
  title: string,
  body: string,
  options: NotificationOptions = {}
): Promise<boolean> {
  try {
    const response = await fetch('/api/push/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_id: userId,
        payload: {
          title,
          body,
          url: options.url || '/',
          tag: options.tag || 'sltr-notification',
          data: options.data
        }
      })
    })

    if (!response.ok) {
      console.error('Failed to send push notification:', await response.text())
      return false
    }

    return true
  } catch (error) {
    console.error('Error sending push notification:', error)
    return false
  }
}

/**
 * Send a tap notification to a user
 * Called when someone taps the user
 */
export async function sendTapNotification(
  recipientUserId: string,
  senderName: string,
  isMutual: boolean = false
): Promise<boolean> {
  const title = isMutual ? "It's a Match! 💘" : "Someone tapped you! 👀"
  const body = isMutual 
    ? `You and ${senderName} both tapped each other!`
    : `${senderName} just tapped you`
  
  return sendPushNotification(
    recipientUserId,
    title,
    body,
    {
      url: '/taps',
      tag: isMutual ? 'mutual-match' : 'tap-notification',
      data: {
        type: isMutual ? 'mutual_match' : 'tap',
        sender_name: senderName
      }
    }
  )
}

/**
 * Send a message notification to a user
 * Called when someone sends them a new message
 */
export async function sendMessageNotification(
  recipientUserId: string,
  senderName: string,
  messagePreview: string,
  conversationId: string
): Promise<boolean> {
  // Truncate message preview
  const preview = messagePreview.length > 50 
    ? messagePreview.substring(0, 47) + '...'
    : messagePreview

  return sendPushNotification(
    recipientUserId,
    `New message from ${senderName}`,
    preview,
    {
      url: `/messages/${conversationId}`,
      tag: `message-${conversationId}`,
      data: {
        type: 'message',
        conversation_id: conversationId,
        sender_name: senderName
      }
    }
  )
}

/**
 * Send a match notification (when EROS finds a match)
 */
export async function sendMatchNotification(
  recipientUserId: string,
  matchName: string,
  matchScore: number
): Promise<boolean> {
  return sendPushNotification(
    recipientUserId,
    'EROS found a match! 🔥',
    `${matchName} is ${matchScore}% compatible with you`,
    {
      url: '/',
      tag: 'eros-match',
      data: {
        type: 'eros_match',
        match_name: matchName,
        match_score: matchScore
      }
    }
  )
}
