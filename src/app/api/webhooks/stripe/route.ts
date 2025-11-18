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

  const supabase = await createClient()

  // Handle payment completion
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    const userId = session.metadata?.userId
    const tier = session.metadata?.tier

    if (!userId || !tier) {
      console.error('Missing userId or tier in session metadata')
      return new Response('Missing metadata', { status: 400 })
    }

    // Update user to premium status
    const { error } = await supabase
      .from('profiles')
      .update({ 
        subscription_tier: tier,
        subscription_status: 'active',
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)

    if (error) {
      console.error('Error updating subscription status:', error)
      return new Response('Database update failed', { status: 500 })
    }

    console.log(`✅ User ${userId} upgraded to ${tier}`)
  }

  // Handle subscription updates
  if (event.type === 'customer.subscription.updated') {
    const subscription = event.data.object as Stripe.Subscription
    const userId = subscription.metadata?.userId

    if (userId) {
      const status = subscription.status === 'active' ? 'active' : 'inactive'
      await supabase
        .from('profiles')
        .update({ 
          subscription_status: status,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)

      console.log(`✅ Subscription ${subscription.id} updated to ${status}`)
    }
  }

  // Handle subscription deletion/cancellation
  if (event.type === 'customer.subscription.deleted') {
    const subscription = event.data.object as Stripe.Subscription
    const userId = subscription.metadata?.userId

    if (userId) {
      await supabase
        .from('profiles')
        .update({ 
          subscription_status: 'canceled',
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)

      console.log(`✅ Subscription ${subscription.id} canceled`)
    }
  }

  // Handle identity verification
  if (event.type === 'identity.verification_session.verified') {
    const session = event.data.object as Stripe.Identity.VerificationSession
    const userId = session.metadata.user_id

    if (!userId) {
      console.error('No user_id in verification session metadata')
      return new Response('Missing user_id', { status: 400 })
    }

    const { error } = await supabase
      .from('profiles')
      .update({ verification_status: 'verified_biometric' })
      .eq('id', userId)

    if (error) {
      console.error('Error updating verification status:', error)
      return new Response('Database update failed', { status: 500 })
    }

    console.log(`✅ User ${userId} verified successfully`)
  }

  return new Response('OK', { status: 200 })
}
