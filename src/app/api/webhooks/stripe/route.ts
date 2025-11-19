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

  // Handle payment completion (NEW subscription or one-time payment)
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    const userId = session.metadata?.userId
    const tier = session.metadata?.tier || 'plus'

    if (!userId) {
      console.error('Missing userId in session metadata')
      return new Response('Missing metadata', { status: 400 })
    }

    // Calculate expiry date (30 days from now for monthly subscription)
    const expiryDate = new Date()
    expiryDate.setDate(expiryDate.getDate() + 30)

    // ✅ TURN ON THE SWITCH - User now has sltr∝
    const { error } = await supabase
      .from('profiles')
      .update({
        subscription_tier: tier,
        subscription_status: 'active',
        subscription_expires_at: expiryDate.toISOString(),
        premium: true, // Backward compatibility
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)

    if (error) {
      console.error('Error updating subscription status:', error)
      return new Response('Database update failed', { status: 500 })
    }

    console.log(`✅ User ${userId} upgraded to ${tier} - expires ${expiryDate.toISOString()}`)
  }

  // Handle subscription updates (AUTO-RENEW happens here!)
  if (event.type === 'customer.subscription.updated') {
    const subscription = event.data.object as any // Stripe types don't expose all fields
    const userId = subscription.metadata?.userId

    if (userId) {
      const isActive = subscription.status === 'active'

      // Calculate new expiry date from subscription period end
      const expiryDate = new Date(subscription.current_period_end * 1000)

      // ✅ UPDATE THE SWITCH - Auto-renew or status change
      await supabase
        .from('profiles')
        .update({
          subscription_status: isActive ? 'active' : 'inactive',
          subscription_tier: isActive ? 'plus' : 'free',
          subscription_expires_at: isActive ? expiryDate.toISOString() : null,
          premium: isActive,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)

      console.log(`✅ Subscription ${subscription.id} ${isActive ? 'renewed' : 'deactivated'} - expires ${expiryDate.toISOString()}`)
    }
  }

  // Handle subscription deletion/cancellation (USER CANCELS)
  if (event.type === 'customer.subscription.deleted') {
    const subscription = event.data.object as any
    const userId = subscription.metadata?.userId

    if (userId) {
      // ❌ TURN OFF THE SWITCH - User canceled, back to free
      await supabase
        .from('profiles')
        .update({
          subscription_status: 'canceled',
          subscription_tier: 'free',
          subscription_expires_at: null,
          premium: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)

      console.log(`❌ Subscription ${subscription.id} canceled - user downgraded to free`)
    }
  }

  // Handle payment failures (CARD DECLINED)
  if (event.type === 'invoice.payment_failed') {
    const invoice = event.data.object as any
    const subscription = invoice.subscription
    const userId = invoice.subscription_details?.metadata?.userId

    if (userId) {
      // ❌ TURN OFF THE SWITCH - Payment failed, downgrade immediately
      await supabase
        .from('profiles')
        .update({
          subscription_status: 'past_due',
          subscription_tier: 'free',
          subscription_expires_at: null,
          premium: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)

      console.log(`❌ Payment failed for user ${userId} - downgraded to free`)
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
