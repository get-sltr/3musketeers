import { createClient } from '@/lib/supabase/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-10-29.clover',
})

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

export async function POST(request: Request) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')

  if (!signature) {
    return new Response('No signature provided', { status: 400 })
  }

  // Verify webhook signature
  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message)
    return new Response(`Webhook Error: ${err.message}`, { status: 400 })
  }

  // Check the event type
  if (event.type === 'identity.verification_session.verified') {
    const session = event.data.object as Stripe.Identity.VerificationSession
    const userId = session.metadata.user_id

    if (!userId) {
      console.error('No user_id in verification session metadata')
      return new Response('Missing user_id', { status: 400 })
    }

    // Update your database to give them the badge
    const supabase = await createClient() // Use the server client (has admin access)
    const { error } = await supabase
      .from('profiles')
      .update({ verification_status: 'verified_biometric' })
      .eq('id', userId)

    if (error) {
      console.error('Error updating verification status:', error)
      return new Response('Database update failed', { status: 500 })
    }

    // TODO: Send the user a push notification: "You're verified!"
    console.log(`✅ User ${userId} verified successfully`)
  }

  return new Response('OK', { status: 200 })
}
