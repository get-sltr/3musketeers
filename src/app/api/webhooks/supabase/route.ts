import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY

const supabase = supabaseUrl && supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null

export async function POST(request: NextRequest) {
  try {
    if (!supabase) {
      console.error('Supabase service key is not configured')
      return NextResponse.json(
        { error: 'Supabase service unavailable' },
        { status: 503 }
      )
    }

    const body = await request.json()
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

