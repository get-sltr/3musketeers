import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const stripeSecretKey = process.env.STRIPE_SECRET_KEY
const stripe = stripeSecretKey
  ? new Stripe(stripeSecretKey, {
      apiVersion: '2025-10-29.clover'
})
  : null

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

export async function POST(request: NextRequest) {
  if (!stripe || !webhookSecret) {
    console.error('Stripe webhook secrets are not configured')
    return NextResponse.json(
      { error: 'Stripe webhook configuration missing' },
      { status: 503 }
    )
  }

  const body = await request.text()
  const signature = request.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json(
      { error: 'Missing Stripe signature header' },
      { status: 400 }
    )
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch (err: any) {
    console.error('⚠️ Webhook signature verification failed:', err.message)
    return NextResponse.json(
      { error: `Webhook Error: ${err.message}` },
      { status: 400 }
    )
  }

  try {
    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const userId = session.metadata?.userId || session.client_reference_id
        
        if (!userId) {
          console.error('No userId found in session metadata')
          break
        }

        const priceType = session.metadata?.priceType

        if (priceType === 'founder') {
          // Grant founder status
          const { error } = await supabase
            .from('profiles')
            .update({ 
              founder: true,
              subscription_status: 'founder',
              founder_number: null, // Will be set by trigger/function
              updated_at: new Date().toISOString()
            })
            .eq('id', userId)

          if (error) {
            console.error('Error updating founder status:', error)
          } else {
            console.log(`✅ Granted founder status to user ${userId}`)
          }
        } else if (priceType === 'member') {
          // Grant member subscription
          const subscription = await stripe.subscriptions.retrieve(session.subscription as string)
          
          const { error } = await supabase
            .from('profiles')
            .update({ 
              subscription_status: 'active',
              stripe_subscription_id: subscription.id,
              stripe_customer_id: session.customer as string,
              subscription_start: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .eq('id', userId)

          if (error) {
            console.error('Error updating subscription status:', error)
          } else {
            console.log(`✅ Activated member subscription for user ${userId}`)
          }
        }
        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        
        // Update subscription status
        const { error } = await supabase
          .from('profiles')
          .update({
            subscription_status: subscription.status === 'active' ? 'active' : 'inactive',
            updated_at: new Date().toISOString()
          })
          .eq('stripe_subscription_id', subscription.id)

        if (error) {
          console.error('Error updating subscription:', error)
        }
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        
        // Remove subscription
        const { error } = await supabase
          .from('profiles')
          .update({
            subscription_status: 'inactive',
            stripe_subscription_id: null,
            updated_at: new Date().toISOString()
          })
          .eq('stripe_subscription_id', subscription.id)

        if (error) {
          console.error('Error removing subscription:', error)
        } else {
          console.log(`✅ Removed subscription for subscription ${subscription.id}`)
        }
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        
        // Get subscription ID from invoice
        // In newer Stripe API, we need to expand or use subscription_details
        const invoiceData = invoice as any
        const subscriptionId = invoiceData.subscription || invoiceData.subscription_details?.subscription || null
        
        if (!subscriptionId) {
          console.log('No subscription ID found in invoice')
          break
        }
        
        // Mark subscription as past due
        const { error } = await supabase
          .from('profiles')
          .update({
            subscription_status: 'past_due',
            updated_at: new Date().toISOString()
          })
          .eq('stripe_subscription_id', subscriptionId)

        if (error) {
          console.error('Error updating payment failed status:', error)
        }
        break
      }

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error: any) {
    console.error('Webhook handler error:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}



