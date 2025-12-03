import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createHmac, timingSafeEqual } from 'crypto'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY
const webhookSecret = process.env.SUPABASE_WEBHOOK_SECRET

const supabase = supabaseUrl && supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null

/**
 * Verify Supabase webhook signature to prevent spoofing attacks
 * https://supabase.com/docs/guides/database/webhooks#securing-your-webhooks
 */
function verifyWebhookSignature(
  payload: string,
  signature: string | null,
  secret: string
): boolean {
  if (!signature) {
    return false
  }

  try {
    // Supabase sends signature in format: t=timestamp,v1=signature
    const parts = signature.split(',')
    const timestamp = parts.find(p => p.startsWith('t='))?.split('=')[1]
    const sig = parts.find(p => p.startsWith('v1='))?.split('=')[1]

    if (!timestamp || !sig) {
      return false
    }

    // Verify timestamp is within 5 minutes to prevent replay attacks
    const now = Math.floor(Date.now() / 1000)
    const webhookTime = parseInt(timestamp, 10)
    if (Math.abs(now - webhookTime) > 300) {
      console.error('Webhook timestamp too old or in future')
      return false
    }

    // Compute expected signature
    const signedPayload = `${timestamp}.${payload}`
    const expectedSig = createHmac('sha256', secret)
      .update(signedPayload)
      .digest('hex')

    // Use timing-safe comparison to prevent timing attacks
    const expectedBuffer = Buffer.from(expectedSig)
    const actualBuffer = Buffer.from(sig)

    if (expectedBuffer.length !== actualBuffer.length) {
      return false
    }

    return timingSafeEqual(expectedBuffer, actualBuffer)
  } catch (error) {
    console.error('Error verifying webhook signature:', error)
    return false
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!supabase) {
      console.error('Supabase service key is not configured')
      return NextResponse.json(
        { error: 'Supabase service unavailable' },
        { status: 503 }
      )
    }

    if (!webhookSecret) {
      console.error('SUPABASE_WEBHOOK_SECRET is not configured')
      return NextResponse.json(
        { error: 'Webhook secret not configured' },
        { status: 503 }
      )
    }

    // Get raw body and signature
    const rawBody = await request.text()
    const signature = request.headers.get('x-supabase-signature')

    // Verify webhook signature to prevent spoofing
    if (!verifyWebhookSignature(rawBody, signature, webhookSecret)) {
      console.error('Invalid webhook signature - possible spoofing attempt')
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      )
    }

    // Parse body after verification
    const body = JSON.parse(rawBody)
    const { type, record } = body

    // Handle auth user creation/verification events
    if (type === 'INSERT' && record?.email_confirmed_at) {
      // User's email was just confirmed - send welcome email
      const { email, id, user_metadata } = record
      const username = user_metadata?.username || user_metadata?.display_name || 'there'

      try {
        // Send welcome email via Resend
        const response = await fetch(`${request.headers.get('origin') || 'https://getsltr.com'}/api/emails/welcome`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email,
            name: username,
            username,
          }),
        })

        if (!response.ok) {
          console.error('Failed to send welcome email:', await response.text())
        } else {
          console.log(`✅ Welcome email sent to ${email}`)
        }
      } catch (error) {
        console.error('Error sending welcome email:', error)
        // Don't fail the webhook if email fails
      }
    }

    return NextResponse.json({ received: true })
  } catch (error: any) {
    console.error('Supabase webhook error:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}

